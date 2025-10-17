// WebSocket server for development
// Run this with: node server.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createWebSocketServer } = require('./lib/websocket-server');

createWebSocketServer(3001);
