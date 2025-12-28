// Rating screen for helpers after incident resolution
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Heart, Phone, Shield, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface Helper {
  id: string;
  helper_id: string;
  profile?: {
    full_name: string;
    avatar_url: string;
  };
  responded_at: string;
  arrived_at: string | null;
  status: string;
}

interface RatingScreenProps {
  incidentId: string;
  helpers: Helper[];
  onComplete: () => void;
}

export function RatingScreen({ incidentId, helpers, onComplete }: RatingScreenProps) {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Record<string, {
    rating: number;
    providedFirstAid: boolean;
    calledEmergencyServices: boolean;
    stayedUntilResolved: boolean;
    comfortedVictim: boolean;
    thankYouMessage: string;
  }>>({});

  const [submitting, setSubmitting] = useState(false);

  const updateRating = (helperId: string, field: string, value: any) => {
    setRatings(prev => ({
      ...prev,
      [helperId]: {
        ...prev[helperId],
        [field]: value,
        rating: prev[helperId]?.rating || 0,
        providedFirstAid: prev[helperId]?.providedFirstAid || false,
        calledEmergencyServices: prev[helperId]?.calledEmergencyServices || false,
        stayedUntilResolved: prev[helperId]?.stayedUntilResolved || false,
        comfortedVictim: prev[helperId]?.comfortedVictim || false,
        thankYouMessage: prev[helperId]?.thankYouMessage || '',
      }
    }));
  };

  const calculateResponseTime = (respondedAt: string, arrivedAt: string | null) => {
    const responded = new Date(respondedAt);
    const arrived = arrivedAt ? new Date(arrivedAt) : new Date();
    const minutes = Math.round((arrived.getTime() - responded.getTime()) / 60000);
    return minutes;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      for (const helper of helpers) {
        const rating = ratings[helper.id];
        if (!rating || rating.rating === 0) {
          toast.error(`Please rate ${helper.profile?.full_name || 'helper'}`);
          setSubmitting(false);
          return;
        }

        // Update incident_helpers with rating and feedback
        const { error } = await supabase
          .from('incident_helpers')
          .update({
            rating: rating.rating,
            thank_you_message: rating.thankYouMessage || null,
            provided_first_aid: rating.providedFirstAid,
            called_emergency_services: rating.calledEmergencyServices,
            stayed_until_resolved: rating.stayedUntilResolved,
            comforted_victim: rating.comfortedVictim,
          })
          .eq('id', helper.id);

        if (error) throw error;
      }

      toast.success('Thank you for rating your helpers!');
      onComplete();
    } catch (error: any) {
      console.error('Error submitting ratings:', error);
      toast.error(error.message || 'Failed to submit ratings');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Thank Your Helpers</h1>
            <p className="text-muted-foreground">
              Rate and provide feedback for the helpers who responded
            </p>
          </div>

          {helpers.map((helper, index) => {
            const rating = ratings[helper.id] || {
              rating: 0,
              providedFirstAid: false,
              calledEmergencyServices: false,
              stayedUntilResolved: false,
              comfortedVictim: false,
              thankYouMessage: '',
            };
            const responseTime = calculateResponseTime(helper.responded_at, helper.arrived_at);

            return (
              <motion.div
                key={helper.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 shadow-lg border"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {helper.profile?.avatar_url ? (
                      <img
                        src={helper.profile.avatar_url}
                        alt={helper.profile.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">👤</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">
                      {helper.profile?.full_name || 'Helper'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Response time: {responseTime} minutes
                    </p>
                  </div>
                </div>

                {/* Star Rating */}
                <div className="mb-4">
                  <Label className="mb-2 block">Rating *</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => updateRating(helper.id, 'rating', star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            star <= rating.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Checkboxes */}
                <div className="mb-4">
                  <Label className="mb-2 block">Actions Taken</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rating.providedFirstAid}
                        onChange={(e) =>
                          updateRating(helper.id, 'providedFirstAid', e.target.checked)
                        }
                        className="rounded"
                      />
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="text-sm">Provided first aid</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rating.calledEmergencyServices}
                        onChange={(e) =>
                          updateRating(helper.id, 'calledEmergencyServices', e.target.checked)
                        }
                        className="rounded"
                      />
                      <Phone className="w-4 h-4 text-primary" />
                      <span className="text-sm">Called emergency services</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rating.stayedUntilResolved}
                        onChange={(e) =>
                          updateRating(helper.id, 'stayedUntilResolved', e.target.checked)
                        }
                        className="rounded"
                      />
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span className="text-sm">Stayed until resolved</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rating.comfortedVictim}
                        onChange={(e) =>
                          updateRating(helper.id, 'comfortedVictim', e.target.checked)
                        }
                        className="rounded"
                      />
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="text-sm">Comforted me</span>
                    </label>
                  </div>
                </div>

                {/* Thank You Message */}
                <div>
                  <Label htmlFor={`message-${helper.id}`} className="mb-2 block">
                    Thank You Message (Optional)
                  </Label>
                  <Textarea
                    id={`message-${helper.id}`}
                    value={rating.thankYouMessage}
                    onChange={(e) =>
                      updateRating(helper.id, 'thankYouMessage', e.target.value)
                    }
                    placeholder="Thank you for your help..."
                    rows={3}
                  />
                </div>
              </motion.div>
            );
          })}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onComplete}
              className="flex-1"
              disabled={submitting}
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Ratings'}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

