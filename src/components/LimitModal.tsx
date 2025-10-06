import { X, MessageSquare, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LimitModalProps {
  onClose: () => void;
  onUpgradeClick: () => void;
}

const LimitModal = ({ onClose, onUpgradeClick }: LimitModalProps) => {
  const { t } = useTranslation();

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
          <MessageSquare className="mx-auto h-12 w-12 text-primary-500 dark:text-primary-400" />
          <h3 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{t('limitModal.title')}</h3>
          <div className="mt-2">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('limitModal.description')}
            </p>
            <p className="mt-2 text-lg font-semibold text-primary-600 dark:text-primary-400">
              {t('limitModal.currentLimit')}
            </p>
          </div>
          <div className="mt-5 sm:mt-6">
            <button
              type="button"
              className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
              onClick={onUpgradeClick}
            >
              <Crown className="mr-2" size={20} />
              {t('limitModal.upgradeButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LimitModal;
