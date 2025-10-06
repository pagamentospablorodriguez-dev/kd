import { X, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Session } from '@supabase/supabase-js';

interface PremiumUpsellModalProps {
  onClose: () => void;
  session: Session | null;
}

const PremiumUpsellModal = ({ onClose, session }: PremiumUpsellModalProps) => {
  const { t } = useTranslation();

  const handleUpgradeClick = () => {
    // Lógica para redirecionar para o pagamento
    // Pode ser Stripe para internacional ou Kiwify para Brasil
    const userCountry = session?.user_metadata?.country || 'BR'; // Exemplo: obter país do usuário

    if (userCountry === 'BR') {
      // Redirecionar para Kiwify
      window.location.href = import.meta.env.VITE_PREMIUM_PAYMENT_URL_KIWIFY || 'https://kiwify.com.br/seu-produto-premium';
    } else {
      // Redirecionar para Stripe
      window.location.href = import.meta.env.VITE_PREMIUM_PAYMENT_URL_STRIPE || 'https://buy.stripe.com/test_your-premium-product';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative my-8">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={24} />
        </button>
        <div className="text-center">
          <Crown className="mx-auto h-12 w-12 text-yellow-500 dark:text-yellow-400" />
          <h3 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{t('premiumUpsell.title')}</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {t('premiumUpsell.subtitle')}
          </p>
          <div className="mt-5 space-y-2 text-left">
            <p className="flex items-center text-gray-700 dark:text-gray-200">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {t('premiumUpsell.feature1')}
            </p>
            <p className="flex items-center text-gray-700 dark:text-gray-200">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {t('premiumUpsell.feature2')}
            </p>
            <p className="flex items-center text-gray-700 dark:text-gray-200">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {t('premiumUpsell.feature3')}
            </p>
            <p className="flex items-center text-gray-700 dark:text-gray-200">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {t('premiumUpsell.feature4')}
            </p>
          </div>
          <div className="mt-5 sm:mt-6">
            <button
              type="button"
              className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
              onClick={handleUpgradeClick}
            >
              <Crown className="mr-2" size={20} />
              {t('premiumUpsell.upgradeButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumUpsellModal;
