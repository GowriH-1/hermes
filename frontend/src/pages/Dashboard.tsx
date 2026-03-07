import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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
                    <Button className="w-full" variant="secondary">
                      Create Event
                    </Button>
                    <Button className="w-full" variant="outline">
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
                    <div className="space-y-2">
                      {events.map((event: any) => (
                        <Link key={event.id} to={`/events/${event.id}`}>
                          <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <h4 className="font-semibold">{event.name}</h4>
                              <p className="text-sm text-gray-500">{event.event_type}</p>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
