# 🎯 Step-by-Step Deployment Guide

I'll help you deploy everything! Follow these steps in order.

## What I Need From You

To deploy to your Supabase account, I need:

1. **Your Supabase Project URL** (looks like: `https://xxxxx.supabase.co`)
2. **Your Supabase anon/public key** (long string starting with `eyJ...`)
3. **Your Supabase service_role key** (also starts with `eyJ...` - keep this secret!)

**Where to find these:**
- Go to [supabase.com/dashboard](https://supabase.com/dashboard)
- Select your project
- Go to **Settings** → **API**
- Copy the values

## Step 1: Install Supabase CLI (I'll do this)

Run this command:
```powershell
npm install -g supabase
```

## Step 2: Login to Supabase (You need to do this)

```powershell
supabase login
```

This will open a browser window. Log in with your Supabase account.

## Step 3: Get Your Project Reference ID

1. Go to Supabase Dashboard
2. Look at the URL - it will be like: `https://supabase.com/dashboard/project/abcdefghijklmnop`
3. The part after `/project/` is your PROJECT_REF (e.g., `abcdefghijklmnop`)

## Step 4: Link Your Project (I can help with this)

Once you give me your PROJECT_REF, I'll run:
```powershell
supabase link --project-ref YOUR_PROJECT_REF
```

## Step 5: Set Environment Variables

I'll create the `.env.local` file with your credentials. Just provide:
- Project URL
- Anon key

## Step 6: Deploy Database (I'll do this)

```powershell
supabase db push
```

## Step 7: Enable Realtime (You do this in Dashboard)

1. Go to Supabase Dashboard → **Database** → **Replication**
2. Enable for: `messages`, `incident_helpers`, `user_locations`

## Step 8: Set Edge Function Secrets (You do this)

1. Go to **Edge Functions** → **Settings**
2. Add these secrets:
   - `SUPABASE_URL` = Your project URL
   - `SUPABASE_ANON_KEY` = Your anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = Your service_role key

## Step 9: Deploy Functions (I'll do this)

I'll run the deployment script to deploy all 5 functions.

## Step 10: Set Up Cron Job (You do this)

In Supabase SQL Editor, run:
```sql
SELECT cron.schedule(
  'check-expired-timers',
  '* * * * *',
  $$SELECT public.process_expired_timers();$$
);
```

## Ready to Start?

**Just provide me with:**
1. ✅ Your Supabase Project URL
2. ✅ Your anon/public key  
3. ✅ Your service_role key
4. ✅ Your Project Reference ID

Then I'll handle the rest! 🚀


