import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, AlertCircle, RotateCcw, Sparkles, Heart, Baby, Brain, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useChat } from '../hooks/useChat';
import { Message, User as UserType, Child } from '../types';

interface ChatInterfaceProps {
  isInitialState: boolean;
  onFirstMessage: () => void;
  user: UserType | null;
  child: Child | null;
  onMessageLimit: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  isInitialState, 
  onFirstMessage, 
  user, 
  child, 
  onMessageLimit 
}) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { messages, isLoading, sendMessage, retryMessage, messagesEndRef } = useChat(
    user, 
    child, 
    onMessageLimit
  );

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const messageToSend = inputValue;
    setInputValue('');

    if (isInitialState) {
      onFirstMessage();
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    try {
      await sendMessage(messageToSend);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Color scheme based on child gender
  const colorScheme = child?.gender === 'female' ? 'pink' : child?.gender === 'male' ? 'blue' : 'purple';
  
  const getGradientClass = () => {
    switch (colorScheme) {
      case 'pink': return 'from-pink-500 to-rose-500';
      case 'blue': return 'from-blue-500 to-cyan-500';
      default: return 'from-purple-500 to-pink-500';
    }
  };

  const getAccentClass = () => {
    switch (colorScheme) {
      case 'pink': return 'from-pink-600 via-rose-500 to-pink-500 dark:from-pink-400 dark:via-rose-400 dark:to-pink-400';
      case 'blue': return 'from-blue-600 via-cyan-500 to-blue-500 dark:from-blue-400 dark:via-cyan-400 dark:to-blue-400';
      default: return 'from-purple-600 via-pink-500 to-purple-500 dark:from-purple-400 dark:via-pink-400 dark:to-purple-400';
    }
  };

  const MessageBubble: React.FC<{ message: Message; index: number }> = ({ message, index }) => (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex max-w-[85%] sm:max-w-[75%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center relative ${
            message.role === 'user'
              ? 'bg-gradient-to-br from-gray-600 to-gray-700 ml-3 shadow-lg'
              : `bg-gradient-to-br ${getGradientClass()} mr-3 shadow-lg animate-pulse`
          }`}
        >
          {message.role === 'user' ? (
            <User className="w-5 h-5 text-white" />
          ) : (
            <Heart className="w-5 h-5 text-white" />
          )}
        </div>

        <div className="flex flex-col">
          <div
            className={`px-6 py-4 rounded-2xl shadow-lg relative backdrop-blur-sm ${
              message.role === 'user'
                ? 'bg-gradient-to-br from-gray-600 to-gray-700 text-white shadow-gray-200 dark:shadow-gray-900/50'
                : 'bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-100 border border-gray-200/50 dark:border-gray-700/50'
            }`}
          >
            <div className={`absolute top-4 ${
              message.role === 'user' ? '-right-2' : '-left-2'
            } w-4 h-4 transform rotate-45 ${
              message.role === 'user'
                ? 'bg-gray-600'
                : 'bg-white/90 dark:bg-gray-800/90 border-l border-b border-gray-200/50 dark:border-gray-700/50'
            }`} />
            
            <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
              {message.content}
            </p>
            
            {message.status === 'error' && (
              <button
                onClick={() => retryMessage(message.id)}
                className="mt-3 flex items-center gap-2 text-xs opacity-75 hover:opacity-100 transition-opacity"
              >
                <RotateCcw className="w-3 h-3" />
                Tentar novamente
              </button>
            )}
          </div>
          
          <div className={`flex items-center gap-2 mt-2 px-2 ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {message.timestamp.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
            
            {message.status === 'sending' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full"
              />
            )}
            
            {message.status === 'error' && (
              <AlertCircle className="w-3 h-3 text-red-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isInitialState) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl mx-auto px-4 sm:px-6 flex flex-col justify-center min-h-screen py-8"
      >
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 sm:mb-8"
          >
            <motion.div
              className="inline-flex items-center justify-center mb-6"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-2xl bg-gradient-to-br ${getGradientClass()} animate-pulse`}>
                <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </motion.div>

            <motion.h1 
              className={`text-4xl sm:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r ${getAccentClass()} mb-4`}
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: 'linear' 
              }}
              style={{ 
                backgroundSize: '200% 100%'
              }}
            >
              {t('landing.title')}
            </motion.h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 font-semibold mb-2">
              {t('landing.subtitle')}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mb-3">
              {t('landing.description')}
            </p>
            <div className="flex items-center justify-center gap-2 mb-2">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                20 mensagens grátis
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                IA Avançada
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Memórias únicas
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12"
          >
            <motion.div 
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300 group"
              whileHover={{ y: -4, scale: 1.02 }}
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${getGradientClass()} rounded-xl flex items-center justify-center mb-4 mx-auto shadow-lg group-hover:animate-bounce`}>
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">{t('landing.features.conversation')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('landing.features.conversation.desc')}</p>
              </div>
            </motion.div>

            <motion.div 
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300 group"
              whileHover={{ y: -4, scale: 1.02 }}
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${getGradientClass()} rounded-xl flex items-center justify-center mb-4 mx-auto shadow-lg group-hover:animate-bounce`}>
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">{t('landing.features.learning')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('landing.features.learning.desc')}</p>
              </div>
            </motion.div>

            <motion.div 
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300 group"
              whileHover={{ y: -4, scale: 1.02 }}
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${getGradientClass()} rounded-xl flex items-center justify-center mb-4 mx-auto shadow-lg group-hover:animate-bounce`}>
                <Heart className="w-7 h-7 text-white" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">{t('landing.features.proactive')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('landing.features.proactive.desc')}</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Input Form */}
        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          onSubmit={handleSubmit}
          className="relative mb-8"
        >
          <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={t('landing.placeholder')}
              className="w-full px-4 sm:px-6 py-4 sm:py-6 text-base sm:text-lg placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none min-h-[80px] max-h-[200px] bg-transparent text-gray-800 dark:text-gray-100"
              rows={1}
              disabled={isLoading}
            />
            
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50/80 dark:bg-gray-900/80 border-t border-gray-200/50 dark:border-gray-700/50">
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {t('landing.start_button')}
              </div>
              
              <motion.button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 ${
                  inputValue.trim() && !isLoading
                    ? `bg-gradient-to-r ${getGradientClass()} hover:shadow-xl animate-pulse`
                    : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </motion.button>
            </div>
          </div>
        </motion.form>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center space-y-2"
        >
          <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
            <p className="font-semibold">Ninna: Onde Amor e Tecnologia se Encontram ❤️</p>
            <p className="italic">Criando laços verdadeiros no mundo digital.</p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col h-full relative pt-20 pb-40">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 mb-32">
        <AnimatePresence>
          {messages.map((message, index) => (
            <MessageBubble key={`${message.id}-${index}`} message={message} index={index} />
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex justify-start mb-6">
            <div className="flex max-w-[85%] sm:max-w-[75%]">
              <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${getGradientClass()} rounded-full flex items-center justify-center mr-3 shadow-lg animate-pulse relative`}>
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                      className={`w-2 h-2 ${colorScheme === 'pink' ? 'bg-pink-400' : 'bg-blue-400'} rounded-full`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Input */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-white/98 dark:bg-gray-900/98 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 z-50 shadow-2xl"
      >
        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
          <div className="flex items-end gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={t('chat.placeholder')}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl resize-none focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 dark:focus:ring-pink-900/50 min-h-[48px] max-h-[120px] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300"
                rows={1}
                disabled={isLoading}
              />
            </div>
            
            <motion.button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 ${
                inputValue.trim() && !isLoading
                  ? `bg-gradient-to-r ${getGradientClass()} hover:shadow-xl animate-pulse`
                  : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ChatInterface;
