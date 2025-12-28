import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Navigation, 
  Locate, 
  Phone, 
  Shield,
  AlertTriangle,
  Building2,
  X,
  MapPin,
  Users,
  Clock,
  ChevronUp,
  ChevronDown,
  Zap,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/BottomNav';
import { PageTransition, FadeIn } from '@/components/Animations';
import { RealMap } from '@/components/RealMap';
import { ResponderGuide } from '@/components/demo/ResponderGuide';
import { ResponderView } from '@/components/demo/ResponderView';
import { useIncidents } from '@/hooks/useIncidents';
import { useLocation } from '@/hooks/useLocation';
import { useAuth } from '@/hooks/useAuth';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { supabase } from '@/integrations/supabase/client';
import toast, { Toaster } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const MapPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { incidents, activeIncidents, triggerSOS, respondToIncident } = useIncidents();
  const { location, requestLocation, updateLocation, toggleSharing } = useLocation();
  const { isDemoMode } = useDemoMode();
  const [isLocating, setIsLocating] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [userLocations, setUserLocations] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState({ lat: 19.0760, lng: 72.8777 }); // Default: Mumbai, India
  const [mapKey, setMapKey] = useState(0);
  const [forceCenter, setForceCenter] = useState<[number, number] | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [showIncidentsList, setShowIncidentsList] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [showResponderView, setShowResponderView] = useState(false);
  const [respondingToIncident, setRespondingToIncident] = useState<any>(null);
  
  // DEMO MODE - Get victim info for responder guide (future feature)
  const getVictimInfo = () => {
    if (!isDemoMode || !selectedIncident) return undefined;
    // Demo data - in real app, this would come from database
    return {
      bloodType: 'O+',
      allergies: 'Peanuts, Shellfish',
      medications: 'Insulin, Metformin',
    };
  };

  const filters = [
    { id: 'all', label: 'All', color: 'bg-primary', icon: MapPin },
    { id: 'emergency', label: 'Emergencies', color: 'bg-emergency', icon: Shield },
    { id: 'helper', label: 'Helpers', color: 'bg-success', icon: Users },
  ];

  // Get map center (user location or default)
  const mapCenterCoords: [number, number] = useMemo(() => {
    if (location && location.is_sharing && 
        typeof location.latitude === 'number' && typeof location.longitude === 'number' &&
        !isNaN(location.latitude) && !isNaN(location.longitude)) {
      return [location.latitude, location.longitude];
    }
    return [mapCenter.lat, mapCenter.lng];
  }, [location, mapCenter]);

  // Load user locations with realtime
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('map-user-locations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_locations',
        filter: 'is_sharing=eq.true'
      }, (payload) => {
        loadUserLocations();
      })
      .subscribe();

    loadUserLocations();
    checkLocationSharing();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const checkLocationSharing = async () => {
    if (location) {
      setIsSharingLocation(location.is_sharing);
    }
  };

  const loadUserLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('user_locations')
        .select(`
          *,
          profile:profiles!user_locations_user_id_fkey (
            user_id,
            full_name,
            avatar_url
          )
        `)
        .eq('is_sharing', true);

      if (error) throw error;
      if (data) setUserLocations(data);
    } catch (err) {
      console.error('Error loading user locations:', err);
    }
  };

  // Filter incidents and locations based on selected filter
  const filteredIncidents = selectedFilter === 'all' || selectedFilter === 'emergency'
    ? activeIncidents
    : [];

  const filteredUserLocations = selectedFilter === 'all' || selectedFilter === 'helper'
    ? userLocations
    : [];

  const handleLocate = async () => {
    setIsLocating(true);
    toast.loading('Finding your location...', { id: 'locate' });
    
    try {
      const position = await requestLocation();
      if (position) {
        await updateLocation(position.latitude, position.longitude);
        setMapCenter({ lat: position.latitude, lng: position.longitude });
        setForceCenter([position.latitude, position.longitude]);
        setMapKey(prev => prev + 1);
        toast.success('Centered on your location', { id: 'locate' });
        
        setTimeout(() => {
          setForceCenter(null);
        }, 1000);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to get location. Please enable location permissions.', { id: 'locate' });
    } finally {
      setIsLocating(false);
    }
  };

  const handleIncidentClick = (incident: any) => {
    setSelectedIncident(incident);
  };

  const handleHelperClick = async (helper: any) => {
    toast.success(`${helper.profile?.full_name || 'Helper'} is available to help`);
  };

  const handleRespondToIncident = async (incidentId: string) => {
    // DEMO MODE - Show responder view instead of actual response
    if (isDemoMode) {
      const incident = activeIncidents.find(inc => inc.id === incidentId);
      if (incident) {
        setRespondingToIncident(incident);
        setShowResponderView(true);
        setSelectedIncident(null);
        return;
      }
    }
    
    // Real response (when demo mode is off)
    try {
      const position = await requestLocation();
      if (position) {
        await respondToIncident(incidentId, position.latitude, position.longitude);
        toast.success('Response sent! You are now helping.');
        setSelectedIncident(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to respond');
    }
  };
  
  const handleMarkArrived = () => {
    toast.success('You have arrived at the incident location!');
    setShowResponderView(false);
    setRespondingToIncident(null);
  };

  const handleSOS = async () => {
    try {
      const position = await requestLocation();
      if (position) {
        await triggerSOS('sos', position.latitude, position.longitude, 'Emergency SOS activated');
        toast.success('SOS Alert Sent! Help is on the way.');
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send SOS');
    }
  };

  const handleToggleLocationSharing = async () => {
    try {
      if (!location) {
        const position = await requestLocation();
        if (position) {
          await updateLocation(position.latitude, position.longitude);
        }
      }
      await toggleSharing(!isSharingLocation);
      setIsSharingLocation(!isSharingLocation);
      toast.success(isSharingLocation ? 'Location sharing disabled' : 'Location sharing enabled');
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle location sharing');
    }
  };

  const handleEmergencyServices = () => {
    toast.custom((t) => (
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl shadow-xl p-4 max-w-sm"
      >
        <h3 className="font-bold mb-3">Emergency Services</h3>
        <div className="space-y-2">
          <button 
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-emergency/10 hover:bg-emergency/20 transition-colors"
            onClick={() => window.open('tel:911')}
          >
            <Phone className="w-5 h-5 text-emergency" />
            <span className="font-medium">911 - Emergency</span>
          </button>
          <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors">
            <Building2 className="w-5 h-5 text-primary" />
            <span className="font-medium">Campus Security</span>
          </button>
          <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-warning/10 hover:bg-warning/20 transition-colors">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <span className="font-medium">Report Hazard</span>
          </button>
        </div>
        <button 
          onClick={() => toast.dismiss(t.id)}
          className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </motion.div>
    ), { duration: 10000 });
  };

  return (
    <PageTransition className="min-h-screen bg-background pb-20 relative overflow-hidden">
      <Toaster position="top-center" />
      
      {/* Real Map - Full Screen */}
      <div 
        className="fixed inset-0 z-0 h-screen w-screen bg-muted" 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: '100vh',
          width: '100vw',
          overflow: 'hidden'
        }}
        key="map-container"
      >
        <RealMap
          key={`map-${mapKey}`}
          center={mapCenterCoords}
          zoom={15}
          incidents={filteredIncidents}
          userLocations={filteredUserLocations}
          currentUserLocation={location}
          forceCenter={forceCenter}
          onIncidentClick={handleIncidentClick}
          onHelperClick={handleHelperClick}
        />
      </div>

      {/* Compact Header */}
      <FadeIn className="fixed top-0 left-0 right-0 z-[1000] p-3">
        <div className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border/50 shadow-xl">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-base">Safety Map</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {activeIncidents.length}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {userLocations.length}
                </span>
                {location && location.is_sharing && (
                  <>
                    <span>•</span>
                    <span className="text-success">📍 Sharing</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLocate}
                disabled={isLocating}
                className="h-9 w-9"
                title="Go to my location"
              >
                <motion.div
                  animate={isLocating ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: isLocating ? Infinity : 0, repeatType: "loop" }}
                >
                  <Locate className="w-4 h-4" />
                </motion.div>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEmergencyServices}
                className="h-9 w-9"
                title="Emergency services"
              >
                <Phone className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Compact Filter tabs */}
          <div className="flex gap-1.5 px-3 pb-2 overflow-x-auto scrollbar-hide">
            {filters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                  selectedFilter === filter.id
                    ? `${filter.color} text-white shadow-sm`
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                <filter.icon className="w-3 h-3" />
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Incident Details Bottom Sheet */}
      <AnimatePresence>
        {selectedIncident && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[1000] bg-card border-t border-border rounded-t-3xl shadow-2xl max-h-[60vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  selectedIncident.type === 'sos' ? 'bg-emergency/20' :
                  selectedIncident.type === 'escort' ? 'bg-primary/20' :
                  'bg-warning/20'
                )}>
                  {selectedIncident.type === 'sos' ? (
                    <Shield className="w-6 h-6 text-emergency" />
                  ) : selectedIncident.type === 'escort' ? (
                    <Users className="w-6 h-6 text-primary" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-warning" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg capitalize">
                    {selectedIncident.type === 'sos' ? 'SOS Alert' :
                     selectedIncident.type === 'escort' ? 'Escort Request' :
                     'Silent Alert'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedIncident.created_at && formatDistanceToNow(new Date(selectedIncident.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedIncident(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {selectedIncident.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{selectedIncident.description}</p>
                </div>
              )}

              {selectedIncident.location_lat && selectedIncident.location_lng && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Location</p>
                  <p className="text-sm">
                    {selectedIncident.location_lat.toFixed(6)}, {selectedIncident.location_lng.toFixed(6)}
                  </p>
                </div>
              )}

              {/* DEMO MODE - Responder Guide (Future Feature) */}
              {isDemoMode && (
                <div className="pt-2 border-t">
                  <ResponderGuide 
                    emergencyType={(selectedIncident.emergency_type || selectedIncident.type || 'other') as 'medical' | 'assault' | 'accident' | 'other'} 
                    victimInfo={getVictimInfo()}
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="emergency"
                  className="flex-1"
                  onClick={() => handleRespondToIncident(selectedIncident.id)}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {isDemoMode ? 'View Responder Dashboard' : 'Respond to Help'}
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => navigate(`/chat`)}
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DEMO MODE - Responder View (Future Feature) */}
      {isDemoMode && showResponderView && respondingToIncident && (
        <ResponderView
          incident={respondingToIncident}
          onClose={() => {
            setShowResponderView(false);
            setRespondingToIncident(null);
          }}
          onMarkArrived={handleMarkArrived}
        />
      )}

      {/* Active Incidents List - Collapsible */}
      {activeIncidents.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={cn(
            "fixed left-4 right-4 z-[1000] transition-all duration-300",
            showIncidentsList ? "bottom-24" : "bottom-24"
          )}
        >
          <div className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border shadow-xl overflow-hidden">
            <button
              onClick={() => setShowIncidentsList(!showIncidentsList)}
              className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emergency" />
                <span className="font-semibold text-sm">
                  {activeIncidents.length} Active {activeIncidents.length === 1 ? 'Incident' : 'Incidents'}
                </span>
              </div>
              {showIncidentsList ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>

            <AnimatePresence>
              {showIncidentsList && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="max-h-48 overflow-y-auto p-2 space-y-2">
                    {activeIncidents.map(incident => (
                      <button
                        key={incident.id}
                        onClick={() => {
                          setSelectedIncident(incident);
                          if (incident.location_lat && incident.location_lng) {
                            setForceCenter([incident.location_lat, incident.location_lng]);
                            setMapKey(prev => prev + 1);
                            setTimeout(() => setForceCenter(null), 1000);
                          }
                        }}
                        className="w-full text-left p-2 rounded-xl hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            incident.type === 'sos' ? 'bg-emergency' : 'bg-warning'
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm capitalize truncate">
                              {incident.type} Alert
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {incident.description || 'No description'}
                            </p>
                          </div>
                          <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Quick Actions - Bottom Right */}
      <div className="fixed bottom-24 right-4 z-[1000] flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={handleToggleLocationSharing}
          title={isSharingLocation ? 'Stop sharing location' : 'Share my location'}
        >
          <MapPin className={cn("w-5 h-5", isSharingLocation && "text-success fill-current")} />
        </Button>
      </div>

      {/* Primary Actions - Bottom Center */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000] flex gap-3">
        <Button
          variant="trust"
          className="h-12 px-6 rounded-full shadow-lg"
          onClick={() => {
            toast.success('Finding nearest escort...');
            navigate('/');
          }}
        >
          <Navigation className="w-4 h-4 mr-2" />
          Escort
        </Button>
        <Button
          variant="emergency"
          className="h-12 w-12 rounded-full shadow-lg p-0"
          onClick={handleSOS}
          title="Emergency SOS"
        >
          <Shield className="w-5 h-5" />
        </Button>
      </div>

      <BottomNav />
    </PageTransition>
  );
};

export default MapPage;
