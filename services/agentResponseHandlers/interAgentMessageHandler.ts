import type { GraphQLInterAgentMessageData } from '~/generated/graphql';
import type { AgentContext } from '~/types/agent/AgentContext';
import type { InterAgentMessageSegment } from '~/utils/aiResponseParser/types';
import { findOrCreateAIMessage } from './assistantResponseHandler';

/**
 * Adds an inter-agent message segment to the active AI message stream for the agent.
 */
export function handleInterAgentMessage(
  eventData: GraphQLInterAgentMessageData,
  agentContext: AgentContext
): void {
  const aiMessage = findOrCreateAIMessage(agentContext);

  const segment: InterAgentMessageSegment = {
    type: 'inter_agent_message',
    senderAgentId: eventData.senderAgentId,
    recipientRoleName: eventData.recipientRoleName,
    messageType: eventData.messageType,
    content: eventData.content,
  };

  aiMessage.segments.push(segment);
}
