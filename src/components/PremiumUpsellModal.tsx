import { X, Crown, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Session } from '@supabase/supabase-js';

interface PremiumUpsellModalProps {
  showPremiumUpsellModal: boolean;
  setShowPremiumUpsellModal: (show: boolean) => void;
  session: Session | null;
}

const PremiumUpsellModal = ({ showPremiumUpsellModal, setShowPremiumUpsellModal, session }: PremiumUpsellModalProps) => {
  const { t } = useTranslation();

  if (!showPremiumUpsellModal) return null;

  const userId = session?.user?.id;
  const userLanguage = navigator.language || navigator.languages[0] || 'en';
  const isBrazilian = userLanguage.toLowerCase().includes('pt-br');

  const kiwifyLink = `https://pay.kiwify.com.br/YOUR_KIWIFY_PRODUCT_ID?client_reference_id=${userId}`;
  const stripeLink = `https://buy.stripe.com/YOUR_STRIPE_PRICE_ID?client_reference_id=${userId}`;

  const handleUpgradeClick = ( ) => {
    if (isBrazilian) {
      window.open(kiwifyLink, '_blank');
    } else {
      window.open(stripeLink, '_blank');
    }
    setShowPremiumUpsellModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg relative my-8">
        <button
          onClick={() => setShowPremiumUpsellModal(false)}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={24} />
        </button>
        <div className="text-center">
          <Crown className="mx-auto h-12 w-12 text-yellow-500" />
          <h3 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">{t('premiumUpsell.title')}</h3>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
            {t('premiumUpsell.subtitle')}
          </p>

          <div className="mt-6 text-left">
            <ul className="space-y-3 text-gray-700 dark:text-gray-200">
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                {t('premiumUpsell.feature1')}
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                {t('premiumUpsell.feature2')}
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                {t('premiumUpsell.feature3')}
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                {t('premiumUpsell.feature4')}
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <p className="text-4xl font-extrabold text-gray-900 dark:text-white">
              {isBrazilian ? 'R$ 29' : 'US$ 29'}
              <span className="text-base font-medium text-gray-500 dark:text-gray-400">/{t('premiumUpsell.perMonth')}</span>
            </p>
            <button
              type="button"
              className="mt-5 inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-6 py-3 bg-yellow-500 text-lg font-medium text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-300"
              onClick={handleUpgradeClick}
            >
              {t('premiumUpsell.upgradeButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumUpsellModal;
