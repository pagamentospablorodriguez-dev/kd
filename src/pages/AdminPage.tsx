import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import AdminAnalytics from '../components/AdminAnalytics'; // Importar o componente de analytics
import { Users, CreditCard, BarChart2, Settings, LogOut } from 'lucide-react';

interface AdminPageProps {
  session: Session;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  is_premium: boolean;
  role: string;
}

const AdminPage = ({ session }: AdminPageProps) => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'subscriptions', 'analytics', 'settings'
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!session?.user?.id) return;
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        toast.error(t('admin.error.fetch'));
        navigate('/'); // Redirecionar se não conseguir buscar o papel
      } else if (data && data.role !== 'admin') {
        toast.error('Access Denied: Not an admin.');
        navigate('/'); // Redirecionar se não for admin
      } else {
        setUserRole(data.role);
      }
      setLoading(false);
    };

    fetchUserRole();
  }, [session, navigate, t]);

  useEffect(() => {
    if (userRole === 'admin' && activeTab === 'users') {
      fetchUsers();
    }
  }, [userRole, activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, is_premium, role');

    if (error) {
      console.error('Error fetching users:', error);
      toast.error(t('admin.error.fetch'));
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    if (!window.confirm(t(newRole === 'admin' ? 'admin.confirm.makeAdmin' : 'admin.confirm.removeAdmin'))) return;
    setLoading(true);
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user role:', error);
      toast.error(t('admin.error.update'));
    } else {
      toast.success(t('admin.success.update'));
      fetchUsers();
    }
    setLoading(false);
  };

  const handleUpdateUserPremium = async (userId: string, isPremium: boolean) => {
    if (!window.confirm(t(isPremium ? 'admin.confirm.grantPremium' : 'admin.confirm.revokePremium'))) return;
    setLoading(true);
    const { error } = await supabase
      .from('users')
      .update({ is_premium: isPremium })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user premium status:', error);
      toast.error(t('admin.error.update'));
    } else {
      toast.success(t('admin.success.update'));
      fetchUsers();
    }
    setLoading(false);
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 dark:border-primary-400"></div>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-red-500 text-lg font-semibold">
        {t('admin.accessDenied')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-md p-6 flex flex-col justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-6 text-primary-600 dark:text-primary-400">{t('admin.title')}</h1>
            <nav className="space-y-2">
              <button
                className={`w-full flex items-center p-2 rounded-md ${activeTab === 'users' ? 'bg-primary-100 dark:bg-primary-700 text-primary-700 dark:text-primary-100' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                onClick={() => setActiveTab('users')}
              >
                <Users size={20} className="mr-3" />
                {t('admin.users')}
              </button>
              <button
                className={`w-full flex items-center p-2 rounded-md ${activeTab === 'subscriptions' ? 'bg-primary-100 dark:bg-primary-700 text-primary-700 dark:text-primary-100' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                onClick={() => setActiveTab('subscriptions')}
              >
                <CreditCard size={20} className="mr-3" />
                {t('admin.subscriptions')}
              </button>
              <button
                className={`w-full flex items-center p-2 rounded-md ${activeTab === 'analytics' ? 'bg-primary-100 dark:bg-primary-700 text-primary-700 dark:text-primary-100' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                onClick={() => setActiveTab('analytics')}
              >
                <BarChart2 size={20} className="mr-3" />
                {t('admin.analytics')}
              </button>
              <button
                className={`w-full flex items-center p-2 rounded-md ${activeTab === 'settings' ? 'bg-primary-100 dark:bg-primary-700 text-primary-700 dark:text-primary-100' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                onClick={() => setActiveTab('settings')}
              >
                <Settings size={20} className="mr-3" />
                {t('admin.settings')}
              </button>
            </nav>
          </div>
          <button
            className="w-full flex items-center p-2 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-900"
            onClick={() => navigate('/')} // Voltar para a página inicial
          >
            <LogOut size={20} className="mr-3" />
            {t('childSelector.logout')}
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {activeTab === 'users' && (
            <div>
              <h2 className="text-3xl font-bold mb-6">{t('admin.users')}</h2>
              <input
                type="text"
                placeholder={t('admin.searchUser')}
                className="w-full p-3 mb-6 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('admin.userTable.header.name')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('admin.userTable.header.email')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('admin.userTable.header.status')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('admin.userTable.header.role')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('admin.userTable.header.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{user.name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_premium ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                            {user.is_premium ? t('admin.userTable.status.premium') : t('admin.userTable.status.free')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                            {user.role === 'admin' ? t('admin.userTable.role.admin') : t('admin.userTable.role.user')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleUpdateUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-200"
                            >
                              {user.role === 'admin' ? t('admin.userTable.action.removeAdmin') : t('admin.userTable.action.makeAdmin')}
                            </button>
                            <button
                              onClick={() => handleUpdateUserPremium(user.id, !user.is_premium)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                            >
                              {user.is_premium ? t('admin.userTable.action.revokePremium') : t('admin.userTable.action.grantPremium')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div>
              <h2 className="text-3xl font-bold mb-6">{t('admin.subscriptions')}</h2>
              <p>Subscription management features will be implemented here.</p>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-3xl font-bold mb-6">{t('admin.analytics')}</h2>
              <AdminAnalytics />
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-3xl font-bold mb-6">{t('admin.settings')}</h2>
              <p>Admin settings will be configured here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
