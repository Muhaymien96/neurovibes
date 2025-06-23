import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

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

interface SmartRemindersResponse {
  reminders: SmartReminder[];
  user_patterns: UserPattern;
  analysis_timestamp: string;
  total_reminders: number;
}

export const useSmartReminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<SmartReminder[]>([]);
  const [userPatterns, setUserPatterns] = useState<UserPattern | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<string | null>(null);

  const fetchSmartReminders = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smart-reminders`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            analysis_type: 'all'
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch smart reminders');
      }

      const data: SmartRemindersResponse = await response.json();
      setReminders(data.reminders);
      setUserPatterns(data.user_patterns);
      setLastAnalysis(data.analysis_timestamp);
    } catch (err) {
      console.error('Smart reminders error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const dismissReminder = (reminderId: string) => {
    setReminders(prev => prev.filter(r => r.id !== reminderId));
  };

  const snoozeReminder = (reminderId: string, minutes: number = 30) => {
    // In a real app, you'd store this in localStorage or backend
    setReminders(prev => prev.filter(r => r.id !== reminderId));
    
    // Re-add after specified time
    setTimeout(() => {
      fetchSmartReminders();
    }, minutes * 60 * 1000);
  };

  // Auto-refresh reminders every 30 minutes
  useEffect(() => {
    if (user) {
      fetchSmartReminders();
      
      const interval = setInterval(() => {
        fetchSmartReminders();
      }, 30 * 60 * 1000); // 30 minutes

      return () => clearInterval(interval);
    }
  }, [user]);

  return {
    reminders,
    userPatterns,
    loading,
    error,
    lastAnalysis,
    fetchSmartReminders,
    dismissReminder,
    snoozeReminder,
  };
};