import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search,
  Phone,
  Video,
  MoreVertical,
  MapPin,
  Shield,
  ChevronLeft
} from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { ChatBubble, ChatInput } from '@/components/ChatComponents';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/BottomNav';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '@/components/Animations';
import { useTrustedCircle } from '@/hooks/useTrustedCircle';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { useIncidents } from '@/hooks/useIncidents';
import { formatDistanceToNow } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';

const ChatPage = () => {
  const { user } = useAuth();
  const { trustedContacts } = useTrustedCircle();
  const { requestLocation } = useLocation();
  const { triggerSOS } = useIncidents();
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const { messages, sendMessage, getConversation, markAsRead, loading: messagesLoading } = useMessages(user?.id);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get conversation messages for selected contact
  const conversationMessages = selectedContact 
    ? getConversation(selectedContact.trusted_user_id || selectedContact.user_id)
    : [];

  // Mark messages as read when viewing conversation
  useEffect(() => {
    if (selectedContact && conversationMessages.length > 0) {
      conversationMessages
        .filter(msg => !msg.is_read && msg.receiver_id === user?.id)
        .forEach(msg => markAsRead(msg.id));
    }
  }, [selectedContact, conversationMessages, user, markAsRead]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  const handleSendMessage = async (content: string) => {
    if (!selectedContact || !content.trim()) return;

    try {
      const receiverId = selectedContact.trusted_user_id || selectedContact.user_id;
      await sendMessage(receiverId, content, 'text');
      scrollToBottom();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
    }
  };

  const handleShareLocation = async () => {
    if (!selectedContact) return;

    try {
      const position = await requestLocation();
      if (position) {
        const locationText = `📍 Location: ${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`;
        const receiverId = selectedContact.trusted_user_id || selectedContact.user_id;
        await sendMessage(receiverId, locationText, 'location');
        toast.success('Location shared');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to share location');
    }
  };

  const handleSendSOS = async () => {
    if (!selectedContact) return;

    try {
      const position = await requestLocation();
      if (position) {
        await triggerSOS('sos', position.latitude, position.longitude, 'SOS sent from chat');
        const receiverId = selectedContact.trusted_user_id || selectedContact.user_id;
        await sendMessage(receiverId, '🚨 SOS Alert Activated!', 'alert');
        toast.success('SOS sent to contact');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send SOS');
    }
  };

  // Get last message for each contact
  const getLastMessage = (contactId: string) => {
    const contactMessages = getConversation(contactId);
    return contactMessages[contactMessages.length - 1];
  };

  // Get unread count for contact
  const getUnreadCount = (contactId: string) => {
    const contactMessages = getConversation(contactId);
    return contactMessages.filter(msg => !msg.is_read && msg.receiver_id === user?.id).length;
  };

  if (!selectedContact) {
    return (
      <PageTransition className="min-h-screen bg-background pb-24">
        <Toaster position="top-center" />
        
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="container px-4 py-4">
            <FadeIn>
              <div className="flex items-center justify-between mb-4">
                <h1 className="font-bold text-2xl">Messages</h1>
                <Button variant="ghost" size="icon">
                  <Search className="w-5 h-5" />
                </Button>
              </div>
            </FadeIn>
            
            {/* Search */}
            <FadeIn delay={0.1}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border-0 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </FadeIn>
          </div>
        </header>

        <main className="container px-4 py-4">
          {trustedContacts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No trusted contacts yet</p>
              <p className="text-sm mt-2">Add contacts in Circle page to start chatting</p>
            </div>
          ) : (
            <StaggerContainer className="space-y-2" staggerDelay={0.05}>
              {trustedContacts.map(contact => {
                const lastMessage = getLastMessage(contact.trusted_user_id || contact.user_id);
                const unreadCount = getUnreadCount(contact.trusted_user_id || contact.user_id);
                const contactUser = contact.trusted_user || contact.user;

                return (
                  <StaggerItem key={contact.id}>
                    <motion.button
                      className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/20 transition-all text-left"
                      whileHover={{ x: 4 }}
                      onClick={() => setSelectedContact(contact)}
                    >
                      <Avatar
                        src={contactUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(contactUser?.full_name || 'User')}&background=6366f1&color=fff`}
                        alt={contactUser?.full_name || 'Contact'}
                        size="lg"
                        isOnline
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{contactUser?.full_name || 'Contact'}</p>
                          {lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {lastMessage 
                            ? (lastMessage.type === 'location' ? '📍 Location shared' : lastMessage.content)
                            : 'Tap to start a conversation'}
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                          {unreadCount}
                        </div>
                      )}
                    </motion.button>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          )}
        </main>

        <BottomNav />
      </PageTransition>
    );
  }

  const contactUser = selectedContact.trusted_user || selectedContact.user;

  return (
    <PageTransition className="min-h-screen bg-background flex flex-col">
      <Toaster position="top-center" />
      
      {/* Chat Header */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="container px-4 py-3">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon-sm"
              onClick={() => setSelectedContact(null)}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Avatar
              src={contactUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(contactUser?.full_name || 'User')}&background=6366f1&color=fff`}
              alt={contactUser?.full_name || 'Contact'}
              size="md"
              isOnline
            />
            <div className="flex-1">
              <p className="font-semibold">{contactUser?.full_name || 'Contact'}</p>
              <p className="text-xs text-success">Online</p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-sm">
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon-sm">
                <Video className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon-sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messagesLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p>Loading messages...</p>
          </div>
        ) : conversationMessages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No messages yet</p>
            <p className="text-sm mt-2">Start the conversation!</p>
          </div>
        ) : (
          conversationMessages.map(message => (
            <ChatBubble
              key={message.id}
              message={{
                id: message.id,
                senderId: message.sender_id,
                content: message.content,
                timestamp: message.created_at,
                isRead: message.is_read,
                type: message.type
              }}
              isOwn={message.sender_id === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Quick Actions */}
      <div className="px-4 py-2 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="rounded-full"
          onClick={handleShareLocation}
        >
          <MapPin className="w-4 h-4 mr-1" />
          Share Location
        </Button>
        <Button
          variant="emergency"
          size="sm"
          className="rounded-full"
          onClick={handleSendSOS}
        >
          <Shield className="w-4 h-4 mr-1" />
          Send SOS
        </Button>
      </div>

      {/* Input */}
      <div className="p-4 bg-card border-t border-border">
        <ChatInput onSend={handleSendMessage} />
      </div>
    </PageTransition>
  );
};

export default ChatPage;
