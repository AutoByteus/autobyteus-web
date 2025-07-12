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

export class XmlStreamingStrategy implements ToolParsingStrategy {
    readonly signature = '<tool';
    private toolName: string = '';
    private buffer: string = '';
    
    private internalState: 'in_tool_tag' | 'in_arguments' | 'in_arg_value' | 'scanning_arg_close_tag' | 'scanning_arg_entity' = 'in_tool_tag';
    private currentArgName: string = '';
    private isDone: boolean = false;
    
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
        context.startXmlToolCallSegment(''); // toolName is not known yet
        this.buffer = signatureBuffer;
    }

    processChar(char: string, context: ParserContext): void {
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
        if (this.buffer.startsWith('<')) {
            this.buffer += char;
            if (char === '>') {
                this.handleTag(context);
                this.buffer = ''; 
            }
        } else if (char === '<') {
            this.buffer = '<';
        }
    }

    private handleTag(context: ParserContext): void {
        const tag = this.buffer;
        const lowerCaseTag = tag.toLowerCase();

        if (this.internalState === 'in_tool_tag') {
            const nameMatch = tag.match(/name="([^"]+)"/);
            if (nameMatch && context.currentSegment?.type === 'tool_call') {
                this.toolName = nameMatch[1];
                context.currentSegment.toolName = this.toolName;
            }
            if (tag.endsWith('>')) {
               this.internalState = 'in_arguments';
            }
        } else if (this.internalState === 'in_arguments') {
            if (lowerCaseTag.startsWith('<arg')) {
                const nameMatch = tag.match(/name="([^"]+)"/);
                if (nameMatch) {
                    this.currentArgName = nameMatch[1];
                    context.appendToCurrentToolArgument(this.currentArgName, '');
                    this.internalState = 'in_arg_value';
                }
            } else if (lowerCaseTag === '</tool>') {
                this.isDone = true;
            }
        }
    }
    
    finalize(context: ParserContext): void {
        context.endCurrentToolSegment();
    }

    isComplete(): boolean {
        return this.isDone;
    }
}
