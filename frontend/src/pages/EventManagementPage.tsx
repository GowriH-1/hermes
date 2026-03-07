import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Users, Copy, Check, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../services/api';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { CreateEventModal } from '../components/CreateEventModal';
import { JoinEventModal } from '../components/JoinEventModal';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface Event {
  id: number;
  name: string;
  event_type: string;
  description?: string;
  event_date?: string;
  invite_code: string;
  participant_count: number;
  role: string;
}

export default function EventManagementPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState<{ eventId: number; eventName: string } | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const allEvents = await apiClient.getMyEvents();
      // Only show sponsor events
      const sponsorOnly = allEvents.filter((e: Event) => e.role === 'sponsor');
      setEvents(sponsorOnly);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleLeaveEvent = async () => {
    if (!confirmLeave) return;

    try {
      await apiClient.leaveEvent(confirmLeave.eventId);
      toast.success(`Successfully left "${confirmLeave.eventName}" as a sponsor`);
      loadEvents(); // Refresh the list
      setConfirmLeave(null);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to leave event');
      setConfirmLeave(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <TopNav />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <TopNav />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Event Management</h1>
          <p className="text-gray-600 dark:text-gray-300">Create events and give gifts to participants</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-500 hover:bg-primary-600 py-3"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Event
          </Button>
          <Button
            onClick={() => setShowJoinModal(true)}
            variant="outline"
            className="py-3"
          >
            <Users className="w-4 h-4 mr-2" />
            Join as Sponsor
          </Button>
        </div>

        {/* Sponsor Events */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-950/30 rounded-lg flex items-center justify-center text-2xl">
                💝
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sponsored Events</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Events where you're giving gifts
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 rounded-full text-sm font-medium">
              {events.length} events
            </span>
          </div>

          {events.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <div className="text-7xl mb-6">💝</div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Sponsored Events Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                  Create an event or join one as a sponsor to start matching with participants and giving gifts!
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => setShowCreateModal(true)}>
                    Create Event
                  </Button>
                  <Button onClick={() => setShowJoinModal(true)} variant="outline">
                    Join as Sponsor
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="h-full hover:shadow-lg transition-all border-2 dark:border-gray-600 hover:border-purple-200 dark:hover:border-purple-600">
                    <CardContent className="p-6">
                        {/* Header */}
                        <div className="mb-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white flex-1">
                              {event.name}
                            </h3>
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 text-xs font-medium rounded-full whitespace-nowrap ml-2">
                              Sponsor
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {event.event_type.replace('_', ' ')}
                            {event.event_date &&
                              ` • ${new Date(event.event_date).toLocaleDateString()}`}
                          </p>
                        </div>

                        {/* Description */}
                        {event.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                            {event.description}
                          </p>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4 pb-4 border-b dark:border-gray-700">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {event.participant_count || 0} participants
                          </span>
                        </div>

                        {/* Invite Code */}
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Invite Code</p>
                          <div className="flex items-center gap-2">
                            <code className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono font-bold rounded text-sm flex-1">
                              {event.invite_code}
                            </code>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleCopyInviteCode(event.invite_code);
                              }}
                              className={`p-2 rounded-lg transition-all ${
                                copiedCode === event.invite_code
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                              title="Copy invite code"
                            >
                              {copiedCode === event.invite_code ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                          <Link to={`/events/${event.id}/sponsor`} className="block">
                            <Button
                              size="sm"
                              className="w-full bg-purple-600 hover:bg-purple-700"
                            >
                              Start Gifting
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setConfirmLeave({ eventId: event.id, eventName: event.name });
                            }}
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Leave Event
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modals */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadEvents}
      />
      <JoinEventModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={loadEvents}
        sponsorOnly={true}
      />

      {/* Confirm Leave Dialog */}
      <ConfirmDialog
        isOpen={!!confirmLeave}
        title="Leave Event as Sponsor"
        message={`Are you sure you want to leave "${confirmLeave?.eventName}" as a sponsor? You will no longer be able to view participant wishlists or give gifts for this event.`}
        confirmText="Leave Event"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleLeaveEvent}
        onCancel={() => setConfirmLeave(null)}
      />
    </div>
  );
}
