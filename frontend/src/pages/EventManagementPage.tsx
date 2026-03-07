import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Users } from 'lucide-react';
import { apiClient } from '../services/api';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { CreateEventModal } from '../components/CreateEventModal';
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

export default function EventManagementPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Event Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Create events and give gifts to participants</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="h-20 bg-primary-500 hover:bg-primary-600 text-lg"
          >
            <Plus className="w-6 h-6 mr-2" />
            Create New Event
          </Button>
          <Button
            onClick={() => setShowJoinModal(true)}
            variant="outline"
            className="h-20 text-lg"
          >
            <Users className="w-6 h-6 mr-2" />
            Join as Sponsor
          </Button>
        </div>

        {/* Sponsor Events */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                💝
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Sponsored Events</h2>
                <p className="text-sm text-gray-500">
                  Events where you're giving gifts
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
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
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Create an event or join one as a sponsor to start matching with participants and giving gifts!
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => setShowCreateModal(true)} size="lg">
                    Create Event
                  </Button>
                  <Button onClick={() => setShowJoinModal(true)} variant="outline" size="lg">
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
                  <Link to={`/events/${event.id}/sponsor`}>
                    <Card className="h-full hover:shadow-lg transition-all border-2 border-transparent hover:border-purple-200">
                      <CardContent className="p-6">
                        {/* Header */}
                        <div className="mb-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-xl text-gray-900 flex-1">
                              {event.name}
                            </h3>
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full whitespace-nowrap ml-2">
                              Sponsor
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
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Users className="w-4 h-4" />
                            {event.participant_count || 0} participants
                          </div>
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Find Matches →
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
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
      />
    </div>
  );
}
