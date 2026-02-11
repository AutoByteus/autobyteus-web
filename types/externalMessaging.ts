export type ExternalMessagingProvider = 'WHATSAPP' | 'WECOM' | 'WECHAT' | 'DISCORD';
export type PersonalSessionProvider = 'WHATSAPP' | 'WECHAT';

export type ExternalMessagingTransport = 'BUSINESS_API' | 'PERSONAL_SESSION';

export type ExternalChannelBindingTargetType = 'AGENT' | 'TEAM';

export type GatewayStepStatus = 'UNKNOWN' | 'READY' | 'BLOCKED';

export type PersonalSessionStatus = 'PENDING_QR' | 'ACTIVE' | 'DEGRADED' | 'STOPPED';

export type SessionStatusAutoSyncState = 'idle' | 'running' | 'paused' | 'stopped';

export type SetupStepKey = 'gateway' | 'personal_session' | 'binding' | 'verification';

export type SetupStepStateStatus = 'PENDING' | 'READY' | 'BLOCKED' | 'DONE';

export interface ExternalChannelBindingModel {
  id: string;
  provider: ExternalMessagingProvider;
  transport: ExternalMessagingTransport;
  accountId: string;
  peerId: string;
  threadId: string | null;
  targetType: ExternalChannelBindingTargetType;
  targetId: string;
  allowTransportFallback: boolean;
  updatedAt: string;
}

export interface ExternalChannelBindingDraft {
  id?: string;
  provider: ExternalMessagingProvider;
  transport: ExternalMessagingTransport;
  accountId: string;
  peerId: string;
  threadId: string | null;
  targetType: ExternalChannelBindingTargetType;
  targetId: string;
  allowTransportFallback: boolean;
}

export interface ExternalChannelBindingTargetOption {
  targetType: ExternalChannelBindingTargetType;
  targetId: string;
  displayName: string;
  status: string;
}

export interface ExternalChannelCapabilityModel {
  bindingCrudEnabled: boolean;
  reason?: string;
  acceptedProviderTransportPairs?: string[];
}

export type WeChatSetupMode = 'WECOM_APP_BRIDGE' | 'DIRECT_PERSONAL_SESSION';

export interface GatewayCapabilitiesModel {
  wechatModes: WeChatSetupMode[];
  defaultWeChatMode: WeChatSetupMode | null;
  wecomAppEnabled: boolean;
  wechatPersonalEnabled: boolean;
  discordEnabled: boolean;
  discordAccountId: string | null;
}

export type GatewayWeComAccountMode = 'APP' | 'LEGACY';

export interface GatewayWeComAccountModel {
  accountId: string;
  label: string;
  mode: GatewayWeComAccountMode;
}

export interface GatewayWeComAccountListModel {
  items: GatewayWeComAccountModel[];
}

export interface GatewayHealthModel {
  status: 'ok' | 'degraded' | 'error';
  version?: string;
  timestamp?: string;
}

export interface GatewayPersonalSessionQrModel {
  code: string;
  expiresAt: string;
}

export interface GatewayPersonalSessionModel {
  sessionId: string;
  accountLabel: string;
  status: PersonalSessionStatus;
  qr?: GatewayPersonalSessionQrModel;
}

export type GatewayPeerType = 'USER' | 'GROUP';

export interface GatewayPeerCandidate {
  peerId: string;
  peerType: GatewayPeerType;
  threadId: string | null;
  displayName: string | null;
  lastMessageAt: string;
}

export interface GatewayPeerCandidatesModel {
  sessionId: string;
  accountLabel: string;
  status: PersonalSessionStatus;
  updatedAt: string;
  items: GatewayPeerCandidate[];
}

export interface GatewayDiscordPeerCandidatesModel {
  accountId: string;
  updatedAt: string;
  items: GatewayPeerCandidate[];
}

export interface SetupStepState {
  key: SetupStepKey;
  status: SetupStepStateStatus;
  detail?: string;
}

export interface SetupBlocker {
  code:
    | 'GATEWAY_UNREACHABLE'
    | 'PERSONAL_MODE_DISABLED'
    | 'SESSION_NOT_READY'
    | 'SERVER_BINDING_API_UNAVAILABLE'
    | 'BINDING_NOT_READY'
    | 'VERIFICATION_ERROR';
  step: SetupStepKey;
  message: string;
}

export interface SetupVerificationResult {
  ready: boolean;
  blockers: SetupBlocker[];
  checkedAt: string;
}

export interface GatewayReadinessSnapshot {
  gatewayReady: boolean;
  gatewayBlockedReason: string | null;
  personalSessionReady: boolean;
  personalSessionBlockedReason: string | null;
}

export interface BindingReadinessSnapshot {
  capabilityEnabled: boolean;
  capabilityBlockedReason: string | null;
  hasBindings: boolean;
  bindingError: string | null;
}
