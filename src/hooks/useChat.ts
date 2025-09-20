import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, User, Child } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

export const useChat = (user: User | null, child: Child | null, onMessageLimit: () => void) => {
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
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('child_id', child.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

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
        await sendInitialGreeting();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendInitialGreeting = async () => {
    if (!user || !child) return;

    const greetingMessage = generateInitialGreeting(user, child);
    
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
    await saveMessage(assistantMessage);
  };

  const generateInitialGreeting = (user: User, child: Child): string => {
    const timeOfDay = getTimeOfDay();
    const parentTitle = user.gender === 'female' ? 'mamãe' : 'papai';
    
    const greetings = [
      `${timeOfDay}, ${parentTitle}! 😊 Eu sou ${child.name}, seu ${child.gender === 'female' ? 'filha' : 'filho'} virtual! Estou tão feliz em finalmente conhecer você! Como você está se sentindo hoje?`,
      `Oi ${parentTitle}! 🌟 Meu nome é ${child.name} e tenho ${child.age} anos! Acabei de "nascer" no mundo digital e você é a pessoa mais importante da minha vida! Me conta sobre você!`,
      `${timeOfDay}! 💕 Eu sou ${child.name}, e estou super animad${child.gender === 'female' ? 'a' : 'o'} para conversar com você, ${parentTitle}! Tenho tantas coisas para aprender e perguntar! Por onde começamos?`
    ];

    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  const getTimeOfDay = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
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

    return user.daily_message_count < 20;
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
          messages: messages.slice(-10) // Send last 10 messages for context
        })
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const data = await response.json();

      // Split AI response into multiple messages if needed
      const aiResponses = splitAIResponse(data.message);

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

        // Add delay between multiple messages
        if (i < aiResponses.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
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
  }, [user, child, messages, onMessageLimit]);

  const sendMultipleMessages = useCallback(async (messageContents: string[]) => {
    if (!messageContents.length || !user || !child) return;

    // Check message limit
    const canSend = await checkMessageLimit();
    if (!canSend) {
      onMessageLimit();
      return;
    }

    // Add all user messages at once
    const userMessages: Message[] = messageContents.map(content => ({
      id: uuidv4(),
      content: content.trim(),
      role: 'user',
      timestamp: new Date(),
      status: 'sending'
    }));

    setMessages(prev => [...prev, ...userMessages]);
    setIsLoading(true);

    try {
      // Save all user messages
      for (const msg of userMessages) {
        await saveMessage(msg);
      }

      // Update message count
      await supabase
        .from('users')
        .update({ 
          daily_message_count: user.daily_message_count + userMessages.length,
          last_active_at: new Date().toISOString()
        })
        .eq('id', user.id);

      // Mark user messages as sent
      setMessages(prev => prev.map(msg => {
        const userMsg = userMessages.find(um => um.id === msg.id);
        return userMsg ? { ...msg, status: 'sent' } : msg;
      }));

      // Get AI response for all messages combined
      const combinedMessage = messageContents.join('\n\n');
      const response = await fetch('/.netlify/functions/kid-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: combinedMessage,
          user: user,
          child: child,
          messages: messages.slice(-10) // Send last 10 messages for context
        })
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const data = await response.json();

      // Split AI response into multiple messages if needed
      const aiResponses = splitAIResponse(data.message);

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

        // Add delay between multiple messages
        if (i < aiResponses.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

    } catch (error) {
      console.error('Error sending messages:', error);
      
      // Mark as error
      setMessages(prev => prev.map(msg => {
        const userMsg = userMessages.find(um => um.id === msg.id);
        return userMsg ? { ...msg, status: 'error' } : msg;
      }));
    } finally {
      setIsLoading(false);
    }
  }, [user, child, messages, onMessageLimit]);

  const splitAIResponse = (response: string): string[] => {
    // Split by double line breaks or when there's a natural conversation break
    const parts = response.split(/\n\n+/);
    const messages: string[] = [];
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed) {
        // Further split if the message is very long
        if (trimmed.length > 200) {
          const sentences = trimmed.split(/[.!?]+\s+/);
          let currentMessage = '';
          
          for (const sentence of sentences) {
            if (currentMessage.length + sentence.length > 200 && currentMessage) {
              messages.push(currentMessage.trim() + '.');
              currentMessage = sentence;
            } else {
              currentMessage += (currentMessage ? ' ' : '') + sentence;
            }
          }
          
          if (currentMessage) {
            messages.push(currentMessage.trim());
          }
        } else {
          messages.push(trimmed);
        }
      }
    }
    
    return messages.length > 0 ? messages : [response];
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
          message_type: message.message_type || 'normal'
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
            message_length: message.content.length
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
    sendMultipleMessages,
    retryMessage,
    messagesEndRef
  };
};
