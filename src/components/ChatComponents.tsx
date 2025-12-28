import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from './Avatar';
import type { ChatMessage } from '@/data/mockData';
import { mockUsers, currentUser } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface ChatBubbleProps {
  message: ChatMessage;
  isOwn?: boolean;
}

export function ChatBubble({ message, isOwn }: ChatBubbleProps) {
  const sender = message.senderId === 'current-user' 
    ? currentUser 
    : mockUsers.find(u => u.id === message.senderId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "flex gap-2 max-w-[85%]",
        isOwn ? "ml-auto flex-row-reverse" : ""
      )}
    >
      {!isOwn && sender && (
        <Avatar 
          src={sender.avatar} 
          alt={sender.name} 
          size="sm"
          isOnline
        />
      )}
      <div className={cn(
        "flex flex-col",
        isOwn ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "px-4 py-2.5 rounded-2xl",
          isOwn 
            ? "bg-primary text-primary-foreground rounded-br-sm" 
            : "bg-card border border-border rounded-bl-sm"
        )}>
          <p className="text-sm">{message.content}</p>
        </div>
        <div className="flex items-center gap-1 mt-1 px-1">
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </span>
          {isOwn && (
            <span className={cn(
              "text-[10px]",
              message.isRead ? "text-primary" : "text-muted-foreground"
            )}>
              {message.isRead ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
}

export function ChatInput({ onSend, placeholder = "Type a message..." }: ChatInputProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('message') as HTMLInputElement;
    if (input.value.trim()) {
      onSend(input.value);
      input.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        name="message"
        placeholder={placeholder}
        className="flex-1 px-4 py-3 rounded-xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
      />
      <motion.button
        type="submit"
        className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Send
      </motion.button>
    </form>
  );
}
