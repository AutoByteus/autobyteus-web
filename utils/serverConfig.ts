/**
 * Server configuration utilities for AutoByteus
 * Dynamically detects and connects to available servers
 */

// Fixed server port for internal server
export const INTERNAL_SERVER_PORT = 29695;

/**
 * Get the server base URL
 * Always uses the internal server port for Electron builds, otherwise falls back to external
 */
export function getServerBaseUrl(): string {
  // In Electron context, we always use the internal port
  if (typeof window !== 'undefined' && window.electronAPI) {
    return `http://localhost:${INTERNAL_SERVER_PORT}`;
  }
  
  // Not in Electron, use environment variables or fall back to default port 8000
  return process.env.NUXT_PUBLIC_REST_BASE_URL?.replace('/rest', '') || 'http://localhost:8000';
}

/**
 * Check if we're running in Electron
 */
export function isElectronEnvironment(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI;
}

/**
 * Get all server URLs as an object
 */
export function getServerUrls() {
  // In Electron context, we always try the internal port first
  if (isElectronEnvironment()) {
    const baseUrl = `http://localhost:${INTERNAL_SERVER_PORT}`;
    return {
      graphql: `${baseUrl}/graphql`,
      rest: `${baseUrl}/rest`,
      ws: `ws://localhost:${INTERNAL_SERVER_PORT}/graphql`,
      transcription: `ws://localhost:${INTERNAL_SERVER_PORT}/transcribe`,
      health: `${baseUrl}/rest/health`
    };
  }
  
  // Not in Electron, use environment variables
  const graphqlUrl = process.env.NUXT_PUBLIC_GRAPHQL_BASE_URL || 'http://localhost:8000/graphql';
  const restUrl = process.env.NUXT_PUBLIC_REST_BASE_URL || 'http://localhost:8000/rest';
  const wsUrl = process.env.NUXT_PUBLIC_WS_BASE_URL || 'ws://localhost:8000/graphql';
  const transcriptionUrl = process.env.NUXT_PUBLIC_TRANSCRIPTION_WS_ENDPOINT || 'ws://localhost:8000/ws/transcribe';
  
  return {
    graphql: graphqlUrl,
    rest: restUrl,
    ws: wsUrl,
    transcription: transcriptionUrl,
    health: `${restUrl}/health`
  };
}
