import { LLMProvider } from '~/types/llm';
import type { ToolParsingStrategy } from './tool_parsing_strategies/base';
import { XmlToolParsingStrategy } from './tool_parsing_strategies/xmlToolParsingStrategy';
import { OpenAiToolParsingStrategy } from './tool_parsing_strategies/openAiToolParsingStrategy';
import { GeminiToolParsingStrategy } from './tool_parsing_strategies/geminiToolParsingStrategy';
import { DefaultJsonToolParsingStrategy } from './tool_parsing_strategies/defaultJsonToolParsingStrategy';

/**
 * Mirrors the backend ProviderAwareToolUsageParser logic to select the single,
 * correct tool parsing strategy based on the LLM provider, with an override for XML.
 *
 * @param provider - The LLM provider being used.
 * @param useXmlToolFormat - If true, forces the use of the XML strategy.
 * @returns The single ToolParsingStrategy instance to be used for the session.
 */
export function getToolParsingStrategy(provider: LLMProvider, useXmlToolFormat: boolean = false): ToolParsingStrategy {
    // First, check for the override flag. If it's true, always use XML.
    if (useXmlToolFormat) {
        return new XmlToolParsingStrategy();
    }

    // If provider is Anthropic, it uses XML by default.
    if (provider === LLMProvider.ANTHROPIC) {
        return new XmlToolParsingStrategy();
    }

    // Otherwise, select the JSON parser based on the provider.
    switch (provider) {
        case LLMProvider.OPENAI:
        case LLMProvider.MISTRAL:
        case LLMProvider.DEEPSEEK:
        case LLMProvider.GROK:
            return new OpenAiToolParsingStrategy();
        case LLMProvider.GEMINI:
            return new GeminiToolParsingStrategy();
        // The DefaultJsonToolParsingStrategy is for a specific, non-provider-standard format.
        // It can be used as a fallback or for specific models.
        default:
            return new DefaultJsonToolParsingStrategy();
    }
}
