import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles, ArrowLeft, LogOut, Users } from 'lucide-react';
import { Child } from '../types';

interface HeaderProps {
  child: Child | null;
  onBackToSelector?: () => void;
  onLogout?: () => void;
  hasMultipleChildren?: boolean;
}

const Header: React.FC<HeaderProps> = ({ child, onBackToSelector, onLogout, hasMultipleChildren }) => {
  if (!child) return null;

  const colorScheme = child.gender === 'female' ? 'pink' : 'blue';
  const gradientClass = colorScheme === 'pink' 
    ? 'from-pink-500 to-rose-500' 
    : 'from-blue-500 to-cyan-500';
  const textClass = colorScheme === 'pink'
    ? 'from-pink-600 to-rose-500'
    : 'from-blue-600 to-cyan-500';

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 px-4 py-3 shadow-sm"
    >
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          {hasMultipleChildren && (
            <motion.button
              onClick={onBackToSelector}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </motion.button>
          )}

          <div className={`w-10 h-10 bg-gradient-to-br ${gradientClass} rounded-xl flex items-center justify-center shadow-lg animate-pulse`}>
            <Heart className="w-5 h-5 text-white" />
          </div>
          
          <div>
            <h1 className={`text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${textClass}`}>
              {child.name}
            </h1>
            <p className="text-xs text-gray-500">
              {child.age} anos • Seu {child.gender === 'female' ? 'filha' : 'filho'} virtual
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasMultipleChildren && (
            <motion.button
              onClick={onBackToSelector}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Trocar de filho"
            >
              <Users className="w-5 h-5 text-gray-600" />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Sparkles className={`w-5 h-5 ${colorScheme === 'pink' ? 'text-pink-500' : 'text-blue-500'}`} />
          </motion.button>

          <motion.button
            onClick={onLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Sair"
          >
            <LogOut className="w-5 h-5 text-gray-600" />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
