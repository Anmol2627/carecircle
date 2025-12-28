-- Migration: Setup cron jobs for check-in timer expiration checks
-- Note: This requires pg_cron extension to be enabled in Supabase

-- Enable pg_cron extension (if not already enabled)
-- This must be done by a superuser in Supabase dashboard
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cron job to check for expired timers every minute
-- This calls the check-in-timer edge function via HTTP
-- Note: You'll need to replace YOUR_PROJECT_REF with your actual Supabase project reference
-- and set up the service role key in Supabase secrets

-- Alternative: Use Supabase Edge Functions with scheduled triggers
-- Or use pg_cron to call a database function that processes expired timers

-- Database function to process expired timers (can be called by pg_cron)
CREATE OR REPLACE FUNCTION public.process_expired_timers()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count integer := 0;
  timer_record record;
  user_location record;
  incident_id uuid;
  result jsonb := '[]'::jsonb;
BEGIN
  -- Find all expired active timers
  FOR timer_record IN
    SELECT * FROM check_in_timers
    WHERE status = 'active'
      AND expires_at < now()
  LOOP
    -- Mark timer as expired
    UPDATE check_in_timers
    SET status = 'expired'
    WHERE id = timer_record.id;

    -- Get user's current location if available
    SELECT latitude, longitude INTO user_location
    FROM user_locations
    WHERE user_id = timer_record.user_id
    LIMIT 1;

    -- Create silent alert incident
    INSERT INTO incidents (
      user_id,
      type,
      status,
      location_lat,
      location_lng,
      description
    ) VALUES (
      timer_record.user_id,
      'silent',
      'active',
      user_location.latitude,
      user_location.longitude,
      'Check-in timer expired without check-in'
    )
    RETURNING id INTO incident_id;

    -- Add to result
    result := result || jsonb_build_object(
      'timer_id', timer_record.id,
      'user_id', timer_record.user_id,
      'incident_id', incident_id
    );

    expired_count := expired_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'expired_count', expired_count,
    'results', result
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.process_expired_timers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_expired_timers() TO service_role;

-- Note: To schedule this with pg_cron, run in Supabase SQL editor:
-- SELECT cron.schedule(
--   'check-expired-timers',
--   '* * * * *', -- Every minute
--   $$SELECT public.process_expired_timers();$$
-- );


