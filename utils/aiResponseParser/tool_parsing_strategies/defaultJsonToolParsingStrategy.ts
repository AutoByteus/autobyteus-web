import type { ToolParsingStrategy, SignatureMatch } from './base';
import type { ParserContext } from '../stateMachine/ParserContext';
import type { ToolInvocation } from '~/types/tool-invocation';

/**
 * Corresponds to the backend `DefaultJsonToolUsageParser`.
 * Handles a specific JSON format: an object with a 'tool' key,
 * which contains 'function' and 'parameters'.
 */
export class DefaultJsonToolParsingStrategy implements ToolParsingStrategy {
    readonly signature = '{"tool":';
    private braceCount = 0;
    private inString = false;
    private isEscaped = false;
    private isDone = false;
    private rawJsonBuffer = '';

    checkSignature(buffer: string): SignatureMatch {
        const noSpaceBuffer = buffer.replace(/\s/g, '');
        if (this.signature.startsWith(noSpaceBuffer)) {
            return noSpaceBuffer.length >= this.signature.length ? 'match' : 'partial';
        }
        return 'no_match';
    }

    startSegment(context: ParserContext, signatureBuffer: string): void {
        // Reset state for a new parsing session
        this.isDone = false;
        this.inString = false;
        this.isEscaped = false;

        context.startJsonToolCallSegment();
        this.rawJsonBuffer = signatureBuffer;
        context.appendToCurrentToolRawJson(signatureBuffer);
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
             if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
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
            data = JSON.parse(this.rawJsonBuffer);
        } catch (e) {
            console.debug(`DefaultJsonToolParsingStrategy: Could not parse final buffer as JSON.`, e);
            return [];
        }

        const toolData = data?.tool;
        if (typeof toolData !== 'object' || toolData === null) {
            return [];
        }

        const toolName = toolData.function;
        if (typeof toolName !== 'string' || !toolName) {
            return [];
        }
        
        const args = toolData.parameters;
        if (typeof args !== 'object' || args === null || Array.isArray(args)) {
             console.warn(`DefaultJsonToolParsingStrategy: Could not find valid 'parameters' object for tool '${toolName}'.`);
            return [];
        }

        return [{ name: toolName, arguments: args }];
    }
}
