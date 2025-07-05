import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthService } from '../lib/auth';

interface AuthCallbackPageProps {
  darkMode: boolean;
}

export const AuthCallbackPage: React.FC<AuthCallbackPageProps> = ({ darkMode }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Error during auth callback:', error);
          navigate('/auth');
          return;
        }

        if (session?.user) {
          // Update user profile in public.users table
          await AuthService.upsertUserProfile(session.user.id, {
            email: session.user.email!,
            full_name: session.user.user_metadata?.full_name,
            avatar_url:
              session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          });

          // Navigate to dashboard
          navigate('/dashboard');
        } else {
          navigate('/auth');
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        navigate('/auth');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div className="text-center">
        <Loader2
          className={`w-12 h-12 animate-spin mx-auto mb-4 ${
            darkMode ? 'text-blue-400' : 'text-blue-600'
          }`}
        />
        <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Autenticando...</p>
      </div>
    </div>
  );
};
