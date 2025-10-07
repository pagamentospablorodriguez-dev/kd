import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, User, Child } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

const MAX_RETRIES = 3;
const AI_TIMEOUT = 45000; // 45s
const DAILY_LIMIT = 11;

export const useChat = (user: User | null, child: Child | null, onMessageLimit: () => void) => {
  const { i18n } = useTranslation();

  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const messageCountRef = useRef<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => scrollToBottom(), 100);
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  // Carregar mensagens do cache e do Supabase
  useEffect(() => {
    if (!child) return;

    const cached = localStorage.getItem(`chat-${child.id}`);
    if (cached) {
      const parsed: Message[] = JSON.parse(cached);
      setMessages(parsed);
      messagesRef.current = parsed;
    }

    if (user) {
      loadMessages();
      loadTodayMessageCount();
    }
  }, [user, child]);

  useEffect(() => {
    if (child) {
      localStorage.setItem(`chat-${child.id}`, JSON.stringify(messages));
    }
  }, [messages, child]);

  const loadTodayMessageCount = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'user')
        .gte('created_at', today + 'T00:00:00.000Z')
        .lt('created_at', today + 'T23:59:59.999Z');

      if (error) throw error;

      const count = data?.length || 0;
      setMessageCount(count);
      messageCountRef.current = count;
    } catch (error) {
      console.error('Erro ao contar mensagens:', error);
    }
  };

  const loadMessages = async () => {
    if (!user || !child) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('child_id', child.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formatted: Message[] = data.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role as 'user' | 'assistant',
        timestamp: new Date(msg.created_at),
        status: 'sent',
        message_type: msg.message_type
      }));

      setMessages(formatted);
      messagesRef.current = formatted;

      if (formatted.length === 0) {
        await sendInitialGreeting();
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      if (messagesRef.current.length === 0) await sendInitialGreeting();
    }
  };

  const sendInitialGreeting = async () => {
    if (!user || !child) return;

    const greeting: Message = {
      id: uuidv4(),
      content: generateGreeting(user, child, i18n.language),
      role: 'assistant',
      timestamp: new Date(),
      status: 'sent',
      message_type: 'normal'
    };

    setMessages([greeting]);
    messagesRef.current = [greeting];

    try { await saveMessage(greeting); } 
    catch (e) { console.error('Erro salvando greeting inicial', e); }
  };

  const generateGreeting = (user: User, child: Child, lang: string): string => {
    // Implementar a mesma lógica de saudação que você já tinha
    const hour = new Date().getHours();
    const time = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    return `Hello! I am ${child.name}, your virtual child! Good ${time}!`; // Placeholder simples
  };

  const checkMessageLimit = async (): Promise<boolean> => {
    if (!user) return false;
    if (user.is_premium && user.premium_expires_at && new Date(user.premium_expires_at) > new Date()) return true;
    return messageCountRef.current < DAILY_LIMIT;
  };

  const saveMessage = async (msg: Message) => {
    if (!user || !child) return;
    try {
      await supabase.from('messages').insert({
        user_id: user.id,
        child_id: child.id,
        content: msg.content,
        role: msg.role,
        message_type: msg.message_type || 'normal',
        language: i18n.language
      });

      await supabase.from('user_analytics').insert({
        user_id: user.id,
        event_type: 'message_sent',
        event_data: {
          child_id: child.id,
          message_role: msg.role,
          message_length: msg.content.length,
          language: i18n.language
        }
      });
    } catch (e) { console.error('Erro salvando mensagem:', e); }
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !user || !child) return;

    const canSend = await checkMessageLimit();
    if (!canSend) { onMessageLimit(); return; }

    const userMessage: Message = {
      id: uuidv4(),
      content: content.trim(),
      role: 'user',
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => { messagesRef.current = [...prev, userMessage]; return messagesRef.current; });
    setIsLoading(true);

    try {
      await saveMessage(userMessage);

      const newCount = messageCountRef.current + 1;
      setMessageCount(newCount);
      messageCountRef.current = newCount;

      setMessages(prev => prev.map(m => m.id === userMessage.id ? { ...m, status: 'sent' } : m));
      messagesRef.current = messagesRef.current.map(m => m.id === userMessage.id ? { ...m, status: 'sent' } : m);

      // Enviar para IA com retry
      let attempts = 0;
      let assistantMessage: Message | null = null;
      while(attempts < MAX_RETRIES && !assistantMessage) {
        attempts++;
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT);

          const convHist = messagesRef.current.slice(-10).map(m => ({ sender: m.role, text: m.content }));
          const res = await fetch('/.netlify/functions/kid-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: content,
              conversationHistory: convHist,
              childData: { name: child.name, age: child.age, gender: child.gender === 'female' ? 'girl' : 'boy', userId: user.id },
              userData: { name: user.name, gender: user.gender },
              language: i18n.language
            }),
            signal: controller.signal
          });
          clearTimeout(timeout);
          if (!res.ok) throw new Error('Falha IA');

          const data = await res.json();
          assistantMessage = { id: uuidv4(), content: data.message, role: 'assistant', timestamp: new Date(), status: 'sent' };

          setMessages(prev => { messagesRef.current = [...prev, assistantMessage!]; return messagesRef.current; });
          await saveMessage(assistantMessage);
        } catch (e) {
          if (attempts >= MAX_RETRIES) {
            console.error('Erro IA, max retries atingido', e);
            setMessages(prev => prev.map(m => m.id === userMessage.id ? { ...m, status: 'error' } : m));
          }
        }
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setMessages(prev => prev.map(m => m.id === userMessage.id ? { ...m, status: 'error' } : m));
      const reverted = Math.max(0, messageCountRef.current - 1);
      setMessageCount(reverted);
      messageCountRef.current = reverted;
    } finally {
      setIsLoading(false);
    }
  }, [user, child, onMessageLimit, i18n.language]);

  const retryMessage = useCallback((messageId: string) => {
    const msg = messagesRef.current.find(m => m.id === messageId);
    if (msg && msg.role === 'user') {
      setMessages(prev => { messagesRef.current = prev.filter(m => m.id !== messageId); return messagesRef.current; });
      const reverted = Math.max(0, messageCountRef.current - 1);
      setMessageCount(reverted);
      messageCountRef.current = reverted;
      sendMessage(msg.content);
    }
  }, [sendMessage]);

  return {
    messages,
    isLoading,
    sendMessage,
    retryMessage,
    messagesEndRef,
    messageCount,
    messageLimit: DAILY_LIMIT
  };
};
