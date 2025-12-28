# Troubleshooting: New Features Not Showing

## 🔍 Quick Checks

### 1. **Restart Dev Server**
```powershell
# Stop current server (Ctrl+C in terminal)
cd "C:\Users\HP\Downloads\safe-circle-app-main (1)\safe-circle-app-main"
npm run dev
```

### 2. **Clear Browser Cache**
- Press `Ctrl + Shift + Delete`
- Or Hard Refresh: `Ctrl + Shift + R` (Windows) / `Cmd + Shift + R` (Mac)
- Or open in Incognito/Private window

### 3. **Check Browser Console**
- Press `F12` to open DevTools
- Check Console tab for errors
- Check Network tab for failed requests

## ✅ How to See Each Feature

### **Profile Setup** (6-Step Wizard)
**When it shows**: Only for NEW users after signup
**How to test**:
1. Sign out if logged in
2. Go to `/auth`
3. Click "Sign Up" tab
4. Create a NEW account (use different email)
5. After signup, you should see the 6-step wizard

**If it doesn't show**:
- Your account might already have profile data
- Check browser console for errors
- Try creating a completely new account

### **Enhanced SOS Modal**
**When it shows**: When you click the SOS button on home page
**How to test**:
1. Go to home page (`/`)
2. Look for the **big red pulsing SOS button** in the center
3. Click it (don't hold, just click)
4. You should see a modal with:
   - 4 emergency type cards (Medical, Assault, Accident, Other)
   - Voice note recording button
   - Silent alert toggle
   - Auto-contact checkboxes

**If it doesn't show**:
- Check if `showSOSModal` state is being set
- Check browser console for errors
- Verify the SOSModal component file exists

### **Shake-to-Alert**
**When it works**: Globally, but must be enabled in profile
**How to test**:
1. First enable it: Go to Profile → Settings → Enable "Shake to Alert"
2. Shake your phone 3 times quickly
3. Should trigger silent SOS

**Note**: Only works on mobile devices with motion sensors

## 🗺️ Map Still Blank?

### Additional Fixes Applied:
1. ✅ ZoomHandler component added
2. ✅ Multiple invalidateSize calls
3. ✅ Periodic validation checks
4. ✅ Force redraw on tile loss
5. ✅ Enhanced TileLayer config

### If Map Still Goes Blank:

1. **Check Console for Errors**:
   - Open DevTools (F12)
   - Look for Leaflet/Map errors
   - Check Network tab for failed tile requests

2. **Try Different Browser**:
   - Chrome/Edge
   - Firefox
   - Safari

3. **Check Internet Connection**:
   - Map tiles load from OpenStreetMap
   - Need active internet connection

4. **Verify Map Container**:
   - Map should have `height: 100vh` and `width: 100vw`
   - Check if parent divs are hiding it

## 🐛 Common Issues

### Issue: "Component not found" error
**Solution**: 
- Restart dev server
- Clear node_modules and reinstall: `npm install`

### Issue: "Module not found" error
**Solution**:
- Check if component files exist in correct location
- Verify imports are correct

### Issue: Features show but don't work
**Solution**:
- Check browser console for JavaScript errors
- Verify Supabase connection
- Check if database migration was applied

## 📝 Verification Checklist

- [ ] Dev server restarted
- [ ] Browser cache cleared
- [ ] No console errors
- [ ] Components imported correctly
- [ ] State variables initialized
- [ ] Database migration applied (for backend features)

## 🔧 Still Not Working?

1. **Share Browser Console Errors**:
   - Press F12
   - Copy any red error messages
   - Share them for debugging

2. **Check File Structure**:
   ```
   src/
   ├── components/
   │   ├── auth/
   │   │   └── ProfileSetup.tsx ✅
   │   └── incident/
   │       └── SOSModal.tsx ✅
   ```

3. **Verify Integration**:
   - `AuthPage.tsx` should import `ProfileSetup`
   - `Index.tsx` should import `SOSModal`
   - `App.tsx` should have `useShakeToAlert`

## 🚀 Quick Test Commands

```powershell
# Check if files exist
Test-Path "src\components\auth\ProfileSetup.tsx"
Test-Path "src\components\incident\SOSModal.tsx"

# Check for TypeScript errors
npm run build
```

