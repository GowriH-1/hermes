import React from 'react';
import { motion } from 'framer-motion';

interface ScoreBreakdownProps {
  scores: {
    budget_score: number;
    category_score: number;
    demographics_score: number;
    priority_score: number;
  };
  showLabels?: boolean;
}

interface ScoreItem {
  name: string;
  value: number;
  max: number;
  color: string;
  bgColor: string;
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({
  scores,
  showLabels = true,
}) => {
  const data: ScoreItem[] = [
    {
      name: 'Budget',
      value: scores.budget_score,
      max: 40,
      color: '#8B5CF6', // Purple
      bgColor: 'rgba(139, 92, 246, 0.1)',
    },
    {
      name: 'Category',
      value: scores.category_score,
      max: 30,
      color: '#EC4899', // Pink
      bgColor: 'rgba(236, 72, 153, 0.1)',
    },
    {
      name: 'Demographics',
      value: scores.demographics_score,
      max: 20,
      color: '#06B6D4', // Cyan
      bgColor: 'rgba(6, 182, 212, 0.1)',
    },
    {
      name: 'Priority',
      value: scores.priority_score,
      max: 10,
      color: '#10B981', // Green
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
  ];

  return (
    <div className="space-y-3">
      {showLabels && (
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Match Score Breakdown
        </h4>
      )}

      {data.map((item, index) => (
        <div key={item.name} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {item.name}
            </span>
            <span className="text-sm font-bold text-gray-900">
              {item.value.toFixed(1)}/{item.max}
            </span>
          </div>

          {/* Progress Bar Background */}
          <div
            className="relative h-3 rounded-full overflow-hidden"
            style={{ backgroundColor: item.bgColor }}
          >
            {/* Animated Progress Bar */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / item.max) * 100}%` }}
              transition={{
                duration: 1,
                delay: index * 0.15,
                ease: 'easeOut',
              }}
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />

            {/* Percentage Text Inside Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.15, duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="text-xs font-bold text-gray-700">
                {Math.round((item.value / item.max) * 100)}%
              </span>
            </motion.div>
          </div>
        </div>
      ))}

      {/* Total Score Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-gray-900">Total Score</span>
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.3 }}
            className="text-lg font-bold text-primary-500"
          >
            {(
              scores.budget_score +
              scores.category_score +
              scores.demographics_score +
              scores.priority_score
            ).toFixed(1)}
            /100
          </motion.span>
        </div>
      </div>
    </div>
  );
};

// Compact version for card previews
export const ScoreBreakdownCompact: React.FC<ScoreBreakdownProps> = ({
  scores,
}) => {
  const data = [
    { value: scores.budget_score, max: 40, color: '#8B5CF6' },
    { value: scores.category_score, max: 30, color: '#EC4899' },
    { value: scores.demographics_score, max: 20, color: '#06B6D4' },
    { value: scores.priority_score, max: 10, color: '#10B981' },
  ];

  return (
    <div className="flex gap-1">
      {data.map((item, index) => (
        <div
          key={index}
          className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(item.value / item.max) * 100}%` }}
            transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: item.color }}
          />
        </div>
      ))}
    </div>
  );
};
