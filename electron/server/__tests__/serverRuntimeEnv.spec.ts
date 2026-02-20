import { describe, expect, it } from 'vitest'
import { buildServerRuntimeEnv } from '../serverRuntimeEnv'

describe('buildServerRuntimeEnv', () => {
  it('builds sqlite runtime env values from app data dir', () => {
    const env = buildServerRuntimeEnv(
      '/Users/tester/.autobyteus/server-data',
      'http://192.168.1.2:29695',
      {}
    )

    expect(env.DATABASE_URL).toBe('file:/Users/tester/.autobyteus/server-data/db/production.db')
    expect(env.PERSISTENCE_PROVIDER).toBe('sqlite')
    expect(env.DB_TYPE).toBe('sqlite')
    expect(env.AUTOBYTEUS_NODE_DISCOVERY_ENABLED).toBe('false')
  })

  it('normalizes windows-style db paths for prisma file URLs', () => {
    const env = buildServerRuntimeEnv(
      'C:\\Users\\tester\\.autobyteus\\server-data',
      'http://localhost:29695',
      {}
    )

    expect(env.DATABASE_URL).toBe('file:/C:/Users/tester/.autobyteus/server-data/db/production.db')
  })

  it('keeps explicitly provided discovery env overrides', () => {
    const env = buildServerRuntimeEnv('/tmp/server-data', 'http://localhost:29695', {
      AUTOBYTEUS_NODE_DISCOVERY_ENABLED: 'true',
      AUTOBYTEUS_NODE_DISCOVERY_ROLE: 'client',
      AUTOBYTEUS_NODE_DISCOVERY_REGISTRY_URL: 'http://registry.local:29695'
    })

    expect(env.AUTOBYTEUS_NODE_DISCOVERY_ENABLED).toBe('true')
    expect(env.AUTOBYTEUS_NODE_DISCOVERY_ROLE).toBe('client')
    expect(env.AUTOBYTEUS_NODE_DISCOVERY_REGISTRY_URL).toBe('http://registry.local:29695')
  })
})
