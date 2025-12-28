# 🚀 Deploy Without CLI - Using Supabase Dashboard

You can deploy everything using just the Supabase Dashboard! No CLI needed.

## Step 1: Deploy Database Migrations

### Migration 1: Base Tables (Already exists)
File: `supabase/migrations/20251228114956_f19bc2c4-4f66-4b99-a5e3-953069e0c53e.sql`

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Open the file and copy all SQL
4. Paste into SQL Editor
5. Click **Run**

### Migration 2: New Tables and Functions
File: `supabase/migrations/20250101000000_add_backend_tables_and_functions.sql`

1. Open the file
2. Copy all SQL
3. Paste into SQL Editor
4. Click **Run**

### Migration 3: Cron Jobs
File: `supabase/migrations/20250101000001_setup_cron_jobs.sql`

1. Open the file
2. Copy all SQL
3. Paste into SQL Editor
4. Click **Run**

## Step 2: Enable Realtime

1. Go to **Database** → **Replication**
2. Enable replication for:
   - ✅ `messages`
   - ✅ `incident_helpers`
   - ✅ `user_locations`

## Step 3: Deploy Edge Functions

For each function, go to **Edge Functions** → **Create Function**:

### Function 1: trigger-sos
1. Click **Create Function**
2. Name: `trigger-sos`
3. Copy code from `supabase/functions/trigger-sos/index.ts`
4. Paste into editor
5. Click **Deploy**

### Function 2: respond-to-incident
1. Click **Create Function**
2. Name: `respond-to-incident`
3. Copy code from `supabase/functions/respond-to-incident/index.ts`
4. Paste into editor
5. Click **Deploy**

### Function 3: resolve-incident
1. Click **Create Function**
2. Name: `resolve-incident`
3. Copy code from `supabase/functions/resolve-incident/index.ts`
4. Paste into editor
5. Click **Deploy**

### Function 4: award-points
1. Click **Create Function**
2. Name: `award-points`
3. Copy code from `supabase/functions/award-points/index.ts`
4. Paste into editor
5. Click **Deploy**

### Function 5: check-in-timer
1. Click **Create Function**
2. Name: `check-in-timer`
3. Copy code from `supabase/functions/check-in-timer/index.ts`
4. Paste into editor
5. Click **Deploy**

## Step 4: Set Environment Variables

1. Go to **Edge Functions** → **Settings**
2. Add these secrets:
   - `SUPABASE_URL` = Your project URL
   - `SUPABASE_ANON_KEY` = Your anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = Your service_role key

## Step 5: Set Up Cron Job

1. Go to **Database** → **Extensions**
2. Enable `pg_cron` extension
3. Go to **SQL Editor**
4. Run:
```sql
SELECT cron.schedule(
  'check-expired-timers',
  '* * * * *',
  $$SELECT public.process_expired_timers();$$
);
```

## Step 6: Configure Frontend

1. Create `.env.local` file in project root:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
```

2. Replace with your actual values from Dashboard → Settings → API

## ✅ Done!

Your backend is now deployed! Test it by:
1. Starting your app: `npm run dev`
2. Signing up for an account
3. Checking Supabase Dashboard → Table Editor → profiles


