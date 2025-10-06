import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, MessageCircle, Settings, User, LogOut, ShieldCheck, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface ChildSelectorProps {
  session: Session;
  setShowPremiumUpsellModal: (show: boolean) => void;
}

interface Child {
  id: string;
  name: string;
  gender: string;
  age: number;
}

const ChildSelector = ({ session, setShowPremiumUpsellModal }: ChildSelectorProps) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [userIsPremium, setUserIsPremium] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    fetchChildren();
    fetchUserStatus();
  }, [session]);

  const fetchChildren = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('children')
      .select('id, name, gender, age')
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error fetching children:', error);
      toast.error(t('childSelector.fetchChildrenError'));
    } else {
      setChildren(data || []);
    }
    setLoading(false);
  };

  const fetchUserStatus = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('is_premium, role')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching user status:', error);
    } else if (data) {
      setUserIsPremium(data.is_premium);
      setUserRole(data.role);
    }
  };

  const handleCreateChild = () => {
    if (!userIsPremium && children.length >= 1) {
      setShowPremiumUpsellModal(true);
    } else {
      navigate('/child-setup');
    }
  };

  const handleSelectChild = (childId: string) => {
    navigate(`/chat/${childId}`);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
      toast.error(t('childSelector.logoutError'));
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 space-y-8 relative">
        <h1 className="text-4xl font-extrabold text-center text-gray-900 dark:text-white mb-8">
          {t('childSelector.title')}
        </h1>

        {!userIsPremium && (
          <div className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 p-4 rounded-lg shadow-md mb-6">
            <div className="flex items-center">
              <Crown className="text-yellow-500 mr-3" size={24} />
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                {t('childSelector.premiumUpsellText')}
                <button
                  onClick={() => setShowPremiumUpsellModal(true)}
                  className="ml-2 font-bold text-yellow-700 hover:text-yellow-900 dark:text-yellow-300 dark:hover:text-yellow-100 underline"
                >
                  {t('childSelector.premiumUpsellLink')}
                </button>
              </p>
            </div>
          </div>
        )}

        {children.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
              {t('childSelector.noChildrenYet')}
            </p>
            <button
              onClick={handleCreateChild}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300 transform hover:scale-105"
            >
              <PlusCircle className="mr-3" size={24} />
              {t('childSelector.createFirstChild')}
            </button>
          </div>
        ) : (
          <div className={`grid gap-6 ${userIsPremium ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {children.map((child) => (
              <div
                key={child.id}
                onClick={() => handleSelectChild(child.id)}
                className="relative bg-gradient-to-br from-primary-500 to-primary-700 dark:from-primary-700 dark:to-primary-900 rounded-xl shadow-lg p-6 text-white cursor-pointer hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center text-center"
              >
                <MessageCircle className="mb-3" size={36} />
                <h3 className="text-2xl font-bold mb-1">{child.name}</h3>
                <p className="text-sm opacity-90">{t('childSelector.age', { age: child.age })}</p>
                <p className="text-xs opacity-70 capitalize">{child.gender === 'male' ? t('childSelector.genderMale') : t('childSelector.genderFemale')}</p>
              </div>
            ))}
            {userIsPremium || children.length < 1 ? (
              <button
                onClick={handleCreateChild}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-primary-500 hover:text-primary-500 transition-all duration-300 transform hover:scale-105"
              >
                <PlusCircle className="mb-3" size={36} />
                <span className="text-lg font-medium">{t('childSelector.addChild')}</span>
              </button>
            ) : (
              <div
                onClick={handleCreateChild}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-primary-500 hover:text-primary-500 transition-all duration-300 transform hover:scale-105 cursor-pointer"
              >
                <Crown className="mb-3 text-yellow-500" size={36} />
                <span className="text-lg font-medium text-center">{t('childSelector.premiumForMore')}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-center space-x-4 mt-8">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            <User className="mr-2" size={20} />
            {t('childSelector.profile')}
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            <Settings className="mr-2" size={20} />
            {t('childSelector.settings')}
          </button>
          {userRole === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              <ShieldCheck className="mr-2" size={20} />
              {t('childSelector.admin')}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 border border-red-300 dark:border-red-600 rounded-full text-sm font-medium text-red-700 dark:text-red-200 bg-white dark:bg-red-700 hover:bg-red-50 dark:hover:bg-red-600 transition-colors duration-200"
          >
            <LogOut className="mr-2" size={20} />
            {t('childSelector.logout')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChildSelector;
