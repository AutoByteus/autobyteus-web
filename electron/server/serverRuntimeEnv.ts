import * as path from 'path'

function toPrismaSqliteUrl(filePath: string): string {
  const normalizedPath = filePath.replace(/\\/g, '/')
  return normalizedPath.startsWith('/') ? `file:${normalizedPath}` : `file:/${normalizedPath}`
}

export function buildServerRuntimeEnv(
  appDataDir: string,
  publicServerUrl: string,
  baseEnv: NodeJS.ProcessEnv
): Record<string, string> {
  const dbPath = path.join(appDataDir, 'db', 'production.db')

  return {
    // Ensure Prisma initializes against the runtime data dir, not packaged .env defaults.
    DB_NAME: dbPath,
    DATABASE_URL: toPrismaSqliteUrl(dbPath),
    PERSISTENCE_PROVIDER: baseEnv.PERSISTENCE_PROVIDER ?? 'sqlite',
    DB_TYPE: baseEnv.DB_TYPE ?? 'sqlite',
    AUTOBYTEUS_DATA_DIR: appDataDir,
    AUTOBYTEUS_SERVER_HOST: publicServerUrl,
    // Personal desktop defaults to discovery disabled unless explicitly enabled by caller env.
    AUTOBYTEUS_NODE_DISCOVERY_ENABLED: baseEnv.AUTOBYTEUS_NODE_DISCOVERY_ENABLED ?? 'false',
    AUTOBYTEUS_NODE_DISCOVERY_ROLE: baseEnv.AUTOBYTEUS_NODE_DISCOVERY_ROLE ?? 'registry',
    AUTOBYTEUS_NODE_DISCOVERY_REGISTRY_URL:
      baseEnv.AUTOBYTEUS_NODE_DISCOVERY_REGISTRY_URL ?? publicServerUrl
  }
}
