import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ExternalLink, Heart, Sparkles, Instagram, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AboutPageProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/20"
        >
          <div className="min-h-screen overflow-y-auto">
            
            {/* Header */}
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 px-4 py-4"
            >
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">{t('about.back_to_app')}</span>
                </button>
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <img src="/ninna.png" alt="Ninna" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Ninna
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
              
              {/* Title Section */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-12"
              >
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 mb-6">
                  {t('about.title')}
                </h1>
                
                <div className="flex items-center justify-center gap-4 mb-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-8 h-8 text-purple-500" />
                  </motion.div>
                  <div className="w-16 h-12 flex items-center justify-center">
                    <img src="/ninna.png" alt="Ninna" className="w-full h-full object-contain" />
                  </div>
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  >
                    <Heart className="w-8 h-8 text-pink-500" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Story Content */}
              <div className="space-y-8">
                
                {/* Vision Section */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50"
                >
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                    <Heart className="w-6 h-6 text-purple-500" />
                    {t('about.intro_title')}
                  </h2>
                  <p className="text-gray-700 leading-relaxed text-lg mb-4">
                    {t('about.intro_text')}
                  </p>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {t('about.vision_text')}
                  </p>
                </motion.div>

                {/* Purpose Section */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200/50"
                >
                  <p className="text-gray-700 leading-relaxed text-lg mb-4">
                    {t('about.purpose_text')}
                  </p>
                  <div className="bg-white/60 rounded-xl p-4 border border-purple-200/30">
                    <p className="text-purple-800 leading-relaxed text-lg font-semibold">
                      {t('about.mission_text')}
                    </p>
                  </div>
                </motion.div>

                {/* Creator Section */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-br from-gray-900 to-purple-900 rounded-2xl p-8 text-white relative overflow-hidden"
                >
                  {/* Background Effects */}
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
                    className="absolute -top-20 -right-20 w-40 h-40 bg-white/5 rounded-full blur-3xl"
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
                    className="absolute -bottom-16 -left-16 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl"
                  />

                  <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                      <Sparkles className="w-8 h-8 text-yellow-300" />
                      {t('about.creator_title')}
                    </h2>
                    <p className="text-gray-200 leading-relaxed text-lg mb-6">
                      {t('about.creator_intro')}
                    </p>
                    <p className="text-white leading-relaxed text-lg mb-8">
                      {t('about.creator_message')}
                    </p>

                    {/* Contact Section */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                      <h3 className="text-xl font-bold mb-4 text-yellow-300">
                        {t('about.connect_title')}
                      </h3>
                      
                      <div className="space-y-3">
                        <motion.a
                          href="https://www.instagram.com/pabeduardo"
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-3 text-white hover:text-pink-300 transition-colors"
                        >
                          <Instagram className="w-5 h-5" />
                          <span className="font-medium">{t('about.instagram')}: @pabeduardo</span>
                          <ExternalLink className="w-4 h-4" />
                        </motion.a>
                        
                        <motion.a
                          href="mailto:contact@ninna.pro"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-3 text-white hover:text-blue-300 transition-colors"
                        >
                          <Mail className="w-5 h-5" />
                          <span className="font-medium">{t('about.email')}: contact@ninna.pro</span>
                        </motion.a>
                      </div>
                    </div>
                  </div>
                </motion.div>

              </div>

              {/* Bottom Spacing */}
              <div className="h-16"></div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AboutPage;
