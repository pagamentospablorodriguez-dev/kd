import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Star, Heart, Zap, Shield, MessageCircle, Baby, Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

interface PremiumUpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PremiumUpsellModal: React.FC<PremiumUpsellModalProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const { getUserId } = useAuth();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handlePremiumClick = () => {
    const userId = getUserId();
    const isPtBR = i18n.language === 'pt-BR';
    
    let premiumUrl = isPtBR 
      ? 'https://pay.kiwify.com.br/Xpj0Ymu'
      : 'https://pay.kiwify.com.br/rdNpnqU';
    
    if (userId) {
      const separator = premiumUrl.includes('?') ? '&' : '?';
      premiumUrl += `${separator}s1=${userId}`;
    }
    
    window.open(premiumUrl, '_blank');
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const getPriceDisplay = () => {
    const isPtBR = i18n.language === 'pt-BR';
    return isPtBR ? 'R$ 29/mês' : 'US$29/month';
  };

  const getPriceSubtext = () => {
    const isPtBR = i18n.language === 'pt-BR';
    return !isPtBR ? '(R$ 159.50)' : '';
  };

  const showPriceExplanation = () => {
    const isPtBR = i18n.language === 'pt-BR';
    return !isPtBR;
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="premium-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-0 overflow-y-auto"
          onClick={handleBackdropClick}
        >
          <div className="w-full min-h-screen flex items-center justify-center p-4 py-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg relative shadow-2xl border border-gray-200/50 dark:border-gray-700/50"
            >
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors z-20 bg-white/90 dark:bg-gray-800/90 shadow-lg"
                type="button"
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>

              <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                    opacity: [0.1, 0.2, 0.1]
                  }}
                  transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-32 -right-32 w-64 h-64 bg-purple-400 rounded-full blur-3xl"
                />
                <motion.div
                  animate={{ 
                    scale: [1, 1.3, 1],
                    rotate: [360, 180, 0],
                    opacity: [0.1, 0.15, 0.1]
                  }}
                  transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                  className="absolute -bottom-32 -left-32 w-56 h-56 bg-pink-400 rounded-full blur-3xl"
                />
              </div>

              <div className="relative z-10 p-6 sm:p-8">
                <div className="text-center mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-xl"
                  >
                    <Crown className="w-10 h-10 text-white" />
                  </motion.div>
                  
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-3 leading-tight">
                    {t('premium.upsell.title')}
                  </h1>
                  
                  <p className="text-lg font-semibold text-purple-600 mb-2">
                    {t('premium.upsell.subtitle')}
                  </p>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {t('premium.upsell.description')}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 rounded-2xl p-5 text-white mb-5 relative overflow-hidden">
                  <motion.div
                    animate={{ x: [-100, 300] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  />
                  
                  <div className="relative z-10 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-yellow-300" />
                      <span className="text-base font-bold">PREMIUM</span>
                      <Star className="w-4 h-4 text-yellow-300" />
                    </div>
                    
                    <div className="text-3xl sm:text-4xl font-black mb-1">
                      {getPriceDisplay()}
                    </div>
                    
                    {getPriceSubtext() && (
                      <div className="text-sm opacity-90 mb-2">{getPriceSubtext()}</div>
                    )}
                    
                    {showPriceExplanation() && (
                      <p className="text-xs opacity-80">{t('premium.price_explanation')}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mb-5">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-3 border border-purple-200/50 dark:border-purple-700/50">
                    <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-1.5">
                      <Baby className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800 dark:text-white">
                      {t('premium.upsell.feature1')}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-3 border border-blue-200/50 dark:border-blue-700/50">
                    <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800 dark:text-white">
                      {t('premium.upsell.feature2')}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-3 border border-green-200/50 dark:border-green-700/50">
                    <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-1.5">
                      <Zap className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800 dark:text-white">
                      {t('premium.upsell.feature3')}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-3 border border-orange-200/50 dark:border-orange-700/50">
                    <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-1.5">
                      <Heart className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800 dark:text-white">
                      {t('premium.upsell.feature4')}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl p-3 border border-yellow-200/50 dark:border-yellow-700/50">
                    <div className="w-7 h-7 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800 dark:text-white">
                      {t('premium.upsell.feature5')}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl p-3 border border-rose-200/50 dark:border-rose-700/50">
                    <div className="w-7 h-7 bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg flex items-center justify-center mb-1.5">
                      <Star className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800 dark:text-white">
                      {t('premium.upsell.feature6')}
                    </p>
                  </div>
                </div>

                <motion.button
                  onClick={handlePremiumClick}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white rounded-2xl font-black text-base sm:text-lg shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden mb-4"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    <Crown className="w-5 h-5 text-yellow-300" />
                  </motion.div>
                  
                  <span>{t('premium.upsell.cta')}</span>
                  
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ✨
                  </motion.div>

                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-white/10 rounded-2xl"
                  />
                </motion.button>

                <motion.button
                  onClick={handleClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mb-4"
                >
                  {t('premium.upsell.maybe_later')}
                </motion.button>

                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2 mb-2">
                    <Shield className="w-3.5 h-3.5 text-green-500" />
                    {t('premium.upsell.guarantee')}
                  </p>
                  
                  {showPriceExplanation() && (
                    <p className="text-xs text-gray-500">{t('premium.price_explanation')}</p>
                  )}
                </div>

                <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span>🔒</span>
                    <span className="hidden sm:inline">{t('limit.security.secure_payment')}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span>⚡</span>
                    <span className="hidden sm:inline">{t('limit.security.instant_activation')}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PremiumUpsellModal;
