# 🚀 Next Steps - Action Plan

Follow these steps in order to integrate all the new features:

## Step 1: Apply Database Migration ⚠️ IMPORTANT

1. **Open Supabase Dashboard** → Go to your project
2. **Navigate to SQL Editor**
3. **Open the migration file**: `supabase/migrations/20250102000000_add_missing_features.sql`
4. **Copy the entire SQL content**
5. **Paste into SQL Editor** and click "Run"
6. **Verify** - Check that all tables were created successfully

> ⚠️ **Note**: This migration adds new columns to existing tables. Make sure you have a backup if needed.

## Step 2: Create Storage Buckets

1. **Go to Storage** in Supabase Dashboard
2. **Create bucket**: `avatars` (Public: Yes)
3. **Create bucket**: `voice-notes` (Public: Yes)
4. **Set RLS policies** (or allow public access for now)

## Step 3: Update Edge Functions

### Update `trigger-sos` function:

1. **Open**: `supabase/functions/trigger-sos/index.ts`
2. **Add handling for new parameters**:
   - `emergency_type` (medical, assault, accident, other)
   - `voice_note_url`
   - `is_silent_alert`
   - `auto_contact` options
   - `triggered_by_shake` / `triggered_by_calculator`

3. **Call the new database functions**:
   - `create_incident_notifications()`
   - `auto_contact_emergency_services()`

### Update `respond-to-incident` function:

1. **Add location tracking** updates
2. **Calculate ETA** based on distance
3. **Update incident_helpers** with new fields

### Update `resolve-incident` function:

1. **Trigger rating flow** (or return flag to show rating screen)

## Step 4: Integrate Components into App

### 4.1 Add Profile Setup to Auth Flow

**File**: `src/pages/AuthPage.tsx`

Add after successful signup:
```typescript
import { ProfileSetup } from '@/components/auth/ProfileSetup';

// After signup success, show ProfileSetup
{showProfileSetup && (
  <ProfileSetup onComplete={() => {
    setShowProfileSetup(false);
    navigate('/');
  }} />
)}
```

### 4.2 Replace SOS Button with SOS Modal

**File**: `src/pages/Index.tsx`

Replace the current SOS button trigger with:
```typescript
import { SOSModal } from '@/components/incident/SOSModal';

const [showSOSModal, setShowSOSModal] = useState(false);

// Replace triggerSOS call with:
<SOSButton onClick={() => setShowSOSModal(true)} />
<SOSModal 
  open={showSOSModal}
  onClose={() => setShowSOSModal(false)}
  onSOSSent={() => {
    // Handle SOS sent
  }}
/>
```

### 4.3 Add Shake-to-Alert to App

**File**: `src/App.tsx`

Add at the top level:
```typescript
import { useShakeToAlert } from '@/hooks/useShakeToAlert';

// Inside App component:
useShakeToAlert({ enabled: true });
```

### 4.4 Add Rating Screen After Incident Resolution

**File**: `src/pages/Index.tsx` or create new incident detail page

```typescript
import { RatingScreen } from '@/components/incident/RatingScreen';

// After incident resolved:
{showRatingScreen && (
  <RatingScreen
    incidentId={resolvedIncidentId}
    helpers={helpers}
    onComplete={() => setShowRatingScreen(false)}
  />
)}
```

### 4.5 Add Group Chat to Incident Views

**File**: `src/pages/MapPage.tsx` or create incident detail view

```typescript
import { IncidentChat } from '@/components/chat/IncidentChat';

// In incident detail view:
<IncidentChat incidentId={selectedIncident.id} />
```

### 4.6 Add First-Aid Guide to Helper View

**File**: Create new `src/pages/HelperResponsePage.tsx` or add to MapPage

```typescript
import { FirstAidGuide } from '@/components/incident/FirstAidGuide';

<FirstAidGuide emergencyType={incident.emergency_type} />
```

### 4.7 Add Emergency Calculator to Settings/Quick Actions

**File**: `src/pages/ProfilePage.tsx` or create Settings page

```typescript
import { EmergencyCalculator } from '@/components/incident/EmergencyCalculator';

const [showCalculator, setShowCalculator] = useState(false);

// Add button in settings:
<Button onClick={() => setShowCalculator(true)}>
  Emergency Calculator
</Button>

{showCalculator && (
  <EmergencyCalculator onClose={() => setShowCalculator(false)} />
)}
```

## Step 5: Test Everything

### Test Checklist:

- [ ] **Profile Setup**: Complete all 6 steps
- [ ] **SOS Modal**: 
  - [ ] Select emergency type
  - [ ] Record voice note
  - [ ] Toggle silent alert
  - [ ] Send SOS
- [ ] **Shake-to-Alert**: Shake phone 3x (enable in profile first)
- [ ] **Emergency Calculator**: Enter "911" then "="
- [ ] **Group Chat**: Send messages during active incident
- [ ] **First-Aid Guide**: View guidance for different emergency types
- [ ] **Rating Screen**: Rate helpers after incident resolution
- [ ] **Location Tracking**: Share location, see on map
- [ ] **Real-time Updates**: Test on multiple devices

## Step 6: Fix Any Issues

### Common Issues:

1. **Storage bucket errors**: Make sure buckets exist and have correct permissions
2. **RLS policies**: May need to update policies for new tables
3. **Edge function errors**: Check function logs in Supabase dashboard
4. **TypeScript errors**: Run `npm run build` to check for type errors
5. **Missing imports**: Make sure all components are imported correctly

## Step 7: Optional Enhancements

1. **Enhanced Leaderboard**: Add tabs and categories
2. **Achievement Animations**: Add confetti on badge unlock
3. **Active Alert View**: Create detailed victim view
4. **Helper Response View**: Create detailed helper view

## 🎯 Quick Start (Minimal Integration)

If you want to test quickly, start with:

1. ✅ Apply database migration
2. ✅ Add ProfileSetup to auth flow
3. ✅ Replace SOS button with SOSModal
4. ✅ Test basic SOS flow

Then gradually add other features.

## 📞 Need Help?

- Check `IMPLEMENTATION_SUMMARY.md` for detailed info
- Check `FEATURES_ADDED.md` for feature list
- Review component files for usage examples
- Check Supabase logs for errors

---

**Ready to start? Begin with Step 1 (Database Migration)!** 🚀

