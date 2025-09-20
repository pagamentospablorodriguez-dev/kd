import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import { Child } from '../types';

interface HeaderProps {
  child: Child | null;
}

const Header: React.FC<HeaderProps> = ({ child }) => {
  if (!child) return null;

  const colorScheme = child.gender === 'female' ? 'pink' : 'blue';
  const gradientClass = colorScheme === 'pink' 
    ? 'from-pink-500 to-rose-500' 
    : 'from-blue-500 to-cyan-500';
  const textClass = colorScheme === 'pink'
    ? 'from-pink-600 to-rose-500 dark:from-pink-400 dark:to-rose-400'
    : 'from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400';

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 px-6 py-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <div className={`w-10 h-10 bg-gradient-to-br ${gradientClass} rounded-xl flex items-center justify-center shadow-lg animate-pulse`}>
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${textClass}`}>
              {child.name}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {child.age} anos • Seu {child.gender === 'female' ? 'filha' : 'filho'} virtual
            </p>
          </div>
        </motion.div>

        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Sparkles className={`w-5 h-5 ${colorScheme === 'pink' ? 'text-pink-500' : 'text-blue-500'}`} />
        </motion.button>
      </div>
    </motion.header>
  );
};

export default Header;
