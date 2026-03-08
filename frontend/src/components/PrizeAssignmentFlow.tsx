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

interface PrizeAssignmentFlowProps {
  eventId: number;
}

export const PrizeAssignmentFlow: React.FC<PrizeAssignmentFlowProps> = ({ eventId }) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [prizes, setPrizes] = useState<EventPrize[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [selectedPrize, setSelectedPrize] = useState<EventPrize | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      const [participantsData, prizesData] = await Promise.all([
        apiClient.getEventParticipants(eventId, 'participant'),
        apiClient.getEventPrizes(eventId, 'available'),
      ]);
      setParticipants(participantsData);
      setPrizes(prizesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPrize = async () => {
    if (!selectedParticipant || !selectedPrize) return;

    setAssigning(true);
    try {
      await apiClient.assignPrize(eventId, selectedPrize.id, selectedParticipant.id);
      setSuccessMessage(
        `Successfully assigned "${selectedPrize.title}" to ${selectedParticipant.full_name}!`
      );

      // Reset selection and reload data
      setSelectedParticipant(null);
      setSelectedPrize(null);
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
                selectedPrize
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Step 2: Select Prize
              </p>
              {selectedPrize ? (
                <p className="text-gray-900 dark:text-white font-semibold">
                  {selectedPrize.title}
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
              disabled={!selectedParticipant || !selectedPrize || assigning}
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

        {/* Prizes Section */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Select Prize ({availablePrizes.length})
          </h3>
          {availablePrizes.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              No available prizes in the pool. Add prizes in the Prize Pool tab first.
            </Card>
          ) : (
            <div className="space-y-3">
              {availablePrizes.map((prize, index) => (
                <PrizeSelectionCard
                  key={prize.id}
                  prize={prize}
                  isSelected={selectedPrize?.id === prize.id}
                  onSelect={() => setSelectedPrize(prize)}
                  index={index}
                />
              ))}
            </div>
          )}
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
}

const PrizeSelectionCard: React.FC<PrizeSelectionCardProps> = ({
  prize,
  isSelected,
  onSelect,
  index,
}) => {
  const placeholder = 'https://via.placeholder.com/100x100?text=Prize';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={`p-4 cursor-pointer transition-all ${
          isSelected
            ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-950/20'
            : 'hover:shadow-lg'
        }`}
        onClick={onSelect}
      >
        <div className="flex items-center gap-4">
          {/* Image */}
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
            <img
              src={prize.image_url || placeholder}
              alt={prize.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = placeholder;
              }}
            />
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
