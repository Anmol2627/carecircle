// DEMO MODE COMPONENT - Can be removed when demo mode is removed
// Shows what a responder sees after responding to an incident (future feature)

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Navigation, 
  Phone, 
  MessageCircle, 
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Heart,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ResponderGuide } from './ResponderGuide';
import { ResponderETA } from './ResponderETA';
import { useDemoMode } from '@/contexts/DemoModeContext';

interface ResponderViewProps {
  incident: {
    id: string;
    type: string;
    emergency_type?: string;
    description?: string;
    location_lat: number;
    location_lng: number;
    created_at: string;
  };
  onClose: () => void;
  onMarkArrived: () => void;
}

export function ResponderView({ incident, onClose, onMarkArrived }: ResponderViewProps) {
  const { isDemoMode } = useDemoMode();
  const [eta, setEta] = useState(4); // Demo: starting ETA
  const [distance, setDistance] = useState(1.2); // Demo: distance in km
  const [isNavigating, setIsNavigating] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Demo: Simulate ETA countdown
  useEffect(() => {
    if (!isDemoMode) return;
    
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
      // Decrease ETA every 10 seconds (demo simulation)
      if (elapsedTime % 10 === 0 && eta > 0) {
        setEta(prev => Math.max(0, prev - 1));
        setDistance(prev => Math.max(0, parseFloat((prev - 0.1).toFixed(1))));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [eta, elapsedTime, isDemoMode]);

  const emergencyType = (incident.emergency_type || incident.type || 'other') as 'medical' | 'assault' | 'accident' | 'other';

  // Demo: Other responders data
  const otherResponders = isDemoMode ? [
    { id: '1', name: 'Sarah Johnson', avatar: null, eta: eta + 2, distance: distance + 0.5, status: 'en_route' as const },
    { id: '2', name: 'Mike Chen', avatar: null, eta: eta + 4, distance: distance + 1.2, status: 'en_route' as const },
  ] : [];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] bg-background"
    >
      {/* Header */}
      <div className="bg-card border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            emergencyType === 'medical' ? 'bg-red-500/20 text-red-500' :
            emergencyType === 'assault' ? 'bg-orange-500/20 text-orange-500' :
            emergencyType === 'accident' ? 'bg-yellow-500/20 text-yellow-500' :
            'bg-blue-500/20 text-blue-500'
          }`}>
            {emergencyType === 'medical' ? <Heart className="w-5 h-5" /> :
             emergencyType === 'assault' ? <Shield className="w-5 h-5" /> :
             <AlertCircle className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="font-bold text-lg capitalize">
              {emergencyType === 'medical' ? 'Medical Emergency' :
               emergencyType === 'assault' ? 'Assault Emergency' :
               emergencyType === 'accident' ? 'Accident' :
               'Emergency'}
            </h2>
            <p className="text-xs text-muted-foreground">
              Responding to incident
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="overflow-y-auto h-[calc(100vh-80px)] p-4 space-y-4">
        {/* ETA and Distance Card */}
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Your ETA</p>
              <p className="text-3xl font-bold text-primary">{eta} min</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Distance</p>
              <p className="text-2xl font-bold">{distance.toFixed(1)} km</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Elapsed: {formatTime(elapsedTime)}</span>
            <span className="mx-2">•</span>
            <span>Status: En Route</span>
          </div>
        </Card>

        {/* Location Card */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="font-bold">Incident Location</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Coordinates:</span>
              <span className="font-mono">
                {incident.location_lat.toFixed(6)}, {incident.location_lng.toFixed(6)}
              </span>
            </div>
            {incident.description && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Description:</p>
                <p className="text-sm">{incident.description}</p>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => {
                setIsNavigating(!isNavigating);
                // In real app, this would open navigation app
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${incident.location_lat},${incident.location_lng}`, '_blank');
              }}
            >
              <Navigation className="w-4 h-4 mr-2" />
              {isNavigating ? 'Stop Navigation' : 'Get Directions'}
            </Button>
          </div>
        </Card>

        {/* Other Responders */}
        {otherResponders.length > 0 && (
          <div>
            <ResponderETA responders={otherResponders} />
          </div>
        )}

        {/* Responder Guide */}
        <div>
          <ResponderGuide 
            emergencyType={emergencyType}
            victimInfo={{
              bloodType: 'O+',
              allergies: 'Peanuts, Shellfish',
              medications: 'Insulin, Metformin',
            }}
          />
        </div>

        {/* Quick Actions */}
        <Card className="p-4">
          <h3 className="font-bold mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {
                // In real app, this would call the victim
                window.open('tel:911');
              }}
            >
              <Phone className="w-4 h-4" />
              Call Victim
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {
                // In real app, this would open chat
                onClose();
                // Navigate to chat would happen here
              }}
            >
              <MessageCircle className="w-4 h-4" />
              Open Chat
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {
                // In real app, this would call 911
                window.open('tel:911');
              }}
            >
              <Phone className="w-4 h-4" />
              Call 911
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {
                // Share location
                navigator.share?.({
                  title: 'Incident Location',
                  text: `Emergency at ${incident.location_lat}, ${incident.location_lng}`,
                });
              }}
            >
              <MapPin className="w-4 h-4" />
              Share Location
            </Button>
          </div>
        </Card>

        {/* Mark as Arrived Button */}
        <Button
          variant="emergency"
          className="w-full h-12 text-lg font-bold"
          onClick={onMarkArrived}
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Mark as Arrived
        </Button>

        {/* Cancel Response */}
        <Button
          variant="ghost"
          className="w-full"
          onClick={onClose}
        >
          Cancel Response
        </Button>
      </div>
    </motion.div>
  );
}

