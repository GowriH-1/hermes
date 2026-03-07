import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Users, Gift } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
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
      // Show all events (both participant and sponsor) for management
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Separate by role
  const sponsorEvents = events.filter((e) => e.role === 'sponsor');
  const participantEvents = events.filter((e) => e.role === 'participant');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Management</h1>
          <p className="text-gray-600">Create and manage your events</p>
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
            Join Event with Code
          </Button>
        </div>

        {/* Sponsor Events */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
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
              {sponsorEvents.length} events
            </span>
          </div>

          {sponsorEvents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">💝</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Sponsored Events Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Join an event as a sponsor to start matching with participants!
                </p>
                <Button onClick={() => setShowJoinModal(true)}>
                  Join as Sponsor
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sponsorEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Link to={`/events/${event.id}/sponsor`}>
                    <Card className="h-full hover:shadow-lg transition-all border-2 border-transparent hover:border-purple-200">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900 mb-1">
                              {event.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {event.event_type.replace('_', ' ')}
                              {event.event_date &&
                                ` • ${new Date(event.event_date).toLocaleDateString()}`}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full whitespace-nowrap">
                            Sponsor
                          </span>
                        </div>

                        {event.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {event.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {event.participant_count || 0}
                            </span>
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

        {/* Participant Events */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                🎁
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">My Events</h2>
                <p className="text-sm text-gray-500">
                  Events you've created or joined as participant
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {participantEvents.length} events
            </span>
          </div>

          {participantEvents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">🎁</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Events Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create or join an event to get started!
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setShowCreateModal(true)}>
                    Create Event
                  </Button>
                  <Button variant="outline" onClick={() => setShowJoinModal(true)}>
                    Join Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {participantEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="h-full hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-200">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 mb-1">
                            {event.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {event.event_type.replace('_', ' ')}
                            {event.event_date &&
                              ` • ${new Date(event.event_date).toLocaleDateString()}`}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full whitespace-nowrap">
                          Participant
                        </span>
                      </div>

                      {event.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {event.participant_count || 0}
                          </span>
                          <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                            {event.invite_code}
                          </code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* No Events State */}
        {events.length === 0 && (
          <Card>
            <CardContent className="text-center py-16">
              <div className="text-7xl mb-6">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to Event Management!
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create your first event or join one with an invite code to get started.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => setShowCreateModal(true)}
                  className="bg-primary-500 hover:bg-primary-600"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Event
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowJoinModal(true)}
                >
                  <Users className="w-5 h-5 mr-2" />
                  Join Event
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
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
