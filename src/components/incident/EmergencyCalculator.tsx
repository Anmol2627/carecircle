// Fake calculator that can trigger silent SOS
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator } from 'lucide-react';
import { useIncidents } from '@/hooks/useIncidents';
import { useLocation } from '@/hooks/useLocation';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';

interface EmergencyCalculatorProps {
  onClose?: () => void;
}

export function EmergencyCalculator({ onClose }: EmergencyCalculatorProps) {
  const { triggerSOS } = useIncidents();
  const { requestLocation } = useLocation();
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [secretCode, setSecretCode] = useState<string[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Check if emergency calculator is enabled
    const checkEnabled = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('emergency_calculator_enabled')
        .eq('user_id', user.id)
        .single();

      setIsEnabled(profile?.emergency_calculator_enabled || false);
    };

    checkEnabled();
  }, []);

  const handleNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }

    // Track secret code (911 + Enter)
    setSecretCode(prev => {
      const newCode = [...prev, num].slice(-4);
      if (newCode.join('') === '911') {
        handleSecretTrigger();
      }
      return newCode;
    });
  };

  const handleOperation = (op: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(op);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return secondValue !== 0 ? firstValue / secondValue : 0;
      default:
        return secondValue;
    }
  };

  const handleEquals = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }

    // Check for secret code on Enter
    if (secretCode.join('') === '911') {
      handleSecretTrigger();
    }
    setSecretCode([]);
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
    setSecretCode([]);
  };

  const handleSecretTrigger = async () => {
    if (!isEnabled) return;

    try {
      const position = await requestLocation();
      if (!position) {
        toast.error('Unable to get location');
        return;
      }

      await triggerSOS(
        'sos',
        position.latitude,
        position.longitude,
        'Emergency calculator activated',
        {
          emergency_type: 'other',
          is_silent_alert: true,
          triggered_by_calculator: true,
        }
      );

      toast.success('Silent SOS sent!', {
        icon: '🔒',
        duration: 2000,
      });

      // Reset calculator
      handleClear();
      onClose?.();
    } catch (error: any) {
      console.error('Error triggering calculator SOS:', error);
      toast.error('Failed to send SOS');
    }
  };

  const buttons = [
    { label: 'C', action: 'clear', className: 'bg-muted' },
    { label: '÷', action: 'operation', className: 'bg-primary text-primary-foreground' },
    { label: '×', action: 'operation', className: 'bg-primary text-primary-foreground' },
    { label: '7', action: 'number' },
    { label: '8', action: 'number' },
    { label: '9', action: 'number' },
    { label: '-', action: 'operation', className: 'bg-primary text-primary-foreground' },
    { label: '4', action: 'number' },
    { label: '5', action: 'number' },
    { label: '6', action: 'number' },
    { label: '+', action: 'operation', className: 'bg-primary text-primary-foreground' },
    { label: '1', action: 'number' },
    { label: '2', action: 'number' },
    { label: '3', action: 'number' },
    { label: '=', action: 'equals', className: 'bg-success text-white row-span-2' },
    { label: '0', action: 'number', className: 'col-span-2' },
    { label: '.', action: 'number' },
  ];

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm"
      >
        <div className="bg-card rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              <span className="font-semibold">Calculator</span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-primary-foreground/80 hover:text-primary-foreground"
              >
                ✕
              </button>
            )}
          </div>

          {/* Display */}
          <div className="p-6 bg-muted">
            <div className="text-right text-4xl font-mono font-bold overflow-x-auto">
              {display}
            </div>
          </div>

          {/* Keypad */}
          <div className="p-4 grid grid-cols-4 gap-3">
            {buttons.map((button, index) => (
              <motion.button
                key={index}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (button.action === 'number') {
                    handleNumber(button.label);
                  } else if (button.action === 'operation') {
                    handleOperation(button.label);
                  } else if (button.action === 'equals') {
                    handleEquals();
                  } else if (button.action === 'clear') {
                    handleClear();
                  }
                }}
                className={`h-16 rounded-xl font-semibold text-lg transition-colors ${
                  button.className || 'bg-card hover:bg-muted border border-border'
                }`}
              >
                {button.label}
              </motion.button>
            ))}
          </div>

          {/* Secret hint (only visible if enabled) */}
          {isEnabled && (
            <div className="p-2 text-center text-xs text-muted-foreground">
              Emergency mode enabled
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

