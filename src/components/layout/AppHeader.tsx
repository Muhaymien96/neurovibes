import React from 'react';
import { User } from '@supabase/supabase-js';
import { Brain, Sparkles, User as UserIcon, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store';

type ActiveTab = 'focus' | 'tasks' | 'mood' | 'braindump' | 'profile';
type ContentPage = 'features' | 'pricing' | 'help' | 'contact' | 'privacy';

interface AppHeaderProps {
  activeTab?: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
  user?: User | null;
  isAuthenticated: boolean;
  onPageNavigation?: (page: ContentPage) => void;
  onAuthModal?: (mode: 'signin' | 'signup') => void;
  onBackToApp?: () => void;
  showBackButton?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeTab,
  setActiveTab,
  user,
  isAuthenticated,
  onPageNavigation,
  onAuthModal,
  onBackToApp,
  showBackButton = false
}) => {
  const { signOut } = useAuthStore();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-indigo-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and App Name */}
          <button
            onClick={onBackToApp}
            className="flex items-center space-x-3"
            aria-label="Go to MindMesh home"
          >
            <div className="relative">
              <Brain className="h-8 w-8 text-indigo-600" />
              <Sparkles className="h-4 w-4 text-purple-500 absolute -top-1 -right-1" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                MindMesh
              </h1>
              <p className="text-xs text-gray-500 -mt-1">AI Copilot for Focus</p>
            </div>
          </button>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => setActiveTab?.('focus')}
                  className={`transition-colors font-medium ${
                    activeTab === 'focus' ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  Focus Mode
                </button>
                <button
                  onClick={() => setActiveTab?.('braindump')}
                  className={`transition-colors font-medium ${
                    activeTab === 'braindump' ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  Brain Dump
                </button>
                <button
                  onClick={() => setActiveTab?.('tasks')}
                  className={`transition-colors font-medium ${
                    activeTab === 'tasks' ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  Tasks
                </button>
                <button
                  onClick={() => setActiveTab?.('mood')}
                  className={`transition-colors font-medium ${
                    activeTab === 'mood' ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  Mood
                </button>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setActiveTab?.('profile')}
                    className={`flex items-center space-x-1 transition-colors ${
                      activeTab === 'profile' ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'
                    }`}
                    aria-label="Profile and settings"
                  >
                    <UserIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
                    aria-label="Sign out of MindMesh"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                {showBackButton ? (
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">{user?.email}</span>
                    <button
                      onClick={onBackToApp}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      Back to App
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => onPageNavigation?.('features')}
                      className="text-gray-600 hover:text-indigo-600 transition-colors font-medium"
                    >
                      Features
                    </button>
                    <button
                      onClick={() => onPageNavigation?.('pricing')}
                      className="text-gray-600 hover:text-indigo-600 transition-colors font-medium"
                    >
                      Pricing
                    </button>
                    <button
                      onClick={() => onAuthModal?.('signin')}
                      className="text-gray-600 hover:text-indigo-600 transition-colors font-medium"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => onAuthModal?.('signup')}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      Get Started
                    </button>
                  </>
                )}
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Open mobile menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};