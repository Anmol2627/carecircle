// Group chat component for active incidents
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MapPin, Phone, Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/Avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface IncidentChatProps {
  incidentId: string;
  onClose?: () => void;
}

interface ChatMessage {
  id: number;
  sender_id: string;
  message: string;
  message_type: string;
  created_at: string;
  profile?: {
    full_name: string;
    avatar_url: string;
  };
}

const QUICK_ACTIONS = [
  { id: 'eta', label: "I'm 2 mins away", icon: MapPin },
  { id: 'calling', label: 'Calling 911 now', icon: Phone },
  { id: 'firstaid', label: 'I have first aid supplies', icon: Heart },
];

export function IncidentChat({ incidentId, onClose }: IncidentChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
  }, [incidentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('incident_chat')
        .select(`
          *,
          profile:profiles!incident_chat_sender_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`incident-chat-${incidentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'incident_chat',
          filter: `incident_id=eq.${incidentId}`,
        },
        (payload) => {
          loadMessages(); // Reload to get profile data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (text: string, type: string = 'text') => {
    if (!text.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('incident_chat')
        .insert({
          incident_id: incidentId,
          sender_id: user.id,
          message: text,
          message_type: type,
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const sendQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    sendMessage(action.label, 'quick_action');
  };

  const shareLocation = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const locationText = `${position.coords.latitude}, ${position.coords.longitude}`;
      sendMessage(locationText, 'location');
    } catch (error) {
      toast.error('Failed to get location');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b bg-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Incident Chat</h3>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {loading ? (
          <div className="text-center text-muted-foreground">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === user?.id;
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                <Avatar
                  src={message.profile?.avatar_url}
                  name={message.profile?.full_name || 'User'}
                  size="sm"
                />
                <div className={`flex-1 max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {message.message_type === 'quick_action' && (
                      <div className="flex items-center gap-2 mb-1">
                        {QUICK_ACTIONS.find(a => message.message.includes(a.label))?.icon && (
                          <QUICK_ACTIONS.find(a => message.message.includes(a.label))!.icon className="w-4 h-4" />
                        )}
                      </div>
                    )}
                    <p className="text-sm">{message.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {formatTime(message.created_at)}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="p-2 border-t bg-card">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                onClick={() => sendQuickAction(action)}
                className="whitespace-nowrap"
              >
                <Icon className="w-3 h-3 mr-1" />
                {action.label}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={shareLocation}
            className="whitespace-nowrap"
          >
            <MapPin className="w-3 h-3 mr-1" />
            Share Location
          </Button>
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-card">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                sendMessage(newMessage);
              }
            }}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button
            onClick={() => sendMessage(newMessage)}
            disabled={!newMessage.trim()}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

