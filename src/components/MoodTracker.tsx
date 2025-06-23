import React, { useState, useEffect } from 'react';
import { Heart, Battery, Focus, Plus, TrendingUp, BarChart3, Calendar, Lightbulb } from 'lucide-react';
import { useMoodStore, useAuthStore } from '../store';
import { useAICoach } from '../hooks/useAICoach';

interface MoodInsights {
  productivity_patterns: string[];
  mood_correlations: string[];
  task_completion_insights: string[];
  personalized_recommendations: string[];
}

const moodEmojis = [
  { score: 1, emoji: '😢', label: 'Terrible', color: 'bg-red-500' },
  { score: 2, emoji: '😞', label: 'Bad', color: 'bg-red-400' },
  { score: 3, emoji: '😕', label: 'Poor', color: 'bg-orange-400' },
  { score: 4, emoji: '😐', label: 'Okay', color: 'bg-yellow-400' },
  { score: 5, emoji: '🙂', label: 'Fine', color: 'bg-yellow-300' },
  { score: 6, emoji: '😊', label: 'Good', color: 'bg-green-300' },
  { score: 7, emoji: '😄', label: 'Great', color: 'bg-green-400' },
  { score: 8, emoji: '😁', label: 'Excellent', color: 'bg-green-500' },
  { score: 9, emoji: '🤩', label: 'Amazing', color: 'bg-green-600' },
  { score: 10, emoji: '🥳', label: 'Perfect', color: 'bg-green-700' },
];

const energyEmojis = [
  { score: 1, emoji: '😴', label: 'Exhausted', color: 'bg-red-500' },
  { score: 2, emoji: '😪', label: 'Drained', color: 'bg-red-400' },
  { score: 3, emoji: '😑', label: 'Tired', color: 'bg-orange-400' },
  { score: 4, emoji: '😌', label: 'Low', color: 'bg-yellow-400' },
  { score: 5, emoji: '🙂', label: 'Okay', color: 'bg-yellow-300' },
  { score: 6, emoji: '😊', label: 'Good', color: 'bg-green-300' },
  { score: 7, emoji: '😃', label: 'High', color: 'bg-green-400' },
  { score: 8, emoji: '😆', label: 'Energetic', color: 'bg-green-500' },
  { score: 9, emoji: '🤸', label: 'Pumped', color: 'bg-green-600' },
  { score: 10, emoji: '⚡', label: 'Electric', color: 'bg-green-700' },
];

const focusEmojis = [
  { score: 1, emoji: '🌪️', label: 'Scattered', color: 'bg-red-500' },
  { score: 2, emoji: '😵‍💫', label: 'Confused', color: 'bg-red-400' },
  { score: 3, emoji: '😵', label: 'Foggy', color: 'bg-orange-400' },
  { score: 4, emoji: '😶‍🌫️', label: 'Unclear', color: 'bg-yellow-400' },
  { score: 5, emoji: '😐', label: 'Okay', color: 'bg-yellow-300' },
  { score: 6, emoji: '🙂', label: 'Clear', color: 'bg-green-300' },
  { score: 7, emoji: '😌', label: 'Focused', color: 'bg-green-400' },
  { score: 8, emoji: '🧘', label: 'Sharp', color: 'bg-green-500' },
  { score: 9, emoji: '🎯', label: 'Laser', color: 'bg-green-600' },
  { score: 10, emoji: '🔥', label: 'Zone', color: 'bg-green-700' },
];

