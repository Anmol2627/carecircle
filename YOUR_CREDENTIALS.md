# 🔐 Your Supabase Credentials

**Keep this file secure!** Don't commit it to git.

## Project Information
- **Project URL**: `https://fkhteposopixfzwwubdb.supabase.co`
- **Project ID**: `fkhteposopixfzwwubdb`

## API Keys

### Anon/Public Key (Safe for frontend)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraHRlcG9zb3BpeGZ6d3d1YmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MTk1MjksImV4cCI6MjA4MjQ5NTUyOX0.azbfo6MdEqwv7VbKUmF2ofIbApq4hsHM1cIfE98xB3g
```

### Service Role Key (Server-side only - KEEP SECRET!)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraHRlcG9zb3BpeGZ6d3d1YmRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkxOTUyOSwiZXhwIjoyMDgyNDk1NTI5fQ.dPCS5ucXO3sbFCOYCgnFtJlH6PbkUmCORmVws1excdU
```

### Publishable Key
```
sb_publishable_sab0pQJ9RhqPiNY7bJlOJg_GVzbGanB
```

## Environment Variables

Already set in `.env.local`:
```env
VITE_SUPABASE_URL=https://fkhteposopixfzwwubdb.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraHRlcG9zb3BpeGZ6d3d1YmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MTk1MjksImV4cCI6MjA4MjQ5NTUyOX0.azbfo6MdEqwv7VbKUmF2ofIbApq4hsHM1cIfE98xB3g
```

## Edge Function Secrets

Set these in Supabase Dashboard → Edge Functions → Settings:

1. **SUPABASE_URL**: `https://fkhteposopixfzwwubdb.supabase.co`
2. **SUPABASE_ANON_KEY**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraHRlcG9zb3BpeGZ6d3d1YmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MTk1MjksImV4cCI6MjA4MjQ5NTUyOX0.azbfo6MdEqwv7VbKUmF2ofIbApq4hsHM1cIfE98xB3g`
3. **SUPABASE_SERVICE_ROLE_KEY**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraHRlcG9zb3BpeGZ6d3d1YmRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkxOTUyOSwiZXhwIjoyMDgyNDk1NTI5fQ.dPCS5ucXO3sbFCOYCgnFtJlH6PbkUmCORmVws1excdU`

## ⚠️ Security Reminder

- ✅ Anon key is safe for frontend use
- ❌ Service role key should NEVER be in frontend code
- ❌ Don't commit this file to git (already in .gitignore)


