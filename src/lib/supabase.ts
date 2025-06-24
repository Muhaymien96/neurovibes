import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  parent_task_id?: string;
  recurrence_pattern?: string;
  recurrence_end_date?: string;
  task_order?: number;
  tags?: string[];
  complexity?: number;
}

export interface MoodEntry {
  id: string;
  user_id: string;
  mood_score: number;
  energy_level: number;
  focus_level: number;
  notes?: string;
  created_at: string;
}

// Auth helpers
export const signUp = async (email: string, password: string, fullName?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

// Task operations
export const createTask = async (task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  const { user, error: userError } = await getCurrentUser();
  
  if (userError || !user) {
    return { data: null, error: userError || new Error('User not authenticated') };
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert([{ ...task, user_id: user.id }])
    .select()
    .single();
  return { data, error };
};

export const getTasks = async (status?: Task['status']) => {
  let query = supabase
    .from('tasks')
    .select('*')
    .order('task_order', { ascending: true })
    .order('created_at', { ascending: false });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  return { data, error };
};

export const updateTask = async (id: string, updates: Partial<Task>) => {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
};

export const deleteTask = async (id: string) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);
  return { error };
};

// Mood entry operations
export const createMoodEntry = async (moodEntry: Omit<MoodEntry, 'id' | 'user_id' | 'created_at'>) => {
  const { user, error: userError } = await getCurrentUser();
  
  if (userError || !user) {
    return { data: null, error: userError || new Error('User not authenticated') };
  }

  const { data, error } = await supabase
    .from('mood_entries')
    .insert([{ ...moodEntry, user_id: user.id }])
    .select()
    .single();
  return { data, error };
};

export const getMoodEntries = async (limit = 30) => {
  const { data, error } = await supabase
    .from('mood_entries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data, error };
};

export const updateMoodEntry = async (id: string, updates: Partial<MoodEntry>) => {
  const { data, error } = await supabase
    .from('mood_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
};

// Profile operations
export const getProfile = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .single();
  return { data, error };
};

export const updateProfile = async (updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', (await getCurrentUser()).user?.id)
    .select()
    .single();
  return { data, error };
};