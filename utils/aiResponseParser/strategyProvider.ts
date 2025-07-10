import { LLMProvider } from '~/types/llm';
import type { ToolParsingStrategy } from './streaming_strategies/base';
import { XmlStreamingStrategy } from './streaming_strategies/xml_strategy';
import { OpenAiStreamingStrategy } from './streaming_strategies/openai_strategy';
import { GeminiStreamingStrategy } from './streaming_strategies/gemini_strategy';
import { DefaultJsonStreamingStrategy } from './streaming_strategies/default_json_strategy';

/**
 * Mirrors the backend ProviderAwareToolUsageParser logic to select the single,
 * correct streaming strategy based on configuration.
 *
 * @param provider - The LLM provider being used.
 * @param useXml - A boolean flag indicating if XML tool formats are enabled.
 * @returns The single ToolParsingStrategy instance to be used for the session.
 */
export function getStreamingStrategy(provider: LLMProvider, useXml: boolean): ToolParsingStrategy {
    if (useXml) {
        // Per backend logic, Anthropic and default XML are handled by the same parser.
        return new XmlStreamingStrategy();
    }

    // If not using XML, select the JSON parser based on the provider.
    switch (provider) {
        case LLMProvider.OPENAI:
            return new OpenAiStreamingStrategy();
        case LLMProvider.GEMINI:
            return new GeminiStreamingStrategy();
        // The DefaultJsonStreamingStrategy is for a specific, non-provider-standard format.
        // It can be used as a fallback or for specific models.
        default:
            return new DefaultJsonStreamingStrategy();
    }
}
