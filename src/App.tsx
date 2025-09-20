import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import ChatInterface from './components/ChatInterface';
import Header from './components/Header';
import ThemeToggle from './components/ThemeToggle';
import AuthModal from './components/AuthModal';
import ChildSetup from './components/ChildSetup';
import LimitModal from './components/LimitModal';
import { supabase } from './lib/supabase';
import { User, Child, ChildSetupData } from './types';
import './lib/i18n';

type AppState = 'landing' | 'auth' | 'setup' | 'chat' | 'limit';

function App() {
  const { t } = useTranslation();
  const [appState, setAppState] = useState<AppState>('landing');
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showLimit, setShowLimit] = useState(false);

  useEffect(() => {
    // Check for saved theme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }

    // Check auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkUserSetup(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          await checkUserSetup(session.user.id);
        } else {
          setUser(null);
          setChild(null);
          setAppState('landing');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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

      // Check if child exists
      const { data: childData, error: childError } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (childError && childError.code !== 'PGRST116') {
        throw childError;
      }

      if (!childData) {
        setAppState('setup');
        return;
      }

      setChild(childData);
      setAppState('chat');
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
      setAppState('setup');
      return;
    }

    setAppState('chat');
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
    // checkUserSetup will be called by the auth state change listener
  };

  const handleSetupComplete = async (setupData: ChildSetupData) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('No authenticated user');

      // Create/update user record
      const { data: userData, error: userError } = await supabase
        .from('users')
        .upsert({
          id: authUser.id,
          email: authUser.email!,
          name: setupData.parentName,
          gender: setupData.parentGender,
          language: 'pt-BR' // Will be updated based on browser
        })
        .select()
        .single();

      if (userError) throw userError;

      // Create child record
      const { data: childData, error: childError } = await supabase
        .from('children')
        .insert({
          user_id: authUser.id,
          name: setupData.childName,
          age: setupData.childAge,
          gender: setupData.childGender
        })
        .select()
        .single();

      if (childError) throw childError;

      setUser(userData);
      setChild(childData);
      setAppState('chat');
    } catch (error) {
      console.error('Error completing setup:', error);
      alert('Erro ao criar seu filho. Tente novamente.');
    }
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleMessageLimit = () => {
    setShowLimit(true);
  };

  // Determine color scheme based on child gender
  const colorScheme = child?.gender === 'female' ? 'pink' : child?.gender === 'male' ? 'blue' : 'purple';
  
  const getBackgroundClass = () => {
    switch (colorScheme) {
      case 'pink':
        return 'from-white via-pink-50/30 to-rose-50/20 dark:from-gray-900 dark:via-pink-900/20 dark:to-gray-800';
      case 'blue':
        return 'from-white via-blue-50/30 to-cyan-50/20 dark:from-gray-900 dark:via-blue-900/20 dark:to-gray-800';
      default:
        return 'from-white via-purple-50/30 to-pink-50/20 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800';
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBackgroundClass()} transition-colors duration-500`}>
      <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
      
      <AnimatePresence mode="wait">
        {appState === 'setup' && (
          <motion.div key="setup">
            <ChildSetup onComplete={handleSetupComplete} />
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
            <Header child={child} />
            <div className="flex-1 flex flex-col">
              <ChatInterface 
                isInitialState={false}
                onFirstMessage={handleFirstMessage}
                user={user}
                child={child}
                onMessageLimit={handleMessageLimit}
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
