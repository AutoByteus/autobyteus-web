import { generateBaseInvocationId } from '~/utils/toolUtils';

export class AgentInstanceContext {
  public id: string; // Initially a temporary ID, updated to the permanent agentId later.
  public agent_tool_invocation_counts = new Map<string, number>();

  constructor(initialId: string) { this.id = initialId; }

  public updateId(newId: string): void { this.id = newId; }

  public generateUniqueInvocationId(toolName: string, args: Record<string, any>): string {
    const baseId = generateBaseInvocationId(toolName, args);
    const count = this.agent_tool_invocation_counts.get(baseId) ?? 0;
    const uniqueId = `${baseId}_${count}`;
    this.agent_tool_invocation_counts.set(baseId, count + 1);
    return uniqueId;
  }
}
