import React, { useState } from 'react';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';
import { HeroSection } from '../sections/HeroSection';
import { FeaturesSection } from '../sections/FeaturesSection';
import { ContentPages } from '../ContentPages';
import { AuthModal } from '../AuthModal';

type ContentPage = 'features' | 'pricing' | 'integrations' | 'help' | 'contact' | 'privacy';

export const PublicApp: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<ContentPage | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handlePageNavigation = (page: ContentPage) => {
    setCurrentPage(page);
  };

  const handleBackToApp = () => {
    setCurrentPage(null);
  };

  // Render content pages
  if (currentPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
        <AppHeader 
          isAuthenticated={false}
          onPageNavigation={handlePageNavigation}
          onAuthModal={openAuthModal}
          onBackToApp={handleBackToApp}
          showBackButton={true}
        />
        
        <main className="flex-grow py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ContentPages page={currentPage} />
          </div>
        </main>

        <AppFooter onPageNavigation={handlePageNavigation} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
      <AppHeader 
        isAuthenticated={false}
        onPageNavigation={handlePageNavigation}
        onAuthModal={openAuthModal}
      />
      
      <main className="flex-grow">
        <HeroSection onAuthModal={openAuthModal} />
        <FeaturesSection />
      </main>
      
      <AppFooter onPageNavigation={handlePageNavigation} />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
};