import { create } from 'zustand';
import { MoodEntry, createMoodEntry, getMoodEntries, updateMoodEntry } from '../lib/supabase';

interface MoodState {
  entries: MoodEntry[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadEntries: (limit?: number) => Promise<void>;
  createEntry: (entry: Omit<MoodEntry, 'id' | 'user_id' | 'created_at'>) => Promise<MoodEntry | null>;
  updateEntry: (id: string, updates: Partial<MoodEntry>) => Promise<void>;
  setEntries: (entries: MoodEntry[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed
  getAverages: (days: number) => { mood: number; energy: number; focus: number; count: number } | null;
  getRecentTrend: () => 'improving' | 'declining' | 'stable';
  getMoodByTimeOfDay: () => { [hour: number]: number };
}

export const useMoodStore = create<MoodState>((set, get) => ({
  entries: [],
  loading: false,
  error: null,

  loadEntries: async (limit = 30) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await getMoodEntries(limit);
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      
      set({ entries: data || [], loading: false });
    } catch (error) {
      console.error('Load mood entries error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load mood entries',
        loading: false 
      });
    }
  },

  createEntry: async (entryData) => {
    try {
      set({ error: null });
      const { data, error } = await createMoodEntry(entryData);
      
      if (error) {
        set({ error: error.message });
        return null;
      }
      
      if (data) {
        // Add to beginning of entries array
        set({ entries: [data, ...get().entries] });
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Create mood entry error:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create mood entry' });
      return null;
    }
  },

  updateEntry: async (id: string, updates: Partial<MoodEntry>) => {
    try {
      set({ error: null });
      const { data, error } = await updateMoodEntry(id, updates);
      
      if (error) {
        set({ error: error.message });
        return;
      }
      
      if (data) {
        // Update entry in array
        set({
          entries: get().entries.map(entry => 
            entry.id === id ? data : entry
          )
        });
      }
    } catch (error) {
      console.error('Update mood entry error:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update mood entry' });
    }
  },

  setEntries: (entries: MoodEntry[]) => {
    set({ entries });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  // Computed getters
  getAverages: (days: number) => {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentEntries = get().entries.filter(entry => 
      new Date(entry.created_at) >= cutoffDate
    );
    
    if (recentEntries.length === 0) return null;
    
    const totals = recentEntries.reduce(
      (acc, entry) => ({
        mood: acc.mood + entry.mood_score,
        energy: acc.energy + entry.energy_level,
        focus: acc.focus + entry.focus_level,
      }),
      { mood: 0, energy: 0, focus: 0 }
    );
    
    return {
      mood: totals.mood / recentEntries.length,
      energy: totals.energy / recentEntries.length,
      focus: totals.focus / recentEntries.length,
      count: recentEntries.length,
    };
  },

  getRecentTrend: () => {
    const entries = get().entries;
    if (entries.length < 3) return 'stable';
    
    const recent = entries.slice(0, 3);
    const older = entries.slice(3, 6);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, entry) => sum + entry.mood_score, 0) / recent.length;
    const olderAvg = older.reduce((sum, entry) => sum + entry.mood_score, 0) / older.length;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > 0.5) return 'improving';
    if (difference < -0.5) return 'declining';
    return 'stable';
  },

  getMoodByTimeOfDay: () => {
    const entries = get().entries;
    const moodByHour: { [hour: number]: number[] } = {};
    
    entries.forEach(entry => {
      const hour = new Date(entry.created_at).getHours();
      if (!moodByHour[hour]) moodByHour[hour] = [];
      moodByHour[hour].push(entry.mood_score);
    });
    
    const averageByHour: { [hour: number]: number } = {};
    Object.entries(moodByHour).forEach(([hour, scores]) => {
      averageByHour[parseInt(hour)] = scores.reduce((a, b) => a + b, 0) / scores.length;
    });
    
    return averageByHour;
  },
}));