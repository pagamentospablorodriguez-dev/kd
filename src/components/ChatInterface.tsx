import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Heart, RotateCcw, AlertCircle, Sparkles, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useChat } from '../hooks/useChat';
import { Message, User as UserType, Child } from '../types';

interface ChatInterfaceProps {
  isInitialState: boolean;
  onFirstMessage: () => void;
  user: UserType | null;
  child: Child | null;
  onMessageLimit: () => void;
  onShowAuth: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  isInitialState,
  onFirstMessage,
  user,
  child,
  onMessageLimit,
  onShowAuth
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
    if (inputRef.current && !isInitialState) inputRef.current.focus();
  }, [isInitialState, child]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim() || isLoading) return;

      const messageToSend = inputValue.trim();
      setInputValue('');

      if (isInitialState) {
        onFirstMessage();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      try {
        await sendMessage(messageToSend);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    },
    [inputValue, isLoading, isInitialState, onFirstMessage, sendMessage]
  );

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Color scheme
  const colorScheme =
    child?.gender === 'female' ? 'pink' : child?.gender === 'male' ? 'blue' : 'purple';

  const getGradientClass = () => {
    switch (colorScheme) {
      case 'pink':
        return 'from-pink-500 to-rose-500';
      case 'blue':
        return 'from-blue-500 to-cyan-500';
      default:
        return 'from-purple-500 to-pink-500';
    }
  };

  const MessageBubble: React.FC<{ message: Message; index: number }> = ({ message }) => (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[85%] sm:max-w-[75%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center relative ${
            message.role === 'user'
              ? 'bg-gradient-to-br from-gray-700 to-gray-800 ml-3 shadow-lg'
              : `bg-gradient-to-br ${getGradientClass()} mr-3 shadow-lg animate-pulse`
          }`}
        >
          {message.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Heart className="w-5 h-5 text-white" />}
        </div>

        <div className="flex flex-col">
          <div
            className={`px-4 py-3 rounded-2xl shadow-lg relative backdrop-blur-sm ${
              message.role === 'user'
                ? 'bg-gradient-to-br from-gray-700 to-gray-800 text-white'
                : 'bg-white/90 text-gray-800 border border-gray-200/50'
            }`}
          >
            <div
              className={`absolute top-3 ${message.role === 'user' ? '-right-2' : '-left-2'} w-4 h-4 transform rotate-45 ${
                message.role === 'user' ? 'bg-gray-700' : 'bg-white/90 border-l border-b border-gray-200/50'
              }`}
            />
            <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{message.content}</p>

            {message.status === 'error' && (
              <button
                onClick={() => retryMessage(message.id)}
                className="mt-2 flex items-center gap-2 text-xs opacity-75 hover:opacity-100 transition-opacity animate-pulse"
              >
                <RotateCcw className="w-3 h-3" />
                {t('chat.retry')}
              </button>
            )}
          </div>

          <div className={`flex items-center gap-2 mt-1 px-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs text-gray-400">
              {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {message.status === 'sending' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full"
              />
            )}
            {message.status === 'error' && <AlertCircle className="w-3 h-3 text-red-400 animate-pulse" />}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`flex flex-col h-full relative pt-20 min-h-screen bg-gradient-to-b ${getGradientClass()}`}
    >
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-32 space-y-2">
        <AnimatePresence>
          {messages.map((message, index) => (
            <MessageBubble key={`${message.id}-${index}`} message={message} index={index} />
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="flex max-w-[85%] sm:max-w-[75%]">
              <div
                className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${getGradientClass()} rounded-full flex items-center justify-center mr-3 shadow-lg animate-pulse relative`}
              >
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white/90 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-lg border border-gray-200/50">
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      className={`w-2 h-2 ${colorScheme === 'pink' ? 'bg-pink-400' : colorScheme === 'blue' ? 'bg-blue-400' : 'bg-purple-400'} rounded-full`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-xl border-t border-gray-200/50 z-50 shadow-2xl safe-area-bottom"
      >
        <div className="p-4 max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={t('chat.placeholder')}
              className="flex-1 px-4 py-3 border border-gray-200 bg-white/90 backdrop-blur-sm rounded-xl resize-none focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 min-h-[48px] max-h-[120px] text-gray-800 placeholder-gray-400 transition-all duration-300"
              rows={1}
              disabled={isLoading}
            />

            <motion.button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 ${
                inputValue.trim() && !isLoading
                  ? `bg-gradient-to-r ${getGradientClass()} hover:shadow-xl animate-pulse`
                  : 'bg-gray-300 cursor-not-allowed'
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
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatInterface;
