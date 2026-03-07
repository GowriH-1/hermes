import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ScoreBreakdown } from './ScoreBreakdown';
import { ExternalLink, Gift, Sparkles } from 'lucide-react';

interface MatchCardProps {
  match: MatchSuggestion;
  onClaim: (match: MatchSuggestion) => void;
  index?: number;
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

const getScoreColor = (score: number): string => {
  if (score >= 90) return 'bg-green-500 text-white';
  if (score >= 75) return 'bg-blue-500 text-white';
  if (score >= 60) return 'bg-yellow-500 text-white';
  return 'bg-gray-500 text-white';
};

const getScoreEmoji = (score: number): string => {
  if (score >= 90) return '🎯';
  if (score >= 75) return '✨';
  if (score >= 60) return '👍';
  return '📌';
};

const getScoreLabel = (score: number): string => {
  if (score >= 90) return 'Perfect Match';
  if (score >= 75) return 'Great Match';
  if (score >= 60) return 'Good Match';
  return 'Fair Match';
};

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onClaim,
  index = 0,
}) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const totalScore = match.score_breakdown.total_score;
  const placeholder = 'https://via.placeholder.com/400x300?text=Gift+Item';

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      await onClaim(match);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{
        scale: 1.02,
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
      }}
      className="relative"
    >
      <Card className="overflow-hidden bg-white">
        {/* Score Badge - Top Right */}
        <div className="absolute top-4 right-4 z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 + index * 0.1, type: 'spring' }}
            className={`px-4 py-2 rounded-full font-bold text-lg shadow-lg ${getScoreColor(
              totalScore
            )}`}
          >
            {getScoreEmoji(totalScore)} {totalScore.toFixed(0)}/100
          </motion.div>
        </div>

        {/* Product Image */}
        <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
          <img
            src={match.wishlist_item.image_url || placeholder}
            alt={match.wishlist_item.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = placeholder;
            }}
          />

          {/* Match Label Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <span className="text-white text-sm font-semibold">
              {getScoreLabel(totalScore)}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-4">
          {/* Title & Price */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {match.wishlist_item.title}
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {match.user.full_name}
                {match.user.age_group && ` • ${match.user.age_group}`}
                {match.wishlist_item.category && ` • ${match.wishlist_item.category}`}
              </p>
              {match.wishlist_item.price_min && (
                <p className="text-lg font-bold text-primary-500">
                  ${match.wishlist_item.price_min}
                  {match.wishlist_item.price_max &&
                    match.wishlist_item.price_max !== match.wishlist_item.price_min &&
                    ` - $${match.wishlist_item.price_max}`}
                </p>
              )}
            </div>
          </div>

          {/* Description (if available) */}
          {match.wishlist_item.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {match.wishlist_item.description}
            </p>
          )}

          {/* Priority Stars */}
          {match.wishlist_item.priority && (
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={
                    i < match.wishlist_item.priority!
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }
                >
                  ★
                </span>
              ))}
              <span className="text-xs text-gray-500 ml-2">
                Priority {match.wishlist_item.priority}/5
              </span>
            </div>
          )}

          {/* Score Breakdown */}
          <div className="pt-4 border-t border-gray-200">
            <ScoreBreakdown scores={match.score_breakdown} showLabels={false} />
          </div>

          {/* AI Explanation */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: isExpanded ? 1 : 0.9,
              height: isExpanded ? 'auto' : '60px',
            }}
            className="relative"
          >
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start gap-2">
                <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {match.explanation}
                  </p>
                </div>
              </div>
            </div>
            {!isExpanded && match.explanation.length > 100 && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            )}
          </motion.div>

          {match.explanation.length > 100 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-blue-500 hover:text-blue-600 font-medium"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleClaim}
              disabled={isClaiming}
              className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isClaiming ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Claiming...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Gift className="w-5 h-5" />
                  Claim Gift
                </span>
              )}
            </Button>

            {match.wishlist_item.url && (
              <Button
                variant="outline"
                onClick={() => window.open(match.wishlist_item.url, '_blank')}
                className="px-4 py-3 border-2 border-gray-300 hover:border-primary-500 hover:text-primary-500 transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Powered by Exa Badge */}
          <div className="flex items-center justify-center pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              Matched by AI • Powered by Exa
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
