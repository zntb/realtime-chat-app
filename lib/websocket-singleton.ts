/* eslint-disable @typescript-eslint/no-explicit-any */
import { WebSocketClient } from './websocket-client';

class WebSocketSingleton {
  private static instance: WebSocketClient | null = null;
  private static currentUserId: string | null = null;

  static getInstance(userId?: string): WebSocketClient {
    // If we don't have an instance or user changed, create new one
    if (!this.instance || this.currentUserId !== userId) {
      // Clean up existing instance
      if (this.instance) {
        this.instance.disconnect();
      }

      // Create new instance
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
      this.instance = new WebSocketClient(wsUrl);
      this.currentUserId = userId || null;

      if (userId) {
        console.log(
          '[WebSocketSingleton] Creating new WebSocket instance for user:',
          userId,
        );
        this.instance.connect(userId);
      }
    }

    return this.instance;
  }

  static disconnect() {
    if (this.instance) {
      console.log('[WebSocketSingleton] Disconnecting WebSocket');
      this.instance.disconnect();
      this.instance = null;
      this.currentUserId = null;
    }
  }
}

export { WebSocketSingleton };
