import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize RevenueCat early
import { revenueCatService } from './lib/revenuecat';

// Initialize RevenueCat if API key is available
if (import.meta.env.VITE_REVENUECAT_API_KEY) {
  revenueCatService.initialize().catch(console.error);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);