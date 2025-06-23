import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase, signIn, signUp, signOut } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      set({ loading: true });
      
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      set({ 
        user: session?.user ?? null, 
        isAuthenticated: !!session?.user,
        loading: false 
      });

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        set({ 
          user: session?.user ?? null,
          isAuthenticated: !!session?.user,
          loading: false 
        });
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ loading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const result = await signIn(email, password);
      if (!result.error) {
        set({ 
          user: result.data?.user ?? null,
          isAuthenticated: !!result.data?.user 
        });
      }
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  },

  signUp: async (email: string, password: string, fullName?: string) => {
    try {
      const result = await signUp(email, password, fullName);
      return result;
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    }
  },

  signOut: async () => {
    try {
      await signOut();
      set({ 
        user: null, 
        isAuthenticated: false 
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  },

  setUser: (user: User | null) => {
    set({ 
      user, 
      isAuthenticated: !!user 
    });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },
}));