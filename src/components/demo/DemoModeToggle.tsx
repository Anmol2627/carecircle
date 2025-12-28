// DEMO MODE COMPONENT - Can be removed when demo mode is removed
// Toggle button to enable/disable demo mode

import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useDemoMode } from '@/contexts/DemoModeContext';

export function DemoModeToggle() {
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed bottom-20 right-4 z-50 bg-card/80 backdrop-blur-sm border shadow-lg"
          title="Demo Mode Settings"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Demo Mode</DialogTitle>
          <DialogDescription>
            Enable demo mode to see future features like responder ETA, situation guides, and more.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="demo-mode" className="text-base font-semibold">
                Enable Demo Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                Show preview of upcoming features
              </p>
            </div>
            <Switch
              id="demo-mode"
              checked={isDemoMode}
              onCheckedChange={toggleDemoMode}
            />
          </div>
          
          {isDemoMode && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-primary-foreground">
                <strong>Demo Mode Active:</strong> Future features are now visible throughout the app.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

