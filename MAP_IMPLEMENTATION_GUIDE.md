# 🗺️ Map Implementation Guide

This guide explains how to implement real map features in SafeCircle using popular mapping libraries.

## 📚 Recommended Map Libraries

### Option 1: React Leaflet (Free, Open Source)
- **Best for**: Simple maps, good performance
- **Cost**: Free
- **Setup**: Easy
- **Features**: Markers, popups, custom controls

### Option 2: Google Maps React (Google Maps API)
- **Best for**: Professional maps, rich features
- **Cost**: Free tier available, then pay-per-use
- **Setup**: Medium (requires API key)
- **Features**: Full Google Maps features, directions, places

### Option 3: Mapbox GL React (Mapbox)
- **Best for**: Custom styling, beautiful maps
- **Cost**: Free tier available, then pay-per-use
- **Setup**: Medium (requires API key)
- **Features**: Custom styles, 3D buildings, vector tiles

## 🎯 Recommended: React Leaflet

**Why**: Free, easy to set up, good for campus safety apps

## 📦 Installation Steps

### 1. Install Dependencies

```bash
npm install react-leaflet leaflet
npm install --save-dev @types/leaflet
```

### 2. Install CSS

Add to `src/index.css` or `src/main.tsx`:
```css
@import 'leaflet/dist/leaflet.css';
```

### 3. Get Map Tiles Provider

**Option A: OpenStreetMap (Free)**
- No API key needed
- Free and open source
- Good for development

**Option B: Mapbox (Better styling)**
- Requires API key
- Better looking maps
- More features

## 🗺️ Implementation Structure

### 1. Create Map Component

```typescript
// src/components/RealMap.tsx
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon (Leaflet issue)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RealMapProps {
  center: [number, number]; // [lat, lng]
  zoom: number;
  incidents: any[];
  userLocations: any[];
  onMarkerClick?: (marker: any) => void;
}

export function RealMap({ center, zoom, incidents, userLocations, onMarkerClick }: RealMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100vh', width: '100%' }}
      scrollWheelZoom={true}
    >
      {/* Map Tiles */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Incident Markers */}
      {incidents.map(incident => (
        <Marker
          key={`incident-${incident.id}`}
          position={[incident.location_lat, incident.location_lng]}
          icon={L.icon({
            iconUrl: '/emergency-marker.png', // Custom icon
            iconSize: [32, 32],
          })}
        >
          <Popup>
            <div>
              <h3>{incident.type.toUpperCase()} Alert</h3>
              <p>{incident.description}</p>
              <p>Status: {incident.status}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* User Location Markers */}
      {userLocations.map(location => (
        <Marker
          key={`user-${location.user_id}`}
          position={[location.latitude, location.longitude]}
          icon={L.icon({
            iconUrl: '/helper-marker.png', // Custom icon
            iconSize: [24, 24],
          })}
        >
          <Popup>
            <div>
              <h3>{location.profile?.full_name || 'Helper'}</h3>
              <p>Available to help</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
```

### 2. Update MapPage to Use Real Map

```typescript
// In MapPage.tsx
import { RealMap } from '@/components/RealMap';
import { useLocation } from '@/hooks/useLocation';

const MapPage = () => {
  const { location } = useLocation();
  const { activeIncidents } = useIncidents();
  const [userLocations, setUserLocations] = useState([]);
  
  // Get map center (user location or default)
  const mapCenter: [number, number] = location && location.is_sharing
    ? [location.latitude, location.longitude]
    : [34.0689, -118.4452]; // Default: UCLA

  return (
    <div className="relative h-screen">
      <RealMap
        center={mapCenter}
        zoom={15}
        incidents={activeIncidents}
        userLocations={userLocations}
        onMarkerClick={(marker) => {
          // Handle marker click
        }}
      />
      
      {/* Floating controls overlay */}
      <div className="absolute top-4 left-4 z-[1000]">
        {/* Your existing controls */}
      </div>
    </div>
  );
};
```

## 🎨 Custom Markers

### Create Custom Marker Icons

1. **Emergency Marker** (Red)
```typescript
const emergencyIcon = L.icon({
  iconUrl: '/markers/emergency.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});
```

