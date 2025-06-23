import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

interface DisconnectRequest {
  user_id: string;
  integration_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, integration_id }: DisconnectRequest = await req.json()

    if (!user_id || !integration_id) {
      return new Response(
        JSON.stringify({ error: 'user_id and integration_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Deactivate the integration
    const { error: updateError } = await supabase
      .from('user_integrations')
      .update({ is_active: false })
      .eq('id', integration_id)
      .eq('user_id', user_id);

    if (updateError) {
      console.error('Database error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to disconnect integration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Also remove sync mappings for this integration
    const { error: mappingError } = await supabase
      .from('sync_mappings')
      .delete()
      .eq('user_id', user_id)
      .in('integration_type', ['google_calendar', 'notion']); // Clean up mappings

    if (mappingError) {
      console.warn('Warning: Failed to clean up sync mappings:', mappingError);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in disconnect-integration function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})