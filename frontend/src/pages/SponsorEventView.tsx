import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { FilterPanel } from '../components/FilterPanel';
import { MatchCard } from '../components/MatchCard';
import { TopNav } from '../components/TopNav';
import { apiClient } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
interface Event {
  id: number;
  name: string;
  description?: string;
  website_url?: string;
  event_type: string;
  event_date?: string;
  brand_info?: {
    primary_color?: string;
    secondary_color?: string;
    logo_url?: string;
    tagline?: string;
  };
}

interface MatchSuggestion {
  wishlist_item: {
    id: number;
    title: string;
    description?: string;
    url?: string;
    image_url?: string;
    price_min?: number;
    price_max?: number;
    category?: string;
    priority?: number;
  };
  user: {
    id: number;
    full_name: string;
    age_group?: string;
    interests?: string[];
  };
  score_breakdown: {
    budget_score: number;
    category_score: number;
    demographics_score: number;
    priority_score: number;
    total_score: number;
  };
  explanation: string;
}

interface MatchFilters {
  event_id: number;
  budget_min?: number;
  budget_max?: number;
  categories?: string[];
  age_groups?: string[];
  min_score?: number;
}

export const SponsorDashboard: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { } = useAuth();
  const { setBrandConfig } = useTheme();

  const [event, setEvent] = useState<Event | null>(null);
  const [matches, setMatches] = useState<MatchSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (event?.brand_info) {
      setBrandConfig(event.brand_info);
    }
    return () => setBrandConfig(null);
  }, [event, setBrandConfig]);

  useEffect(() => {
    if (!eventId) {
      navigate('/event-management');
      return;
    }
    loadEventAndPreferences();
  }, [eventId]);

  const loadEventAndPreferences = async () => {
    try {
      setLoading(true);

      // Load event details
      const eventData = await apiClient.getEvent(Number(eventId));
      setEvent(eventData);

      // Try to load saved preferences and auto-run matching
      try {
        const prefs = await apiClient.getSponsorPreferences(Number(eventId));
        if (prefs) {
          // Auto-run matching with saved preferences
          await handleFilter({
            event_id: Number(eventId),
            budget_min: prefs.budget_min,
            budget_max: prefs.budget_max,
            categories: prefs.preferred_categories,
            age_groups: prefs.target_age_groups,
            min_score: 50,
          });
        }
      } catch {
        // No saved preferences - user needs to set filters
      }
    } catch (error: any) {
      console.error('Failed to load event:', error);
      toast.error(error.response?.data?.detail || 'Failed to load event');
      if (error.response?.status === 404 || error.response?.status === 403) {
        navigate('/event-management');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async (filters: MatchFilters) => {
    setMatching(true);
    setHasSearched(true);
    try {
      const response = await apiClient.getMatchSuggestions(filters);
      setMatches(response.matches || []);
    } catch (error) {
      console.error('Matching failed:', error);
      setMatches([]);
    } finally {
      setMatching(false);
    }
  };

  const handleClaimGift = async (match: MatchSuggestion) => {
    try {
      await apiClient.claimGift({
        wishlist_item_id: match.wishlist_item.id,
        event_id: Number(eventId),
        notes: `Claimed via smart matching (Score: ${match.score_breakdown.total_score.toFixed(0)}/100)`,
      });

      // Show success feedback with confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast.success(
        `Successfully claimed "${match.wishlist_item.title}" for ${match.user.full_name}!`,
        { duration: 5000 }
      );

      // Remove claimed item from results
      setMatches((prev) =>
        prev.filter((m) => m.wishlist_item.id !== match.wishlist_item.id)
      );
    } catch (error: any) {
      console.error('Failed to claim gift:', error);
      toast.error(
        error.response?.data?.detail ||
          'Failed to claim gift. It may have already been claimed.'
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-primary mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 dark:text-gray-300">Event not found</p>
          <button
            onClick={() => navigate('/event-management')}
            className="mt-4 text-brand-primary hover:text-brand-primary-hover font-medium"
          >
            Return to Event Management
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <TopNav />

      {/* Page Header */}
      <div className="bg-white dark:bg-[#0a0a0a] border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Gift Matching: <span className="text-brand-primary">{event.name}</span>
              </h1>
              {event.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{event.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar: Filter Panel (1/4 width on desktop) */}
          <div className="lg:col-span-1">
            <FilterPanel
              eventId={Number(eventId)}
              onFilter={handleFilter}
              isLoading={matching}
            />
          </div>

          {/* Right Content: Match Results (3/4 width on desktop) */}
          <div className="lg:col-span-3">
            {/* Loading State */}
            {matching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="relative inline-block">
                  <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-primary-500" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl">🎯</span>
                  </div>
                </div>
                <p className="mt-6 text-lg text-gray-700 dark:text-gray-300 font-medium">
                  Matching Agent analyzing preferences...
                </p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Finding the perfect gift matches for you
                </p>
              </motion.div>
            )}

            {/* Empty State (no search yet) */}
            {!matching && !hasSearched && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="text-6xl mb-4">🎁</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Ready to Find Perfect Matches?
                </h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                  Set your preferences in the filter panel and click "Match Now" to
                  discover wishlist items that perfectly match your budget and
                  interests.
                </p>
              </motion.div>
            )}

            {/* Empty State (no matches found) */}
            {!matching && hasSearched && matches.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  No Matches Found
                </h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                  Try adjusting your filters or budget range to find more gift
                  options. You can also lower the minimum match score threshold.
                </p>
              </motion.div>
            )}

            {/* Match Results */}
            {!matching && matches.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {/* Results Header */}
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                      Found {matches.length} Perfect{' '}
                      {matches.length === 1 ? 'Match' : 'Matches'} 🎯
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      Sorted by match score • Click to claim gifts
                    </p>
                  </div>
                </div>

                {/* Match Cards Grid */}
                <div className="space-y-6">
                  {matches.map((match, index) => (
                    <MatchCard
                      key={match.wishlist_item.id}
                      match={match}
                      onClaim={handleClaimGift}
                      index={index}
                    />
                  ))}
                </div>

                {/* Results Footer */}
                <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  Showing {matches.length} of {matches.length} matches
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SponsorDashboard;
