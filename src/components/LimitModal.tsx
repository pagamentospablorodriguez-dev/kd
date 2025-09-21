import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Clock, Crown, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  childName: string;
  childGender: 'male' | 'female';
}

const LimitModal: React.FC<LimitModalProps> = ({ isOpen, onClose, childName, childGender }) => {
  const { t, i18n } = useTranslation();
  
  const colorScheme = childGender === 'female' ? 'pink' : 'blue';
  const gradientClass = colorScheme === 'pink' ? 'from-pink-500 to-rose-500' : 'from-blue-500 to-cyan-500';
  const heartColor = colorScheme === 'pink' ? 'text-pink-500' : 'text-blue-500';

  const handlePremiumClick = () => {
    // Determinar URL baseado no idioma
    const isPtBR = i18n.language === 'pt-BR';
    const premiumUrl = isPtBR 
      ? 'https://pay.kiwify.com.br/Xpj0Ymu'
      : 'https://pay.kiwify.com.br/rdNpnqU';
    
    window.open(premiumUrl, '_blank');
  };

  const getPriceDisplay = () => {
    const isPtBR = i18n.language === 'pt-BR';
    if (isPtBR) {
      return 'R$ 29/mês';
    } else {
      // Para gringos, mostrar claramente a conversão
      return 'US$29/month (R$ 159.50)';
    }
  };

  const getPriceExplanation = () => {
    const isPtBR = i18n.language === 'pt-BR';
    if (!isPtBR) {
      return t('limit.price_explanation');
    }
    return '';
  };

  const getTimeText = () => {
    return t('limit.next_24_hours');
  };

  const getResetText = () => {
    return t('limit.reset_text');
  };

  const getPremiumFeaturesText = () => {
    return t('limit.premium_includes');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-8 relative shadow-2xl border border-gray-200/50 dark:border-gray-700/50"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Logo */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <img src="/ninna.png" alt="Ninna" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                {t('limit.title_11')}
              </h2>
              <p className={`font-semibold ${heartColor} mb-2`}>
                {childName} {t('limit.subtitle')}
              </p>
            </div>

            {/* Emotional Message */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6 text-center">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('limit.description')}
              </p>
              
              <div className="mt-4 p-4 bg-white dark:bg-gray-600 rounded-lg border-l-4 border-orange-400">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">{getTimeText()}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {getResetText()}
                </p>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('limit.tomorrow')}
              </motion.button>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">{getPriceDisplay()}</div>
                {getPriceExplanation() && (
                  <p className="text-xs text-gray-500 mb-3">{getPriceExplanation()}</p>
                )}
              </div>

              <motion.button
                onClick={handlePremiumClick}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-4 bg-gradient-to-r ${gradientClass} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 relative overflow-hidden`}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                >
                  <Crown className="w-5 h-5" />
                </motion.div>
                {t('limit.premium')}
                
                {/* Shimmer effect */}
                <motion.div
                  animate={{ x: [-100, 300] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                />
              </motion.button>
            </div>

            {/* Premium Features Preview */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-3">
                {getPremiumFeaturesText()}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${gradientClass}`} />
                  <span className="text-gray-600 dark:text-gray-400">{t('limit.feature_unlimited')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${gradientClass}`} />
                  <span className="text-gray-600 dark:text-gray-400">{t('limit.feature_proactive')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${gradientClass}`} />
                  <span className="text-gray-600 dark:text-gray-400">{t('limit.feature_memories')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${gradientClass}`} />
                  <span className="text-gray-600 dark:text-gray-400">{t('limit.feature_evolution')}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LimitModal;
