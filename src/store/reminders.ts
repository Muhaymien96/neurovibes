import { create } from 'zustand';
import { Reminder, createReminder, getReminders, updateReminder, deleteReminder } from '../lib/supabase';

interface RemindersState {
  reminders: Reminder[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadReminders: () => Promise<void>;
  addReminder: (reminder: Omit<Reminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Reminder | null>;
  dismissReminder: (id: string) => Promise<void>;
  snoozeReminder: (id: string, durationMinutes: number) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  setReminders: (reminders: Reminder[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed
  getActiveReminders: () => Reminder[];
  getOverdueReminders: () => Reminder[];
}

export const useRemindersStore = create<RemindersState>((set, get) => ({
  reminders: [],
  loading: false,
  error: null,

  loadReminders: async () => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await getReminders();
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      
      set({ reminders: data || [], loading: false });
    } catch (error) {
      console.error('Load reminders error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load reminders',
        loading: false 
      });
    }
  },

  addReminder: async (reminderData) => {
    try {
      set({ error: null });
      const { data, error } = await createReminder(reminderData);
      
      if (error) {
        set({ error: error.message });
        return null;
      }
      
      if (data) {
        set({ reminders: [...get().reminders, data] });
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Create reminder error:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create reminder' });
      return null;
    }
  },

  dismissReminder: async (id: string) => {
    try {
      set({ error: null });
      const { error } = await updateReminder(id, { is_dismissed: true });
      
      if (error) {
        set({ error: error.message });
        return;
      }
      
      // Remove from local state
      set({
        reminders: get().reminders.filter(reminder => reminder.id !== id)
      });
    } catch (error) {
      console.error('Dismiss reminder error:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to dismiss reminder' });
    }
  },

  snoozeReminder: async (id: string, durationMinutes: number) => {
    try {
      set({ error: null });
      const reminder = get().reminders.find(r => r.id === id);
      if (!reminder) return;

      const newRemindAt = new Date(Date.now() + durationMinutes * 60 * 1000);
      
      // Create a new snoozed reminder
      const snoozeData = {
        title: reminder.title,
        description: reminder.description || '',
        remind_at: newRemindAt.toISOString(),
        snooze_duration_minutes: durationMinutes,
        original_reminder_id: reminder.original_reminder_id || reminder.id,
        is_dismissed: false,
      };

      const { data, error } = await createReminder(snoozeData);
      
      if (error) {
        set({ error: error.message });
        return;
      }

      // Dismiss the original reminder
      await get().dismissReminder(id);
      
      if (data) {
        set({ reminders: [...get().reminders, data] });
      }
    } catch (error) {
      console.error('Snooze reminder error:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to snooze reminder' });
    }
  },

  deleteReminder: async (id: string) => {
    try {
      set({ error: null });
      const { error } = await deleteReminder(id);
      
      if (error) {
        set({ error: error.message });
        return;
      }
      
      set({
        reminders: get().reminders.filter(reminder => reminder.id !== id)
      });
    } catch (error) {
      console.error('Delete reminder error:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete reminder' });
    }
  },

  setReminders: (reminders: Reminder[]) => {
    set({ reminders });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  // Computed getters
  getActiveReminders: () => {
    const now = new Date();
    return get().reminders.filter(reminder => 
      !reminder.is_dismissed && new Date(reminder.remind_at) <= now
    );
  },

  getOverdueReminders: () => {
    const now = new Date();
    return get().reminders.filter(reminder => 
      !reminder.is_dismissed && new Date(reminder.remind_at) < now
    );
  },
}));