# SafeCircle Backend Setup Guide

This document provides instructions for setting up and deploying the SafeCircle backend.

## Prerequisites

- Supabase project with database access
- Supabase CLI installed (for local development)
- Environment variables configured

## Database Setup

### 1. Run Migrations

Apply the database migrations in order:

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase SQL Editor:
# Run migrations in this order:
# 1. 20251228114956_f19bc2c4-4f66-4b99-a5e3-953069e0c53e.sql (existing)
# 2. 20250101000000_add_backend_tables_and_functions.sql
# 3. 20250101000001_setup_cron_jobs.sql
```

### 2. Enable Realtime

The migration automatically enables realtime for:
- `messages` table
- `incident_helpers` table
- `user_locations` table

Verify in Supabase Dashboard → Database → Replication.

### 3. Set Up Cron Jobs

For check-in timer expiration, you have two options:

**Option A: Using pg_cron (Recommended)**
1. Enable pg_cron extension in Supabase Dashboard → Database → Extensions
2. Run in SQL Editor:
```sql
SELECT cron.schedule(
  'check-expired-timers',
  '* * * * *', -- Every minute
  $$SELECT public.process_expired_timers();$$
);
```

**Option B: External Cron Service**
Set up a cron job (e.g., using GitHub Actions, Vercel Cron, or similar) to call:
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

## Edge Functions Deployment

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### 4. Deploy Functions

```bash
# Deploy all functions
supabase functions deploy trigger-sos
supabase functions deploy respond-to-incident
supabase functions deploy resolve-incident
supabase functions deploy award-points
supabase functions deploy check-in-timer
```

### 5. Set Environment Variables

In Supabase Dashboard → Edge Functions → Settings, set:
- `SUPABASE_URL`: Your project URL
- `SUPABASE_ANON_KEY`: Your anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (keep secret!)

## Environment Variables

Create a `.env.local` file in your frontend:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
```

## API Endpoints

### Edge Functions

All functions require authentication via `Authorization: Bearer <token>` header.

#### 1. trigger-sos
**POST** `/functions/v1/trigger-sos`

Creates an SOS incident and notifies trusted contacts.

```json
{
  "type": "sos",
  "latitude": 34.0689,
  "longitude": -118.4452,
  "description": "Optional description"
}
```

#### 2. respond-to-incident
**POST** `/functions/v1/respond-to-incident`

Helper responds to an incident.

```json
{
  "incidentId": "uuid",
  "latitude": 34.0689,
  "longitude": -118.4452
}
```

#### 3. resolve-incident
**POST** `/functions/v1/resolve-incident`

Resolves an active incident.

```json
{
  "incidentId": "uuid"
}
```

#### 4. award-points
**POST** `/functions/v1/award-points`

Awards points to a user (usually called internally).

```json
{
  "userId": "uuid",
  "points": 100,
  "reason": "sos_response"
}
```

#### 5. check-in-timer
**POST** `/functions/v1/check-in-timer`

Manages check-in timers.

**Create timer:**
```json
{
  "action": "create",
  "durationMinutes": 30
}
```

**Check in:**
```json
{
  "action": "check_in",
  "timerId": "uuid"
}
```

**Get active timer:**
```json
{
  "action": "get_active"
}
```

## Database Functions

### calculate_distance(lat1, lng1, lat2, lng2)
Calculates distance in kilometers between two coordinates.

### find_nearby_helpers(incident_lat, incident_lng, radius_km)
Finds helpers within radius of incident location.

### award_user_points(target_user_id, points_to_add, reason)
Awards points and checks for level ups.

### check_badge_unlocks(target_user_id)
Checks and unlocks badges based on user's points/level.

### process_expired_timers()
Processes expired check-in timers (called by cron).

## Points System

| Action | Points |
|--------|--------|
| Complete SOS response | 100 |
| First responder to incident | 150 |
| Walk escort completed | 50 |
| Check-in timer used | 10 |
| Added to trusted circle | 15 |
| Silent alert resolved | 75 |

## Badges

Badges are automatically unlocked when users reach required points:
- **First Responder** (Bronze): 100 points
- **Quick Response** (Silver): 200 points
- **Night Owl** (Silver): 300 points
- **Guardian Angel** (Silver): 500 points
- **Trusted Friend** (Gold): 1500 points
- **Campus Hero** (Gold): 5000 points
- **Safety Legend** (Platinum): 12500 points
- **Shield Master** (Bronze): 0 points (manual unlock)

## Realtime Subscriptions

The frontend should subscribe to:

1. **incidents** - For live SOS updates
   ```typescript
   supabase
     .channel('incidents')
     .on('postgres_changes', {
       event: '*',
       schema: 'public',
       table: 'incidents',
       filter: 'status=eq.active'
     }, (payload) => {
       // Handle incident updates
     })
     .subscribe()
   ```

2. **incident_helpers** - Track helpers responding
   ```typescript
   supabase
     .channel('incident-helpers')
     .on('postgres_changes', {
       event: '*',
       schema: 'public',
       table: 'incident_helpers'
     }, (payload) => {
       // Handle helper updates
     })
     .subscribe()
   ```

3. **messages** - Real-time chat
   ```typescript
   supabase
     .channel('messages')
     .on('postgres_changes', {
       event: 'INSERT',
       schema: 'public',
       table: 'messages',
       filter: `receiver_id=eq.${userId}`
     }, (payload) => {
       // Handle new messages
     })
     .subscribe()
   ```

4. **user_locations** - Live location updates
   ```typescript
   supabase
     .channel('user-locations')
     .on('postgres_changes', {
       event: 'UPDATE',
       schema: 'public',
       table: 'user_locations',
       filter: 'is_sharing=eq.true'
     }, (payload) => {
       // Handle location updates
     })
     .subscribe()
   ```

## Testing Checklist

- [ ] User can sign up and profile is auto-created
- [ ] User can add trusted contacts (pending → accepted flow)
- [ ] SOS trigger creates incident and notifies contacts
- [ ] Helpers can see active incidents on map
- [ ] Helper response is tracked in real-time
- [ ] Chat messages sync in real-time
- [ ] Points are awarded correctly
- [ ] Badges unlock at correct thresholds
- [ ] Check-in timer triggers alert on expiry
- [ ] Location sharing respects trusted circle permissions

## Security Notes

- All tables have RLS (Row Level Security) enabled
- Edge functions use service role key for admin operations
- Client operations use anon key with RLS policies
- Never bypass RLS in client code
- Always validate user authentication in edge functions

## Troubleshooting

### Functions not deploying
- Check Supabase CLI is logged in: `supabase projects list`
- Verify project link: `supabase status`
- Check function syntax: `supabase functions serve <function-name>`

### Realtime not working
- Verify tables are added to replication in Dashboard
- Check RLS policies allow SELECT for subscribed users
- Verify WebSocket connection in browser DevTools

### Cron jobs not running
- Verify pg_cron extension is enabled
- Check cron job is scheduled: `SELECT * FROM cron.job;`
- Review Supabase logs for errors

## Next Steps

1. Set up push notifications (Expo/FCM)
2. Implement geocoding for address lookup
3. Add analytics and monitoring
4. Set up backup and disaster recovery
5. Configure rate limiting for edge functions


