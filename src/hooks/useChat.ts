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
  const [loading, setLoading] = useState(false);
  const [child, setChild] = useState<Child | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(20); // Default limit for non-premium users
  const { t, i18n } = useTranslation();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchChildData = useCallback(async () => {
    if (!childId) return;
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
      setChild(childData as Child);
      setIsPremium(childData.users.is_premium);
      setMessageCount(childData.users.daily_message_count);

      // Reset daily message count if it's a new day
      const lastMessageDate = new Date(childData.users.last_message_date);
      const today = new Date();
      if (lastMessageDate.toDateString() !== today.toDateString()) {
        setMessageCount(0);
      }
    }
  }, [childId, t]);

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

    const messageSubscription = supabase
      .channel(`messages:${childId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `child_id=eq.${childId}` },
        (payload) => {
          setMessages((prevMessages) => [...prevMessages, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [childId, session, fetchChildData, fetchMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !childId || !session || loading) return;

    // Check daily limit for non-premium users
    if (!isPremium && messageCount >= dailyLimit) {
      setShowLimitModal(true);
      return;
    }

    setLoading(true);
    const userMessage: Message = {
      id: Math.random().toString(), // Temporary ID
      content: input,
      role: 'user',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      // Save user message to DB
      const { error: userMessageError } = await supabase.from('messages').insert({
        user_id: session.user.id,
        child_id: childId,
        content: userMessage.content,
        role: 'user',
        language: i18n.language,
      });
      if (userMessageError) throw userMessageError;

      // Increment message count
      const { error: countError } = await supabase.rpc('increment_message_count', { user_id_param: session.user.id });
      if (countError) console.error('Error incrementing message count:', countError);
      setMessageCount((prev) => prev + 1);

      // Call AI function
      abortControllerRef.current = new AbortController();
      const { data, error: aiError } = await supabase.functions.invoke('chat-ai', {
        body: JSON.stringify({
          childId,
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          user_id: session.user.id,
          user_language: i18n.language,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (aiError) throw aiError;

      const aiMessage: Message = {
        id: Math.random().toString(), // Temporary ID
        content: data.response,
        role: 'assistant',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Save AI message to DB
      const { error: aiMessageError } = await supabase.from('messages').insert({
        user_id: session.user.id,
        child_id: childId,
        content: aiMessage.content,
        role: 'assistant',
        language: i18n.language,
        tokens_used: data.tokens_used || 0,
      });
      if (aiMessageError) throw aiMessageError;

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Message send aborted');
      } else {
        console.error('Error sending message:', error);
        toast.error(t('chat.apiError'));
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  return {
    messages,
    input,
    setInput,
    loading,
    handleSendMessage,
    child,
    isPremium,
    messageCount,
    dailyLimit,
  };
};

export default useChat;
