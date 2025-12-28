# Installing Supabase CLI on Windows

Supabase CLI cannot be installed via `npm install -g` on Windows. Use one of these methods:

## Option 1: Using Scoop (Recommended for Windows)

1. Install Scoop (if you don't have it):
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

2. Install Supabase CLI:
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

## Option 2: Using Chocolatey

1. Install Chocolatey (if you don't have it):
   - Go to https://chocolatey.org/install
   - Follow the installation instructions

2. Install Supabase CLI:
```powershell
choco install supabase
```

## Option 3: Manual Download

1. Go to https://github.com/supabase/cli/releases
2. Download the Windows executable (`.exe`)
3. Add it to your PATH or place it in a folder in your PATH

## Option 4: Use Supabase Dashboard (No CLI Needed!)

You can deploy everything through the Supabase Dashboard without CLI:

1. **Database Migrations**: Copy SQL from migration files and paste in SQL Editor
2. **Edge Functions**: Use Supabase Dashboard → Edge Functions → Create Function
3. **Environment Variables**: Set in Dashboard → Edge Functions → Settings

## Verify Installation

After installing, verify:
```powershell
supabase --version
```

If it works, you're ready to deploy!


