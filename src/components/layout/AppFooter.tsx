import React from 'react';
import { Brain, Heart } from 'lucide-react';

type ContentPage = 'features' | 'pricing' | 'help' | 'contact' | 'privacy';

interface AppFooterProps {
  onPageNavigation?: (page: ContentPage) => void;
}

export const AppFooter: React.FC<AppFooterProps> = ({ onPageNavigation }) => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <Brain className="h-6 w-6 text-indigo-400" />
              <span className="text-xl font-bold">MindMesh</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Empowering neurodivergent minds with AI-powered focus and task management. 
              Built with compassion, designed for real brains.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">X (formerly Twitter)</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <button  
                  onClick={() => onPageNavigation?.('features')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Features
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onPageNavigation?.('pricing')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Pricing
                </button>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => onPageNavigation?.('help')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Help Center
                </button>
              </li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Community</a></li>
              <li>
                <button 
                  onClick={() => onPageNavigation?.('contact')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Contact
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onPageNavigation?.('privacy')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Privacy
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-gray-400">
            © 2025 MindMesh. Made with <Heart className="inline h-4 w-4 text-red-500" /> for neurodivergent minds.
          </p>
        </div>
      </div>
    </footer>
  );
};