2. **Helper Marker** (Green)
```typescript
const helperIcon = L.icon({
  iconUrl: '/markers/helper.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});
```

3. **User Location Marker** (Blue)
```typescript
const userIcon = L.icon({
  iconUrl: '/markers/user.png',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});
```

## 🔄 Real-Time Updates

### Subscribe to Location Changes

```typescript
useEffect(() => {
  const channel = supabase
    .channel('map-updates')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'user_locations',
      filter: 'is_sharing=eq.true'
    }, (payload) => {
      // Update markers in real-time
      loadUserLocations();
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'incidents',
      filter: 'status=eq.active'
    }, (payload) => {
      // Update incident markers
      loadIncidents();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

## 📍 Location Features

### 1. Get User's Current Location

```typescript
const getCurrentLocation = () => {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};
```

### 2. Center Map on User Location

```typescript
import { useMap } from 'react-leaflet';

function CenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
}
```

### 3. Draw Route Between Points

```typescript
import { Polyline } from 'react-leaflet';

// Draw line between user and incident
<Polyline
  positions={[
    [userLat, userLng],
    [incidentLat, incidentLng]
  ]}
  color="red"
  weight={3}
/>
```

## 🎯 Advanced Features

### 1. Clustering (Many Markers)

```bash
npm install react-leaflet-cluster
```

```typescript
import MarkerClusterGroup from 'react-leaflet-cluster';

<MarkerClusterGroup>
  {markers.map(marker => (
    <Marker key={marker.id} position={[marker.lat, marker.lng]} />
  ))}
</MarkerClusterGroup>
```

### 2. Drawing Circles (Safe Zones)

```typescript
import { Circle } from 'react-leaflet';

<Circle
  center={[lat, lng]}
  radius={500} // meters
  pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }}
/>
```

### 3. Custom Controls

```typescript
import { useMap } from 'react-leaflet';

function CustomControl() {
  const map = useMap();
  
  return (
    <div className="leaflet-control">
      <button onClick={() => map.setZoom(map.getZoom() + 1)}>
        Zoom In
      </button>
    </div>
  );
}
```

## 🔐 API Keys Setup

### For Google Maps:

1. Get API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable "Maps JavaScript API"
3. Add to `.env.local`:
```env
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

### For Mapbox:

1. Get API key from [Mapbox](https://account.mapbox.com/)
2. Add to `.env.local`:
```env
VITE_MAPBOX_ACCESS_TOKEN=your_token_here
```

## 📱 Mobile Considerations

### 1. Touch Gestures
- Leaflet handles touch automatically
- Pinch to zoom works out of the box

### 2. Performance
- Use marker clustering for many markers
- Limit visible markers (only show nearby)
- Use debouncing for location updates

### 3. Permissions
```typescript
// Request location permission
navigator.permissions.query({ name: 'geolocation' })
  .then(result => {
    if (result.state === 'granted') {
      // Location allowed
    }
  });
```

## 🎨 Styling Tips

### Dark Mode Map
```typescript
<TileLayer
  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
  attribution='&copy; OpenStreetMap contributors'
/>
```

### Custom Map Style
- Use Mapbox for custom styling
- Or use Leaflet with custom tile providers

## 🚀 Quick Start Checklist

1. ✅ Install `react-leaflet` and `leaflet`
2. ✅ Import Leaflet CSS
3. ✅ Create `RealMap` component
4. ✅ Replace mock map in `MapPage`
5. ✅ Add real incident markers
6. ✅ Add real user location markers
7. ✅ Add real-time subscriptions
8. ✅ Test on mobile device

## 📚 Resources

- [React Leaflet Docs](https://react-leaflet.js.org/)
- [Leaflet Docs](https://leafletjs.com/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)

## 💡 Pro Tips

1. **Start Simple**: Use OpenStreetMap first (no API key needed)
2. **Add Clustering**: When you have many markers
3. **Optimize Performance**: Only show markers in viewport
4. **Cache Tiles**: For offline support
5. **Test on Real Device**: Maps work differently on mobile

That's it! You now know how to implement real maps. Start with React Leaflet + OpenStreetMap for the easiest setup! 🗺️


