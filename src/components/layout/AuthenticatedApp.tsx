import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';
import { MainContent } from './MainContent';
import { CalmingTools } from '../CalmingTools';
import { AuthModal } from '../AuthModal';
import { NotificationCenter } from '../NotificationCenter';
import { useSettingsStore, useMoodStore, useProfileStore } from '../../store';

type ActiveTab = 'focus' | 'tasks' | 'mood' | 'braindump' | 'profile' | 'calming';

interface AuthenticatedAppProps {
  user: User | null;
}

export const AuthenticatedApp: React.FC<AuthenticatedAppProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('focus');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showCalmingModal, setShowCalmingModal] = useState(false);
  
  const { appearance } = useSettingsStore();
  const { entries: moodEntries } = useMoodStore();
  const { profile } = useProfileStore();

  // Apply global styles based on settings, mood, and neurodivergent type
  useEffect(() => {
    const root = document.documentElement;
    
    // Text size
    const textSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '20px'
    };
    root.style.setProperty('--text-size', textSizeMap[appearance.text_size]);
    
    // Line spacing
    const lineSpacingMap = {
      normal: '1.5',
      wide: '1.8'
    };
    root.style.setProperty('--line-height', lineSpacingMap[appearance.line_spacing]);
    
    // Font preference
    if (appearance.font_preference === 'dyslexia_friendly') {
      root.style.fontFamily = 'OpenDyslexic, Arial, sans-serif';
    } else {
      root.style.fontFamily = 'Inter, system-ui, sans-serif';
    }
    
    // Clear all existing classes
    root.classList.remove(
      'high-contrast', 'reduce-motion', 'minimalist', 'colorblind-friendly',
      'animation-slow', 'animation-fast', 'dark-palette', 'low-sensory-palette',
      'nd-adhd', 'nd-autism', 'nd-anxiety', 'nd-multiple',
      'mood-theme-energetic', 'mood-theme-calm', 'mood-theme-focused', 
      'mood-theme-low-energy', 'mood-theme-stressed'
    );
    
    // Apply neurodivergent-specific styling
    if (profile?.neurodivergent_type && profile.neurodivergent_type !== 'none') {
      root.classList.add(`nd-${profile.neurodivergent_type}`);
    }
    
    // High contrast mode
    if (appearance.high_contrast_mode) {
      root.classList.add('high-contrast');
    }
    
    // Reduced motion
    if (appearance.reduced_motion) {
      root.classList.add('reduce-motion');
    }
    
    // Minimalist mode
    if (appearance.minimalist_mode) {
      root.classList.add('minimalist');
    }
    
    // Colorblind mode
    if (appearance.colorblind_mode) {
      root.classList.add('colorblind-friendly');
    }

    // Animation speed
    if (appearance.animation_speed === 'slow') {
      root.classList.add('animation-slow');
    } else if (appearance.animation_speed === 'fast') {
      root.classList.add('animation-fast');
    }

    // Check for dark mode preference or low sensory mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark || appearance.minimalist_mode) {
      root.classList.add('low-sensory-palette');
    }

    // Mood-responsive colors
    if (appearance.mood_responsive_colors && moodEntries.length > 0) {
      const latestMood = moodEntries[0];
      const avgMood = (latestMood.mood_score + latestMood.energy_level + latestMood.focus_level) / 3;
      
      // Apply mood-based theme
      if (latestMood.energy_level >= 8 && latestMood.mood_score >= 7) {
        root.classList.add('mood-theme-energetic');
      } else if (latestMood.focus_level >= 8) {
        root.classList.add('mood-theme-focused');
      } else if (avgMood >= 6 && latestMood.mood_score >= 6) {
        root.classList.add('mood-theme-calm');
      } else if (latestMood.energy_level <= 3 || avgMood <= 4) {
        root.classList.add('mood-theme-low-energy');
      } else if (latestMood.mood_score <= 3) {
        root.classList.add('mood-theme-stressed');
      }
    }
  }, [appearance, moodEntries, profile]);

  const renderMainContent = () => {
    if (activeTab === 'calming') {
      return <CalmingTools />;
    }
    return <MainContent activeTab={activeTab} user={user} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
      <AppHeader 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        isAuthenticated={true}
      />
      
      {/* Floating Calming Tools Button */}
      <button
        onClick={() => setShowCalmingModal(true)}
        className="fixed bottom-6 right-6 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-colors z-40"
        title="Open calming tools"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      {/* Notification Center */}
      <NotificationCenter />

      {/* Calming Tools Modal */}
      {showCalmingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Calming Tools</h2>
              <button
                onClick={() => setShowCalmingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <CalmingTools />
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderMainContent()}
        </div>
      </div>
      
      <AppFooter />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
};