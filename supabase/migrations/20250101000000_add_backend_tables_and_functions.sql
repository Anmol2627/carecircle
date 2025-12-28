-- Migration: Add backend tables, functions, and RLS policies for SafeCircle
-- This migration adds: messages, incident_helpers, user_locations, badges, user_badges, check_in_timers
-- Also adds database functions and updates incidents table

-- ============================================================================
-- 1. UPDATE INCIDENTS TABLE TO INCLUDE 'escort' TYPE
-- ============================================================================
ALTER TABLE public.incidents 
DROP CONSTRAINT IF EXISTS incidents_type_check;

ALTER TABLE public.incidents
ADD CONSTRAINT incidents_type_check 
CHECK (type IN ('sos', 'silent', 'check-in', 'escort'));

-- ============================================================================
-- 2. CREATE MESSAGES TABLE (for real-time chat)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  type text DEFAULT 'text' CHECK (type IN ('text', 'location', 'image', 'alert')),
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ============================================================================
-- 3. CREATE INCIDENT_HELPERS TABLE (track who responds to incidents)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.incident_helpers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES public.incidents(id) ON DELETE CASCADE NOT NULL,
  helper_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  responded_at timestamp with time zone DEFAULT now(),
  arrived_at timestamp with time zone,
  status text DEFAULT 'responding' CHECK (status IN ('responding', 'arrived', 'completed')),
  UNIQUE(incident_id, helper_id)
);

-- Enable RLS
ALTER TABLE public.incident_helpers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for incident_helpers
CREATE POLICY "Victims can see helpers responding" ON public.incident_helpers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM incidents 
      WHERE incidents.id = incident_id 
      AND incidents.user_id = auth.uid()
    )
  );

CREATE POLICY "Helpers can see own responses" ON public.incident_helpers
  FOR SELECT USING (auth.uid() = helper_id);

CREATE POLICY "Authenticated users can respond to incidents" ON public.incident_helpers
  FOR INSERT WITH CHECK (auth.uid() = helper_id);

CREATE POLICY "Helpers can update own responses" ON public.incident_helpers
  FOR UPDATE USING (auth.uid() = helper_id);

-- Enable realtime for live helper updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.incident_helpers;

-- ============================================================================
-- 4. CREATE USER_LOCATIONS TABLE (for real-time location tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL UNIQUE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  is_sharing boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_locations
CREATE POLICY "Users can update own location" ON public.user_locations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Trusted contacts can see location when sharing" ON public.user_locations
  FOR SELECT USING (
    is_sharing = true AND
    EXISTS (
      SELECT 1 FROM trusted_circles
      WHERE trusted_circles.user_id = user_locations.user_id
        AND trusted_circles.trusted_user_id = auth.uid()
        AND trusted_circles.status = 'accepted'
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations;

-- ============================================================================
-- 5. CREATE BADGES TABLE (for gamification)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text NOT NULL,
  description text,
  tier text DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  points_required integer DEFAULT 0
);

-- Enable RLS (badges are public)
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges" ON public.badges
  FOR SELECT USING (true);

-- ============================================================================
-- 6. CREATE USER_BADGES TABLE (track user badge unlocks)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  unlocked_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view others' badges" ON public.user_badges
  FOR SELECT USING (true);

-- ============================================================================
-- 7. CREATE CHECK_IN_TIMERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.check_in_timers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  duration_minutes integer NOT NULL,
  started_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'checked_in', 'expired')),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.check_in_timers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own check-in timers" ON public.check_in_timers
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 8. DATABASE FUNCTIONS
-- ============================================================================

-- Function: Calculate distance between two coordinates (Haversine formula)
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 6371 * acos(
    cos(radians(lat1)) * cos(radians(lat2)) * 
    cos(radians(lng2) - radians(lng1)) + 
    sin(radians(lat1)) * sin(radians(lat2))
  )
$$;

-- Function: Find nearby helpers
CREATE OR REPLACE FUNCTION public.find_nearby_helpers(
  incident_lat double precision,
  incident_lng double precision,
  radius_km double precision DEFAULT 2
)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text,
  distance_km double precision
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ul.user_id,
    p.full_name,
    p.avatar_url,
    calculate_distance(incident_lat, incident_lng, ul.latitude, ul.longitude) as distance_km
  FROM user_locations ul
  JOIN profiles p ON p.user_id = ul.user_id
  WHERE ul.is_sharing = true
    AND calculate_distance(incident_lat, incident_lng, ul.latitude, ul.longitude) <= radius_km
  ORDER BY distance_km ASC
  LIMIT 10
