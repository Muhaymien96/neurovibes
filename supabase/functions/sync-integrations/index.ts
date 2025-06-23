import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

interface SyncRequest {
  user_id: string;
  integration_type?: 'google_calendar' | 'notion' | 'all';
  direction?: 'import' | 'export' | 'bidirectional';
}

async function syncGoogleCalendar(integration: any, direction: string) {
  const results = { imported: 0, exported: 0, errors: [] };

  try {
    // Get calendar events from Google Calendar API
    if (direction === 'import' || direction === 'bidirectional') {
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const eventsResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${now.toISOString()}&timeMax=${oneWeekFromNow.toISOString()}&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${integration.access_token}`,
          },
        }
      );

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        
        for (const event of eventsData.items || []) {
          // Skip all-day events or events without start time
          if (!event.start?.dateTime) continue;

          // Check if this event is already synced
          const { data: existingMapping } = await supabase
            .from('sync_mappings')
            .select('id')
            .eq('user_id', integration.user_id)
            .eq('external_id', event.id)
            .eq('integration_type', 'google_calendar')
            .single();

          if (!existingMapping) {
            // Create new task from calendar event
            const { data: newTask, error: taskError } = await supabase
              .from('tasks')
              .insert({
                user_id: integration.user_id,
                title: event.summary || 'Calendar Event',
                description: event.description || `Calendar event: ${event.summary}`,
                due_date: event.start.dateTime,
                priority: 'medium',
                status: 'pending',
              })
              .select()
              .single();

            if (newTask && !taskError) {
              // Create sync mapping
              await supabase
                .from('sync_mappings')
                .insert({
                  user_id: integration.user_id,
                  mindmesh_task_id: newTask.id,
                  external_id: event.id,
                  integration_type: 'google_calendar',
                  sync_direction: 'import',
                });

              results.imported++;
            } else {
              results.errors.push(`Failed to create task for event: ${event.summary}`);
            }
          }
        }
      }
    }

    // Export completed tasks to Google Calendar
    if (direction === 'export' || direction === 'bidirectional') {
      const { data: completedTasks } = await supabase
        .from('tasks')
        .select('*, sync_mappings!inner(*)')
        .eq('user_id', integration.user_id)
        .eq('status', 'completed')
        .eq('sync_mappings.integration_type', 'google_calendar')
        .gte('completed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      for (const task of completedTasks || []) {
        // Update the calendar event to mark as completed (add to description)
        const eventId = task.sync_mappings[0]?.external_id;
        if (eventId) {
          try {
            await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
              {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${integration.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  description: `${task.description || ''}\n\n✅ Completed in MindMesh on ${new Date(task.completed_at).toLocaleDateString()}`,
                }),
              }
            );
            results.exported++;
          } catch (error) {
            results.errors.push(`Failed to update calendar event for task: ${task.title}`);
          }
        }
      }
    }

  } catch (error) {
    results.errors.push(`Google Calendar sync error: ${error.message}`);
  }

  return results;
}

async function syncNotion(integration: any, direction: string) {
  const results = { imported: 0, exported: 0, errors: [] };

  try {
    // Import tasks from Notion databases
    if (direction === 'import' || direction === 'bidirectional') {
      // First, search for databases that might contain tasks
      const searchResponse = await fetch('https://api.notion.com/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          filter: {
            value: 'database',
            property: 'object',
          },
        }),
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        
        for (const database of searchData.results || []) {
          // Look for databases that might contain tasks (check for title and status properties)
          const hasTitle = Object.values(database.properties || {}).some((prop: any) => 
            prop.type === 'title'
          );
          const hasStatus = Object.values(database.properties || {}).some((prop: any) => 
            prop.type === 'status' || prop.type === 'select'
          );

          if (hasTitle && hasStatus) {
            // Query this database for tasks
            const queryResponse = await fetch(`https://api.notion.com/v1/databases/${database.id}/query`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${integration.access_token}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28',
              },
              body: JSON.stringify({
                page_size: 50,
              }),
            });

            if (queryResponse.ok) {
              const queryData = await queryResponse.json();
              
              for (const page of queryData.results || []) {
                // Check if this page is already synced
                const { data: existingMapping } = await supabase
                  .from('sync_mappings')
                  .select('id')
                  .eq('user_id', integration.user_id)
                  .eq('external_id', page.id)
                  .eq('integration_type', 'notion')
                  .single();

                if (!existingMapping) {
                  // Extract task information from Notion page
                  const titleProp = Object.values(page.properties || {}).find((prop: any) => prop.type === 'title');
                  const statusProp = Object.values(page.properties || {}).find((prop: any) => 
                    prop.type === 'status' || prop.type === 'select'
                  );

                  const title = titleProp?.title?.[0]?.plain_text || 'Notion Task';
                  const status = statusProp?.status?.name || statusProp?.select?.name || 'pending';

                  // Map Notion status to MindMesh status
                  let mindmeshStatus = 'pending';
                  if (status.toLowerCase().includes('done') || status.toLowerCase().includes('complete')) {
                    mindmeshStatus = 'completed';
                  } else if (status.toLowerCase().includes('progress') || status.toLowerCase().includes('doing')) {
                    mindmeshStatus = 'in_progress';
                  }

                  // Create new task from Notion page
                  const { data: newTask, error: taskError } = await supabase
                    .from('tasks')
                    .insert({
                      user_id: integration.user_id,
                      title,
                      description: `Imported from Notion: ${database.title?.[0]?.plain_text || 'Database'}`,
                      status: mindmeshStatus,
                      priority: 'medium',
                    })
                    .select()
                    .single();

                  if (newTask && !taskError) {
                    // Create sync mapping
                    await supabase
                      .from('sync_mappings')
                      .insert({
                        user_id: integration.user_id,
                        mindmesh_task_id: newTask.id,
                        external_id: page.id,
                        integration_type: 'notion',
                        sync_direction: 'import',
                      });

                    results.imported++;
                  }
                }
              }
            }
          }
        }
      }
    }

    // Export completed tasks back to Notion (update status)
    if (direction === 'export' || direction === 'bidirectional') {
      const { data: completedTasks } = await supabase
        .from('tasks')
        .select('*, sync_mappings!inner(*)')
        .eq('user_id', integration.user_id)
        .eq('status', 'completed')
        .eq('sync_mappings.integration_type', 'notion')
        .gte('completed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      for (const task of completedTasks || []) {
        const pageId = task.sync_mappings[0]?.external_id;
        if (pageId) {
          try {
            // Get the page to understand its structure
            const pageResponse = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
              headers: {
                'Authorization': `Bearer ${integration.access_token}`,
                'Notion-Version': '2022-06-28',
              },
            });

            if (pageResponse.ok) {
              const pageData = await pageResponse.json();
              
              // Find status property and update it
              const statusPropKey = Object.keys(pageData.properties || {}).find(key => {
                const prop = pageData.properties[key];
                return prop.type === 'status' || prop.type === 'select';
              });

              if (statusPropKey) {
                const updateBody: any = {
                  properties: {},
                };

                const statusProp = pageData.properties[statusPropKey];
                if (statusProp.type === 'status') {
                  updateBody.properties[statusPropKey] = {
                    status: { name: 'Done' }
                  };
                } else if (statusProp.type === 'select') {
                  updateBody.properties[statusPropKey] = {
                    select: { name: 'Done' }
                  };
                }

                await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
                  method: 'PATCH',
                  headers: {
                    'Authorization': `Bearer ${integration.access_token}`,
                    'Content-Type': 'application/json',
                    'Notion-Version': '2022-06-28',
                  },
                  body: JSON.stringify(updateBody),
                });

                results.exported++;
              }
            }
          } catch (error) {
            results.errors.push(`Failed to update Notion page for task: ${task.title}`);
          }
        }
      }
    }

  } catch (error) {
    results.errors.push(`Notion sync error: ${error.message}`);
  }

  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, integration_type = 'all', direction = 'bidirectional' }: SyncRequest = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's active integrations
    let query = supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true);

    if (integration_type !== 'all') {
      query = query.eq('integration_type', integration_type);
    }

    const { data: integrations, error } = await query;

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch integrations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const syncResults: any = {
      total_imported: 0,
      total_exported: 0,
      integrations: {},
      errors: [],
    };

    // Sync each integration
    for (const integration of integrations || []) {
      let results;

      if (integration.integration_type === 'google_calendar') {
        results = await syncGoogleCalendar(integration, direction);
      } else if (integration.integration_type === 'notion') {
        results = await syncNotion(integration, direction);
      }

      if (results) {
        syncResults.integrations[integration.integration_type] = results;
        syncResults.total_imported += results.imported;
        syncResults.total_exported += results.exported;
        syncResults.errors.push(...results.errors);

        // Update last sync time
        await supabase
          .from('user_integrations')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', integration.id);
      }
    }

    return new Response(
      JSON.stringify(syncResults),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in sync-integrations function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})