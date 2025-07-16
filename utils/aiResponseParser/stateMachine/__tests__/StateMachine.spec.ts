import { describe, it, expect, vi } from 'vitest';
import { StateMachine } from '../StateMachine';
import type { AIResponseSegment } from '../../types';
import { XmlToolParsingStrategy } from '../../tool_parsing_strategies/xmlToolParsingStrategy';
import { OpenAiToolParsingStrategy } from '../../tool_parsing_strategies/openAiToolParsingStrategy';

vi.mock('~/utils/toolUtils', () => ({
  generateInvocationId: (toolName: string, args: Record<string, any>): string => {
    const argString = JSON.stringify(Object.keys(args).sort().reduce((acc, key) => ({...acc, [key]: args[key]}), {}));
    return `call_mock_${toolName}_${argString}`;
  }
}));

describe('StateMachine with a pre-selected Strategy', () => {
  it('should parse a mix of text and XML tags when given XmlToolParsingStrategy', () => {
    const segments: AIResponseSegment[] = [];
    const xmlStrategy = new XmlToolParsingStrategy();
    const machine = new StateMachine(segments, xmlStrategy, true); // useXml = true

    machine.appendChunks([
      'Intro text ',
      '<tool name="xml_tool"><arguments><arg name="p1">v1</arg></arguments></tool>',
      ' Final text'
    ]);
    machine.run();

    expect(segments).toEqual([
      { type: 'text', content: 'Intro text ' },
      expect.objectContaining({
        type: 'tool_call',
        toolName: 'xml_tool',
        arguments: { p1: 'v1' },
      }),
      { type: 'text', content: ' Final text' }
    ]);
  });

  it('should parse a mix of text and JSON when given OpenAiToolParsingStrategy', () => {
    const segments: AIResponseSegment[] = [];
    const openAiStrategy = new OpenAiToolParsingStrategy();
    const machine = new StateMachine(segments, openAiStrategy, false); // useXml = false

    machine.appendChunks(['Hello {"tool_calls":[{"function":{"name":"test","arguments":"{}"}}]} and done.']);
    machine.run();
    
    expect(segments).toEqual([
        { type: 'text', content: 'Hello ' },
        expect.objectContaining({
            type: 'tool_call',
            toolName: 'test',
            status: 'parsed',
        }),
        { type: 'text', content: ' and done.' },
    ]);
  });

  it('should treat an unknown tag as text', () => {
    const segments: AIResponseSegment[] = [];
    // Give it a JSON strategy, so it won't recognize XML tags other than <tool>
    const machine = new StateMachine(segments, new OpenAiToolParsingStrategy(), false);

    machine.appendChunks(['Some <unknown>tag</unknown> text']);
    machine.run();
    expect(segments).toEqual([
      { type: 'text', content: 'Some <unknown>tag</unknown> text' }
    ]);
  });
});