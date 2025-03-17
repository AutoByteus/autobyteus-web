/**
 * Server configuration utilities for AutoByteus
 * Supports both internal server (bundled with Electron) and external server (configured via env variables)
 */

// Fixed server port for internal server
export const INTERNAL_SERVER_PORT = 29695;

/**
 * Determine if we should use the internal server bundled with Electron
 * Reads the USE_INTERNAL_SERVER environment variable set during build
 */
export function useInternalServer(): boolean {
  return process.env.USE_INTERNAL_SERVER === 'true';
}

/**
 * Get the server base URL based on configuration mode
 */
export function getServerBaseUrl(): string {
  if (useInternalServer()) {
    return `http://localhost:${INTERNAL_SERVER_PORT}`;
  }
  
  // Use environment variables or fall back to default port 8000
  return process.env.NUXT_PUBLIC_REST_BASE_URL?.replace('/rest', '') || 'http://localhost:8000';
}

/**
 * Get all server URLs as an object
 */
export function getServerUrls() {
  if (useInternalServer()) {
    const baseUrl = `http://localhost:${INTERNAL_SERVER_PORT}`;
    // When using internal server, use the fixed port
    return {
      graphql: `${baseUrl}/graphql`,
      rest: `${baseUrl}/rest`,
      ws: `ws://localhost:${INTERNAL_SERVER_PORT}/graphql`,
      transcription: `ws://localhost:${INTERNAL_SERVER_PORT}/transcribe`,
      health: `${baseUrl}/rest/health`
    };
  }
  
  // When using external server, use environment variables
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
