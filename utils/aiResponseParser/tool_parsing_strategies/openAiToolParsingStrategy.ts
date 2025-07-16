import type { ToolParsingStrategy, SignatureMatch } from './base';
import type { ParserContext } from '../stateMachine/ParserContext';
import type { ToolInvocation } from '~/types/tool-invocation';
import { jsonrepair } from 'jsonrepair';

/**
 * Corresponds to the backend `OpenAiJsonToolUsageParser`.
 * This is a flexible, catch-all parser for multiple JSON formats.
 */
export class OpenAiToolParsingStrategy implements ToolParsingStrategy {
    readonly signature = '{'; // A nominal signature.
    private braceCount = 0;
    private inString = false;
    private isEscaped = false;
    private isDone = false;
    private rawJsonBuffer = '';
    
    // Stricter signatures for initial check
    private readonly signatures = ['"tool_calls":', '"tools":', '"tool":'];

    checkSignature(buffer: string): SignatureMatch {
        const noSpaceBuffer = buffer.replace(/\s/g, '');
        // A valid tool call MUST be a JSON object.
        if (!noSpaceBuffer.startsWith('{')) {
            return 'no_match';
        }

        for (const sig of this.signatures) {
            if (noSpaceBuffer.includes(sig)) {
                return 'match';
            }
        }
        
        // If the buffer contains a closing brace but no signature was found,
        // it's not a tool call.
        if (noSpaceBuffer.includes('}') || noSpaceBuffer.includes(']')) {
             return 'no_match';
        }

        // Otherwise, it's potentially a partial match.
        return 'partial';
    }

    startSegment(context: ParserContext, signatureBuffer: string): void {
        // Reset state for a new parsing session
        this.isDone = false;
        this.inString = false;
        this.isEscaped = false;

        context.startJsonToolCallSegment();
        this.rawJsonBuffer = signatureBuffer;
        if (context.currentSegment?.type === 'tool_call') {
            context.currentSegment.rawJsonContent = signatureBuffer;
        }
        this.braceCount = (signatureBuffer.match(/[{[]/g) || []).length - (signatureBuffer.match(/[}\]]/g) || []).length;
    }

    processChar(char: string, context: ParserContext): void {
        this.rawJsonBuffer += char;
        context.appendToCurrentToolRawJson(char);

        if (this.inString) {
            if (this.isEscaped) {
                this.isEscaped = false;
            } else if (char === '\\') {
                this.isEscaped = true;
            } else if (char === '"') {
                this.inString = false;
            }
        } else {
            if (char === '"') {
                this.inString = true;
                this.isEscaped = false;
            }
            else if (char === '{' || char === '[') this.braceCount++;
            else if (char === '}' || char === ']') this.braceCount--;
        }

        if (!this.inString && this.braceCount === 0 && this.rawJsonBuffer.trim().length > 1) {
            const trimmed = this.rawJsonBuffer.trim();
            if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                this.isDone = true;
            }
        }
    }

    finalize(context: ParserContext): void {
        const invocations = this._parseFinalBuffer();
        context.finalizeJsonSegment(invocations);
    }

    isComplete(): boolean {
        return this.isDone;
    }

    private _parseFinalBuffer(): ToolInvocation[] {
        let data: any;
        try {
            // Use jsonrepair to handle incomplete/malformed JSON from streaming
            const repairedJson = jsonrepair(this.rawJsonBuffer);
            data = JSON.parse(repairedJson);
        } catch (e) {
            console.debug(`OpenAiToolParsingStrategy: Could not parse final buffer as JSON.`, this.rawJsonBuffer, e);
            return [];
        }

        // This logic mirrors the flexible backend Python parser
        let tool_calls: any[] = [];
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            if (Array.isArray(data.tool_calls)) {
                tool_calls = data.tool_calls;
            } else if (Array.isArray(data.tools)) {
                tool_calls = data.tools;
            } else if (('name' in data && 'arguments' in data) || 'function' in data || 'tool' in data) {
                 // Handle a single tool call object, wrapped or unwrapped
                tool_calls = [data];
            }
        } else if (Array.isArray(data)) {
            // The entire response is a raw list of tool calls
            tool_calls = data;
        }

        const invocations: ToolInvocation[] = [];
        for (let callData of tool_calls) {
            if (typeof callData !== 'object' || callData === null) continue;

            if ("tool" in callData && typeof callData.tool === 'object' && callData.tool !== null) {
                callData = callData.tool;
            }
            
            let functionData = callData;
            if ("function" in callData && typeof callData.function === 'object' && callData.function !== null) {
                functionData = callData.function;
            }
            
            const toolName = functionData.name || functionData.function;
            const argsRaw = functionData.arguments ?? functionData.parameters;

            if (typeof toolName !== 'string') continue;

            let args: Record<string, any> = {};
            if (typeof argsRaw === 'string') {
                try {
                    args = JSON.parse(argsRaw);
                } catch {
                    console.warn(`OpenAiToolParsingStrategy: Failed to parse arguments string for tool '${toolName}'.`);
                    continue;
                }
            } else if (typeof argsRaw === 'object' && argsRaw !== null) {
                args = argsRaw;
            } else if (argsRaw !== undefined && argsRaw !== null) {
                // If argsRaw exists but is not a string or object (e.g., number, boolean), it's invalid.
                console.warn(`OpenAiToolParsingStrategy: Invalid arguments type for tool '${toolName}'. Expected string or object, got ${typeof argsRaw}.`);
                continue;
            }

            invocations.push({ name: toolName, arguments: args });
        }
        return invocations;
    }
}
