import React, { useState, useEffect } from 'react';
import { Heart, Battery, Focus, Plus, TrendingUp, BarChart3, Calendar, Lightbulb } from 'lucide-react';
import { MoodEntry, createMoodEntry, getMoodEntries } from '../lib/supabase';
import { useAICoach } from '../hooks/useAICoach';
import { useAuth } from '../hooks/useAuth';

interface MoodInsights {
  productivity_patterns: string[];
  mood_correlations: string[];
  task_completion_insights: string[];
  personalized_recommendations: string[];
}

export const MoodTracker: React.FC = () => {
  const { user } = useAuth();
  const { getContextualInsights } = useAICoach();
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [insights, setInsights] = useState<MoodInsights | null>(null);
  const [loading, setLoading] = useState(true);
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
    loadMoodEntries();
  }, []);

  const loadMoodEntries = async () => {
    try {
      const { data, error } = await getMoodEntries(30); // Last 30 entries
      if (error) throw error;
      setMoodEntries(data || []);
    } catch (error) {
      console.error('Error loading mood entries:', error);
    } finally {
      setLoading(false);
    }
  };

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
    try {
      const { data, error } = await createMoodEntry(newEntry);
      if (error) throw error;
      if (data) {
        setMoodEntries([data, ...moodEntries]);
        setNewEntry({ mood_score: 5, energy_level: 5, focus_level: 5, notes: '' });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error creating mood entry:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score <= 3) return 'text-red-600';
    if (score <= 6) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getScoreBackground = (score: number) => {
    if (score <= 3) return 'bg-red-100';
    if (score <= 6) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  const calculateAverages = (entries: MoodEntry[], days: number) => {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentEntries = entries.filter(entry => new Date(entry.created_at) >= cutoffDate);
    
    if (recentEntries.length === 0) return null;
    
    const totals = recentEntries.reduce(
      (acc, entry) => ({
        mood: acc.mood + entry.mood_score,
        energy: acc.energy + entry.energy_level,
        focus: acc.focus + entry.focus_level,
      }),
      { mood: 0, energy: 0, focus: 0 }
    );
    
    return {
      mood: (totals.mood / recentEntries.length).toFixed(1),
      energy: (totals.energy / recentEntries.length).toFixed(1),
      focus: (totals.focus / recentEntries.length).toFixed(1),
      count: recentEntries.length,
    };
  };

  const renderTrendChart = () => {
    if (moodEntries.length < 2) {
      return (
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p>Add more mood entries to see trends</p>
        </div>
      );
    }

    const last7Days = moodEntries.slice(0, 7).reverse();
    const maxScore = 10;
    
    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Last 7 Days Trend</h4>
        <div className="relative h-48 bg-gray-50 rounded-lg p-4">
          <svg className="w-full h-full" viewBox="0 0 400 160">
            {/* Grid lines */}
            {[0, 2, 4, 6, 8, 10].map(score => (
              <line
                key={score}
                x1="40"
                y1={140 - (score * 14)}
                x2="380"
                y2={140 - (score * 14)}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            ))}
            
            {/* Y-axis labels */}
            {[0, 2, 4, 6, 8, 10].map(score => (
              <text
                key={score}
                x="30"
                y={145 - (score * 14)}
                fontSize="10"
                fill="#6b7280"
                textAnchor="end"
              >
                {score}
              </text>
            ))}
            
            {/* Data lines */}
            {last7Days.length > 1 && (
              <>
                {/* Mood line */}
                <polyline
                  points={last7Days.map((entry, index) => 
                    `${50 + (index * 50)},${140 - (entry.mood_score * 14)}`
                  ).join(' ')}
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth="2"
                />
                
                {/* Energy line */}
                <polyline
                  points={last7Days.map((entry, index) => 
                    `${50 + (index * 50)},${140 - (entry.energy_level * 14)}`
                  ).join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                />
                
                {/* Focus line */}
                <polyline
                  points={last7Days.map((entry, index) => 
                    `${50 + (index * 50)},${140 - (entry.focus_level * 14)}`
                  ).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
                
                {/* Data points */}
                {last7Days.map((entry, index) => (
                  <g key={entry.id}>
                    <circle cx={50 + (index * 50)} cy={140 - (entry.mood_score * 14)} r="3" fill="#ec4899" />
                    <circle cx={50 + (index * 50)} cy={140 - (entry.energy_level * 14)} r="3" fill="#10b981" />
                    <circle cx={50 + (index * 50)} cy={140 - (entry.focus_level * 14)} r="3" fill="#3b82f6" />
                  </g>
                ))}
              </>
            )}
            
            {/* X-axis labels */}
            {last7Days.map((entry, index) => (
              <text
                key={entry.id}
                x={50 + (index * 50)}
                y="155"
                fontSize="10"
                fill="#6b7280"
                textAnchor="middle"
              >
                {new Date(entry.created_at).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
              </text>
            ))}
          </svg>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
            <span>Mood</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Energy</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Focus</span>
          </div>
        </div>
      </div>
    );
  };

  const ScoreSlider: React.FC<{
    label: string;
    icon: React.ReactNode;
    value: number;
    onChange: (value: number) => void;
  }> = ({ label, icon, value, onChange }) => (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        {icon}
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className={`text-lg font-bold ${getScoreColor(value)}`}>{value}</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>Low</span>
        <span>High</span>
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

  const weeklyAvg = calculateAverages(moodEntries, 7);
  const monthlyAvg = calculateAverages(moodEntries, 30);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">Mood Tracker</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('recent')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'recent' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setViewMode('trends')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'trends' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
              viewMode === 'insights' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Insights
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Log Mood</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {(weeklyAvg || monthlyAvg) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {weeklyAvg && (
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Last 7 Days Average</span>
              </h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className={`text-2xl font-bold ${getScoreColor(parseFloat(weeklyAvg.mood))}`}>
                    {weeklyAvg.mood}
                  </div>
                  <div className="text-xs text-gray-600">Mood</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${getScoreColor(parseFloat(weeklyAvg.energy))}`}>
                    {weeklyAvg.energy}
                  </div>
                  <div className="text-xs text-gray-600">Energy</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${getScoreColor(parseFloat(weeklyAvg.focus))}`}>
                    {weeklyAvg.focus}
                  </div>
                  <div className="text-xs text-gray-600">Focus</div>
                </div>
              </div>
            </div>
          )}
          
          {monthlyAvg && (
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Last 30 Days Average</span>
              </h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className={`text-2xl font-bold ${getScoreColor(parseFloat(monthlyAvg.mood))}`}>
                    {monthlyAvg.mood}
                  </div>
                  <div className="text-xs text-gray-600">Mood</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${getScoreColor(parseFloat(monthlyAvg.energy))}`}>
                    {monthlyAvg.energy}
                  </div>
                  <div className="text-xs text-gray-600">Energy</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${getScoreColor(parseFloat(monthlyAvg.focus))}`}>
                    {monthlyAvg.focus}
                  </div>
                  <div className="text-xs text-gray-600">Focus</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Mood Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <form onSubmit={handleCreateEntry} className="space-y-6">
            <div className="grid gap-6">
              <ScoreSlider
                label="Mood"
                icon={<Heart className="h-5 w-5 text-pink-600" />}
                value={newEntry.mood_score}
                onChange={(value) => setNewEntry({ ...newEntry, mood_score: value })}
              />
              
              <ScoreSlider
                label="Energy Level"
                icon={<Battery className="h-5 w-5 text-green-600" />}
                value={newEntry.energy_level}
                onChange={(value) => setNewEntry({ ...newEntry, energy_level: value })}
              />
              
              <ScoreSlider
                label="Focus Level"
                icon={<Focus className="h-5 w-5 text-blue-600" />}
                value={newEntry.focus_level}
                onChange={(value) => setNewEntry({ ...newEntry, focus_level: value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={newEntry.notes}
                onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="How are you feeling? What's affecting your mood today?"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
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
      {viewMode === 'trends' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          {renderTrendChart()}
        </div>
      )}

      {viewMode === 'insights' && (
        <div className="space-y-4">
          {insightsLoading ? (
            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Analyzing your patterns...</p>
            </div>
          ) : insights ? (
            <>
              {insights.productivity_patterns.length > 0 && (
                <div className="bg-white p-6 rounded-xl border border-gray-200">
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

              {insights.mood_correlations.length > 0 && (
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-pink-600" />
                    <span>Mood Correlations</span>
                  </h4>
                  <ul className="space-y-2">
                    {insights.mood_correlations.map((correlation, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-pink-500 mt-1">•</span>
                        <span className="text-gray-700">{correlation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {insights.personalized_recommendations.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-3 flex items-center space-x-2">
                    <Lightbulb className="h-5 w-5 text-purple-600" />
                    <span>Personalized Recommendations</span>
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
            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
              <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No insights yet</h4>
              <p className="text-gray-600">Add more mood entries and tasks to unlock personalized insights!</p>
            </div>
          )}
        </div>
      )}

      {viewMode === 'recent' && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Recent Entries</span>
          </h4>
          
          {moodEntries.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No mood entries yet</h4>
              <p className="text-gray-600">Start tracking your mood to see patterns and insights!</p>
            </div>
          ) : (
            moodEntries.slice(0, 10).map((entry) => (
              <div
                key={entry.id}
                className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
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
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${getScoreBackground(entry.mood_score)}`}>
                      <span className={`text-sm font-bold ${getScoreColor(entry.mood_score)}`}>
                        {entry.mood_score}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Battery className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-gray-600">Energy</span>
                    </div>
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${getScoreBackground(entry.energy_level)}`}>
                      <span className={`text-sm font-bold ${getScoreColor(entry.energy_level)}`}>
                        {entry.energy_level}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Focus className="h-4 w-4 text-blue-600" />
                      <span className="text-xs text-gray-600">Focus</span>
                    </div>
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${getScoreBackground(entry.focus_level)}`}>
                      <span className={`text-sm font-bold ${getScoreColor(entry.focus_level)}`}>
                        {entry.focus_level}
                      </span>
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
    </div>
  );
};