import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Copy } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { apiClient } from '../services/api';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EVENT_TYPES = [
  { value: 'hackathon', label: '🚀 Hackathon' },
  { value: 'birthday', label: '🎂 Birthday' },
  { value: 'wedding', label: '💒 Wedding' },
  { value: 'baby_shower', label: '👶 Baby Shower' },
  { value: 'graduation', label: '🎓 Graduation' },
  { value: 'holiday', label: '🎄 Holiday' },
  { value: 'other', label: '🎉 Other' },
];

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('hackathon');
  const [eventDate, setEventDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdEvent, setCreatedEvent] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyInviteCode = () => {
    if (createdEvent?.invite_code) {
      navigator.clipboard.writeText(createdEvent.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    // Reset all state
    setName('');
    setDescription('');
    setEventType('hackathon');
    setEventDate('');
    setError('');
    setCreatedEvent(null);
    setCopied(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Event name is required');
      return;
    }

    try {
      setLoading(true);

      // Convert date string to ISO datetime if provided
      let formattedDate = undefined;
      if (eventDate) {
        // HTML date input gives "YYYY-MM-DD", convert to ISO datetime
        formattedDate = `${eventDate}T00:00:00`;
      }

      const eventData = await apiClient.createEvent({
        name: name.trim(),
        description: description.trim() || undefined,
        event_type: eventType,
        event_date: formattedDate,
      });

      // Store created event to show invite code in UI
      setCreatedEvent(eventData);
      onSuccess();
    } catch (err: any) {
      console.error('Event creation error:', err.response?.data);

      // Handle Pydantic validation errors
      if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
        const errors = err.response.data.detail.map((e: any) =>
          `${e.loc.join('.')}: ${e.msg}`
        ).join(', ');
        setError(`Validation error: ${errors}`);
      } else {
        setError(err.response?.data?.detail || 'Failed to create event');
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
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">
                  {createdEvent ? 'Event Created!' : 'Create New Event'}
                </h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Success Panel or Form */}
              {createdEvent ? (
                /* Success Panel with Invite Code */
                <div className="p-6 space-y-6">
                  {/* Success Icon */}
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {createdEvent.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {EVENT_TYPES.find((t) => t.value === createdEvent.event_type)?.label || createdEvent.event_type}
                    </p>
                  </div>

                  {/* Invite Code Display */}
                  <div className="bg-gradient-to-br from-primary-50 to-purple-50 border-2 border-primary-200 rounded-lg p-6">
                    <p className="text-sm font-medium text-gray-700 mb-3 text-center">
                      Share this invite code:
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <code className="text-3xl font-bold text-primary-600 tracking-wider">
                        {createdEvent.invite_code}
                      </code>
                      <button
                        onClick={handleCopyInviteCode}
                        className={`p-2 rounded-lg transition-all ${
                          copied
                            ? 'bg-green-500 text-white'
                            : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
                        }`}
                        title="Copy invite code"
                      >
                        {copied ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-3 text-center">
                      {copied ? '✓ Copied to clipboard!' : 'Click the copy button to share with participants'}
                    </p>
                  </div>

                  {/* Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700">
                      💡 Participants and sponsors can join your event using this invite code.
                      You can find it anytime in your event dashboard.
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
                /* Creation Form */
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {/* Event Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Tech Hackathon 2026"
                    required
                    className="w-full"
                  />
                </div>

                {/* Event Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Type
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Event Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Date (Optional)
                  </label>
                  <Input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell participants about this event..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    💡 After creating the event, you'll receive an invite code to share with participants and sponsors.
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
                    {loading ? 'Creating...' : 'Create Event'}
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
