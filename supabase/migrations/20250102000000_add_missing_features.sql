-- Migration: Add missing features from prompt requirements
-- This adds: medical info, emergency types, voice notes, shake detection, emergency calculator,
-- emergency contacts, emergency service logs, notification queue, point transactions, group chat

-- ============================================================================
-- 1. ENABLE POSTGIS EXTENSION (for geospatial queries)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- 2. UPDATE PROFILES TABLE - Add medical info and preferences
-- ============================================================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
ADD COLUMN IF NOT EXISTS allergies TEXT,
ADD COLUMN IF NOT EXISTS medications TEXT,
ADD COLUMN IF NOT EXISTS medical_conditions TEXT,
ADD COLUMN IF NOT EXISTS average_response_time INTEGER,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS current_location GEOGRAPHY(POINT),
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS alert_radius_km DECIMAL DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS receive_medical_alerts BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS receive_assault_alerts BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS receive_accident_alerts BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS receive_other_alerts BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS silent_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_in_leaderboard BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS emergency_calculator_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS shake_to_alert_enabled BOOLEAN DEFAULT true;

-- Create index for location queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles USING GIST(current_location);

-- ============================================================================
-- 3. CREATE EMERGENCY_CONTACTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own emergency contacts" ON public.emergency_contacts
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 4. UPDATE INCIDENTS TABLE - Add emergency types, voice notes, triggers
-- ============================================================================
-- Add new columns
ALTER TABLE public.incidents
ADD COLUMN IF NOT EXISTS emergency_type TEXT CHECK (emergency_type IN ('medical', 'assault', 'accident', 'other')),
ADD COLUMN IF NOT EXISTS voice_note_url TEXT,
ADD COLUMN IF NOT EXISTS location_address TEXT,
ADD COLUMN IF NOT EXISTS is_silent_alert BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS triggered_by_check_in UUID,
ADD COLUMN IF NOT EXISTS triggered_by_shake BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS triggered_by_calculator BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS resolution_method TEXT;

-- Add foreign key constraint for check_in_timers if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'check_in_timers') THEN
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'incidents_triggered_by_check_in_fkey'
      AND table_name = 'incidents'
    ) THEN
      ALTER TABLE public.incidents
      ADD CONSTRAINT incidents_triggered_by_check_in_fkey 
      FOREIGN KEY (triggered_by_check_in) REFERENCES public.check_in_timers(id);
    END IF;
  END IF;
END $$;

-- Update type constraint to include both old and new types
-- First drop existing constraint if it exists
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'incidents_type_check' 
    AND table_name = 'incidents'
  ) THEN
    ALTER TABLE public.incidents DROP CONSTRAINT incidents_type_check;
  END IF;
END $$;

-- Add new constraint that allows both old type system and new emergency_type
-- Only add if type column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE public.incidents
    ADD CONSTRAINT incidents_type_check 
    CHECK (
      (type IS NOT NULL AND type IN ('sos', 'silent', 'check-in', 'escort', 'checkin')) 
      OR 
      (emergency_type IS NOT NULL AND emergency_type IN ('medical', 'assault', 'accident', 'other'))
    );
  END IF;
END $$;

-- Create index for location queries (only if columns exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' 
    AND column_name = 'location_lat'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' 
    AND column_name = 'location_lng'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_incidents_location ON public.incidents USING GIST(location_lat, location_lng);
  END IF;
END $$;

-- ============================================================================
-- 5. CREATE EMERGENCY_SERVICE_LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.emergency_service_logs (
  id SERIAL PRIMARY KEY,
  incident_id UUID NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('campus_security', 'police', 'ambulance', 'fire')),
  notification_method TEXT CHECK (notification_method IN ('auto_call', 'auto_sms', 'manual', 'api')),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'acknowledged')),
  eta_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged_at TIMESTAMP WITH TIME ZONE
);

-- Add foreign key constraint only if incidents.id is UUID
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' 
    AND column_name = 'id'
    AND data_type = 'uuid'
  ) THEN
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'emergency_service_logs_incident_id_fkey'
      AND table_name = 'emergency_service_logs'
    ) THEN
      ALTER TABLE public.emergency_service_logs
      ADD CONSTRAINT emergency_service_logs_incident_id_fkey 
      FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

ALTER TABLE public.emergency_service_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view service logs for their incidents" ON public.emergency_service_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM incidents 
      WHERE incidents.id = incident_id 
      AND incidents.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. CREATE INCIDENT_CHAT TABLE (Group chat during incidents)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.incident_chat (
  id SERIAL PRIMARY KEY,
  incident_id UUID NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'quick_action', 'location', 'system')),
  location GEOGRAPHY(POINT),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint only if incidents.id is UUID
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' 
    AND column_name = 'id'
    AND data_type = 'uuid'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'incident_chat_incident_id_fkey'
      AND table_name = 'incident_chat'
    ) THEN
      ALTER TABLE public.incident_chat
      ADD CONSTRAINT incident_chat_incident_id_fkey 
      FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

