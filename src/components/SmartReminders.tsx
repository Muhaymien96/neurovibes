import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  Clock, 
  AlertTriangle, 
  Heart, 
  Sparkles, 
  Volume2, 
  VolumeX,
  Pause,
  CheckCircle
} from 'lucide-react';
import { useSmartReminders } from '../hooks/useSmartReminders';
import { useElevenLabsTTS } from '../hooks/useElevenLabsTTS';

export const SmartReminders: React.FC = () => {
  const { 
    reminders, 
    userPatterns, 
    loading, 
    dismissReminder, 
    snoozeReminder,
    fetchSmartReminders 
  } = useSmartReminders();
  
  const { speak, stop, isSpeaking } = useElevenLabsTTS();
  const [expandedReminder, setExpandedReminder] = useState<string | null>(null);
  const [showPatterns, setShowPatterns] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deadline_warning':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'mood_based':
        return <Heart className="h-5 w-5 text-pink-600" />;
      case 'transition_nudge':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'encouragement':
        return <Sparkles className="h-5 w-5 text-purple-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const handleVoiceReminder = (reminder: any) => {
    if (isSpeaking) {
      stop();
    } else {
      speak(reminder.voice_message);
    }
  };

  if (loading && reminders.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
          <span className="text-gray-600">Analyzing your patterns...</span>
        </div>
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-center space-x-3 mb-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <h3 className="font-semibold text-green-900">All caught up!</h3>
        </div>
        <p className="text-green-700 text-sm mb-4">
          No urgent reminders right now. You're doing great managing your tasks and energy!
        </p>
        <button
          onClick={fetchSmartReminders}
          className="text-green-600 hover:text-green-700 text-sm font-medium"
        >
          Check for updates
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="h-6 w-6 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Smart Reminders</h3>
          <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
            {reminders.length}
          </span>
        </div>
        
        {userPatterns && (
          <button
            onClick={() => setShowPatterns(!showPatterns)}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            {showPatterns ? 'Hide' : 'Show'} Patterns
          </button>
        )}
      </div>

      {/* User Patterns */}
      {showPatterns && userPatterns && (
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
          <h4 className="font-medium text-indigo-900 mb-3">Your Productivity Patterns</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-indigo-700 font-medium">Most Productive Hours:</span>
              <p className="text-indigo-600">
                {userPatterns.productive_hours.map(h => `${h}:00`).join(', ') || 'Still learning...'}
              </p>
            </div>
            <div>
              <span className="text-indigo-700 font-medium">Completion Rate:</span>
              <p className="text-indigo-600">
                {Math.round(userPatterns.task_completion_rate * 100)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reminders List */}
      <div className="space-y-3">
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            className={`border-l-4 rounded-lg p-4 shadow-sm ${getPriorityColor(reminder.priority)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-grow">
                {getTypeIcon(reminder.type)}
                <div className="flex-grow">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900">{reminder.title}</h4>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {reminder.timing.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                    {reminder.message}
                  </p>

                  {reminder.suggested_action && (
                    <div className="bg-white/70 p-3 rounded-lg mb-3">
                      <p className="text-sm font-medium text-gray-800 mb-1">Suggested Action:</p>
                      <p className="text-sm text-gray-700">{reminder.suggested_action}</p>
                    </div>
                  )}

                  {reminder.context.energy_recommendation && (
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <Heart className="h-3 w-3" />
                      <span>{reminder.context.energy_recommendation}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleVoiceReminder(reminder)}
                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                  title="Listen to reminder"
                >
                  {isSpeaking ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
                
                <button
                  onClick={() => snoozeReminder(reminder.id, 30)}
                  className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
                  title="Snooze for 30 minutes"
                >
                  <Pause className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => dismissReminder(reminder.id)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Dismiss reminder"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Refresh Button */}
      <div className="text-center pt-4">
        <button
          onClick={fetchSmartReminders}
          disabled={loading}
          className="text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Refresh Reminders'}
        </button>
      </div>
    </div>
  );
};