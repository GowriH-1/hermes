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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">Gift Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 dark:text-gray-300">
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
          <Card>
            <CardHeader>
              <CardTitle>Dashboard</CardTitle>
              <CardDescription>Manage your events and wishlists</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link to="/wishlist">
                      <Button className="w-full">Manage Wishlist</Button>
                    </Link>
                    <Button
                      className="w-full"
                      variant="secondary"
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
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">My Events</h3>
                  {loading ? (
                    <p className="text-gray-500">Loading events...</p>
                  ) : events.length === 0 ? (
                    <p className="text-gray-500">No events yet. Create or join one!</p>
                  ) : (
                    <div className="space-y-3">
                      {events.map((event: any) => (
                        <Card key={event.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-lg">{event.name}</h4>
                                  {event.role && (
                                    <span
                                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        event.role === 'sponsor'
                                          ? 'bg-purple-100 text-purple-700'
                                          : 'bg-blue-100 text-blue-700'
                                      }`}
                                    >
                                      {event.role === 'sponsor' ? '💝 Sponsor' : '🎁 Participant'}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                  {event.event_type.replace('_', ' ')}
                                  {event.event_date && ` • ${new Date(event.event_date).toLocaleDateString()}`}
                                </p>
                                {event.description && (
                                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                                )}
                              </div>
                              <div className="flex gap-2 ml-4">
                                {event.role === 'sponsor' ? (
                                  <Link to={`/sponsor/${event.id}`}>
                                    <Button size="sm" className="bg-primary-500 hover:bg-primary-600">
                                      Match Gifts 🎯
                                    </Button>
                                  </Link>
                                ) : (
                                  <Link to={`/wishlist`}>
                                    <Button size="sm" variant="outline">
                                      Add Items
                                    </Button>
                                  </Link>
                                )}
                                <Link to={`/events/${event.id}`}>
                                  <Button size="sm" variant="outline">
                                    View
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
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
