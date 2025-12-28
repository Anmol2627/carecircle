import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, 
  MoreVertical, 
  MapPin, 
  Phone, 
  Shield,
  Star,
  Check,
  X
} from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/BottomNav';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '@/components/Animations';
import { useTrustedCircle } from '@/hooks/useTrustedCircle';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import toast, { Toaster } from 'react-hot-toast';
import { Input } from '@/components/ui/input';

const CirclePage = () => {
  const { user } = useAuth();
  const { trustedContacts, pendingRequests, addTrustedContact, acceptRequest, rejectRequest, removeTrustedContact } = useTrustedCircle();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleToggleEmergency = async (contactId: string) => {
    // This would require adding an is_emergency field to trusted_circles table
    // For now, just show a toast
    toast.success('Emergency contact preference updated');
  };

  const handleSearch = async (query: string) => {
    if (!query.trim() || !user) return;
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, level, points')
        .ilike('full_name', `%${query}%`)
        .neq('user_id', user.id)
        .limit(10);

      if (error) throw error;

      // Filter out users already in trusted circle
      const existingIds = new Set([
        ...trustedContacts.map(c => c.trusted_user_id),
        ...pendingRequests.map(c => c.trusted_user_id)
      ]);

      const filtered = (data || []).filter(p => !existingIds.has(p.user_id));
      setSearchResults(filtered);
    } catch (err: any) {
      toast.error(err.message || 'Failed to search');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddContact = async (userId: string) => {
    try {
      await addTrustedContact(userId);
      toast.success('Contact request sent!');
      setShowAddModal(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add contact');
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await acceptRequest(requestId);
      toast.success('Contact added to your circle!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept request');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectRequest(requestId);
      toast.success('Request rejected');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject request');
    }
  };

  const handleRemove = async (contactId: string) => {
    try {
      await removeTrustedContact(contactId);
      toast.success('Contact removed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove contact');
    }
  };

  // Emergency contacts (all accepted contacts are considered emergency contacts for now)
  const emergencyContacts = trustedContacts;

  return (
    <PageTransition className="min-h-screen bg-background pb-24">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container px-4 py-4">
          <div className="flex items-center justify-between">
            <FadeIn>
              <div>
                <h1 className="font-bold text-2xl">Trusted Circle</h1>
                <p className="text-sm text-muted-foreground">
                  {trustedContacts.length} trusted contacts
                  {pendingRequests.length > 0 && ` • ${pendingRequests.length} pending`}
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <Button 
                variant="premium" 
                size="sm"
                onClick={() => setShowAddModal(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </FadeIn>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <section>
            <FadeIn delay={0.1}>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-warning" />
                <h2 className="font-semibold text-lg">Pending Requests ({pendingRequests.length})</h2>
              </div>
            </FadeIn>
            <StaggerContainer className="space-y-3" staggerDelay={0.05}>
              {pendingRequests.map(request => (
                <StaggerItem key={request.id}>
                  <motion.div 
                    className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/20 transition-all"
                    whileHover={{ x: 4 }}
                  >
                    <Avatar
                      src={request.trusted_user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.trusted_user?.full_name || 'User')}&background=6366f1&color=fff`}
                      alt={request.trusted_user?.full_name || 'User'}
                      size="lg"
                      hasBorder
                      borderColor="warning"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{request.trusted_user?.full_name || 'User'}</p>
                      <p className="text-sm text-muted-foreground">Wants to add you</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="success" 
                        size="sm"
                        onClick={() => handleAccept(request.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleReject(request.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>
        )}

        {/* Emergency Contacts */}
        <section>
          <FadeIn delay={0.1}>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-emergency" />
              <h2 className="font-semibold text-lg">Trusted Contacts ({emergencyContacts.length})</h2>
            </div>
          </FadeIn>
          <StaggerContainer className="space-y-3" staggerDelay={0.05}>
            {emergencyContacts.length > 0 ? (
              emergencyContacts.map(contact => (
                <StaggerItem key={contact.id}>
                  <ContactCard 
                    contact={contact} 
                    onToggleEmergency={() => handleToggleEmergency(contact.id)}
                    onRemove={() => handleRemove(contact.id)}
                  />
                </StaggerItem>
              ))
            ) : (
              <FadeIn>
                <div className="text-center py-8 text-muted-foreground">
                  <p>No trusted contacts yet</p>
                  <p className="text-sm">Add contacts to build your safety network</p>
                </div>
              </FadeIn>
            )}
          </StaggerContainer>
        </section>
      </main>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end"
            onClick={() => {
              setShowAddModal(false);
              setSearchQuery('');
              setSearchResults([]);
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full bg-card rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-xl">Add Contact</h3>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    setShowAddModal(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Search */}
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className="w-full"
                />
              </div>

              {/* Search Results */}
              <div className="space-y-3">
                {isSearching ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p>Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(result => (
                    <motion.button
                      key={result.user_id}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors"
                      whileHover={{ x: 4 }}
                      onClick={() => handleAddContact(result.user_id)}
                    >
                      <Avatar 
                        src={result.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(result.full_name || 'User')}&background=6366f1&color=fff`} 
                        alt={result.full_name || 'User'} 
                        size="md" 
                      />
                      <div className="flex-1 text-left">
                        <p className="font-medium">{result.full_name || 'User'}</p>
                        <p className="text-sm text-muted-foreground">Level {result.level || 1}</p>
                      </div>
                      <UserPlus className="w-5 h-5 text-primary" />
                    </motion.button>
                  ))
                ) : searchQuery ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No users found
                  </p>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    Search for users to add to your circle
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </PageTransition>
  );
};

interface ContactCardProps {
  contact: any;
  onToggleEmergency: () => void;
  onRemove: () => void;
}

function ContactCard({ contact, onToggleEmergency, onRemove }: ContactCardProps) {
  return (
    <motion.div 
      className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/20 transition-all"
      whileHover={{ x: 4 }}
    >
      <Avatar
        src={contact.trusted_user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.trusted_user?.full_name || 'User')}&background=6366f1&color=fff`}
        alt={contact.trusted_user?.full_name || 'Contact'}
        size="lg"
        isOnline
        hasBorder={true}
        borderColor="trust"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold">{contact.trusted_user?.full_name || 'Contact'}</p>
          <span className="text-xs bg-emergency/20 text-emergency px-2 py-0.5 rounded-full">
            Trusted
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {contact.trusted_user?.phone || 'No phone number'}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="icon-sm">
          <Phone className="w-4 h-4" />
        </Button>
        <Button 
          variant="secondary" 
          size="icon-sm"
          onClick={onRemove}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

export default CirclePage;
