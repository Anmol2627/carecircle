# SafeCircle API Reference

Quick reference for all backend endpoints and database functions.

## Edge Functions

All edge functions require authentication via `Authorization: Bearer <token>` header.

### 1. Trigger SOS

**POST** `/functions/v1/trigger-sos`

Creates an SOS incident and notifies trusted contacts.

**Request:**
```json
{
  "type": "sos" | "silent" | "check-in" | "escort",
  "latitude": 34.0689,
  "longitude": -118.4452,
  "description": "Optional description"
}
```

**Response:**
```json
{
  "success": true,
  "incident": { ... },
  "notifiedCount": 3,
  "nearbyHelpersCount": 5,
  "nearbyHelpers": [ ... ]
}
```

### 2. Respond to Incident

**POST** `/functions/v1/respond-to-incident`

Helper responds to an incident.

**Request:**
```json
{
  "incidentId": "uuid",
  "latitude": 34.0689,
  "longitude": -118.4452
}
```

**Response:**
```json
{
  "success": true,
  "response": { ... },
  "pointsAwarded": { ... },
  "badgesUnlocked": { ... },
  "isFirstResponder": true
}
```

### 3. Resolve Incident

**POST** `/functions/v1/resolve-incident`

Resolves an active incident.

**Request:**
```json
{
  "incidentId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "incident": { ... },
  "helpersAwarded": 2,
  "pointsResults": [ ... ]
}
```

### 4. Award Points

**POST** `/functions/v1/award-points`

Awards points to a user.

**Request:**
```json
{
  "userId": "uuid", // optional, defaults to current user
  "points": 100,
  "reason": "sos_response"
}
```

**Response:**
```json
{
  "success": true,
  "points": {
    "points_awarded": 100,
    "new_total": 500,
    "level_up": true,
    "new_level": 2
  },
  "badges": {
    "unlocked_count": 1,
    "badges": [ ... ]
  }
}
```

### 5. Check-In Timer

**POST** `/functions/v1/check-in-timer`

Manages check-in timers.

#### Create Timer
```json
{
  "action": "create",
  "durationMinutes": 30
}
```

#### Check In
```json
{
  "action": "check_in",
  "timerId": "uuid"
}
```

#### Get Active Timer
```json
{
  "action": "get_active"
}
```

#### Check Expired (Cron)
```json
{
  "action": "check_expired"
}
```

## Database Functions

### calculate_distance

```sql
SELECT calculate_distance(lat1, lng1, lat2, lng2);
-- Returns distance in kilometers
```

### find_nearby_helpers

```sql
SELECT * FROM find_nearby_helpers(
  incident_lat DOUBLE PRECISION,
  incident_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 2
);
-- Returns: user_id, full_name, avatar_url, distance_km
```

### award_user_points

```sql
SELECT * FROM award_user_points(
  target_user_id UUID,
  points_to_add INTEGER,
  reason TEXT DEFAULT 'action'
);
-- Returns: points_awarded, new_total, level_up, new_level
```

### check_badge_unlocks

```sql
SELECT * FROM check_badge_unlocks(target_user_id UUID);
-- Returns: unlocked_count, badges[]
```

### process_expired_timers

```sql
SELECT * FROM process_expired_timers();
-- Returns: expired_count, results[]
```

## Supabase Client Queries

### Get Active Incidents

```typescript
const { data } = await supabase
  .from('incidents')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false })
```

### Get Trusted Contacts

```typescript
const { data } = await supabase
  .from('trusted_circles')
  .select(`
    *,
    trusted_user:profiles!trusted_circles_trusted_user_id_fkey (*)
  `)
  .eq('user_id', userId)
  .eq('status', 'accepted')
```

### Get Messages

```typescript
const { data } = await supabase
  .from('messages')
  .select('*')
  .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
  .order('created_at', { ascending: false })
```

### Update Location

```typescript
const { data } = await supabase
  .from('user_locations')
  .upsert({
    user_id: userId,
    latitude: 34.0689,
    longitude: -118.4452,
    is_sharing: true
  }, {
    onConflict: 'user_id'
  })
```

### Get Incident Helpers

```typescript
const { data } = await supabase
  .from('incident_helpers')
  .select(`
    *,
    helper:profiles!incident_helpers_helper_id_fkey (*)
  `)
  .eq('incident_id', incidentId)
```

## Realtime Subscriptions

### Incidents

```typescript
supabase
  .channel('incidents')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'incidents',
    filter: 'status=eq.active'
  }, (payload) => {
    console.log('Incident update:', payload)
  })
  .subscribe()
```

### Messages

```typescript
supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `receiver_id=eq.${userId}`
  }, (payload) => {
    console.log('New message:', payload)
  })
  .subscribe()
```

### Incident Helpers

```typescript
supabase
  .channel('incident-helpers')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'incident_helpers',
    filter: `incident_id=eq.${incidentId}`
  }, (payload) => {
    console.log('Helper update:', payload)
  })
  .subscribe()
```

### User Locations

```typescript
supabase
  .channel('user-locations')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'user_locations',
    filter: 'is_sharing=eq.true'
  }, (payload) => {
    console.log('Location update:', payload)
  })
  .subscribe()
```

## Error Handling

All edge functions return errors in this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Status codes:
- `200` - Success
- `400` - Bad Request (validation error, missing fields)
- `401` - Unauthorized (missing/invalid token)
- `500` - Internal Server Error

## Rate Limiting

Consider implementing rate limiting for:
- SOS triggers (prevent abuse)
- Message sending
- Location updates

## Testing

Use the provided React hooks for easy integration:

```typescript
import { useIncidents } from '@/hooks/useIncidents'
import { useMessages } from '@/hooks/useMessages'
import { useLocation } from '@/hooks/useLocation'
import { useCheckIn } from '@/hooks/useCheckIn'
import { useGamification } from '@/hooks/useGamification'
import { useTrustedCircle } from '@/hooks/useTrustedCircle'
```

See individual hook files for usage examples.


