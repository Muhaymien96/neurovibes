import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface IntegrationCallbackProps {
  type: 'google-calendar' | 'notion';
}

export const IntegrationCallback: React.FC<IntegrationCallbackProps> = ({ type }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const userId = localStorage.getItem('mindmesh_user_id');

        if (error) {
          setStatus('error');
          setMessage(`Authorization failed: ${error}`);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No authorization code received');
          return;
        }

        if (!userId) {
          setStatus('error');
          setMessage('User session not found');
          return;
        }

        // Exchange code for tokens
        const endpoint = type === 'google-calendar' 
          ? 'google-calendar-auth' 
          : 'notion-auth';

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'exchange_code',
              code,
              user_id: userId,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStatus('success');
            setMessage(`${type === 'google-calendar' ? 'Google Calendar' : 'Notion'} connected successfully!`);
            
            // Clean up
            localStorage.removeItem('mindmesh_user_id');
            
            // Close window after a delay
            setTimeout(() => {
              window.close();
            }, 2000);
          } else {
            setStatus('error');
            setMessage('Failed to complete integration setup');
          }
        } else {
          const errorData = await response.json();
          setStatus('error');
          setMessage(errorData.error || 'Integration failed');
        }
      } catch (err) {
        console.error('Callback error:', err);
        setStatus('error');
        setMessage('An unexpected error occurred');
      }
    };

    handleCallback();
  }, [type]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader className="h-12 w-12 text-indigo-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Setting up integration...
            </h2>
            <p className="text-gray-600">
              Please wait while we complete the setup process.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Integration Successful!
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              This window will close automatically...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Integration Failed
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => window.close()}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close Window
            </button>
          </>
        )}
      </div>
    </div>
  );
};