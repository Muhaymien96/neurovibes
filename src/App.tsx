import React, { useEffect } from 'react';
import { useAuthStore } from './store';
import { AuthenticatedApp } from './components/layout/AuthenticatedApp';
import { PublicApp } from './components/layout/PublicApp';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

function App() {
  const { user, loading, isAuthenticated, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? (
    <AuthenticatedApp user={user} />
  ) : (
    <PublicApp />
  );
}

export default App;