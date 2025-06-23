import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

interface BrainDumpEntry {
  id: string;
  content: string;
  type: 'voice' | 'text';
  timestamp: number;
  processed: boolean;
  synced: boolean;
  aiResult?: {
    category: 'action' | 'note' | 'reflection';
    title: string;
    summary: string;
    priority?: 'low' | 'medium' | 'high';
    suggested_actions?: string[];
    tags?: string[];
  };
}

interface SyncRequest {
  entries: BrainDumpEntry[];
  user_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { entries, user_id }: SyncRequest = await req.json()

    if (!entries || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: entries and user_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Store brain dump entries in the database
    const syncResults = {
      synced: 0,
      errors: [] as string[],
    };

    for (const entry of entries) {
      try {
        // Insert or update the brain dump entry
        const { error } = await supabase
          .from('brain_dumps')
          .upsert({
            id: entry.id,
            user_id,
            content: entry.content,
            entry_type: entry.type,
            timestamp: new Date(entry.timestamp).toISOString(),
            processed: entry.processed,
            ai_result: entry.aiResult || null,
            created_at: new Date(entry.timestamp).toISOString(),
          }, {
            onConflict: 'id',
            ignoreDuplicates: false
          });

        if (error) {
          console.error(`Error syncing entry ${entry.id}:`, error);
          syncResults.errors.push(`Failed to sync entry: ${entry.content.substring(0, 50)}...`);
        } else {
          syncResults.synced++;
        }
      } catch (entryError) {
        console.error(`Error processing entry ${entry.id}:`, entryError);
        syncResults.errors.push(`Failed to process entry: ${entry.content.substring(0, 50)}...`);
      }
    }

    return new Response(
      JSON.stringify(syncResults),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in sync-brain-dumps function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to sync brain dumps',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})