export const MoodTracker: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    entries, 
    loading, 
    error, 
    loadEntries, 
    createEntry, 
    getAverages, 
    getRecentTrend 
  } = useMoodStore();
  
  const { getContextualInsights } = useAICoach();
  const [insights, setInsights] = useState<MoodInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [viewMode, setViewMode] = useState<'recent' | 'trends' | 'insights'>('recent');
  const [newEntry, setNewEntry] = useState({
    mood_score: 5,
    energy_level: 5,
    focus_level: 5,
    notes: '',
  });

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const loadInsights = async () => {
    if (!user?.id) return;
    
    setInsightsLoading(true);
    try {
      const insightsData = await getContextualInsights(user.id);
      if (insightsData) {
        setInsights(insightsData);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const createdEntry = await createEntry(newEntry);
    
    if (createdEntry) {
      setNewEntry({ mood_score: 5, energy_level: 5, focus_level: 5, notes: '' });
      setShowAddForm(false);
    }
  };

  const getThemeColors = () => {
    const recentEntry = entries[0];
    if (!recentEntry) return { primary: 'indigo', bg: 'from-indigo-50 to-purple-50' };

    const avgMood = (recentEntry.mood_score + recentEntry.energy_level + recentEntry.focus_level) / 3;
    
    if (avgMood >= 8) return { primary: 'green', bg: 'from-green-50 to-emerald-50' };
    if (avgMood >= 6) return { primary: 'blue', bg: 'from-blue-50 to-cyan-50' };
    if (avgMood >= 4) return { primary: 'yellow', bg: 'from-yellow-50 to-orange-50' };
    return { primary: 'red', bg: 'from-red-50 to-pink-50' };
  };

  const theme = getThemeColors();

  const EmojiSelector: React.FC<{
    label: string;
    icon: React.ReactNode;
    value: number;
    onChange: (value: number) => void;
    emojis: typeof moodEmojis;
  }> = ({ label, icon, value, onChange, emojis }) => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        {icon}
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-lg">{emojis.find(e => e.score === value)?.emoji}</span>
        <span className="text-sm text-gray-600">{emojis.find(e => e.score === value)?.label}</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {emojis.map((emoji) => (
          <button
            key={emoji.score}
            type="button"
            onClick={() => onChange(emoji.score)}
            className={`p-3 rounded-xl border-2 transition-all hover:scale-105 ${
              value === emoji.score 
                ? `${emoji.color} border-gray-400 shadow-md` 
                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-1">{emoji.emoji}</div>
            <div className="text-xs font-medium">{emoji.score}</div>
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const weeklyAvg = getAverages(7);
  const monthlyAvg = getAverages(30);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg} -m-8 p-8`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900">Mood Tracker</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('recent')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'recent' ? `bg-${theme.primary}-600 text-white` : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setViewMode('trends')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'trends' ? `bg-${theme.primary}-600 text-white` : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Trends
            </button>
            <button
              onClick={() => {
                setViewMode('insights');
                if (!insights) loadInsights();
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'insights' ? `bg-${theme.primary}-600 text-white` : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Insights
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className={`flex items-center space-x-2 bg-${theme.primary}-600 text-white px-4 py-2 rounded-lg hover:bg-${theme.primary}-700 transition-colors`}
            >
              <Plus className="h-4 w-4" />
              <span>Log Mood</span>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        {(weeklyAvg || monthlyAvg) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weeklyAvg && (
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Last 7 Days</span>
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl mb-1">{moodEmojis.find(e => e.score === Math.round(weeklyAvg.mood))?.emoji}</div>
                    <div className="text-xs text-gray-600">Mood</div>
                  </div>
                  <div>
                    <div className="text-2xl mb-1">{energyEmojis.find(e => e.score === Math.round(weeklyAvg.energy))?.emoji}</div>
                    <div className="text-xs text-gray-600">Energy</div>
                  </div>
                  <div>
                    <div className="text-2xl mb-1">{focusEmojis.find(e => e.score === Math.round(weeklyAvg.focus))?.emoji}</div>
                    <div className="text-xs text-gray-600">Focus</div>
                  </div>
                </div>
              </div>
            )}
            
            {monthlyAvg && (
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Last 30 Days</span>
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl mb-1">{moodEmojis.find(e => e.score === Math.round(monthlyAvg.mood))?.emoji}</div>
                    <div className="text-xs text-gray-600">Mood</div>
                  </div>
                  <div>
                    <div className="text-2xl mb-1">{energyEmojis.find(e => e.score === Math.round(monthlyAvg.energy))?.emoji}</div>
                    <div className="text-xs text-gray-600">Energy</div>
                  </div>
                  <div>
                    <div className="text-2xl mb-1">{focusEmojis.find(e => e.score === Math.round(monthlyAvg.focus))?.emoji}</div>
                    <div className="text-xs text-gray-600">Focus</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Mood Form */}
        {showAddForm && (
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl border border-gray-200 shadow-sm">
            <form onSubmit={handleCreateEntry} className="space-y-6">
              <EmojiSelector
                label="Mood"
                icon={<Heart className="h-5 w-5 text-pink-600" />}
                value={newEntry.mood_score}
                onChange={(value) => setNewEntry({ ...newEntry, mood_score: value })}
                emojis={moodEmojis}
              />
              
              <EmojiSelector
                label="Energy Level"
                icon={<Battery className="h-5 w-5 text-green-600" />}
                value={newEntry.energy_level}
                onChange={(value) => setNewEntry({ ...newEntry, energy_level: value })}
                emojis={energyEmojis}
              />
              
              <EmojiSelector
                label="Focus Level"
                icon={<Focus className="h-5 w-5 text-blue-600" />}
                value={newEntry.focus_level}
                onChange={(value) => setNewEntry({ ...newEntry, focus_level: value })}
                emojis={focusEmojis}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="How are you feeling today?"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className={`bg-${theme.primary}-600 text-white px-4 py-2 rounded-lg hover:bg-${theme.primary}-700 transition-colors`}
                >
                  Save Entry
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Content based on view mode */}
        {viewMode === 'recent' && (
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Recent Entries</span>
            </h4>
            
            {entries.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No mood entries yet</h4>
                <p className="text-gray-600">Start tracking your mood to see patterns!</p>
              </div>
            ) : (
              entries.slice(0, 10).map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString()} at{' '}
                      {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Heart className="h-4 w-4 text-pink-600" />
                        <span className="text-xs text-gray-600">Mood</span>
                      </div>
                      <div className="text-2xl mb-1">
                        {moodEmojis.find(e => e.score === entry.mood_score)?.emoji}
                      </div>
                      <div className="text-xs text-gray-600">
                        {moodEmojis.find(e => e.score === entry.mood_score)?.label}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Battery className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-gray-600">Energy</span>
                      </div>
                      <div className="text-2xl mb-1">
                        {energyEmojis.find(e => e.score === entry.energy_level)?.emoji}
                      </div>
                      <div className="text-xs text-gray-600">
                        {energyEmojis.find(e => e.score === entry.energy_level)?.label}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Focus className="h-4 w-4 text-blue-600" />
                        <span className="text-xs text-gray-600">Focus</span>
                      </div>
                      <div className="text-2xl mb-1">
                        {focusEmojis.find(e => e.score === entry.focus_level)?.emoji}
                      </div>
                      <div className="text-xs text-gray-600">
                        {focusEmojis.find(e => e.score === entry.focus_level)?.label}
                      </div>
                    </div>
                  </div>
                  
                  {entry.notes && (
                    <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                      {entry.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {viewMode === 'insights' && (
          <div className="space-y-4">
            {insightsLoading ? (
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-200 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Analyzing your patterns...</p>
              </div>
            ) : insights ? (
              <>
                {insights.productivity_patterns.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <span>Productivity Patterns</span>
                    </h4>
                    <ul className="space-y-2">
                      {insights.productivity_patterns.map((pattern, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span className="text-gray-700">{pattern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {insights.personalized_recommendations.length > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-3 flex items-center space-x-2">
                      <Lightbulb className="h-5 w-5 text-purple-600" />
                      <span>Recommendations</span>
                    </h4>
                    <ul className="space-y-2">
                      {insights.personalized_recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-purple-500 mt-1">•</span>
                          <span className="text-purple-800">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-200 text-center">
                <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No insights yet</h4>
                <p className="text-gray-600">Add more mood entries to unlock insights!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};