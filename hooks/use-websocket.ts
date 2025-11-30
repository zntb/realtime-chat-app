/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState } from 'react';
import { WebSocketSingleton } from '@/lib/websocket-singleton';
import { WebSocketClient } from '@/lib/websocket-client';
import type { Message, TypingStatus } from '@/types/chat';

export function useWebSocket(userId: string | undefined) {
  const wsClient = useRef<WebSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Use singleton to ensure only one WebSocket instance exists
    wsClient.current = WebSocketSingleton.getInstance(userId);
    setIsConnected(true);

    return () => {
      // Don't disconnect here - let singleton manage lifecycle
      setIsConnected(false);
    };
  }, [userId]);

  const joinConversation = (conversationId: string) => {
    if (userId) {
      wsClient.current?.joinConversation(conversationId, userId);
    }
  };

  const leaveConversation = (conversationId: string) => {
    if (userId) {
      wsClient.current?.leaveConversation(conversationId, userId);
    }
  };

  const sendMessage = (conversationId: string, content: string, data?: any) => {
    if (userId) {
      wsClient.current?.sendMessage(conversationId, userId, content, data);
    }
  };

  const sendTypingStatus = (conversationId: string, isTyping: boolean) => {
    if (userId) {
      wsClient.current?.sendTypingStatus(conversationId, userId, isTyping);
    }
  };

  const onMessage = (handler: (message: Message) => void) => {
    return wsClient.current?.onMessage(handler);
  };

  const onTyping = (handler: (status: TypingStatus) => void) => {
    return wsClient.current?.onTyping(handler);
  };

  const onReaction = (handler: (data: any) => void) => {
    return wsClient.current?.onReaction(handler);
  };

  return {
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage,
    sendTypingStatus,
    onMessage,
    onTyping,
    onReaction,
  };
}
