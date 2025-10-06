import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import Home from './pages/Home';
import Chat from './pages/Chat';
import ChildSetup from './pages/ChildSetup';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import LoadingSpinner from './components/LoadingSpinner';
import AuthModal from './components/AuthModal';
import PremiumUpsellModal from './components/PremiumUpsellModal';
import LimitModal from './components/LimitModal';
import AdminPage from './pages/AdminPage'; // Importar a nova página de Admin

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPremiumUpsellModal, setShowPremiumUpsellModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null); // Estado para a role do usuário
  const { i18n } = useTranslation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) {
        fetchUserRole(session.user.id);
        updateUserLanguage(session.user.id, i18n.language);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      if (session) {
        fetchUserRole(session.user.id);
        updateUserLanguage(session.user.id, i18n.language);
      } else {
        setUserRole(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [i18n.language]);

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      setUserRole(null);
    } else if (data) {
      setUserRole(data.role);
    }
  };

  const updateUserLanguage = async (userId: string, language: string) => {
    const { error } = await supabase
      .from('users')
      .update({ language: language })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user language:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<Home session={session} setShowAuthModal={setShowAuthModal} />} />
        <Route
          path="/chat/:childId?"
          element={
            session ? (
              <Chat
                session={session}
                setShowPremiumUpsellModal={setShowPremiumUpsellModal}
                setShowLimitModal={setShowLimitModal}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/child-setup"
          element={session ? <ChildSetup session={session} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/profile"
          element={session ? <Profile session={session} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/settings"
          element={session ? <Settings session={session} /> : <Navigate to="/" replace />}
        />
        {userRole === 'admin' && (
          <Route
            path="/admin"
            element={session ? <AdminPage session={session} /> : <Navigate to="/" replace />}
          />
        )}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <AuthModal showAuthModal={showAuthModal} setShowAuthModal={setShowAuthModal} />
      <PremiumUpsellModal
        showPremiumUpsellModal={showPremiumUpsellModal}
        setShowPremiumUpsellModal={setShowPremiumUpsellModal}
        session={session}
      />
      <LimitModal showLimitModal={showLimitModal} setShowLimitModal={setShowLimitModal} />
    </Router>
  );
}

export default App;
