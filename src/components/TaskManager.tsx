import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Brain, 
  ChevronRight, 
  ChevronDown,
  GripVertical,
  Repeat,
  Calendar,
  Tag,
  MoreHorizontal,
  Save,
  X,
  Lightbulb,
  Target,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Star,
  Gauge
} from 'lucide-react';
import { useTasksStore, useAuthStore } from '../store';
import { useAICoach } from '../hooks/useAICoach';
import { AICoachResponse } from './AICoachResponse';
import { Task } from '../lib/supabase';

interface TaskSuggestion {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimated_time: string;
  subtasks?: string[];
  tags?: string[];
  complexity?: number;
}

export const TaskManager: React.FC = () => {
  const { user } = useAuthStore();
  const {
    tasks,
    loading,
    error,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    reorderTask,
    toggleTaskExpansion,
    getTaskById
  } = useTasksStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [showTaskMenu, setShowTaskMenu] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [workloadInput, setWorkloadInput] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    due_date: '',
    parent_task_id: '',
    recurrence_pattern: '',
    recurrence_end_date: '',
    tags: [] as string[],
    complexity: 3,
    estimated_time: '',
  });
  const [newTag, setNewTag] = useState('');

  const { getCoachingResponse, loading: aiLoading } = useAICoach();

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const coachingResponse = await getCoachingResponse({
      input: `${newTask.title}. ${newTask.description}`,
      type: 'task',
      context: {
        existing_tasks: tasks.map(t => t.title),
        user_id: user?.id,
        include_historical_data: true,
      }
    });

    if (coachingResponse) {
      setAiResponse(coachingResponse);
    }

    const taskData = {
      ...newTask,
      priority: coachingResponse?.priority_suggestion || newTask.priority,
      parent_task_id: newTask.parent_task_id || undefined,
      recurrence_pattern: newTask.recurrence_pattern || undefined,
      recurrence_end_date: newTask.recurrence_end_date || undefined,
      due_date: newTask.due_date || undefined,
      tags: newTask.tags,
    };

    const createdTask = await createTask(taskData);
    
    if (createdTask) {
      setNewTask({ 
        title: '', 
        description: '', 
        priority: 'medium', 
        due_date: '', 
        parent_task_id: '',
        recurrence_pattern: '',
        recurrence_end_date: '',
        tags: [],
        complexity: 3,
        estimated_time: '',
      });
      setShowAddForm(false);
    }
  };

  const handleWorkloadBreakdown = async () => {
    if (!workloadInput.trim()) return;
    
    const response = await getCoachingResponse({
      input: workloadInput,
      type: 'brain_dump',
      context: {
        existing_tasks: tasks.map(t => ({ title: t.title, priority: t.priority, status: t.status })),
        user_id: user?.id,
        include_historical_data: true,
        workload_breakdown: true,
      }
    });

    if (response) {
      setAiResponse(response);
      setWorkloadInput('');
    }
  };

  const handleTaskAdd = async (taskSuggestion: TaskSuggestion) => {
    try {
      const taskData = {
        title: taskSuggestion.title,
        description: taskSuggestion.description,
        priority: taskSuggestion.priority,
        due_date: undefined,
        parent_task_id: undefined,
        recurrence_pattern: undefined,
        recurrence_end_date: undefined,
        tags: taskSuggestion.tags || [],
        complexity: taskSuggestion.complexity || 3,
      };

      const createdTask = await createTask(taskData);
      
      if (createdTask) {
        if (taskSuggestion.subtasks && taskSuggestion.subtasks.length > 0) {
          for (const subtaskTitle of taskSuggestion.subtasks) {
            const subtaskData = {
              title: subtaskTitle,
              description: `Subtask of: ${taskSuggestion.title}`,
              priority: 'medium' as Task['priority'],
              due_date: undefined,
              parent_task_id: createdTask.id,
              tags: ['subtask'],
              complexity: Math.max(1, (taskSuggestion.complexity || 3) - 1),
            };
            
            await createTask(subtaskData);
          }
        }
      }
    } catch (error) {
      console.error('Error in handleTaskAdd:', error);
    }
  };

  const handleAddAllTasks = async (tasks: TaskSuggestion[]) => {
    if (!tasks || tasks.length === 0) {
      return;
    }

    try {
      for (const task of tasks) {
        await handleTaskAdd(task);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error adding all tasks:', error);
    }
  };

  const handleRejectSuggestions = () => {
    setAiResponse(null);
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task.id);
    setEditFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
      tags: task.tags || [],
      complexity: task.complexity || 3,
      estimated_time: task.estimated_time || '',
    });
    setShowTaskMenu(null);
  };

  const handleSaveEdit = async () => {
    if (!editingTask) return;

    await updateTask(editingTask, {
      title: editFormData.title,
      description: editFormData.description,
      priority: editFormData.priority,
      due_date: editFormData.due_date || undefined,
      tags: editFormData.tags,
      complexity: editFormData.complexity,
    });

    setEditingTask(null);
    setEditFormData({});
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditFormData({});
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    setShowTaskMenu(null);
  };

  const handleSubtaskAdd = async (subtaskTitle: string, parentId?: string) => {
    const subtaskData = {
      title: subtaskTitle,
      description: 'Generated from AI coaching',
      priority: 'medium' as Task['priority'],
      due_date: undefined,
      parent_task_id: parentId,
      complexity: 2,
    };
    
    await createTask(subtaskData);
  };

  const handleUpdateTaskStatus = async (id: string, status: Task['status']) => {
    const updates: Partial<Task> = { status };
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }
    
    await updateTask(id, updates);
    
    const task = getTaskById(id);
    if (status === 'completed' && task?.recurrence_pattern) {
      await createRecurringTask(task);
    }
  };

  const handleClearCompletedTasks = async () => {
    const completedTasks = tasks.filter(task => task.status === 'completed');
    for (const task of completedTasks) {
      await deleteTask(task.id);
    }
  };

  const createRecurringTask = async (completedTask: any) => {
    if (!completedTask.recurrence_pattern) return;
    
    const now = new Date();
    let nextDueDate = new Date(completedTask.due_date || now);
    
    switch (completedTask.recurrence_pattern) {
      case 'daily':
        nextDueDate.setDate(nextDueDate.getDate() + 1);
        break;
      case 'weekly':
        nextDueDate.setDate(nextDueDate.getDate() + 7);
        break;
      case 'monthly':
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        break;
    }
    
    const endDate = completedTask.recurrence_end_date ? new Date(completedTask.recurrence_end_date) : null;
    if (endDate && nextDueDate > endDate) {
      return;
    }
    
    await createTask({
      title: completedTask.title,
      description: completedTask.description,
      priority: completedTask.priority,
      due_date: nextDueDate.toISOString(),
      recurrence_pattern: completedTask.recurrence_pattern,
      recurrence_end_date: completedTask.recurrence_end_date,
      tags: completedTask.tags || [],
      complexity: completedTask.complexity || 3,
    });
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    if (!draggedTask || draggedTask === targetTaskId) return;
    
    const targetTask = getTaskById(targetTaskId);
    if (targetTask) {
      reorderTask(draggedTask, (targetTask.task_order || 0) + 1);
    }
    setDraggedTask(null);
  };

  const getStatusButton = (task: any) => {
    switch (task.status) {
      case 'completed':
        return (
          <button
            onClick={() => handleUpdateTaskStatus(task.id, 'pending')}
            className="p-1 text-green-600 hover:bg-green-50 rounded"
            aria-label={`Mark task "${task.title}" as pending`}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        );
      case 'in_progress':
        return (
          <button
            onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            aria-label={`Mark task "${task.title}" as completed`}
          >
            <CheckCircle className="h-4 w-4" />
          </button>
        );
      default:
        return (
          <button
            onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
            className="p-1 text-gray-600 hover:bg-gray-50 rounded"
            aria-label={`Start working on task "${task.title}"`}
          >
            <Play className="h-4 w-4" />
          </button>
        );
    }
  };

  const addTag = () => {
    if (newTag.trim() && !newTask.tags.includes(newTag.trim())) {
      setNewTask(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewTask(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addEditTag = () => {
    if (newTag.trim() && !editFormData.tags.includes(newTag.trim())) {
      setEditFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeEditTag = (tagToRemove: string) => {
    setEditFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getComplexityStars = (complexity: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < complexity ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const renderEditForm = (task: any) => (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={editFormData.title}
            onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={editFormData.description}
            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={editFormData.priority}
              onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Complexity</label>
            <select
              value={editFormData.complexity}
              onChange={(e) => setEditFormData({ ...editFormData, complexity: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {[1, 2, 3, 4, 5].map(level => (
                <option key={level} value={level}>{level} Star{level !== 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="datetime-local"
              value={editFormData.due_date}
              onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEditTag())}
              placeholder="Add a tag..."
              className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={addEditTag}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Add
            </button>
          </div>
          {editFormData.tags && editFormData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {editFormData.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="flex items-center space-x-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeEditTag(tag)}
                    className="text-indigo-600 hover:text-indigo-800"
                    aria-label={`Remove tag: ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleSaveEdit}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Save</span>
          </button>
          <button
            onClick={handleCancelEdit}
            className="flex items-center space-x-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderTaskMenu = (task: any) => (
    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
      <div className="py-1">
        <button
          onClick={() => handleEditTask(task)}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
        >
          <Edit3 className="h-4 w-4" />
          <span>Edit Task</span>
        </button>
        <button
          onClick={() => handleUpdateTaskStatus(task.id, task.status === 'in_progress' ? 'pending' : 'in_progress')}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
        >
          <Clock className="h-4 w-4" />
          <span>{task.status === 'in_progress' ? 'Mark as Pending' : 'Start Working'}</span>
        </button>
        <button
          onClick={() => handleDeleteTask(task.id)}
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete Task</span>
        </button>
      </div>
    </div>
  );

  // Sort tasks: completed tasks go to bottom
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    return (a.task_order || 0) - (b.task_order || 0);
  });

  const renderTask = (task: any, level: number = 0) => (
    <div key={task.id} className={`${level > 0 ? 'ml-8' : ''}`}>
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, task.id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, task.id)}
        className={`bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ${
          draggedTask === task.id ? 'opacity-50' : ''
        } ${task.status === 'completed' ? 'opacity-75' : ''}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-grow">
            <GripVertical className="h-4 w-4 text-gray-400 mt-1 cursor-move" />
            
            {getStatusButton(task)}
            
            <div className="flex-grow">
              <div className="flex items-center space-x-2 mb-2">
                {task.subtasks && task.subtasks.length > 0 && (
                  <button
                    onClick={() => toggleTaskExpansion(task.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                    aria-label={`${task.isExpanded ? 'Collapse' : 'Expand'} subtasks for ${task.title}`}
                  >
                    {task.isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                )}
                
                <h4 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                  {task.title}
                </h4>
                
                {task.recurrence_pattern && (
                  <Repeat className="h-4 w-4 text-blue-600" title={`Repeats ${task.recurrence_pattern}`} />
                )}
              </div>
              
              {task.description && (
                <p className="text-gray-600 text-sm mb-2">{task.description}</p>
              )}
              
              <div className="flex items-center flex-wrap gap-2 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
                
                {task.complexity && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-full">
                    <Gauge className="h-3 w-3 text-yellow-600" />
                    <div className="flex space-x-0.5">
                      {getComplexityStars(task.complexity)}
                    </div>
                  </div>
                )}
                
                {task.estimated_time && (
                  <span className="flex items-center space-x-1 text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
                    <Clock className="h-3 w-3" />
                    <span>{task.estimated_time}</span>
                  </span>
                )}
                
                {task.due_date && (
                  <span className="flex items-center space-x-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                  </span>
                )}
                
                {task.tags && task.tags.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Tag className="h-3 w-3 text-gray-400" />
                    {task.tags.map((tag: string) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <span className="text-xs text-gray-500">
                  Created: {new Date(task.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTaskMenu(showTaskMenu === task.id ? null : task.id);
              }}
              className="p-1 text-gray-600 hover:bg-gray-50 rounded"
              aria-label={`More options for task: ${task.title}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            
            {showTaskMenu === task.id && renderTaskMenu(task)}
          </div>
        </div>

        {editingTask === task.id && renderEditForm(task)}
      </div>
      
      {task.isExpanded && task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-2 space-y-2">
          {task.subtasks.map((subtask: any) => renderTask(subtask, level + 1))}
        </div>
      )}
    </div>
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showTaskMenu) {
        setShowTaskMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showTaskMenu]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const completedTasksCount = tasks.filter(task => task.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">Your Tasks</h3>
        <div className="flex space-x-3">
          {completedTasksCount > 0 && (
            <button
              onClick={handleClearCompletedTasks}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              aria-label={`Clear ${completedTasksCount} completed tasks`}
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear Completed ({completedTasksCount})</span>
            </button>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* AI Workload Breakdown Section */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-100">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="h-6 w-6 text-purple-600" />
          <h4 className="text-lg font-semibold text-purple-900">AI Workload Breakdown</h4>
        </div>
        <p className="text-purple-700 mb-4 text-sm">
          Describe your workload and AI will break it down into manageable tasks with complexity ratings.
        </p>
        <div className="space-y-3">
          <textarea
            value={workloadInput}
            onChange={(e) => setWorkloadInput(e.target.value)}
            placeholder="Example: 'I need to plan my wedding in 6 months with a $15k budget...'"
            rows={4}
            className="w-full px-4 py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
          <div className="flex justify-end">
            <button
              onClick={handleWorkloadBreakdown}
              disabled={aiLoading || !workloadInput.trim()}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {aiLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4" />
                  <span>Break Down</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* AI Response */}
      {aiResponse && (
        <AICoachResponse 
          response={aiResponse} 
          onSubtaskAdd={(subtask) => handleSubtaskAdd(subtask)}
          onTaskAdd={handleTaskAdd}
          onAddAllTasks={handleAddAllTasks}
          onRejectSuggestions={handleRejectSuggestions}
        />
      )}

      {/* Add Task Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title
              </label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="What do you need to do?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Add more details..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complexity (1-5 stars)
                </label>
                <select
                  value={newTask.complexity}
                  onChange={(e) => setNewTask({ ...newTask, complexity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5].map(level => (
                    <option key={level} value={level}>{level} Star{level !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Time
                </label>
                <input
                  type="text"
                  value={newTask.estimated_time}
                  onChange={(e) => setNewTask({ ...newTask, estimated_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., 2 hours, 30 min"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date (optional)
              </label>
              <input
                type="datetime-local"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Task (optional)
                </label>
                <select
                  value={newTask.parent_task_id}
                  onChange={(e) => setNewTask({ ...newTask, parent_task_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">None (Top-level task)</option>
                  {tasks.map(task => (
                    <option key={task.id} value={task.id}>{task.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recurrence (optional)
                </label>
                <select
                  value={newTask.recurrence_pattern}
                  onChange={(e) => setNewTask({ ...newTask, recurrence_pattern: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">No recurrence</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            {newTask.recurrence_pattern && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recurrence End Date (optional)
                </label>
                <input
                  type="date"
                  value={newTask.recurrence_end_date}
                  onChange={(e) => setNewTask({ ...newTask, recurrence_end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add a tag..."
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Add
                </button>
              </div>
              {newTask.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newTask.tags.map(tag => (
                    <span
                      key={tag}
                      className="flex items-center space-x-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-indigo-600 hover:text-indigo-800"
                        aria-label={`Remove tag: ${tag}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={aiLoading}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {aiLoading ? 'Getting AI Help...' : 'Create Task'}
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

      {/* Tasks List */}
      <div className="space-y-3">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h4>
            <p className="text-gray-600">Create your first task or try the workload breakdown feature!</p>
          </div>
        ) : (
          sortedTasks.map(task => renderTask(task))
        )}
      </div>
    </div>
  );
};