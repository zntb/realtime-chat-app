/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Message, TypingStatus, PresenceStatus } from '@/types/chat';

type MessageHandler = (message: Message) => void;
type TypingHandler = (status: TypingStatus) => void;
type ReactionHandler = (data: any) => void;
type PresenceHandler = (status: PresenceStatus) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private typingHandlers: Set<TypingHandler> = new Set();
  private reactionHandlers: Set<ReactionHandler> = new Set();
  private presenceHandlers: Set<PresenceHandler> = new Set();
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

      console.log('[ChatFlow] Attempting to connect to WebSocket:', this.url);

      this.ws = new WebSocket(this.url);

      // Connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.ws?.readyState === WebSocket.CONNECTING) {
          console.error(
            '[ChatFlow] WebSocket connection timeout after 5 seconds',
          );
          console.error('[ChatFlow] Current readyState:', this.ws?.readyState);
          this.ws.close();
        }
      }, 5000);

      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('[ChatFlow] WebSocket connected successfully');
        console.log('[ChatFlow] WebSocket URL:', this.url);
        console.log('[ChatFlow] Connection readyState:', this.ws?.readyState);
        this.reconnectAttempts = 0;
      };
      this.ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          console.log('[ChatFlow] Received WebSocket message:', data.type);

          if (data.type === 'welcome') {
            console.log('[ChatFlow] Server welcome message:', data.message);
          } else if (data.type === 'message') {
            const message: Message = {
              id: data.data?.id || `temp-${Date.now()}`,
              content: data.content,
              conversationId: data.conversationId,
              senderId: data.userId,
              sender: data.data?.sender,
              createdAt: new Date(data.timestamp),
              updatedAt: new Date(data.timestamp),
              isEdited: false,
              isPinned: false,
              deletedAt: null,
              reactions: {},
              quotedMessage: null,
              quotedMessageId: null,
            };
            this.messageHandlers.forEach(handler => handler(message));
          } else if (data.type === 'typing') {
            const status: TypingStatus = {
              conversationId: data.conversationId,
              userId: data.userId,
              isTyping: data.isTyping,
            };
            this.typingHandlers.forEach(handler => handler(status));
          } else if (data.type === 'reaction') {
            this.reactionHandlers.forEach(handler => handler(data));
          } else if (data.type === 'presence') {
            const status: PresenceStatus = {
              conversationId: data.conversationId,
              userId: data.userId,
              status: data.status,
            };
            this.presenceHandlers.forEach(handler => handler(status));
          }
        } catch (error) {
          console.error('[ChatFlow] Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = ev => {
        clearTimeout(connectionTimeout);
        console.error('[ChatFlow] WebSocket error event:', ev);
        console.error(
          '[ChatFlow] WebSocket readyState when error occurred:',
          this.ws?.readyState,
        );
        console.error('[ChatFlow] WebSocket URL that failed:', this.url);

        // Check for specific error types
        if (this.ws?.readyState === WebSocket.CONNECTING) {
          console.error('[ChatFlow] Error occurred during connection attempt');
        }

        console.warn(
          '[ChatFlow] TROUBLESHOOTING STEPS:',
          '1. Make sure the WebSocket server is running: npm run ws',
          '2. Check if server is listening on port 3001',
          '3. Verify the WebSocket URL is correct:',
          '   Current URL:',
          this.url,
          '   Expected URL: ws://localhost:3001',
          '4. Check browser network tab for connection errors',
          '5. Try accessing ws://localhost:3001 directly in browser',
        );
      };

      this.ws.onclose = (ev: CloseEvent) => {
        clearTimeout(connectionTimeout);
        console.log(
          '[ChatFlow] WebSocket disconnected',
          'code=' + ev.code,
          'reason=' + (ev.reason || '<none>'),
          'wasClean=' + ev.wasClean,
          'readyState=' + (ev.target as WebSocket)?.readyState,
        );

        // Only attempt reconnect if it wasn't a clean close
        if (!ev.wasClean) {
          this.attemptReconnect(userId);
        }
      };
    } catch (error) {
      console.error(
        '[ChatFlow] Error creating WebSocket connection:',
        error instanceof Error ? error.message : error,
      );
      console.error('[ChatFlow] Failed URL:', this.url);
      console.error(
        '[ChatFlow] Check if WebSocket server is running with: npm run ws',
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

  sendPresenceStatus(
    conversationId: string,
    userId: string,
    status: 'online' | 'offline' | 'away',
  ) {
    this.send({
      type: 'presence',
      conversationId,
      userId,
      status,
    });
  }

  onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  sendReaction(
    conversationId: string,
    messageId: string,
    emoji: string,
    reactions: any,
  ) {
    this.send({
      type: 'reaction',
      conversationId,
      userId: '', // Will be set by server
      data: { messageId, emoji, reactions },
    });
  }

  onReaction(handler: ReactionHandler) {
    this.reactionHandlers.add(handler);
    return () => this.reactionHandlers.delete(handler);
  }

  onTyping(handler: TypingHandler) {
    this.typingHandlers.add(handler);
    return () => this.typingHandlers.delete(handler);
  }

  onPresence(handler: PresenceHandler) {
    this.presenceHandlers.add(handler);
    return () => this.presenceHandlers.delete(handler);
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
