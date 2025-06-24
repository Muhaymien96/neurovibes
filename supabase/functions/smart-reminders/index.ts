import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReminderRequest {
  user_id: string;
  analysis_type?: 'deadlines' | 'mood_patterns' | 'task_transitions' | 'all';
}

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

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Initialize Supabase client with service role for full access
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

async function callGeminiAPI(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  // Updated to use the correct Gemini API endpoint
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Gemini API error: ${response.status} ${response.statusText}`, errorText);
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    console.error('Unexpected Gemini API response structure:', data);
    throw new Error('Invalid response from Gemini API');
  }
  
  return data.candidates[0].content.parts[0].text;
}

async function getUserTasks(userId: string) {
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return tasks || [];
}

async function getUserMoodHistory(userId: string, days: number = 14) {
  const { data: moods, error } = await supabase
    .from('mood_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return moods || [];
}

async function analyzeUserPatterns(userId: string): Promise<UserPattern> {
  const tasks = await getUserTasks(userId);
  const moods = await getUserMoodHistory(userId, 30);

  // Analyze productive hours based on task completion times
  const completedTasks = tasks.filter(t => t.status === 'completed' && t.completed_at);
  const productiveHours: { [hour: number]: number } = {};
  
  completedTasks.forEach(task => {
    if (task.completed_at) {
      const hour = new Date(task.completed_at).getHours();
      productiveHours[hour] = (productiveHours[hour] || 0) + 1;
    }
  });

  // Find top 3 productive hours
  const topHours = Object.entries(productiveHours)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  // Analyze mood patterns by hour
  const moodByHour: { [hour: number]: number[] } = {};
  moods.forEach(mood => {
    const hour = new Date(mood.created_at).getHours();
    if (!moodByHour[hour]) moodByHour[hour] = [];
    moodByHour[hour].push(mood.mood_score);
  });

  const averageMoodByHour: { [hour: number]: number } = {};
  Object.entries(moodByHour).forEach(([hour, scores]) => {
    averageMoodByHour[parseInt(hour)] = scores.reduce((a, b) => a + b, 0) / scores.length;
  });

  // Calculate completion rate
  const completionRate = tasks.length > 0 
    ? completedTasks.length / tasks.length 
    : 0;

  return {
    productive_hours: topHours,
    average_mood_by_hour: averageMoodByHour,
    task_completion_rate: completionRate,
    procrastination_triggers: ['large tasks', 'unclear requirements', 'low energy'],
    preferred_break_duration: 15 // Default to 15 minutes
  };
}

async function generateSmartReminders(userId: string, patterns: UserPattern): Promise<SmartReminder[]> {
  const tasks = await getUserTasks(userId);
  const recentMoods = await getUserMoodHistory(userId, 3);
  const currentHour = new Date().getHours();
  
  // Get current mood trend
  const currentMoodTrend = recentMoods.length > 0 
    ? recentMoods.reduce((sum, mood) => sum + mood.mood_score, 0) / recentMoods.length
    : 5;

  const currentEnergyTrend = recentMoods.length > 0 
    ? recentMoods.reduce((sum, mood) => sum + mood.energy_level, 0) / recentMoods.length
    : 5;

  const reminders: SmartReminder[] = [];

  // 1. Deadline-based reminders
  const upcomingTasks = tasks.filter(task => {
    if (!task.due_date || task.status === 'completed') return false;
    const dueDate = new Date(task.due_date);
    const now = new Date();
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilDue > 0 && hoursUntilDue <= 48; // Next 48 hours
  });

  for (const task of upcomingTasks) {
    const dueDate = new Date(task.due_date!);
    const hoursUntilDue = (dueDate.getTime() - Date.now()) / (1000 * 60 * 60);
    
    let priority: 'low' | 'medium' | 'high' = 'medium';
    let timing: SmartReminder['timing'] = 'in_1_hour';
    
    if (hoursUntilDue <= 6) {
      priority = 'high';
      timing = 'immediate';
    } else if (hoursUntilDue <= 24) {
      priority = 'medium';
      timing = 'in_30_min';
    }

    const prompt = `Create a gentle, encouraging reminder for a neurodivergent person about an upcoming task deadline.

Task: "${task.title}"
Description: "${task.description || 'No description'}"
Priority: ${task.priority}
Hours until due: ${Math.round(hoursUntilDue)}
User's current mood trend: ${currentMoodTrend}/10
User's current energy: ${currentEnergyTrend}/10

Create a JSON response with:
{
  "title": "Brief, non-alarming title",
  "message": "Supportive message that acknowledges their neurodivergent needs (2-3 sentences)",
  "suggested_action": "One specific, small action they can take right now",
  "voice_message": "Warm, spoken version of the message with encouraging tone"
}

Use language that:
- Reduces anxiety rather than increases it
- Acknowledges that their brain works differently
- Suggests breaking the task down if it feels overwhelming
- Validates their experience
- Offers specific, actionable next steps

Respond ONLY with valid JSON.`;

    try {
      const geminiResponse = await callGeminiAPI(prompt);
      const cleanedResponse = geminiResponse.replace(/```json\n?|\n?```/g, '').trim();
      const aiResponse = JSON.parse(cleanedResponse);

      reminders.push({
        id: `deadline_${task.id}`,
        type: 'deadline_warning',
        title: aiResponse.title,
        message: aiResponse.message,
        priority,
        suggested_action: aiResponse.suggested_action,
        timing,
        voice_message: aiResponse.voice_message,
        context: {
          related_task_id: task.id,
          mood_trend: currentMoodTrend >= 6 ? 'positive' : currentMoodTrend >= 4 ? 'neutral' : 'low',
          energy_recommendation: currentEnergyTrend < 5 ? 'Consider taking a short break first' : 'Good energy for tackling this'
        }
      });
    } catch (error) {
      console.error('Error generating deadline reminder:', error);
    }
  }

  // 2. Mood-based transition reminders
  if (patterns.productive_hours.includes(currentHour) && currentMoodTrend < 6) {
    const prompt = `Create an encouraging transition reminder for someone who is in their productive hours but has lower mood/energy.

Current hour: ${currentHour} (this is typically a productive time for them)
Current mood trend: ${currentMoodTrend}/10
Current energy trend: ${currentEnergyTrend}/10
Pending tasks: ${tasks.filter(t => t.status === 'pending').length}

Create a JSON response with:
{
  "title": "Gentle transition suggestion",
  "message": "Supportive message that helps them transition into productivity despite lower mood",
  "suggested_action": "One small action to help them get started",
  "voice_message": "Warm, encouraging spoken version"
}

Focus on:
- Acknowledging that productivity doesn't require perfect mood
- Suggesting the smallest possible first step
- Validating their current state
- Offering hope and encouragement

Respond ONLY with valid JSON.`;

    try {
      const geminiResponse = await callGeminiAPI(prompt);
      const cleanedResponse = geminiResponse.replace(/```json\n?|\n?```/g, '').trim();
      const aiResponse = JSON.parse(cleanedResponse);

      reminders.push({
        id: `mood_transition_${Date.now()}`,
        type: 'mood_based',
        title: aiResponse.title,
        message: aiResponse.message,
        priority: 'medium',
        suggested_action: aiResponse.suggested_action,
        timing: 'immediate',
        voice_message: aiResponse.voice_message,
        context: {
          mood_trend: 'needs_support',
          energy_recommendation: 'Start with the smallest possible step'
        }
      });
    } catch (error) {
      console.error('Error generating mood-based reminder:', error);
    }
  }

  // 3. Task transition nudges for long-running tasks
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  for (const task of inProgressTasks) {
    const taskStartTime = new Date(task.updated_at);
    const hoursWorking = (Date.now() - taskStartTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursWorking > 2) { // Working on task for more than 2 hours
      const prompt = `Create a gentle break reminder for someone who has been working on a task for ${Math.round(hoursWorking)} hours.

Task: "${task.title}"
Time working: ${Math.round(hoursWorking)} hours
Current mood: ${currentMoodTrend}/10

Create a JSON response with:
{
  "title": "Gentle break suggestion",
  "message": "Caring reminder about taking breaks for neurodivergent productivity",
  "suggested_action": "Specific break activity suggestion",
  "voice_message": "Warm reminder about self-care"
}

Focus on:
- Celebrating their focus and effort
- Explaining why breaks help neurodivergent brains
- Suggesting a specific, short break activity
- Reassuring them that breaks improve productivity

Respond ONLY with valid JSON.`;

      try {
        const geminiResponse = await callGeminiAPI(prompt);
        const cleanedResponse = geminiResponse.replace(/```json\n?|\n?```/g, '').trim();
        const aiResponse = JSON.parse(cleanedResponse);

        reminders.push({
          id: `break_${task.id}`,
          type: 'transition_nudge',
          title: aiResponse.title,
          message: aiResponse.message,
          priority: 'low',
          suggested_action: aiResponse.suggested_action,
          timing: 'immediate',
          voice_message: aiResponse.voice_message,
          context: {
            related_task_id: task.id,
            energy_recommendation: 'Take a restorative break'
          }
        });
      } catch (error) {
        console.error('Error generating break reminder:', error);
      }
    }
  }

  // 4. Daily encouragement based on completion rate
  if (patterns.task_completion_rate < 0.5 && reminders.length === 0) {
    const prompt = `Create a daily encouragement message for someone with a lower task completion rate.

Completion rate: ${Math.round(patterns.task_completion_rate * 100)}%
Current mood: ${currentMoodTrend}/10
Pending tasks: ${tasks.filter(t => t.status === 'pending').length}

Create a JSON response with:
{
  "title": "Daily encouragement",
  "message": "Supportive message that reframes productivity for neurodivergent minds",
  "suggested_action": "One small, achievable action",
  "voice_message": "Warm, validating spoken message"
}

Focus on:
- Redefining productivity beyond task completion
- Celebrating small wins and effort
- Reducing shame around incomplete tasks
- Offering hope and practical next steps

Respond ONLY with valid JSON.`;

    try {
      const geminiResponse = await callGeminiAPI(prompt);
      const cleanedResponse = geminiResponse.replace(/```json\n?|\n?```/g, '').trim();
      const aiResponse = JSON.parse(cleanedResponse);

      reminders.push({
        id: `encouragement_${Date.now()}`,
        type: 'encouragement',
        title: aiResponse.title,
        message: aiResponse.message,
        priority: 'low',
        suggested_action: aiResponse.suggested_action,
        timing: 'immediate',
        voice_message: aiResponse.voice_message,
        context: {
          mood_trend: 'needs_encouragement',
          energy_recommendation: 'Focus on progress, not perfection'
        }
      });
    } catch (error) {
      console.error('Error generating encouragement:', error);
    }
  }

  return reminders;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, analysis_type = 'all' }: ReminderRequest = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Analyze user patterns
    console.log('Analyzing patterns for user:', user_id);
    const patterns = await analyzeUserPatterns(user_id);

    // Generate smart reminders
    console.log('Generating smart reminders...');
    const reminders = await generateSmartReminders(user_id, patterns);

    // Sort reminders by priority and timing
    const sortedReminders = reminders.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const timingOrder = { immediate: 4, in_30_min: 3, in_1_hour: 2, tomorrow: 1 };
      
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return timingOrder[b.timing] - timingOrder[a.timing];
    });

    return new Response(
      JSON.stringify({
        reminders: sortedReminders,
        user_patterns: patterns,
        analysis_timestamp: new Date().toISOString(),
        total_reminders: sortedReminders.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in smart-reminders function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate smart reminders',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})