import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';

export function TopNav() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left: Logo + Main Nav */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">Gift Portal</h1>
            </Link>

            {/* Main Navigation */}
            <div className="hidden md:flex space-x-1">
              <Link
                to="/wishlist"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/wishlist')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎁</span>
                  <span>Wishlist</span>
                </div>
              </Link>

              <Link
                to="/events"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/events')
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">💝</span>
                  <span>Event Management</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700 hidden sm:block">
              {user?.full_name}
            </span>
            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3 flex space-x-1">
          <Link
            to="/wishlist"
            className={`flex-1 px-3 py-2 rounded-lg font-medium text-center transition-colors ${
              isActive('/wishlist')
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <span>🎁</span>
              <span className="text-sm">Wishlist</span>
            </div>
          </Link>

          <Link
            to="/events"
            className={`flex-1 px-3 py-2 rounded-lg font-medium text-center transition-colors ${
              isActive('/events')
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <span>💝</span>
              <span className="text-sm">Events</span>
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}
