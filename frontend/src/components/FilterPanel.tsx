import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { apiClient } from '../services/api';

interface FilterPanelProps {
  eventId: number;
  onFilter: (filters: MatchFilters) => void;
  isLoading?: boolean;
}

interface MatchFilters {
  event_id: number;
  budget_min?: number;
  budget_max?: number;
  categories?: string[];
  age_groups?: string[];
  min_score?: number;
}

const CATEGORIES = [
  { value: 'tech', label: 'Tech' },
  { value: 'books', label: 'Books' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'sports', label: 'Sports' },
  { value: 'other', label: 'Other' },
];

const AGE_GROUPS = [
  { value: '18-24', label: '18-24' },
  { value: '25-34', label: '25-34' },
  { value: '35-44', label: '35-44' },
  { value: '45-54', label: '45-54' },
  { value: '55+', label: '55+' },
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  eventId,
  onFilter,
  isLoading = false
}) => {
  const [budgetMin, setBudgetMin] = useState(50);
  const [budgetMax, setBudgetMax] = useState(200);
  const [categories, setCategories] = useState<string[]>(['tech']);
  const [ageGroups, setAgeGroups] = useState<string[]>(['18-24']);
  const [savePreferences, setSavePreferences] = useState(true);
  const [minScore, setMinScore] = useState(50);

  // Load saved preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await apiClient.getSponsorPreferences(eventId);
        if (prefs) {
          setBudgetMin(prefs.budget_min || 50);
          setBudgetMax(prefs.budget_max || 200);
          setCategories(prefs.preferred_categories || ['tech']);
          setAgeGroups(prefs.target_age_groups || ['18-24']);
        }
      } catch (error) {
        // No saved preferences yet - use defaults
      }
    };
    loadPreferences();
  }, [eventId]);

  const toggleCategory = (category: string) => {
    if (categories.includes(category)) {
      setCategories(categories.filter(c => c !== category));
    } else {
      setCategories([...categories, category]);
    }
  };

  const toggleAgeGroup = (ageGroup: string) => {
    if (ageGroups.includes(ageGroup)) {
      setAgeGroups(ageGroups.filter(ag => ag !== ageGroup));
    } else {
      setAgeGroups([...ageGroups, ageGroup]);
    }
  };

  const handleMatch = async () => {
    if (savePreferences) {
      try {
        await apiClient.saveSponsorPreferences({
          event_id: eventId,
          budget_min: budgetMin,
          budget_max: budgetMax,
          preferred_categories: categories,
          target_age_groups: ageGroups,
        });
      } catch (error) {
        console.error('Failed to save preferences:', error);
      }
    }

    onFilter({
      event_id: eventId,
      budget_min: budgetMin,
      budget_max: budgetMax,
      categories: categories.length > 0 ? categories : undefined,
      age_groups: ageGroups.length > 0 ? ageGroups : undefined,
      min_score: minScore,
    });
  };

  return (
    <Card className="p-6 shadow-lg sticky top-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-bold text-gray-900">Filter Preferences</h3>
          <p className="text-sm text-gray-500 mt-1">
            Set your criteria to find perfect matches
          </p>
        </div>

        {/* Budget Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Budget Range
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(Number(e.target.value))}
                placeholder="Min"
                min={0}
                className="w-full"
              />
            </div>
            <span className="text-gray-500">to</span>
            <div className="flex-1">
              <Input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(Number(e.target.value))}
                placeholder="Max"
                min={budgetMin}
                className="w-full"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            ${budgetMin} - ${budgetMax}
          </p>
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categories
          </label>
          <div className="space-y-2">
            {CATEGORIES.map((category) => (
              <label
                key={category.value}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={categories.includes(category.value)}
                  onChange={() => toggleCategory(category.value)}
                  className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{category.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Age Groups */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Age Groups
          </label>
          <div className="space-y-2">
            {AGE_GROUPS.map((ageGroup) => (
              <label
                key={ageGroup.value}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={ageGroups.includes(ageGroup.value)}
                  onChange={() => toggleAgeGroup(ageGroup.value)}
                  className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{ageGroup.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Min Score Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Match Score
          </label>
          <Input
            type="number"
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            placeholder="Min score"
            min={0}
            max={100}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Only show matches scoring {minScore}+ out of 100
          </p>
        </div>

        {/* Save Preferences */}
        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
          <input
            type="checkbox"
            checked={savePreferences}
            onChange={(e) => setSavePreferences(e.target.checked)}
            className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">Save my preferences</span>
        </label>

        {/* Match Now Button */}
        <Button
          onClick={handleMatch}
          disabled={isLoading}
          className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 animate-pulse"
        >
          {isLoading ? (
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
              Matching...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Match Now 🎯
            </span>
          )}
        </Button>

        {/* Info */}
        <div className="text-xs text-gray-500 text-center border-t pt-4">
          Powered by AI-driven matching algorithm
        </div>
      </div>
    </Card>
  );
};
