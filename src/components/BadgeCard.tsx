import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Badge } from '@/data/mockData';

interface BadgeCardProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

const tierColors = {
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-slate-300 to-slate-500',
  gold: 'from-yellow-400 to-amber-500',
  platinum: 'from-violet-400 to-purple-600',
};

const tierGlows = {
  bronze: 'shadow-amber-500/30',
  silver: 'shadow-slate-400/30',
  gold: 'shadow-yellow-500/50',
  platinum: 'shadow-purple-500/50',
};

export function BadgeCard({ badge, size = 'md', showDetails = false, className }: BadgeCardProps) {
  const sizeClasses = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-24 h-24 text-4xl',
  };

  return (
    <motion.div
      className={cn(
        "flex flex-col items-center gap-2",
        className
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={badge.isUnlocked ? { scale: 1.05 } : undefined}
    >
      <div
        className={cn(
          "relative rounded-2xl flex items-center justify-center",
          sizeClasses[size],
          badge.isUnlocked
            ? `bg-gradient-to-br ${tierColors[badge.tier]} shadow-lg ${tierGlows[badge.tier]}`
            : "bg-muted/50 grayscale",
          badge.tier === 'gold' && badge.isUnlocked && "animate-pulse-glow",
          badge.tier === 'platinum' && badge.isUnlocked && "animate-pulse-glow"
        )}
      >
        {/* Glow ring for unlocked badges */}
        {badge.isUnlocked && (badge.tier === 'gold' || badge.tier === 'platinum') && (
          <motion.div
            className={cn(
              "absolute inset-0 rounded-2xl",
              `bg-gradient-to-br ${tierColors[badge.tier]}`
            )}
            animate={{
              boxShadow: [
                `0 0 20px 5px hsl(var(--warning) / 0.3)`,
                `0 0 40px 10px hsl(var(--warning) / 0.5)`,
                `0 0 20px 5px hsl(var(--warning) / 0.3)`,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        
        <span className={cn(
          "relative z-10",
          !badge.isUnlocked && "opacity-50 blur-[1px]"
        )}>
          {badge.icon}
        </span>

        {/* Lock overlay */}
        {!badge.isUnlocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl">
            <span className="text-xs">🔒</span>
          </div>
        )}
      </div>

      {showDetails && (
        <div className="text-center">
          <p className={cn(
            "text-sm font-medium",
            !badge.isUnlocked && "text-muted-foreground"
          )}>
            {badge.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {badge.description}
          </p>
          {badge.isUnlocked && badge.unlockedAt && (
            <p className="text-xs text-success mt-1">
              Unlocked {new Date(badge.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
