import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ParticipantList } from './ParticipantList';
import { Gift, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { apiClient } from '../services/api';

interface Participant {
  id: number;
  full_name: string;
  username: string;
  age_group?: string;
  interests?: string[];
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
}

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
}

interface Recommendation {
  recommended_prize_id?: number;
  reasoning: string;
  search_suggestion?: string;
  prize?: EventPrize;
}

interface PrizeAssignmentFlowProps {
  eventId: number;
}

export const PrizeAssignmentFlow: React.FC<PrizeAssignmentFlowProps> = ({ eventId }) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [prizes, setPrizes] = useState<EventPrize[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [selectedPrize, setSelectedPrize] = useState<EventPrize | null>(null);
  const [selectedWishlistItem, setSelectedWishlistItem] = useState<WishlistItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId]);

  useEffect(() => {
    if (selectedParticipant) {
      loadParticipantWishlist(selectedParticipant.id);
      // Clear selections when participant changes
      setSelectedPrize(null);
      setSelectedWishlistItem(null);
    } else {
      setWishlistItems([]);
      setRecommendation(null);
      setSelectedPrize(null);
      setSelectedWishlistItem(null);
    }
  }, [selectedParticipant]);

  const loadData = async () => {
    try {
      const [participantsData, availablePrizesData, allPrizesData] = await Promise.all([
        apiClient.getEventParticipants(eventId, 'participant'),
        apiClient.getEventPrizes(eventId, 'available'),
        apiClient.getEventPrizes(eventId), // Get all prizes to check who already has one
      ]);

      // Filter out participants who already have prizes
      const participantsWithPrizes = new Set(
        allPrizesData
          .filter((p: any) => p.status === 'assigned' || p.status === 'fulfilled')
          .map((p: any) => p.recipient_id)
      );

      const availableParticipants = participantsData.filter(
        (p: Participant) => !participantsWithPrizes.has(p.id)
      );

      setParticipants(availableParticipants);
      setPrizes(availablePrizesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadParticipantWishlist = async (participantId: number) => {
    setLoadingWishlist(true);
    setRecommendation(null);
    try {
      const items = await apiClient.getParticipantWishlistItems(eventId, participantId);
      setWishlistItems(items);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
      setWishlistItems([]);
    } finally {
      setLoadingWishlist(false);
    }
  };

  const handleGetRecommendation = async () => {
    if (!selectedParticipant) return;

    setLoadingRecommendation(true);
    try {
      const rec = await apiClient.getRecommendedPrize(eventId, selectedParticipant.id);
      setRecommendation(rec);

      // Auto-select the recommended prize if available
      if (rec.prize) {
        const recommendedPrize = prizes.find((p) => p.id === rec.prize?.id);
        if (recommendedPrize) {
          setSelectedPrize(recommendedPrize);
        }
      }
    } catch (error: any) {
      console.error('Failed to get recommendation:', error);
      alert(error.response?.data?.detail || 'Failed to get recommendation');
    } finally {
      setLoadingRecommendation(false);
    }
  };

  const handleSelectWishlistItem = (item: WishlistItem) => {
    setSelectedWishlistItem(item);
    setSelectedPrize(null); // Clear prize selection
  };

  const handleSelectPrize = (prize: EventPrize) => {
    setSelectedPrize(prize);
    setSelectedWishlistItem(null); // Clear wishlist item selection
  };

  const handleAssignPrize = async () => {
    if (!selectedParticipant) return;
    if (!selectedPrize && !selectedWishlistItem) return;

    setAssigning(true);
    try {
      let prizeToAssign = selectedPrize;

      // If a wishlist item is selected, create a prize from it first
      if (selectedWishlistItem) {
        prizeToAssign = await apiClient.createEventPrize(eventId, {
          event_id: eventId,
          title: selectedWishlistItem.title,
          description: selectedWishlistItem.description || '',
          url: selectedWishlistItem.url || '',
          image_url: selectedWishlistItem.image_url || '',
          price: selectedWishlistItem.price_min,
          category: selectedWishlistItem.category,
          exa_metadata: {},
        });
      }

      if (!prizeToAssign) return;

      // Assign the prize
      await apiClient.assignPrize(eventId, prizeToAssign.id, selectedParticipant.id);

      setSuccessMessage(
        `Successfully assigned "${prizeToAssign.title}" to ${selectedParticipant.full_name}!`
      );

      // Reset selection and reload data
      setSelectedParticipant(null);
      setSelectedPrize(null);
      setSelectedWishlistItem(null);
      await loadData();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Failed to assign prize:', error);
      alert(error.response?.data?.detail || 'Failed to assign prize');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary-500" size={40} />
      </div>
    );
  }

  const availablePrizes = prizes.filter((p) => p.status === 'available');

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 p-4 rounded-lg flex items-center gap-3"
        >
          <CheckCircle className="w-5 h-5" />
          <p>{successMessage}</p>
        </motion.div>
      )}

      {/* Assignment Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Assignment Progress
        </h3>

        <div className="flex items-center gap-4">
          {/* Step 1: Select Participant */}
          <div className="flex-1">
            <div
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedParticipant
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Step 1: Select Winner
              </p>
              {selectedParticipant ? (
                <p className="text-gray-900 dark:text-white font-semibold">
                  {selectedParticipant.full_name}
                </p>
              ) : (
                <p className="text-gray-500 text-sm">No participant selected</p>
              )}
            </div>
          </div>

          <ArrowRight className="text-gray-400" />

          {/* Step 2: Select Prize */}
          <div className="flex-1">
            <div
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedPrize || selectedWishlistItem
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Step 2: Select Prize or Wishlist Item
              </p>
              {selectedPrize ? (
                <p className="text-gray-900 dark:text-white font-semibold">
                  {selectedPrize.title} <span className="text-xs text-gray-500">(from pool)</span>
                </p>
              ) : selectedWishlistItem ? (
                <p className="text-gray-900 dark:text-white font-semibold">
                  {selectedWishlistItem.title} <span className="text-xs text-gray-500">(from wishlist)</span>
                </p>
              ) : (
                <p className="text-gray-500 text-sm">No prize selected</p>
              )}
            </div>
          </div>

          <ArrowRight className="text-gray-400" />

          {/* Step 3: Confirm */}
          <div className="flex-1">
            <Button
              onClick={handleAssignPrize}
              disabled={!selectedParticipant || (!selectedPrize && !selectedWishlistItem) || assigning}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-4"
            >
              {assigning ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin w-5 h-5" />
                  Assigning...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Gift className="w-5 h-5" />
                  Assign Prize
                </span>
              )}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Participants Section */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Select Participant ({participants.length})
          </h3>
          <ParticipantList
            participants={participants}
            onSelectParticipant={setSelectedParticipant}
            selectedParticipantId={selectedParticipant?.id}
            showSelection
          />
        </div>

        {/* Wishlist & Prizes Section */}
        <div className="space-y-6">
          {/* Participant Wishlist */}
          {selectedParticipant && (
            <div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {selectedParticipant.full_name}'s Wishlist ({wishlistItems.length})
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      💡 Click to select an item, then click "Assign Prize" button below
                    </p>
                  </div>
                  <Button
                    onClick={handleGetRecommendation}
                    disabled={loadingRecommendation || wishlistItems.length === 0 || availablePrizes.length === 0}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm"
                  >
                    {loadingRecommendation ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      '🤖 Get AI Recommendation'
                    )}
                  </Button>
                </div>
              </div>

              {loadingWishlist ? (
                <Card className="p-8 text-center">
                  <Loader2 className="animate-spin mx-auto text-primary-500" size={32} />
                </Card>
              ) : wishlistItems.length === 0 ? (
                <Card className="p-6 text-center text-gray-500">
                  <p>This participant hasn't added any wishlist items for this event yet.</p>
                </Card>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {wishlistItems.map((item) => (
                    <Card
                      key={item.id}
                      className={`p-4 cursor-pointer transition-all group ${
                        selectedWishlistItem?.id === item.id
                          ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-950/20 shadow-lg'
                          : 'hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600'
                      }`}
                      onClick={() => handleSelectWishlistItem(item)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 flex-shrink-0">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                              <Gift size={20} strokeWidth={1.5} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">
                            {item.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.category} • ${item.price_min}
                            {item.price_max && item.price_max !== item.price_min && `-$${item.price_max}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.priority === 1
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : item.priority === 2
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            Priority {item.priority}
                          </span>
                          <div className="text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <CheckCircle size={20} />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* AI Recommendation */}
              {recommendation && (
                <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-2 border-purple-200 dark:border-purple-800 mt-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🤖</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-2">AI Recommendation</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{recommendation.reasoning}</p>
                      {recommendation.search_suggestion && (
                        <p className="text-sm text-purple-600 dark:text-purple-400">
                          💡 Suggestion: Search for "{recommendation.search_suggestion}"
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Prizes Section */}
          <div className="pt-6 border-t-2 border-gray-200 dark:border-gray-700">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Or Select from Prize Pool ({availablePrizes.length})
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Click on a prize from your pool to select it, then click "Assign Prize" button
              </p>
            </div>
            {availablePrizes.length === 0 ? (
              <Card className="p-8 text-center text-gray-500">
                No available prizes in the pool. Add prizes in the Prize Pool tab first.
              </Card>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availablePrizes.map((prize, index) => (
                  <PrizeSelectionCard
                    key={prize.id}
                    prize={prize}
                    isSelected={selectedPrize?.id === prize.id}
                    onSelect={() => handleSelectPrize(prize)}
                    index={index}
                    isRecommended={recommendation?.recommended_prize_id === prize.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface PrizeSelectionCardProps {
  prize: EventPrize;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
  isRecommended?: boolean;
}

const PrizeSelectionCard: React.FC<PrizeSelectionCardProps> = ({
  prize,
  isSelected,
  isRecommended,
  onSelect,
  index,
}) => {
  const [imageError, setImageError] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={`p-4 cursor-pointer transition-all relative ${
          isSelected
            ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-950/20'
            : isRecommended
            ? 'ring-2 ring-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20'
            : 'hover:shadow-lg'
        }`}
        onClick={onSelect}
      >
        {isRecommended && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
            🤖 Recommended
          </div>
        )}
        <div className="flex items-center gap-4">
          {/* Image */}
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 flex-shrink-0">
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
                <Gift size={24} strokeWidth={1.5} />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
              {prize.title}
            </h4>
            {prize.price && (
              <p className="text-primary-500 font-bold">${prize.price}</p>
            )}
            {prize.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                {prize.description}
              </p>
            )}
          </div>

          {/* Selection Indicator */}
          <div className="flex-shrink-0">
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                isSelected
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              {isSelected && (
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
