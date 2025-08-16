import type { ToolParsingStrategy, SignatureMatch } from './base';
import type { ParserContext } from '../stateMachine/ParserContext';
import type { ToolInvocation } from '~/types/tool-invocation';

/**
 * Corresponds to the backend `GeminiJsonToolUsageParser`.
 * Handles a single JSON object with "name" and "args", or a JSON array
 * of such objects.
 */
export class GeminiToolParsingStrategy implements ToolParsingStrategy {
    // A nominal signature. The checkSignature method does the real work.
    readonly signature = '{'; 
    private braceCount = 0;
    private inString = false;
    private isEscaped = false;
    private isDone = false;
    private rawJsonBuffer = '';

    private readonly objSignature = '{"name":';
    private readonly arrSignature = '[{"name":';

    checkSignature(buffer: string): SignatureMatch {
        const noSpaceBuffer = buffer.replace(/\s/g, '');
        
        const startsWithObject = noSpaceBuffer.startsWith('{');
        const startsWithArray = noSpaceBuffer.startsWith('[');

        if (!startsWithObject && !startsWithArray) {
            return 'no_match';
        }

        if (startsWithObject) {
            if (noSpaceBuffer.startsWith(this.objSignature)) return 'match';
            if (this.objSignature.startsWith(noSpaceBuffer)) return 'partial';
        }
        
        if (startsWithArray) {
            if (noSpaceBuffer.startsWith(this.arrSignature)) return 'match';
            if (this.arrSignature.startsWith(noSpaceBuffer)) return 'partial';
        }

        // If the buffer has deviated from any known good signature, it's a no_match.
        // This handles cases like `{"args":...}` immediately.
        return 'no_match';
    }

    startSegment(context: ParserContext, signatureBuffer: string): void {
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
            data = JSON.parse(this.rawJsonBuffer);
        } catch (e) {
            console.debug(`GeminiToolParsingStrategy: Could not parse final buffer as JSON.`, e);
            return [];
        }

        const potentialToolCalls: any[] = Array.isArray(data) ? data : [data];
        const invocations: ToolInvocation[] = [];
        
        for (const callData of potentialToolCalls) {
            if (typeof callData !== 'object' || callData === null) continue;

            const toolName = callData.name;
            if (typeof toolName !== 'string' || !toolName) continue;

            const args = callData.args;
            if (typeof args !== 'object' || args === null || Array.isArray(args)) continue;
            
            invocations.push({ name: toolName, arguments: args });
        }
        
        return invocations;
    }
}
