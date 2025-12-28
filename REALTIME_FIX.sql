-- Enable Realtime for SafeCircle Tables
-- Run this in Supabase SQL Editor if you don't see tables in Replication dashboard

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable realtime for incident_helpers table
ALTER PUBLICATION supabase_realtime ADD TABLE public.incident_helpers;

-- Enable realtime for user_locations table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations;

-- Verify realtime is enabled (optional - run to check)
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('messages', 'incident_helpers', 'user_locations');


