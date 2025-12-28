// DEMO MODE COMPONENT - Can be removed when demo mode is removed
// Shows ETA of responders (future feature)

import { motion } from 'framer-motion';
import { Clock, MapPin, Users, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/Avatar';

interface Responder {
  id: string;
  name: string;
  avatar?: string;
  eta: number; // minutes
  distance: number; // km
  status: 'en_route' | 'arriving' | 'arrived';
}

interface ResponderETAProps {
  responders: Responder[];
}

export function ResponderETA({ responders }: ResponderETAProps) {
  const sortedResponders = [...responders].sort((a, b) => a.eta - b.eta);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">Responders ETA</h3>
        <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
          {responders.length} Responding
        </span>
      </div>

      <div className="space-y-2">
        {sortedResponders.map((responder, index) => (
          <motion.div
            key={responder.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
          >
            <Avatar
              src={responder.avatar}
              name={responder.name}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm truncate">{responder.name}</span>
                {index === 0 && (
                  <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Fastest
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{responder.eta} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{responder.distance.toFixed(1)} km</span>
                </div>
              </div>
            </div>
            <div className={`w-2 h-2 rounded-full ${
              responder.status === 'arrived' ? 'bg-success' :
              responder.status === 'arriving' ? 'bg-warning animate-pulse' :
              'bg-primary'
            }`} />
          </motion.div>
        ))}
      </div>

      {sortedResponders.length > 0 && (
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Fastest responder</span>
            <span className="font-semibold">
              {sortedResponders[0].name} - {sortedResponders[0].eta} min
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

