import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import ChatInterface from './components/ChatInterface';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import ChildSetup from './components/ChildSetup';
import ChildSelector from './components/ChildSelector';
import LimitModal from './components/LimitModal';
import { supabase } from './lib/supabase';
import { User, Child, ChildSetupData } from './types';
import './lib/i18n';

type AppState = 'landing' | 'auth' | 'setup' | 'chat' | 'limit' | 'child_selector';

function App() {
  const { t } = useTranslation();
  const [appState, setAppState] = useState<AppState>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [showAuth, setShowAuth] = useState(false);
  const [showLimit, setShowLimit] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Check auth state
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await checkUserSetup(session.user.id);
      } else {
        setAppState('landing');
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      setAppState('landing');
    } finally {
      setLoading(false);
    }

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (session) {
          // Handle Google OAuth callback
          if (session.user.app_metadata.provider === 'google') {
            // Create user in database if not exists
            const { data: existingUser } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (!existingUser) {
              await supabase
                .from('users')
                .insert({
                  id: session.user.id,
                  email: session.user.email!,
                  name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                  language: 'pt-BR',
                  timezone: 'America/Sao_Paulo'
                });
            }
          }
          
          await checkUserSetup(session.user.id);
        } else {
          setUser(null);
          setChild(null);
          setChildren([]);
          setAppState('landing');
        }
      }
    );

    return () => subscription.unsubscribe();
  };

  const checkUserSetup = async (userId: string) => {
    try {
      // Check if user exists in our database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      if (!userData) {
        setAppState('setup');
        return;
      }

      setUser(userData);

      // Get all children for this user
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (childrenError && childrenError.code !== 'PGRST116') {
        throw childrenError;
      }

      setChildren(childrenData || []);

      if (!childrenData || childrenData.length === 0) {
        setAppState('setup');
        return;
      }

      // If only one child, select it automatically
      if (childrenData.length === 1) {
        setChild(childrenData[0]);
        setAppState('chat');
      } else {
        // Multiple children, show selector
        const lastSelectedChildId = localStorage.getItem('lastSelectedChild');
        if (lastSelectedChildId) {
          const lastChild = childrenData.find(c => c.id === lastSelectedChildId);
          if (lastChild) {
            setChild(lastChild);
            setAppState('chat');
            return;
          }
        }
        setAppState('child_selector');
      }
    } catch (error) {
      console.error('Error checking user setup:', error);
      setAppState('setup');
    }
  };

  const handleFirstMessage = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    
    if (!child) {
      if (children.length === 0) {
        setAppState('setup');
      } else {
        setAppState('child_selector');
      }
      return;
    }

    setAppState('chat');
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
    // checkUserSetup will be called by the auth state change listener
  };

  const handleSetupComplete = async (setupData: ChildSetupData) => {
    // Reload data after setup
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      await checkUserSetup(authUser.id);
    }
  };

  const handleSelectChild = async (selectedChild: Child) => {
    setChild(selectedChild);
    localStorage.setItem('lastSelectedChild', selectedChild.id);
    setAppState('chat');
  };

  const handleBackToSelector = () => {
    setAppState('child_selector');
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      localStorage.clear();
      setUser(null);
      setChild(null);
      setChildren([]);
      setAppState('landing');
      
      // Force refresh as fallback
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
      // Force refresh as fallback
      window.location.href = '/';
    }
  };

  const handleMessageLimit = () => {
    setShowLimit(true);
  };

  const handleBackFromSetup = () => {
    if (children.length > 0) {
      setAppState('child_selector');
    } else {
      setAppState('landing');
    }
  };

  // Determine color scheme based on child gender
  const colorScheme = child?.gender === 'female' ? 'pink' : child?.gender === 'male' ? 'blue' : 'purple';
  
  const getBackgroundClass = () => {
    switch (colorScheme) {
      case 'pink':
        return 'from-white via-pink-50/30 to-rose-50/20';
      case 'blue':
        return 'from-white via-blue-50/30 to-cyan-50/20';
      default:
        return 'from-white via-purple-50/30 to-pink-50/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBackgroundClass()} transition-colors duration-500`}>
      <AnimatePresence mode="wait">
        {appState === 'setup' && (
          <motion.div key="setup">
            <ChildSetup 
              onComplete={handleSetupComplete} 
              onBack={handleBackFromSetup}
              showBackButton={children.length > 0}
            />
          </motion.div>
        )}

        {appState === 'child_selector' && (
          <motion.div key="child_selector">
            <ChildSelector 
              children={children}
              onSelectChild={handleSelectChild}
              onCreateNew={() => setAppState('setup')}
              onLogout={handleLogout}
            />
          </motion.div>
        )}

        {appState === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-screen flex items-center justify-center px-4 py-8"
          >
            <ChatInterface 
              isInitialState={true}
              onFirstMessage={handleFirstMessage}
              user={user}
              child={child}
              onMessageLimit={handleMessageLimit}
              onShowAuth={() => setShowAuth(true)}
            />
          </motion.div>
        )}

        {appState === 'chat' && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-screen flex flex-col"
          >
            <Header 
              child={child} 
              onBackToSelector={handleBackToSelector}
              onLogout={handleLogout}
              hasMultipleChildren={children.length > 1}
            />
            <div className="flex-1 flex flex-col">
              <ChatInterface 
                isInitialState={false}
                onFirstMessage={handleFirstMessage}
                user={user}
                child={child}
                onMessageLimit={handleMessageLimit}
                onShowAuth={() => setShowAuth(true)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal 
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={handleAuthSuccess}
      />

      <LimitModal 
        isOpen={showLimit}
        onClose={() => setShowLimit(false)}
        childName={child?.name || 'seu filho'}
        childGender={child?.gender || 'male'}
      />
    </div>
  );
}

export default App;
