import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessRequest {
  content: string;
  type: 'voice' | 'text';
  user_id: string;
}

interface ProcessResult {
  category: 'action' | 'note' | 'reflection';
  title: string;
  summary: string;
  priority?: 'low' | 'medium' | 'high';
  suggested_actions?: string[];
  tags?: string[];
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

function createProcessingPrompt(content: string, type: string): string {
  return `You are an AI assistant specialized in organizing thoughts for neurodivergent minds. Your task is to analyze brain dump content and categorize it appropriately.

Input Type: ${type}
Content: "${content}"

Analyze this content and categorize it into one of three types:

1. **ACTION**: Something that requires doing, completing, or taking steps on
2. **NOTE**: Information, ideas, or knowledge to remember or reference later  
3. **REFLECTION**: Personal thoughts, feelings, insights, or self-observations

Please respond with a JSON object containing:
{
  "category": "action|note|reflection",
  "title": "A clear, concise title (max 60 characters)",
  "summary": "A helpful summary that captures the essence (max 150 characters)",
  "priority": "low|medium|high (only for actions)",
  "suggested_actions": ["array", "of", "specific", "next", "steps"] (only for actions),
  "tags": ["relevant", "keywords", "for", "organization"] (for notes and reflections)
}

Guidelines:
- Be concise but helpful
- For actions: Focus on what needs to be done and break it into steps
- For notes: Extract key information and add relevant tags
- For reflections: Acknowledge the emotional/personal aspect
- Use language that's encouraging and neurodivergent-friendly
- Priority should reflect urgency and importance for actions

Examples:
- "I need to call the dentist tomorrow" → ACTION (medium priority)
- "Interesting article about productivity methods" → NOTE (with tags)
- "Feeling overwhelmed with work lately" → REFLECTION

Respond ONLY with valid JSON, no additional text.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { content, type, user_id }: ProcessRequest = await req.json()

    if (!content || !type || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: content, type, and user_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create the processing prompt
    const prompt = createProcessingPrompt(content, type);

    // Call Gemini API
    const geminiResponse = await callGeminiAPI(prompt);

    // Parse the JSON response from Gemini
    let parsedResponse: ProcessResult;
    try {
      // Clean up the response in case Gemini adds extra formatting
      const cleanedResponse = geminiResponse.replace(/```json\n?|\n?```/g, '').trim();
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      console.error('Raw response:', geminiResponse);
      
      // Fallback response if JSON parsing fails
      parsedResponse = {
        category: 'note',
        title: 'Brain Dump Entry',
        summary: content.length > 100 ? content.substring(0, 100) + '...' : content,
        tags: ['unprocessed']
      };
    }

    // Validate the response structure
    if (!parsedResponse.category || !parsedResponse.title || !parsedResponse.summary) {
      throw new Error('Invalid response structure from AI');
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in process-brain-dump function:', error);
    
    // Return a gentle fallback response
    const fallbackResponse: ProcessResult = {
      category: 'note',
      title: 'Captured Thought',
      summary: 'Your thought has been captured and will be processed when possible.',
      tags: ['pending']
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