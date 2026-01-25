import WebSocket from 'ws';

// Provide a WebSocket implementation for graphql-ws in the test environment.
(globalThis as typeof globalThis & { WebSocket?: typeof WebSocket }).WebSocket = WebSocket;
