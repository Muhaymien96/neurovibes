import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  FileText, 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Trash2,
  Clock,
  Download,
  Upload,
  ArrowLeftRight,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface Integration {
  id: string;
  integration_type: 'google_calendar' | 'notion';
  is_active: boolean;
  last_sync_at: string | null;
  integration_data: any;
  sync_rules: any;
  created_at: string;
}

interface SyncResult {
  total_imported: number;
  total_exported: number;
  integrations: {
    [key: string]: {
      imported: number;
      exported: number;
      errors: string[];
    };
  };
  errors: string[];
}

interface SyncRule {
  import_enabled: boolean;
  export_enabled: boolean;
  import_filters: {
    calendar_ids?: string[];
    database_ids?: string[];
    tags?: string[];
    priority_filter?: 'all' | 'high' | 'medium' | 'low';
  };
  export_filters: {
    tags?: string[];
    priority_filter?: 'all' | 'high' | 'medium' | 'low';
    status_filter?: string[];
  };
}

export const IntegrationsManager: React.FC = () => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingRules, setEditingRules] = useState<string | null>(null);
  const [tempRules, setTempRules] = useState<SyncRule | null>(null);

  useEffect(() => {
    if (user) {
      loadIntegrations();
    }
  }, [user]);

  const loadIntegrations = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-integrations`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: user?.id }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations || []);
      }
    } catch (err) {
      console.error('Error loading integrations:', err);
      setError('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const connectGoogleCalendar = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-auth`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'get_auth_url' }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('mindmesh_user_id', user?.id || '');
        window.open(data.auth_url, '_blank', 'width=500,height=600');
      }
    } catch (err) {
      console.error('Error connecting Google Calendar:', err);
      setError('Failed to connect Google Calendar');
    }
  };

  const connectNotion = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notion-auth`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'get_auth_url' }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('mindmesh_user_id', user?.id || '');
        window.open(data.auth_url, '_blank', 'width=500,height=600');
      }
    } catch (err) {
      console.error('Error connecting Notion:', err);
      setError('Failed to connect Notion');
    }
  };

  const syncIntegrations = async (integrationType?: string) => {
    setSyncing(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-integrations`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user?.id,
            integration_type: integrationType || 'all',
            direction: 'bidirectional',
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setLastSyncResult(result);
        loadIntegrations();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Sync failed');
      }
    } catch (err) {
      console.error('Error syncing integrations:', err);
      setError('Failed to sync integrations');
    } finally {
      setSyncing(false);
    }
  };

  const disconnectIntegration = async (integrationId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/disconnect-integration`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user?.id,
            integration_id: integrationId,
          }),
        }
      );

      if (response.ok) {
        loadIntegrations();
      }
    } catch (err) {
      console.error('Error disconnecting integration:', err);
      setError('Failed to disconnect integration');
    }
  };

  const updateSyncRules = async (integrationId: string, rules: SyncRule) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-sync-rules`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user?.id,
            integration_id: integrationId,
            sync_rules: rules,
          }),
        }
      );

      if (response.ok) {
        loadIntegrations();
        setEditingRules(null);
        setTempRules(null);
      }
    } catch (err) {
      console.error('Error updating sync rules:', err);
      setError('Failed to update sync rules');
    }
  };

  const startEditingRules = (integration: Integration) => {
    setEditingRules(integration.id);
    setTempRules(integration.sync_rules || {
      import_enabled: true,
      export_enabled: true,
      import_filters: {},
      export_filters: {},
    });
  };

  const cancelEditingRules = () => {
    setEditingRules(null);
    setTempRules(null);
  };

  const saveRules = () => {
    if (editingRules && tempRules) {
      updateSyncRules(editingRules, tempRules);
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'google_calendar':
        return <Calendar className="h-6 w-6 text-blue-600" />;
      case 'notion':
        return <FileText className="h-6 w-6 text-gray-800" />;
      default:
        return <Settings className="h-6 w-6 text-gray-600" />;
    }
  };

  const getIntegrationName = (type: string) => {
    switch (type) {
      case 'google_calendar':
        return 'Google Calendar';
      case 'notion':
        return 'Notion';
      default:
        return type;
    }
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Never';
    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const renderSyncRulesEditor = (integration: Integration) => {
    if (editingRules !== integration.id || !tempRules) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h5 className="font-medium text-gray-900">Sync Rules</h5>
          <div className="flex space-x-2">
            <button
              onClick={saveRules}
              className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              <Save className="h-3 w-3" />
              <span>Save</span>
            </button>
            <button
              onClick={cancelEditingRules}
              className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
            >
              <X className="h-3 w-3" />
              <span>Cancel</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Import Settings */}
          <div className="space-y-3">
            <h6 className="font-medium text-gray-800 flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Import Settings</span>
            </h6>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={tempRules.import_enabled}
                onChange={(e) => setTempRules({
                  ...tempRules,
                  import_enabled: e.target.checked
                })}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Enable import</span>
            </label>

            {tempRules.import_enabled && (
              <div className="space-y-2 ml-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Priority Filter
                  </label>
                  <select
                    value={tempRules.import_filters.priority_filter || 'all'}
                    onChange={(e) => setTempRules({
                      ...tempRules,
                      import_filters: {
                        ...tempRules.import_filters,
                        priority_filter: e.target.value as any
                      }
                    })}
                    className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                  >
                    <option value="all">All priorities</option>
                    <option value="high">High priority only</option>
                    <option value="medium">Medium priority and above</option>
                    <option value="low">Low priority and above</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Export Settings */}
          <div className="space-y-3">
            <h6 className="font-medium text-gray-800 flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Export Settings</span>
            </h6>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={tempRules.export_enabled}
                onChange={(e) => setTempRules({
                  ...tempRules,
                  export_enabled: e.target.checked
                })}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Enable export</span>
            </label>

            {tempRules.export_enabled && (
              <div className="space-y-2 ml-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Priority Filter
                  </label>
                  <select
                    value={tempRules.export_filters.priority_filter || 'all'}
                    onChange={(e) => setTempRules({
                      ...tempRules,
                      export_filters: {
                        ...tempRules.export_filters,
                        priority_filter: e.target.value as any
                      }
                    })}
                    className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                  >
                    <option value="all">All priorities</option>
                    <option value="high">High priority only</option>
                    <option value="medium">Medium priority and above</option>
                    <option value="low">Low priority and above</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Status Filter
                  </label>
                  <select
                    value={tempRules.export_filters.status_filter?.[0] || 'all'}
                    onChange={(e) => setTempRules({
                      ...tempRules,
                      export_filters: {
                        ...tempRules.export_filters,
                        status_filter: e.target.value === 'all' ? [] : [e.target.value]
                      }
                    })}
                    className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                  >
                    <option value="all">All statuses</option>
                    <option value="completed">Completed only</option>
                    <option value="in_progress">In progress only</option>
                    <option value="pending">Pending only</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Integrations</h3>
          <p className="text-gray-600 mt-1">
            Connect your calendar and task management tools for seamless sync
          </p>
        </div>
        
        <button
          onClick={() => syncIntegrations()}
          disabled={syncing || integrations.length === 0}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Syncing...' : 'Sync All'}</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Last Sync Results */}
      {lastSyncResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">Last Sync Results</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Download className="h-4 w-4 text-green-600" />
              <span className="text-green-800">
                {lastSyncResult.total_imported} tasks imported
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Upload className="h-4 w-4 text-green-600" />
              <span className="text-green-800">
                {lastSyncResult.total_exported} tasks exported
              </span>
            </div>
          </div>
          
          {lastSyncResult.errors.length > 0 && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-sm font-medium text-red-700 mb-1">Errors:</p>
              <ul className="text-sm text-red-600 space-y-1">
                {lastSyncResult.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Available Integrations */}
      <div className="grid gap-6">
        {/* Google Calendar */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getIntegrationIcon('google_calendar')}
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Google Calendar</h4>
                <p className="text-gray-600 text-sm">
                  Sync calendar events as tasks and update event status when tasks are completed
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {integrations.find(i => i.integration_type === 'google_calendar') ? (
                <>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Connected</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Last sync: {formatLastSync(
                        integrations.find(i => i.integration_type === 'google_calendar')?.last_sync_at || null
                      )}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      const integration = integrations.find(i => i.integration_type === 'google_calendar');
                      if (integration) startEditingRules(integration);
                    }}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Configure sync rules"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => syncIntegrations('google_calendar')}
                    disabled={syncing}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Sync Google Calendar"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => {
                      const integration = integrations.find(i => i.integration_type === 'google_calendar');
                      if (integration) disconnectIntegration(integration.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Disconnect"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={connectGoogleCalendar}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Connect</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Render sync rules editor for Google Calendar */}
          {integrations.find(i => i.integration_type === 'google_calendar') && 
           renderSyncRulesEditor(integrations.find(i => i.integration_type === 'google_calendar')!)}
        </div>

        {/* Notion */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getIntegrationIcon('notion')}
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Notion</h4>
                <p className="text-gray-600 text-sm">
                  Import tasks from Notion databases and sync completion status back to Notion
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {integrations.find(i => i.integration_type === 'notion') ? (
                <>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Connected</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Last sync: {formatLastSync(
                        integrations.find(i => i.integration_type === 'notion')?.last_sync_at || null
                      )}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      const integration = integrations.find(i => i.integration_type === 'notion');
                      if (integration) startEditingRules(integration);
                    }}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Configure sync rules"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => syncIntegrations('notion')}
                    disabled={syncing}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Sync Notion"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => {
                      const integration = integrations.find(i => i.integration_type === 'notion');
                      if (integration) disconnectIntegration(integration.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Disconnect"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={connectNotion}
                  className="flex items-center space-x-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Connect</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Render sync rules editor for Notion */}
          {integrations.find(i => i.integration_type === 'notion') && 
           renderSyncRulesEditor(integrations.find(i => i.integration_type === 'notion')!)}
        </div>
      </div>

      {/* Global Sync Settings */}
      {integrations.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Global Sync Settings</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Auto-sync frequency</p>
                <p className="text-sm text-gray-600">How often to automatically sync your integrations</p>
              </div>
              <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option value="15">Every 15 minutes</option>
                <option value="30">Every 30 minutes</option>
                <option value="60">Every hour</option>
                <option value="manual">Manual only</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Default sync direction</p>
                <p className="text-sm text-gray-600">Default behavior for new integrations</p>
              </div>
              <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option value="bidirectional">Two-way sync</option>
                <option value="import">Import only</option>
                <option value="export">Export only</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      {integrations.length === 0 && (
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No integrations connected</h4>
          <p className="text-gray-600 max-w-md mx-auto">
            Connect your calendar and task management tools to automatically sync tasks and stay organized across all your platforms.
          </p>
        </div>
      )}
    </div>
  );
};