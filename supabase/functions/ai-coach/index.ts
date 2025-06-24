import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TaskBreakdownRequest {
  input: string;
  type: 'task' | 'brain_dump' | 'voice_note' | 'reframing_advice';
  context?: {
    existing_tasks?: string[];
    mood_score?: number;
    energy_level?: number;
    user_id?: string;
    include_historical_data?: boolean;
    workload_breakdown?: boolean;
    focus_mode_active?: boolean;
    is_stuck_request?: boolean;
    neurodivergent_type?: 'none' | 'adhd' | 'autism' | 'anxiety' | 'multiple';
  };
}

interface TaskSuggestion {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimated_time: string;
  subtasks?: string[];
  tags?: string[];
}

interface TaskBreakdownResponse {
  coaching_response: string;
  subtasks?: string[];
  priority_suggestion?: 'low' | 'medium' | 'high';
  estimated_time?: string;
  encouragement: string;
  personalized_insights?: string[];
  recommended_strategies?: string[];
  // New fields for workload breakdown
  suggested_tasks?: TaskSuggestion[];
  overall_strategy?: string;
  time_estimate?: string;
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
          maxOutputTokens: 2048,
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

function getNeurodivergentPersonalization(neurodivergentType: string): string {
  switch (neurodivergentType) {
    case 'adhd':
      return `
ADHD-SPECIFIC PERSONALIZATION:
- Use shorter, more focused responses (2-3 sentences max for main points)
- Break tasks into very small, specific steps (5-15 minute chunks)
- Emphasize dopamine-friendly language ("You'll feel great when...", "Quick win!")
- Suggest body doubling, timers, and movement breaks
- Acknowledge executive function challenges without judgment
- Use energetic, encouraging tone that matches ADHD energy patterns
- Suggest working with natural energy cycles and hyperfocus periods
- Recommend external accountability and visual reminders`;

    case 'autism':
      return `
AUTISM-SPECIFIC PERSONALIZATION:
- Provide clear, structured, and predictable guidance
- Use concrete, specific language rather than abstract concepts
- Respect sensory sensitivities (suggest quiet spaces, comfortable lighting)
- Honor routine preferences and need for predictability
- Acknowledge that social/communication tasks may need extra support
- Use calm, steady tone without overwhelming enthusiasm
- Provide detailed step-by-step instructions
- Respect special interests and use them as motivation when possible
- Suggest breaking down social or communication tasks into scripts`;

    case 'anxiety':
      return `
ANXIETY-SPECIFIC PERSONALIZATION:
- Use gentle, reassuring language that validates their concerns
- Emphasize safety and control ("You can stop anytime", "This is just a suggestion")
- Break overwhelming tasks into tiny, non-threatening steps
- Acknowledge catastrophic thinking patterns with compassion
- Suggest grounding techniques and breathing exercises
- Use calm, soothing tone that reduces rather than increases activation
- Provide multiple options so they feel in control
- Emphasize progress over perfection
- Validate that anxiety is trying to protect them`;

    case 'multiple':
      return `
MULTIPLE CONDITIONS PERSONALIZATION:
- Combine strategies from multiple neurodivergent approaches
- Be extra flexible and adaptive in suggestions
- Acknowledge the complexity of managing multiple conditions
- Provide options for different energy levels and states
- Use validating language that honors their unique experience
- Suggest experimenting with different strategies to find what works
- Emphasize self-compassion and patience with the process
- Recognize that needs may change day to day`;

    default:
      return `
GENERAL NEURODIVERGENT-FRIENDLY APPROACH:
- Use clear, supportive language that validates their experience
- Break tasks into manageable steps
- Provide options and flexibility
- Emphasize progress over perfection
- Use encouraging, non-judgmental tone`;
  }
}

function createReframingAdvicePrompt(request: TaskBreakdownRequest, historicalData?: UserHistoricalData): string {
  const { input, context } = request;
  
  let prompt = `You are a compassionate AI coach specializing in helping neurodivergent individuals when they feel stuck, blocked, or overwhelmed. Your role is to provide gentle reframing advice and practical next steps.

USER'S STUCK REQUEST:
"${input}"

CURRENT CONTEXT:
- Focus mode active: ${context?.focus_mode_active ? 'Yes' : 'No'}
- Current energy level: ${context?.energy_level || 'Unknown'}/10
- Current mood: ${context?.mood_score || 'Unknown'}/10
- Neurodivergent type: ${context?.neurodivergent_type || 'not specified'}`;

  // Add neurodivergent-specific personalization
  if (context?.neurodivergent_type && context.neurodivergent_type !== 'none') {
    prompt += `\n\n${getNeurodivergentPersonalization(context.neurodivergent_type)}`;
  }

  if (historicalData) {
    prompt += `\n\nHISTORICAL PATTERNS:`;
    
    if (historicalData.common_struggles.length > 0) {
      prompt += `\nCommon challenges: ${historicalData.common_struggles.join(', ')}`;
    }

    if (historicalData.productive_hours.length > 0) {
      prompt += `\nMost productive hours: ${historicalData.productive_hours.map(h => `${h}:00`).join(', ')}`;
    }

    if (historicalData.task_completion_stats) {
      prompt += `\nTask completion rate: ${(historicalData.task_completion_stats.completion_rate * 100).toFixed(1)}%`;
    }
  }

  prompt += `

Please provide reframing advice and practical next steps. Respond with a JSON object containing:
{
  "coaching_response": "A gentle, reframing response that validates their feelings and offers a new perspective (2-3 sentences)",
  "recommended_strategies": ["Array of 2-3 specific, actionable strategies to help them get unstuck"],
  "encouragement": "A warm, supportive message that builds confidence and reminds them of their capabilities",
  "personalized_insights": ["Array of insights based on their patterns, if available"]
}

GUIDELINES FOR REFRAMING ADVICE:
- Validate their feelings first ("It's completely normal to feel stuck...")
- Reframe the situation positively ("This feeling means you care about doing well...")
- Offer perspective ("Remember, being stuck is temporary...")
- Provide specific, small next steps
- Reference their past successes when possible
- Use neurodivergent-friendly language based on their type
- Focus on progress, not perfection
- Suggest breaking things down into smaller pieces
- Remind them of their strengths

EXAMPLES OF GOOD REFRAMING:
- "Feeling stuck often means your brain is processing complex information. Let's break this down into one tiny step."
- "This overwhelm shows how much you care. Let's channel that energy into one small action."
- "Your brain works differently, not wrong. Let's find an approach that works with your natural patterns."

Respond ONLY with valid JSON, no additional text.`;

  return prompt;
}

function createWorkloadBreakdownPrompt(request: TaskBreakdownRequest, historicalData?: UserHistoricalData): string {
  const { input, context } = request;
  
  let prompt = `You are an expert productivity coach specializing in helping neurodivergent individuals break down complex workloads into manageable, actionable tasks. Your role is to analyze workload descriptions and create structured, prioritized task breakdowns.

WORKLOAD DESCRIPTION:
"${input}"

EXISTING TASKS CONTEXT:
${context?.existing_tasks?.length ? 
  context.existing_tasks.map(task => `- ${task}`).join('\n') :
  'No existing tasks'
}

NEURODIVERGENT TYPE: ${context?.neurodivergent_type || 'not specified'}`;

  // Add neurodivergent-specific personalization
  if (context?.neurodivergent_type && context.neurodivergent_type !== 'none') {
    prompt += `\n\n${getNeurodivergentPersonalization(context.neurodivergent_type)}`;
  }

  if (context?.mood_score) {
    prompt += `\nCurrent Mood Score: ${context.mood_score}/10`;
  }
  if (context?.energy_level) {
    prompt += `\nCurrent Energy Level: ${context.energy_level}/10`;
  }

  // Add historical context if available
  if (historicalData) {
    prompt += `\n\n=== HISTORICAL CONTEXT (Last 30 Days) ===`;
    
    if (historicalData.mood_patterns.length > 0) {
      const avgMood = historicalData.mood_patterns.reduce((sum, entry) => sum + entry.mood_score, 0) / historicalData.mood_patterns.length;
      const avgEnergy = historicalData.mood_patterns.reduce((sum, entry) => sum + entry.energy_level, 0) / historicalData.mood_patterns.length;
      prompt += `\nAverage Mood: ${avgMood.toFixed(1)}/10, Average Energy: ${avgEnergy.toFixed(1)}/10`;
    }

    if (historicalData.task_completion_stats) {
      prompt += `\nTask Completion Rate: ${(historicalData.task_completion_stats.completion_rate * 100).toFixed(1)}%`;
    }

    if (historicalData.productive_hours.length > 0) {
      prompt += `\nMost Productive Hours: ${historicalData.productive_hours.map(h => `${h}:00`).join(', ')}`;
    }

    if (historicalData.common_struggles.length > 0) {
      prompt += `\nCommon Challenges: ${historicalData.common_struggles.join(', ')}`;
    }
  }

  prompt += `

Please analyze this workload and provide a comprehensive breakdown. Consider:

1. **Scope Analysis**: What's the full scope of work involved?
2. **Dependencies**: What tasks depend on others being completed first?
3. **Time Estimation**: Realistic time estimates for each task
4. **Priority Assessment**: What needs to be done first vs. what can wait
5. **Complexity Breakdown**: Breaking overwhelming tasks into smaller, manageable pieces
6. **Neurodivergent-Friendly Approach**: Tasks sized appropriately for focus and energy management

Respond with a JSON object containing:
{
  "coaching_response": "A thoughtful analysis of the workload, identifying key challenges, scope, and approach (2-3 sentences)",
  "suggested_tasks": [
    {
      "title": "Clear, actionable task title",
      "description": "Detailed description of what needs to be done and how",
      "priority": "high|medium|low based on urgency and dependencies",
      "estimated_time": "Realistic time estimate (e.g., '2-3 hours', '30 minutes', '1 week')",
      "subtasks": ["Optional array of smaller subtasks if the main task is complex"],
      "tags": ["Optional relevant tags for organization"]
    }
  ],
  "overall_strategy": "A strategic approach for tackling this workload, including recommended order and pacing (2-3 sentences)",
  "time_estimate": "Total estimated time for the entire workload",
  "encouragement": "Supportive, neurodivergent-friendly encouragement that validates the complexity while building confidence",
  "personalized_insights": ["Array of insights based on historical patterns if available"],
  "recommended_strategies": ["Array of specific strategies based on user patterns and neurodivergent type"]
}

GUIDELINES:
- Break large tasks into smaller, focused chunks (ideal: 1-3 hours per task for ADHD, longer for autism if preferred)
- Prioritize based on dependencies and deadlines
- Include specific, actionable descriptions
- Consider energy management (mix high and low energy tasks)
- Provide realistic time estimates
- Use encouraging, non-overwhelming language
- Suggest 3-8 main tasks (more if needed for complex projects)
- Include subtasks for complex items
- Add relevant tags for organization
- Consider the neurodivergent experience (executive function, overwhelm, hyperfocus)
- Reference historical patterns when available

EXAMPLES OF GOOD TASK BREAKDOWN:
- Instead of "Plan wedding" → "Research and book venue", "Create guest list", "Design invitations"
- Instead of "Launch product" → "Create landing page wireframe", "Write product copy", "Set up analytics tracking"
- Instead of "Study for exam" → "Review chapters 1-3", "Create practice flashcards", "Take practice test"

Respond ONLY with valid JSON, no additional text.`;

  return prompt;
}

function createEnhancedCoachingPrompt(request: TaskBreakdownRequest, historicalData?: UserHistoricalData): string {
  const { input, type, context } = request;
  
  let basePrompt = `You are a gentle, encouraging AI coach specifically designed for neurodivergent minds (ADHD, autism, anxiety). Your role is to help break down tasks and provide supportive guidance using deep contextual understanding.

User Input Type: ${type}
User Input: "${input}"
Neurodivergent Type: ${context?.neurodivergent_type || 'not specified'}`;

  // Add neurodivergent-specific personalization
  if (context?.neurodivergent_type && context.neurodivergent_type !== 'none') {
    basePrompt += `\n\n${getNeurodivergentPersonalization(context.neurodivergent_type)}`;
  }

  if (context?.mood_score) {
    basePrompt += `\nCurrent Mood Score: ${context.mood_score}/10`;
  }
  if (context?.energy_level) {
    basePrompt += `\nCurrent Energy Level: ${context.energy_level}/10`;
  }
  if (context?.existing_tasks?.length) {
    basePrompt += `\nExisting Tasks: ${context.existing_tasks.join(', ')}`;
  }
  if (context?.focus_mode_active) {
    basePrompt += `\nFocus Mode: Active`;
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
- If in focus mode, provide focused, concise guidance
- Adapt language and suggestions based on their neurodivergent type

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

    // Create the appropriate prompt based on request type
    let prompt: string;
    
    if (type === 'reframing_advice' || context?.is_stuck_request) {
      prompt = createReframingAdvicePrompt({ input, type, context }, historicalData);
    } else if (context?.workload_breakdown === true) {
      prompt = createWorkloadBreakdownPrompt({ input, type, context }, historicalData);
    } else {
      prompt = createEnhancedCoachingPrompt({ input, type, context }, historicalData);
    }

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
      if (type === 'reframing_advice' || context?.is_stuck_request) {
        parsedResponse = {
          coaching_response: "I hear that you're feeling stuck. This is completely normal and shows that you care about doing well.",
          encouragement: "Remember, feeling stuck is temporary. You have the strength to work through this, one small step at a time.",
          recommended_strategies: [
            "Take a 5-minute break to reset your mind",
            "Write down just one tiny next step you could take",
            "Remember a time when you overcame a similar challenge"
          ]
        };
      } else if (context?.workload_breakdown === true) {
        parsedResponse = {
          coaching_response: "I can see this is a complex workload that needs to be broken down into manageable pieces.",
          suggested_tasks: [
            {
              title: "Break down the main project",
              description: "Take time to identify the key components and create a detailed plan",
              priority: "high" as const,
              estimated_time: "1-2 hours",
              tags: ["planning"]
            }
          ],
          overall_strategy: "Start by taking a step back and breaking this down into smaller, more manageable pieces. Focus on one task at a time.",
          time_estimate: "Time varies based on scope",
          encouragement: "This looks like a substantial project, but you can absolutely handle it by taking it one step at a time!"
        };
      } else {
        parsedResponse = {
          coaching_response: "I hear you, and I'm here to help you work through this. Let's take it one step at a time.",
          encouragement: "Your neurodivergent mind is not something to fix - it's something to understand and work with.",
          priority_suggestion: "medium" as const,
          estimated_time: "Take your time"
        };
      }
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