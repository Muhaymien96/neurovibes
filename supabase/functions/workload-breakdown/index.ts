import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WorkloadRequest {
  workload_description: string;
  existing_tasks?: Array<{
    title: string;
    priority: string;
    status: string;
  }>;
  user_id?: string;
  context?: {
    include_historical_data?: boolean;
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

interface WorkloadBreakdown {
  analysis: string;
  suggested_tasks: TaskSuggestion[];
  overall_strategy: string;
  time_estimate: string;
  encouragement: string;
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

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

function createWorkloadBreakdownPrompt(request: WorkloadRequest): string {
  const { workload_description, existing_tasks = [] } = request;
  
  let prompt = `You are an expert productivity coach specializing in helping neurodivergent individuals break down complex workloads into manageable, actionable tasks. Your role is to analyze workload descriptions and create structured, prioritized task breakdowns.

WORKLOAD DESCRIPTION:
"${workload_description}"

EXISTING TASKS CONTEXT:
${existing_tasks.length > 0 ? 
  existing_tasks.map(task => `- ${task.title} (${task.priority} priority, ${task.status})`).join('\n') :
  'No existing tasks'
}

Please analyze this workload and provide a comprehensive breakdown. Consider:

1. **Scope Analysis**: What's the full scope of work involved?
2. **Dependencies**: What tasks depend on others being completed first?
3. **Time Estimation**: Realistic time estimates for each task
4. **Priority Assessment**: What needs to be done first vs. what can wait
5. **Complexity Breakdown**: Breaking overwhelming tasks into smaller, manageable pieces
6. **Resource Requirements**: What resources, tools, or people might be needed
7. **Neurodivergent-Friendly Approach**: Tasks sized appropriately for focus and energy management

Respond with a JSON object containing:
{
  "analysis": "A thoughtful analysis of the workload, identifying key challenges, scope, and approach (2-3 sentences)",
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
  "encouragement": "Supportive, neurodivergent-friendly encouragement that validates the complexity while building confidence"
}

GUIDELINES:
- Break large tasks into smaller, focused chunks (ideal: 1-3 hours per task)
- Prioritize based on dependencies and deadlines
- Include specific, actionable descriptions
- Consider energy management (mix high and low energy tasks)
- Provide realistic time estimates
- Use encouraging, non-overwhelming language
- Suggest 3-8 main tasks (more if needed for complex projects)
- Include subtasks for complex items
- Add relevant tags for organization
- Consider the neurodivergent experience (executive function, overwhelm, hyperfocus)

EXAMPLES OF GOOD TASK BREAKDOWN:
- Instead of "Plan wedding" → "Research and book venue", "Create guest list", "Design invitations"
- Instead of "Launch product" → "Create landing page wireframe", "Write product copy", "Set up analytics tracking"
- Instead of "Study for exam" → "Review chapters 1-3", "Create practice flashcards", "Take practice test"

Respond ONLY with valid JSON, no additional text.`;

  return prompt;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: WorkloadRequest = await req.json()

    if (!request.workload_description || typeof request.workload_description !== 'string') {
      return new Response(
        JSON.stringify({ error: 'workload_description is required and must be a string' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (request.workload_description.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'workload_description must be at least 10 characters long' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create the workload breakdown prompt
    const prompt = createWorkloadBreakdownPrompt(request);

    // Call Gemini API
    const geminiResponse = await callGeminiAPI(prompt);

    // Parse the JSON response from Gemini
    let parsedResponse: WorkloadBreakdown;
    try {
      // Clean up the response in case Gemini adds extra formatting
      const cleanedResponse = geminiResponse.replace(/```json\n?|\n?```/g, '').trim();
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      console.error('Raw response:', geminiResponse);
      
      // Fallback response if JSON parsing fails
      parsedResponse = {
        analysis: "I can see this is a complex workload that needs to be broken down into manageable pieces.",
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
    }

    // Validate the response structure
    if (!parsedResponse.analysis || !parsedResponse.suggested_tasks || !Array.isArray(parsedResponse.suggested_tasks)) {
      throw new Error('Invalid response structure from AI');
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in workload-breakdown function:', error);
    
    // Return a helpful fallback response
    const fallbackResponse: WorkloadBreakdown = {
      analysis: "I'm having trouble processing your request right now, but I can see you have a workload that needs organizing.",
      suggested_tasks: [
        {
          title: "Organize your thoughts",
          description: "Take 15 minutes to write down everything you need to accomplish",
          priority: "medium" as const,
          estimated_time: "15 minutes",
          tags: ["planning"]
        },
        {
          title: "Identify priorities",
          description: "Look at your list and mark what's most urgent or important",
          priority: "medium" as const,
          estimated_time: "10 minutes",
          tags: ["planning"]
        }
      ],
      overall_strategy: "Start with a brain dump of everything you need to do, then prioritize and break things down further.",
      time_estimate: "Varies by project scope",
      encouragement: "Even when technology hiccups, you've got this! Breaking things down step by step is always the right approach."
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