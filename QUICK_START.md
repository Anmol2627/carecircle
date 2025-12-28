# 🚀 SafeCircle Backend - Quick Start Guide

## What You Need to Do Right Now

### 1. Get Your Supabase Credentials (2 minutes)

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

### 2. Set Up Environment Variables (1 minute)

Create a file called `.env.local` in the project root:

```bash
# In PowerShell (Windows)
cd "C:\Users\HP\Downloads\safe-circle-app-main (1)\safe-circle-app-main"
New-Item -Path ".env.local" -ItemType File
```

Then add this content (replace with YOUR values):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
```

### 3. Install Supabase CLI (2 minutes)

```bash
npm install -g supabase
```

### 4. Link Your Project (1 minute)

```bash
# Login first
supabase login

# Link your project (get PROJECT_REF from Supabase dashboard URL)
supabase link --project-ref YOUR_PROJECT_REF
```

### 5. Run Database Migrations (2 minutes)

**Option A: Using CLI (Easiest)**
```bash
supabase db push
```

**Option B: Manual (If CLI doesn't work)**
1. Go to Supabase Dashboard → **SQL Editor**
2. Open `supabase/migrations/20251228114956_f19bc2c4-4f66-4b99-a5e3-953069e0c53e.sql`
3. Copy all content, paste in SQL Editor, click **Run**
4. Repeat for `20250101000000_add_backend_tables_and_functions.sql`
5. Repeat for `20250101000001_setup_cron_jobs.sql`

### 6. Enable Realtime (1 minute)

1. Go to Supabase Dashboard → **Database** → **Replication**
2. Toggle ON for:
   - ✅ `messages`
   - ✅ `incident_helpers`
   - ✅ `user_locations`

### 7. Deploy Edge Functions (3 minutes)

First, set environment variables in Supabase:
1. Go to **Edge Functions** → **Settings**
2. Add secrets:
   - `SUPABASE_URL` = Your project URL
   - `SUPABASE_ANON_KEY` = Your anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = Your service_role key (from API settings)

Then deploy:
```bash
supabase functions deploy trigger-sos
supabase functions deploy respond-to-incident
supabase functions deploy resolve-incident
supabase functions deploy award-points
supabase functions deploy check-in-timer
```

### 8. Test It! (2 minutes)

```bash
# Start your app
npm run dev
```

Try to:
1. Sign up for an account
2. Check Supabase Dashboard → **Table Editor** → **profiles** (should see your profile)
3. Check **Authentication** → **Users** (should see your user)

## ✅ Quick Checklist

- [ ] Created Supabase project
- [ ] Got API credentials
- [ ] Created `.env.local` file
- [ ] Installed Supabase CLI
- [ ] Linked project
- [ ] Ran migrations
- [ ] Enabled realtime
- [ ] Deployed edge functions
- [ ] Tested sign up

## 🆘 Common Issues

### "Cannot find module '@supabase/supabase-js'"
```bash
npm install
```

### "Function not found"
- Make sure you deployed all 5 functions
- Check function names are exact

### "RLS policy violation"
- Make sure you're logged in
- Check migrations ran successfully

### "Realtime not working"
- Verify tables are enabled in Replication settings
- Check browser console for WebSocket errors

## 📚 Next Steps

Once everything is working:

1. **Replace Mock Data**: Start using the hooks in your components
   ```typescript
   import { useIncidents } from '@/hooks/useIncidents'
   ```

2. **Set Up Cron Job**: For check-in timer expiration
   - See `DEPLOYMENT_GUIDE.md` Step 9

3. **Test All Features**:
   - SOS alerts
   - Trusted circle
   - Chat
   - Location sharing
   - Points and badges

## 📖 Full Documentation

- `DEPLOYMENT_GUIDE.md` - Detailed deployment steps
- `BACKEND_SETUP.md` - Complete setup guide
- `API_REFERENCE.md` - API documentation
- `IMPLEMENTATION_SUMMARY.md` - What was built

## 🎯 Estimated Time

- **Total**: ~15 minutes
- **First time**: ~20 minutes (including reading)

## Need Help?

1. Check the error message in browser console
2. Check Supabase Dashboard → Logs
3. Verify all steps above are completed
4. Check `DEPLOYMENT_GUIDE.md` for troubleshooting

Good luck! 🚀


