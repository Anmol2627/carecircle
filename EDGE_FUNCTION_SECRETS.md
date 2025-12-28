# 🔐 Edge Function Secrets - Correct Names

Supabase doesn't allow secret names starting with `SUPABASE_`. Use these names instead:

## ✅ Correct Secret Names

When setting secrets in **Edge Functions** → **Settings**, use:

1. **PROJECT_URL**
   - Value: `https://fkhteposopixfzwwubdb.supabase.co`

2. **ANON_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraHRlcG9zb3BpeGZ6d3d1YmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MTk1MjksImV4cCI6MjA4MjQ5NTUyOX0.azbfo6MdEqwv7VbKUmF2ofIbApq4hsHM1cIfE98xB3g`

3. **SERVICE_ROLE_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraHRlcG9zb3BpeGZ6d3d1YmRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkxOTUyOSwiZXhwIjoyMDgyNDk1NTI5fQ.dPCS5ucXO3sbFCOYCgnFtJlH6PbkUmCORmVws1excdU`

## ❌ Don't Use These Names

- ~~SUPABASE_URL~~ (not allowed)
- ~~SUPABASE_ANON_KEY~~ (not allowed)
- ~~SUPABASE_SERVICE_ROLE_KEY~~ (not allowed)

## 📝 How to Set Secrets

1. Go to **Edge Functions** → **Settings**
2. Scroll to **Secrets** section
3. Click **Add Secret**
4. Enter the name (e.g., `PROJECT_URL`)
5. Enter the value
6. Click **Save**
7. Repeat for all 3 secrets

## ✅ All Functions Updated

I've updated all 5 edge functions to use the new names:
- ✅ trigger-sos
- ✅ respond-to-incident
- ✅ resolve-incident
- ✅ award-points
- ✅ check-in-timer

You can now set the secrets with the correct names!