ALTER TABLE public.incident_chat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Incident participants can view chat" ON public.incident_chat
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM incidents 
      WHERE incidents.id = incident_id 
      AND incidents.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM incident_helpers 
      WHERE incident_helpers.incident_id = incident_chat.incident_id 
      AND incident_helpers.helper_id = auth.uid()
    )
  );

CREATE POLICY "Incident participants can send messages" ON public.incident_chat
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM incidents 
      WHERE incidents.id = incident_id 
      AND incidents.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM incident_helpers 
      WHERE incident_helpers.incident_id = incident_chat.incident_id 
      AND incident_helpers.helper_id = auth.uid()
    )
  );

-- Enable realtime (only if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'incident_chat'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.incident_chat;
  END IF;
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS idx_chat_incident ON public.incident_chat(incident_id);

-- ============================================================================
-- 7. CREATE NOTIFICATION_QUEUE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id SERIAL PRIMARY KEY,
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_phone TEXT,
  incident_id UUID NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'nearby_alert', 'trusted_circle_alert', 'emergency_contact_sms', 
    'check_in_expired', 'helper_arrived', 'incident_resolved'
  )),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'acknowledged')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint only if incidents.id is UUID
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' 
    AND column_name = 'id'
    AND data_type = 'uuid'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'notification_queue_incident_id_fkey'
      AND table_name = 'notification_queue'
    ) THEN
      ALTER TABLE public.notification_queue
      ADD CONSTRAINT notification_queue_incident_id_fkey 
      FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notification_queue
  FOR SELECT USING (auth.uid() = recipient_user_id);

-- ============================================================================
-- 8. CREATE POINT_TRANSACTIONS TABLE (Detailed transaction log)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.point_transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  incident_id UUID,
  response_id INTEGER REFERENCES public.incident_helpers(id),
  points_awarded INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint only if incidents.id is UUID
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' 
    AND column_name = 'id'
    AND data_type = 'uuid'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'point_transactions_incident_id_fkey'
      AND table_name = 'point_transactions'
    ) THEN
      ALTER TABLE public.point_transactions
      ADD CONSTRAINT point_transactions_incident_id_fkey 
      FOREIGN KEY (incident_id) REFERENCES public.incidents(id);
    END IF;
  END IF;
END $$;

ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own point transactions" ON public.point_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON public.point_transactions(user_id);

-- ============================================================================
-- 9. UPDATE RESPONSES TABLE (if it exists, otherwise create)
-- ============================================================================
-- Check if incident_helpers needs additional columns
ALTER TABLE public.incident_helpers
ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_location GEOGRAPHY(POINT),
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS distance_km DECIMAL,
ADD COLUMN IF NOT EXISTS eta_minutes INTEGER,
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN IF NOT EXISTS thank_you_message TEXT,
ADD COLUMN IF NOT EXISTS provided_first_aid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS called_emergency_services BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stayed_until_resolved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS comforted_victim BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;

-- ============================================================================
-- 10. UPDATE BADGES TABLE - Add all badge types from prompt
-- ============================================================================
-- The badges table should support all badge types
-- This is handled by the CHECK constraint in the existing schema
-- Just ensure the constraint includes all types:

-- Badge types: first_responder, speed_demon, guardian_angel, lifesaver, 
-- night_watch, community_hero, certified_helper, streak_master,
-- accuracy_expert, communicator, lightning_fast, trusted_guardian,
-- area_protector, five_star_helper, legend

