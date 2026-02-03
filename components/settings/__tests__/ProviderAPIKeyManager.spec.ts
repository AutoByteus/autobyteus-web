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

const setMaybeRef = (target: any, key: string, value: any) => {
  if (!target) return
  const current = target[key]
  if (current && typeof current === 'object' && 'value' in current) {
    current.value = value
    return
  }
  target[key] = value
}

const mountComponent = async (storePatch: Record<string, any> = {}) => {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    stubActions: true,
    initialState: {
      llmProviderConfig: {
        providersWithModels: [],
        audioProvidersWithModels: [],
        imageProvidersWithModels: [],
        providerConfigs: {},
        isLoadingModels: false,
        isReloadingModels: false,
        isReloadingProviderModels: false,
        reloadingProvider: null,
        hasFetchedProviders: true,
        ...storePatch,
      },
    },
  })
  setActivePinia(pinia)
  const store = useLLMProviderConfigStore()

  store.fetchProvidersWithModels = vi.fn().mockResolvedValue(store.providersWithModels)
  store.getLLMProviderApiKey = vi.fn().mockResolvedValue('')

  const wrapper = mount(ProviderAPIKeyManager, {
    global: {
      plugins: [pinia],
    },
  })

  await wrapper.vm.$nextTick()
  await flushPromises()
  return { wrapper, store }
}

describe('ProviderAPIKeyManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders separate sections for LLM and audio models when available', async () => {
    const modelState = {
      providersWithModels: [
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
      ],
      audioProvidersWithModels: [
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
      ],
      imageProvidersWithModels: [
        {
          provider: 'OPENAI',
          models: [
            {
              modelIdentifier: 'dall-e-3',
              name: 'DALL-E 3',
              value: 'dall-e-3',
              canonicalName: 'dall-e-3',
              provider: 'OPENAI',
              runtime: 'api',
              hostUrl: null,
            },
          ],
        },
      ],
    }
    const { wrapper, store } = await mountComponent(modelState)

    await wrapper.vm.$nextTick()
    await flushPromises()

    const vm = wrapper.vm as any
    if (vm?.loading && typeof vm.loading === 'object' && 'value' in vm.loading) {
      vm.loading.value = false
    } else {
      setMaybeRef(vm, 'loading', false)
    }
    const initialSetupState = vm.$?.setupState
    setMaybeRef(initialSetupState, 'loading', false)
    await wrapper.vm.$nextTick()
    await flushPromises()

    if (!store.providersWithModels.length) {
      store.providersWithModels = modelState.providersWithModels
      store.audioProvidersWithModels = modelState.audioProvidersWithModels
      store.imageProvidersWithModels = modelState.imageProvidersWithModels
      await wrapper.vm.$nextTick()
      await flushPromises()
    }

    const setupState = (wrapper.vm as any).$?.setupState
    setMaybeRef(setupState, 'providersWithModels', modelState.providersWithModels)
    setMaybeRef(setupState, 'audioProvidersWithModels', modelState.audioProvidersWithModels)
    setMaybeRef(setupState, 'imageProvidersWithModels', modelState.imageProvidersWithModels)
    setMaybeRef(setupState, 'selectedModelProvider', 'OPENAI')
    await wrapper.vm.$nextTick()
    await flushPromises()
    if (typeof (wrapper.vm as any).$forceUpdate === 'function') {
      ;(wrapper.vm as any).$forceUpdate()
      await wrapper.vm.$nextTick()
      await flushPromises()
    }

    // After selecting the provider, we should see the model type sections
    expect(wrapper.text()).toContain('LLM Models')
    expect(wrapper.text()).toContain('Audio Models')
    expect(wrapper.text()).toContain('Image Models')
    // Component displays modelIdentifier
    expect(wrapper.text()).toContain('gpt-4o')
    expect(wrapper.text()).toContain('whisper-1')
    expect(wrapper.text()).toContain('dall-e-3')
  })

  it('shows an empty state message when no models exist', async () => {
    const { wrapper } = await mountComponent()

    // Ensure store arrays stay empty to trigger the empty state
    await wrapper.vm.$nextTick()
    await flushPromises()

    const vm = wrapper.vm as any
    if (vm?.loading && typeof vm.loading === 'object' && 'value' in vm.loading) {
      vm.loading.value = false
    } else {
      setMaybeRef(vm, 'loading', false)
    }
    const setupState = vm.$?.setupState
    setMaybeRef(setupState, 'loading', false)
    await wrapper.vm.$nextTick()
    await flushPromises()

    expect(wrapper.text()).toContain('No models available. Configure at least one provider API key to see available models.')
  })
})
