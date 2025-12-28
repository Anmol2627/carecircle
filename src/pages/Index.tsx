import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  MapPin, 
  Users, 
  Clock, 
  Bell, 
  Eye, 
  Volume2,
  ChevronRight,
  Zap,
  Heart
} from 'lucide-react';
import { SOSButton } from '@/components/SOSButton';
import { SOSModal } from '@/components/incident/SOSModal';
import { StatusCard, QuickActionCard } from '@/components/StatusCard';
import { Avatar, AvatarGroup } from '@/components/Avatar';
import { BadgeCard } from '@/components/BadgeCard';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '@/components/Animations';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useGamification } from '@/hooks/useGamification';
import { useTrustedCircle } from '@/hooks/useTrustedCircle';
import { useIncidents } from '@/hooks/useIncidents';
import { useLocation } from '@/hooks/useLocation';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { ResponderETA } from '@/components/demo/ResponderETA';
import { supabase } from '@/integrations/supabase/client';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, unlockedBadges } = useGamification();
  const { trustedContacts } = useTrustedCircle();
  const { activeIncidents, triggerSOS } = useIncidents();
  const { requestLocation } = useLocation();
  const { isDemoMode } = useDemoMode();
  const [checkInActive, setCheckInActive] = useState(false);
  const [checkInTime, setCheckInTime] = useState(15);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showSOSModal, setShowSOSModal] = useState(false);
  
  // DEMO MODE - Demo data for responder ETA (future feature)
  const demoResponders = isDemoMode ? [
    { id: '1', name: 'Sarah Johnson', avatar: null, eta: 2, distance: 0.5, status: 'en_route' as const },
    { id: '2', name: 'Mike Chen', avatar: null, eta: 4, distance: 1.2, status: 'en_route' as const },
    { id: '3', name: 'Emma Davis', avatar: null, eta: 6, distance: 2.1, status: 'en_route' as const },
  ] : [];

  // Load user profile
  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
        .then(({ data, error }) => {
          if (data) {
            setUserProfile(data);
          }
        });
    }
  }, [user]);

  const handleSOSActivate = () => {
    setShowSOSModal(true);
  };

  const handleSOSSent = () => {
    toast.custom((t) => (
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        className="bg-emergency text-emergency-foreground px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold">SOS Alert Activated!</p>
          <p className="text-sm opacity-90">Help is on the way. Stay calm.</p>
        </div>
      </motion.div>
    ), { duration: 5000 });
  };

  const handleCheckIn = () => {
    setCheckInActive(true);
    toast.success(`Check-in timer set for ${checkInTime} minutes`, {
      icon: '⏰',
      style: {
        borderRadius: '16px',
        background: 'hsl(var(--card))',
        color: 'hsl(var(--foreground))',
        border: '1px solid hsl(var(--border))',
      },
    });
  };

  const recentBadges = unlockedBadges.slice(0, 3);

  return (
    <PageTransition className="min-h-screen bg-background pb-24">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container px-4 py-4">
          <div className="flex items-center justify-between">
            <FadeIn>
              <div className="flex items-center gap-3">
                <Avatar 
                  src={userProfile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.full_name || user?.email || 'User')}&background=6366f1&color=fff`} 
                  alt={userProfile?.full_name || user?.email || 'User'} 
                  size="md"
                  isOnline
                  hasBorder
                  borderColor="success"
                />
                <div>
                  <p className="text-sm text-muted-foreground">Welcome back,</p>
                  <h1 className="font-bold text-lg">
                    {userProfile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}
                  </h1>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <Button 
                variant="ghost" 
                size="icon"
                className="relative"
                onClick={() => navigate('/profile')}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emergency" />
              </Button>
            </FadeIn>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-8">
        {/* Status Banner */}
        <FadeIn delay={0.1}>
          <motion.div 
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-success/10 via-success/5 to-transparent border border-success/20 p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-success" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-success">You're Safe</h2>
                <p className="text-sm text-muted-foreground">
                  {activeIncidents.length} active incidents • Campus is secure
                </p>
              </div>
              <div className="flex -space-x-2">
                {trustedContacts.slice(0, 3).map(contact => (
                  <img 
                    key={contact.id}
                    src={contact.trusted_user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.trusted_user?.full_name || 'User')}&background=6366f1&color=fff`}
                    alt={contact.trusted_user?.full_name || 'Contact'}
                    className="w-8 h-8 rounded-full border-2 border-background object-cover"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </FadeIn>

        {/* SOS Section */}
        <section className="py-8">
          <FadeIn delay={0.2}>
            <div className="flex flex-col items-center">
              <SOSButton 
                onActivate={handleSOSActivate} 
                onCancel={() => toast.success('Alert cancelled')}
              />
              <p className="text-sm text-muted-foreground mt-6 text-center max-w-xs">
                Hold for 2 seconds to send emergency alert to your trusted circle and nearby helpers
              </p>
            </div>
          </FadeIn>
        </section>

        {/* Quick Actions */}
        <section>
          <FadeIn delay={0.3}>
            <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
          </FadeIn>
          <StaggerContainer className="grid grid-cols-3 gap-3" staggerDelay={0.05}>
            <StaggerItem>
              <QuickActionCard
                icon={<Eye className="w-5 h-5" />}
                title="Silent Alert"
                variant="silent"
                onClick={() => toast.success('Silent alert activated', { icon: '🤫' })}
              />
            </StaggerItem>
            <StaggerItem>
              <QuickActionCard
                icon={<Clock className="w-5 h-5" />}
                title="Check-In"
                variant="trust"
                onClick={handleCheckIn}
              />
            </StaggerItem>
            <StaggerItem>
              <QuickActionCard
                icon={<Users className="w-5 h-5" />}
                title="Find Escort"
                variant="primary"
                onClick={() => navigate('/map')}
              />
            </StaggerItem>
          </StaggerContainer>
        </section>

        {/* Stats Grid */}
        <section>
          <FadeIn delay={0.4}>
            <h3 className="font-semibold text-lg mb-4">Campus Safety</h3>
          </FadeIn>
          <StaggerContainer className="grid grid-cols-2 gap-3" staggerDelay={0.05}>
            <StaggerItem>
              <StatusCard
                title="Your Level"
                value={profile?.level || 1}
                icon={<Zap className="w-5 h-5" />}
                variant="primary"
              />
            </StaggerItem>
            <StaggerItem>
              <StatusCard
                title="Your Points"
                value={profile?.points || 0}
                icon={<Heart className="w-5 h-5" />}
                variant="success"
              />
            </StaggerItem>
            <StaggerItem>
              <StatusCard
                title="Trusted Contacts"
                value={trustedContacts.length}
                icon={<MapPin className="w-5 h-5" />}
                onClick={() => navigate('/circle')}
              />
            </StaggerItem>
            <StaggerItem>
              <StatusCard
                title="Active Incidents"
                value={activeIncidents.length}
                icon={<Shield className="w-5 h-5" />}
                variant="warning"
              />
            </StaggerItem>
          </StaggerContainer>
        </section>

        {/* Trusted Circle Preview */}
        <section>
          <FadeIn delay={0.5}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Trusted Circle</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary"
                onClick={() => navigate('/circle')}
              >
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </FadeIn>
          <StaggerContainer className="flex gap-4 overflow-x-auto scrollbar-hide pb-2" staggerDelay={0.05}>
            {trustedContacts.map(contact => (
              <StaggerItem key={contact.id}>
                <motion.div 
                  className="flex flex-col items-center gap-2 min-w-[80px]"
                  whileHover={{ scale: 1.05 }}
                >
                  <Avatar
                    src={contact.trusted_user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.trusted_user?.full_name || 'User')}&background=6366f1&color=fff`}
                    alt={contact.trusted_user?.full_name || 'Contact'}
                    size="lg"
                    isOnline={true}
                    hasBorder={true}
                    borderColor="trust"
                  />
                  <div className="text-center">
                    <p className="text-sm font-medium truncate max-w-[80px]">
                      {contact.trusted_user?.full_name?.split(' ')[0] || 'Contact'}
                    </p>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
            <StaggerItem>
              <motion.button
                className="flex flex-col items-center justify-center gap-2 min-w-[80px] h-[100px]"
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate('/circle')}
              >
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                  <span className="text-2xl text-muted-foreground">+</span>
                </div>
                <p className="text-xs text-muted-foreground">Add More</p>
              </motion.button>
            </StaggerItem>
          </StaggerContainer>
        </section>

        {/* Recent Badges */}
        <section>
          <FadeIn delay={0.6}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Recent Badges</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary"
                onClick={() => navigate('/profile')}
              >
                All Badges <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </FadeIn>
          <div className="flex gap-4 justify-center">
            {recentBadges.length > 0 ? (
              recentBadges.map((badge, index) => (
                <FadeIn key={badge.id} delay={0.6 + index * 0.1}>
                  <BadgeCard 
                    badge={{
                      id: badge.id,
                      name: badge.name,
                      icon: badge.icon,
                      description: badge.description || '',
                      isUnlocked: true,
                      tier: badge.tier
                    }} 
                    size="lg" 
                    showDetails 
                  />
                </FadeIn>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No badges yet. Complete actions to earn badges!</p>
            )}
          </div>
        </section>

        {/* DEMO MODE - Responder ETA (Future Feature) */}
        {isDemoMode && demoResponders.length > 0 && (
          <section>
            <FadeIn delay={0.65}>
              <ResponderETA responders={demoResponders} />
            </FadeIn>
          </section>
        )}

        {/* Recent Activity */}
        <section>
          <FadeIn delay={0.7}>
            <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
          </FadeIn>
          <StaggerContainer className="space-y-3" staggerDelay={0.05}>
            {activeIncidents.length > 0 ? (
              activeIncidents.slice(0, 3).map(incident => (
                <StaggerItem key={incident.id}>
                  <motion.div 
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors cursor-pointer"
                    whileHover={{ x: 4 }}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      incident.type === 'sos' ? 'bg-emergency/20 text-emergency' :
                      incident.type === 'escort' ? 'bg-primary/20 text-primary' :
                      'bg-silent/20 text-silent'
                    }`}>
                      {incident.type === 'sos' ? <Shield className="w-5 h-5" /> :
                       incident.type === 'escort' ? <Users className="w-5 h-5" /> :
                       <Eye className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm capitalize">{incident.type} Alert</p>
                      <p className="text-xs text-muted-foreground">
                        {incident.location_lat && incident.location_lng 
                          ? `${incident.location_lat.toFixed(4)}, ${incident.location_lng.toFixed(4)}`
                          : 'Location not available'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        incident.status === 'resolved' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                      }`}>
                        {incident.status}
                      </span>
                    </div>
                  </motion.div>
                </StaggerItem>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            )}
          </StaggerContainer>
        </section>
      </main>

      <BottomNav />

      {/* SOS Modal */}
      <SOSModal
        open={showSOSModal}
        onClose={() => setShowSOSModal(false)}
        onSOSSent={handleSOSSent}
      />
    </PageTransition>
  );
};

export default Index;
