import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Users } from 'lucide-react';
import { apiClient } from '../services/api';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { JoinEventModal } from '../components/JoinEventModal';

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

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const allEvents = await apiClient.getMyEvents();
      // Only show participant events
      const participantOnly = allEvents.filter((e: Event) => e.role === 'participant');
      setEvents(participantOnly);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <TopNav />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopNav />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Events</h1>
          <p className="text-gray-600 dark:text-gray-400">Events where you're participating</p>
        </div>

        {/* Quick Action */}
        <div className="mb-8">
          <Button
            onClick={() => setShowJoinModal(true)}
            className="h-20 w-full md:w-auto px-8 bg-green-500 hover:bg-green-600 text-lg"
          >
            <Plus className="w-6 h-6 mr-2" />
            Join Event with Invite Code
          </Button>
        </div>

        {/* Events List */}
        {events.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <div className="text-7xl mb-6">📅</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No Events Yet
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Join an event with an invite code to start building your wishlist!
              </p>
              <Button
                size="lg"
                onClick={() => setShowJoinModal(true)}
                className="bg-green-500 hover:bg-green-600"
              >
                <Plus className="w-5 h-5 mr-2" />
                Join Event
              </Button>
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
                <Card className="h-full hover:shadow-lg transition-all border-2 border-transparent hover:border-green-200">
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-xl text-gray-900 flex-1">
                          {event.name}
                        </h3>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full whitespace-nowrap ml-2">
                          Participant
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {event.event_type.replace('_', ' ')}
                        {event.event_date &&
                          ` • ${new Date(event.event_date).toLocaleDateString()}`}
                      </p>
                    </div>

                    {/* Description */}
                    {event.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {event.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 pb-4 border-b">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {event.participant_count || 0} members
                      </span>
                    </div>

                    {/* Invite Code */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Invite Code</p>
                      <code className="px-3 py-1.5 bg-gray-100 text-gray-900 font-mono font-bold rounded text-sm">
                        {event.invite_code}
                      </code>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <Link to={`/wishlist?event=${event.id}`} className="block">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          🎁 Manage Wishlist
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Join Modal */}
      <JoinEventModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={loadEvents}
      />
    </div>
  );
}
