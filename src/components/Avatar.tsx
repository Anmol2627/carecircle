import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  hasBorder?: boolean;
  borderColor?: 'primary' | 'success' | 'emergency' | 'trust';
  className?: string;
}

const sizeClasses = {
  xs: 'w-8 h-8',
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const borderClasses = {
  primary: 'ring-primary',
  success: 'ring-success',
  emergency: 'ring-emergency',
  trust: 'ring-trust',
};

export function Avatar({
  src,
  alt,
  size = 'md',
  isOnline,
  hasBorder = false,
  borderColor = 'primary',
  className,
}: AvatarProps) {
  return (
    <div className={cn("relative inline-block", className)}>
      <motion.img
        src={src}
        alt={alt}
        className={cn(
          "rounded-full object-cover",
          sizeClasses[size],
          hasBorder && `ring-2 ring-offset-2 ring-offset-background ${borderClasses[borderColor]}`
        )}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      />
      {isOnline !== undefined && (
        <motion.span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-background",
            size === 'xs' ? 'w-2 h-2' : size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3',
            isOnline ? 'bg-success' : 'bg-muted-foreground'
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        />
      )}
    </div>
  );
}

interface AvatarGroupProps {
  avatars: { src: string; alt: string }[];
  max?: number;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function AvatarGroup({ avatars, max = 4, size = 'sm', className }: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {visibleAvatars.map((avatar, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Avatar
            src={avatar.src}
            alt={avatar.alt}
            size={size}
            hasBorder
            borderColor="primary"
          />
        </motion.div>
      ))}
      {remaining > 0 && (
        <motion.div
          className={cn(
            "flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium ring-2 ring-background",
            sizeClasses[size]
          )}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: max * 0.1 }}
        >
          <span className="text-xs">+{remaining}</span>
        </motion.div>
      )}
    </div>
  );
}
