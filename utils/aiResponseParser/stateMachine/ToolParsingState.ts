import { BaseState, ParserStateType } from './State';
import { TextState } from './TextState';
import type { ParserContext } from './ParserContext';
import type { ToolParsingStrategy } from '../tool_parsing_strategies/base';
import { XmlToolParsingStrategy } from '../tool_parsing_strategies/xmlToolParsingStrategy';
import { WriteFileXmlToolParsingStrategy } from '../tool_parsing_strategies/writeFileXmlToolParsingStrategy';

export class ToolParsingState extends BaseState {
    stateType = ParserStateType.TOOL_PARSING_STATE;
    private strategy: ToolParsingStrategy;

    constructor(context: ParserContext, signatureBuffer: string) {
        super(context);
        
        // This is the new routing logic.
        this.strategy = this.selectStrategy(signatureBuffer);
        
        // The previous state identified the signature and rewound the cursor.
        // This state is responsible for starting the strategy and consuming the signature from the stream.
        this.strategy.startSegment(this.context, signatureBuffer);
        
        // Per the "rewind and re-parse" contract, consume the signature from the stream.
        this.context.advanceBy(signatureBuffer.length);
    }

    private selectStrategy(signatureBuffer: string): ToolParsingStrategy {
      // For XML, we inspect the name attribute to see if it's a special case.
      if (signatureBuffer.trim().startsWith('<tool')) {
        const isWriteFile = /name\s*=\s*['"](write_file|FileWriter)['"]/.test(signatureBuffer);
        if (isWriteFile) {
          console.log('[ToolParsingState] Selecting WriteFileXmlToolParsingStrategy');
          return new WriteFileXmlToolParsingStrategy();
        }
        console.log('[ToolParsingState] Selecting generic XmlToolParsingStrategy');
        return new XmlToolParsingStrategy();
      }
      
      // For JSON and other types, the context's default strategy is used.
      console.log('[ToolParsingState] Selecting context default strategy');
      return this.context.strategy;
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

    finalize(): void {
        // If the stream ends while we are in this state, we must finalize the strategy.
        // The strategy's finalize method is responsible for deciding whether to complete
        // the tool call or revert it to text.
        this.strategy.finalize(this.context);
        this.context.transitionTo(new TextState(this.context));
    }
}
