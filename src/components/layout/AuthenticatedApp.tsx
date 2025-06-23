import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';
import { MainContent } from './MainContent';
import { AuthModal } from '../AuthModal';
import { ReminderNotification } from '../ReminderNotification';
import { useRemindersStore } from '../../store';

type ActiveTab = 'focus' | 'tasks' | 'mood' | 'reminders' | 'integrations' | 'braindump' | 'profile';

interface AuthenticatedAppProps {
  user: User | null;
}

export const AuthenticatedApp: React.FC<AuthenticatedAppProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('focus');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  const { 
    reminders, 
    fetchReminders, 
    dismissReminder, 
    snoozeReminder,
    getHighPriorityReminders 
  } = useRemindersStore();
  
  // Fetch reminders when user is available
  useEffect(() => {
    if (user?.id) {
      fetchReminders(user.id);
      
      // Set up periodic refresh
      const interval = setInterval(() => {
        fetchReminders(user.id);
      }, 30 * 60 * 1000); // 30 minutes

      return () => clearInterval(interval);
    }
  }, [user?.id, fetchReminders]);
  
  // Show notification for high priority reminders
  const highPriorityReminders = getHighPriorityReminders();
  const activeNotification = highPriorityReminders[0];

  const handleNotificationDismiss = () => {
    if (activeNotification) {
      dismissReminder(activeNotification.id);
    }
  };

  const handleNotificationSnooze = () => {
    if (activeNotification) {
      snoozeReminder(activeNotification.id, 30);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
      <AppHeader 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        reminders={reminders}
        user={user}
        isAuthenticated={true}
      />
      
      <MainContent 
        activeTab={activeTab}
        user={user}
      />
      
      <AppFooter />

      {/* Reminder Notification */}
      {activeNotification && (
        <ReminderNotification
          reminder={activeNotification}
          onDismiss={handleNotificationDismiss}
          onSnooze={handleNotificationSnooze}
          autoPlayVoice={true}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
};