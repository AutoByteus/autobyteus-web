import { BaseState, ParserStateType } from './State';
import { TextState } from './TextState';
import type { ParserContext } from './ParserContext';
import type { ToolParsingStrategy } from '../streaming_strategies/base';

export class ToolParsingState extends BaseState {
    stateType = ParserStateType.TOOL_PARSING_STATE;
    private strategy: ToolParsingStrategy;

    constructor(context: ParserContext, signatureBuffer: string) {
        super(context);
        this.strategy = context.strategy;
        
        // Start the segment with the signature found by the previous state
        this.strategy.startSegment(this.context, signatureBuffer);
        
        // Per our "Cursor Rule", this state is responsible for consuming the
        // signature that it was created to handle.
        this.context.advanceBy(signatureBuffer.length);
    }

    run(): void {
        // The strategy might already be complete from the signature buffer alone
        if (this.strategy.isComplete()) {
            this.strategy.finalize(this.context);
            this.context.transitionTo(new TextState(this.context));
            return;
        }

        while (this.context.hasMoreChars()) {
            const char = this.context.peekChar()!;
            this.strategy.processChar(char, this.context);
            this.context.advance();

            if (this.strategy.isComplete()) {
                this.strategy.finalize(this.context);
                this.context.transitionTo(new TextState(this.context));
                return;
            }
        }
    }
}
