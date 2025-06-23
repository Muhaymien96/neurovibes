import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
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
  integration_type: 'google_calendar';
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
      // Simplified - just show Google Calendar option
      setIntegrations([]);
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
            Connect your Google Calendar for seamless sync
          </p>
        </div>
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

      {/* Google Calendar Integration */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Calendar className="h-12 w-12 text-blue-600" />
            <div>
              <h4 className="text-xl font-semibold text-gray-900">Google Calendar</h4>
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
      </div>

      {/* Help Text */}
      {integrations.length === 0 && (
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No integrations connected</h4>
          <p className="text-gray-600 max-w-md mx-auto">
            Connect your Google Calendar to automatically sync tasks and stay organized.
          </p>
        </div>
      )}
    </div>
  );
};