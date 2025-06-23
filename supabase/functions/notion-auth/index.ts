import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NOTION_CLIENT_ID = Deno.env.get('NOTION_CLIENT_ID');
const NOTION_CLIENT_SECRET = Deno.env.get('NOTION_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

interface AuthRequest {
  action: 'get_auth_url' | 'exchange_code';
  code?: string;
  user_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, code, user_id }: AuthRequest = await req.json()

    if (!NOTION_CLIENT_ID || !NOTION_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Notion OAuth credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    switch (action) {
      case 'get_auth_url': {
        const redirectUri = `${req.headers.get('origin')}/integrations/notion/callback`;
        
        const authUrl = new URL('https://api.notion.com/v1/oauth/authorize');
        authUrl.searchParams.set('client_id', NOTION_CLIENT_ID);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('owner', 'user');

        return new Response(
          JSON.stringify({ auth_url: authUrl.toString() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'exchange_code': {
        if (!code || !user_id) {
          return new Response(
            JSON.stringify({ error: 'Code and user_id are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const redirectUri = `${req.headers.get('origin')}/integrations/notion/callback`;
        
        // Encode credentials for Basic auth
        const credentials = btoa(`${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`);
        
        const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
          }),
        });

        if (!tokenResponse.ok) {
          const error = await tokenResponse.text();
          return new Response(
            JSON.stringify({ error: 'Failed to exchange code for tokens', details: error }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const tokens = await tokenResponse.json();

        // Store integration in database
        const { data, error } = await supabase
          .from('user_integrations')
          .upsert({
            user_id,
            integration_type: 'notion',
            access_token: tokens.access_token,
            is_active: true,
            integration_data: {
              workspace_name: tokens.workspace_name,
              workspace_id: tokens.workspace_id,
              bot_id: tokens.bot_id,
              owner: tokens.owner,
            }
          }, {
            onConflict: 'user_id,integration_type',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (error) {
          console.error('Database error:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to store integration' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, integration: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Error in notion-auth function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})