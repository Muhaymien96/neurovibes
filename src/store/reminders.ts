import { create } from 'zustand';

interface SmartReminder {
  id: string;
  type: 'deadline_warning' | 'mood_based' | 'transition_nudge' | 'encouragement';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  suggested_action?: string;
  timing: 'immediate' | 'in_30_min' | 'in_1_hour' | 'tomorrow';
  voice_message: string;
  context: {
    related_task_id?: string;
    mood_trend?: string;
    energy_recommendation?: string;
  };
}

interface UserPattern {
  productive_hours: number[];
  average_mood_by_hour: { [hour: number]: number };
  task_completion_rate: number;
  procrastination_triggers: string[];
  preferred_break_duration: number;
}

interface RemindersState {
  reminders: SmartReminder[];
  userPatterns: UserPattern | null;
  loading: boolean;
  error: string | null;
  lastAnalysis: string | null;
  
  // Actions
  fetchReminders: (userId: string) => Promise<void>;
  dismissReminder: (reminderId: string) => void;
  snoozeReminder: (reminderId: string, minutes?: number) => void;
  setReminders: (reminders: SmartReminder[]) => void;
  setUserPatterns: (patterns: UserPattern | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed
  getHighPriorityReminders: () => SmartReminder[];
  getRemindersByType: (type: SmartReminder['type']) => SmartReminder[];
}

export const useRemindersStore = create<RemindersState>((set, get) => ({
  reminders: [],
  userPatterns: null,
  loading: false,
  error: null,
  lastAnalysis: null,

  fetchReminders: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smart-reminders`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            analysis_type: 'all'
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch smart reminders');
      }

      const data = await response.json();
      set({
        reminders: data.reminders || [],
        userPatterns: data.user_patterns || null,
        lastAnalysis: data.analysis_timestamp || null,
        loading: false,
      });
    } catch (error) {
      console.error('Fetch reminders error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch reminders',
        loading: false 
      });
    }
  },

  dismissReminder: (reminderId: string) => {
    set({
      reminders: get().reminders.filter(r => r.id !== reminderId)
    });
  },

  snoozeReminder: (reminderId: string, minutes = 30) => {
    // Remove reminder temporarily
    const reminder = get().reminders.find(r => r.id === reminderId);
    set({
      reminders: get().reminders.filter(r => r.id !== reminderId)
    });
    
    // Re-add after specified time (in a real app, this would be handled by the backend)
    if (reminder) {
      setTimeout(() => {
        set({
          reminders: [...get().reminders, reminder]
        });
      }, minutes * 60 * 1000);
    }
  },

  setReminders: (reminders: SmartReminder[]) => {
    set({ reminders });
  },

  setUserPatterns: (patterns: UserPattern | null) => {
    set({ userPatterns: patterns });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  // Computed getters
  getHighPriorityReminders: () => {
    return get().reminders.filter(r => r.priority === 'high');
  },

  getRemindersByType: (type: SmartReminder['type']) => {
    return get().reminders.filter(r => r.type === type);
  },
}));