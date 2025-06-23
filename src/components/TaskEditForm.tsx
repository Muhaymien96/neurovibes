import React, { useState } from 'react';
import { Save, X } from 'lucide-react';

interface TaskSuggestion {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimated_time: string;
  subtasks?: string[];
  tags?: string[];
}

interface TaskEditFormProps {
  task: TaskSuggestion;
  index: number;
  onSave: (index: number) => void;
  onCancel: (index: number) => void;
  onUpdateTask: (index: number, field: keyof TaskSuggestion, value: any) => void;
  onAddSubtask: (taskIndex: number, subtask: string) => void;
  onRemoveSubtask: (taskIndex: number, subtaskIndex: number) => void;
  onAddTag: (taskIndex: number, tag: string) => void;
  onRemoveTag: (taskIndex: number, tagIndex: number) => void;
}

export const TaskEditForm: React.FC<TaskEditFormProps> = ({
  task,
  index,
  onSave,
  onCancel,
  onUpdateTask,
  onAddSubtask,
  onRemoveSubtask,
  onAddTag,
  onRemoveTag
}) => {
  const [newSubtask, setNewSubtask] = useState('');
  const [newTag, setNewTag] = useState('');

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      onAddSubtask(index, newSubtask);
      setNewSubtask('');
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      onAddTag(index, newTag);
      setNewTag('');
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border mt-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={task.title}
          onChange={(e) => onUpdateTask(index, 'title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={task.description}
          onChange={(e) => onUpdateTask(index, 'description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            value={task.priority}
            onChange={(e) => onUpdateTask(index, 'priority', e.target.value as TaskSuggestion['priority'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time</label>
          <input
            type="text"
            value={task.estimated_time}
            onChange={(e) => onUpdateTask(index, 'estimated_time', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g., 2 hours, 30 minutes"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Subtasks</label>
        <div className="space-y-2">
          {task.subtasks?.map((subtask, subtaskIndex) => (
            <div key={subtaskIndex} className="flex items-center space-x-2">
              <span className="flex-grow text-sm bg-white px-3 py-2 border border-gray-300 rounded-lg">
                {subtask}
              </span>
              <button
                type="button"
                onClick={() => onRemoveSubtask(index, subtaskIndex)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="flex space-x-2">
            <input
              type="text"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
              placeholder="Add a subtask..."
              className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleAddSubtask}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
        <div className="space-y-2">
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {task.tags.map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  className="flex items-center space-x-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveTag(index, tagIndex)}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex space-x-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Add a tag..."
              className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={() => onSave(index)}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>Save</span>
        </button>
        <button
          type="button"
          onClick={() => onCancel(index)}
          className="flex items-center space-x-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
        >
          <X className="h-4 w-4" />
          <span>Cancel</span>
        </button>
      </div>
    </div>
  );
};