$$;

-- Function: Award points and check level
CREATE OR REPLACE FUNCTION public.award_user_points(
  target_user_id uuid,
  points_to_add integer,
  reason text DEFAULT 'action'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_points integer;
  current_level integer;
  new_level integer;
  result jsonb;
BEGIN
  -- Get current stats
  SELECT COALESCE(points, 0), COALESCE(level, 1) INTO current_points, current_level
  FROM profiles WHERE user_id = target_user_id;

  -- Calculate new level (every 500 points = 1 level)
  new_level := GREATEST(1, ((current_points + points_to_add) / 500) + 1);

  -- Update profile
  UPDATE profiles 
  SET 
    points = COALESCE(points, 0) + points_to_add,
    level = new_level,
    updated_at = now()
  WHERE user_id = target_user_id;

  -- Return result
  result := jsonb_build_object(
    'points_awarded', points_to_add,
    'new_total', current_points + points_to_add,
    'level_up', new_level > current_level,
    'new_level', new_level
  );

  RETURN result;
END;
$$;

-- Function: Check and unlock badges based on points
CREATE OR REPLACE FUNCTION public.check_badge_unlocks(
  target_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_points integer;
  user_level integer;
  unlocked_badges jsonb := '[]'::jsonb;
  badge_record record;
BEGIN
  -- Get user stats
  SELECT COALESCE(points, 0), COALESCE(level, 1) INTO user_points, user_level
  FROM profiles WHERE user_id = target_user_id;

  -- Check all badges that user hasn't unlocked yet
  FOR badge_record IN 
    SELECT b.* FROM badges b
    WHERE b.points_required <= user_points
      AND NOT EXISTS (
        SELECT 1 FROM user_badges ub
        WHERE ub.user_id = target_user_id AND ub.badge_id = b.id
      )
  LOOP
    -- Unlock badge
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (target_user_id, badge_record.id)
    ON CONFLICT DO NOTHING;

    -- Add to result
    unlocked_badges := unlocked_badges || jsonb_build_object(
      'id', badge_record.id,
      'name', badge_record.name,
      'icon', badge_record.icon,
      'description', badge_record.description,
      'tier', badge_record.tier
    );
  END LOOP;

  RETURN jsonb_build_object(
    'unlocked_count', jsonb_array_length(unlocked_badges),
    'badges', unlocked_badges
  );
END;
$$;

-- ============================================================================
-- 9. UPDATE INCIDENTS RLS POLICIES (allow helpers to view active incidents)
-- ============================================================================
-- Add policy for helpers to see active incidents they can respond to
CREATE POLICY "Helpers can view active incidents" ON public.incidents
  FOR SELECT USING (
    status = 'active' OR 
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM incident_helpers
      WHERE incident_helpers.incident_id = incidents.id
      AND incident_helpers.helper_id = auth.uid()
    )
  );

-- ============================================================================
-- 10. INSERT BADGE DEFINITIONS
-- ============================================================================
INSERT INTO public.badges (name, icon, description, tier, points_required) VALUES
('First Responder', '🦸', 'Responded to your first emergency', 'bronze', 100),
('Guardian Angel', '👼', 'Helped 5 people in emergencies', 'silver', 500),
('Campus Hero', '🏆', 'Reached Level 10', 'gold', 5000),
('Night Owl', '🦉', 'Responded to 3 nighttime emergencies', 'silver', 300),
('Shield Master', '🛡️', 'Completed safety training', 'bronze', 0),
('Trusted Friend', '🤝', 'Added to 10 trusted circles', 'gold', 1500),
('Safety Legend', '⭐', 'Reached Level 25', 'platinum', 12500),
('Quick Response', '⚡', 'Responded in under 1 minute', 'silver', 200)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 11. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incident_helpers_incident ON public.incident_helpers(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_helpers_helper ON public.incident_helpers(helper_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_user ON public.user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_sharing ON public.user_locations(is_sharing) WHERE is_sharing = true;
CREATE INDEX IF NOT EXISTS idx_check_in_timers_user ON public.check_in_timers(user_id);
CREATE INDEX IF NOT EXISTS idx_check_in_timers_status ON public.check_in_timers(status);
CREATE INDEX IF NOT EXISTS idx_check_in_timers_expires ON public.check_in_timers(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_incidents_type ON public.incidents(type);


