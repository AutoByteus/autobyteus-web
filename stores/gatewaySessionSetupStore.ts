import { defineStore } from 'pinia';
import {
  GatewayClientError,
} from '~/services/messagingGatewayClient';
import { createGatewayClient } from '~/services/gatewayClientFactory';
import {
  createPersonalSessionSyncPolicy,
  shouldContinuePolling,
} from '~/services/sessionSync/personalSessionStatusSyncPolicy';
import type {
  PersonalSessionProvider,
  GatewayHealthModel,
  GatewayPersonalSessionModel,
  GatewayPersonalSessionQrModel,
  GatewayReadinessSnapshot,
  SessionStatusAutoSyncState,
  GatewayStepStatus,
} from '~/types/messaging';

interface GatewaySessionSetupState {
  gatewayBaseUrl: string;
  gatewayAdminToken: string;
  gatewayStatus: GatewayStepStatus;
  gatewayError: string | null;
  gatewayHealth: GatewayHealthModel | null;
  isGatewayChecking: boolean;
  isSessionLoading: boolean;
  sessionError: string | null;
  personalModeBlockedReason: string | null;
  qrExpiredAt: string | null;
  sessionProvider: PersonalSessionProvider;
  session: GatewayPersonalSessionModel | null;
  sessionStatusAutoSyncState: SessionStatusAutoSyncState;
  sessionStatusAutoSyncReason: string | null;
  sessionStatusAutoSyncSessionId: string | null;
  sessionStatusAutoSyncStartedAtMs: number | null;
  sessionStatusAutoSyncConsecutiveErrors: number;
  sessionStatusAutoSyncTimer: ReturnType<typeof setTimeout> | null;
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof GatewayClientError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Gateway request failed';
}

function mergeSessionWithStatusAwareQr(
  nextSession: GatewayPersonalSessionModel,
  previousSession: GatewayPersonalSessionModel | null,
): GatewayPersonalSessionModel {
  // QR should only be shown while waiting for scan completion.
  if (nextSession.status !== 'PENDING_QR') {
    return {
      ...nextSession,
      qr: undefined,
    };
  }

  if (nextSession.qr) {
    return nextSession;
  }

  if (previousSession?.sessionId === nextSession.sessionId && previousSession.qr) {
    return {
      ...nextSession,
      qr: previousSession.qr,
    };
  }

  return nextSession;
}

function detachTimer(timer: ReturnType<typeof setTimeout>) {
  if (typeof timer === 'object' && timer && 'unref' in timer && typeof timer.unref === 'function') {
    timer.unref();
  }
}

function nextAutoSyncStateForReason(reason: string): SessionStatusAutoSyncState {
  if (reason === 'retry_budget_exhausted' || reason === 'timeout') {
    return 'paused';
  }
  if (reason === 'restart') {
    return 'running';
  }
  return 'stopped';
}

const GATEWAY_CONFIG_STORAGE_KEY = 'messaging_gateway_config_v1';

interface PersistedGatewayConfig {
  baseUrl: string;
  adminToken: string;
}

function getLocalStorageSafely(): Storage | null {
  if (!globalThis || !('localStorage' in globalThis)) {
    return null;
  }
  const storage = (globalThis as { localStorage?: Storage }).localStorage;
  return storage ?? null;
}

function readPersistedGatewayConfig(): PersistedGatewayConfig | null {
  const storage = getLocalStorageSafely();
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(GATEWAY_CONFIG_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<PersistedGatewayConfig>;
    return {
      baseUrl: typeof parsed.baseUrl === 'string' ? parsed.baseUrl : '',
      adminToken: typeof parsed.adminToken === 'string' ? parsed.adminToken : '',
    };
  } catch {
    return null;
  }
}

