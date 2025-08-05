import { defineStore } from 'pinia';
import { AgentRunState } from '~/types/agent/AgentRunState';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentTeamContext } from '~/types/agent/AgentTeamContext';
import type { TeamLaunchProfile } from '~/types/TeamLaunchProfile';
import type { Conversation } from '~/types/conversation';

interface AgentTeamContextsState {
  activeTeamContext: AgentTeamContext | null;
}

export const useAgentTeamContextsStore = defineStore('agentTeamContexts', {
  state: (): AgentTeamContextsState => ({
    activeTeamContext: null,
  }),

  getters: {
    focusedMemberContext(): AgentContext | null {
      if (!this.activeTeamContext || !this.activeTeamContext.focusedMemberName) {
        return null;
      }
      return this.activeTeamContext.members.get(this.activeTeamContext.focusedMemberName) || null;
    },
    
    teamMembers(): AgentContext[] {
      if (!this.activeTeamContext) return [];
      return Array.from(this.activeTeamContext.members.values());
    }
  },

  actions: {
    setActiveTeamContext(launchProfile: TeamLaunchProfile, teamId: string) {
      const members = new Map<string, AgentContext>();
      
      // Filter for agent nodes and create an AgentContext for each.
      const agentNodes = launchProfile.teamDefinition.nodes.filter(n => n.referenceType === 'AGENT');
      for (const memberNode of agentNodes) {
        const memberConfig = launchProfile.teamConfig.memberConfigs.find(c => c.memberName === memberNode.memberName);
        if (!memberConfig) {
          console.error(`Configuration for team member '${memberNode.memberName}' not found in launch profile.`);
          continue;
        }

        const conversation: Conversation = {
          id: `${teamId}::${memberNode.memberName}`, // A unique ID for the conversation scope
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const agentState = new AgentRunState(memberConfig.memberName, conversation);
        
        const agentContext = new AgentContext(
          {
            launchProfileId: launchProfile.id,
            workspaceId: memberConfig.workspaceId,
            llmModelName: memberConfig.llmModelName,
            autoExecuteTools: memberConfig.autoExecuteTools,
            parseToolCalls: true, // Assuming this is standard for teams for now
          },
          agentState
        );
        members.set(memberNode.memberName, agentContext);
      }
      
      this.activeTeamContext = {
        teamId: teamId,
        launchProfile: launchProfile,
        members: members,
        focusedMemberName: launchProfile.teamDefinition.coordinatorMemberName,
        currentPhase: 'BOOTSTRAPPING',
        isSubscribed: false,
        unsubscribe: undefined,
      };
    },
    
    clearActiveTeamContext() {
      if (this.activeTeamContext?.unsubscribe) {
        this.activeTeamContext.unsubscribe();
      }
      this.activeTeamContext = null;
    },

    setFocusedMember(memberName: string) {
      if (this.activeTeamContext && this.activeTeamContext.members.has(memberName)) {
        this.activeTeamContext.focusedMemberName = memberName;
      }
    },
  },
});
