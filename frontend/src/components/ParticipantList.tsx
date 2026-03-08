import React from 'react';
import { motion } from 'framer-motion';
import { Card } from './ui/Card';
import { User, UserCheck } from 'lucide-react';

interface Participant {
  id: number;
  full_name: string;
  username: string;
  age_group?: string;
  interests?: string[];
}

interface ParticipantListProps {
  participants: Participant[];
  onSelectParticipant?: (participant: Participant) => void;
  selectedParticipantId?: number;
  showSelection?: boolean;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  onSelectParticipant,
  selectedParticipantId,
  showSelection = true,
}) => {
  if (participants.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No participants found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {participants.map((participant, index) => {
        const isSelected = selectedParticipantId === participant.id;

        return (
          <motion.div
            key={participant.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className={`p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-950/20'
                  : 'hover:shadow-lg'
              }`}
              onClick={() => onSelectParticipant?.(participant)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {participant.full_name}
                    </h3>
                    {isSelected && (
                      <UserCheck className="w-5 h-5 text-primary-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    @{participant.username}
                  </p>

                  {participant.age_group && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      Age: {participant.age_group}
                    </p>
                  )}

                  {participant.interests && participant.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {participant.interests.map((interest) => (
                        <span
                          key={interest}
                          className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {showSelection && (
                  <div className="ml-2">
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
                )}
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
