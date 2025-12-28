import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Popup, useMap, CircleMarker } from 'react-leaflet';
import { motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { mockMapMarkers } from '@/data/mockData';
import { cn } from '@/lib/utils';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface SafetyMapProps {
  className?: string;
  showControls?: boolean;
  center?: [number, number];
  zoom?: number;
}

// Map controller for centering
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}

// Helper to get marker color
function getMarkerColor(type: string): string {
  const colors: Record<string, string> = {
    emergency: '#EF4444',
    helper: '#10B981',
    'safe-zone': '#2563EB',
    alert: '#F97316',
    user: '#8B5CF6',
  };
  return colors[type] || '#2563EB';
}

export function SafetyMap({ 
  className, 
  showControls = true,
  center = [34.0689, -118.4452],
  zoom = 15 
}: SafetyMapProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const filters = [
    { id: 'all', label: 'All', color: 'bg-primary' },
    { id: 'helper', label: 'Helpers', color: 'bg-success' },
    { id: 'safe-zone', label: 'Safe Zones', color: 'bg-primary' },
    { id: 'emergency', label: 'Emergencies', color: 'bg-emergency' },
  ];

  const filteredMarkers = mockMapMarkers.filter(
    marker => selectedFilter === 'all' || marker.type === selectedFilter
  );

  return (
    <div className={cn("relative w-full h-full rounded-2xl overflow-hidden", className)}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <MapController center={center} />
        
        {/* Render pulse effects separately */}
        {filteredMarkers.filter(m => m.isActive).map(marker => (
          <CircleMarker
            key={`pulse-${marker.id}`}
            center={[marker.position.lat, marker.position.lng]}
            radius={marker.type === 'emergency' ? 30 : 20}
            pathOptions={{
              color: getMarkerColor(marker.type),
              fillColor: getMarkerColor(marker.type),
              fillOpacity: 0.2,
              weight: 2,
            }}
            className="marker-pulse"
          />
        ))}
        
        {/* Render main markers */}
        {filteredMarkers.map(marker => (
          <CircleMarker
            key={marker.id}
            center={[marker.position.lat, marker.position.lng]}
            radius={marker.type === 'user' ? 12 : 10}
            pathOptions={{
              color: '#fff',
              fillColor: getMarkerColor(marker.type),
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Popup>
              <div className="p-2 min-w-[150px]">
                {marker.user && (
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={marker.user.avatar}
                      alt={marker.user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-sm">{marker.user.name}</p>
                      <p className="text-xs text-gray-500">Level {marker.user.level}</p>
                    </div>
                  </div>
                )}
                {!marker.user && (
                  <p className="font-semibold text-sm mb-1">{marker.title}</p>
                )}
                {marker.description && (
                  <p className="text-xs text-gray-500">{marker.description}</p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Filter controls */}
      {showControls && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-4 right-4 z-[1000]"
        >
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {filters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 shadow-md",
                  selectedFilter === filter.id
                    ? `${filter.color} text-white`
                    : "bg-card text-foreground hover:bg-accent"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-4 left-4 z-[1000] bg-card/90 backdrop-blur-xl rounded-xl p-3 shadow-lg border border-border"
      >
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-success" />
            <span>Available Helpers</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary" />
            <span>Safe Zones</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-silent" />
            <span>Your Location</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
