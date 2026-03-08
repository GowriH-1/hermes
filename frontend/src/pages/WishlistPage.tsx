import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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

interface EventPrize {
  id: number;
  event_id: number;
  title: string;
  description?: string;
  url?: string;
  image_url?: string;
  price?: number;
  category?: string;
  status: string;
  assigned_at?: string;
  fulfilled_at?: string;
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

  // Prizes
  const [myPrizes, setMyPrizes] = useState<EventPrize[]>([]);
  const [showPrizesBanner, setShowPrizesBanner] = useState(true);

  // Load all participant events and wishlist items
  useEffect(() => {
    loadParticipantEvents();
    loadAllWishlistItems();
  }, []);

  // Load wishlist items when event changes
  useEffect(() => {
    if (selectedEventId) {
      loadWishlistItems(selectedEventId);
    } else {
      loadAllWishlistItems();
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
      // If no events, selectedEventId remains null and we show all wishlist items
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllWishlistItems = async () => {
    try {
      setLoadingItems(true);
      const defaultWishlist = await apiClient.getDefaultWishlist();
      const items = await apiClient.getWishlistItems(defaultWishlist.id);
      setWishlistItems(items);
    } catch (error) {
      console.error('Error loading wishlist items:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  const loadMyPrizes = async (eventId: number) => {
    try {
      const prizes = await apiClient.getMyPrizes(eventId);
      setMyPrizes(prizes);
      if (prizes.length > 0) {
        setShowPrizesBanner(true);
      }
    } catch (error) {
      console.error('Error loading prizes:', error);
      setMyPrizes([]);
    }
  };

  // Load prizes when event is selected
  useEffect(() => {
    if (selectedEventId) {
      loadMyPrizes(selectedEventId);
    } else {
      setMyPrizes([]);
    }
  }, [selectedEventId]);

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
    try {
      const defaultWishlist = await apiClient.getDefaultWishlist();

      const newItem = await apiClient.createWishlistItem({
        wishlist_id: defaultWishlist.id,
        title: product.title,
        description: product.summary,
        url: product.url,
        image_url: product.image,
        price_min: product.price || 0,
        category: 'other',
        priority: 3,
        privacy_level: selectedEventId ? 'event_only' : 'public',
        event_ids: selectedEventId ? [selectedEventId] : [],
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
    try {
      const updated = await apiClient.updateWishlistItem(itemId, {
        ...updates,
        event_ids: selectedEventId ? [selectedEventId] : [],
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Top Navigation */}
      <TopNav />

      {/* Event Selector */}
      <div className="bg-white dark:bg-[#0a0a0a] border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative">
            {participantEvents.length > 0 ? (
              <>
                <button
                  onClick={() => setShowEventDropdown(!showEventDropdown)}
                  className="flex items-center justify-between w-full md:w-96 px-4 py-3 bg-white dark:bg-[#0a0a0a] border-2 border-primary-200 dark:border-primary-700 rounded-lg hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-xl">
                      🎁
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {selectedEvent?.name || 'My Wishlist'}
                        </span>
                        {myPrizes.length > 0 && (
                          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full animate-pulse">
                            {myPrizes.length}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedEvent ? `${selectedEvent.participant_count || 0} members` : 'Public wishlist'}
                        {myPrizes.length > 0 && (
                          <span className="text-yellow-600 dark:text-yellow-400 font-semibold ml-2">
                            🎉 {myPrizes.length} {myPrizes.length === 1 ? 'prize' : 'prizes'} won!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
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
                      className="absolute z-10 mt-2 w-full md:w-96 bg-white dark:bg-[#0a0a0a] border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-xl"
                    >
                      <div className="p-2 max-h-96 overflow-y-auto">
                        <button
                          onClick={() => {
                            setSelectedEventId(null);
                            setSelectedEvent(null);
                            setShowEventDropdown(false);
                            setSearchParams({});
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors mb-2 ${
                            !selectedEventId
                              ? 'bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-300 dark:border-primary-600'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-transparent'
                          }`}
                        >
                          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center text-xl">
                            ✨
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              My Wishlist
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              All items • Public
                            </div>
                          </div>
                          {!selectedEventId && (
                            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                          )}
                        </button>
                        {participantEvents.map((event) => (
                          <button
                            key={event.id}
                            onClick={() => handleEventSwitch(event)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                              selectedEventId === event.id
                                ? 'bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-300 dark:border-primary-600'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-transparent'
                            }`}
                          >
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-xl">
                              🎁
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 dark:text-white truncate">
                                {event.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
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
              </>
            ) : (
              <div className="flex items-center justify-between w-full md:w-auto px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center text-xl">
                    ✨
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      My Wishlist
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Public wishlist • <Link to="/event-management" className="text-primary-500 hover:underline">Join an event</Link> to share
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prizes Banner */}
      {myPrizes.length > 0 && showPrizesBanner && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-2xl shadow-lg">
                    🎉
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Congratulations! You've Won {myPrizes.length} {myPrizes.length === 1 ? 'Prize' : 'Prizes'}!
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      You've been selected as a winner in this event. Check out your prizes below!
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {myPrizes.map((prize) => (
                    <motion.div
                      key={prize.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white dark:bg-[#0a0a0a] border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        {prize.image_url ? (
                          <img
                            src={prize.image_url}
                            alt={prize.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center text-2xl">
                            🎁
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                            {prize.title}
                          </h4>
                          {prize.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                              {prize.description}
                            </p>
                          )}
                          {prize.price && (
                            <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mt-1">
                              ${prize.price.toFixed(2)}
                            </p>
                          )}
                          {prize.url && (
                            <a
                              href={prize.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary-500 hover:underline mt-1 inline-block"
                            >
                              View Product →
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowPrizesBanner(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </div>
      )}

      {/* Main Content */}
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
                    <p className="text-gray-500 dark:text-gray-300 mb-4">
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
                          item.is_fulfilled ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white">{item.title}</h4>
                              {item.is_fulfilled && (
                                <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                                  ✓ Claimed
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{item.description}</p>
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
                    <p className="text-center text-gray-500 dark:text-gray-300 py-8">
                      No products found. Try a different search.
                    </p>
                  )}

                  {searchResults.map((product, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-[#0a0a0a] hover:shadow-md transition-shadow"
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
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
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
                  <div className="text-center text-xs text-gray-500 dark:text-gray-300 pt-4 border-t">
                    Powered by <span className="font-semibold text-primary-600">Exa</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Event Info Card */}
          {selectedEvent && (
            <Card className="mt-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Event Details</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {selectedEvent.description || 'No description'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">Invite Code</p>
                    <code className="px-3 py-1.5 bg-primary-50 text-primary-700 font-mono font-bold rounded border border-primary-200">
                      {selectedEvent.invite_code}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
      </main>

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
                className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-2xl max-w-md w-full p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Item</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-500 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-300"
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
