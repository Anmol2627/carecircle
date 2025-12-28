# 🚀 Deploy Your Backend Now!

I have your credentials! Here's what to do:

## Step 1: Deploy Database Migrations

### Go to Supabase Dashboard → SQL Editor

**Run Migration 1** (Base tables - may already exist):
1. Open: `supabase/migrations/20251228114956_f19bc2c4-4f66-4b99-a5e3-953069e0c53e.sql`
2. Copy ALL the SQL
3. Paste in Supabase SQL Editor
4. Click **Run**

**Run Migration 2** (New tables and functions):
1. Open: `supabase/migrations/20250101000000_add_backend_tables_and_functions.sql`
2. Copy ALL the SQL
3. Paste in Supabase SQL Editor
4. Click **Run**

**Run Migration 3** (Cron jobs):
1. Open: `supabase/migrations/20250101000001_setup_cron_jobs.sql`
2. Copy ALL the SQL
3. Paste in Supabase SQL Editor
4. Click **Run**

## Step 2: Enable Realtime

1. Go to **Database** → **Replication**
2. Enable replication for:
   - ✅ `messages`
   - ✅ `incident_helpers`
   - ✅ `user_locations`

## Step 3: Deploy Edge Functions

Go to **Edge Functions** → **Create Function** for each:

### Function 1: trigger-sos
- Name: `trigger-sos`
- Copy code from: `supabase/functions/trigger-sos/index.ts`
- Click **Deploy**

### Function 2: respond-to-incident
- Name: `respond-to-incident`
- Copy code from: `supabase/functions/respond-to-incident/index.ts`
- Click **Deploy**

### Function 3: resolve-incident
- Name: `resolve-incident`
- Copy code from: `supabase/functions/resolve-incident/index.ts`
- Click **Deploy**

### Function 4: award-points
- Name: `award-points`
- Copy code from: `supabase/functions/award-points/index.ts`
- Click **Deploy**

### Function 5: check-in-timer
- Name: `check-in-timer`
- Copy code from: `supabase/functions/check-in-timer/index.ts`
- Click **Deploy**

## Step 4: Set Edge Function Secrets

1. Go to **Edge Functions** → **Settings**
2. Add these secrets:
   - `SUPABASE_URL` = `https://fkhteposopixfzwwubdb.supabase.co`
   - `SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraHRlcG9zb3BpeGZ6d3d1YmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MTk1MjksImV4cCI6MjA4MjQ5NTUyOX0.azbfo6MdEqwv7VbKUmF2ofIbApq4hsHM1cIfE98xB3g`
   - `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraHRlcG9zb3BpeGZ6d3d1YmRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkxOTUyOSwiZXhwIjoyMDgyNDk1NTI5fQ.dPCS5ucXO3sbFCOYCgnFtJlH6PbkUmCORmVws1excdU`

## Step 5: Set Up Cron Job

1. Go to **Database** → **Extensions**
2. Enable `pg_cron` extension
3. Go to **SQL Editor**
4. Run this:
```sql
SELECT cron.schedule(
  'check-expired-timers',
  '* * * * *',
  $$SELECT public.process_expired_timers();$$
);
```

## Step 6: Test It!

1. Start your app: `npm run dev`
2. Try to sign up
3. Check Supabase Dashboard → **Table Editor** → **profiles** (should see your profile)

## ✅ Done!

Your backend is deployed! The `.env.local` file is already set up with your credentials.


