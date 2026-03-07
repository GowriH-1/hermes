import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, Edit2, Star, Lock, Globe, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

interface WishlistItem {
  id: number;
  title: string;
  description?: string;
  url?: string;
  image_url?: string;
  price_min: number;
  price_max?: number;
  category: string;
  priority: number;
  privacy_level: string;
  is_fulfilled: boolean;
}

interface Event {
  id: number;
  name: string;
  event_type: string;
  description?: string;
  invite_code: string;
  participant_count: number;
  role: string;
}

interface ExaProduct {
  title: string;
  url: string;
  price?: number;
  image?: string;
  summary?: string;
}

export default function WishlistPage() {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Events
  const [participantEvents, setParticipantEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  // Wishlist items
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Exa search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ExaProduct[]>([]);
  const [searching, setSearching] = useState(false);

  // Editing
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Event selector dropdown
  const [showEventDropdown, setShowEventDropdown] = useState(false);

  // Load all participant events
  useEffect(() => {
    loadParticipantEvents();
  }, []);

  // Load wishlist items when event changes
  useEffect(() => {
    if (selectedEventId) {
      loadWishlistItems(selectedEventId);
    }
  }, [selectedEventId]);

  const loadParticipantEvents = async () => {
    try {
      setLoading(true);
      const allEvents = await apiClient.getMyEvents();
      const participantOnly = allEvents.filter((e: Event) => e.role === 'participant');
      setParticipantEvents(participantOnly);

      // Auto-select event from URL param or first event
      const eventIdFromUrl = searchParams.get('event');
      if (eventIdFromUrl && participantOnly.find((e: Event) => e.id === Number(eventIdFromUrl))) {
        const eventId = Number(eventIdFromUrl);
        setSelectedEventId(eventId);
        setSelectedEvent(participantOnly.find((e: Event) => e.id === eventId) || null);
      } else if (participantOnly.length > 0) {
        setSelectedEventId(participantOnly[0].id);
        setSelectedEvent(participantOnly[0]);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWishlistItems = async (eventId: number) => {
    try {
      setLoadingItems(true);
      const items = await apiClient.getEventWishlistItems(eventId);
      setWishlistItems(items);
    } catch (error) {
      console.error('Error loading wishlist items:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleEventSwitch = (event: Event) => {
    setSelectedEventId(event.id);
    setSelectedEvent(event);
    setSearchParams({ event: event.id.toString() });
    setShowEventDropdown(false);
    setSearchResults([]); // Clear search results when switching events
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const results = await apiClient.searchProducts(searchQuery, 10);
      setSearchResults(results.products || []);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddFromSearch = async (product: ExaProduct) => {
    if (!selectedEventId) return;

    try {
      const wishlists = await apiClient.getMyWishlists();
      const defaultWishlist = wishlists.find((w: any) => w.is_default);

      if (!defaultWishlist) {
        alert('Please create a wishlist first');
        return;
      }

      const newItem = await apiClient.createWishlistItem({
        wishlist_id: defaultWishlist.id,
        title: product.title,
        description: product.summary,
        url: product.url,
        image_url: product.image,
        price_min: product.price || 0,
        category: 'other',
        priority: 3,
        privacy_level: 'event_only',
        event_ids: [selectedEventId],
      });

      setWishlistItems([...wishlistItems, newItem]);
      setSearchResults(searchResults.filter((p) => p.url !== product.url));
    } catch (error: any) {
      console.error('Error adding item:', error);
      alert(error.response?.data?.detail || 'Failed to add item');
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Delete this wishlist item?')) return;

    try {
      await apiClient.deleteWishlistItem(itemId);
      setWishlistItems(wishlistItems.filter((item) => item.id !== itemId));
    } catch (error: any) {
      console.error('Error deleting item:', error);
      alert(error.response?.data?.detail || 'Failed to delete item');
    }
  };

  const handleEditItem = (item: WishlistItem) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleUpdateItem = async (itemId: number, updates: Partial<WishlistItem>) => {
    if (!selectedEventId) return;

    try {
      const updated = await apiClient.updateWishlistItem(itemId, {
        ...updates,
        event_ids: [selectedEventId],
      });

      setWishlistItems(wishlistItems.map((item) => (item.id === itemId ? updated : item)));
      setShowEditModal(false);
      setEditingItem(null);
    } catch (error: any) {
      console.error('Error updating item:', error);
      alert(error.response?.data?.detail || 'Failed to update item');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (participantEvents.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🎁</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Events Yet</h2>
            <p className="text-gray-600 mb-6">
              Join or create an event as a participant to start building your wishlist!
            </p>
            <Link to="/dashboard">
              <Button className="bg-primary-500 hover:bg-primary-600">
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <TopNav />

      {/* Event Selector */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative">
            <button
              onClick={() => setShowEventDropdown(!showEventDropdown)}
              className="flex items-center justify-between w-full md:w-96 px-4 py-3 bg-white border-2 border-primary-200 rounded-lg hover:border-primary-400 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
                  🎁
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">
                    {selectedEvent?.name || 'Select Event'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {selectedEvent?.participant_count || 0} members
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  showEventDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
              {showEventDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 mt-2 w-full md:w-96 bg-white border-2 border-gray-200 rounded-lg shadow-xl"
                >
                  <div className="p-2 max-h-96 overflow-y-auto">
                    {participantEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => handleEventSwitch(event)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                          selectedEventId === event.id
                            ? 'bg-primary-50 border-2 border-primary-300'
                            : 'hover:bg-gray-50 border-2 border-transparent'
                        }`}
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
                          🎁
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">
                            {event.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {event.event_type.replace('_', ' ')} • {event.participant_count} members
                          </div>
                        </div>
                        {selectedEventId === event.id && (
                          <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {selectedEvent && (
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: My Wishlist */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>My Wishlist</span>
                  <span className="text-sm font-normal text-gray-500">
                    {wishlistItems.length} items
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingItems ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                  </div>
                ) : wishlistItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      No wishlist items yet. Search for products to add!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {wishlistItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className={`border rounded-lg p-4 ${
                          item.is_fulfilled ? 'bg-green-50 border-green-200' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">{item.title}</h4>
                              {item.is_fulfilled && (
                                <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                                  ✓ Claimed
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="font-medium text-primary-600">
                                ${item.price_min}
                                {item.price_max && ` - $${item.price_max}`}
                              </span>
                              <span className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < item.priority
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </span>
                              <span className="flex items-center gap-1">
                                {item.privacy_level === 'public' ? (
                                  <Globe className="w-3 h-3" />
                                ) : (
                                  <Lock className="w-3 h-3" />
                                )}
                                {item.privacy_level}
                              </span>
                            </div>
                          </div>
                          {!item.is_fulfilled && (
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleEditItem(item)}
                                className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-600 hover:underline mt-2 inline-block"
                          >
                            View Product →
                          </a>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right: Add Items */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Add Wishlist Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search Bar */}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search for products..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={searching || !searchQuery.trim()}
                    className="bg-primary-500 hover:bg-primary-600"
                  >
                    {searching ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                  </Button>
                </div>

                {/* Search Results */}
                <div className="space-y-3">
                  {searchResults.length === 0 && !searching && searchQuery && (
                    <p className="text-center text-gray-500 py-8">
                      No products found. Try a different search.
                    </p>
                  )}

                  {searchResults.map((product, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                            {product.title}
                          </h4>
                          {product.summary && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {product.summary}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            {product.price && (
                              <span className="text-primary-600 font-medium">
                                ${product.price}
                              </span>
                            )}
                            <Button
                              size="sm"
                              onClick={() => handleAddFromSearch(product)}
                              className="bg-primary-500 hover:bg-primary-600"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Powered by Exa */}
                {searchResults.length > 0 && (
                  <div className="text-center text-xs text-gray-500 pt-4 border-t">
                    Powered by <span className="font-semibold text-primary-600">Exa</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Event Info Card */}
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Event Details</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedEvent.description || 'No description'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Invite Code</p>
                  <code className="px-3 py-1.5 bg-primary-50 text-primary-700 font-mono font-bold rounded border border-primary-200">
                    {selectedEvent.invite_code}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Edit Item</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateItem(editingItem.id, editingItem);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <Input
                      value={editingItem.title}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, title: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Price (min)</label>
                    <Input
                      type="number"
                      value={editingItem.price_min}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          price_min: Number(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Priority (1-5)</label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={editingItem.priority}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          priority: Number(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Privacy</label>
                    <select
                      value={editingItem.privacy_level}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          privacy_level: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="event_only">Event Only</option>
                      <option value="public">Public</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEditModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-primary-500 hover:bg-primary-600"
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