function persistGatewayConfig(config: PersistedGatewayConfig): void {
  const storage = getLocalStorageSafely();
  if (!storage) {
    return;
  }

  try {
    const shouldClear = !config.baseUrl.trim() && !config.adminToken.trim();
    if (shouldClear) {
      storage.removeItem(GATEWAY_CONFIG_STORAGE_KEY);
      return;
    }

    storage.setItem(
      GATEWAY_CONFIG_STORAGE_KEY,
      JSON.stringify({
        baseUrl: config.baseUrl,
        adminToken: config.adminToken,
      }),
    );
  } catch {
    // Ignore storage errors to avoid blocking setup flows.
  }
}

export const useGatewaySessionSetupStore = defineStore('gatewaySessionSetupStore', {
  state: (): GatewaySessionSetupState => ({
    gatewayBaseUrl: '',
    gatewayAdminToken: '',
    gatewayStatus: 'UNKNOWN',
    gatewayError: null,
    gatewayHealth: null,
    isGatewayChecking: false,
    isSessionLoading: false,
    sessionError: null,
    personalModeBlockedReason: null,
    qrExpiredAt: null,
    sessionProvider: 'WHATSAPP',
    session: null,
    sessionStatusAutoSyncState: 'idle',
    sessionStatusAutoSyncReason: null,
    sessionStatusAutoSyncSessionId: null,
    sessionStatusAutoSyncStartedAtMs: null,
    sessionStatusAutoSyncConsecutiveErrors: 0,
    sessionStatusAutoSyncTimer: null,
  }),

  getters: {
    gatewayReady: (state) => state.gatewayStatus === 'READY',
    personalSessionReady: (state) => state.session?.status === 'ACTIVE',
    sessionProviderLabel: (state) =>
      state.sessionProvider === 'WECHAT' ? 'WeChat' : 'WhatsApp',
  },

  actions: {
    clearSessionStatusSyncTimer() {
      if (!this.sessionStatusAutoSyncTimer) {
        return;
      }
      clearTimeout(this.sessionStatusAutoSyncTimer);
      this.sessionStatusAutoSyncTimer = null;
    },

    scheduleSessionStatusSyncTick(delayMs: number) {
      this.clearSessionStatusSyncTimer();
      this.sessionStatusAutoSyncTimer = setTimeout(() => {
        void this.runSessionStatusSyncTick();
      }, delayMs);
      detachTimer(this.sessionStatusAutoSyncTimer);
    },

    stopSessionStatusAutoSync(reason = 'manual') {
      this.clearSessionStatusSyncTimer();
      this.sessionStatusAutoSyncReason = reason;
      this.sessionStatusAutoSyncState = nextAutoSyncStateForReason(reason);
      this.sessionStatusAutoSyncSessionId = null;
      this.sessionStatusAutoSyncStartedAtMs = null;
      this.sessionStatusAutoSyncConsecutiveErrors = 0;

      if (reason === 'retry_budget_exhausted') {
        this.sessionError =
          'Automatic status sync paused after repeated errors. Use Refresh Status to continue.';
      } else if (reason === 'timeout') {
        this.sessionError = 'Automatic status sync timed out. Use Refresh Status to continue.';
      }
    },

    startSessionStatusAutoSync(sessionId?: string) {
      const resolvedSessionId = sessionId || this.session?.sessionId;
      if (!resolvedSessionId) {
        return;
      }

      this.clearSessionStatusSyncTimer();
      this.sessionStatusAutoSyncState = 'running';
      this.sessionStatusAutoSyncReason = null;
      this.sessionStatusAutoSyncSessionId = resolvedSessionId;
      this.sessionStatusAutoSyncStartedAtMs = Date.now();
      this.sessionStatusAutoSyncConsecutiveErrors = 0;

      const currentStatus =
        this.session && this.session.sessionId === resolvedSessionId ? this.session.status : null;
      if (currentStatus === 'ACTIVE' || currentStatus === 'STOPPED') {
        this.stopSessionStatusAutoSync(currentStatus.toLowerCase());
        return;
      }

      const policy = createPersonalSessionSyncPolicy();
      this.scheduleSessionStatusSyncTick(policy.baseIntervalMs);
    },

    async runSessionStatusSyncTick() {
      if (
        this.sessionStatusAutoSyncState !== 'running' ||
        !this.sessionStatusAutoSyncSessionId ||
        !this.sessionStatusAutoSyncStartedAtMs
      ) {
        return;
      }

      const policy = createPersonalSessionSyncPolicy();
      const sessionId = this.sessionStatusAutoSyncSessionId;

      try {
        const session = await this.fetchPersonalSessionStatus(sessionId, { silent: true });
        this.sessionStatusAutoSyncConsecutiveErrors = 0;

        const elapsedMs = Date.now() - this.sessionStatusAutoSyncStartedAtMs;
        const decision = shouldContinuePolling(policy, {
          status: session.status,
          elapsedMs,
          consecutiveErrors: this.sessionStatusAutoSyncConsecutiveErrors,
        });

        if (!decision.shouldContinue) {
          this.stopSessionStatusAutoSync(decision.reason || 'stopped');
          return;
        }

        this.scheduleSessionStatusSyncTick(decision.nextDelayMs);
      } catch (error) {
        if (error instanceof GatewayClientError && error.statusCode === 404) {
          this.stopSessionStatusAutoSync('session_not_found');
          return;
        }

        this.sessionStatusAutoSyncConsecutiveErrors += 1;
        const elapsedMs = Date.now() - this.sessionStatusAutoSyncStartedAtMs;
        const decision = shouldContinuePolling(policy, {
          elapsedMs,
          consecutiveErrors: this.sessionStatusAutoSyncConsecutiveErrors,
        });

        if (!decision.shouldContinue) {
          this.stopSessionStatusAutoSync(decision.reason || 'retry_budget_exhausted');
          return;
        }

        this.scheduleSessionStatusSyncTick(decision.nextDelayMs);
      }
    },

    initializeFromConfig() {
      const persistedConfig = readPersistedGatewayConfig();

      try {
        const runtimeConfig = useRuntimeConfig();
        const runtimeBaseUrl =
          typeof runtimeConfig.public.messageGatewayBaseUrl === 'string'
            ? runtimeConfig.public.messageGatewayBaseUrl
            : '';
        const runtimeAdminToken =
          typeof runtimeConfig.public.messageGatewayAdminToken === 'string'
            ? runtimeConfig.public.messageGatewayAdminToken
            : '';

        // Runtime config should seed initial values only.
        // Do not clobber values entered by the user in the current UI session.
        if (!this.gatewayBaseUrl) {
          this.gatewayBaseUrl = persistedConfig?.baseUrl || runtimeBaseUrl;
        }
        if (!this.gatewayAdminToken) {
          this.gatewayAdminToken = persistedConfig?.adminToken || runtimeAdminToken;
        }
      } catch {
        // Keep defaults for non-Nuxt unit test environments and still allow local persistence.
        if (!this.gatewayBaseUrl && persistedConfig?.baseUrl) {
          this.gatewayBaseUrl = persistedConfig.baseUrl;
        }
        if (!this.gatewayAdminToken && persistedConfig?.adminToken) {
          this.gatewayAdminToken = persistedConfig.adminToken;
        }
      }
    },

    setGatewayConfig(input: { baseUrl?: string; adminToken?: string }) {
      const nextBaseUrl =
        typeof input.baseUrl === 'string' ? input.baseUrl : this.gatewayBaseUrl;
      const nextAdminToken =
        typeof input.adminToken === 'string' ? input.adminToken : this.gatewayAdminToken;
      const changed =
        nextBaseUrl !== this.gatewayBaseUrl || nextAdminToken !== this.gatewayAdminToken;

      if (typeof input.baseUrl === 'string') {
        this.gatewayBaseUrl = input.baseUrl;
      }
      if (typeof input.adminToken === 'string') {
        this.gatewayAdminToken = input.adminToken;
      }

      if (changed) {
        this.gatewayStatus = 'UNKNOWN';
        this.gatewayError = null;
        this.gatewayHealth = null;
      }

      persistGatewayConfig({
        baseUrl: this.gatewayBaseUrl,
        adminToken: this.gatewayAdminToken,
      });
    },

    setSessionProvider(provider: PersonalSessionProvider) {
      if (provider === this.sessionProvider) {
        return;
      }

      this.stopSessionStatusAutoSync('provider_switched');
      this.sessionProvider = provider;
      this.session = null;
      this.sessionError = null;
      this.personalModeBlockedReason = null;
      this.qrExpiredAt = null;
    },

    createClient() {
      return createGatewayClient({
        baseUrl: this.gatewayBaseUrl,
        adminToken: this.gatewayAdminToken || undefined,
      });
    },

    async validateGatewayConnection(input?: { baseUrl?: string; adminToken?: string }) {
      if (input) {
        this.setGatewayConfig(input);
      }

      this.isGatewayChecking = true;
      this.gatewayError = null;

      try {
        const health = await this.createClient().getHealth();
        this.gatewayHealth = health;
        this.gatewayStatus = health.status === 'error' ? 'BLOCKED' : 'READY';
        if (this.gatewayStatus === 'BLOCKED') {
          this.gatewayError = 'Gateway reported unhealthy status.';
        }
        return health;
      } catch (error) {
        this.gatewayStatus = 'BLOCKED';
        this.gatewayError = normalizeErrorMessage(error);
        throw error;
      } finally {
        this.isGatewayChecking = false;
      }
    },

    async startPersonalSession(accountLabel: string) {
      this.isSessionLoading = true;
      this.sessionError = null;
      this.personalModeBlockedReason = null;
      this.qrExpiredAt = null;
      const provider = this.sessionProvider;

      try {
        const client = this.createClient();
        const session =
          provider === 'WECHAT'
            ? await client.startWeChatPersonalSession(accountLabel)
            : await client.startWhatsAppPersonalSession(accountLabel);
        this.session = session;
        await this.fetchPersonalSessionQr(session.sessionId);
        this.startSessionStatusAutoSync(session.sessionId);
        return this.session;
      } catch (error) {
        if (error instanceof GatewayClientError) {
          if (error.statusCode === 403) {
            this.personalModeBlockedReason = error.message;
          }

          if (error.statusCode === 409 && error.code === 'SESSION_ALREADY_RUNNING') {
            const existingSessionId = error.details?.sessionId;
            if (existingSessionId) {
              const attachedSession = await this.attachToExistingSession(existingSessionId);
              this.personalModeBlockedReason = null;
              this.sessionError = null;
              return attachedSession;
            }

            this.personalModeBlockedReason =
              'A personal session is already running, but gateway did not return its session id.';
          }
        }
        this.sessionError = normalizeErrorMessage(error);
        throw error;
      } finally {
        this.isSessionLoading = false;
      }
    },

    async attachToExistingSession(sessionId: string): Promise<GatewayPersonalSessionModel> {
      const session = await this.fetchPersonalSessionStatus(sessionId);
      await this.fetchPersonalSessionQr(sessionId);
      this.startSessionStatusAutoSync(sessionId);
      return this.session || session;
    },

    async fetchPersonalSessionQr(sessionId?: string): Promise<GatewayPersonalSessionQrModel | null> {
      const resolvedSessionId = sessionId || this.session?.sessionId;
      if (!resolvedSessionId) {
        throw new Error('No active session id');
      }

      try {
        const client = this.createClient();
        const qr =
          this.sessionProvider === 'WECHAT'
            ? await client.getWeChatPersonalQr(resolvedSessionId)
            : await client.getWhatsAppPersonalQr(resolvedSessionId);
        if (!this.session || this.session.sessionId !== resolvedSessionId) {
          return qr;
        }

        this.session = {
          ...this.session,
          qr,
          status: this.session.status === 'STOPPED' ? 'PENDING_QR' : this.session.status,
        };
        this.qrExpiredAt = null;
        this.sessionError = null;
        return qr;
      } catch (error) {
        if (error instanceof GatewayClientError) {
          if (error.statusCode === 409 && error.code === 'SESSION_QR_NOT_READY') {
            if (this.session && this.session.sessionId === resolvedSessionId) {
              this.session = {
                ...this.session,
                status: 'PENDING_QR',
                qr: undefined,
              };
            }
            this.sessionError = 'QR code is not ready yet. Please retry in a few seconds.';
            return null;
          }

          if (error.statusCode === 410 && error.code === 'SESSION_QR_EXPIRED') {
            this.qrExpiredAt = new Date().toISOString();
            if (this.session && this.session.sessionId === resolvedSessionId) {
              const nextSession: GatewayPersonalSessionModel = {
                ...this.session,
              };
              delete nextSession.qr;
              this.session = nextSession;
            }
          }
        }
        this.sessionError = normalizeErrorMessage(error);
        throw error;
      }
    },

    async fetchPersonalSessionStatus(sessionId?: string, options?: { silent?: boolean }) {
      const resolvedSessionId = sessionId || this.session?.sessionId;
      if (!resolvedSessionId) {
        throw new Error('No active session id');
      }

      if (!options?.silent) {
        this.isSessionLoading = true;
        this.sessionError = null;
      }

      try {
        const client = this.createClient();
        const session =
          this.sessionProvider === 'WECHAT'
            ? await client.getWeChatPersonalStatus(resolvedSessionId)
            : await client.getWhatsAppPersonalStatus(resolvedSessionId);
        this.session = mergeSessionWithStatusAwareQr(session, this.session);

        if (
          this.sessionStatusAutoSyncSessionId === resolvedSessionId &&
          (session.status === 'ACTIVE' || session.status === 'STOPPED')
        ) {
          this.stopSessionStatusAutoSync(session.status.toLowerCase());
        }

        if (
          !options?.silent &&
          (this.sessionStatusAutoSyncState === 'paused' || this.sessionStatusAutoSyncState === 'stopped') &&
          (session.status === 'PENDING_QR' || session.status === 'DEGRADED')
        ) {
          this.startSessionStatusAutoSync(resolvedSessionId);
        }

        return session;
      } catch (error) {
        if (error instanceof GatewayClientError && error.statusCode === 404) {
          this.session = null;
          if (this.sessionStatusAutoSyncSessionId === resolvedSessionId) {
            this.stopSessionStatusAutoSync('session_not_found');
          }
        }
        this.sessionError = normalizeErrorMessage(error);
        throw error;
      } finally {
        if (!options?.silent) {
          this.isSessionLoading = false;
        }
      }
    },

    async stopPersonalSession(sessionId?: string) {
      const resolvedSessionId = sessionId || this.session?.sessionId;
      if (!resolvedSessionId) {
        this.stopSessionStatusAutoSync('session_stopped');
        return { success: true };
      }

      this.isSessionLoading = true;
      this.sessionError = null;
      let stopReason = 'session_stopped';

      try {
        const client = this.createClient();
        const response =
          this.sessionProvider === 'WECHAT'
            ? await client.stopWeChatPersonalSession(resolvedSessionId)
            : await client.stopWhatsAppPersonalSession(resolvedSessionId);
        this.session = null;
        this.qrExpiredAt = null;
        this.personalModeBlockedReason = null;
        return response;
      } catch (error) {
        this.sessionError = normalizeErrorMessage(error);
        stopReason = 'stop_failed';
        throw error;
      } finally {
        this.stopSessionStatusAutoSync(stopReason);
        this.isSessionLoading = false;
      }
    },

    getReadinessSnapshot(): GatewayReadinessSnapshot {
      return {
        gatewayReady: this.gatewayStatus === 'READY',
        gatewayBlockedReason: this.gatewayStatus === 'BLOCKED' ? this.gatewayError : null,
        personalSessionReady: this.session?.status === 'ACTIVE',
        personalSessionBlockedReason: this.personalModeBlockedReason,
      };
    },
  },
});
