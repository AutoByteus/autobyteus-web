import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { routerKey } from 'vue-router';
import SetupVerificationCard from '../SetupVerificationCard.vue';
import { useMessagingVerificationStore } from '~/stores/messagingVerificationStore';

describe('SetupVerificationCard', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  it('renders verification checks and blocker actions', async () => {
    const verificationStore = useMessagingVerificationStore();
    verificationStore.verificationByProvider.WHATSAPP.verificationChecks = [
      {
        key: 'gateway',
        label: 'Gateway connectivity',
        status: 'PASSED',
      },
      {
        key: 'target_runtime',
        label: 'Target runtime activity',
        status: 'FAILED',
        detail: 'AGENT target is not active.',
      },
    ];
    verificationStore.verificationByProvider.WHATSAPP.verificationResult = {
      ready: false,
      checks: verificationStore.verificationChecks,
      blockers: [
        {
          code: 'TARGET_RUNTIME_NOT_ACTIVE',
          step: 'verification',
          message: 'Selected target AGENT agent-1 is not active.',
          actions: [
            { type: 'OPEN_AGENT_RUNTIME', label: 'Open Agent Runtime' },
            { type: 'RERUN_VERIFICATION', label: 'Re-run Verification' },
          ],
        },
      ],
      checkedAt: '2026-02-11T00:00:00.000Z',
    };

    const wrapper = mount(SetupVerificationCard, {
      global: {
        plugins: [pinia],
      },
    });
    await flushPromises();

    expect(wrapper.get('[data-testid="verification-check-target_runtime"]').text()).toContain('FAILED');
    expect(wrapper.get('[data-testid="verification-action-OPEN_AGENT_RUNTIME"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="verification-action-RERUN_VERIFICATION"]').exists()).toBe(true);
  });

  it('re-runs verification when action is clicked', async () => {
    const verificationStore = useMessagingVerificationStore();
    verificationStore.verificationByProvider.WHATSAPP.verificationChecks = [];
    verificationStore.verificationByProvider.WHATSAPP.verificationResult = {
      ready: false,
      checks: [],
      blockers: [
        {
          code: 'VERIFICATION_ERROR',
          step: 'verification',
          message: 'Verification failed',
          actions: [{ type: 'RERUN_VERIFICATION', label: 'Re-run Verification' }],
        },
      ],
      checkedAt: '2026-02-11T00:00:00.000Z',
    };
    const runSpy = vi
      .spyOn(verificationStore, 'runSetupVerification')
      .mockResolvedValue(verificationStore.verificationByProvider.WHATSAPP.verificationResult!);

    const wrapper = mount(SetupVerificationCard, {
      global: {
        plugins: [pinia],
      },
    });
    await flushPromises();

    await wrapper.get('[data-testid="verification-action-RERUN_VERIFICATION"]').trigger('click');

    expect(runSpy).toHaveBeenCalledTimes(1);
  });

  it('navigates to team runtime when team action is clicked', async () => {
    const verificationStore = useMessagingVerificationStore();
    verificationStore.verificationByProvider.WHATSAPP.verificationChecks = [];
    verificationStore.verificationByProvider.WHATSAPP.verificationResult = {
      ready: false,
      checks: [],
      blockers: [
        {
          code: 'TARGET_RUNTIME_NOT_ACTIVE',
          step: 'verification',
          message: 'Selected TEAM runtime is not active.',
          actions: [{ type: 'OPEN_TEAM_RUNTIME', label: 'Open Team Runtime' }],
        },
      ],
      checkedAt: '2026-02-11T00:00:00.000Z',
    };
    const routerMock = {
      push: vi.fn().mockResolvedValue(undefined),
    };

    const wrapper = mount(SetupVerificationCard, {
      global: {
        plugins: [pinia],
        provide: {
          [routerKey as symbol]: routerMock,
        },
      },
    });
    await flushPromises();

    await wrapper.get('[data-testid="verification-action-OPEN_TEAM_RUNTIME"]').trigger('click');

    expect(routerMock.push).toHaveBeenCalledWith({ path: '/agent-teams', query: { view: 'team-list' } });
  });
});
