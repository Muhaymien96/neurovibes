import { create } from 'zustand';
import { Task, createTask, getTasks, updateTask, deleteTask } from '../lib/supabase';

interface ExtendedTask extends Task {
  subtasks?: ExtendedTask[];
  isExpanded?: boolean;
}

interface TasksState {
  tasks: ExtendedTask[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadTasks: (status?: Task['status']) => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  reorderTask: (taskId: string, newOrder: number) => Promise<void>;
  toggleTaskExpansion: (taskId: string) => void;
  setTasks: (tasks: ExtendedTask[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed
  getTaskById: (id: string) => ExtendedTask | null;
  getTasksByStatus: (status: Task['status']) => ExtendedTask[];
  getTasksByPriority: (priority: Task['priority']) => ExtendedTask[];
}

const organizeTasksHierarchy = (tasks: Task[]): ExtendedTask[] => {
  const taskMap = new Map<string, ExtendedTask>();
  const rootTasks: ExtendedTask[] = [];
  
  // Create task map
  tasks.forEach(task => {
    taskMap.set(task.id, { ...task, subtasks: [], isExpanded: false });
  });
  
  // Organize hierarchy
  taskMap.forEach(task => {
    if (task.parent_task_id && taskMap.has(task.parent_task_id)) {
      const parent = taskMap.get(task.parent_task_id)!;
      parent.subtasks!.push(task);
    } else {
      rootTasks.push(task);
    }
  });
  
  // Sort by task_order
  const sortTasks = (tasks: ExtendedTask[]) => {
    tasks.sort((a, b) => (a.task_order || 0) - (b.task_order || 0));
    tasks.forEach(task => {
      if (task.subtasks) {
        sortTasks(task.subtasks);
      }
    });
  };
  
  sortTasks(rootTasks);
  return rootTasks;
};

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  loadTasks: async (status?: Task['status']) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await getTasks(status);
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      
      const organizedTasks = organizeTasksHierarchy(data || []);
      set({ tasks: organizedTasks, loading: false });
    } catch (error) {
      console.error('Load tasks error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load tasks',
        loading: false 
      });
    }
  },

  createTask: async (taskData) => {
    try {
      set({ error: null });
      const { data, error } = await createTask(taskData);
      
      if (error) {
        set({ error: error.message });
        return null;
      }
      
      if (data) {
        // Reload tasks to get proper hierarchy
        await get().loadTasks();
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Create task error:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create task' });
      return null;
    }
  },

  updateTask: async (id: string, updates: Partial<Task>) => {
    try {
      set({ error: null });
      const { data, error } = await updateTask(id, updates);
      
      if (error) {
        set({ error: error.message });
        return;
      }
      
      if (data) {
        // Reload tasks to maintain hierarchy
        await get().loadTasks();
      }
    } catch (error) {
      console.error('Update task error:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update task' });
    }
  },

  deleteTask: async (id: string) => {
    try {
      set({ error: null });
      const { error } = await deleteTask(id);
      
      if (error) {
        set({ error: error.message });
        return;
      }
      
      // Reload tasks
      await get().loadTasks();
    } catch (error) {
      console.error('Delete task error:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete task' });
    }
  },

  reorderTask: async (taskId: string, newOrder: number) => {
    try {
      await get().updateTask(taskId, { task_order: newOrder });
    } catch (error) {
      console.error('Reorder task error:', error);
    }
  },

  toggleTaskExpansion: (taskId: string) => {
    const toggleInTasks = (tasks: ExtendedTask[]): ExtendedTask[] => {
      return tasks.map(task => {
        if (task.id === taskId) {
          return { ...task, isExpanded: !task.isExpanded };
        }
        if (task.subtasks) {
          return { ...task, subtasks: toggleInTasks(task.subtasks) };
        }
        return task;
      });
    };
    
    set({ tasks: toggleInTasks(get().tasks) });
  },

  setTasks: (tasks: ExtendedTask[]) => {
    set({ tasks });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  // Computed getters
  getTaskById: (id: string) => {
    const findTask = (tasks: ExtendedTask[]): ExtendedTask | null => {
      for (const task of tasks) {
        if (task.id === id) return task;
        if (task.subtasks) {
          const found = findTask(task.subtasks);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findTask(get().tasks);
  },

  getTasksByStatus: (status: Task['status']) => {
    const filterTasks = (tasks: ExtendedTask[]): ExtendedTask[] => {
      return tasks.filter(task => task.status === status);
    };
    
    return filterTasks(get().tasks);
  },

  getTasksByPriority: (priority: Task['priority']) => {
    const filterTasks = (tasks: ExtendedTask[]): ExtendedTask[] => {
      return tasks.filter(task => task.priority === priority);
    };
    
    return filterTasks(get().tasks);
  },
}));