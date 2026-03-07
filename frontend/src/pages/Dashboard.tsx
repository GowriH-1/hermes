import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { CreateEventModal } from '../components/CreateEventModal';
import { JoinEventModal } from '../components/JoinEventModal';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await apiClient.getMyEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Split events by role
  const participantEvents = events.filter((e: any) => e.role === 'participant');
  const sponsorEvents = events.filter((e: any) => e.role === 'sponsor');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">Gift Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {user?.full_name}!
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Quick Actions */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  className="w-full bg-primary-500 hover:bg-primary-600"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Event
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setShowJoinModal(true)}
                >
                  Join Event
                </Button>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Participant Events Section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                      🎁
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">My Wishlists</h2>
                      <p className="text-sm text-gray-500">
                        Events where you're receiving gifts
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
                        No Participant Events Yet
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Create an event or join one to start building your wishlist!
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
                    {participantEvents.map((event: any) => (
                      <Link
                        key={event.id}
                        to={`/events/${event.id}/participant`}
                        className="block"
                      >
                        <Card className="hover:shadow-lg transition-all hover:scale-[1.02] h-full border-2 border-transparent hover:border-blue-200">
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
                                  👥 {event.participant_count || 0}
                                </span>
                              </div>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                Manage Wishlist →
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              {/* Sponsor Events Section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                      💝
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">My Sponsored Events</h2>
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
                        No Sponsor Events Yet
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Join an event as a sponsor to start matching with participants!
                      </p>
                      <Button onClick={() => setShowJoinModal(true)}>
                        Join as Sponsor
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sponsorEvents.map((event: any) => (
                      <Link
                        key={event.id}
                        to={`/events/${event.id}/sponsor`}
                        className="block"
                      >
                        <Card className="hover:shadow-lg transition-all hover:scale-[1.02] h-full border-2 border-transparent hover:border-purple-200">
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
                                  👥 {event.participant_count || 0}
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
                    ))}
                  </div>
                )}
              </section>

              {/* No Events State */}
              {participantEvents.length === 0 && sponsorEvents.length === 0 && (
                <Card>
                  <CardContent className="text-center py-16">
                    <div className="text-7xl mb-6">🎉</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Welcome to Gift Portal!
                    </h2>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Get started by creating an event or joining one with an invite code.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button
                        size="lg"
                        onClick={() => setShowCreateModal(true)}
                        className="bg-primary-500 hover:bg-primary-600"
                      >
                        Create Your First Event
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => setShowJoinModal(true)}
                      >
                        Join an Event
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
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
