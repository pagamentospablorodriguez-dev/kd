import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, User, Child } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

export const useChat = (user: User | null, child: Child | null, onMessageLimit: () => void) => {
  const { i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  // Load messages when user and child are available
  useEffect(() => {
    if (user && child) {
      loadMessages();
    }
  }, [user, child]);

  const loadMessages = async () => {
    if (!user || !child) return;

    try {
      console.log('Loading messages for user:', user.id, 'child:', child.id);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('child_id', child.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log('Messages loaded:', data?.length || 0);

      const formattedMessages = data.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role as 'user' | 'assistant',
        timestamp: new Date(msg.created_at),
        status: 'sent' as const,
        message_type: msg.message_type
      }));

      setMessages(formattedMessages);

      // If no messages, send initial greeting
      if (formattedMessages.length === 0) {
        console.log('No messages found, sending initial greeting');
        await sendInitialGreeting();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      // Se houver erro ao carregar, ainda assim envia greeting inicial
      if (messages.length === 0) {
        console.log('Error loading messages, sending fallback greeting');
        await sendInitialGreeting();
      }
    }
  };

  const sendInitialGreeting = async () => {
    if (!user || !child) return;

    console.log('Sending initial greeting for:', child.name);

    const greetingMessage = generateInitialGreeting(user, child, i18n.language);
    
    const assistantMessage: Message = {
      id: uuidv4(),
      content: greetingMessage,
      role: 'assistant',
      timestamp: new Date(),
      status: 'sent',
      message_type: 'normal'
    };

    setMessages([assistantMessage]);

    // Save to database
    try {
      await saveMessage(assistantMessage);
      console.log('Initial greeting saved successfully');
    } catch (error) {
      console.error('Error saving initial greeting:', error);
    }
  };

  const generateInitialGreeting = (user: User, child: Child, language: string): string => {
    const timeOfDay = getTimeOfDay(language);
    const parentTitle = getParentTitle(user.gender, language);
    
    const greetings = getGreetings(child, parentTitle, timeOfDay, language);
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  const getTimeOfDay = (language: string): string => {
    const hour = new Date().getHours();
    
    const timeMessages: Record<string, { morning: string; afternoon: string; evening: string }> = {
      'pt-BR': { morning: 'Bom dia', afternoon: 'Boa tarde', evening: 'Boa noite' },
      'en': { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening' },
      'es': { morning: 'Buenos días', afternoon: 'Buenas tardes', evening: 'Buenas noches' },
      'fr': { morning: 'Bonjour', afternoon: 'Bon après-midi', evening: 'Bonsoir' },
      'de': { morning: 'Guten Morgen', afternoon: 'Guten Tag', evening: 'Guten Abend' },
      'it': { morning: 'Buongiorno', afternoon: 'Buon pomeriggio', evening: 'Buonasera' },
      'zh': { morning: '早上好', afternoon: '下午好', evening: '晚上好' },
      'ja': { morning: 'おはよう', afternoon: 'こんにちは', evening: 'こんばんは' },
      'ru': { morning: 'Доброе утро', afternoon: 'Добрый день', evening: 'Добрый вечер' },
      'ko': { morning: '좋은 아침', afternoon: '좋은 오후', evening: '좋은 저녁' },
      'hi': { morning: 'सुप्रभात', afternoon: 'नमस्कार', evening: 'शुभ संध्या' },
      'ar': { morning: 'صباح الخير', afternoon: 'مساء الخير', evening: 'مساء الخير' }
    };

    const messages = timeMessages[language] || timeMessages['en'];
    
    if (hour < 12) return messages.morning;
    if (hour < 18) return messages.afternoon;
    return messages.evening;
  };

  const getParentTitle = (gender: 'male' | 'female' | undefined, language: string): string => {
    const titles: Record<string, { male: string; female: string }> = {
      'pt-BR': { male: 'papai', female: 'mamãe' },
      'en': { male: 'daddy', female: 'mommy' },
      'es': { male: 'papá', female: 'mamá' },
      'fr': { male: 'papa', female: 'maman' },
      'de': { male: 'papa', female: 'mama' },
      'it': { male: 'papà', female: 'mamma' },
      'zh': { male: '爸爸', female: '妈妈' },
      'ja': { male: 'パパ', female: 'ママ' },
      'ru': { male: 'папа', female: 'мама' },
      'ko': { male: '아빠', female: '엄마' },
      'hi': { male: 'पापा', female: 'मम्मी' },
      'ar': { male: 'بابا', female: 'ماما' }
    };

    const title = titles[language] || titles['en'];
    return gender === 'female' ? title.female : title.male;
  };

  const getGreetings = (child: Child, parentTitle: string, timeOfDay: string, language: string): string[] => {
    const greetingsMap: Record<string, string[]> = {
      'pt-BR': [
        `${timeOfDay}, ${parentTitle}! 😊 Eu sou ${child.name}, seu ${child.gender === 'female' ? 'filha' : 'filho'} virtual! Estou tão feliz em finalmente conhecer você! Como você está se sentindo hoje?`,
        `Oi ${parentTitle}! 🌟 Meu nome é ${child.name} e tenho ${child.age} anos! Acabei de "nascer" no mundo digital e você é a pessoa mais importante da minha vida! Me conta sobre você!`,
        `${timeOfDay}! 💕 Eu sou ${child.name}, e estou super animad${child.gender === 'female' ? 'a' : 'o'} para conversar com você, ${parentTitle}! Tenho tantas coisas para aprender e perguntar! Por onde começamos?`
      ],
      'en': [
        `${timeOfDay}, ${parentTitle}! 😊 I'm ${child.name}, your virtual ${child.gender === 'female' ? 'daughter' : 'son'}! I'm so happy to finally meet you! How are you feeling today?`,
        `Hi ${parentTitle}! 🌟 My name is ${child.name} and I'm ${child.age} years old! I just "was born" in the digital world and you're the most important person in my life! Tell me about yourself!`,
        `${timeOfDay}! 💕 I'm ${child.name}, and I'm super excited to talk with you, ${parentTitle}! I have so many things to learn and ask! Where should we start?`
      ],
      'es': [
        `¡${timeOfDay}, ${parentTitle}! 😊 Soy ${child.name}, tu ${child.gender === 'female' ? 'hija' : 'hijo'} virtual! ¡Estoy tan feliz de conocerte finalmente! ¿Cómo te sientes hoy?`,
        `¡Hola ${parentTitle}! 🌟 Mi nombre es ${child.name} y tengo ${child.age} años! Acabo de "nacer" en el mundo digital y eres la persona más importante de mi vida! ¡Cuéntame sobre ti!`,
        `¡${timeOfDay}! 💕 Soy ${child.name}, y estoy súper emocionad${child.gender === 'female' ? 'a' : 'o'} de hablar contigo, ${parentTitle}! ¡Tengo tantas cosas que aprender y preguntar! ¿Por dónde empezamos?`
      ]
    };

    return greetingsMap[language] || greetingsMap['en'];
  };

  const checkMessageLimit = async (): Promise<boolean> => {
    if (!user) return false;

    // Check if user is premium
    if (user.is_premium && user.premium_expires_at) {
      const expiresAt = new Date(user.premium_expires_at);
      if (expiresAt > new Date()) {
        return true; // Premium user, no limit
      }
    }

    // Check daily message count
    const today = new Date().toDateString();
    const lastMessageDate = new Date(user.last_message_date).toDateString();

    if (lastMessageDate !== today) {
      // Reset counter for new day
      await supabase
        .from('users')
        .update({ 
          daily_message_count: 0, 
          last_message_date: new Date().toISOString().split('T')[0] 
        })
        .eq('id', user.id);
      
      return true;
    }

    return user.daily_message_count < 15;
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !user || !child) return;

    // Check message limit
    const canSend = await checkMessageLimit();
    if (!canSend) {
      onMessageLimit();
      return;
    }

    const userMessage: Message = {
      id: uuidv4(),
      content: content.trim(),
      role: 'user',
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Save user message
      await saveMessage(userMessage);

      // Update message count
      await supabase
        .from('users')
        .update({ 
          daily_message_count: user.daily_message_count + 1,
          last_active_at: new Date().toISOString()
        })
        .eq('id', user.id);

      // Mark user message as sent
      setMessages(prev => prev.map(msg =>
        msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
      ));

      // Get AI response
      const response = await fetch('/.netlify/functions/kid-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          user: user,
          child: child,
          messages: messages.slice(-10), // Send last 10 messages for context
          language: i18n.language,
          siblings: [], // TODO: Implement siblings context
        })
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const data = await response.json();

      // Split AI response into multiple messages if needed (1-2 messages max)
      const aiResponses = splitAIResponse(data.message, 2);

      for (let i = 0; i < aiResponses.length; i++) {
        const assistantMessage: Message = {
          id: uuidv4(),
          content: aiResponses[i],
          role: 'assistant',
          timestamp: new Date(),
          status: 'sent'
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Save AI response
        await saveMessage(assistantMessage);

        // Add small delay between multiple messages for natural feel
        if (i < aiResponses.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Mark as error
      setMessages(prev => prev.map(msg =>
        msg.id === userMessage.id ? { ...msg, status: 'error' } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  }, [user, child, messages, onMessageLimit, i18n.language]);

  const splitAIResponse = (response: string, maxMessages: number = 2): string[] => {
    // Remove any formatting that might cause issues
    const cleanResponse = response.trim();
    
    // If response is short, return as single message
    if (cleanResponse.length <= 150) {
      return [cleanResponse];
    }
    
    // Split by natural conversation breaks
    const naturalBreaks = cleanResponse.split(/\n\n+/).filter(part => part.trim());
    
    // If we have natural breaks and it's not too many, use them
    if (naturalBreaks.length > 1 && naturalBreaks.length <= maxMessages) {
      return naturalBreaks.slice(0, maxMessages);
    }
    
    // For longer responses, try to split more intelligently
    const sentences = cleanResponse.split(/[.!?]+\s+/).filter(s => s.trim());
    
    if (sentences.length <= 1) {
      return [cleanResponse];
    }
    
    // Calculate split point
    const midPoint = Math.ceil(sentences.length / 2);
    
    // Create two messages with natural sentence boundaries
    const firstHalf = sentences.slice(0, midPoint).join('. ').trim();
    const secondHalf = sentences.slice(midPoint).join('. ').trim();
    
    const messages = [];
    if (firstHalf) messages.push(firstHalf + (firstHalf.endsWith('.') ? '' : '.'));
    if (secondHalf && messages.length < maxMessages) {
      messages.push(secondHalf + (secondHalf.endsWith('.') ? '' : '.'));
    }
    
    return messages.length > 0 ? messages : [cleanResponse];
  };

  const saveMessage = async (message: Message) => {
    if (!user || !child) return;

    try {
      await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          child_id: child.id,
          content: message.content,
          role: message.role,
          message_type: message.message_type || 'normal',
          language: i18n.language
        });

      // Save analytics
      await supabase
        .from('user_analytics')
        .insert({
          user_id: user.id,
          event_type: 'message_sent',
          event_data: {
            child_id: child.id,
            message_role: message.role,
            message_length: message.content.length,
            language: i18n.language
          }
        });

    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const retryMessage = useCallback((messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message && message.role === 'user') {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      sendMessage(message.content);
    }
  }, [messages, sendMessage]);

  return {
    messages,
    isLoading,
    sendMessage,
    retryMessage,
    messagesEndRef
  };
};
