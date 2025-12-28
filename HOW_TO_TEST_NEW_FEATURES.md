# How to Test New Features

## 🔄 First: Restart Dev Server

The dev server might be using cached code. Restart it:

```powershell
# Stop the current server (Ctrl+C)
# Then restart:
cd "C:\Users\HP\Downloads\safe-circle-app-main (1)\safe-circle-app-main"
npm run dev
```

**Also clear your browser cache** (Ctrl+Shift+Delete) or use **Hard Refresh** (Ctrl+Shift+R)

## ✅ Features to Test

### 1. **Profile Setup** (After Signup)
- **Where**: Auth page after creating a new account
- **How to test**:
  1. Go to `/auth`
  2. Click "Sign Up"
  3. Create a new account
  4. **You should see**: 6-step profile setup wizard
  5. If you don't see it, the account might already have profile data

### 2. **Enhanced SOS Modal** (Home Page)
- **Where**: Home page (Index.tsx)
- **How to test**:
  1. Go to home page (`/`)
  2. Click the **red SOS button** (big pulsing button)
  3. **You should see**: Modal with:
     - Emergency type selection (Medical, Assault, Accident, Other)
     - Voice note recording button
     - Silent alert toggle
     - Auto-contact options

### 3. **Shake-to-Alert**
- **Where**: Works globally (App.tsx)
- **How to test**:
  1. Enable it in profile settings first
  2. Shake your phone 3 times quickly
  3. **You should see**: Silent SOS triggered

### 4. **Emergency Calculator**
- **Where**: Not integrated yet (component exists)
- **To add**: Add a button in Profile/Settings page

## 🗺️ Map Issue - Additional Fix

The map might still have issues. Let's add one more fix:

