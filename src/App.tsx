import React from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthenticatedApp } from './components/layout/AuthenticatedApp';
import { PublicApp } from './components/layout/PublicApp';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

function App() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  if (authLoading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? (
    <AuthenticatedApp user={user} />
  ) : (
    <PublicApp />
  );
}

export default App;