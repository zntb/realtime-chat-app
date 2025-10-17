/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Message, TypingStatus } from '@/types/chat';

type MessageHandler = (message: Message) => void;
type TypingHandler = (status: TypingStatus) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private typingHandlers: Set<TypingHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(private url: string) {}

  connect(userId: string) {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.warn('[ChatFlow] WebSocket only works in browser environment');
        return;
      }

      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[ChatFlow] WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          console.log('[ChatFlow] Received WebSocket message:', data.type);

          if (data.type === 'message') {
            const message: Message = {
              id: data.data?.id || `temp-${Date.now()}`,
              content: data.content,
              conversationId: data.conversationId,
              senderId: data.userId,
              sender: data.data?.sender,
              createdAt: new Date(data.timestamp),
              updatedAt: new Date(data.timestamp),
            };
            this.messageHandlers.forEach(handler => handler(message));
          } else if (data.type === 'typing') {
            const status: TypingStatus = {
              conversationId: data.conversationId,
              userId: data.userId,
              isTyping: data.isTyping,
            };
            this.typingHandlers.forEach(handler => handler(status));
          }
        } catch (error) {
          console.error('[ChatFlow] Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('[ChatFlow] WebSocket disconnected');
        this.attemptReconnect(userId);
      };

      this.ws.onerror = error => {
        console.error(
          '[ChatFlow] WebSocket error:',
          error instanceof Error ? error.message : 'Unknown error',
        );
        console.warn(
          '[ChatFlow] Make sure the WebSocket server is running on ' + this.url,
        );
      };
    } catch (error) {
      console.error(
        '[ChatFlow] Error connecting to WebSocket:',
        error instanceof Error ? error.message : error,
      );
    }
  }

  private attemptReconnect(userId: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `[ChatFlow] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
      );
      setTimeout(
        () => this.connect(userId),
        this.reconnectDelay * this.reconnectAttempts,
      );
    } else {
      console.error(
        '[ChatFlow] Max reconnection attempts reached. WebSocket server may not be running.',
      );
    }
  }

  joinConversation(conversationId: string, userId: string) {
    this.send({
      type: 'join',
      conversationId,
      userId,
    });
  }

  leaveConversation(conversationId: string, userId: string) {
    this.send({
      type: 'leave',
      conversationId,
      userId,
    });
  }

  sendMessage(
    conversationId: string,
    userId: string,
    content: string,
    data?: any,
  ) {
    this.send({
      type: 'message',
      conversationId,
      userId,
      content,
      data,
    });
  }

  sendTypingStatus(conversationId: string, userId: string, isTyping: boolean) {
    this.send({
      type: 'typing',
      conversationId,
      userId,
      data: { isTyping },
    });
  }

  onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onTyping(handler: TypingHandler) {
    this.typingHandlers.add(handler);
    return () => this.typingHandlers.delete(handler);
  }

  private send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[ChatFlow] WebSocket is not connected. Message queued.');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
