import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Search, Loader2, Gift, Trash2, ExternalLink, AlertCircle } from 'lucide-react';
import { Input } from './ui/Input';
import ProductCard, { type ExaProduct } from './ProductCard';
import { apiClient } from '../services/api';

interface Participant {
  id: number;
  full_name: string;
  username: string;
}

interface EventPrize {
  id: number;
  title: string;
  description?: string;
  url?: string;
  image_url?: string;
  price?: number;
  category?: string;
  status: string;
  recipient_id?: number;
  rank?: number;
  created_at: string;
  recipient?: Participant;
}

interface PrizePoolManagerProps {
  eventId: number;
}

export const PrizePoolManager: React.FC<PrizePoolManagerProps> = ({ eventId }) => {
  const [prizes, setPrizes] = useState<EventPrize[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ExaProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [addingProductUrl, setAddingProductUrl] = useState<string | null>(null);

  useEffect(() => {
    loadPrizes();
  }, [eventId]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 3) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadPrizes = async () => {
    try {
      const [prizesData, participantsData] = await Promise.all([
        apiClient.getEventPrizes(eventId),
        apiClient.getEventParticipants(eventId, 'participant'),
      ]);

      // Match prizes with recipients
      const prizesWithRecipients = prizesData.map((prize: EventPrize) => ({
        ...prize,
        recipient: prize.recipient_id
          ? participantsData.find((p: Participant) => p.id === prize.recipient_id)
          : undefined,
      }));

      setPrizes(prizesWithRecipients);
    } catch (error) {
      console.error('Failed to load prizes:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setSearchError(null);
    try {
      const result = await apiClient.searchProducts(searchQuery, 10);
      setSearchResults(result.products || []);
    } catch (err: any) {
      console.error('Search error:', err);
      setSearchError('Failed to fetch products. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleAddPrize = async (product: ExaProduct) => {
    setAddingProductUrl(product.url);
    try {
      await apiClient.createEventPrize(eventId, {
        event_id: eventId,
        title: product.title,
        description: product.description || '',
        url: product.url,
        image_url: product.image_url || '',
        price: product.price,
        exa_metadata: { score: product.score },
      });
      await loadPrizes();
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to add prize:', error);
      alert('Failed to add prize to pool');
    } finally {
      setAddingProductUrl(null);
    }
  };

  const handleDeletePrize = async (prizeId: number) => {
    if (!confirm('Are you sure you want to delete this prize?')) return;

    try {
      await apiClient.deleteEventPrize(eventId, prizeId);
      await loadPrizes();
    } catch (error) {
      console.error('Failed to delete prize:', error);
      alert('Failed to delete prize');
    }
  };

  const availablePrizes = prizes.filter((p) => p.status === 'available');
  const assignedPrizes = prizes.filter((p) => p.status === 'assigned');
  const fulfilledPrizes = prizes.filter((p) => p.status === 'fulfilled');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Search className="w-5 h-5" />
          Search for Prizes
        </h3>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            type="text"
            placeholder="Search for prizes (e.g., 'wireless headphones')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12"
          />
        </div>

        {searching && (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Loader2 className="animate-spin text-primary-500" size={32} />
            <p className="text-gray-500 text-sm">Searching with Exa AI...</p>
          </div>
        )}

        {searchError && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} />
            <p>{searchError}</p>
          </div>
        )}

        {!searching && !searchError && searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map((product, idx) => (
              <ProductCard
                key={`${product.url}-${idx}`}
                product={product}
                onAdd={handleAddPrize}
                isAdding={addingProductUrl === product.url}
                buttonText="Add to Prize Pool"
              />
            ))}
          </div>
        )}

        {!searching && searchQuery.length >= 3 && searchResults.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No products found for "{searchQuery}"
          </div>
        )}

        {searchQuery.length < 3 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            Type at least 3 characters to search
          </div>
        )}
      </Card>

      {/* Prize Pool */}
      <div className="space-y-6">
        {/* Available Prizes */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Gift className="w-6 h-6 text-primary-500" />
            Available Prizes ({availablePrizes.length})
          </h3>
          {availablePrizes.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              No available prizes. Use the search above to add prizes to the pool.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availablePrizes.map((prize, idx) => (
                <PrizeCard
                  key={prize.id}
                  prize={prize}
                  onDelete={handleDeletePrize}
                  index={idx}
                />
              ))}
            </div>
          )}
        </div>

        {/* Assigned Prizes */}
        {assignedPrizes.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Assigned Prizes ({assignedPrizes.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedPrizes.map((prize, idx) => (
                <PrizeCard key={prize.id} prize={prize} index={idx} showStatus />
              ))}
            </div>
          </div>
        )}

        {/* Fulfilled Prizes */}
        {fulfilledPrizes.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Fulfilled Prizes ({fulfilledPrizes.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fulfilledPrizes.map((prize, idx) => (
                <PrizeCard key={prize.id} prize={prize} index={idx} showStatus />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface PrizeCardProps {
  prize: EventPrize;
  onDelete?: (id: number) => void;
  index?: number;
  showStatus?: boolean;
}

const PrizeCard: React.FC<PrizeCardProps> = ({ prize, onDelete, index = 0, showStatus = false }) => {
  const [imageError, setImageError] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="overflow-hidden">
        <div className="relative h-32 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30">
          {prize.image_url && !imageError ? (
            <img
              src={prize.image_url}
              alt={prize.title}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
              <Gift size={32} strokeWidth={1.5} />
            </div>
          )}
          {showStatus && (
            <div className="absolute top-2 right-2">
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  prize.status === 'assigned'
                    ? 'bg-blue-500 text-white'
                    : 'bg-green-500 text-white'
                }`}
              >
                {prize.status}
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
            {prize.title}
          </h4>
          {prize.price && (
            <p className="text-lg font-bold text-primary-500 mb-2">${prize.price}</p>
          )}

          {/* Show recipient for assigned/fulfilled prizes */}
          {showStatus && prize.recipient && (
            <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Assigned to:</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {prize.recipient.full_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                @{prize.recipient.username}
              </p>
              {prize.rank && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-semibold">
                  Rank: #{prize.rank}
                </p>
              )}
            </div>
          )}

          {prize.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
              {prize.description}
            </p>
          )}

          <div className="flex gap-2">
            {prize.url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(prize.url, '_blank')}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
            {onDelete && prize.status === 'available' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(prize.id)}
                className="text-red-500 hover:text-red-600 hover:border-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
