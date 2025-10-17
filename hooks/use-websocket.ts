/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState } from 'react';
import { WebSocketClient } from '@/lib/websocket-client';
import type { Message, TypingStatus } from '@/types/chat';

export function useWebSocket(userId: string | undefined) {
  const wsClient = useRef<WebSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    wsClient.current = new WebSocketClient(wsUrl);
    wsClient.current.connect(userId);
    setIsConnected(true);

    return () => {
      wsClient.current?.disconnect();
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
