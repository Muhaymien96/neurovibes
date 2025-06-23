import { create } from 'zustand';
import { Profile, getProfile, updateProfile } from '../lib/supabase';

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,

  loadProfile: async () => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await getProfile();
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      
      set({ profile: data, loading: false });
    } catch (error) {
      console.error('Load profile error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load profile',
        loading: false 
      });
    }
  },

  updateProfile: async (updates: Partial<Profile>) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await updateProfile(updates);
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      
      set({ profile: data, loading: false });
    } catch (error) {
      console.error('Update profile error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update profile',
        loading: false 
      });
    }
  },

  setProfile: (profile: Profile | null) => {
    set({ profile });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));