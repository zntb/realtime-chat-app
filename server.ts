/* eslint-disable @typescript-eslint/no-explicit-any */
import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';

interface WebSocketClient extends WebSocket {
  userId?: string;
  conversationIds?: Set<string>;
}

interface WebSocketMessage {
  type: 'message' | 'typing' | 'join' | 'leave' | 'reaction' | 'presence';
  conversationId: string;
  userId: string;
  content?: string;
  data?: any;
  status?: 'online' | 'offline' | 'away';
}

const clients = new Map<string, WebSocketClient>();

export function createWebSocketServer(port = 3001) {
  const wss = new WebSocketServer({
    port,
    host: '0.0.0.0', // Explicitly bind to all interfaces
    perMessageDeflate: false, // Disable compression for debugging
  });

  wss.on('listening', () => {
    console.log('[ChatFlow] WebSocket server is now listening');
    console.log('[ChatFlow] Server address:', wss.address());
    console.log('[ChatFlow] Ready for connections on ws://localhost:' + port);
  });

  wss.on('connection', (ws: WebSocketClient, req: IncomingMessage) => {
    console.log('[ChatFlow] New WebSocket connection established');
    console.log('[ChatFlow] Connection from:', req.socket.remoteAddress);
    console.log('[ChatFlow] User-Agent:', req.headers['user-agent']);
    console.log('[ChatFlow] Current connected clients:', clients.size + 1);

    ws.on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        console.log(
          '[ChatFlow] Received message:',
          message.type,
          'from user:',
          message.userId,
        );

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
          case 'reaction':
            handleReaction(message);
            break;
          case 'presence':
            handlePresence(message);
            break;
          case 'leave':
            handleLeave(ws, message);
            break;
          default:
            console.log('[ChatFlow] Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('[ChatFlow] Error parsing message:', error);
      }
    });

    ws.on('close', (code, reason) => {
      console.log(
        '[ChatFlow] Client disconnected with code:',
        code,
        'reason:',
        reason.toString(),
      );
      if (ws.userId) {
        // Broadcast offline status to all conversations the user was in
        ws.conversationIds?.forEach(conversationId => {
          clients.forEach(client => {
            if (
              client.userId !== ws.userId &&
              client.conversationIds?.has(conversationId) &&
              client.readyState === WebSocket.OPEN
            ) {
              client.send(
                JSON.stringify({
                  type: 'presence',
                  conversationId,
                  userId: ws.userId,
                  status: 'offline',
                }),
              );
            }
          });
        });
        clients.delete(ws.userId);
        console.log(
          '[ChatFlow] Removed user:',
          ws.userId,
          'Total clients:',
          clients.size,
        );
      }
    });

    ws.on('error', error => {
      console.error('[ChatFlow] WebSocket error:', error);
    });

    ws.on('pong', () => {
      console.log('[ChatFlow] Received pong from client');
    });

    // Send a welcome message
    ws.send(
      JSON.stringify({
        type: 'welcome',
        message: 'Connected to ChatFlow WebSocket server',
        timestamp: new Date().toISOString(),
      }),
    );
  });

  wss.on('error', error => {
    console.error('[ChatFlow] WebSocket Server error:', error);
  });

  function handleJoin(ws: WebSocketClient, message: WebSocketMessage) {
    ws.userId = message.userId;
    ws.conversationIds = ws.conversationIds || new Set();
    ws.conversationIds.add(message.conversationId);
    clients.set(message.userId, ws);

    // Send current online status of other users in this conversation to the new user
    clients.forEach(client => {
      if (
        client.userId !== message.userId &&
        client.conversationIds?.has(message.conversationId) &&
        client.readyState === WebSocket.OPEN
      ) {
        ws.send(
          JSON.stringify({
            type: 'presence',
            conversationId: message.conversationId,
            userId: client.userId,
            status: 'online', // Assume online if connected
          }),
        );
      }
    });

    console.log(
      `[ChatFlow] User ${message.userId} joined conversation ${message.conversationId}`,
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
      `[ChatFlow] User ${message.userId} left conversation ${message.conversationId}`,
    );
  }

  function handleReaction(message: WebSocketMessage) {
    // Broadcast reaction to all clients in the conversation
    clients.forEach(client => {
      if (
        client.conversationIds?.has(message.conversationId) &&
        client.readyState === WebSocket.OPEN
      ) {
        client.send(
          JSON.stringify({
            type: 'reaction',
            conversationId: message.conversationId,
            messageId: message.data?.messageId,
            emoji: message.data?.emoji,
            userId: message.userId,
            reactions: message.data?.reactions,
            timestamp: new Date().toISOString(),
          }),
        );
      }
    });
  }

  function handlePresence(message: WebSocketMessage) {
    // Broadcast presence status to all clients in the conversation except sender
    clients.forEach(client => {
      if (
        client.userId !== message.userId &&
        client.conversationIds?.has(message.conversationId) &&
        client.readyState === WebSocket.OPEN
      ) {
        client.send(
          JSON.stringify({
            type: 'presence',
            conversationId: message.conversationId,
            userId: message.userId,
            status: message.status || 'offline',
          }),
        );
      }
    });
  }

  console.log(`[ChatFlow] WebSocket server running on ws://localhost:${port}`);

  return wss;
}

// Start the server
createWebSocketServer(3001);
