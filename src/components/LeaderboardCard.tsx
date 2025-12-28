import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Avatar } from './Avatar';
import type { User } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  rank: number;
  user: User;
  points: number;
  change: number;
}

interface LeaderboardCardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  className?: string;
}

export function LeaderboardCard({ entries, currentUserId, className }: LeaderboardCardProps) {
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-glow-gold';
      case 2:
        return 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900';
      case 3:
        return 'bg-gradient-to-br from-amber-600 to-amber-700 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-3 h-3 text-success" />;
    if (change < 0) return <TrendingDown className="w-3 h-3 text-emergency" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {entries.map((entry, index) => (
        <motion.div
          key={entry.user.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
            entry.user.id === currentUserId
              ? "bg-primary/10 border-2 border-primary/30"
              : "bg-card border border-border hover:border-primary/20"
          )}
        >
          {/* Rank badge */}
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
            getRankStyle(entry.rank)
          )}>
            {entry.rank === 1 ? <Trophy className="w-4 h-4" /> : entry.rank}
          </div>

          {/* User info */}
          <Avatar 
            src={entry.user.avatar} 
            alt={entry.user.name}
            size="sm"
            hasBorder={entry.rank <= 3}
            borderColor={entry.rank === 1 ? 'trust' : 'primary'}
          />
          
          <div className="flex-1 min-w-0">
            <p className={cn(
              "font-semibold text-sm truncate",
              entry.user.id === currentUserId && "text-primary"
            )}>
              {entry.user.name}
              {entry.user.id === currentUserId && " (You)"}
            </p>
            <p className="text-xs text-muted-foreground">
              Level {entry.user.level}
            </p>
          </div>

          {/* Points and trend */}
          <div className="text-right">
            <motion.p
              className="font-bold text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 + 0.2 }}
            >
              {entry.points.toLocaleString()}
            </motion.p>
            <div className="flex items-center justify-end gap-1">
              {getTrendIcon(entry.change)}
              <span className={cn(
                "text-xs",
                entry.change > 0 && "text-success",
                entry.change < 0 && "text-emergency",
                entry.change === 0 && "text-muted-foreground"
              )}>
                {entry.change > 0 && '+'}
                {entry.change !== 0 ? entry.change : '-'}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
