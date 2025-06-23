const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TTSRequest {
  text: string;
  voice_id?: string;
  model_id?: string;
}

// Helper function to convert ArrayBuffer to base64 without stack overflow
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192; // Process in chunks to avoid stack overflow
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('TTS function called');
    
    const requestBody = await req.json().catch(err => {
      console.error('Failed to parse request JSON:', err);
      throw new Error('Invalid JSON in request body');
    });
    
    const { text, voice_id = 'EXAVITQu4vr4xnSDxMaL', model_id = 'eleven_monolingual_v1' }: TTSRequest = requestBody;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.error('Invalid text provided:', text);
      return new Response(
        JSON.stringify({ error: 'Valid text is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get API key from environment variables
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_KEY');
    
    if (!ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_KEY environment variable not found');
      console.log('Available environment variables:', Object.keys(Deno.env.toObject()));
      return new Response(
        JSON.stringify({ 
          error: 'TTS service not configured',
          details: 'ELEVENLABS_KEY environment variable is missing. Please add it to your Supabase project secrets.'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Making TTS request for text length:', text.length, 'characters');
    console.log('Using voice_id:', voice_id);
    console.log('Using model_id:', model_id);

    const requestPayload = {
      text: text.trim(),
      model_id: model_id,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
      }
    };

    console.log('Request payload:', JSON.stringify(requestPayload, null, 2));

    // Call ElevenLabs TTS API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
          },
          body: JSON.stringify(requestPayload),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      console.log('ElevenLabs API response status:', response.status);
      console.log('ElevenLabs API response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
        console.error('Error response body:', errorText);
        
        let errorMessage = `TTS API error: ${response.status} ${response.statusText}`;
        
        // Provide more specific error messages based on status code
        switch (response.status) {
          case 401:
            errorMessage = 'Invalid ElevenLabs API key. Please check your ELEVENLABS_KEY secret.';
            break;
          case 429:
            errorMessage = 'ElevenLabs API rate limit exceeded. Please try again later.';
            break;
          case 400:
            errorMessage = 'Invalid request to ElevenLabs API. Check voice_id and text parameters.';
            break;
          case 422:
            errorMessage = 'ElevenLabs API validation error. The text or voice settings may be invalid.';
            break;
        }
        
        return new Response(
          JSON.stringify({ 
            error: errorMessage,
            status: response.status,
            details: errorText
          }),
          { 
            status: response.status >= 500 ? 500 : 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Get the audio data
      const audioBuffer = await response.arrayBuffer();
      console.log('Received audio buffer of size:', audioBuffer.byteLength, 'bytes');
      
      if (audioBuffer.byteLength === 0) {
        throw new Error('Received empty audio buffer from ElevenLabs API');
      }
      
      // Convert to base64 using the safe method
      const base64Audio = arrayBufferToBase64(audioBuffer);
      console.log('Converted to base64, length:', base64Audio.length);

      return new Response(
        JSON.stringify({ 
          audio_base64: base64Audio,
          content_type: 'audio/mpeg',
          size: audioBuffer.byteLength
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('ElevenLabs API request timed out');
        return new Response(
          JSON.stringify({ 
            error: 'Request timed out',
            details: 'The ElevenLabs API request took too long to complete'
          }),
          { 
            status: 408, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      throw fetchError; // Re-throw other fetch errors
    }

  } catch (error) {
    console.error('Error in text-to-speech function:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate speech',
        details: error.message || 'Unknown error occurred',
        type: error.name || 'UnknownError'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})