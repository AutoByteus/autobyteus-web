import { LLMProvider } from '~/types/llm';
import type { ToolParsingStrategy } from './tool_parsing_strategies/base';
import { XmlToolParsingStrategy } from './tool_parsing_strategies/xmlToolParsingStrategy';
import { OpenAiToolParsingStrategy } from './tool_parsing_strategies/openAiToolParsingStrategy';
import { GeminiToolParsingStrategy } from './tool_parsing_strategies/geminiToolParsingStrategy';
import { DefaultJsonToolParsingStrategy } from './tool_parsing_strategies/defaultJsonToolParsingStrategy';

/**
 * Mirrors the backend ProviderAwareToolUsageParser logic to select the single,
 * correct tool parsing strategy based on the LLM provider.
 *
 * @param provider - The LLM provider being used.
 * @returns The single ToolParsingStrategy instance to be used for the session.
 */
export function getToolParsingStrategy(provider: LLMProvider): ToolParsingStrategy {
    // If provider is Anthropic, it uses XML.
    if (provider === LLMProvider.ANTHROPIC) {
        return new XmlToolParsingStrategy();
    }

    // Otherwise, select the JSON parser based on the provider.
    switch (provider) {
        case LLMProvider.OPENAI:
            return new OpenAiToolParsingStrategy();
        case LLMProvider.GEMINI:
            return new GeminiToolParsingStrategy();
        // The DefaultJsonToolParsingStrategy is for a specific, non-provider-standard format.
        // It can be used as a fallback or for specific models.
        default:
            return new DefaultJsonToolParsingStrategy();
    }
}
