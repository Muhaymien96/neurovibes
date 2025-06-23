import React from 'react';
import { Brain, Volume2, VolumeX, Sparkles, CheckCircle, Clock } from 'lucide-react';
import { useElevenLabsTTS } from '../hooks/useElevenLabsTTS';

interface AICoachResponseProps {
  response: {
    coaching_response: string;
    subtasks?: string[];
    priority_suggestion?: 'low' | 'medium' | 'high';
    estimated_time?: string;
    encouragement: string;
  };
  onSubtaskAdd?: (subtask: string) => void;
}

export const AICoachResponse: React.FC<AICoachResponseProps> = ({ 
  response, 
  onSubtaskAdd 
}) => {
  const { speak, stop, isSpeaking, loading } = useElevenLabsTTS();

  const handleSpeakResponse = () => {
    if (isSpeaking) {
      stop();
    } else {
      const fullText = `${response.coaching_response} ${response.encouragement}`;
      speak(fullText);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-indigo-900">Your AI Coach</h3>
            <p className="text-sm text-indigo-600">Here to support you</p>
          </div>
        </div>
        
        <button
          onClick={handleSpeakResponse}
          disabled={loading}
          className={`p-2 rounded-full transition-colors ${
            loading 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
          }`}
          title={isSpeaking ? 'Stop speaking' : 'Listen to response'}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : isSpeaking ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Main Response */}
      <div className="mb-4">
        <p className="text-indigo-800 leading-relaxed mb-3">
          {response.coaching_response}
        </p>
        
        {/* Metadata */}
        <div className="flex flex-wrap gap-2 mb-3">
          {response.priority_suggestion && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(response.priority_suggestion)}`}>
              {response.priority_suggestion} priority
            </span>
          )}
          
          {response.estimated_time && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{response.estimated_time}</span>
            </span>
          )}
        </div>
      </div>

      {/* Subtasks */}
      {response.subtasks && response.subtasks.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-indigo-900 mb-2 flex items-center space-x-1">
            <CheckCircle className="h-4 w-4" />
            <span>Suggested Steps:</span>
          </h4>
          <div className="space-y-2">
            {response.subtasks.map((subtask, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white p-3 rounded-lg border border-indigo-100"
              >
                <span className="text-gray-700 text-sm flex-grow">{subtask}</span>
                {onSubtaskAdd && (
                  <button
                    onClick={() => onSubtaskAdd(subtask)}
                    className="ml-3 px-3 py-1 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Add as Task
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Encouragement */}
      <div className="bg-white/70 p-4 rounded-xl border border-purple-100">
        <div className="flex items-start space-x-2">
          <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
          <p className="text-purple-800 text-sm italic leading-relaxed">
            {response.encouragement}
          </p>
        </div>
      </div>
    </div>
  );
};