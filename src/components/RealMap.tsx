import { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngExpression } from 'leaflet';
import { cn } from '@/lib/utils';

// Fix default marker icon issue with Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color: string, size: number = 32) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: ${size * 0.6}px;
          height: ${size * 0.6}px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

const emergencyIcon = createCustomIcon('#ef4444', 40); // Red for emergencies
const helperIcon = createCustomIcon('#22c55e', 32); // Green for helpers
const userIcon = createCustomIcon('#3b82f6', 28); // Blue for user
const incidentIcon = createCustomIcon('#f59e0b', 36); // Orange for incidents

// Component to center map on location
function CenterMap({ center, zoom }: { center: LatLngExpression; zoom?: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (zoom) {
      map.setView(center, zoom);
    } else {
      map.setView(center, map.getZoom());
    }
  }, [center, zoom, map]);
  
  return null;
}

// Component to handle zoom events and prevent blank screen
function ZoomHandler() {
  const map = useMap();
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleZoomStart = () => {
      // Clear any pending invalidate calls
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
    };

    const handleZoomEnd = () => {
      // Invalidate size after zoom completes to ensure tiles load
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
      zoomTimeoutRef.current = setTimeout(() => {
        map.invalidateSize();
        // Force a small delay to ensure tiles load
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
      }, 50);
    };

    const handleZoom = () => {
      // Invalidate during zoom to prevent blank screen
      map.invalidateSize();
    };

    map.on('zoomstart', handleZoomStart);
    map.on('zoomend', handleZoomEnd);
    map.on('zoom', handleZoom);

    return () => {
      map.off('zoomstart', handleZoomStart);
      map.off('zoomend', handleZoomEnd);
      map.off('zoom', handleZoom);
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
    };
  }, [map]);

  return null;
}

// Component to handle map resize and prevent blank screen
function MapResizeHandler() {
  const map = useMap();
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    // Invalidate size on mount - multiple times to ensure it works
    const timeouts = [
      setTimeout(() => {
        map.invalidateSize();
      }, 100),
      setTimeout(() => {
        map.invalidateSize();
      }, 500),
      setTimeout(() => {
        map.invalidateSize();
      }, 1000),
    ];
    
    return () => {
      timeouts.forEach(clearTimeout);
    };

    // Handle window resize
    const handleResize = () => {
      // Debounce resize events
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        map.invalidateSize();
      }, 150);
    };

    // Handle visibility change (when tab becomes visible again)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab is visible again, refresh map
        setTimeout(() => {
          map.invalidateSize();
        }, 200);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Observe container size changes
    const container = map.getContainer();
    if (container && window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(() => {
        // Debounce resize observer events
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          map.invalidateSize();
        }, 150);
      });
      resizeObserverRef.current.observe(container);
    }

    // Aggressive periodic check to ensure map is still valid (fixes blank screen issue)
    // Check more frequently to catch issues early
    const intervalId = setInterval(() => {
      try {
        const container = map.getContainer();
        if (!container) return;

        const tileContainer = container.querySelector('.leaflet-tile-container');
        const tiles = container.querySelectorAll('.leaflet-tile');
        
        // If no tiles are visible or container is empty, invalidate size immediately
        if (!tileContainer || tiles.length === 0) {
          console.log('Map tiles missing, refreshing immediately...');
          map.invalidateSize();
          // Force a redraw
          map.getContainer().style.display = 'none';
          map.getContainer().offsetHeight; // Trigger reflow
          map.getContainer().style.display = '';
          return;
        }
        
        // Check if tiles are actually loaded (have images)
        let loadedTiles = 0;
        tiles.forEach((tile) => {
          const img = tile.querySelector('img');
          if (img && img.complete && img.naturalHeight > 0) {
            loadedTiles++;
          }
        });
        
        // If less than 30% of tiles are loaded, refresh immediately
        if (tiles.length > 0 && loadedTiles < tiles.length * 0.3) {
          console.log('Too many tiles missing, refreshing immediately...');
          map.invalidateSize();
          // Force a redraw
          map.getContainer().style.display = 'none';
          map.getContainer().offsetHeight; // Trigger reflow
          map.getContainer().style.display = '';
        }
      } catch (err) {
        console.warn('Map validation check failed:', err);
      }
    }, 1000); // Check every 1 second (more aggressive)

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      clearInterval(intervalId);
    };
  }, [map]);

  return null;
}

