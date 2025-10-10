import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'

import ProviderAPIKeyManager from '../ProviderAPIKeyManager.vue'
import { useLLMProviderConfigStore } from '~/stores/llmProviderConfig'

const flushPromises = async () => {
  // Allow queued microtasks and pending timers (used by notifications) to settle
  await Promise.resolve()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
}

const mountComponent = async () => {
  const pinia = createTestingPinia({ createSpy: vi.fn, stubActions: true })
  setActivePinia(pinia)
  const store = useLLMProviderConfigStore()

  store.fetchProvidersWithModels = vi.fn().mockResolvedValue(undefined)
  store.getLLMProviderApiKey = vi.fn().mockResolvedValue('')
  store.reloadModels = vi.fn().mockResolvedValue(true)

  const wrapper = mount(ProviderAPIKeyManager, {
    global: {
      plugins: [pinia],
    },
  })

  await flushPromises()
  return { wrapper, store }
}

describe('ProviderAPIKeyManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders separate sections for LLM and audio models when available', async () => {
    const { wrapper, store } = await mountComponent()

    store.providersWithModels = [
      {
        provider: 'OPENAI',
        models: [
          {
            modelIdentifier: 'gpt-4o',
            name: 'GPT-4o',
            value: 'gpt-4o',
            canonicalName: 'gpt-4o',
            provider: 'OPENAI',
            runtime: 'api',
            hostUrl: null,
          },
        ],
      },
    ]
    store.audioProvidersWithModels = [
      {
        provider: 'OPENAI',
        models: [
          {
            modelIdentifier: 'whisper-1',
            name: 'Whisper',
            value: 'whisper-1',
            canonicalName: 'whisper-1',
            provider: 'OPENAI',
            runtime: 'api',
            hostUrl: null,
          },
        ],
      },
    ]

    await flushPromises()

    expect(wrapper.text()).toContain('LLM Models')
    expect(wrapper.text()).toContain('Audio Models')
    expect(wrapper.text()).toContain('gpt-4o')
    expect(wrapper.text()).toContain('whisper-1')
  })

  it('shows an empty state message when no models exist', async () => {
    const { wrapper } = await mountComponent()

    // Ensure store arrays stay empty to trigger the empty state
    await flushPromises()

    expect(wrapper.text()).toContain('No models available. Configure at least one provider API key to see available models.')
  })
})
