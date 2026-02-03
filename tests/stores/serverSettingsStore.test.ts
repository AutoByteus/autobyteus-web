import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useServerSettingsStore } from '~/stores/serverSettings'
import { getApolloClient } from '~/utils/apolloClient'

vi.mock('~/utils/apolloClient', () => ({
  getApolloClient: vi.fn(),
}))

const buildQueryMock = (data: any) => {
  return vi.fn().mockResolvedValue({ data })
}

describe('serverSettings store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetchServerSettings populates settings from the Apollo client query', async () => {
    const queryResult = {
      getServerSettings: [
        { key: 'FOO', value: 'BAR', description: 'desc' }
      ]
    }
    const queryMock = buildQueryMock(queryResult)
    vi.mocked(getApolloClient).mockReturnValue({ query: queryMock } as any)

    const store = useServerSettingsStore()
    const result = await store.fetchServerSettings()

    expect(queryMock).toHaveBeenCalledTimes(1)
    expect(store.settings).toEqual(queryResult.getServerSettings)
    expect(result).toEqual(queryResult.getServerSettings)
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('fetchServerSettings returns cached settings without querying again', async () => {
    const store = useServerSettingsStore()
    store.settings = [{ key: 'CACHED', value: '1', description: 'cached' }]

    const queryMock = vi.fn()
    vi.mocked(getApolloClient).mockReturnValue({ query: queryMock } as any)

    const result = await store.fetchServerSettings()

    expect(result).toEqual(store.settings)
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('fetchServerSettings records errors when the query throws', async () => {
    const queryMock = vi.fn().mockRejectedValue(new Error('boom'))
    vi.mocked(getApolloClient).mockReturnValue({ query: queryMock } as any)

    const store = useServerSettingsStore()

    await expect(store.fetchServerSettings()).rejects.toThrow('boom')
    expect(store.settings).toEqual([])
    expect(store.error).toBe('boom')
    expect(store.isLoading).toBe(false)
  })
})
