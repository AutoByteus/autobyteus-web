import type { ToolParsingStrategy, SignatureMatch } from './base';
import type { ParserContext } from '../stateMachine/ParserContext';

export class XmlStreamingStrategy implements ToolParsingStrategy {
    readonly signature = '<tool';
    private toolName: string = '';
    private buffer: string = '';
    
    private internalState: 'in_tool_tag' | 'in_arguments' | 'in_arg_value' | 'scanning_arg_close_tag' = 'in_tool_tag';
    private currentArgName: string = '';
    private currentArgValue: string = '';
    private isDone: boolean = false;
    
    // For handling nested tags inside arg values
    private readonly argClosingTag = '</arg>';
    private potentialCloseTagBuffer = '';

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
        // State 1: Reading argument content
        if (this.internalState === 'in_arg_value') {
            if (char === '<') {
                this.internalState = 'scanning_arg_close_tag';
                this.potentialCloseTagBuffer = '<';
            } else {
                this.currentArgValue += char;
            }
            return;
        }

        // State 2: Saw a '<' inside an argument, checking if it's the closing tag
        if (this.internalState === 'scanning_arg_close_tag') {
            this.potentialCloseTagBuffer += char;
            
            // Check if it's a prefix of the closing tag
            if (this.argClosingTag.startsWith(this.potentialCloseTagBuffer)) {
                // Check if it's a full match
                if (this.potentialCloseTagBuffer === this.argClosingTag) {
                    // It is the closing tag. Finalize the argument.
                    if (context.currentSegment?.type === 'tool_call') {
                        const existingArgs = context.currentSegment.arguments;
                        context.updateCurrentToolArguments({
                            ...existingArgs,
                            [this.currentArgName]: this.currentArgValue,
                        });
                    }
                    // Reset for the next argument
                    this.currentArgName = '';
                    this.currentArgValue = '';
                    this.potentialCloseTagBuffer = '';
                    this.internalState = 'in_arguments';
                }
                // It's a partial match, so we wait for more characters.
            } else {
                // It's not the closing tag. It's just some other tag in the content.
                // Append the buffered content and go back to reading arg value.
                this.currentArgValue += this.potentialCloseTagBuffer;
                this.potentialCloseTagBuffer = '';
                this.internalState = 'in_arg_value';
            }
            return;
        }

        // This part handles the main XML structure tags by only buffering from '<' to '>'.
        // It ignores characters between tags, like whitespace or comments not inside an argument.
        if (this.buffer.startsWith('<')) {
            // We are already inside a tag, keep appending
            this.buffer += char;
            if (char === '>') {
                this.handleTag(context);
                this.buffer = ''; // We've processed the tag, so reset.
            }
        } else if (char === '<') {
            // We are not inside a tag, and we just found the start of one.
            this.buffer = '<';
        }
        // If neither of the above, we are between tags (e.g., whitespace). Ignore the char.
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
                    this.internalState = 'in_arg_value';
                }
            } else if (lowerCaseTag === '</tool>') {
                this.isDone = true;
            }
        }
    }
    
    finalize(context: ParserContext): void {
        // XML streaming populates arguments live.
        // We just need to finalize the segment status.
        context.endCurrentToolSegment();
    }

    isComplete(): boolean {
        return this.isDone;
    }
}
