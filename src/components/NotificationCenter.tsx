import React, { useState, useEffect } from 'react';
import { Bell, X, Clock, SunSnow as Snooze } from 'lucide-react';
import { useRemindersStore, useSettingsStore } from '../store';

export const NotificationCenter: React.FC = () => {
  const { 
    reminders, 
    loadReminders, 
    dismissReminder, 
    snoozeReminder, 
    getActiveReminders 
  } = useRemindersStore();
  
  const { notifications } = useSettingsStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeReminders, setActiveReminders] = useState<any[]>([]);

  useEffect(() => {
    if (notifications.smart_reminders) {
      loadReminders();
    }
  }, [notifications.smart_reminders, loadReminders]);

  useEffect(() => {
    const active = getActiveReminders();
    setActiveReminders(active);
    
    // Auto-show notifications if there are active reminders
    if (active.length > 0 && notifications.smart_reminders) {
      setShowNotifications(true);
    }
  }, [reminders, getActiveReminders, notifications.smart_reminders]);

  const handleSnooze = async (reminderId: string, minutes: number) => {
    await snoozeReminder(reminderId, minutes);
  };

  const handleDismiss = async (reminderId: string) => {
    await dismissReminder(reminderId);
  };

  if (!notifications.smart_reminders || activeReminders.length === 0) {
    return null;
  }

  return (
    <>
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="fixed top-4 right-4 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors z-50"
        aria-label={`${activeReminders.length} active reminder${activeReminders.length !== 1 ? 's' : ''} - click to view`}
      >
        <Bell className="h-5 w-5" />
        {activeReminders.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {activeReminders.length}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showNotifications && (
        <div className="fixed top-16 right-4 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Reminders</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="Close notifications panel"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {activeReminders.map((reminder) => (
              <div key={reminder.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-grow">
                    <h4 className="font-medium text-gray-900">{reminder.title}</h4>
                    {reminder.description && (
                      <p className="text-sm text-gray-600 mt-1">{reminder.description}</p>
                    )}
                    <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(reminder.remind_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mt-3">
                  <button
                    onClick={() => handleDismiss(reminder.id)}
                    className="flex-1 bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-300 transition-colors"
                    aria-label={`Dismiss reminder: ${reminder.title}`}
                  >
                    Dismiss
                  </button>
                  
                  <div className="flex space-x-1">
                    {[5, 15, 30, 60].map((minutes) => (
                      <button
                        key={minutes}
                        onClick={() => handleSnooze(reminder.id, minutes)}
                        className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs hover:bg-indigo-200 transition-colors"
                        aria-label={`Snooze reminder for ${minutes} minutes`}
                      >
                        {minutes}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};