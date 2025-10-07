import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import ChatInterface from './components/ChatInterface';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import ChildSetup from './components/ChildSetup';
import ChildSelector from './components/ChildSelector';
import LimitModal from './components/LimitModal';
import Footer from './components/Footer';
import AboutPage from './components/AboutPage';
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
  const [showAbout, setShowAbout] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Check auth state
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('Session found, checking user setup for:', session.user.id);
        await checkUserSetup(session.user.id);
      } else {
        console.log('No session found, going to landing');
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
            console.log('Google OAuth callback detected');
            // Create user in database if not exists
            const { data: existingUser } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (!existingUser) {
              console.log('Creating new user from Google OAuth');
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
          console.log('No session, clearing state');
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
      console.log('Checking user setup for:', userId);
      
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
        console.log('User not found in database, going to setup');
        setAppState('setup');
        return;
      }

      console.log('User found:', userData.name, 'Premium:', userData.is_premium);
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

      console.log('Children found:', childrenData?.length || 0);
      setChildren(childrenData || []);

      if (!childrenData || childrenData.length === 0) {
        console.log('No children found, going to setup');
        setAppState('setup');
        return;
      }

      // If only one child, select it automatically
      if (childrenData.length === 1) {
        console.log('Only one child, selecting automatically:', childrenData[0].name);
        setChild(childrenData[0]);
        setAppState('chat');
      } else {
        // Multiple children, show selector
        const lastSelectedChildId = localStorage.getItem('lastSelectedChild');
        if (lastSelectedChildId) {
          const lastChild = childrenData.find(c => c.id === lastSelectedChildId);
          if (lastChild) {
            console.log('Selecting last selected child:', lastChild.name);
            setChild(lastChild);
            setAppState('chat');
            return;
          }
        }
        console.log('Multiple children, showing selector');
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
    console.log('Selecting child:', selectedChild.name);
    setChild(selectedChild);
    localStorage.setItem('lastSelectedChild', selectedChild.id);
    setAppState('chat');
  };

  const handleBackToSelector = () => {
    console.log('Going back to selector, children count:', children.length);
    setAppState('child_selector');
  };

  const handleLogout = async () => {
    try {
      // Primeiro limpar estado local
      setUser(null);
      setChild(null);
      setChildren([]);
      setAppState('landing');
      
      // Limpar localStorage
      localStorage.removeItem('lastSelectedChild');
      localStorage.removeItem('supabase.auth.token');
      
      // Tentar logout do Supabase
      await supabase.auth.signOut();
      
      // Forçar reload da página como fallback
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
    } catch (error) {
      console.error('Error logging out:', error);
      // Em caso de erro, forçar reload
      window.location.reload();
    }
  };

  const handleMessageLimit = () => {
    console.log('=== LIMITE ATINGIDO ===');
    console.log('Mostrando modal de limite...');
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
          <motion.div key="setup" className="min-h-screen flex flex-col">
            <div className="flex-1">
              <ChildSetup 
                onComplete={handleSetupComplete} 
                onBack={handleBackFromSetup}
                showBackButton={children.length > 0}
              />
            </div>
            <Footer onAboutClick={() => setShowAbout(true)} />
          </motion.div>
        )}

        {appState === 'child_selector' && (
          <motion.div key="child_selector" className="min-h-screen flex flex-col">
            <div className="flex-1">
              <ChildSelector 
                children={children}
                user={user}
                onSelectChild={handleSelectChild}
                onCreateNew={() => setAppState('setup')}
                onLogout={handleLogout}
              />
            </div>
            <Footer onAboutClick={() => setShowAbout(true)} />
          </motion.div>
        )}

        {appState === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-screen flex flex-col"
          >
            <div className="flex-1 flex items-center justify-center px-4 py-8">
              <ChatInterface 
                isInitialState={true}
                onFirstMessage={handleFirstMessage}
                user={user}
                child={child}
                onMessageLimit={handleMessageLimit}
                onShowAuth={() => setShowAuth(true)}
              />
            </div>
            <Footer onAboutClick={() => setShowAbout(true)} />
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

      <AboutPage
        isOpen={showAbout}
        onClose={() => setShowAbout(false)}
      />
    </div>
  );
}

export default App;
