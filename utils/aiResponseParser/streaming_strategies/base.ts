import type { ParserContext } from '../stateMachine/ParserContext';

export type SignatureMatch = 'match' | 'partial' | 'no_match';

export interface ToolParsingStrategy {
    /**
     * The unique starting characters that identify this strategy.
     */
    readonly signature: string;

    /**
     * Checks if the initial characters from the stream match the signature
     * of this strategy's tool call format.
     */
    checkSignature(buffer: string): SignatureMatch;

    /**
     * Called when this strategy is selected. It should create the initial
     * ToolCallSegment in the UI.
     */
    startSegment(context: ParserContext, signatureBuffer: string): void;
    
    /**
     * Processes the next character from the stream.
     */
    processChar(char: string, context: ParserContext): void;
    
    /**
     * Called by the context when the strategy is complete.
     * This method is responsible for final parsing and updating the segment.
     */
    finalize(context: ParserContext): void;

    /**
     * Checks if the tool call block is complete.
     */
    isComplete(): boolean;
}
