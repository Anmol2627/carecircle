// Multi-step profile setup component
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Camera, 
  Heart, 
  Phone, 
  Users, 
  Settings,
  ChevronRight,
  ChevronLeft,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface ProfileSetupProps {
  onComplete: () => void;
}

const STEPS = [
  { id: 1, title: 'Basic Info', icon: User },
  { id: 2, title: 'Profile Picture', icon: Camera },
  { id: 3, title: 'Medical Info', icon: Heart },
  { id: 4, title: 'Emergency Contacts', icon: Phone },
  { id: 5, title: 'Trusted Circle', icon: Users },
  { id: 6, title: 'Preferences', icon: Settings },
];

export function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    fullName: '',
    bio: '',
    phone: '',
    
    // Step 3: Medical Info
    bloodType: '',
    allergies: '',
    medications: '',
    medicalConditions: '',
    
    // Step 4: Emergency Contacts
    emergencyContacts: [{ name: '', phone: '', relationship: '' }],
    
    // Step 6: Preferences
    alertRadius: 1.0,
    receiveMedicalAlerts: true,
    receiveAssaultAlerts: true,
    receiveAccidentAlerts: true,
    receiveOtherAlerts: true,
    shakeToAlertEnabled: true,
    emergencyCalculatorEnabled: false,
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null;
    
    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length) {
      // Special handling for step 2 (avatar upload)
      if (currentStep === 2 && avatarFile) {
        setLoading(true);
        const uploadedUrl = await uploadAvatar();
        if (uploadedUrl) {
          setAvatarUrl(uploadedUrl);
        }
        setLoading(false);
      }
      
      setCurrentStep(currentStep + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          bio: formData.bio,
          phone: formData.phone,
          blood_type: formData.bloodType || null,
          allergies: formData.allergies || null,
          medications: formData.medications || null,
          medical_conditions: formData.medicalConditions || null,
          alert_radius_km: formData.alertRadius,
          receive_medical_alerts: formData.receiveMedicalAlerts,
          receive_assault_alerts: formData.receiveAssaultAlerts,
          receive_accident_alerts: formData.receiveAccidentAlerts,
          receive_other_alerts: formData.receiveOtherAlerts,
          shake_to_alert_enabled: formData.shakeToAlertEnabled,
          emergency_calculator_enabled: formData.emergencyCalculatorEnabled,
          avatar_url: avatarUrl || null,
        })
        .eq('user_id', user.id);
      
      if (profileError) throw profileError;
      
      // Save emergency contacts
      for (const contact of formData.emergencyContacts) {
        if (contact.name && contact.phone) {
          await supabase
            .from('emergency_contacts')
            .insert({
              user_id: user.id,
              name: contact.name,
              phone: contact.phone,
              relationship: contact.relationship || null,
            });
        }
      }
      
      toast.success('Profile setup complete!');
      onComplete();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const addEmergencyContact = () => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, { name: '', phone: '', relationship: '' }]
    }));
  };

  const removeEmergencyContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== index)
    }));
  };

  const updateEmergencyContact = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.map((contact, i) =>
        i === index ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1234567890"
                required
              />
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden mb-4">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <Label htmlFor="avatar" className="cursor-pointer">
                <Button variant="outline" asChild>
                  <span>
                    <Camera className="w-4 h-4 mr-2" />
                    Upload Photo
                  </span>
                </Button>
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </Label>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              You can skip this step and add a photo later
            </p>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="bloodType">Blood Type</Label>
              <Select value={formData.bloodType} onValueChange={(value) => handleInputChange('bloodType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select blood type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea
                id="allergies"
                value={formData.allergies}
                onChange={(e) => handleInputChange('allergies', e.target.value)}
                placeholder="List any allergies..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="medications">Current Medications</Label>
              <Textarea
                id="medications"
                value={formData.medications}
                onChange={(e) => handleInputChange('medications', e.target.value)}
                placeholder="List current medications..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="medicalConditions">Medical Conditions</Label>
              <Textarea
                id="medicalConditions"
                value={formData.medicalConditions}
                onChange={(e) => handleInputChange('medicalConditions', e.target.value)}
                placeholder="List any medical conditions..."
                rows={3}
              />
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Emergency Contacts</h3>
              <Button type="button" variant="outline" size="sm" onClick={addEmergencyContact}>
                Add Contact
              </Button>
            </div>
            {formData.emergencyContacts.map((contact, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Contact {index + 1}</span>
                  {formData.emergencyContacts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEmergencyContact(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={contact.name}
                    onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
                    placeholder="Contact name"
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => updateEmergencyContact(index, 'phone', e.target.value)}
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <Label>Relationship</Label>
                  <Input
                    value={contact.relationship}
                    onChange={(e) => updateEmergencyContact(index, 'relationship', e.target.value)}
                    placeholder="e.g., Parent, Friend"
                  />
                </div>
              </div>
            ))}
          </div>
        );
      
      case 5:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You can add trusted circle members later from the Circle page. 
              These are people who will always be notified of your emergencies.
            </p>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Trusted Circle:</strong> Add 3-5 people who will always receive alerts, 
                regardless of their location. You can manage this from the Circle tab.
              </p>
            </div>
          </div>
        );
      
      case 6:
        return (
          <div className="space-y-4">
            <div>
              <Label>Alert Radius: {formData.alertRadius} km</Label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={formData.alertRadius}
                onChange={(e) => handleInputChange('alertRadius', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="space-y-3">
              <Label>Emergency Type Preferences</Label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.receiveMedicalAlerts}
                    onChange={(e) => handleInputChange('receiveMedicalAlerts', e.target.checked)}
                    className="rounded"
                  />
                  <span>Medical Emergencies</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.receiveAssaultAlerts}
                    onChange={(e) => handleInputChange('receiveAssaultAlerts', e.target.checked)}
                    className="rounded"
                  />
                  <span>Assault Emergencies</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.receiveAccidentAlerts}
                    onChange={(e) => handleInputChange('receiveAccidentAlerts', e.target.checked)}
                    className="rounded"
                  />
                  <span>Accident Emergencies</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.receiveOtherAlerts}
                    onChange={(e) => handleInputChange('receiveOtherAlerts', e.target.checked)}
                    className="rounded"
                  />
                  <span>Other Emergencies</span>
                </label>
              </div>
            </div>
            <div className="space-y-3">
              <Label>Quick Alert Features</Label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.shakeToAlertEnabled}
                  onChange={(e) => handleInputChange('shakeToAlertEnabled', e.target.checked)}
                  className="rounded"
                />
                <span>Shake to Alert (shake phone 3x to send SOS)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.emergencyCalculatorEnabled}
                  onChange={(e) => handleInputChange('emergencyCalculatorEnabled', e.target.checked)}
                  className="rounded"
                />
                <span>Emergency Calculator (fake calculator for silent SOS)</span>
              </label>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isActive
                          ? 'bg-primary border-primary text-primary-foreground'
                          : isCompleted
                          ? 'bg-success border-success text-white'
                          : 'bg-muted border-muted-foreground text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`text-xs mt-2 text-center ${isActive ? 'font-semibold' : ''}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 ${
                        isCompleted ? 'bg-success' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-card rounded-2xl p-6 shadow-lg mb-6"
        >
          <h2 className="text-2xl font-bold mb-2">{STEPS[currentStep - 1].title}</h2>
          <p className="text-muted-foreground mb-6">
            Step {currentStep} of {STEPS.length}
          </p>
          {renderStep()}
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || loading}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={loading || (currentStep === 1 && !formData.fullName)}
          >
            {currentStep === STEPS.length ? 'Complete Setup' : 'Next'}
            {currentStep < STEPS.length && <ChevronRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

