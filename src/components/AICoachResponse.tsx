import React, { useState } from 'react';
import { Brain, Volume2, VolumeX, Sparkles, CheckCircle, Clock, Plus, Target, Lightbulb, Edit3, X, Trash2 } from 'lucide-react';
import { useElevenLabsTTS } from '../hooks/useElevenLabsTTS';
import { TaskEditForm } from './TaskEditForm';

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
    suggested_tasks?: TaskSuggestion[];
    overall_strategy?: string;
    time_estimate?: string;
    personalized_insights?: string[];
    recommended_strategies?: string[];
  };
  onSubtaskAdd?: (subtask: string) => void;
  onTaskAdd?: (task: TaskSuggestion) => Promise<void>;
  onAddAllTasks?: (tasks: TaskSuggestion[]) => Promise<void>;
  onRejectSuggestions?: () => void;
}

export const AICoachResponse: React.FC<AICoachResponseProps> = ({ 
  response, 
  onSubtaskAdd,
  onTaskAdd,
  onAddAllTasks,
  onRejectSuggestions
}) => {
  const { speak, stop, isSpeaking, loading } = useElevenLabsTTS();
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [editedTasks, setEditedTasks] = useState<TaskSuggestion[]>(response.suggested_tasks || []);
  const [addingTasks, setAddingTasks] = useState(false);
  const [addingTaskIndex, setAddingTaskIndex] = useState<number | null>(null);
  const [removedTaskIndices, setRemovedTaskIndices] = useState<Set<number>>(new Set());

  React.useEffect(() => {
    if (response.suggested_tasks) {
      setEditedTasks(response.suggested_tasks);
      setRemovedTaskIndices(new Set());
    }
  }, [response.suggested_tasks]);

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

  const handleAddAllTasks = async () => {
    const tasksToAdd = editedTasks.filter((_, index) => !removedTaskIndices.has(index));
    if (tasksToAdd.length === 0 || !onAddAllTasks) return;
    
    setAddingTasks(true);
    try {
      await onAddAllTasks(tasksToAdd);
      // Mark all remaining tasks as removed after successful addition
      const allIndices = new Set(editedTasks.map((_, index) => index));
      setRemovedTaskIndices(allIndices);
    } catch (error) {
      console.error('Error adding all tasks:', error);
    } finally {
      setAddingTasks(false);
    }
  };

  const handleAddSingleTask = async (task: TaskSuggestion, index: number) => {
    if (!onTaskAdd) return;
    
    setAddingTaskIndex(index);
    try {
      await onTaskAdd(task);
      // Remove this task from the suggestions after successful addition
      setRemovedTaskIndices(prev => new Set([...prev, index]));
    } catch (error) {
      console.error('Error adding single task:', error);
    } finally {
      setAddingTaskIndex(null);
    }
  };

  const handleRemoveTask = (index: number) => {
    setRemovedTaskIndices(prev => new Set([...prev, index]));
  };

  const handleEditTask = (index: number) => {
    setEditingTask(index);
  };

  const handleSaveEdit = (index: number) => {
    setEditingTask(null);
  };

  const handleCancelEdit = (index: number) => {
    const originalTask = response.suggested_tasks?.[index];
    if (originalTask) {
      const newEditedTasks = [...editedTasks];
      newEditedTasks[index] = { ...originalTask };
      setEditedTasks(newEditedTasks);
    }
    setEditingTask(null);
  };

  const updateEditedTask = (index: number, field: keyof TaskSuggestion, value: any) => {
    const newEditedTasks = [...editedTasks];
    newEditedTasks[index] = { ...newEditedTasks[index], [field]: value };
    setEditedTasks(newEditedTasks);
  };

  const addSubtaskToEdit = (taskIndex: number, subtask: string) => {
    if (!subtask.trim()) return;
    
    const newEditedTasks = [...editedTasks];
    const currentSubtasks = newEditedTasks[taskIndex].subtasks || [];
    newEditedTasks[taskIndex] = {
      ...newEditedTasks[taskIndex],
      subtasks: [...currentSubtasks, subtask.trim()]
    };
    setEditedTasks(newEditedTasks);
  };

  const removeSubtaskFromEdit = (taskIndex: number, subtaskIndex: number) => {
    const newEditedTasks = [...editedTasks];
    const currentSubtasks = newEditedTasks[taskIndex].subtasks || [];
    newEditedTasks[taskIndex] = {
      ...newEditedTasks[taskIndex],
      subtasks: currentSubtasks.filter((_, index) => index !== subtaskIndex)
    };
    setEditedTasks(newEditedTasks);
  };

  const addTagToEdit = (taskIndex: number, tag: string) => {
    if (!tag.trim()) return;
    
    const newEditedTasks = [...editedTasks];
    const currentTags = newEditedTasks[taskIndex].tags || [];
    if (!currentTags.includes(tag.trim())) {
      newEditedTasks[taskIndex] = {
        ...newEditedTasks[taskIndex],
        tags: [...currentTags, tag.trim()]
      };
      setEditedTasks(newEditedTasks);
    }
  };

  const removeTagFromEdit = (taskIndex: number, tagIndex: number) => {
    const newEditedTasks = [...editedTasks];
    const currentTags = newEditedTasks[taskIndex].tags || [];
    newEditedTasks[taskIndex] = {
      ...newEditedTasks[taskIndex],
      tags: currentTags.filter((_, index) => index !== tagIndex)
    };
    setEditedTasks(newEditedTasks);
  };

  const isWorkloadBreakdown = editedTasks && editedTasks.length > 0;
  const visibleTasks = editedTasks.filter((_, index) => !removedTaskIndices.has(index));
  const hasVisibleTasks = visibleTasks.length > 0;

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
              {isWorkloadBreakdown ? 'Smart task breakdown' : 'Here to support you'}
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
          aria-label={isSpeaking ? 'Stop speaking response' : 'Listen to AI response'}
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
              <span>{hasVisibleTasks ? visibleTasks.length : 0} tasks suggested</span>
            </span>
          </div>
        )}
      </div>

      {/* Strategy for workload breakdown */}
      {isWorkloadBreakdown && response.overall_strategy && (
        <div className="mb-6 bg-white/70 p-4 rounded-xl">
          <h4 className="font-medium text-indigo-900 mb-2 flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>Strategy</span>
          </h4>
          <p className="text-indigo-800 text-sm leading-relaxed">{response.overall_strategy}</p>
        </div>
      )}

      {/* Suggested Tasks for workload breakdown */}
      {isWorkloadBreakdown && hasVisibleTasks && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-indigo-900">Suggested Tasks</h4>
            <div className="flex items-center space-x-2">
              {onAddAllTasks && (
                <button
                  onClick={handleAddAllTasks}
                  disabled={addingTasks}
                  className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Add all suggested tasks to your task list"
                >
                  {addingTasks ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Add All</span>
                    </>
                  )}
                </button>
              )}
              {onRejectSuggestions && (
                <button
                  onClick={onRejectSuggestions}
                  className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                  aria-label="Reject all task suggestions"
                >
                  <X className="h-4 w-4" />
                  <span>Reject All</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            {editedTasks.map((task, index) => {
              if (removedTaskIndices.has(index)) return null;
              
              return (
                <div key={index} className="bg-white p-4 rounded-lg border border-indigo-100">
                  {editingTask === index ? (
                    <TaskEditForm
                      task={task}
                      index={index}
                      onSave={handleSaveEdit}
                      onCancel={handleCancelEdit}
                      onUpdateTask={updateEditedTask}
                      onAddSubtask={addSubtaskToEdit}
                      onRemoveSubtask={removeSubtaskFromEdit}
                      onAddTag={addTagToEdit}
                      onRemoveTag={removeTagFromEdit}
                    />
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-grow">
                          <h5 className="font-medium text-gray-900 mb-1">{task.title}</h5>
                          <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                          
                          <div className="flex items-center space-x-3 text-xs mb-3">
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
                              <p className="text-xs font-medium text-gray-700 mb-1">Subtasks:</p>
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
                        
                        <div className="flex items-center space-x-2 ml-3">
                          <button
                            onClick={() => handleEditTask(index)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            aria-label={`Edit task: ${task.title}`}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleRemoveTask(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label={`Remove task: ${task.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          
                          {onTaskAdd && (
                            <button
                              onClick={() => handleAddSingleTask(task, index)}
                              disabled={addingTaskIndex === index}
                              className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label={`Add task: ${task.title}`}
                            >
                              {addingTaskIndex === index ? (
                                <div className="flex items-center space-x-1">
                                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                  <span>Adding...</span>
                                </div>
                              ) : (
                                'Add Task'
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Show message when all tasks are removed/added */}
      {isWorkloadBreakdown && !hasVisibleTasks && editedTasks.length > 0 && (
        <div className="mb-6 bg-green-50 p-4 rounded-xl border border-green-200">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-800 text-sm">All suggested tasks have been processed!</p>
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
                    aria-label={`Add subtask: ${subtask}`}
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