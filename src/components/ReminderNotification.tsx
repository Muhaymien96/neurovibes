import React, { useState, useEffect } from 'react';
import { X, Volume2, VolumeX, Clock, CheckCircle } from 'lucide-react';
import { useElevenLabsTTS } from '../hooks/useElevenLabsTTS';

interface ReminderNotificationProps {
  reminder: {
    id: string;
    type: string;
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
    voice_message: string;
    suggested_action?: string;
  };
  onDismiss: () => void;
  onSnooze: () => void;
  onAction?: () => void;
  autoPlayVoice?: boolean;
}

export const ReminderNotification: React.FC<ReminderNotificationProps> = ({
  reminder,
  onDismiss,
  onSnooze,
  onAction,
  autoPlayVoice = false
}) => {
  const { speak, stop, isSpeaking } = useElevenLabsTTS();
  const [isVisible, setIsVisible] = useState(false);
  const [hasPlayedVoice, setHasPlayedVoice] = useState(false);

  useEffect(() => {
    // Animate in
    setIsVisible(true);
    
    // Auto-play voice if enabled and high priority
    if (autoPlayVoice && reminder.priority === 'high' && !hasPlayedVoice) {
      setTimeout(() => {
        speak(reminder.voice_message);
        setHasPlayedVoice(true);
      }, 1000);
    }
  }, [autoPlayVoice, reminder.priority, reminder.voice_message, hasPlayedVoice, speak]);

  const handleVoiceToggle = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(reminder.voice_message);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Wait for animation
  };

  const getPriorityStyles = () => {
    switch (reminder.priority) {
      case 'high':
        return 'bg-red-50 border-red-200 shadow-red-100';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 shadow-yellow-100';
      case 'low':
        return 'bg-green-50 border-green-200 shadow-green-100';
      default:
        return 'bg-gray-50 border-gray-200 shadow-gray-100';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 max-w-sm w-full z-50 transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`rounded-xl border-2 shadow-lg p-4 ${getPriorityStyles()}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-grow">
            <h4 className="font-semibold text-gray-900 text-sm mb-1">
              {reminder.title}
            </h4>
            <span className={`text-xs px-2 py-1 rounded-full ${
              reminder.priority === 'high' ? 'bg-red-100 text-red-800' :
              reminder.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {reminder.priority} priority
            </span>
          </div>
          
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-white/50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Message */}
        <p className="text-gray-700 text-sm mb-4 leading-relaxed">
          {reminder.message}
        </p>

        {/* Suggested Action */}
        {reminder.suggested_action && (
          <div className="bg-white/70 p-3 rounded-lg mb-4">
            <p className="text-xs font-medium text-gray-800 mb-1">Try this:</p>
            <p className="text-sm text-gray-700">{reminder.suggested_action}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleVoiceToggle}
              className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm"
            >
              {isSpeaking ? (
                <VolumeX className="h-3 w-3" />
              ) : (
                <Volume2 className="h-3 w-3" />
              )}
              <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
            </button>

            {onAction && reminder.suggested_action && (
              <button
                onClick={onAction}
                className="flex items-center space-x-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
              >
                <CheckCircle className="h-3 w-3" />
                <span>Do it</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onSnooze}
              className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <Clock className="h-3 w-3" />
              <span>30m</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};