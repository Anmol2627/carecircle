// First-aid guidance component based on emergency type
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Heart, Shield, Car, AlertCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card } from '@/components/ui/card';

interface FirstAidGuideProps {
  emergencyType: 'medical' | 'assault' | 'accident' | 'other';
}

const FIRST_AID_GUIDES = {
  medical: [
    {
      step: 1,
      title: 'Check Responsiveness',
      description: 'Tap the person and shout "Are you okay?" If no response, call for help immediately.',
    },
    {
      step: 2,
      title: 'Check Breathing',
      description: 'Look for chest movement. If not breathing, begin CPR if trained.',
    },
    {
      step: 3,
      title: 'Check for Medical Alert Bracelet',
      description: 'Look for medical ID bracelet or necklace that may indicate allergies or conditions.',
    },
    {
      step: 4,
      title: 'Keep Person Comfortable',
      description: 'Loosen tight clothing, keep them warm, and do not give food or water unless conscious.',
    },
    {
      step: 5,
      title: 'Monitor Vital Signs',
      description: 'Check pulse and breathing regularly until medical help arrives.',
    },
  ],
  assault: [
    {
      step: 1,
      title: 'Ensure Safety',
      description: 'Make sure the area is safe. Do not put yourself in danger.',
    },
    {
      step: 2,
      title: 'Call Emergency Services',
      description: 'Call 911 immediately. Provide location and description of the situation.',
    },
    {
      step: 3,
      title: 'Provide Emotional Support',
      description: 'Stay calm and reassure the victim. Do not ask for details about the assault.',
    },
    {
      step: 4,
      title: 'Do Not Touch Evidence',
      description: 'Avoid touching anything that may be evidence. Preserve the scene if safe.',
    },
    {
      step: 5,
      title: 'Stay With Victim',
      description: 'Remain with the victim until help arrives. Offer comfort and support.',
    },
  ],
  accident: [
    {
      step: 1,
      title: 'Assess the Scene',
      description: 'Check for dangers (traffic, fire, etc.) before approaching. Ensure your safety first.',
    },
    {
      step: 2,
      title: 'Call Emergency Services',
      description: 'Call 911 immediately. Provide exact location and number of injured people.',
    },
    {
      step: 3,
      title: 'Do Not Move Injured Person',
      description: 'Unless in immediate danger, do not move the person. Spinal injuries may be present.',
    },
    {
      step: 4,
      title: 'Control Bleeding',
      description: 'Apply direct pressure to wounds with clean cloth. Elevate injured limb if possible.',
    },
    {
      step: 5,
      title: 'Keep Person Warm',
      description: 'Cover with blanket or clothing to prevent shock. Monitor breathing and consciousness.',
    },
  ],
  other: [
    {
      step: 1,
      title: 'Assess the Situation',
      description: 'Determine the nature of the emergency and any immediate dangers.',
    },
    {
      step: 2,
      title: 'Call for Help',
      description: 'Contact appropriate emergency services (911, campus security, etc.).',
    },
    {
      step: 3,
      title: 'Provide Basic Support',
      description: 'Keep the person calm, comfortable, and safe until help arrives.',
    },
    {
      step: 4,
      title: 'Follow Instructions',
      description: 'If emergency services provide instructions over the phone, follow them carefully.',
    },
    {
      step: 5,
      title: 'Stay Present',
      description: 'Remain with the person and monitor their condition until professional help arrives.',
    },
  ],
};

const EMERGENCY_ICONS = {
  medical: Heart,
  assault: Shield,
  accident: Car,
  other: AlertCircle,
};

export function FirstAidGuide({ emergencyType }: FirstAidGuideProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([1]));

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

  const guide = FIRST_AID_GUIDES[emergencyType];
  const Icon = EMERGENCY_ICONS[emergencyType];

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-lg">First-Aid Guidance</h3>
          <p className="text-sm text-muted-foreground">
            Follow these steps while waiting for help
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {guide.map((item, index) => {
          const isExpanded = expandedSteps.has(item.step);
          return (
            <Collapsible
              key={item.step}
              open={isExpanded}
              onOpenChange={() => toggleStep(item.step)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {item.step}
                    </div>
                    <span className="font-semibold text-left">{item.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 pl-11 text-sm text-muted-foreground"
                >
                  {item.description}
                </motion.div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
        <p className="text-xs text-warning-foreground">
          <strong>Important:</strong> These are general guidelines. Always follow instructions from 
          emergency services and medical professionals. If you are not trained in first aid, focus on 
          calling for help and keeping the person safe until professionals arrive.
        </p>
      </div>
    </Card>
  );
}

