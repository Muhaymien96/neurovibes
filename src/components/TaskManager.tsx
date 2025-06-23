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
  MoreHorizontal
} from 'lucide-react';
import { Task, createTask, getTasks, updateTask, deleteTask } from '../lib/supabase';
import { useAICoach } from '../hooks/useAICoach';
import { useAuth } from '../hooks/useAuth';
import { AICoachResponse } from './AICoachResponse';

interface ExtendedTask extends Task {
  subtasks?: ExtendedTask[];
  isExpanded?: boolean;
}

export const TaskManager: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ExtendedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    due_date: '',
    parent_task_id: '',
    recurrence_pattern: '',
    recurrence_end_date: '',
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState('');

  const { getCoachingResponse, loading: aiLoading } = useAICoach();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const { data, error } = await getTasks();
      if (error) throw error;
      
      // Organize tasks into hierarchy
      const taskMap = new Map<string, ExtendedTask>();
      const rootTasks: ExtendedTask[] = [];
      
      (data || []).forEach(task => {
        taskMap.set(task.id, { ...task, subtasks: [], isExpanded: false });
      });
      
      taskMap.forEach(task => {
        if (task.parent_task_id && taskMap.has(task.parent_task_id)) {
          const parent = taskMap.get(task.parent_task_id)!;
          parent.subtasks!.push(task);
        } else {
          rootTasks.push(task);
        }
      });
      
      // Sort by task_order
      rootTasks.sort((a, b) => (a.task_order || 0) - (b.task_order || 0));
      rootTasks.forEach(task => {
        if (task.subtasks) {
          task.subtasks.sort((a, b) => (a.task_order || 0) - (b.task_order || 0));
        }
      });
      
      setTasks(rootTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get AI coaching response first
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

    try {
      const taskData = {
        ...newTask,
        priority: coachingResponse?.priority_suggestion || newTask.priority,
        parent_task_id: newTask.parent_task_id || undefined,
        recurrence_pattern: newTask.recurrence_pattern || undefined,
        recurrence_end_date: newTask.recurrence_end_date || undefined,
        tags: newTask.tags,
      };

      const { data, error } = await createTask(taskData);
      if (error) throw error;
      if (data) {
        await loadTasks(); // Reload to get proper hierarchy
        setNewTask({ 
          title: '', 
          description: '', 
          priority: 'medium', 
          due_date: '', 
          parent_task_id: '',
          recurrence_pattern: '',
          recurrence_end_date: '',
          tags: [],
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleSubtaskAdd = async (subtaskTitle: string, parentId?: string) => {
    try {
      const { data, error } = await createTask({
        title: subtaskTitle,
        description: 'Generated from AI coaching',
        priority: 'medium',
        due_date: '',
        parent_task_id: parentId,
      });
      if (error) throw error;
      if (data) {
        await loadTasks();
      }
    } catch (error) {
      console.error('Error creating subtask:', error);
    }
  };

  const handleUpdateTaskStatus = async (id: string, status: Task['status']) => {
    try {
      const updates: Partial<Task> = { status };
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
      
      const { data, error } = await updateTask(id, updates);
      if (error) throw error;
      if (data) {
        await loadTasks();
        
        // Handle recurring tasks
        if (status === 'completed' && data.recurrence_pattern) {
          await createRecurringTask(data);
        }
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const createRecurringTask = async (completedTask: Task) => {
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
    
    // Check if we should create the next instance
    const endDate = completedTask.recurrence_end_date ? new Date(completedTask.recurrence_end_date) : null;
    if (endDate && nextDueDate > endDate) {
      return; // Don't create if past end date
    }
    
    try {
      await createTask({
        title: completedTask.title,
        description: completedTask.description,
        priority: completedTask.priority,
        due_date: nextDueDate.toISOString(),
        recurrence_pattern: completedTask.recurrence_pattern,
        recurrence_end_date: completedTask.recurrence_end_date,
        tags: completedTask.tags || [],
      });
      await loadTasks();
    } catch (error) {
      console.error('Error creating recurring task:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const { error } = await deleteTask(id);
      if (error) throw error;
      await loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleTaskReorder = async (taskId: string, newOrder: number) => {
    try {
      const { error } = await updateTask(taskId, { task_order: newOrder });
      if (error) throw error;
      await loadTasks();
    } catch (error) {
      console.error('Error reordering task:', error);
    }
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
    
    const targetTask = findTaskById(targetTaskId);
    if (targetTask) {
      handleTaskReorder(draggedTask, (targetTask.task_order || 0) + 1);
    }
    setDraggedTask(null);
  };

  const findTaskById = (id: string): ExtendedTask | null => {
    for (const task of tasks) {
      if (task.id === id) return task;
      if (task.subtasks) {
        for (const subtask of task.subtasks) {
          if (subtask.id === id) return subtask;
        }
      }
    }
    return null;
  };

  const toggleTaskExpansion = (taskId: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, isExpanded: !task.isExpanded }
          : task
      )
    );
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

  const handleBrainDump = async (input: string) => {
    const coachingResponse = await getCoachingResponse({
      input,
      type: 'brain_dump',
      context: {
        existing_tasks: tasks.map(t => t.title),
        user_id: user?.id,
        include_historical_data: true,
      }
    });

    if (coachingResponse) {
      setAiResponse(coachingResponse);
    }
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

  const renderTask = (task: ExtendedTask, level: number = 0) => (
    <div key={task.id} className={`${level > 0 ? 'ml-8' : ''}`}>
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, task.id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, task.id)}
        className={`bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ${
          draggedTask === task.id ? 'opacity-50' : ''
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-grow">
            <GripVertical className="h-4 w-4 text-gray-400 mt-1 cursor-move" />
            
            <button
              onClick={() => handleUpdateTaskStatus(
                task.id,
                task.status === 'completed' ? 'pending' : 'completed'
              )}
              className="mt-1"
            >
              {getStatusIcon(task.status)}
            </button>
            
            <div className="flex-grow">
              <div className="flex items-center space-x-2 mb-2">
                {task.subtasks && task.subtasks.length > 0 && (
                  <button
                    onClick={() => toggleTaskExpansion(task.id)}
                    className="p-1 hover:bg-gray-100 rounded"
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
                
                {task.due_date && (
                  <span className="flex items-center space-x-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                  </span>
                )}
                
                {task.tags && task.tags.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Tag className="h-3 w-3 text-gray-400" />
                    {task.tags.map(tag => (
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

          <div className="flex items-center space-x-2">
            {task.status !== 'completed' && (
              <button
                onClick={() => handleUpdateTaskStatus(
                  task.id,
                  task.status === 'in_progress' ? 'pending' : 'in_progress'
                )}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                title={task.status === 'in_progress' ? 'Mark as pending' : 'Start working'}
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}
            
            <button
              onClick={() => setEditingTask(task.id)}
              className="p-1 text-gray-600 hover:bg-gray-50 rounded"
              title="Edit task"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => handleDeleteTask(task.id)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Render subtasks */}
      {task.isExpanded && task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-2 space-y-2">
          {task.subtasks.map(subtask => renderTask(subtask, level + 1))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">Your Tasks</h3>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Brain Dump Section */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-100">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="h-6 w-6 text-purple-600" />
          <h4 className="text-lg font-semibold text-purple-900">Brain Dump</h4>
        </div>
        <p className="text-purple-700 mb-4 text-sm">
          Feeling overwhelmed? Just dump all your thoughts here and let AI help you organize them into manageable tasks.
        </p>
        <div className="flex space-x-3">
          <input
            type="text"
            placeholder="Tell me everything on your mind..."
            className="flex-grow px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                handleBrainDump(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.querySelector('input[placeholder*="Tell me everything"]') as HTMLInputElement;
              if (input?.value.trim()) {
                handleBrainDump(input.value);
                input.value = '';
              }
            }}
            disabled={aiLoading}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {aiLoading ? 'Processing...' : 'Get Help'}
          </button>
        </div>
      </div>

      {/* AI Response */}
      {aiResponse && (
        <AICoachResponse 
          response={aiResponse} 
          onSubtaskAdd={(subtask) => handleSubtaskAdd(subtask)}
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

            <div className="grid grid-cols-2 gap-4">
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
                  Due Date (optional)
                </label>
                <input
                  type="datetime-local"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
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
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h4>
            <p className="text-gray-600">Create your first task or try the brain dump feature!</p>
          </div>
        ) : (
          tasks.map(task => renderTask(task))
        )}
      </div>
    </div>
  );
};