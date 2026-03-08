import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from './ui/Card';
import { Trophy, Medal, Award, Gift, ExternalLink, Loader2 } from 'lucide-react';
import { apiClient } from '../services/api';

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
  assigned_at?: string;
  created_at: string;
}

interface Participant {
  id: number;
  full_name: string;
  username: string;
  age_group?: string;
  interests?: string[];
}

interface PrizeWithRecipient extends EventPrize {
  recipient?: Participant;
}

interface PrizeStandingsProps {
  eventId: number;
}

export const PrizeStandings: React.FC<PrizeStandingsProps> = ({ eventId }) => {
  const [prizes, setPrizes] = useState<PrizeWithRecipient[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      const [prizesData, participantsData] = await Promise.all([
        apiClient.getEventPrizes(eventId),
        apiClient.getEventParticipants(eventId, 'participant'),
      ]);

      // Filter only assigned prizes
      const assignedPrizes = prizesData.filter(
        (p: EventPrize) => p.status === 'assigned' || p.status === 'fulfilled'
      );

      // Match prizes with recipients
      const prizesWithRecipients = assignedPrizes.map((prize: EventPrize) => ({
        ...prize,
        recipient: participantsData.find((p: Participant) => p.id === prize.recipient_id),
      }));

      // Sort by assigned date (most recent first)
      prizesWithRecipients.sort((a, b) => {
        const dateA = new Date(a.assigned_at || a.created_at).getTime();
        const dateB = new Date(b.assigned_at || b.created_at).getTime();
        return dateA - dateB; // Earliest first for ranking
      });

      setPrizes(prizesWithRecipients);
      setParticipants(participantsData);
    } catch (error) {
      console.error('Failed to load standings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 1:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 2:
        return <Award className="w-8 h-8 text-amber-600" />;
      default:
        return <Gift className="w-6 h-6 text-gray-400" />;
    }
  };

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 border-yellow-300 dark:border-yellow-700';
      case 1:
        return 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800/30 dark:to-gray-700/30 border-gray-300 dark:border-gray-600';
      case 2:
        return 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-300 dark:border-amber-700';
      default:
        return 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700';
    }
  };

  const getRankLabel = (index: number) => {
    switch (index) {
      case 0:
        return '🥇 1st Place';
      case 1:
        return '🥈 2nd Place';
      case 2:
        return '🥉 3rd Place';
      default:
        return `#${index + 1}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary-500" size={40} />
      </div>
    );
  }

  if (prizes.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          No Winners Yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Assign prizes to participants to see the leaderboard here!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mb-4">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Prize Winners
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {prizes.length} {prizes.length === 1 ? 'winner' : 'winners'} announced
        </p>
      </div>

      {/* Winners List */}
      <div className="space-y-4">
        {prizes.map((prize, index) => (
          <motion.div
            key={prize.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`border-2 ${getMedalColor(index)} overflow-hidden`}>
              <div className="p-6">
                <div className="flex items-center gap-4">
                  {/* Rank/Medal */}
                  <div className="flex-shrink-0">
                    <div className="flex flex-col items-center">
                      {getMedalIcon(index)}
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 mt-1">
                        {getRankLabel(index)}
                      </span>
                    </div>
                  </div>

                  {/* Prize Image */}
                  {prize.image_url && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 flex-shrink-0">
                      <img
                        src={prize.image_url}
                        alt={prize.title}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Winner Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                          {prize.recipient?.full_name || 'Unknown Participant'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          @{prize.recipient?.username || 'unknown'}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-xs font-semibold">
                            {prize.category || 'Prize'}
                          </span>
                          {prize.price && (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                              ${prize.price}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Prize Details */}
                  <div className="flex-shrink-0 text-right max-w-xs">
                    <p className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {prize.title}
                    </p>
                    {prize.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                        {prize.description}
                      </p>
                    )}
                    {prize.url && (
                      <a
                        href={prize.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        View Product <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
