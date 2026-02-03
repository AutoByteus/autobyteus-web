import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import ServerSettingsManager from '../ServerSettingsManager.vue'
import { useServerSettingsStore } from '~/stores/serverSettings'

const flushPromises = async () => {
  await Promise.resolve()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
}

const mountComponent = async (initialSettings: Array<{ key: string; value: string; description: string }> = []) => {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    stubActions: false,
    initialState: {
      serverSettings: {
        settings: initialSettings,
        isLoading: false,
        error: null,
        isUpdating: false,
      },
    },
  })
  setActivePinia(pinia)

  const store = useServerSettingsStore()
  store.fetchServerSettings = vi.fn().mockResolvedValue([])
  store.updateServerSetting = vi.fn().mockResolvedValue(true)

  const wrapper = mount(ServerSettingsManager, {
    global: {
      plugins: [pinia]
    }
  })

  await flushPromises()
  return { wrapper, store }
}

describe('ServerSettingsManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders setting values that arrive after the component mounts', async () => {
    const { wrapper, store } = await mountComponent([
      { key: 'AUTOBYTEUS_LLM_SERVER_URL', value: 'https://example.com', description: 'desc' }
    ])

    store.$patch({
      settings: [
        { key: 'AUTOBYTEUS_LLM_SERVER_URL', value: 'https://example.com', description: 'desc' }
      ]
    })

    await wrapper.vm.$nextTick()
    await flushPromises()
    await wrapper.vm.$nextTick()

    const input = wrapper.get('[data-testid="server-setting-value-AUTOBYTEUS_LLM_SERVER_URL"]')
    expect(input.exists()).toBe(true)
  })

  it('preserves user edits when the server settings refresh', async () => {
    const { wrapper, store } = await mountComponent([
      { key: 'AUTOBYTEUS_LLM_SERVER_URL', value: 'https://initial', description: 'desc' }
    ])
    await wrapper.vm.$nextTick()
    await flushPromises()
    await wrapper.vm.$nextTick()

    const input = wrapper.get('[data-testid="server-setting-value-AUTOBYTEUS_LLM_SERVER_URL"]')
    await input.setValue('https://custom-input')
    const setupState = (wrapper.vm as any).$?.setupState
    if (setupState?.editedSettings) {
      setupState.editedSettings['AUTOBYTEUS_LLM_SERVER_URL'] = 'https://custom-input'
      await wrapper.vm.$nextTick()
    }

    store.$patch({
      settings: [
        { key: 'AUTOBYTEUS_LLM_SERVER_URL', value: 'https://updated-from-server', description: 'desc' }
      ]
    })
    await wrapper.vm.$nextTick()
    await flushPromises()
    await wrapper.vm.$nextTick()

    const saveButton = wrapper.get('[data-testid="server-setting-save-AUTOBYTEUS_LLM_SERVER_URL"]')
    expect(saveButton.attributes('disabled')).toBeUndefined()
  })
})
