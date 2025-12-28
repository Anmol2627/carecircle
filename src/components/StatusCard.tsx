import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatusCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: number; isPositive: boolean };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'emergency';
  className?: string;
  onClick?: () => void;
}

const variantClasses = {
  default: 'bg-card',
  primary: 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20',
  success: 'bg-gradient-to-br from-success/10 to-success/5 border-success/20',
  warning: 'bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20',
  emergency: 'bg-gradient-to-br from-emergency/10 to-emergency/5 border-emergency/20',
};

const iconVariantClasses = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/20 text-primary',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
  emergency: 'bg-emergency/20 text-emergency',
};

export function StatusCard({
  title,
  value,
  icon,
  trend,
  variant = 'default',
  className,
  onClick,
}: StatusCardProps) {
  return (
    <motion.div
      className={cn(
        "relative p-4 rounded-2xl border border-border/50 shadow-sm overflow-hidden",
        variantClasses[variant],
        onClick && "cursor-pointer",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { scale: 1.02, y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <motion.p
            className="text-2xl font-bold tracking-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {value}
          </motion.p>
          {trend && (
            <motion.p
              className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-success" : "text-emergency"
              )}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </motion.p>
          )}
        </div>
        {icon && (
          <div className={cn(
            "p-2.5 rounded-xl",
            iconVariantClasses[variant]
          )}>
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface QuickActionCardProps {
  title: string;
  description?: string;
  icon: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'trust' | 'silent' | 'emergency';
  onClick?: () => void;
  className?: string;
}

const actionVariantClasses = {
  default: 'bg-card hover:bg-accent',
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  success: 'bg-success text-success-foreground hover:bg-success/90',
  trust: 'bg-trust text-trust-foreground hover:bg-trust/90',
  silent: 'bg-silent text-silent-foreground hover:bg-silent/90',
  emergency: 'bg-emergency text-emergency-foreground hover:bg-emergency/90',
};

export function QuickActionCard({
  title,
  description,
  icon,
  variant = 'default',
  onClick,
  className,
}: QuickActionCardProps) {
  return (
    <motion.button
      className={cn(
        "flex flex-col items-center justify-center p-4 rounded-2xl border border-border/50 shadow-sm text-center transition-all duration-200",
        actionVariantClasses[variant],
        className
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
    >
      <div className="p-3 rounded-xl bg-background/20 mb-2">
        {icon}
      </div>
      <span className="font-semibold text-sm">{title}</span>
      {description && (
        <span className="text-xs opacity-80 mt-0.5">{description}</span>
      )}
    </motion.button>
  );
}
