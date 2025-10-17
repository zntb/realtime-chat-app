/* eslint-disable @typescript-eslint/no-explicit-any */
import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';

interface WebSocketClient extends WebSocket {
  userId?: string;
  conversationIds?: Set<string>;
}

interface WebSocketMessage {
  type: 'message' | 'typing' | 'join' | 'leave';
  conversationId: string;
  userId: string;
  content?: string;
  data?: any;
}

const clients = new Map<string, WebSocketClient>();

export function createWebSocketServer(port = 3001) {
  const wss = new WebSocketServer({ port });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  wss.on('connection', (ws: WebSocketClient, req: IncomingMessage) => {
    console.log('[v0] New WebSocket connection');

    ws.on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        console.log('[v0] Received message:', message.type);

        switch (message.type) {
          case 'join':
            handleJoin(ws, message);
            break;
          case 'message':
            handleMessage(message);
            break;
          case 'typing':
            handleTyping(message);
            break;
          case 'leave':
            handleLeave(ws, message);
            break;
        }
      } catch (error) {
        console.error('[v0] Error parsing message:', error);
      }
    });

    ws.on('close', () => {
      console.log('[v0] Client disconnected');
      if (ws.userId) {
        clients.delete(ws.userId);
      }
    });

    ws.on('error', error => {
      console.error('[v0] WebSocket error:', error);
    });
  });

  function handleJoin(ws: WebSocketClient, message: WebSocketMessage) {
    ws.userId = message.userId;
    ws.conversationIds = ws.conversationIds || new Set();
    ws.conversationIds.add(message.conversationId);
    clients.set(message.userId, ws);

    console.log(
      `[v0] User ${message.userId} joined conversation ${message.conversationId}`,
    );
  }

  function handleMessage(message: WebSocketMessage) {
    // Broadcast message to all clients in the conversation
    clients.forEach(client => {
      if (
        client.conversationIds?.has(message.conversationId) &&
        client.readyState === WebSocket.OPEN
      ) {
        client.send(
          JSON.stringify({
            type: 'message',
            conversationId: message.conversationId,
            userId: message.userId,
            content: message.content,
            data: message.data,
            timestamp: new Date().toISOString(),
          }),
        );
      }
    });
  }

  function handleTyping(message: WebSocketMessage) {
    // Broadcast typing status to all clients in the conversation except sender
    clients.forEach(client => {
      if (
        client.userId !== message.userId &&
        client.conversationIds?.has(message.conversationId) &&
        client.readyState === WebSocket.OPEN
      ) {
        client.send(
          JSON.stringify({
            type: 'typing',
            conversationId: message.conversationId,
            userId: message.userId,
            isTyping: message.data?.isTyping || false,
          }),
        );
      }
    });
  }

  function handleLeave(ws: WebSocketClient, message: WebSocketMessage) {
    ws.conversationIds?.delete(message.conversationId);
    console.log(
      `[v0] User ${message.userId} left conversation ${message.conversationId}`,
    );
  }

  console.log(`[v0] WebSocket server running on port ${port}`);

  return wss;
}
