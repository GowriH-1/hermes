import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PrizePoolManager } from '../components/PrizePoolManager';
import { PrizeAssignmentFlow } from '../components/PrizeAssignmentFlow';
import {
  Crown,
  Gift,
  Users,
  Calendar,
  ArrowLeft,
  Eye,
  Loader2,
  Award,
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
}

const OrganizerEventView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const eventId = parseInt(id || '0');

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pool' | 'assign'>('pool');

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');

      const eventData = await apiClient.getEvent(eventId);
      setEvent(eventData);

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
            Back to Dashboard
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
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
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
          {activeTab === 'assign' && <PrizeAssignmentFlow eventId={eventId} />}
        </motion.div>
      </div>
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
