import React from 'react';
import { Brain, Volume2, VolumeX, Sparkles, CheckCircle, Clock, Plus, Target, Lightbulb } from 'lucide-react';
import { useElevenLabsTTS } from '../hooks/useElevenLabsTTS';

interface TaskSuggestion {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimated_time: string;
  subtasks?: string[];
  tags?: string[];
}

interface AICoachResponseProps {
  response: {
    coaching_response: string;
    subtasks?: string[];
    priority_suggestion?: 'low' | 'medium' | 'high';
    estimated_time?: string;
    encouragement: string;
    // New fields for workload breakdown
    suggested_tasks?: TaskSuggestion[];
    overall_strategy?: string;
    time_estimate?: string;
    personalized_insights?: string[];
    recommended_strategies?: string[];
  };
  onSubtaskAdd?: (subtask: string) => void;
  onTaskAdd?: (task: TaskSuggestion) => void;
}

export const AICoachResponse: React.FC<AICoachResponseProps> = ({ 
  response, 
  onSubtaskAdd,
  onTaskAdd
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

  const handleAddAllTasks = () => {
    if (response.suggested_tasks && onTaskAdd) {
      response.suggested_tasks.forEach(task => onTaskAdd(task));
    }
  };

  // Check if this is a workload breakdown response
  const isWorkloadBreakdown = response.suggested_tasks && response.suggested_tasks.length > 0;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
            {isWorkloadBreakdown ? (
              <Lightbulb className="h-5 w-5 text-white" />
            ) : (
              <Brain className="h-5 w-5 text-white" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-indigo-900">
              {isWorkloadBreakdown ? 'AI Workload Analysis' : 'Your AI Coach'}
            </h3>
            <p className="text-sm text-indigo-600">
              {isWorkloadBreakdown ? 'Smart task breakdown for your workload' : 'Here to support you'}
            </p>
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
        
        {/* Metadata for regular coaching */}
        {!isWorkloadBreakdown && (
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
        )}

        {/* Workload breakdown metadata */}
        {isWorkloadBreakdown && (
          <div className="flex items-center space-x-4 text-sm mb-4">
            {response.time_estimate && (
              <span className="flex items-center space-x-1 text-indigo-700">
                <Clock className="h-4 w-4" />
                <span>Total time: {response.time_estimate}</span>
              </span>
            )}
            <span className="flex items-center space-x-1 text-indigo-700">
              <Target className="h-4 w-4" />
              <span>{response.suggested_tasks?.length || 0} tasks suggested</span>
            </span>
          </div>
        )}
      </div>

      {/* Strategy for workload breakdown */}
      {isWorkloadBreakdown && response.overall_strategy && (
        <div className="mb-6 bg-white/70 p-4 rounded-xl">
          <h4 className="font-medium text-indigo-900 mb-2 flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>Recommended Strategy</span>
          </h4>
          <p className="text-indigo-800 text-sm leading-relaxed">{response.overall_strategy}</p>
        </div>
      )}

      {/* Suggested Tasks for workload breakdown */}
      {isWorkloadBreakdown && response.suggested_tasks && response.suggested_tasks.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-indigo-900">Suggested Tasks</h4>
            {onTaskAdd && (
              <button
                onClick={handleAddAllTasks}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add All Tasks</span>
              </button>
            )}
          </div>
          
          <div className="space-y-3">
            {response.suggested_tasks.map((task, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-indigo-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-grow">
                    <h5 className="font-medium text-gray-900 mb-1">{task.title}</h5>
                    <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                    
                    <div className="flex items-center space-x-3 text-xs">
                      <span className={`px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority} priority
                      </span>
                      <span className="text-gray-500">~{task.estimated_time}</span>
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex items-center space-x-1">
                          {task.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">Suggested subtasks:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {task.subtasks.map((subtask, subIndex) => (
                            <li key={subIndex} className="flex items-start space-x-2">
                              <span className="text-indigo-500 mt-0.5">•</span>
                              <span>{subtask}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {onTaskAdd && (
                    <button
                      onClick={() => onTaskAdd(task)}
                      className="ml-3 px-3 py-1 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Add Task
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regular subtasks for non-workload responses */}
      {!isWorkloadBreakdown && response.subtasks && response.subtasks.length > 0 && (
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

      {/* Personalized Insights */}
      {response.personalized_insights && response.personalized_insights.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-indigo-900 mb-2">Personalized Insights</h4>
          <ul className="space-y-1">
            {response.personalized_insights.map((insight, index) => (
              <li key={index} className="text-sm text-indigo-700 flex items-start space-x-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Strategies */}
      {response.recommended_strategies && response.recommended_strategies.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-indigo-900 mb-2">Recommended Strategies</h4>
          <ul className="space-y-1">
            {response.recommended_strategies.map((strategy, index) => (
              <li key={index} className="text-sm text-indigo-700 flex items-start space-x-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span>{strategy}</span>
              </li>
            ))}
          </ul>
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