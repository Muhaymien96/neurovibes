import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InsightsRequest {
  user_id: string;
  timeframe_days?: number;
}

interface InsightsResponse {
  productivity_patterns: string[];
  mood_correlations: string[];
  task_completion_insights: string[];
  personalized_recommendations: string[];
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
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function analyzeUserData(userId: string, timeframeDays: number = 30) {
  const startDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000).toISOString();
  
  // Get mood entries
  const { data: moodEntries } = await supabase
    .from('mood_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .order('created_at', { ascending: true });

  // Get tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .order('created_at', { ascending: true });

  // Get brain dumps
  const { data: brainDumps } = await supabase
    .from('brain_dumps')
    .select('*')
    .eq('user_id', userId)
    .eq('processed', true)
    .gte('created_at', startDate);

  return { moodEntries: moodEntries || [], tasks: tasks || [], brainDumps: brainDumps || [] };
}

function createInsightsPrompt(userData: any): string {
  return `You are an AI analyst specializing in productivity and wellness patterns for neurodivergent individuals. Analyze the following user data and provide actionable insights.

USER DATA SUMMARY:
- Mood Entries: ${userData.moodEntries.length} entries
- Tasks: ${userData.tasks.length} total tasks
- Completed Tasks: ${userData.tasks.filter((t: any) => t.status === 'completed').length}
- Brain Dumps: ${userData.brainDumps.length} processed entries

DETAILED ANALYSIS:

Mood Patterns:
${userData.moodEntries.map((entry: any) => 
  `${new Date(entry.created_at).toLocaleDateString()}: Mood ${entry.mood_score}/10, Energy ${entry.energy_level}/10, Focus ${entry.focus_level}/10`
).join('\n')}

Task Completion Patterns:
${userData.tasks.map((task: any) => 
  `${task.title} (${task.priority} priority, ${task.status}) - Created: ${new Date(task.created_at).toLocaleDateString()}${task.completed_at ? `, Completed: ${new Date(task.completed_at).toLocaleDateString()}` : ''}`
).join('\n')}

Brain Dump Categories:
${userData.brainDumps.map((dump: any) => 
  `${dump.ai_result?.category || 'uncategorized'}: ${dump.ai_result?.title || dump.content.substring(0, 50)}`
).join('\n')}

Please analyze this data and provide insights in the following JSON format:
{
  "productivity_patterns": [
    "Specific patterns about when and how the user is most productive",
    "Time-based patterns, task type preferences, etc."
  ],
  "mood_correlations": [
    "Correlations between mood/energy and task completion",
    "Patterns in mood fluctuations and their impact"
  ],
  "task_completion_insights": [
    "Insights about task completion rates and patterns",
    "What types of tasks they complete vs struggle with"
  ],
  "personalized_recommendations": [
    "Specific, actionable recommendations based on their patterns",
    "Strategies tailored to their neurodivergent needs"
  ]
}

Guidelines:
- Focus on actionable insights, not just observations
- Use encouraging, neurodivergent-friendly language
- Identify both strengths and areas for improvement
- Provide specific, practical recommendations
- Consider executive function challenges
- Look for patterns in timing, task types, mood correlations
- Be supportive and validating

Respond ONLY with valid JSON, no additional text.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, timeframe_days = 30 }: InsightsRequest = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Analyze user data
    const userData = await analyzeUserData(user_id, timeframe_days);

    // If no data available, return empty insights
    if (userData.moodEntries.length === 0 && userData.tasks.length === 0 && userData.brainDumps.length === 0) {
      return new Response(
        JSON.stringify({
          productivity_patterns: ["Not enough data yet - keep using MindMesh to build your patterns!"],
          mood_correlations: ["Start logging your mood to discover correlations with your productivity"],
          task_completion_insights: ["Create and complete tasks to see your completion patterns"],
          personalized_recommendations: ["Begin by logging your mood and creating a few tasks to get started"]
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create insights prompt
    const prompt = createInsightsPrompt(userData);

    // Call Gemini API
    const geminiResponse = await callGeminiAPI(prompt);

    // Parse the JSON response
    let parsedResponse: InsightsResponse;
    try {
      const cleanedResponse = geminiResponse.replace(/```json\n?|\n?```/g, '').trim();
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      
      // Fallback response
      parsedResponse = {
        productivity_patterns: ["Your productivity patterns are still developing - keep tracking!"],
        mood_correlations: ["Continue logging mood and tasks to discover correlations"],
        task_completion_insights: ["Your task completion data is building - great progress!"],
        personalized_recommendations: ["Keep using MindMesh consistently to unlock personalized insights"]
      };
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in contextual-insights function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate insights',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})