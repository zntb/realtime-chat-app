'use client';

import { useState, useCallback } from 'react';
import type { Conversation } from '@/types/chat';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createConversation = useCallback(
    async (participants: string[], name?: string, isGroup?: boolean) => {
      try {
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: isGroup ? name : null,
            participants,
            isGroup: isGroup || false,
          }),
        });

        if (response.ok) {
          const newConversation = await response.json();
          setConversations(prev => [newConversation, ...prev]);
          return newConversation;
        }
      } catch (error) {
        console.error('Failed to create conversation:', error);
      }
    },
    [],
  );

  return {
    conversations,
    isLoading,
    fetchConversations,
    createConversation,
  };
}
