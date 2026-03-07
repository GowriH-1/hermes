import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { apiClient } from '../services/api';

interface JoinEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const JoinEventModal: React.FC<JoinEventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [role, setRole] = useState<'participant' | 'sponsor'>('participant');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!inviteCode.trim()) {
      setError('Invite code is required');
      return;
    }

    try {
      setLoading(true);
      const event = await apiClient.joinEvent(inviteCode.trim(), role);

      alert(`Successfully joined "${event.name}" as ${role}!`);

      onSuccess();
      onClose();

      // Reset form
      setInviteCode('');
      setRole('participant');
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
              className="bg-white rounded-lg shadow-2xl max-w-md w-full"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Join Event
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {/* Invite Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the invite code shared by the event organizer
                  </p>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Join as
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('participant')}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        role === 'participant'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">🎁</div>
                      <div className="font-semibold text-gray-900">Participant</div>
                      <div className="text-xs text-gray-500">
                        Create wishlists and receive gifts
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('sponsor')}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        role === 'sponsor'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">💝</div>
                      <div className="font-semibold text-gray-900">Sponsor</div>
                      <div className="text-xs text-gray-500">
                        Browse wishlists and give gifts
                      </div>
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    {role === 'participant' ? (
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
                    onClick={onClose}
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
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
