import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Check, Calendar, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { apiClient } from '../services/api';

interface JoinEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  participantOnly?: boolean; // Hide role selection, force participant role
}

export const JoinEventModal: React.FC<JoinEventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  participantOnly = false,
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [role, setRole] = useState<'participant' | 'sponsor'>('participant');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [joinedEvent, setJoinedEvent] = useState<any>(null);
  const [joinedAsRole, setJoinedAsRole] = useState<string>('');

  // Trigger confetti when event is joined
  useEffect(() => {
    if (joinedEvent) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [joinedEvent]);

  const handleClose = () => {
    // If event was joined, refresh the events list
    if (joinedEvent) {
      onSuccess();
    }

    // Reset all state
    setInviteCode('');
    setRole('participant');
    setError('');
    setJoinedEvent(null);
    setJoinedAsRole('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!inviteCode.trim()) {
      setError('Invite code is required');
      return;
    }

    try {
      setLoading(true);
      const finalRole = participantOnly ? 'participant' : role;
      const event = await apiClient.joinEvent(inviteCode.trim(), finalRole);

      // Store joined event to show success screen
      setJoinedEvent(event);
      setJoinedAsRole(finalRole);
      // Don't call onSuccess() or onClose() here - wait for user to click "Done"
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Invalid invite code. Please check and try again.');
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.detail || 'You may have already joined this event.');
      } else {
        setError('Failed to join event. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-2xl max-w-md w-full"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-950/30 rounded-full flex items-center justify-center">
                    {joinedEvent ? (
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Users className="w-5 h-5 text-primary-500 dark:text-primary-400" />
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {joinedEvent ? 'Successfully Joined!' : 'Join Event'}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Success Panel or Form */}
              {joinedEvent ? (
                <div className="p-6 space-y-6">
                  {/* Success Icon */}
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center">
                      <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {joinedEvent.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      {joinedEvent.event_type?.replace('_', ' ')}
                      {joinedEvent.event_date && ` • ${new Date(joinedEvent.event_date).toLocaleDateString()}`}
                    </p>
                    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-primary-50 dark:bg-primary-950/30 rounded-full">
                      {joinedAsRole === 'participant' ? (
                        <>
                          <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                            Joined as Participant
                          </span>
                        </>
                      ) : (
                        <>
                          <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                            Joined as Sponsor
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-950/30 dark:to-purple-950/30 border-2 border-primary-200 dark:border-primary-700 rounded-lg p-6">
                    <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
                      {joinedAsRole === 'participant' ? (
                        <>
                          🎉 You can now create wishlist items and link them to this event.
                          Start building your wishlist!
                        </>
                      ) : (
                        <>
                          💝 You can now browse participant wishlists and find the perfect gifts to give.
                          Let's spread some joy!
                        </>
                      )}
                    </p>
                  </div>

                  {/* Close Button */}
                  <Button
                    onClick={handleClose}
                    className="w-full bg-primary-500 hover:bg-primary-600"
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {/* Invite Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Invite Code <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="e.g., ABC123XYZ"
                    required
                    className="w-full font-mono text-lg tracking-wider"
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter the invite code shared by the event organizer
                  </p>
                </div>

                {/* Role Selection - only show if not participantOnly */}
                {!participantOnly && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Join as
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('participant')}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          role === 'participant'
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 dark:border-primary-600'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="text-2xl mb-1">🎁</div>
                        <div className="font-semibold text-gray-900 dark:text-white">Participant</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Create wishlists and receive gifts
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole('sponsor')}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          role === 'sponsor'
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 dark:border-primary-600'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="text-2xl mb-1">💝</div>
                        <div className="font-semibold text-gray-900 dark:text-white">Sponsor</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Browse wishlists and give gifts
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {participantOnly ? (
                      <>💡 You'll join as a participant. Create wishlist items and link them to this event.</>
                    ) : role === 'participant' ? (
                      <>💡 As a participant, you can create wishlist items and link them to this event.</>
                    ) : (
                      <>💡 As a sponsor, you can browse participant wishlists and claim gifts to give.</>
                    )}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-primary-500 hover:bg-primary-600"
                    disabled={loading}
                  >
                    {loading ? 'Joining...' : 'Join Event'}
                  </Button>
                </div>
              </form>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
