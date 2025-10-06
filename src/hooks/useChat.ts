import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

interface Child {
  id: string;
  name: string;
  age: number;
  gender: string;
  personality_traits: string[];
  favorite_things: string[];
  birthday: string | null;
}

// É preciso definir o tipo para os dados do usuário que vêm aninhados
interface UserData {
    is_premium: boolean;
    daily_message_count: number;
    last_message_date: string;
}

interface ChildWithUser extends Child {
    users: UserData;
}

const useChat = (childId: string | undefined, session: Session | null, setShowLimitModal: (show: boolean) => void) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true); // Começa como true para o carregamento inicial
  const [child, setChild] = useState<Child | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const dailyLimit = 20;
  const { t, i18n } = useTranslation();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchChildData = useCallback(async () => {
    if (!childId || !session) return;
    
    const { data, error } = await supabase
      .from('children')
      .select('*, users(is_premium, daily_message_count, last_message_date)')
      .eq('id', childId)
      .single();

    if (error) {
      console.error('Error fetching child data:', error);
      toast.error(t('chat.fetchChildError'));
    } else if (data) {
      const childData = data as ChildWithUser;
      setChild(childData);
      
      if (childData.users) {
        setIsPremium(childData.users.is_premium);
        const lastMessageDate = new Date(childData.users.last_message_date);
        const today = new Date();
        if (lastMessageDate.toDateString() !== today.toDateString()) {
          setMessageCount(0);
        } else {
          setMessageCount(childData.users.daily_message_count);
        }
      }
    }
  }, [childId, session, t]);

  const fetchMessages = useCallback(async () => {
    if (!childId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('id, content, role, created_at')
      .eq('child_id', childId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      toast.error(t('chat.fetchMessagesError'));
    } else {
      setMessages(data || []);
    }
    setLoading(false);
  }, [childId, t]);

  useEffect(() => {
    if (childId && session) {
      fetchChildData();
      fetchMessages();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && childId && session) {
        fetchChildData();
        fetchMessages();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const messageSubscription = supabase
      .channel(`messages:${childId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `child_id=eq.${childId}` },
        (payload) => {
          setMessages((prevMessages) => {
            if (prevMessages.some(msg => msg.id === payload.new.id)) {
              return prevMessages;
            }
            return [...prevMessages, payload.new as Message];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [childId, session, fetchChildData, fetchMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !childId || !session || loading) return;

    if (!isPremium && messageCount >= dailyLimit) {
      setShowLimitModal(true);
      return;
    }

    const userMessageContent = input;
    const tempId = `temp-${Date.now()}`;
    const userMessage: Message = {
      id: tempId,
      content: userMessageContent,
      role: 'user',
      created_at: new Date().toISOString(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data: insertedMessage, error: userMessageError } = await supabase.from('messages').insert({
        user_id: session.user.id,
        child_id: childId,
        content: userMessageContent,
        role: 'user',
        language: i18n.language,
      }).select().single();

      if (userMessageError) throw userMessageError;

      setMessages(prev => prev.map(m => m.id === tempId ? insertedMessage as Message : m));
      
      const { error: countError } = await supabase.rpc('increment_message_count', { user_id_param: session.user.id });
      if (countError) console.error('Error incrementing count:', countError);
      else setMessageCount(mc => mc + 1);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].slice(-10),
          child,
          userLanguage: i18n.language,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('chat.apiError'));
      }

      const aiResponseContent = await response.json();

      await supabase.from('messages').insert({
        user_id: session.user.id,
        child_id: childId,
        content: aiResponseContent.response,
        role: 'assistant',
        language: i18n.language,
      });

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error sending message:', error);
        toast.error(error.message);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  return { messages, input, setInput, loading, handleSendMessage, child };
};

export default useChat;
