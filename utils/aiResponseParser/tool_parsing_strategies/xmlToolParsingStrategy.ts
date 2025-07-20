import type { ToolParsingStrategy, SignatureMatch } from './base';
import type { ParserContext } from '../stateMachine/ParserContext';

const entityMap: { [key: string]: string } = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'"
};

function decodeEntity(entity: string): string {
  return entityMap[entity] || entity;
}

const knownEntityNames = ['amp', 'lt', 'gt', 'quot', 'apos', '#'];

export class XmlToolParsingStrategy implements ToolParsingStrategy {
    readonly signature = '<tool';
    private toolName: string = '';
    
    private internalState: 'parsing_opening_tag' | 'in_arguments' | 'in_arg_value' | 'scanning_arg_close_tag' | 'scanning_arg_entity' | 'invalid' = 'parsing_opening_tag';
    private currentArgName: string = '';
    private isDone: boolean = false;
    
    // Buffer for the entire tool call attempt
    private rawBuffer: string = ''; 
    private openingTagBuffer: string = '';

    private readonly argClosingTag = '</arg>';
    private potentialCloseTagBuffer = '';
    private entityBuffer: string = '';

    checkSignature(buffer: string): SignatureMatch {
        if (this.signature.startsWith(buffer)) {
            return buffer.length >= this.signature.length ? 'match' : 'partial';
        }
        return 'no_match';
    }

    startSegment(context: ParserContext, signatureBuffer: string): void {
        // Reset all state for a new tool call.
        this.toolName = '';
        this.internalState = 'parsing_opening_tag';
        this.currentArgName = '';
        this.isDone = false;
        this.potentialCloseTagBuffer = '';
        this.entityBuffer = '';
        
        // Initialize buffers for the current parsing attempt.
        this.rawBuffer = signatureBuffer; 
        this.openingTagBuffer = signatureBuffer;
        
        context.startXmlToolCallSegment(''); // Create a temporary segment
    }

    processChar(char: string, context: ParserContext): void {
        this.rawBuffer += char;

        if (this.internalState === 'invalid') {
            return;
        }

        if (this.internalState === 'parsing_opening_tag') {
            this.openingTagBuffer += char;
            if (char === '>') {
                this.validateOpeningTag(context);
            }
            return;
        }

        // State for reading argument content
        if (this.internalState === 'in_arg_value') {
            if (char === '<') {
                this.internalState = 'scanning_arg_close_tag';
                this.potentialCloseTagBuffer = '<';
            } else if (char === '&') {
                this.internalState = 'scanning_arg_entity';
                this.entityBuffer = '&';
            } else {
                context.appendToCurrentToolArgument(this.currentArgName, char);
            }
            return;
        }

        // State for scanning a potential closing </arg> tag
        if (this.internalState === 'scanning_arg_close_tag') {
            this.potentialCloseTagBuffer += char;
            
            if (this.argClosingTag.startsWith(this.potentialCloseTagBuffer)) {
                if (this.potentialCloseTagBuffer === this.argClosingTag) {
                    this.currentArgName = '';
                    this.potentialCloseTagBuffer = '';
                    this.internalState = 'in_arguments';
                }
            } else {
                context.appendToCurrentToolArgument(this.currentArgName, this.potentialCloseTagBuffer);
                this.potentialCloseTagBuffer = '';
                this.internalState = 'in_arg_value';
            }
            return;
        }
        
        // State for scanning an XML entity
        if (this.internalState === 'scanning_arg_entity') {
            this.entityBuffer += char;

            if (char === ';') {
                const decoded = decodeEntity(this.entityBuffer);
                context.appendToCurrentToolArgument(this.currentArgName, decoded);
                this.entityBuffer = '';
                this.internalState = 'in_arg_value';
                return;
            }

            const entityName = this.entityBuffer.substring(1);
            const isPotential = knownEntityNames.some(p => p.startsWith(entityName));

            if (!isPotential || this.entityBuffer.length > 7) {
                context.appendToCurrentToolArgument(this.currentArgName, this.entityBuffer);
                this.entityBuffer = '';
                this.internalState = 'in_arg_value';
            }
            return;
        }
        
        // This part handles the main XML structure tags
        const lowerCaseRawBuffer = this.rawBuffer.toLowerCase();

        if (this.internalState === 'in_arguments') {
            // FIX: The regex now requires a closing '>' on the <arg> tag.
            const argMatch = this.rawBuffer.match(/<arg\s+name="([^"]+)">/);
            if (argMatch) {
                this.currentArgName = argMatch[1];
                context.appendToCurrentToolArgument(this.currentArgName, '');
                this.internalState = 'in_arg_value';
                this.rawBuffer = ''; // Clear buffer after processing tag
            } else if (lowerCaseRawBuffer.endsWith('</tool>')) {
                this.isDone = true;
            } else if (char === '<') {
                this.rawBuffer = '<'; // Start buffering for next tag
            }
        }
    }

    private validateOpeningTag(context: ParserContext): void {
        const nameMatch = this.openingTagBuffer.match(/name\s*=\s*["']([^"']+)["']/);
        if (nameMatch && nameMatch[1]) {
            this.toolName = nameMatch[1];
            if (context.currentSegment?.type === 'tool_call') {
                context.currentSegment.toolName = this.toolName;
            }
            this.internalState = 'in_arguments';
            this.rawBuffer = ''; // Reset buffer to look for next tags
        } else {
            // Invalid opening tag
            this.internalState = 'invalid';
            this.isDone = true;
        }
    }
    
    finalize(context: ParserContext): void {
        const parsingSegment = context.segments.find(
            s => s.type === 'tool_call' && s.status === 'parsing'
        );

        if (!parsingSegment) return;

        const parsingSegmentIndex = context.segments.indexOf(parsingSegment);

        if (this.internalState !== 'invalid' && this.isDone) {
             // Successfully parsed a valid tool call.
             // The segment already has its name and arguments populated.
             // Now we delegate finalization to the context.
             context.endCurrentToolSegment();
        } else {
            // Incomplete or invalid tool call, remove the temporary segment and revert to text.
            context.segments.splice(parsingSegmentIndex, 1);
            context.appendTextSegment(this.rawBuffer);
        }
    }

    isComplete(): boolean {
        return this.isDone;
    }
}
