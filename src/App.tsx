import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import AuthModal from './components/AuthModal';
import ChildSelector from './components/ChildSelector';
import ChildSetup from './components/ChildSetup';
import Chat from './components/Chat';
import AdminPage from './pages/AdminPage';
import LimitModal from './components/LimitModal';
import PremiumUpsellModal from './components/PremiumUpsellModal';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showPremiumUpsellModal, setShowPremiumUpsellModal] = useState(false);
  const { i18n } = useTranslation();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // Set initial language based on browser or user preference
    const userLanguage = navigator.language || navigator.languages[0];
    i18n.changeLanguage(userLanguage.split('-')[0]); // Use only the primary language code

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [i18n]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <Toaster />
      <Routes>
        <Route
          path="/"
          element={session ? <Navigate to="/chat" /> : <AuthModal />}
        />
        <Route
          path="/chat"
          element={session ? <ChildSelector session={session} setShowPremiumUpsellModal={setShowPremiumUpsellModal} /> : <Navigate to="/" />}
        />
        <Route
          path="/chat/setup"
          element={session ? <ChildSetup session={session} /> : <Navigate to="/" />}
        />
        <Route
          path="/chat/:childId"
          element={session ? <Chat session={session} setShowPremiumUpsellModal={setShowPremiumUpsellModal} setShowLimitModal={setShowLimitModal} /> : <Navigate to="/" />}
        />
        <Route
          path="/admin"
          element={session ? <AdminPage session={session} /> : <Navigate to="/" />}
        />
        {/* Add other routes here if needed */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {showLimitModal && <LimitModal onClose={() => setShowLimitModal(false)} onUpgradeClick={() => { setShowLimitModal(false); setShowPremiumUpsellModal(true); }} />}
      {showPremiumUpsellModal && <PremiumUpsellModal onClose={() => setShowPremiumUpsellModal(false)} session={session} />}
    </Router>
  );
}

export default App;
