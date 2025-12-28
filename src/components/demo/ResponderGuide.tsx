// DEMO MODE COMPONENT - Can be removed when demo mode is removed
// Shows situation-specific guide for responders (future feature)

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Shield, 
  Car, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  CheckCircle2,
  Phone,
  MapPin,
  Users
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type EmergencyType = 'medical' | 'assault' | 'accident' | 'other';

interface ResponderGuideProps {
  emergencyType: EmergencyType;
  victimInfo?: {
    bloodType?: string;
    allergies?: string;
    medications?: string;
  };
}

const GUIDE_STEPS = {
  medical: [
    {
      step: 1,
      title: 'Assess the Scene',
      icon: AlertCircle,
      description: 'Check for immediate dangers. Ensure your safety first.',
      actions: ['Look for hazards', 'Check victim responsiveness', 'Call 911 if not already called'],
    },
    {
      step: 2,
      title: 'Check Medical Information',
      icon: Heart,
      description: 'Look for medical alert bracelet. Check victim\'s medical info if available.',
      actions: ['Check for medical ID', 'Review allergies/medications', 'Note blood type if visible'],
    },
    {
      step: 3,
      title: 'Provide First Aid',
      icon: Heart,
      description: 'Apply basic first aid based on the situation.',
      actions: ['Check breathing', 'Control bleeding if present', 'Keep victim comfortable'],
    },
    {
      step: 4,
      title: 'Coordinate with Others',
      icon: Users,
      description: 'Work with other responders and emergency services.',
      actions: ['Share your ETA', 'Coordinate approach', 'Update status'],
    },
  ],
  assault: [
    {
      step: 1,
      title: 'Ensure Safety',
      icon: Shield,
      description: 'Make sure the area is safe before approaching.',
      actions: ['Assess threat level', 'Ensure attacker is gone', 'Call police if not done'],
    },
    {
      step: 2,
      title: 'Provide Emotional Support',
      icon: Heart,
      description: 'Victim may be in shock. Provide calm, reassuring presence.',
      actions: ['Stay calm', 'Don\'t ask for details', 'Reassure victim'],
    },
    {
      step: 3,
      title: 'Preserve Evidence',
      icon: AlertCircle,
      description: 'Do not disturb the scene. Let professionals handle evidence.',
      actions: ['Don\'t touch anything', 'Note your observations', 'Wait for police'],
    },
    {
      step: 4,
      title: 'Stay Until Help Arrives',
      icon: Users,
      description: 'Remain with victim until professional help arrives.',
      actions: ['Stay present', 'Monitor victim', 'Coordinate with others'],
    },
  ],
  accident: [
    {
      step: 1,
      title: 'Secure the Scene',
      icon: Shield,
      description: 'Prevent further accidents. Make area visible to others.',
      actions: ['Set up warning signs', 'Turn on hazard lights', 'Direct traffic if safe'],
    },
    {
      step: 2,
      title: 'Assess Injuries',
      icon: Heart,
      description: 'Check all involved parties. Do not move injured unless in immediate danger.',
      actions: ['Check all victims', 'Don\'t move unless necessary', 'Note injury locations'],
    },
    {
      step: 3,
      title: 'Control Bleeding',
      icon: Heart,
      description: 'Apply direct pressure to wounds. Elevate if possible.',
      actions: ['Apply pressure', 'Use clean cloth', 'Elevate injured limb'],
    },
    {
      step: 4,
      title: 'Coordinate Response',
      icon: Phone,
      description: 'Work with emergency services and other responders.',
      actions: ['Update ETA', 'Share information', 'Follow instructions'],
    },
  ],
  other: [
    {
      step: 1,
      title: 'Assess Situation',
      icon: AlertCircle,
      description: 'Understand what type of emergency this is.',
      actions: ['Observe carefully', 'Identify emergency type', 'Check for dangers'],
    },
    {
      step: 2,
      title: 'Provide Support',
      icon: Heart,
      description: 'Offer appropriate help based on the situation.',
      actions: ['Stay calm', 'Reassure victim', 'Provide comfort'],
    },
    {
      step: 3,
      title: 'Coordinate Help',
      icon: Users,
      description: 'Work with other responders and emergency services.',
      actions: ['Share updates', 'Coordinate approach', 'Follow protocols'],
    },
  ],
};

export function ResponderGuide({ emergencyType, victimInfo }: ResponderGuideProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([1]));
  const steps = GUIDE_STEPS[emergencyType] || GUIDE_STEPS.other;

  const toggleStep = (step: number) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(step)) {
        newSet.delete(step);
      } else {
        newSet.add(step);
      }
      return newSet;
    });
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">Responder Guide</h3>
        <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
          {emergencyType.charAt(0).toUpperCase() + emergencyType.slice(1)} Emergency
        </span>
      </div>

      {/* Victim Medical Info (if available) */}
      {victimInfo && (victimInfo.bloodType || victimInfo.allergies || victimInfo.medications) && (
        <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg mb-4">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Heart className="w-4 h-4 text-warning" />
            Victim Medical Information
          </h4>
          <div className="space-y-1 text-xs">
            {victimInfo.bloodType && (
              <div><strong>Blood Type:</strong> {victimInfo.bloodType}</div>
            )}
            {victimInfo.allergies && (
              <div><strong>Allergies:</strong> {victimInfo.allergies}</div>
            )}
            {victimInfo.medications && (
              <div><strong>Medications:</strong> {victimInfo.medications}</div>
            )}
          </div>
        </div>
      )}

      {/* Guide Steps */}
      <div className="space-y-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isExpanded = expandedSteps.has(step.step);
          
          return (
            <Collapsible
              key={step.step}
              open={isExpanded}
              onOpenChange={() => toggleStep(step.step)}
            >
              <CollapsibleTrigger className="w-full">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {step.step}
                    </div>
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-left">{step.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </motion.div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 pl-11 space-y-2"
                >
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  <div className="space-y-1">
                    {step.actions.map((action, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="w-3 h-3 text-success flex-shrink-0" />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="pt-3 border-t">
        <h4 className="font-semibold text-sm mb-2">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center gap-2 p-2 bg-primary/10 hover:bg-primary/20 rounded-lg text-xs transition-colors">
            <Phone className="w-4 h-4" />
            Call 911
          </button>
          <button className="flex items-center gap-2 p-2 bg-primary/10 hover:bg-primary/20 rounded-lg text-xs transition-colors">
            <MapPin className="w-4 h-4" />
            Share Location
          </button>
          <button className="flex items-center gap-2 p-2 bg-primary/10 hover:bg-primary/20 rounded-lg text-xs transition-colors">
            <Users className="w-4 h-4" />
            Update ETA
          </button>
          <button className="flex items-center gap-2 p-2 bg-primary/10 hover:bg-primary/20 rounded-lg text-xs transition-colors">
            <CheckCircle2 className="w-4 h-4" />
            Mark Arrived
          </button>
        </div>
      </div>
    </Card>
  );
}

