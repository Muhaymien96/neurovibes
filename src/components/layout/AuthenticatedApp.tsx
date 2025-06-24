import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';
import { MainContent } from './MainContent';
import { CalmingTools } from '../CalmingTools';
import { AuthModal } from '../AuthModal';
import { useSettingsStore } from '../../store';

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

  // Apply global styles based on settings
  useEffect(() => {
    const root = document.documentElement;
    
    // Text size
    const textSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '20px'
    };
    root.style.fontSize = textSizeMap[appearance.text_size];
    
    // Line spacing
    const lineSpacingMap = {
      normal: '1.5',
      wide: '1.8'
    };
    root.style.lineHeight = lineSpacingMap[appearance.line_spacing];
    
    // Font preference
    if (appearance.font_preference === 'dyslexia_friendly') {
      root.style.fontFamily = 'OpenDyslexic, Arial, sans-serif';
    } else {
      root.style.fontFamily = 'Inter, system-ui, sans-serif';
    }
    
    // High contrast mode
    if (appearance.high_contrast_mode) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Reduced motion
    if (appearance.reduced_motion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // Minimalist mode
    if (appearance.minimalist_mode) {
      root.classList.add('minimalist');
    } else {
      root.classList.remove('minimalist');
    }
    
    // Colorblind mode
    if (appearance.colorblind_mode) {
      root.classList.add('colorblind-friendly');
    } else {
      root.classList.remove('colorblind-friendly');
    }
  }, [appearance]);

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