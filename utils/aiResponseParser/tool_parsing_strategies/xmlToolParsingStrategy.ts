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
const entityRegex = /&[a-zA-Z0-9#]+;/g;
function decodeEntities(text: string): string {
  return text.replace(entityRegex, (entity) => entityMap[entity] || entity);
}

type State = 'OUTSIDE_TAG' | 'INSIDE_TAG' | 'INSIDE_COMMENT';
type Container = Record<string, any> | any[];
type StackFrame = {
    container: Container;
    // The following properties link this frame to its parent in the data structure
    parentContainer: Container | null;
    keyInParent: string | number | null;
};


export class XmlToolParsingStrategy implements ToolParsingStrategy {
    readonly signature = '<tool';
    private isDone = false;

    // State machine properties
    private state: State = 'OUTSIDE_TAG';
    private stack: StackFrame[] = [];
    private tagBuffer = '';
    private contentBuffer = '';
    private fullBuffer = ''; // For reverting on failure

    checkSignature(buffer: string): SignatureMatch {
        if (this.signature.startsWith(buffer)) {
            return buffer.length >= this.signature.length ? 'match' : 'partial';
        }
        return 'no_match';
    }

    startSegment(context: ParserContext, signatureBuffer: string): void {
        console.log('[XmlParser] Strategy starting with full tag:', signatureBuffer);
        this.isDone = false;
        // The signatureBuffer is the full opening tag, e.g. '<tool name="MyTool">'
        this.fullBuffer = signatureBuffer;

        const nameMatch = signatureBuffer.match(/name="([^"]+)"/);
        const toolName = nameMatch ? nameMatch[1] : '';

        // Start the segment with the correct tool name
        context.startXmlToolCallSegment(toolName);
        
        const currentSegment = context.currentSegment;
        if (currentSegment?.type === 'tool_call') {
            const rootContainer = currentSegment.arguments;
            this.stack = [{ container: rootContainer, parentContainer: null, keyInParent: null }];
        } else {
            this.stack = [];
        }
        
        // We have consumed the opening tag, so we are now OUTSIDE, waiting for content or closing tag.
        this.state = 'OUTSIDE_TAG';
        this.tagBuffer = '';
        this.contentBuffer = '';
    }
    
    private _isStructural(tag: string): boolean {
        const tagNameMatch = tag.match(/<\/?([^\s>]+)/);
        const tagName = tagNameMatch ? tagNameMatch[1] : '';
        const structuralTags = ['tool', 'arguments', 'arg', 'item'];
        return structuralTags.includes(tagName);
    }

    processChar(char: string, context: ParserContext): void {
        this.fullBuffer += char;

        if (this.state === 'INSIDE_TAG') {
            this.tagBuffer += char;
            if (this.tagBuffer === '<!--') {
                this.contentBuffer += this.tagBuffer;
                this.tagBuffer = '';
                this.state = 'INSIDE_COMMENT';
            } else if (char === '>') {
                if (this._isStructural(this.tagBuffer)) {
                    // This is a structural tag. Let _processTag handle committing content.
                    this._processTag(this.tagBuffer);
                } else {
                    // This is not a structural tag, so treat it as part of the content.
                    this.contentBuffer += this.tagBuffer;
                }
                this.tagBuffer = '';
                this.state = 'OUTSIDE_TAG';
            }
        } else if (this.state === 'OUTSIDE_TAG') {
            if (char === '<') {
                // FIX: Commit any content (like whitespace) before starting a new tag.
                // This ensures whitespace-only nodes between tags are discarded correctly.
                this._commitContent();
                this.tagBuffer = '<';
                this.state = 'INSIDE_TAG';
            } else {
                this.contentBuffer += char;
            }
        } else if (this.state === 'INSIDE_COMMENT') {
            this.contentBuffer += char;
            if (this.contentBuffer.endsWith('-->')) {
                this.state = 'OUTSIDE_TAG';
            }
        }
    }

    private _processTag(tag: string) {
        const isClosing = tag.startsWith('</');
        const tagNameMatch = tag.match(/<\/?([^\s>]+)/);
        const tagName = tagNameMatch ? tagNameMatch[1] : '';

        if (isClosing) {
            // Commit any buffered content BEFORE processing the closing tag.
            // This ensures content is assigned to the correct parent.
            this._commitContent();
            
            const closingTagName = tag.substring(2, tag.length - 1).trim();
            console.log(`[XmlParser] Processing Closing Tag: </${closingTagName}>. Stack depth: ${this.stack.length}`);
            if (closingTagName === 'tool') {
                this.isDone = true;
                return;
            }
            if (this.stack.length > 1) { // Don't pop the root
                const poppedFrame = this.stack.pop();
                console.log('[XmlParser] Popped frame from stack.');

                if (poppedFrame && poppedFrame.parentContainer && poppedFrame.keyInParent !== null) {
                    const value = poppedFrame.parentContainer[poppedFrame.keyInParent as keyof typeof poppedFrame.parentContainer];
                    if (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length === 0) {
                        (poppedFrame.parentContainer as any)[poppedFrame.keyInParent] = '';
                        console.log(`[XmlParser] Collapsed empty object for key "${poppedFrame.keyInParent}" to empty string.`);
                    }
                }
            }
        } else { // Opening tag
            console.log(`[XmlParser] Processing Opening Tag: <${tagName}>. Full tag: ${tag.trim()}`);
            const currentFrame = this.stack[this.stack.length - 1];
            if (!currentFrame || typeof currentFrame.container !== 'object') {
                return;
            }

            if (tagName === 'arg') {
                const nameMatch = tag.match(/name="([^"]+)"/);
                if (nameMatch && !Array.isArray(currentFrame.container)) {
                    const argName = nameMatch[1];
                    const newContainer = {}; // Placeholder object
                    currentFrame.container[argName] = newContainer;
                    this.stack.push({ container: newContainer, parentContainer: currentFrame.container, keyInParent: argName });
                    console.log(`[XmlParser] Pushed new object for <arg name="${argName}">. Stack depth: ${this.stack.length}`);
                }
            } else if (tagName === 'item') {
                if (!Array.isArray(currentFrame.container)) {
                    if (currentFrame.parentContainer && currentFrame.keyInParent !== null) {
                         const newArray: any[] = [];
                         (currentFrame.parentContainer as any)[currentFrame.keyInParent] = newArray;
                         currentFrame.container = newArray;
                         console.log(`[XmlParser] Converted placeholder object for key "${currentFrame.keyInParent}" to a list.`);
                    } else {
                        return;
                    }
                }
                const newItemObject = {};
                currentFrame.container.push(newItemObject);
                this.stack.push({ container: newItemObject, parentContainer: currentFrame.container, keyInParent: currentFrame.container.length - 1 });
                console.log(`[XmlParser] Pushed new item to list. Stack depth: ${this.stack.length}`);
            }
        }
    }
    
    private _commitContent() {
        // If the buffer only contains whitespace, ignore it. This handles pretty-printing.
        if (this.contentBuffer.trim().length === 0) {
            this.contentBuffer = '';
            return;
        }

        const contentToCommit = this.contentBuffer;
        this.contentBuffer = ''; // Always clear the buffer
        
        const decodedContent = decodeEntities(contentToCommit);
        
        const currentFrame = this.stack[this.stack.length - 1];
        console.log(`[XmlParser] Committing content: "${decodedContent.substring(0, 100).replace(/\n/g, '\\n')}..." to parent key:`, currentFrame?.keyInParent);
        
        if (currentFrame && currentFrame.parentContainer && currentFrame.keyInParent !== null) {
            const parentContainer = currentFrame.parentContainer as any;
            const key = currentFrame.keyInParent;
            const existingValue = parentContainer[key];

            if (typeof existingValue === 'object' && Object.keys(existingValue).length === 0) {
                // This is the first piece of content, replacing the placeholder object.
                parentContainer[key] = decodedContent;
            } else if (typeof existingValue === 'string') {
                // This is subsequent content, append it.
                parentContainer[key] += decodedContent;
            }
        }
    }
    
    finalize(context: ParserContext): void {
        console.log('[XmlParser] Finalizing parse.');
        this._commitContent();

        const parsingSegment = context.segments.find(
            s => s.type === 'tool_call' && s.status === 'parsing'
        ) as ToolCallSegment | undefined;
        if (!parsingSegment) return;

        // The tool name is now set in startSegment, but we double-check here.
        if (!parsingSegment.toolName) {
            const nameMatch = this.fullBuffer.match(/<tool\s+name="([^"]+)"/);
            if (nameMatch) {
                parsingSegment.toolName = nameMatch[1];
            } else {
                this.isDone = false;
            }
        }

        console.log(`[XmlParser] Final check: isDone = ${this.isDone}`);
        console.log('[XmlParser] Final arguments object:', JSON.stringify(parsingSegment.arguments, null, 2));

        if (this.isDone) {
            context.endCurrentToolSegment();
            console.log('[XmlParser] Finalization successful. Segment status set to "parsed".');
        } else {
            console.log('[XmlParser] Finalization failed. Reverting to text segment.');
            const parsingSegmentIndex = context.segments.indexOf(parsingSegment);
            if (parsingSegmentIndex !== -1) {
                context.segments.splice(parsingSegmentIndex, 1);
                context.appendTextSegment(this.fullBuffer);
            }
        }
    }

    isComplete(): boolean {
        return this.isDone;
    }
}
