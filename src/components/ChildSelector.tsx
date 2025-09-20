import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Heart, LogOut, Sparkles, Crown, Zap, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Child } from '../types';

interface ChildSelectorProps {
  children: Child[];
  onSelectChild: (child: Child) => void;
  onCreateNew: () => void;
  onLogout: () => void;
}

const ChildSelector: React.FC<ChildSelectorProps> = ({
  children,
  onSelectChild,
  onCreateNew,
  onLogout
}) => {
  const { t, i18n } = useTranslation();

  const getChildGradient = (gender: 'male' | 'female') => {
    return gender === 'female' ? 'from-pink-500 to-rose-500' : 'from-blue-500 to-cyan-500';
  };

  const getChildBg = (gender: 'male' | 'female') => {
    return gender === 'female' ? 'from-pink-50 to-rose-50' : 'from-blue-50 to-cyan-50';
  };

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
    return isPtBR ? 'R$ 29/mês' : '$29/month';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-pink-50/20 flex flex-col p-4">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-between items-center mb-8 pt-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {t('children.select')}
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            {t('children.choose_child')}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Premium CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 p-6 rounded-3xl shadow-2xl text-white relative overflow-hidden"
      >
        {/* Animated background */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, -10, 10, 0]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute -bottom-16 -left-16 w-32 h-32 bg-white/5 rounded-full blur-2xl"
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
              >
                <Crown className="w-6 h-6 text-yellow-300" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold">{t('premium.cta_title')}</h2>
                <p className="text-white/80 text-sm">{t('premium.cta_subtitle')}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-300">{getPriceDisplay()}</div>
            </div>
          </div>

          <div className="mb-4 text-sm text-white/90">
            <p className="mb-2">{t('premium.features_preview')}</p>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-300" />
                {t('premium.free_limit')}
              </span>
            </div>
          </div>

          <motion.button
            onClick={handlePremiumClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white py-3 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Crown className="w-5 h-5 text-yellow-300" />
            {t('premium.cta_button')}
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="ml-1"
            >
              ✨
            </motion.div>
          </motion.button>
        </div>
      </motion.div>

      {/* Children Grid */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-8">
          {children.map((child, index) => (
            <motion.button
              key={child.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
              onClick={() => onSelectChild(child)}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className={`relative bg-gradient-to-br ${getChildBg(child.gender)} p-6 rounded-2xl shadow-lg border border-white/50 hover:shadow-2xl transition-all duration-300 text-left group overflow-hidden`}
            >
              {/* Sparkle effect */}
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.2, 1] 
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: 'linear'
                }}
                className="absolute top-3 right-3 opacity-60"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
              </motion.div>

              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${getChildGradient(child.gender)} rounded-xl flex items-center justify-center shadow-md group-hover:animate-pulse`}>
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    {child.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {child.age} {t('children.years_old')} • {child.gender === 'female' ? t('children.daughter') : t('children.son')}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {child.total_conversations} {t('children.conversations')}
                  </p>
                </div>
              </div>

              {/* Hover effect */}
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                whileHover={{ x: 0, opacity: 1 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />
            </motion.button>
          ))}

          {/* Create New Child Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: children.length * 0.1 + 0.3 }}
            onClick={onCreateNew}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl shadow-lg border-2 border-dashed border-gray-300 hover:border-purple-400 hover:shadow-2xl transition-all duration-300 text-center group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:animate-bounce">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-1">
              {t('children.create_new')}
            </h3>
            <p className="text-sm text-gray-500">
              {t('children.add_child')}
            </p>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChildSelector;
