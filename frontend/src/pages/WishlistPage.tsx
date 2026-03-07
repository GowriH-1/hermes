import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, Edit2, Star, Lock, Globe, X, ChevronDown, Sparkles, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
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
  brand_info?: {
    primary_color?: string;
    secondary_color?: string;
    logo_url?: string;
    tagline?: string;
  };
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
  const { } = useAuth();
  const { setBrandConfig } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  // Events
  const [participantEvents, setParticipantEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  // Wishlist items
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Unified Input State
  const [inputValue, setInputValue] = useState('');
  const [searchMinPrice, setSearchMinPrice] = useState<number | ''>('');
  const [searchMaxPrice, setSearchMaxPrice] = useState<number | ''>('');
  const [searchMode, setSearchMode] = useState<'instant' | 'deep'>('deep');
  const [searchResults, setSearchResults] = useState<ExaProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [privacyLevel, setPrivacyLevel] = useState('public');

  // Editing
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Event selector dropdown
  const [showEventDropdown, setShowEventDropdown] = useState(false);

  // Prizes
  const [myPrizes, setMyPrizes] = useState<EventPrize[]>([]);
  const [showPrizesBanner, setShowPrizesBanner] = useState(true);

  // Load initial data
  useEffect(() => {
    loadParticipantEvents();
  }, []);

  // Load wishlist items when event changes
  useEffect(() => {
    loadWishlistItems(selectedEventId);
    
    // Update brand config when event changes
    if (selectedEvent && selectedEvent.brand_info) {
      setBrandConfig(selectedEvent.brand_info);
    } else {
      setBrandConfig(null);
    }

    // Load prizes if event is selected
    if (selectedEventId) {
      loadMyPrizes(selectedEventId);
    } else {
      setMyPrizes([]);
    }
  }, [selectedEventId, selectedEvent, setBrandConfig]);

  // Debounced search effect
  useEffect(() => {
    const delay = searchMode === 'instant' ? 150 : 500;
    const timer = setTimeout(() => {
      if (inputValue.trim().length >= 2) {
        handleSearch();
      } else if (inputValue.trim().length === 0) {
        setSearchResults([]);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [inputValue, searchMinPrice, searchMaxPrice, searchMode]);

  const loadParticipantEvents = async () => {
    try {
      setLoading(true);
      const allEvents = await apiClient.getMyEvents();
      const participantOnly = allEvents.filter((e: Event) => e.role === 'participant');
      setParticipantEvents(participantOnly);

      const eventIdFromUrl = searchParams.get('event');
      if (eventIdFromUrl === 'all') {
        setSelectedEventId(null);
        setSelectedEvent(null);
      } else if (eventIdFromUrl && participantOnly.find((e: Event) => e.id === Number(eventIdFromUrl))) {
        const eventId = Number(eventIdFromUrl);
        setSelectedEventId(eventId);
        setSelectedEvent(participantOnly.find((e: Event) => e.id === eventId) || null);
      } else {
        setSelectedEventId(null);
        setSelectedEvent(null);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
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

  const loadWishlistItems = async (eventId: number | null) => {
    try {
      setLoadingItems(true);
      if (eventId) {
        const items = await apiClient.getEventWishlistItems(eventId);
        setWishlistItems(items);
      } else {
        // Use the explicit getDefaultWishlist endpoint for robustness
        try {
          const defaultWishlist = await apiClient.getDefaultWishlist();
          const items = await apiClient.getWishlistItems(defaultWishlist.id);
          setWishlistItems(items);
        } catch (err) {
          // Fallback if that endpoint fails
          const wishlists = await apiClient.getMyWishlists();
          const defaultWishlist = wishlists.find((w: any) => w.is_default) || wishlists[0];
          if (defaultWishlist) {
            const items = await apiClient.getWishlistItems(defaultWishlist.id);
            setWishlistItems(items);
          }
        }
      }
    } catch (error) {
      console.error('Error loading wishlist items:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleEventSwitch = (event: Event | null) => {
    if (event) {
      setSelectedEventId(event.id);
      setSelectedEvent(event);
      setSearchParams({ event: event.id.toString() });
    } else {
      setSelectedEventId(null);
      setSelectedEvent(null);
      setSearchParams({ event: 'all' });
    }
    setShowEventDropdown(false);
    setSearchResults([]);
  };

  const handleSearch = async () => {
    if (!inputValue.trim()) return;

    try {
      setSearching(true);
      const results = await apiClient.searchProducts(
        inputValue, 
        10, 
        searchMinPrice !== '' ? searchMinPrice : undefined, 
        searchMaxPrice !== '' ? searchMaxPrice : undefined,
        searchMode
      );
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
        privacy_level: privacyLevel,
        event_ids: selectedEventId ? [selectedEventId] : [],
      });

      setWishlistItems([newItem, ...wishlistItems]);
      setSearchResults(searchResults.filter((p) => p.url !== product.url));
    } catch (error: any) {
      console.error('Error adding item:', error);
      alert(error.response?.data?.detail || 'Failed to add item');
    }
  };

  const handleCustomAdd = async () => {
    if (!inputValue.trim()) return;

    try {
      const defaultWishlist = await apiClient.getDefaultWishlist();

      const firstLine = inputValue.split('\n')[0].substring(0, 60);

      const newItem = await apiClient.createWishlistItem({
        wishlist_id: defaultWishlist.id,
        title: firstLine || 'Custom Wish',
        description: inputValue,
        price_min: Number(searchMinPrice) || 0,
        price_max: Number(searchMaxPrice) || 0,
        category: 'other',
        priority: 3,
        privacy_level: privacyLevel,
        event_ids: selectedEventId ? [selectedEventId] : [],
      });

      setWishlistItems([newItem, ...wishlistItems]);
      setInputValue('');
      setSearchMinPrice('');
      setSearchMaxPrice('');
      setSearchResults([]);
    } catch (error: any) {
      console.error('Error adding custom item:', error);
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
        event_ids: selectedEventId ? [selectedEventId] : undefined,
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
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20">
      <TopNav />

      {/* Event Selector Header */}
      <div className="bg-white dark:bg-[#0a0a0a] border-b dark:border-gray-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative">
              <button
                onClick={() => setShowEventDropdown(!showEventDropdown)}
                className="flex items-center justify-between w-full md:w-80 px-4 py-2.5 bg-white dark:bg-[#0a0a0a] border-2 border-primary-100 dark:border-primary-900/50 rounded-xl hover:border-primary-300 dark:hover:border-primary-700 transition-all shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-lg">
                    {selectedEvent ? '🎁' : '🌎'}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-gray-900 dark:text-white text-sm">
                        {selectedEvent?.name || 'Public Wishlist (All)'}
                      </div>
                      {myPrizes.length > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-black text-white bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full animate-pulse shadow-sm">
                          {myPrizes.length}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">
                      {selectedEvent ? 'Event Mode' : 'Global Mode'}
                      {myPrizes.length > 0 && (
                        <span className="text-yellow-600 dark:text-yellow-400 font-black ml-2 tracking-tighter">
                          WON {myPrizes.length} {myPrizes.length === 1 ? 'PRIZE' : 'PRIZES'}!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showEventDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showEventDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-30 mt-2 w-full md:w-80 bg-white dark:bg-[#0a0a0a] border-2 border-gray-100 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden"
                  >
                    <div className="p-2 max-h-96 overflow-y-auto">
                      <button
                        onClick={() => handleEventSwitch(null)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors mb-1 ${selectedEventId === null ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'}`}
                      >
                        <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center text-lg">🌎</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-900 dark:text-white text-sm">Public Wishlist</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">All items, visible to all</div>
                        </div>
                        {selectedEventId === null && <div className="w-2 h-2 bg-primary-500 rounded-full" />}
                      </button>

                      <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />

                      {participantEvents.map((event) => (
                        <button
                          key={event.id}
                          onClick={() => handleEventSwitch(event)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${selectedEventId === event.id ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'}`}
                        >
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center text-lg">🎁</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-900 dark:text-white text-sm truncate">{event.name}</div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">{event.participant_count} members</div>
                          </div>
                          {selectedEventId === event.id && <div className="w-2 h-2 bg-primary-500 rounded-full" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {selectedEvent && (
              <div className="hidden md:flex items-center gap-4 text-right">
                <div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">Invite Code</div>
                  <div className="font-mono font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded border border-primary-100 dark:border-primary-800">{selectedEvent.invite_code}</div>
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
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg border-2 border-white dark:border-yellow-700">
                    🎉
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                      You've Won {myPrizes.length} {myPrizes.length === 1 ? 'Prize' : 'Prizes'}!
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Congratulations! You've been selected as a winner in <span className="font-bold text-yellow-700 dark:text-yellow-500">{selectedEvent?.name}</span>.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myPrizes.map((prize) => (
                    <motion.div
                      key={prize.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-sm border-2 border-yellow-200 dark:border-yellow-900/50 rounded-2xl p-4 shadow-sm group hover:border-yellow-400 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        {prize.image_url ? (
                          <img
                            src={prize.image_url}
                            alt={prize.title}
                            className="w-16 h-16 object-cover rounded-xl border-2 border-yellow-50 dark:border-yellow-900"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-xl flex items-center justify-center text-2xl border-2 border-yellow-50 dark:border-yellow-900">
                            🎁
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 dark:text-white truncate text-sm">
                            {prize.title}
                          </h4>
                          {prize.description && (
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5 leading-tight">
                              {prize.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            {prize.price && (
                              <p className="text-xs font-black text-primary-600 dark:text-primary-400">
                                ${prize.price.toFixed(2)}
                              </p>
                            )}
                            {prize.url && (
                              <a
                                href={prize.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-black text-gray-400 hover:text-yellow-600 uppercase tracking-tighter flex items-center gap-1"
                              >
                                VIEW <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowPrizesBanner(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Top Row: Add Items & Discovery */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* LEFT: Unified Input Console */}
          <div className="lg:col-span-5">
            <Card className="h-full border-none shadow-lg shadow-primary-100/20 dark:shadow-none bg-white/80 dark:bg-white/[0.03] backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-extrabold flex items-center gap-2 dark:text-white">
                  <Sparkles className="text-pink-500 w-5 h-5" />
                  Wish Console
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Your Desire</label>
                  <textarea
                    className="w-full px-5 py-4 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-base min-h-[160px] focus:border-primary-400 focus:ring-0 transition-all shadow-inner bg-gray-50/30 dark:bg-black/20 dark:text-white"
                    placeholder="Type a product name to search, or describe a unique wish in detail..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Visibility</label>
                    <select
                      className="w-full px-4 py-2.5 border-2 border-gray-100 dark:border-gray-800 rounded-xl text-sm bg-white dark:bg-black font-bold text-gray-700 dark:text-gray-300"
                      value={privacyLevel}
                      onChange={(e) => setPrivacyLevel(e.target.value)}
                    >
                      <option value="public">🌎 Public</option>
                      <option value="event_only">🔒 Event Only</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Price Fit (Optional)</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min $"
                        value={searchMinPrice}
                        onChange={(e) => setSearchMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="h-10 text-xs font-bold rounded-xl border-2 border-gray-100 dark:border-gray-800"
                      />
                      <Input
                        type="number"
                        placeholder="Max $"
                        value={searchMaxPrice}
                        onChange={(e) => setSearchMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="h-10 text-xs font-bold rounded-xl border-2 border-gray-100 dark:border-gray-800"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium italic bg-gray-50 dark:bg-white/[0.02] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  Tip: Real products appear on the right as you type. For generic ideas, click "Add as Custom Wish" — your sponsor will use your description to find the perfect match!
                </p>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Live Discovery Panel */}
          <div className="lg:col-span-7">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
                    <Search className="w-4 h-4 text-primary-500" />
                    Live Discovery
                  </div>
                  
                  {/* Research Depth Toggle */}
                  <div className="flex items-center bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                    <button
                      onClick={() => setSearchMode('instant')}
                      className={`px-2 py-1 text-[10px] font-black uppercase rounded-md transition-all ${
                        searchMode === 'instant' 
                          ? 'bg-amber-500 text-white shadow-sm' 
                          : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
                      }`}
                    >
                      Instant
                    </button>
                    <button
                      onClick={() => setSearchMode('deep')}
                      className={`px-2 py-1 text-[10px] font-black uppercase rounded-md transition-all ${
                        searchMode === 'deep' 
                          ? 'bg-primary-500 text-white shadow-sm' 
                          : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
                      }`}
                    >
                      Deep
                    </button>
                  </div>
                </div>
                
                {searching && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-primary-500 animate-pulse">
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                    EXA AI SEARCHING...
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar max-h-[500px]">
                {/* 1. MAGIC ADD SHORTCUT (Always first if input exists) */}
                <AnimatePresence>
                  {inputValue.trim().length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="border-2 border-dashed border-pink-200 dark:border-pink-900/50 bg-pink-50/30 dark:bg-pink-900/10 rounded-2xl p-4 group hover:border-pink-400 transition-all cursor-pointer shadow-sm"
                      onClick={handleCustomAdd}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center text-pink-500">
                            <Sparkles className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-tight">Add as Custom Wish</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">"{inputValue}"</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[9px] px-2 py-0.5 bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 font-bold rounded-full">IDEAL FOR GENERIC IDEAS</span>
                            </div>
                          </div>
                        </div>
                        <Plus className="w-5 h-5 text-pink-400 group-hover:scale-125 transition-transform" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 2. EXA SEARCH RESULTS */}
                {searchResults.map((product, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-white/[0.02] rounded-2xl p-4 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      {product.image ? (
                        <img src={product.image} alt={product.title} className="w-16 h-16 object-cover rounded-xl border border-gray-50 dark:border-gray-800" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-xl flex items-center justify-center text-gray-300 dark:text-gray-700">
                          <Search className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors leading-tight">{product.title}</h4>
                          <span className="text-sm font-black text-primary-500">${product.price || '??'}</span>
                        </div>
                        {product.summary && <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{product.summary}</p>}
                        <div className="flex items-center justify-between mt-3">
                          <a href={product.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-gray-400 dark:text-gray-500 hover:text-gray-600 flex items-center gap-1">
                            VIEW SOURCE <ExternalLink className="w-3 h-3" />
                          </a>
                          <Button size="sm" onClick={() => handleAddFromSearch(product)} className="h-8 bg-brand-primary hover:bg-brand-primary-hover px-4 rounded-xl text-[11px] font-bold text-white">
                            ADD TO WISHLIST
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {inputValue.trim().length >= 2 && searchResults.length === 0 && !searching && (
                  <div className="text-center py-12 bg-gray-50 dark:bg-white/[0.01] rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800">
                    <p className="text-sm text-gray-400 dark:text-gray-500 font-bold italic">No exact product matches found.<br/>You can still add it as a custom wish!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: My Wishlist */}
        <section className="space-y-6 pt-8 border-t-2 border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200 dark:shadow-none">
                <Star className="w-6 h-6 fill-white" />
              </div>
              My Wishlist
              <span className="text-sm font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-900 px-3 py-1 rounded-full">{wishlistItems.length} items</span>
            </h2>
          </div>

          {loadingItems ? (
            <div className="text-center py-20 bg-white dark:bg-transparent rounded-3xl border-2 border-gray-50 dark:border-gray-800">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto" />
              <p className="mt-4 text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Fetching your treasures...</p>
            </div>
          ) : wishlistItems.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-transparent rounded-[40px] border-4 border-dashed border-gray-50 dark:border-gray-800">
              <div className="text-6xl mb-6">🏜️</div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Your wishlist is a blank canvas.</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-2 font-medium">Use the console above to discover products or add custom ideas for sponsors to find.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {wishlistItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`group relative border-2 rounded-[32px] p-6 transition-all hover:shadow-xl hover:-translate-y-1 ${
                    item.is_fulfilled ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30 shadow-green-100/20' : 'bg-white dark:bg-white/[0.02] border-gray-50 dark:border-gray-800 shadow-gray-200/20 dark:shadow-none'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-black text-gray-900 dark:text-white text-lg leading-tight line-clamp-2">{item.title}</h4>
                        {item.is_fulfilled && (
                          <span className="shrink-0 px-2 py-0.5 text-[10px] font-black bg-green-500 text-white rounded-full uppercase tracking-tighter">Claimed</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-primary-600 dark:text-primary-400">${item.price_min}{item.price_max ? ` - ${item.price_max}` : ''}</span>
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < item.priority ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 dark:text-gray-700'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => handleEditItem(item)} className="p-2 text-gray-300 dark:text-gray-600 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>

                  {item.description && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 mb-4 font-medium leading-relaxed">{item.description}</p>}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800 mt-auto">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${item.privacy_level === 'public' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400'}`}>
                        {item.privacy_level === 'public' ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{item.privacy_level}</span>
                    </div>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-primary-500 dark:text-primary-400 hover:underline flex items-center gap-1">
                        VIEW PRODUCT <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditModal(false)} className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white dark:bg-[#0a0a0a] rounded-[40px] shadow-2xl max-w-md w-full p-8 overflow-hidden relative border dark:border-gray-800">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Edit Wish</h3>
                  <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-colors"><X className="w-6 h-6 text-gray-400" /></button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleUpdateItem(editingItem.id, editingItem); }} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Item Title</label>
                    <Input value={editingItem.title} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} className="rounded-2xl border-2 border-gray-100 dark:border-gray-800 h-12 font-bold dark:bg-black dark:text-white" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Price (min)</label>
                      <Input type="number" value={editingItem.price_min} onChange={(e) => setEditingItem({ ...editingItem, price_min: Number(e.target.value) })} className="rounded-2xl border-2 border-gray-100 dark:border-gray-800 h-12 font-bold dark:bg-black dark:text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Priority</label>
                      <select value={editingItem.priority} onChange={(e) => setEditingItem({ ...editingItem, priority: Number(e.target.value) })} className="w-full h-12 px-4 border-2 border-gray-100 dark:border-gray-800 rounded-2xl font-bold bg-white dark:bg-black text-sm dark:text-white">
                        {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Privacy</label>
                    <select value={editingItem.privacy_level} onChange={(e) => setEditingItem({ ...editingItem, privacy_level: e.target.value })} className="w-full h-12 px-4 border-2 border-gray-100 dark:border-gray-800 rounded-2xl font-bold bg-white dark:bg-black text-sm dark:text-white">
                      <option value="event_only">Event Only</option>
                      <option value="public">Public</option>
                    </select>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs border-2 border-gray-100 dark:border-gray-800 dark:text-gray-400">Cancel</Button>
                    <Button type="submit" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs bg-brand-primary hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/20 dark:shadow-none text-white">Save Changes</Button>
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
