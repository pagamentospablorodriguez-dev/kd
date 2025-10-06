import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminDashboard from '../components/AdminDashboard';
import LoadingSpinner from '../components/LoadingSpinner';

interface AdminPageProps {
  session: Session;
}

const AdminPage = ({ session }: AdminPageProps) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const checkAdminRole = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || data?.role !== 'admin') {
        navigate('/'); // Redireciona se não for admin
      } else {
        setIsAdmin(true);
      }
      setLoading(false);
    };

    checkAdminRole();
  }, [session, navigate]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAdmin) {
    return null; // Ou uma página de acesso negado
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AdminDashboard session={session} />
    </div>
  );
};

export default AdminPage;
