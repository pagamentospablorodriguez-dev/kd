import { useState, useEffect, useMemo } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Users, CreditCard, BarChart2, Settings, Search, Shield, Crown, UserPlus, UserMinus } from 'lucide-react';

interface AdminDashboardProps {
  session: Session;
}

interface UserData {
  id: string;
  name: string | null;
  email: string;
  is_premium: boolean;
  role: string;
}

const AdminDashboard = ({ session }: AdminDashboardProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, premiumUsers: 0, activeToday: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: usersData, error: usersError } = await supabase.from('users').select('*');
    // Fetch other stats as needed

    if (usersError) {
      toast.error(t('admin.error.fetch'));
      console.error(usersError);
    } else {
      setUsers(usersData || []);
      setStats(prev => ({ ...prev, totalUsers: usersData?.length || 0, premiumUsers: usersData?.filter(u => u.is_premium).length || 0 }));
    }
    setLoading(false);
  };

  const handleUpdateUser = async (userId: string, updates: Partial<UserData>) => {
    const confirmAction = window.confirm(getConfirmationMessage(updates));
    if (!confirmAction) return;

    const { error } = await supabase.from('users').update(updates).eq('id', userId);
    if (error) {
      toast.error(t('admin.error.update'));
      console.error(error);
    } else {
      toast.success(t('admin.success.update'));
      fetchData(); // Refresh data
    }
  };

  const getConfirmationMessage = (updates: Partial<UserData>): string => {
    if (updates.role === 'admin') return t('admin.confirm.makeAdmin');
    if (updates.role === 'user') return t('admin.confirm.removeAdmin');
    if (updates.is_premium === true) return t('admin.confirm.grantPremium');
    if (updates.is_premium === false) return t('admin.confirm.revokePremium');
    return 'Are you sure?';
  };

  const filteredUsers = useMemo(() =>
    users.filter(user =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [users, searchTerm]);

  const renderUsersTab = () => (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder={t('admin.searchUser')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
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
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_premium ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {user.is_premium ? t('admin.userTable.status.premium') : t('admin.userTable.status.free')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 capitalize">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {user.role !== 'admin' ? (
                    <button onClick={() => handleUpdateUser(user.id, { role: 'admin' })} className="text-indigo-600 hover:text-indigo-900" title={t('admin.userTable.action.makeAdmin')}><UserPlus size={18} /></button>
                  ) : (
                    <button onClick={() => handleUpdateUser(user.id, { role: 'user' })} className="text-red-600 hover:text-red-900" title={t('admin.userTable.action.removeAdmin')}><UserMinus size={18} /></button>
                  )}
                  {!user.is_premium ? (
                    <button onClick={() => handleUpdateUser(user.id, { is_premium: true })} className="text-green-600 hover:text-green-900" title={t('admin.userTable.action.grantPremium')}><Crown size={18} /></button>
                  ) : (
                    <button onClick={() => handleUpdateUser(user.id, { is_premium: false })} className="text-yellow-600 hover:text-yellow-900" title={t('admin.userTable.action.revokePremium')}><Crown size={18} className="opacity-50" /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-md flex-shrink-0">
        <div className="p-4 text-2xl font-bold text-gray-900 dark:text-white border-b dark:border-gray-700">{t('admin.title')}</div>
        <nav className="mt-4">
          <a href="#" onClick={() => setActiveTab('users')} className={`flex items-center px-4 py-2 ${activeTab === 'users' ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <Users className="mr-3" size={20} /> {t('admin.users')}
          </a>
          <a href="#" onClick={() => setActiveTab('subscriptions')} className={`flex items-center px-4 py-2 ${activeTab === 'subscriptions' ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <CreditCard className="mr-3" size={20} /> {t('admin.subscriptions')}
          </a>
          <a href="#" onClick={() => setActiveTab('analytics')} className={`flex items-center px-4 py-2 ${activeTab === 'analytics' ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <BarChart2 className="mr-3" size={20} /> {t('admin.analytics')}
          </a>
          <a href="#" onClick={() => setActiveTab('settings')} className={`flex items-center px-4 py-2 ${activeTab === 'settings' ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <Settings className="mr-3" size={20} /> {t('admin.settings')}
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white capitalize">{t(`admin.${activeTab}`)}</h1>
        </header>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"><h4 className="text-gray-500">{t('admin.totalUsers')}</h4><p className="text-3xl font-bold">{stats.totalUsers}</p></div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"><h4 className="text-gray-500">{t('admin.premiumUsers')}</h4><p className="text-3xl font-bold">{stats.premiumUsers}</p></div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"><h4 className="text-gray-500">{t('admin.activeToday')}</h4><p className="text-3xl font-bold">{stats.activeToday}</p></div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"><h4 className="text-gray-500">{t('admin.totalRevenue')}</h4><p className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</p></div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'users' && renderUsersTab()}
          {activeTab === 'subscriptions' && <p>{t('admin.subscriptions')} content coming soon.</p>}
          {activeTab === 'analytics' && <p>{t('admin.analytics')} content coming soon.</p>}
          {activeTab === 'settings' && <p>{t('admin.settings')} content coming soon.</p>}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
