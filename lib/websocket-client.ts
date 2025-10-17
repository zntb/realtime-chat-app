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
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[v0] WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          console.log('[v0] Received WebSocket message:', data.type);

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
          console.error('[v0] Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('[v0] WebSocket disconnected');
        this.attemptReconnect(userId);
      };

      this.ws.onerror = error => {
        console.error('[v0] WebSocket error:', error);
      };
    } catch (error) {
      console.error('[v0] Error connecting to WebSocket:', error);
    }
  }

  private attemptReconnect(userId: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `[v0] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
      );
      setTimeout(
        () => this.connect(userId),
        this.reconnectDelay * this.reconnectAttempts,
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
      console.warn('[v0] WebSocket is not connected');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
