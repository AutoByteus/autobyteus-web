import { useLLMProviderConfigStore } from '~/stores/llmProviderConfig';
import { getToolParsingStrategy } from './strategyProvider';
import { ParserContext } from './stateMachine/ParserContext';
import type { AIResponseSegment } from './types';
import type { AgentRunState } from '~/types/agent/AgentRunState';
import type { LLMProvider } from '~/types/llm';

/**
 * An interface to represent the common properties needed
 * from either a live or historical conversation to configure the parser.
 */
export interface ParserConfigOptions {
  llmModelName?: string | null;
  useXmlToolFormat?: boolean | null;
  parseToolCalls?: boolean | null;
}

/**
 * Factory function to encapsulate the logic of creating a ParserContext.
 * This simplifies the process by deriving the provider and strategy from the config.
 * @param config - The configuration options from the conversation.
 * @param segments - The array of segments to be populated by the parser.
 * @param agentRunState - The state for the agent instance, used for unique ID generation.
 * @returns A fully configured ParserContext instance.
 */
export function createParserContext(
  config: ParserConfigOptions,
  segments: AIResponseSegment[],
  agentRunState: AgentRunState
): ParserContext {
  const llmProviderStore = useLLMProviderConfigStore();

  const modelName = config.llmModelName || '';
  const useXml = config.useXmlToolFormat ?? false;
  // Default to true, as parsing tool calls is the standard behavior.
  const parseToolCalls = config.parseToolCalls ?? true;

  const provider = llmProviderStore.getProviderForModel(modelName);
  const strategy = getToolParsingStrategy(provider!, useXml);

  return new ParserContext(segments, strategy, useXml, parseToolCalls, agentRunState);
}
