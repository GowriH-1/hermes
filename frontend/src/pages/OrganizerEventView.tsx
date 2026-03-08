import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PrizePoolManager } from '../components/PrizePoolManager';
import { PrizeAssignmentFlow } from '../components/PrizeAssignmentFlow';
import { PrizeStandings } from '../components/PrizeStandings';
import {
  Crown,
  Gift,
  Users,
  Calendar,
  ArrowLeft,
  Eye,
  Loader2,
  Award,
  Trash2,
  Trophy,
} from 'lucide-react';
import { apiClient } from '../services/api';
import { TopNav } from '../components/TopNav';

interface Event {
  id: number;
  name: string;
  description?: string;
  event_type: string;
  event_date?: string;
  created_by: number;
  invite_code: string;
  participant_count?: number;
  budget?: number;
}

interface EventPrize {
  id: number;
  title: string;
  price?: number;
  status: string;
}

const OrganizerEventView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const eventId = parseInt(id || '0');

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pool' | 'assign' | 'standings'>('pool');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [prizes, setPrizes] = useState<EventPrize[]>([]);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');

      const [eventData, prizesData] = await Promise.all([
        apiClient.getEvent(eventId),
        apiClient.getEventPrizes(eventId),
      ]);

      setEvent(eventData);
      setPrizes(prizesData);
      setBudgetInput(eventData.budget?.toString() || '0');

      // Check if user is the organizer
      if (eventData.created_by !== userData.id) {
        alert('Only the event organizer can access this page');
        navigate(`/events/${eventId}`);
        return;
      }
    } catch (error) {
      console.error('Failed to load event:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      setDeleting(true);
      await apiClient.deleteEvent(eventId);
      navigate('/event-management');
    } catch (error: any) {
      console.error('Failed to delete event:', error);
      alert(error.response?.data?.detail || 'Failed to delete event');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSaveBudget = async () => {
    try {
      const newBudget = parseFloat(budgetInput) || 0;
      const updatedEvent = await apiClient.updateEvent(eventId, { budget: newBudget });
      setEvent(updatedEvent);
      setEditingBudget(false);
    } catch (error: any) {
      console.error('Failed to update budget:', error);
      alert(error.response?.data?.detail || 'Failed to update budget');
    }
  };

  // Calculate spent budget
  const spentBudget = prizes
    .filter(p => p.status === 'assigned' || p.status === 'fulfilled')
    .reduce((sum, p) => sum + (p.price || 0), 0);

  const totalBudget = event?.budget || 0;
  const remainingBudget = totalBudget - spentBudget;
  const budgetPercentage = totalBudget > 0 ? (spentBudget / totalBudget) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-black dark:via-[#0a0a0a] dark:to-black">
        <TopNav />
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="animate-spin text-primary-500" size={48} />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-black dark:via-[#0a0a0a] dark:to-black">
        <TopNav />
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-500">Event not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-black dark:via-[#0a0a0a] dark:to-black">
      <TopNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Crown className="w-8 h-8 text-yellow-500" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Organizer Dashboard
                </h1>
              </div>
              <p className="text-xl text-gray-700 dark:text-gray-300 mb-2">
                {event.name}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                {event.event_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(event.event_date).toLocaleDateString()}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {event.participant_count || 0} participants
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link to={`/events/${eventId}/sponsor`}>
                <Button variant="outline" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  View as Sponsor
                </Button>
              </Link>
              <Button
                variant="outline"
                className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-300 dark:border-red-800"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4" />
                Delete Event
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Budget Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Prize Budget
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track your spending on prizes
                </p>
              </div>
              {!editingBudget ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingBudget(true)}
                >
                  {totalBudget > 0 ? 'Edit Budget' : 'Set Budget'}
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    placeholder="Enter budget"
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    style={{ width: '140px' }}
                  />
                  <Button size="sm" onClick={handleSaveBudget}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingBudget(false);
                      setBudgetInput(event?.budget?.toString() || '0');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {totalBudget > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Total Budget
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${totalBudget.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Spent
                    </p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      ${spentBudget.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Remaining
                    </p>
                    <p className={`text-2xl font-bold ${
                      remainingBudget >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      ${Math.abs(remainingBudget).toFixed(2)}
                      {remainingBudget < 0 && ' over'}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                      budgetPercentage > 100
                        ? 'bg-red-500'
                        : budgetPercentage > 80
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                  />
                  {budgetPercentage > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-semibold text-white drop-shadow">
                        {budgetPercentage.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Set a budget to track your prize spending
                </p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <StatsCard
            icon={<Gift className="w-6 h-6 text-purple-500" />}
            label="Total Prizes"
            value="View Pool"
            onClick={() => setActiveTab('pool')}
          />
          <StatsCard
            icon={<Award className="w-6 h-6 text-blue-500" />}
            label="Assign Prizes"
            value="Start"
            onClick={() => setActiveTab('assign')}
          />
          <StatsCard
            icon={<Trophy className="w-6 h-6 text-yellow-500" />}
            label="Winners"
            value="View"
            onClick={() => setActiveTab('standings')}
          />
          <StatsCard
            icon={<Users className="w-6 h-6 text-green-500" />}
            label="Participants"
            value={event.participant_count?.toString() || '0'}
          />
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex gap-8">
              <button
                onClick={() => setActiveTab('pool')}
                className={`pb-4 px-1 border-b-2 font-semibold transition-colors ${
                  activeTab === 'pool'
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Prize Pool
                </span>
              </button>
              <button
                onClick={() => setActiveTab('assign')}
                className={`pb-4 px-1 border-b-2 font-semibold transition-colors ${
                  activeTab === 'assign'
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Assign Prizes
                </span>
              </button>
              <button
                onClick={() => setActiveTab('standings')}
                className={`pb-4 px-1 border-b-2 font-semibold transition-colors ${
                  activeTab === 'standings'
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Winners
                </span>
              </button>
            </nav>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'pool' && <PrizePoolManager eventId={eventId} />}
          {activeTab === 'assign' && <PrizeAssignmentFlow eventId={eventId} onPrizeAssigned={loadData} />}
          {activeTab === 'standings' && <PrizeStandings eventId={eventId} />}
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#0a0a0a] rounded-lg p-6 max-w-md w-full border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Delete Event
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Are you sure you want to delete "{event?.name}"? This will permanently delete:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 mt-2 ml-4 list-disc">
                  <li>All participant data</li>
                  <li>All prizes and assignments</li>
                  <li>All sponsor matches</li>
                  <li>All event-linked wishlist items</li>
                </ul>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400 mt-2">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteEvent}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Event
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({ icon, label, value, onClick }) => {
  return (
    <Card
      className={`p-6 ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800">{icon}</div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
};

export default OrganizerEventView;
