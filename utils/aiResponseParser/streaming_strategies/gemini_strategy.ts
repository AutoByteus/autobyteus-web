import type { ToolParsingStrategy, SignatureMatch } from './base';
import type { ParserContext } from '../stateMachine/ParserContext';
import type { ToolInvocation } from '~/types/tool-invocation';

/**
 * Corresponds to the simplified backend `GeminiJsonToolUsageParser`.
 * Handles a single JSON object with "name" and "args".
 */
export class GeminiStreamingStrategy implements ToolParsingStrategy {
    readonly signature = '{"name":';
    private braceCount = 0;
    private inString = false;
    private isEscaped = false;
    private isDone = false;
    private rawJsonBuffer = '';

    checkSignature(buffer: string): SignatureMatch {
        const noSpaceBuffer = buffer.replace(/\s/g, '');
        
        // A valid tool call MUST be a JSON object starting with '{'.
        if (!noSpaceBuffer.startsWith('{')) {
            return 'no_match';
        }

        // To be a potential match, the buffer must be a prefix of our signature,
        // OR our signature must be a prefix of the buffer.
        // If neither is true, the buffer has already deviated.
        if (this.signature.startsWith(noSpaceBuffer)) {
            // The buffer is a valid prefix of the signature.
            return noSpaceBuffer.length === this.signature.length ? 'match' : 'partial';
        }

        if (noSpaceBuffer.startsWith(this.signature)) {
            // The signature is a prefix of the buffer, which means it's a match.
            return 'match';
        }
        
        // Example: buffer is `{"args":...}`. It starts with `{` but `this.signature`
        // does not start with it, and it does not start with `this.signature`.
        // This means it has deviated from the expected format.
        return 'no_match';
    }

    startSegment(context: ParserContext, signatureBuffer: string): void {
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
            else if (char === '{') this.braceCount++;
            else if (char === '}') this.braceCount--;
        }

        // The JSON is complete when we've returned to a zero brace count.
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
            console.debug(`Gemini Strategy: Could not parse final buffer as JSON.`, e);
            return [];
        }

        // The new format is a single object, not an array.
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
            return [];
        }
            
        const toolName = data.name;
        const args = data.args;

        if (typeof toolName === 'string' && typeof args === 'object' && args !== null) {
            return [{ name: toolName, arguments: args }];
        }
        
        return [];
    }
}
