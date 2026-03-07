import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, DollarSign, AlertCircle } from 'lucide-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import ProductCard from './ProductCard';
import type { ExaProduct } from './ProductCard';
import { apiClient } from '../services/api';

interface ExaSearchProps {
  onAddToWishlist: (product: ExaProduct) => Promise<void>;
  onAddCustomItem: (title: string, priceMin?: number, priceMax?: number) => Promise<void>;
}

const ExaSearch: React.FC<ExaSearchProps> = ({ onAddToWishlist, onAddCustomItem }) => {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<ExaProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceMin, setPriceMin] = useState<number | ''>('');
  const [priceMax, setPriceMax] = useState<number | ''>('');
  const [addingId, setAddingId] = useState<string | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setProducts([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.searchProducts(
        searchQuery,
        10,
        priceMin !== '' ? Number(priceMin) : undefined,
        priceMax !== '' ? Number(priceMax) : undefined
      );
      setProducts(result.products || []);
    } catch (err: any) {
      console.error('Search error:', err);
      setError('Failed to fetch products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [priceMin, priceMax]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 3) {
        performSearch(query);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleAdd = async (product: ExaProduct) => {
    setAddingId(product.url);
    try {
      await onAddToWishlist(product);
    } finally {
      setAddingId(null);
    }
  };

  const handleAddCustom = async () => {
    setAddingId('custom');
    try {
      await onAddCustomItem(
        query,
        priceMin !== '' ? Number(priceMin) : undefined,
        priceMax !== '' ? Number(priceMax) : undefined
      );
      setQuery(''); // Reset query after adding
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
          <Input
            type="text"
            placeholder="Type a gift idea (e.g. 'mechanical keyboard')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 h-14 text-lg border-purple-200 focus:border-purple-400 ring-purple-100 rounded-xl w-full"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              onClick={handleAddCustom}
              disabled={addingId === 'custom' || query.length < 3}
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm flex-1 sm:flex-none h-11"
            >
              {addingId === 'custom' ? 'Adding...' : 'Add as Custom Idea'}
            </Button>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Budget:</span>
            <div className="flex items-center gap-1">
              <DollarSign className="text-gray-400" size={14} />
              <Input
                type="number"
                placeholder="Min"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-20 h-8 text-sm focus:ring-0 border-none bg-transparent"
              />
              <span className="text-gray-300">-</span>
              <Input
                type="number"
                placeholder="Max"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-20 h-8 text-sm focus:ring-0 border-none bg-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="animate-spin text-purple-600" size={40} />
          <p className="text-gray-500 animate-pulse">Deep searching the web with Exa AI...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((product, idx) => (
            <ProductCard
              key={`${product.url}-${idx}`}
              product={product}
              onAdd={handleAdd}
              isAdding={addingId === product.url}
            />
          ))}
        </div>
      )}

      {!loading && !error && query.length >= 3 && products.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500 font-medium">No Exa AI products found for "{query}".</p>
          <p className="text-sm text-gray-400 mt-2">Try adjusting your search terms or use the "Add Custom Idea" button above to add it directly to your wishlist.</p>
        </div>
      )}

      {!loading && !error && query.length < 3 && (
        <div className="text-center py-12">
          <p className="text-gray-400">Type at least 3 characters to search for gift ideas.</p>
        </div>
      )}
    </div>
  );
};

export default ExaSearch;
