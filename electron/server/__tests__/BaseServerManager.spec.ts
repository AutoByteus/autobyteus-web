import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fs from 'fs'
import { BaseServerManager } from '../baseServerManager'

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  rmSync: vi.fn(),
  copyFileSync: vi.fn(),
  readdirSync: vi.fn()
}))

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/user/data')
  }
}))

vi.mock('../../logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

const mockedFs = vi.mocked(fs)

class TestServerManager extends BaseServerManager {
  protected async launchServerProcess(): Promise<void> {
    return
  }

  protected getServerPath(): string {
    return '/server/autobyteus_server.exe'
  }

  public getCacheDir(): string {
    return '/cache'
  }

  public getFirstRun(): boolean {
    return this.firstRun
  }
}

describe('BaseServerManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resetAppDataDir removes and recreates the app data directory', () => {
    mockedFs.existsSync
      .mockReturnValueOnce(true) // constructor check
      .mockReturnValueOnce(true) // resetAppDataDir removal check
      .mockReturnValueOnce(false) // initAppDataDir check after reset

    const manager = new TestServerManager()
    manager.resetAppDataDir()

    expect(mockedFs.rmSync).toHaveBeenCalledWith(manager.getAppDataDir(), { recursive: true, force: true })
    expect(mockedFs.mkdirSync).toHaveBeenCalledWith(manager.getAppDataDir(), { recursive: true })
    expect(manager.getFirstRun()).toBe(true)
  })

  it('initializeFirstRun clears first-run flag after successful initialization', () => {
    mockedFs.existsSync.mockReturnValueOnce(false) // constructor check
    const manager = new TestServerManager()

    mockedFs.existsSync.mockReturnValue(true)
    manager.initializeFirstRun('/server')

    expect(manager.getFirstRun()).toBe(false)
  })
})
