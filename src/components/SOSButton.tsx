import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Phone, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SOSButtonProps {
  onActivate: () => void;
  onCancel?: () => void;
  size?: 'default' | 'large';
  className?: string;
}

export function SOSButton({ 
  onActivate, 
  onCancel, 
  size = 'large',
  className 
}: SOSButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isActivated, setIsActivated] = useState(false);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const holdDuration = 2000; // 2 seconds to activate

  const startPress = useCallback(() => {
    setIsPressed(true);
    setProgress(0);
    
    const startTime = Date.now();
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / holdDuration) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
        setIsActivated(true);
        onActivate();
      }
    }, 16);
  }, [onActivate]);

  const endPress = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    setIsPressed(false);
    if (!isActivated) {
      setProgress(0);
    }
  }, [isActivated]);

  const handleCancel = useCallback(() => {
    setIsActivated(false);
    setProgress(0);
    onCancel?.();
  }, [onCancel]);

  const buttonSize = size === 'large' ? 'w-48 h-48' : 'w-32 h-32';
  const iconSize = size === 'large' ? 'w-16 h-16' : 'w-10 h-10';
  const ringSize = size === 'large' ? 180 : 120;
  const strokeWidth = size === 'large' ? 8 : 6;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Outer pulse rings */}
      <AnimatePresence>
        {!isActivated && (
          <>
            <motion.div
              className="absolute rounded-full bg-emergency/20"
              style={{ width: ringSize + 40, height: ringSize + 40 }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.2, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                repeatType: "loop",
              }}
            />
            <motion.div
              className="absolute rounded-full bg-emergency/10"
              style={{ width: ringSize + 80, height: ringSize + 80 }}
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.3, 0.1, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
                repeatType: "loop",
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Progress ring */}
      <svg
        className="absolute"
        width={ringSize}
        height={ringSize}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--emergency) / 0.2)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--emergency))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (progress / 100) * circumference}
          style={{
            filter: 'drop-shadow(0 0 10px hsl(var(--emergency)))',
          }}
        />
      </svg>

      {/* Main button */}
      <motion.button
        className={cn(
          buttonSize,
          "relative rounded-full flex flex-col items-center justify-center gap-2 text-emergency-foreground font-bold z-10",
          "bg-gradient-to-br from-emergency via-emergency to-emergency/80",
          "shadow-[0_0_40px_-10px_hsl(var(--emergency))]",
          "transition-shadow duration-300",
          isPressed && "shadow-[0_0_60px_0px_hsl(var(--emergency))]",
          isActivated && "from-success via-success to-success/80 shadow-[0_0_60px_0px_hsl(var(--success))]"
        )}
        onMouseDown={!isActivated ? startPress : undefined}
        onMouseUp={!isActivated ? endPress : undefined}
        onMouseLeave={!isActivated ? endPress : undefined}
        onTouchStart={!isActivated ? startPress : undefined}
        onTouchEnd={!isActivated ? endPress : undefined}
        whileTap={!isActivated ? { scale: 0.95 } : undefined}
        animate={isActivated ? { scale: [1, 1.05, 1] } : undefined}
        transition={{ duration: 0.5 }}
      >
        <AnimatePresence mode="wait">
          {!isActivated ? (
            <motion.div
              key="sos"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center gap-2"
            >
              <Shield className={iconSize} />
              <span className={size === 'large' ? 'text-2xl' : 'text-lg'}>
                {isPressed ? 'HOLD...' : 'SOS'}
              </span>
              {!isPressed && (
                <span className="text-xs opacity-80">Hold to activate</span>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="active"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center gap-2"
            >
              <Phone className={cn(iconSize, "animate-bounce-soft")} />
              <span className={size === 'large' ? 'text-xl' : 'text-base'}>
                HELP IS COMING
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Cancel button when activated */}
      <AnimatePresence>
        {isActivated && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute -bottom-16 flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-lg text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleCancel}
          >
            <X className="w-4 h-4" />
            <span className="text-sm font-medium">Cancel Alert</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
