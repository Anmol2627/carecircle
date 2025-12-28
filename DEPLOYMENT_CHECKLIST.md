# ✅ SafeCircle Backend Deployment Checklist

Your credentials are configured! Follow this checklist to deploy.

## ✅ Completed
- [x] Environment file (.env.local) created with your credentials
- [x] All migration files ready
- [x] All edge functions ready
- [x] React hooks created

## 📋 To Do (In Order)

### 1. Database Migrations (5 minutes)

**Go to:** Supabase Dashboard → SQL Editor

#### Migration 1: Base Tables
- [ ] Open: `supabase/migrations/20251228114956_f19bc2c4-4f66-4b99-a5e3-953069e0c53e.sql`
- [ ] Copy ALL SQL
- [ ] Paste in SQL Editor
- [ ] Click **Run**
- [ ] ✅ Verify: Check Table Editor → Should see `profiles`, `trusted_circles`, `incidents`

#### Migration 2: New Tables & Functions
- [ ] Open: `supabase/migrations/20250101000000_add_backend_tables_and_functions.sql`
- [ ] Copy ALL SQL
- [ ] Paste in SQL Editor
- [ ] Click **Run**
- [ ] ✅ Verify: Check Table Editor → Should see `messages`, `incident_helpers`, `user_locations`, `badges`, `user_badges`, `check_in_timers`

#### Migration 3: Cron Jobs
- [ ] Open: `supabase/migrations/20250101000001_setup_cron_jobs.sql`
- [ ] Copy ALL SQL
- [ ] Paste in SQL Editor
- [ ] Click **Run**

### 2. Enable Realtime ✅ (Already Done!)

**✅ Realtime is already enabled!** The migration automatically enabled it.

If you got an error like "relation is already member of publication", that's actually **good news** - it means realtime is already working!

**Optional: Verify Realtime is Enabled**
- [ ] Go to: **SQL Editor**
- [ ] Run this to check:
```sql
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename IN ('messages', 'incident_helpers', 'user_locations');
```
- [ ] You should see all 3 tables listed

**✅ You can skip to Step 3 now!**

### 3. Deploy Edge Functions (10 minutes)

**Go to:** Edge Functions → Create Function

#### Function 1: trigger-sos
- [ ] Click **Create Function**
- [ ] Name: `trigger-sos`
- [ ] Copy code from: `supabase/functions/trigger-sos/index.ts`
- [ ] Paste into editor
- [ ] Click **Deploy**

#### Function 2: respond-to-incident
- [ ] Click **Create Function**
- [ ] Name: `respond-to-incident`
- [ ] Copy code from: `supabase/functions/respond-to-incident/index.ts`
- [ ] Paste into editor
- [ ] Click **Deploy**

#### Function 3: resolve-incident
- [ ] Click **Create Function**
- [ ] Name: `resolve-incident`
- [ ] Copy code from: `supabase/functions/resolve-incident/index.ts`
- [ ] Paste into editor
- [ ] Click **Deploy**

#### Function 4: award-points
- [ ] Click **Create Function**
- [ ] Name: `award-points`
- [ ] Copy code from: `supabase/functions/award-points/index.ts`
- [ ] Paste into editor
- [ ] Click **Deploy**

#### Function 5: check-in-timer
- [ ] Click **Create Function**
- [ ] Name: `check-in-timer`
- [ ] Copy code from: `supabase/functions/check-in-timer/index.ts`
- [ ] Paste into editor
- [ ] Click **Deploy**

### 4. Set Edge Function Secrets (2 minutes)

**⚠️ Important:** Secret names cannot start with `SUPABASE_`!

- [ ] Go to: **Edge Functions** → **Settings**
- [ ] Add secret: `PROJECT_URL` = `https://fkhteposopixfzwwubdb.supabase.co`
- [ ] Add secret: `ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraHRlcG9zb3BpeGZ6d3d1YmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MTk1MjksImV4cCI6MjA4MjQ5NTUyOX0.azbfo6MdEqwv7VbKUmF2ofIbApq4hsHM1cIfE98xB3g`
- [ ] Add secret: `SERVICE_ROLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraHRlcG9zb3BpeGZ6d3d1YmRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkxOTUyOSwiZXhwIjoyMDgyNDk1NTI5fQ.dPCS5ucXO3sbFCOYCgnFtJlH6PbkUmCORmVws1excdU`

**Note:** I've updated all functions to use these new names (PROJECT_URL, ANON_KEY, SERVICE_ROLE_KEY)

### 5. Set Up Cron Job (2 minutes)

- [ ] Go to: **Database** → **Extensions**
- [ ] Enable `pg_cron` extension
- [ ] Go to: **SQL Editor**
- [ ] Run this SQL:
```sql
SELECT cron.schedule(
  'check-expired-timers',
  '* * * * *',
  $$SELECT public.process_expired_timers();$$
);
```

### 6. Test Deployment (5 minutes)

- [ ] Start app: `npm run dev`
- [ ] Try to sign up for an account
- [ ] Check: Supabase Dashboard → **Table Editor** → **profiles** (should see your profile)
- [ ] Check: **Authentication** → **Users** (should see your user)

## 🎉 Done!

Your backend is fully deployed and ready to use!

## 📚 Next Steps

1. Replace mock data in your frontend with the React hooks
2. Test all features:
   - SOS alerts
   - Trusted circle
   - Chat
   - Location sharing
   - Points and badges

## 🆘 Troubleshooting

**Migration errors?**
- Check if tables already exist (may need to drop first)
- Run migrations one at a time
- Check SQL Editor for error messages

**Functions not working?**
- Verify secrets are set correctly
- Check function logs in Dashboard
- Verify function names match exactly

**Realtime not working?**
- Verify replication is enabled
- Check RLS policies allow SELECT
- Check browser console for WebSocket errors

