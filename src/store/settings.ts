import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationSettings {
  email_reminders: boolean;
  push_notifications: boolean;
  smart_reminders: boolean;
  task_deadlines: boolean;
  mood_check_ins: boolean;
}

interface PrivacySettings {
  data_sharing: boolean;
  analytics: boolean;
  personalization: boolean;
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto';
  color_scheme: 'indigo' | 'purple' | 'blue' | 'green';
  compact_mode: boolean;
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
    email_reminders: true,
    push_notifications: true,
    smart_reminders: true,
    task_deadlines: true,
    mood_check_ins: false,
  },
  privacy: {
    data_sharing: false,
    analytics: true,
    personalization: true,
  },
  appearance: {
    theme: 'light' as const,
    color_scheme: 'indigo' as const,
    compact_mode: false,
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