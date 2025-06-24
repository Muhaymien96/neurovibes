import { useState } from 'react';

interface AICoachRequest {
  input: string;
  type: 'task' | 'brain_dump' | 'voice_note' | 'reframing_advice';
  context?: {
    existing_tasks?: string[];
    mood_score?: number;
    energy_level?: number;
    user_id?: string;
    include_historical_data?: boolean;
    focus_mode_active?: boolean;
    is_stuck_request?: boolean;
    neurodivergent_type?: 'none' | 'adhd' | 'autism' | 'anxiety' | 'multiple';
  };
}

interface AICoachResponse {
  coaching_response: string;
  subtasks?: string[];
  priority_suggestion?: 'low' | 'medium' | 'high';
  estimated_time?: string;
  encouragement: string;
  personalized_insights?: string[];
  recommended_strategies?: string[];
}

export const useAICoach = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCoachingResponse = async (request: AICoachRequest): Promise<AICoachResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...request,
            context: {
              ...request.context,
              include_historical_data: true, // Always include historical data for enhanced coaching
            }
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get AI coaching response');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('AI Coach error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getContextualInsights = async (userId: string): Promise<{
    productivity_patterns: string[];
    mood_correlations: string[];
    task_completion_insights: string[];
    personalized_recommendations: string[];
  } | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contextual-insights`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: userId }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get contextual insights');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Contextual insights error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    getCoachingResponse,
    getContextualInsights,
    loading,
    error,
  };
};