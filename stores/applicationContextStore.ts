import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ApplicationRunContext } from '~/types/application/ApplicationRun';
import type { AIMessage } from '~/types/conversation';
import type { AgentTeamContext } from '~/types/agent/AgentTeamContext';

interface ApplicationContextState {
  activeRuns: Map<string, ApplicationRunContext>;
  activeInstanceId: string | null;
}

export const useApplicationContextStore = defineStore('applicationContext', {
  state: (): ApplicationContextState => ({
    activeRuns: new Map(),
    activeInstanceId: null,
  }),
  getters: {
    getRun: (state) => (instanceId: string): ApplicationRunContext | null => {
      return state.activeRuns.get(instanceId) || null;
    },
    activeRun(state): ApplicationRunContext | null {
      if (!state.activeInstanceId) return null;
      return state.activeRuns.get(state.activeInstanceId) || null;
    },
    activeTeamContext(): AgentTeamContext | null {
      return this.activeRun?.teamContext || null;
    },
    lastAiMessage(): AIMessage | null {
      const teamContext = this.activeTeamContext;
      if (!teamContext) return null;
      
      const coordinator = teamContext.members.get(teamContext.focusedMemberName);
      if (!coordinator) return null;
      
      const messages = coordinator.state.conversation.messages;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].type === 'ai') {
          return messages[i] as AIMessage;
        }
      }
      return null;
    }
  },
  actions: {
    addRun(context: ApplicationRunContext) {
      this.activeRuns.set(context.instanceId, context);
    },
    removeRun(instanceId: string) {
      const run = this.activeRuns.get(instanceId);
      if (run) {
        run.teamContext.unsubscribe?.();
        this.activeRuns.delete(instanceId);
        if (this.activeInstanceId === instanceId) {
          this.activeInstanceId = null;
        }
      }
    },
    setActiveRun(instanceId: string) {
      if (this.activeRuns.has(instanceId)) {
        this.activeInstanceId = instanceId;
      }
    },
    promoteTemporaryTeamId(instanceId: string, permanentId: string) {
      const run = this.activeRuns.get(instanceId);
      if (run) {
        const teamContext = run.teamContext;
        teamContext.teamId = permanentId;
        teamContext.members.forEach(member => {
          member.state.conversation.id = `${permanentId}::${member.state.agentId}`;
        });
      }
    }
  },
});
