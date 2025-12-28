// Hook for shake-to-alert feature
import { useEffect, useRef } from 'react';
import { useIncidents } from './useIncidents';
import { useLocation } from './useLocation';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';

interface UseShakeToAlertOptions {
  enabled?: boolean;
  shakeThreshold?: number; // Number of shakes required
  shakeWindow?: number; // Time window in ms
  onShakeDetected?: () => void;
}

export function useShakeToAlert(options: UseShakeToAlertOptions = {}) {
  const {
    enabled = true,
    shakeThreshold = 3,
    shakeWindow = 2000,
    onShakeDetected,
  } = options;

  const { triggerSOS } = useIncidents();
  const { requestLocation } = useLocation();
  const shakeCountRef = useRef(0);
  const lastShakeTimeRef = useRef<number>(0);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // Check user preference
    const checkPreference = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('shake_to_alert_enabled')
        .eq('user_id', user.id)
        .single();

      if (!profile?.shake_to_alert_enabled) {
        return; // Feature disabled by user
      }
    };

    checkPreference();

    // Device motion event handler
    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      if (isProcessingRef.current) return;

      const acceleration = event.acceleration;
      if (!acceleration) return;

      // Calculate total acceleration
      const totalAcceleration = Math.sqrt(
        Math.pow(acceleration.x || 0, 2) +
        Math.pow(acceleration.y || 0, 2) +
        Math.pow(acceleration.z || 0, 2)
      );

      // Threshold for detecting a shake (adjust based on testing)
      const shakeThreshold = 15; // m/s²

      if (totalAcceleration > shakeThreshold) {
        const now = Date.now();

        // Reset count if too much time has passed
        if (now - lastShakeTimeRef.current > shakeWindow) {
          shakeCountRef.current = 0;
        }

        shakeCountRef.current++;
        lastShakeTimeRef.current = now;

        // Check if we've reached the required number of shakes
        if (shakeCountRef.current >= shakeThreshold) {
          handleShakeDetected();
          shakeCountRef.current = 0; // Reset count
        }
      }
    };

    const handleShakeDetected = async () => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        onShakeDetected?.();

        // Request location
        const position = await requestLocation();
        if (!position) {
          toast.error('Unable to get location for shake alert');
          isProcessingRef.current = false;
          return;
        }

        // Trigger silent SOS
        await triggerSOS(
          'sos',
          position.latitude,
          position.longitude,
          'Shake-to-alert activated',
          {
            emergency_type: 'other',
            is_silent_alert: true,
            triggered_by_shake: true,
          }
        );

        toast.success('Silent SOS sent via shake detection!', {
          icon: '📱',
        });
      } catch (error: any) {
        console.error('Error triggering shake alert:', error);
        toast.error('Failed to send shake alert');
      } finally {
        // Reset after a delay to prevent multiple triggers
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 5000);
      }
    };

    // Request permission for device motion (iOS 13+)
    if (typeof DeviceMotionEvent !== 'undefined' && 
        typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      (DeviceMotionEvent as any).requestPermission()
        .then((response: string) => {
          if (response === 'granted') {
            window.addEventListener('devicemotion', handleDeviceMotion);
          }
        })
        .catch((error: Error) => {
          console.error('Error requesting device motion permission:', error);
        });
    } else {
      // Android and older iOS
      window.addEventListener('devicemotion', handleDeviceMotion);
    }

    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
    };
  }, [enabled, shakeThreshold, shakeWindow, triggerSOS, requestLocation, onShakeDetected]);

  return {
    isEnabled: enabled,
  };
}

