import type { Conversation } from '~/types/conversation';
import { generateBaseInvocationId } from '~/utils/toolUtils';

export class AgentRunState {
  public agentId: string;
  public currentPhase: string = 'IDLE';
  public conversation: Conversation;
  public agent_tool_invocation_counts = new Map<string, number>();

  constructor(initialId: string, initialConversation: Conversation) {
    this.agentId = initialId;
    this.conversation = initialConversation;
  }

  /**
   * Promotes the temporary run ID to the permanent one received from the backend.
   * This also updates the conversation's internal ID to stay in sync.
   * @param permanentId The permanent agent ID from the backend.
   */
  public promoteTemporaryId(permanentId: string): void {
    this.agentId = permanentId;
    this.conversation.id = permanentId;
  }

  /**
   * Generates a unique ID for a tool invocation within the context of this agent run.
   * This ensures that if the same tool is called multiple times with the same arguments,
   * each invocation can be tracked independently.
   * @param toolName The name of the tool being invoked.
   * @param args The arguments for the tool invocation.
   * @returns A unique string identifier for this specific tool call.
   */
  public generateUniqueInvocationId(toolName: string, args: Record<string, any>): string {
    const baseId = generateBaseInvocationId(toolName, args);
    const count = this.agent_tool_invocation_counts.get(baseId) ?? 0;
    const uniqueId = `${baseId}_${count}`;
    this.agent_tool_invocation_counts.set(baseId, count + 1);
    return uniqueId;
  }
}
