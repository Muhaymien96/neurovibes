import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Save, 
  Edit3,
  Eye,
  EyeOff,
  Trash2,
  Download,
  Upload
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProfile, updateProfile, Profile } from '../lib/supabase';

interface NotificationSettings {
  email_reminders: boolean;
  push_notifications: boolean;
  smart_reminders: boolean;
  task_deadlines: boolean;
  mood_check_ins: boolean;
}

interface PrivacySettings {
  data_sharing: boolean;
  analytics: boolean;
  personalization: boolean;
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto';
  color_scheme: 'indigo' | 'purple' | 'blue' | 'green';
  compact_mode: boolean;
}

export const ProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy' | 'appearance' | 'data'>('profile');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_reminders: true,
    push_notifications: true,
    smart_reminders: true,
    task_deadlines: true,
    mood_check_ins: false,
  });

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    data_sharing: false,
    analytics: true,
    personalization: true,
  });

  const [appearance, setAppearance] = useState<AppearanceSettings>({
    theme: 'light',
    color_scheme: 'indigo',
    compact_mode: false,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data, error } = await getProfile();
      if (error) throw error;
      
      if (data) {
        setProfile(data);
        setProfileData({
          full_name: data.full_name || '',
          email: data.email || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data, error } = await updateProfile(profileData);
      if (error) throw error;
      
      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = () => {
    // In a real app, this would trigger a data export
    alert('Data export will be sent to your email within 24 hours.');
  };

  const handleDeleteAccount = () => {
    // In a real app, this would trigger account deletion
    alert('Account deletion requested. You will receive a confirmation email.');
    setShowDeleteConfirm(false);
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
      <div>
        <h3 className="text-2xl font-bold text-gray-900">Profile & Settings</h3>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'privacy', label: 'Privacy', icon: Shield },
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'data', label: 'Data', icon: Download },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900">Profile Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900">Notification Preferences</h4>
            
            <div className="space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-sm text-gray-600">
                      {key === 'email_reminders' && 'Receive reminder emails for important tasks'}
                      {key === 'push_notifications' && 'Get browser notifications for urgent items'}
                      {key === 'smart_reminders' && 'AI-powered contextual reminders'}
                      {key === 'task_deadlines' && 'Notifications for approaching deadlines'}
                      {key === 'mood_check_ins' && 'Gentle reminders to log your mood'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900">Privacy Settings</h4>
            
            <div className="space-y-4">
              {Object.entries(privacy).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-sm text-gray-600">
                      {key === 'data_sharing' && 'Share anonymized data to improve MindMesh for everyone'}
                      {key === 'analytics' && 'Allow usage analytics to help us improve the app'}
                      {key === 'personalization' && 'Use your data to provide personalized experiences'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setPrivacy({ ...privacy, [key]: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900">Appearance Settings</h4>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {['light', 'dark', 'auto'].map((theme) => (
                    <button
                      key={theme}
                      onClick={() => setAppearance({ ...appearance, theme: theme as any })}
                      className={`p-3 border rounded-lg text-center capitalize ${
                        appearance.theme === theme
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Color Scheme</label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { name: 'indigo', color: 'bg-indigo-500' },
                    { name: 'purple', color: 'bg-purple-500' },
                    { name: 'blue', color: 'bg-blue-500' },
                    { name: 'green', color: 'bg-green-500' },
                  ].map(({ name, color }) => (
                    <button
                      key={name}
                      onClick={() => setAppearance({ ...appearance, color_scheme: name as any })}
                      className={`p-3 border rounded-lg flex items-center justify-center ${
                        appearance.color_scheme === name
                          ? 'border-gray-800 ring-2 ring-gray-300'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full ${color}`}></div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Compact Mode</p>
                  <p className="text-sm text-gray-600">Use a more compact layout to fit more content</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appearance.compact_mode}
                    onChange={(e) => setAppearance({ ...appearance, compact_mode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900">Data Management</h4>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900">Export Your Data</h5>
                    <p className="text-sm text-gray-600">Download a copy of all your MindMesh data</p>
                  </div>
                  <button
                    onClick={handleExportData}
                    className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Data</span>
                  </button>
                </div>
              </div>

              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-red-900">Delete Account</h5>
                    <p className="text-sm text-red-700">Permanently delete your account and all associated data</p>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Account</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Account</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteAccount}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Account
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};