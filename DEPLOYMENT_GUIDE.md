# SafeCircle Backend Deployment Guide

Follow these steps to deploy your backend to Supabase.

## Step 1: Set Up Supabase Project

### If you don't have a Supabase project yet:

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - Project name: `safe-circle`
   - Database password: (save this securely!)
   - Region: Choose closest to you
4. Wait for project to be created (2-3 minutes)

### Get your project credentials:

1. Go to Project Settings → API
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - KEEP THIS SECRET!

## Step 2: Install Supabase CLI

```bash
# Using npm
npm install -g supabase

# Or using PowerShell (Windows)
npm install -g supabase
```

Verify installation:
```bash
supabase --version
```

## Step 3: Link Your Project

```bash
# Navigate to your project
cd "C:\Users\HP\Downloads\safe-circle-app-main (1)\safe-circle-app-main"

# Login to Supabase
supabase login

# Link your project (replace YOUR_PROJECT_REF with your actual project reference)
supabase link --project-ref YOUR_PROJECT_REF
```

To find your project reference:
- Go to Supabase Dashboard → Project Settings → General
- Look for "Reference ID"

## Step 4: Run Database Migrations

### Option A: Using Supabase CLI (Recommended)

```bash
# Push all migrations
supabase db push
```

### Option B: Manual SQL Editor

1. Go to Supabase Dashboard → SQL Editor
2. Open the migration file: `supabase/migrations/20251228114956_f19bc2c4-4f66-4b99-a5e3-953069e0c53e.sql`
3. Copy and paste into SQL Editor, then Run
4. Repeat for: `supabase/migrations/20250101000000_add_backend_tables_and_functions.sql`
5. Repeat for: `supabase/migrations/20250101000001_setup_cron_jobs.sql`

### Verify Tables Were Created

Go to Supabase Dashboard → Table Editor. You should see:
- ✅ profiles
- ✅ trusted_circles
- ✅ incidents
- ✅ messages
- ✅ incident_helpers
- ✅ user_locations
- ✅ badges
- ✅ user_badges
- ✅ check_in_timers

## Step 5: Enable Realtime

1. Go to Supabase Dashboard → Database → Replication
2. Enable replication for:
   - ✅ `messages`
   - ✅ `incident_helpers`
   - ✅ `user_locations`

## Step 6: Set Up Edge Functions Environment Variables

1. Go to Supabase Dashboard → Edge Functions → Settings
2. Add these secrets:
   - `SUPABASE_URL` = Your project URL
   - `SUPABASE_ANON_KEY` = Your anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = Your service_role key

## Step 7: Deploy Edge Functions

```bash
# Deploy each function
supabase functions deploy trigger-sos
supabase functions deploy respond-to-incident
supabase functions deploy resolve-incident
supabase functions deploy award-points
supabase functions deploy check-in-timer
```

Verify in Dashboard → Edge Functions (you should see all 5 functions)

## Step 8: Set Up Frontend Environment Variables

Create `.env.local` file in your project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
```

Replace:
- `YOUR_PROJECT_REF` with your actual project reference
- `your_anon_key_here` with your anon/public key

## Step 9: Set Up Cron Job for Expired Timers

### Option A: Using pg_cron (Recommended)

1. Go to Supabase Dashboard → Database → Extensions
2. Enable `pg_cron` extension
3. Go to SQL Editor and run:

```sql
SELECT cron.schedule(
  'check-expired-timers',
  '* * * * *', -- Every minute
  $$SELECT public.process_expired_timers();$$
);
```

### Option B: External Cron Service

Set up a cron job (GitHub Actions, Vercel Cron, etc.) to call:
```
POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-in-timer
Headers:
  Authorization: Bearer YOUR_SERVICE_ROLE_KEY
  Content-Type: application/json
Body:
{
  "action": "check_expired"
}
```

## Step 10: Test Your Setup

### Test Database Connection

1. Start your frontend: `npm run dev`
2. Try to sign up/login
3. Check Supabase Dashboard → Authentication → Users (should see new user)
4. Check Table Editor → profiles (should see new profile)

### Test Edge Functions

You can test using the Supabase Dashboard:
1. Go to Edge Functions → Select a function
2. Click "Invoke" tab
3. Add test payload and invoke

Or use curl/Postman:
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/trigger-sos \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"sos","latitude":34.0689,"longitude":-118.4452}'
```

## Step 11: Integrate with Frontend

Replace mock data with real hooks:

1. In your components, replace imports:
   ```typescript
   // OLD
   import { mockIncidents } from '@/data/mockData'
   
   // NEW
   import { useIncidents } from '@/hooks/useIncidents'
   ```

2. Use the hooks:
   ```typescript
   const { incidents, triggerSOS, loading } = useIncidents()
   ```

3. Update components to use real data instead of mock data

## Step 12: Verify Everything Works

### Checklist:

- [ ] Can sign up and profile is created automatically
- [ ] Can add trusted contacts
- [ ] SOS trigger creates incident
- [ ] Helpers can see active incidents
- [ ] Chat messages work in real-time
- [ ] Location sharing works
- [ ] Points are awarded correctly
- [ ] Badges unlock when thresholds are met
- [ ] Check-in timer creates and expires correctly

## Troubleshooting

### "Function not found" error
- Make sure you deployed all functions
- Check function names match exactly
- Verify you're using the correct project URL

### "RLS policy violation" error
- Check RLS policies are enabled
- Verify user is authenticated
- Check policies allow the operation

### Realtime not working
- Verify tables are in Replication settings
- Check WebSocket connection in browser DevTools
- Ensure RLS policies allow SELECT

### Migration errors
- Run migrations one at a time
- Check for syntax errors in SQL
- Verify you have proper permissions

## Next Steps After Deployment

1. **Add Push Notifications** - Integrate Expo/FCM
2. **Add Geocoding** - Convert coordinates to addresses
3. **Set Up Monitoring** - Add error tracking (Sentry, etc.)
4. **Configure Rate Limiting** - Prevent abuse
5. **Add Analytics** - Track usage patterns

## Need Help?

- Check `BACKEND_SETUP.md` for detailed setup
- Check `API_REFERENCE.md` for API docs
- Check `IMPLEMENTATION_SUMMARY.md` for overview
- Supabase Docs: https://supabase.com/docs

## Quick Commands Reference

```bash
# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push

# Deploy function
supabase functions deploy FUNCTION_NAME

# View logs
supabase functions logs FUNCTION_NAME

# Start local development
supabase start
```

Good luck! 🚀


