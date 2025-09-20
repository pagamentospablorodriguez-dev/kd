import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Heart, LogOut, Baby, Sparkles } from 'lucide-react';
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
  const { t } = useTranslation();

  const getChildGradient = (gender: 'male' | 'female') => {
    return gender === 'female' ? 'from-pink-500 to-rose-500' : 'from-blue-500 to-cyan-500';
  };

  const getChildBg = (gender: 'male' | 'female') => {
    return gender === 'female' ? 'from-pink-50 to-rose-50' : 'from-blue-50 to-cyan-50';
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
          <h1 className="text-2xl font-bold text-gray-800">
            {t('children.select')}
          </h1>
          <p className="text-gray-600 text-sm">
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

      {/* Children Grid */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-8">
          {children.map((child, index) => (
            <motion.button
              key={child.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelectChild(child)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`relative bg-gradient-to-br ${getChildBg(child.gender)} p-6 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 text-left group overflow-hidden`}
            >
              {/* Sparkle effect */}
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1] 
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
                    {child.age} anos • {child.gender === 'female' ? 'Filha' : 'Filho'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {child.total_conversations} conversas
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
            transition={{ delay: children.length * 0.1 }}
            onClick={onCreateNew}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl shadow-lg border-2 border-dashed border-gray-300 hover:border-purple-400 hover:shadow-xl transition-all duration-300 text-center group"
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

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50"
        >
          <div className="flex items-center justify-center gap-2 text-xs text-gray-600 mb-2">
            <Baby className="w-4 h-4" />
            <span>{t('children.limit_info')}</span>
          </div>
          <p className="text-xs text-gray-500">
            {t('children.daily_limit')}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ChildSelector;
