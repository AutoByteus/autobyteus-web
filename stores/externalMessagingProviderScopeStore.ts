import { defineStore } from 'pinia';
import type {
  ExternalMessagingProvider,
  ExternalMessagingTransport,
  GatewayCapabilitiesModel,
} from '~/types/externalMessaging';

export interface ProviderScopeOption {
  provider: ExternalMessagingProvider;
  label: string;
  description: string;
}

interface ExternalMessagingProviderScopeState {
  selectedProvider: ExternalMessagingProvider;
  availableProviders: ExternalMessagingProvider[];
  initialized: boolean;
}

const PROVIDER_OPTIONS: Record<ExternalMessagingProvider, ProviderScopeOption> = {
  WHATSAPP: {
    provider: 'WHATSAPP',
    label: 'WhatsApp Personal',
    description: 'Use personal WhatsApp session setup and peer discovery.',
  },
  WECHAT: {
    provider: 'WECHAT',
    label: 'WeChat Personal',
    description: 'Use personal WeChat session setup and peer discovery.',
  },
  WECOM: {
    provider: 'WECOM',
    label: 'WeCom App',
    description: 'Use WeCom business API bridge setup.',
  },
};

function resolveAvailableProviders(
  capabilities: GatewayCapabilitiesModel | null | undefined,
): ExternalMessagingProvider[] {
  const providers: ExternalMessagingProvider[] = ['WHATSAPP'];
  if (capabilities?.wechatPersonalEnabled) {
    providers.push('WECHAT');
  }
  if (capabilities?.wecomAppEnabled) {
    providers.push('WECOM');
  }
  return providers;
}

export const useExternalMessagingProviderScopeStore = defineStore(
  'externalMessagingProviderScopeStore',
  {
    state: (): ExternalMessagingProviderScopeState => ({
      selectedProvider: 'WHATSAPP',
      availableProviders: ['WHATSAPP'],
      initialized: false,
    }),

    getters: {
      options(state): ProviderScopeOption[] {
        return state.availableProviders.map((provider) => PROVIDER_OPTIONS[provider]);
      },

      selectedOption(state): ProviderScopeOption {
        return PROVIDER_OPTIONS[state.selectedProvider];
      },

      requiresPersonalSession(state): boolean {
        return state.selectedProvider === 'WHATSAPP' || state.selectedProvider === 'WECHAT';
      },

      resolvedTransport(state): ExternalMessagingTransport {
        if (state.selectedProvider === 'WECOM') {
          return 'BUSINESS_API';
        }
        return 'PERSONAL_SESSION';
      },
    },

    actions: {
      initialize(capabilities: GatewayCapabilitiesModel | null | undefined): void {
        const nextAvailableProviders = resolveAvailableProviders(capabilities);
        this.availableProviders = nextAvailableProviders;

        if (!nextAvailableProviders.includes(this.selectedProvider)) {
          this.selectedProvider = nextAvailableProviders[0] || 'WHATSAPP';
        }

        this.initialized = true;
      },

      setSelectedProvider(provider: ExternalMessagingProvider): void {
        if (!this.availableProviders.includes(provider)) {
          return;
        }
        this.selectedProvider = provider;
      },
    },
  },
);