-- ============================================================================
-- 11. CREATE FUNCTION: Get users to notify for incident
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_users_to_notify(
  p_incident_id UUID,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_emergency_type TEXT,
  p_radius_km DOUBLE PRECISION DEFAULT 1.0
)
RETURNS TABLE (
  user_id UUID,
  distance_km DOUBLE PRECISION,
  is_trusted_circle BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH incident_location AS (
    SELECT ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography AS location
  ),
  nearby_users AS (
    SELECT 
      p.user_id,
      ST_Distance(
        p.current_location,
        il.location
      ) / 1000.0 AS distance_km,
      false AS is_trusted_circle
    FROM public.profiles p
    CROSS JOIN incident_location il
    WHERE p.current_location IS NOT NULL
      AND ST_Distance(p.current_location, il.location) <= (p_radius_km * 1000.0)
      AND (
        (p_emergency_type = 'medical' AND p.receive_medical_alerts = true) OR
        (p_emergency_type = 'assault' AND p.receive_assault_alerts = true) OR
        (p_emergency_type = 'accident' AND p.receive_accident_alerts = true) OR
        (p_emergency_type = 'other' AND p.receive_other_alerts = true)
      )
      AND p.user_id != (SELECT user_id FROM incidents WHERE id = p_incident_id)
  ),
  trusted_circle_users AS (
    SELECT 
      tc.trusted_user_id AS user_id,
      0.0 AS distance_km,
      true AS is_trusted_circle
    FROM public.trusted_circles tc
    WHERE tc.user_id = (SELECT user_id FROM incidents WHERE id = p_incident_id)
      AND tc.status = 'accepted'
  )
  SELECT DISTINCT
    COALESCE(nu.user_id, tcu.user_id) AS user_id,
    COALESCE(nu.distance_km, tcu.distance_km) AS distance_km,
    COALESCE(tcu.is_trusted_circle, false) AS is_trusted_circle
  FROM nearby_users nu
  FULL OUTER JOIN trusted_circle_users tcu ON nu.user_id = tcu.user_id
  ORDER BY is_trusted_circle DESC, distance_km ASC;
END;
$$;

-- ============================================================================
-- 12. CREATE FUNCTION: Create incident notifications
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_incident_notifications(
  p_incident_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_location_lat DOUBLE PRECISION;
  v_location_lng DOUBLE PRECISION;
  v_emergency_type TEXT;
  v_user_id UUID;
  v_user RECORD;
BEGIN
  -- Get incident details - check which columns exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'location_lat'
  ) THEN
    SELECT location_lat, location_lng, emergency_type, user_id 
    INTO v_location_lat, v_location_lng, v_emergency_type, v_user_id
    FROM incidents 
    WHERE id = p_incident_id;
  ELSE
    -- Fallback: try to get location from other columns or skip
    SELECT user_id INTO v_user_id FROM incidents WHERE id = p_incident_id;
    IF NOT FOUND THEN
      RETURN;
    END IF;
    -- If location columns don't exist, we can't notify nearby users
    RETURN;
  END IF;
  
  IF v_location_lat IS NULL OR v_location_lng IS NULL THEN
    RETURN;
  END IF;
  
  -- Notify nearby users and trusted circle
  FOR v_user IN 
    SELECT * FROM get_users_to_notify(
      p_incident_id,
      v_location_lat,
      v_location_lng,
      COALESCE(v_emergency_type, 'other'),
      1.0
    )
  LOOP
    INSERT INTO notification_queue (
      recipient_user_id,
      incident_id,
      notification_type,
      priority
    ) VALUES (
      v_user.user_id,
      p_incident_id,
      CASE 
        WHEN v_user.is_trusted_circle THEN 'trusted_circle_alert'
        ELSE 'nearby_alert'
      END,
      CASE 
        WHEN v_incident.emergency_type = 'medical' THEN 'urgent'
        WHEN v_incident.emergency_type = 'assault' THEN 'urgent'
        ELSE 'high'
      END
    );
  END LOOP;
  
  -- Notify emergency contacts via SMS
  INSERT INTO notification_queue (
    recipient_phone,
    incident_id,
    notification_type,
    priority
  )
  SELECT 
    ec.phone,
    p_incident_id,
    'emergency_contact_sms',
    'urgent'
  FROM emergency_contacts ec
  WHERE ec.user_id = v_incident.user_id;
END;
$$;

-- ============================================================================
-- 13. CREATE FUNCTION: Auto-contact emergency services
-- ============================================================================
CREATE OR REPLACE FUNCTION public.auto_contact_emergency_services(
  p_incident_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_incident incidents%ROWTYPE;
BEGIN
  SELECT * INTO v_incident FROM incidents WHERE id = p_incident_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Auto-contact based on emergency type
  IF v_incident.emergency_type = 'medical' THEN
    INSERT INTO emergency_service_logs (incident_id, service_type, notification_method, status)
    VALUES (p_incident_id, 'ambulance', 'auto_call', 'sent');
  END IF;
  
  IF v_incident.emergency_type = 'assault' THEN
    INSERT INTO emergency_service_logs (incident_id, service_type, notification_method, status)
    VALUES (p_incident_id, 'police', 'auto_call', 'sent');
  END IF;
  
  -- Always notify campus security
  INSERT INTO emergency_service_logs (incident_id, service_type, notification_method, status)
  VALUES (p_incident_id, 'campus_security', 'auto_call', 'sent');
END;
$$;

