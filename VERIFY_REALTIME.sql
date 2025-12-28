-- Verify Realtime is Enabled for SafeCircle Tables
-- Run this to check if realtime is working

SELECT 
  tablename,
  '✅ Enabled' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename IN ('messages', 'incident_helpers', 'user_locations')
ORDER BY tablename;

-- Expected result: Should show 3 rows:
-- incident_helpers | ✅ Enabled
-- messages         | ✅ Enabled
-- user_locations   | ✅ Enabled


