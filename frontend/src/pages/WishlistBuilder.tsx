import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Gift, Loader2, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import ExaSearch from '../components/ExaSearch';
import WishlistItemCard from '../components/WishlistItemCard';
import type { WishlistItem } from '../components/WishlistItemCard';
import type { ExaProduct } from '../components/ProductCard';
import { apiClient } from '../services/api';

interface Wishlist {
  id: number;
  name: string;
  is_default: boolean;
}

export default function WishlistBuilder() {
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Get user's wishlists
      const wishlists = await apiClient.getMyWishlists();
      const defaultWishlist = wishlists.find((w: Wishlist) => w.is_default) || wishlists[0];
      setWishlist(defaultWishlist);

      // 2. Get wishlist items
      if (defaultWishlist) {
        const wishlistItems = await apiClient.getWishlistItems(defaultWishlist.id);
        setItems(wishlistItems);
      }
    } catch (error) {
      console.error('Error loading wishlist data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddProduct = async (product: ExaProduct) => {
    if (!wishlist) return;

    try {
      const newItem = await apiClient.createWishlistItem({
        wishlist_id: wishlist.id,
        title: product.title,
        description: product.description || '',
        url: product.url,
        image_url: product.image_url,
        price_min: product.price,
        price_max: product.price,
        category: inferCategory(product.title),
        priority: 3,
        privacy_level: 'public',
        event_ids: [],
        exa_metadata: { score: product.score }
      });

      setItems((prev) => [newItem, ...prev]);
    } catch (error) {
      console.error('Error adding item to wishlist:', error);
      alert('Failed to add item to wishlist. Please try again.');
    }
  };

  const handleAddCustomItem = async (title: string, priceMin?: number, priceMax?: number) => {
    if (!wishlist) return;

    try {
      const newItem = await apiClient.createWishlistItem({
        wishlist_id: wishlist.id,
        title,
        description: `Custom idea for ${title}`,
        price_min: priceMin,
        price_max: priceMax,
        category: inferCategory(title),
        priority: 3,
        privacy_level: 'public',
        event_ids: [],
        exa_metadata: {}
      });

      setItems((prev) => [newItem, ...prev]);
    } catch (error) {
      console.error('Error adding custom item to wishlist:', error);
      alert('Failed to add custom item to wishlist. Please try again.');
    }
  };

  const handleUpdateItem = async (itemId: number, updates: any) => {
    try {
      const updatedItem = await apiClient.updateWishlistItem(itemId, updates);
      setItems((prev) => prev.map((item) => (item.id === itemId ? updatedItem : item)));
    } catch (error) {
      console.error('Error updating wishlist item:', error);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to remove this item?')) return;

    try {
      await apiClient.deleteWishlistItem(itemId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting wishlist item:', error);
    }
  };

  const inferCategory = (title: string): string => {
    const lower = title.toLowerCase();
    if (lower.includes('keyboard') || lower.includes('mouse') || lower.includes('monitor') || lower.includes('tech') || lower.includes('gadget')) return 'tech';
    if (lower.includes('book') || lower.includes('novel')) return 'books';
    if (lower.includes('game') || lower.includes('playstation') || lower.includes('xbox') || lower.includes('nintendo')) return 'gaming';
    if (lower.includes('shirt') || lower.includes('jacket') || lower.includes('clothing') || lower.includes('shoes')) return 'fashion';
    if (lower.includes('kitchen') || lower.includes('home') || lower.includes('decor')) return 'home';
    return 'other';
  };

  if (loading && !wishlist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-purple-600 mb-4" size={48} />
        <p className="text-gray-500 font-medium">Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-12">
      {/* Navigation Header */}
      <header className="bg-white dark:bg-[#0a0a0a] border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" className="text-gray-500">
                <ChevronLeft size={24} />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Gift size={20} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Wishlist Builder</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs text-gray-500 font-medium">Active Wishlist</span>
              <span className="text-sm font-bold text-purple-600">{wishlist?.name || 'Loading...'}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel: Exa Search */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="text-pink-500" size={20} />
                Discover Gifts with Exa AI
              </h2>
              <span className="text-xs text-gray-400 font-medium px-2 py-1 bg-gray-100 rounded-md">
                POWERED BY NEURAL SEARCH
              </span>
            </div>

            <ExaSearch onAddToWishlist={handleAddProduct} onAddCustomItem={handleAddCustomItem} />
          </div>

          {/* Right Panel: My Wishlist */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                My Wishlist
                <span className="bg-purple-100 text-purple-600 text-xs px-2 py-0.5 rounded-full">
                  {items.length} items
                </span>
              </h2>
            </div>

            <div className="space-y-4">
              {items.length > 0 ? (
                items.map((item) => (
                  <WishlistItemCard
                    key={item.id}
                    item={item}
                    onUpdate={handleUpdateItem}
                    onDelete={handleDeleteItem}
                  />
                ))
              ) : (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gift size={32} />
                  </div>
                  <h3 className="text-gray-900 font-bold mb-1">Your wishlist is empty</h3>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    Use the search panel on the left to find amazing products and add them here!
                  </p>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl p-6 text-white shadow-lg shadow-purple-200">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <Sparkles size={18} />
                  Ready to be sponsored?
                </h3>
                <p className="text-sm text-purple-50 opacity-90 mb-4">
                  Your wishlist is now ready! Sponsors can discover these items and claim them for you.
                </p>
                <Link to="/dashboard">
                  <Button className="w-full bg-white text-purple-600 hover:bg-purple-50 font-bold border-none">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
