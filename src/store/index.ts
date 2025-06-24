// Export all stores from a central location
export { useAuthStore } from './auth';
export { useProfileStore } from './profile';
export { useTasksStore } from './tasks';
export { useMoodStore } from './mood';
export { useSettingsStore } from './settings';
export { useRemindersStore } from './reminders';

// Store initialization helper
export const initializeStores = async () => {
  const { useAuthStore } = await import('./auth');
  
  // Initialize auth store which will trigger other store initializations
  await useAuthStore.getState().initialize();
};