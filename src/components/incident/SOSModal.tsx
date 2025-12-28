// Enhanced SOS Modal with emergency type selection, voice notes, and auto-contact options
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Heart,
  Shield,
  Car,
  AlertCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Phone,
  Users,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useIncidents } from '@/hooks/useIncidents';
import { useLocation } from '@/hooks/useLocation';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';

interface SOSModalProps {
  open: boolean;
  onClose: () => void;
  onSOSSent: () => void;
}

const EMERGENCY_TYPES = [
  { id: 'medical', label: 'Medical', icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
  { id: 'assault', label: 'Assault', icon: Shield, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'accident', label: 'Accident', icon: Car, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { id: 'other', label: 'Other', icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
];

export function SOSModal({ open, onClose, onSOSSent }: SOSModalProps) {
  const { triggerSOS } = useIncidents();
  const { requestLocation } = useLocation();
  const [selectedType, setSelectedType] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isSilent, setIsSilent] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [autoContact, setAutoContact] = useState({
    campusSecurity: true,
    police: false,
    ambulance: false,
    trustedCircle: true,
  });
  const [isSending, setIsSending] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Auto-select police for assault, ambulance for medical
    if (selectedType === 'assault') {
      setAutoContact(prev => ({ ...prev, police: true }));
    } else if (selectedType === 'medical') {
      setAutoContact(prev => ({ ...prev, ambulance: true }));
    }
  }, [selectedType]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      toast.success('Recording stopped');
    }
  };

  const playRecording = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setAudioBlob(null);
    }
  };

  const uploadVoiceNote = async (): Promise<string | null> => {
    if (!audioBlob) return null;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const fileName = `voice-notes/${session.user.id}-${Date.now()}.webm`;
      const { data, error } = await supabase.storage
        .from('voice-notes')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('voice-notes')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading voice note:', error);
      toast.error('Failed to upload voice note');
      return null;
    }
  };

  const handleSendSOS = async () => {
    if (!selectedType) {
      toast.error('Please select an emergency type');
      return;
    }

    setIsSending(true);
    try {
      const position = await requestLocation();
      if (!position) {
        toast.error('Unable to get your location');
        setIsSending(false);
        return;
      }

      // Upload voice note if exists
      let voiceNoteUrl = null;
      if (audioBlob) {
        voiceNoteUrl = await uploadVoiceNote();
      }

      // Trigger SOS with all data
      await triggerSOS(
        'sos', // type
        position.latitude,
        position.longitude,
        description,
        {
          emergency_type: selectedType,
          voice_note_url: voiceNoteUrl,
          is_silent_alert: isSilent,
          auto_contact: autoContact,
        }
      );

      toast.success('SOS Alert Sent! Help is on the way.');
      onSOSSent();
      onClose();
      
      // Reset form
      setSelectedType('');
      setDescription('');
      setIsSilent(false);
      setAudioBlob(null);
      setAudioUrl(null);
    } catch (error: any) {
      console.error('Error sending SOS:', error);
      toast.error(error.message || 'Failed to send SOS');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Send SOS Alert</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Emergency Type Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Emergency Type *</Label>
            <div className="grid grid-cols-2 gap-3">
              {EMERGENCY_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                return (
                  <motion.button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${type.color}`} />
                    <span className="text-sm font-medium">{type.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your emergency..."
              rows={3}
              className="mt-2"
            />
          </div>

          {/* Voice Note Recording */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Voice Note (Optional)</Label>
            <div className="space-y-3">
              {!audioUrl ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={isRecording ? 'destructive' : 'outline'}
                    onClick={isRecording ? stopRecording : startRecording}
                    className="flex-1"
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-4 h-4 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 mr-2" />
                        Record Voice Note
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={playRecording}
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                  <span className="flex-1 text-sm">Voice note recorded</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={deleteRecording}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Silent Alert Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <Label className="font-semibold">Silent Alert</Label>
              <p className="text-xs text-muted-foreground">
                Send SOS without sound or vibration
              </p>
            </div>
            <Switch
              checked={isSilent}
              onCheckedChange={setIsSilent}
            />
          </div>

          {/* Auto-Contact Options */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Auto-Notify</Label>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <span>Campus Security</span>
                </div>
                <Switch
                  checked={autoContact.campusSecurity}
                  onCheckedChange={(checked) =>
                    setAutoContact(prev => ({ ...prev, campusSecurity: checked }))
                  }
                />
              </label>
              
              {selectedType === 'assault' && (
                <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-orange-500" />
                    <span>Police</span>
                  </div>
                  <Switch
                    checked={autoContact.police}
                    onCheckedChange={(checked) =>
                      setAutoContact(prev => ({ ...prev, police: checked }))
                    }
                  />
                </label>
              )}
              
              {selectedType === 'medical' && (
                <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span>Ambulance</span>
                  </div>
                  <Switch
                    checked={autoContact.ambulance}
                    onCheckedChange={(checked) =>
                      setAutoContact(prev => ({ ...prev, ambulance: checked }))
                    }
                  />
                </label>
              )}
              
              <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-success" />
                  <span>Trusted Circle</span>
                </div>
                <Switch
                  checked={autoContact.trustedCircle}
                  onCheckedChange={(checked) =>
                    setAutoContact(prev => ({ ...prev, trustedCircle: checked }))
                  }
                />
              </label>
            </div>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendSOS}
            disabled={!selectedType || isSending}
            className="w-full h-12 text-lg font-bold"
            variant="emergency"
          >
            {isSending ? 'Sending...' : 'Send SOS Alert'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