interface RealMapProps {
  center: [number, number];
  zoom?: number;
  incidents: Array<{
    id: string;
    type: string;
    location_lat: number | null;
    location_lng: number | null;
    description: string | null;
    status: string;
    created_at: string | null;
  }>;
  userLocations: Array<{
    user_id: string;
    latitude: number;
    longitude: number;
    profile?: {
      full_name: string | null;
      avatar_url: string | null;
    };
  }>;
  currentUserLocation?: {
    latitude: number;
    longitude: number;
    is_sharing: boolean;
  } | null;
  onIncidentClick?: (incident: any) => void;
  onHelperClick?: (helper: any) => void;
  forceCenter?: [number, number] | null; // Force center on this location
}

export function RealMap({
  center,
  zoom = 15,
  incidents,
  userLocations,
  currentUserLocation,
  onIncidentClick,
  onHelperClick,
  forceCenter,
}: RealMapProps) {
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Filter incidents with valid coordinates
  const validIncidents = useMemo(() => {
    return incidents.filter(
      (inc) => inc.location_lat !== null && inc.location_lng !== null && inc.status === 'active'
    );
  }, [incidents]);

  // Filter user locations with valid coordinates
  const validUserLocations = useMemo(() => {
    return userLocations.filter(
      (loc) => loc.latitude !== null && loc.longitude !== null
    );
  }, [userLocations]);

  // Ensure center is valid
  const validCenter: [number, number] = useMemo(() => {
    if (Array.isArray(center) && center.length === 2 && 
        typeof center[0] === 'number' && typeof center[1] === 'number' &&
        !isNaN(center[0]) && !isNaN(center[1])) {
      return center as [number, number];
    }
    return [19.0760, 72.8777]; // Default to Mumbai
  }, [center]);

  if (mapError) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-muted">
        <div className="text-center p-4">
          <p className="text-destructive font-semibold mb-2">Map Error</p>
          <p className="text-sm text-muted-foreground">{mapError}</p>
        </div>
      </div>
    );
  }

  // Use a stable key to prevent unnecessary remounts
  const mapContainerKey = useMemo(() => `map-${validCenter[0]}-${validCenter[1]}`, [validCenter]);

  return (
    <MapContainer
      key={mapContainerKey}
      center={validCenter}
      zoom={zoom}
      style={{ height: '100vh', width: '100vw', zIndex: 0 }}
      scrollWheelZoom={true}
      zoomControl={true}
      className="z-0"
      preferCanvas={false}
      worldCopyJump={false}
      whenReady={(mapInstance) => {
        console.log('Map initialized successfully');
        setMapError(null);
        setIsMapReady(true);
        // Force invalidate size multiple times to ensure it works
        setTimeout(() => {
          if (mapInstance?.target) {
            mapInstance.target.invalidateSize();
          }
        }, 200);
        setTimeout(() => {
          if (mapInstance?.target) {
            mapInstance.target.invalidateSize();
          }
        }, 500);
        setTimeout(() => {
          if (mapInstance?.target) {
            mapInstance.target.invalidateSize();
          }
        }, 1000);
      }}
      whenCreated={(mapInstance) => {
        console.log('Map created', mapInstance);
        // Invalidate size on creation to prevent blank screen
        if (mapInstance?.target) {
          mapInstance.target.invalidateSize();
          // Force immediate redraw
          setTimeout(() => {
            mapInstance.target.invalidateSize();
          }, 50);
        }
      }}
    >
      {/* Map resize handler - prevents blank screen */}
      <MapResizeHandler />
      
      {/* Zoom handler - prevents blank screen during zoom */}
      <ZoomHandler />

      {/* OpenStreetMap Tiles */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        minZoom={3}
        errorTileUrl="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        updateWhenZooming={true}
        updateWhenIdle={false}
        keepBuffer={3}
        zoomOffset={0}
        tileSize={256}
        zoomAnimation={true}
        fadeAnimation={true}
      />

      {/* Center map on forced center or user location */}
      {forceCenter ? (
        <CenterMap center={forceCenter} zoom={zoom} />
      ) : currentUserLocation && currentUserLocation.is_sharing ? (
        <CenterMap center={[currentUserLocation.latitude, currentUserLocation.longitude]} zoom={zoom} />
      ) : null}

      {/* Active Incident Markers */}
      {validIncidents.map((incident) => {
        const position: LatLngExpression = [
          incident.location_lat!,
          incident.location_lng!,
        ];

        return (
          <Marker
            key={`incident-${incident.id}`}
            position={position}
            icon={incident.type === 'sos' ? emergencyIcon : incidentIcon}
            eventHandlers={{
              click: () => onIncidentClick?.(incident),
            }}
          >
            <Popup className="custom-popup" maxWidth={280}>
              <div className="p-3 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    incident.type === 'sos' ? 'bg-emergency/20' :
                    incident.type === 'escort' ? 'bg-primary/20' :
                    'bg-warning/20'
                  )}>
                    {incident.type === 'sos' ? (
                      <span className="text-lg">🚨</span>
                    ) : incident.type === 'escort' ? (
                      <span className="text-lg">👥</span>
                    ) : (
                      <span className="text-lg">🤫</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base capitalize">
                      {incident.type === 'sos' ? 'SOS Alert' : 
                       incident.type === 'silent' ? 'Silent Alert' :
                       incident.type === 'escort' ? 'Escort Request' :
                       'Check-in'}
                    </h3>
                    {incident.created_at && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(incident.created_at).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
                {incident.description && (
                  <p className="text-sm text-foreground mb-2 p-2 bg-muted rounded-lg">
                    {incident.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                    {incident.status}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Helper Location Markers */}
      {validUserLocations.map((location) => {
        const position: LatLngExpression = [location.latitude, location.longitude];

        return (
          <Marker
            key={`helper-${location.user_id}`}
            position={position}
            icon={helperIcon}
            eventHandlers={{
              click: () => onHelperClick?.(location),
            }}
          >
            <Popup className="custom-popup" maxWidth={200}>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  {location.profile?.avatar_url ? (
                    <img
                      src={location.profile.avatar_url}
                      alt={location.profile.full_name || 'Helper'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-success" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate">
                      {location.profile?.full_name || 'Helper'}
                    </h3>
                    <p className="text-xs text-success">Available to help</p>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Current User Location Marker */}
      {currentUserLocation && currentUserLocation.is_sharing && (
        <>
          <Marker
            position={[currentUserLocation.latitude, currentUserLocation.longitude]}
            icon={userIcon}
          >
            <Popup className="custom-popup" maxWidth={180}>
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Your Location</h3>
                    <p className="text-xs text-muted-foreground">Sharing active</p>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
          {/* Pulse circle around user location */}
          <Circle
            center={[currentUserLocation.latitude, currentUserLocation.longitude]}
            radius={100}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.1,
            }}
          />
        </>
      )}

      {/* Incident radius circles (optional - shows area of incident) */}
      {validIncidents.map((incident) => {
        if (incident.location_lat === null || incident.location_lng === null) return null;
        
        return (
          <Circle
            key={`circle-${incident.id}`}
            center={[incident.location_lat, incident.location_lng]}
            radius={200}
            pathOptions={{
              color: incident.type === 'sos' ? '#ef4444' : '#f59e0b',
              fillColor: incident.type === 'sos' ? '#ef4444' : '#f59e0b',
              fillOpacity: 0.1,
            }}
          />
        );
      })}
    </MapContainer>
  );
}

