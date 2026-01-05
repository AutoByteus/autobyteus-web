import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useSelectedLaunchProfileStore, type ProfileType } from './selectedLaunchProfileStore';
import { useAgentContextsStore } from './agentContextsStore';
import { useAgentTeamContextsStore } from './agentTeamContextsStore';
import { useAgentRunStore } from './agentRunStore';
import { useAgentTeamRunStore } from './agentTeamRunStore';
import type { AgentContext } from '~/types/agent/AgentContext';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';
import type { ContextFilePath } from '~/types/conversation';


/**
 * @store useActiveContextStore
 * @description This store acts as a Facade to provide a single, unified interface
 * for interacting with the currently active agent context, regardless of whether it's
 * a single agent or a member of a team. UI components should use this store
 * to remain decoupled from the underlying complexity of state management.
 */
export const useActiveContextStore = defineStore('activeContext', () => {
  // Underlying stores
  const selectedLaunchProfileStore = useSelectedLaunchProfileStore();
  const agentContextsStore = useAgentContextsStore();
  const agentTeamContextsStore = useAgentTeamContextsStore();
  const agentRunStore = useAgentRunStore();
  const agentTeamRunStore = useAgentTeamRunStore();

  // --- GETTERS (The Single Source of Truth) ---

  /**
   * @getter activeAgentContext
   * @description The primary getter. It determines which agent context is currently
   * active based on the selected profile type and returns it. This is the
   * single source of truth for the UI.
   */
  const activeAgentContext = computed<AgentContext | null>(() => {
    const type: ProfileType | null = selectedLaunchProfileStore.selectedProfileType;
    if (type === 'agent') {
      return agentContextsStore.selectedAgent;
    }
    if (type === 'team') {
      return agentTeamContextsStore.focusedMemberContext;
    }
    return null;
  });

  // --- Convenience Getters (Derived from activeAgentContext) ---

  const isSending = computed<boolean>(() => activeAgentContext.value?.isSending ?? false);
  const currentRequirement = computed<string>(() => activeAgentContext.value?.requirement ?? '');
  const currentContextPaths = computed<ContextFilePath[]>(() => activeAgentContext.value?.contextFilePaths ?? []);
  const activeConfig = computed<AgentRunConfig | null>(() => activeAgentContext.value?.config ?? null);


  // --- ACTIONS (Facade Actions) ---

  function _assertContext(context: AgentContext | null): asserts context is AgentContext {
    if (!context) {
      throw new Error("Operation failed: No active agent context.");
    }
  }

  /**
   * @action updateRequirement
   * @description Updates the user requirement text for the active context.
   */
  const updateRequirement = (text: string) => {
    if (activeAgentContext.value) {
      activeAgentContext.value.requirement = text;
    }
  };

  /**
   * @action addContextFilePath
   * @description Adds a file path to the context of the active agent.
   */
  const addContextFilePath = (filePath: ContextFilePath) => {
    if (activeAgentContext.value) {
      activeAgentContext.value.contextFilePaths.push(filePath);
    }
  };
  
  /**
   * @action removeContextFilePath
   * @description Removes a file path from the context by its index.
   */
  const removeContextFilePath = (index: number) => {
    if (activeAgentContext.value) {
      activeAgentContext.value.contextFilePaths.splice(index, 1);
    }
  };

  /**
   * @action clearContextFilePaths
   * @description Clears all context file paths for the active agent.
   */
  const clearContextFilePaths = () => {
    if (activeAgentContext.value) {
      activeAgentContext.value.contextFilePaths = [];
    }
  };
  
  /**
   * @action updateConfig
   * @description Updates the run configuration for the active agent.
   */
  const updateConfig = (configUpdate: Partial<AgentRunConfig>) => {
    if (activeAgentContext.value?.config) {
      Object.assign(activeAgentContext.value.config, configUpdate);
    }
  };

  /**
   * @action postToolExecutionApproval
   * @description Routes tool approval/denial to the correct run store based on active profile type.
   */
  const postToolExecutionApproval = async (invocationId: string, isApproved: boolean, reason: string | null = null) => {
    const context = activeAgentContext.value;
    _assertContext(context);

    if (selectedLaunchProfileStore.selectedProfileType === 'agent') {
      await agentRunStore.postToolExecutionApproval(context.state.agentId, invocationId, isApproved, reason);
    } else if (selectedLaunchProfileStore.selectedProfileType === 'team') {
      await agentTeamRunStore.postToolExecutionApproval(invocationId, isApproved, reason);
    } else {
      throw new Error("Cannot approve tool: Unknown profile type.");
    }
  };

  /**
   * @action send
   * @description The primary action for sending user input. It intelligently
   * routes the call to the correct run store based on the active profile type.
   */
  const send = async () => {
    const context = activeAgentContext.value;
    _assertContext(context);
    
    if (!context.requirement.trim()) {
        console.warn("Send action aborted: Requirement is empty.");
        return;
    }

    try {
      if (selectedLaunchProfileStore.selectedProfileType === 'agent') {
        await agentRunStore.sendUserInputAndSubscribe();
      } else if (selectedLaunchProfileStore.selectedProfileType === 'team') {
        await agentTeamRunStore.sendMessageToFocusedMember(context.requirement, context.contextFilePaths);
        // After sending, clear the input for the team member.
        context.requirement = '';
        context.contextFilePaths = [];
      } else {
        throw new Error("Cannot send: Unknown profile type.");
      }
    } catch (error) {
      console.error("Failed to send message via activeContextStore:", error);
      // Optionally, you could show a user-facing error here.
    }
  };

  return {
    // Getters
    activeAgentContext,
    isSending,
    currentRequirement,
    currentContextPaths,
    activeConfig,

    // Actions
    updateRequirement,
    addContextFilePath,
    removeContextFilePath,
    clearContextFilePaths,
    updateConfig,
    send,
    postToolExecutionApproval,
  };
});
