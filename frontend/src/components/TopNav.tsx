import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/Button';

export function TopNav() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white dark:bg-[#0a0a0a] shadow-sm border-b dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left: Logo + Main Nav */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link to="/wishlist" className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Gift Portal</h1>
            </Link>

            {/* Main Navigation */}
            <div className="hidden md:flex space-x-1">
              <Link
                to="/wishlist"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/wishlist')
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                  location.pathname === '/events'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">📅</span>
                  <span>Events</span>
                </div>
              </Link>

              <Link
                to="/event-management"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/event-management')
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
            <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:block">
              {user?.full_name}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3 flex space-x-1">
          <Link
            to="/wishlist"
            className={`flex-1 px-2 py-2 rounded-lg font-medium text-center transition-colors ${
              isActive('/wishlist')
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <span>🎁</span>
              <span className="text-xs">Wishlist</span>
            </div>
          </Link>

          <Link
            to="/events"
            className={`flex-1 px-2 py-2 rounded-lg font-medium text-center transition-colors ${
              location.pathname === '/events'
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <span>📅</span>
              <span className="text-xs">Events</span>
            </div>
          </Link>

          <Link
            to="/event-management"
            className={`flex-1 px-2 py-2 rounded-lg font-medium text-center transition-colors ${
              isActive('/event-management')
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <span>💝</span>
              <span className="text-xs">Manage</span>
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}
