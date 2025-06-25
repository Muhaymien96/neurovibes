import React from 'react';
import { Heart } from 'lucide-react';

interface HeroSectionProps {
  onAuthModal: (mode: 'signin' | 'signup') => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onAuthModal }) => {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium mb-8">
            <Heart className="h-4 w-4 mr-2" />
            Powered by Gemini AI & ElevenLabs
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Turn chaos into
            <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              calm, focus & flow
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            MindMesh is the world's first AI Copilot that adapts to your brain's rhythms. 
            Get gentle guidance, smart reminders, and contextual support designed specifically 
            for ADHD, autism, and anxiety.
          </p>

          <div className="flex justify-center">
            <button
              onClick={() => onAuthModal('signup')}
              className="bg-indigo-600 text-white px-8 py-4 rounded-xl hover:bg-indigo-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Start Your Focus Journey
            </button>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-4000"></div>
      </div>
    </section>
  );
};