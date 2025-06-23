import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TaskBreakdownRequest {
  input: string;
  type: 'task' | 'brain_dump' | 'voice_note';
  context?: {
    existing_tasks?: string[];
    mood_score?: number;
    energy_level?: number;
    user_id?: string;
    include_historical_data?: boolean;
  };
}

interface TaskBreakdownResponse {
  coaching_response: string;
  subtasks?: string[];
  priority_suggestion?: 'low' | 'medium' | 'high';
  estimated_time?: string;
  encouragement: string;
  personalized_insights?: string[];
  recommended_strategies?: string[];
}

interface UserHistoricalData {
  mood_patterns: any[];
  task_completion_stats: any;
  brain_dump_categories: any[];
  productive_hours: number[];
  common_struggles: string[];
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

async function callGeminiAPI(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

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
          temperature: 0.7,
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

async function getUserHistoricalData(userId: string): Promise<UserHistoricalData> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  // Get mood patterns
  const { data: moodEntries } = await supabase
    .from('mood_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false });

  // Get task completion stats
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo);

  // Get brain dump categories
  const { data: brainDumps } = await supabase
    .from('brain_dumps')
    .select('ai_result')
    .eq('user_id', userId)
    .eq('processed', true)
    .gte('created_at', thirtyDaysAgo);

  // Analyze productive hours from completed tasks
  const completedTasks = tasks?.filter(t => t.status === 'completed' && t.completed_at) || [];
  const productiveHours: { [hour: number]: number } = {};
  
  completedTasks.forEach(task => {
    if (task.completed_at) {
      const hour = new Date(task.completed_at).getHours();
      productiveHours[hour] = (productiveHours[hour] || 0) + 1;
    }
  });

  const topProductiveHours = Object.entries(productiveHours)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  // Analyze common struggles from brain dumps
  const strugglesKeywords = ['overwhelmed', 'stuck', 'procrastinating', 'anxious', 'confused', 'tired'];
  const commonStruggles: string[] = [];
  
  brainDumps?.forEach(dump => {
    if (dump.ai_result?.category === 'reflection') {
      strugglesKeywords.forEach(keyword => {
        if (dump.ai_result.summary?.toLowerCase().includes(keyword)) {
          commonStruggles.push(keyword);
        }
      });
    }
  });

  // Calculate task completion stats
  const totalTasks = tasks?.length || 0;
  const completedTasksCount = completedTasks.length;
  const completionRate = totalTasks > 0 ? completedTasksCount / totalTasks : 0;
  
  const tasksByPriority = {
    high: tasks?.filter(t => t.priority === 'high').length || 0,
    medium: tasks?.filter(t => t.priority === 'medium').length || 0,
    low: tasks?.filter(t => t.priority === 'low').length || 0,
  };

  return {
    mood_patterns: moodEntries || [],
    task_completion_stats: {
      total_tasks: totalTasks,
      completed_tasks: completedTasksCount,
      completion_rate: completionRate,
      tasks_by_priority: tasksByPriority,
    },
    brain_dump_categories: brainDumps?.map(d => d.ai_result).filter(Boolean) || [],
    productive_hours: topProductiveHours,
    common_struggles: [...new Set(commonStruggles)], // Remove duplicates
  };
}

function createEnhancedCoachingPrompt(request: TaskBreakdownRequest, historicalData?: UserHistoricalData): string {
  const { input, type, context } = request;
  
  let basePrompt = `You are a gentle, encouraging AI coach specifically designed for neurodivergent minds (ADHD, autism, anxiety). Your role is to help break down tasks and provide supportive guidance using deep contextual understanding.

User Input Type: ${type}
User Input: "${input}"`;

  if (context?.mood_score) {
    basePrompt += `\nCurrent Mood Score: ${context.mood_score}/10`;
  }
  if (context?.energy_level) {
    basePrompt += `\nCurrent Energy Level: ${context.energy_level}/10`;
  }
  if (context?.existing_tasks?.length) {
    basePrompt += `\nExisting Tasks: ${context.existing_tasks.join(', ')}`;
  }

  // Add historical context if available
  if (historicalData) {
    basePrompt += `\n\n=== HISTORICAL CONTEXT (Last 30 Days) ===`;
    
    if (historicalData.mood_patterns.length > 0) {
      const avgMood = historicalData.mood_patterns.reduce((sum, entry) => sum + entry.mood_score, 0) / historicalData.mood_patterns.length;
      const avgEnergy = historicalData.mood_patterns.reduce((sum, entry) => sum + entry.energy_level, 0) / historicalData.mood_patterns.length;
      basePrompt += `\nAverage Mood: ${avgMood.toFixed(1)}/10, Average Energy: ${avgEnergy.toFixed(1)}/10`;
    }

    if (historicalData.task_completion_stats) {
      basePrompt += `\nTask Completion Rate: ${(historicalData.task_completion_stats.completion_rate * 100).toFixed(1)}%`;
      basePrompt += `\nTotal Tasks: ${historicalData.task_completion_stats.total_tasks}, Completed: ${historicalData.task_completion_stats.completed_tasks}`;
    }

    if (historicalData.productive_hours.length > 0) {
      basePrompt += `\nMost Productive Hours: ${historicalData.productive_hours.map(h => `${h}:00`).join(', ')}`;
    }

    if (historicalData.common_struggles.length > 0) {
      basePrompt += `\nCommon Challenges: ${historicalData.common_struggles.join(', ')}`;
    }

    if (historicalData.brain_dump_categories.length > 0) {
      const categories = historicalData.brain_dump_categories.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      basePrompt += `\nBrain Dump Patterns: ${Object.entries(categories).map(([cat, count]) => `${cat}(${count})`).join(', ')}`;
    }
  }

  basePrompt += `

Please respond with a JSON object containing:
{
  "coaching_response": "A warm, encouraging response that acknowledges their input and provides gentle guidance (2-3 sentences)",
  "subtasks": ["array", "of", "specific", "actionable", "subtasks", "if", "applicable"],
  "priority_suggestion": "low|medium|high based on urgency and user's current state",
  "estimated_time": "realistic time estimate like '15-30 minutes' or 'Quick 5-minute task'",
  "encouragement": "A specific, personalized encouragement that validates their neurodivergent experience",
  "personalized_insights": ["array", "of", "insights", "based", "on", "historical", "patterns"],
  "recommended_strategies": ["array", "of", "specific", "strategies", "based", "on", "user", "patterns"]
}

Guidelines:
- Use warm, non-judgmental language
- Break complex tasks into tiny, manageable steps
- Consider executive function challenges
- Acknowledge that their brain works differently, not wrong
- Suggest realistic timeframes
- Be specific and actionable
- Validate their feelings and experiences
- Use "you" language to make it personal
- Leverage historical patterns to provide personalized insights
- Reference their productive hours and past successes when relevant
- Address their common challenges with specific strategies

Examples of enhanced coaching language:
- "Based on your patterns, you tend to be most productive around [time], so this might be a good time to tackle this"
- "I notice you've successfully completed similar tasks before, so you have the skills for this"
- "Given your recent energy levels, let's break this into smaller chunks"
- "Your brain dump patterns show you're great at [strength], so let's use that here"

Respond ONLY with valid JSON, no additional text.`;

  return basePrompt;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { input, type, context }: TaskBreakdownRequest = await req.json()

    if (!input || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: input and type' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let historicalData: UserHistoricalData | undefined;

    // Fetch historical data if user_id is provided and historical data is requested
    if (context?.user_id && context?.include_historical_data) {
      try {
        historicalData = await getUserHistoricalData(context.user_id);
      } catch (error) {
        console.error('Error fetching historical data:', error);
        // Continue without historical data rather than failing
      }
    }

    // Create the enhanced coaching prompt
    const prompt = createEnhancedCoachingPrompt({ input, type, context }, historicalData);

    // Call Gemini API
    const geminiResponse = await callGeminiAPI(prompt);

    // Parse the JSON response from Gemini
    let parsedResponse: TaskBreakdownResponse;
    try {
      // Clean up the response in case Gemini adds extra formatting
      const cleanedResponse = geminiResponse.replace(/```json\n?|\n?```/g, '').trim();
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      console.error('Raw response:', geminiResponse);
      
      // Fallback response if JSON parsing fails
      parsedResponse = {
        coaching_response: "I hear you, and I'm here to help you work through this. Let's take it one step at a time.",
        encouragement: "Your neurodivergent mind is not something to fix - it's something to understand and work with.",
        priority_suggestion: "medium" as const,
        estimated_time: "Take your time"
      };
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in ai-coach function:', error);
    
    // Return a gentle fallback response
    const fallbackResponse: TaskBreakdownResponse = {
      coaching_response: "I'm here to support you, even though I'm having a small technical hiccup right now. Your task is important and manageable.",
      encouragement: "You're taking a positive step by reaching out for support. That's something to be proud of.",
      priority_suggestion: "medium" as const,
      estimated_time: "Take it at your own pace"
    };

    return new Response(
      JSON.stringify(fallbackResponse),
      { 
        status: 200, // Return 200 to avoid breaking the UI
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})