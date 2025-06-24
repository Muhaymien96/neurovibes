import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationSettings {
  smart_reminders: boolean;
  task_deadlines: boolean;
  mood_check_ins: boolean;
}

interface PrivacySettings {
  analytics: boolean;
  personalization: boolean;
}

interface AppearanceSettings {
  high_contrast_mode: boolean;
  colorblind_mode: boolean;
  reduced_motion: boolean;
  minimalist_mode: boolean;
  mood_responsive_colors: boolean;
  text_size: 'small' | 'medium' | 'large' | 'xlarge';
  line_spacing: 'normal' | 'wide';
  font_preference: 'default' | 'dyslexia_friendly';
  visual_stimulation_level: 'low' | 'medium' | 'high';
  sound_effects_volume: number;
  haptic_feedback_enabled: boolean;
  animation_speed: 'slow' | 'normal' | 'fast';
  background_color_for_reading: string;
}

interface SettingsState {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  appearance: AppearanceSettings;
  
  // Actions
  updateNotifications: (settings: Partial<NotificationSettings>) => void;
  updatePrivacy: (settings: Partial<PrivacySettings>) => void;
  updateAppearance: (settings: Partial<AppearanceSettings>) => void;
  resetToDefaults: () => void;
}

const defaultSettings = {
  notifications: {
    smart_reminders: true,
    task_deadlines: true,
    mood_check_ins: false,
  },
  privacy: {
    analytics: true,
    personalization: true,
  },
  appearance: {
    high_contrast_mode: false,
    colorblind_mode: false,
    reduced_motion: false,
    minimalist_mode: false,
    mood_responsive_colors: true,
    text_size: 'medium' as const,
    line_spacing: 'normal' as const,
    font_preference: 'default' as const,
    visual_stimulation_level: 'medium' as const,
    sound_effects_volume: 0.5,
    haptic_feedback_enabled: true,
    animation_speed: 'normal' as const,
    background_color_for_reading: '#ffffff',
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,

      updateNotifications: (settings: Partial<NotificationSettings>) => {
        set({
          notifications: { ...get().notifications, ...settings }
        });
      },

      updatePrivacy: (settings: Partial<PrivacySettings>) => {
        set({
          privacy: { ...get().privacy, ...settings }
        });
      },

      updateAppearance: (settings: Partial<AppearanceSettings>) => {
        set({
          appearance: { ...get().appearance, ...settings }
        });
      },

      resetToDefaults: () => {
        set(defaultSettings);
      },
    }),
    {
      name: 'mindmesh-settings',
      partialize: (state) => ({
        notifications: state.notifications,
        privacy: state.privacy,
        appearance: state.appearance,
      }),
    }
  )
);