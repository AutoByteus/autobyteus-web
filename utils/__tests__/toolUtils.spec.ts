import { describe, it, expect } from 'vitest';
import { generateInvocationId } from '../toolUtils';

describe('generateInvocationId', () => {
  it('should generate a deterministic invocation ID for comparison with the backend', () => {
    const toolName = 'test_tool';
    // Note: The order of keys here should not matter for the output hash
    // because the implementation sorts the keys.
    const args = {
      param_b: 'value_b',
      param_a: 123,
      param_c: { nested_b: 2, nested_a: 'a' },
    };

    const generatedId = generateInvocationId(toolName, args);

    console.log(`\n--- Frontend Comparison Value ---`);
    console.log(`Frontend generated ID for '${toolName}': ${generatedId}`);
    console.log(`--- End Frontend Comparison Value ---\n`);


    // Assert that an ID was generated, but not what it is.
    expect(generatedId).toBeTypeOf('string');
    expect(generatedId.startsWith('call_')).toBe(true);
  });

  it('should produce the same ID regardless of argument key order', () => {
    const toolName = 'test_tool';
    const args1 = { a: 1, b: 'two' };
    const args2 = { b: 'two', a: 1 };

    const id1 = generateInvocationId(toolName, args1);
    const id2 = generateInvocationId(toolName, args2);

    expect(id1).toBe(id2);
  });

  it('should produce different IDs for different argument values', () => {
    const toolName = 'test_tool';
    const args1 = { a: 1, b: 'two' };
    const args2 = { a: 1, b: 'three' };

    const id1 = generateInvocationId(toolName, args1);
    const id2 = generateInvocationId(toolName, args2);

    expect(id1).not.toBe(id2);
  });

  it('should produce different IDs for different tool names', () => {
    const args = { a: 1, b: 2 };
    const id1 = generateInvocationId('tool_one', args);
    const id2 = generateInvocationId('tool_two', args);

    expect(id1).not.toBe(id2);
  });

  it('should handle nested objects consistently', () => {
    const toolName = 'nested_tool';
    const args1 = { a: { c: 3, b: 2 }, d: 4 };
    const args2 = { d: 4, a: { b: 2, c: 3 } };

    const id1 = generateInvocationId(toolName, args1);
    const id2 = generateInvocationId(toolName, args2);

    // This will fail if the nested object keys are not sorted.
    // The current implementation only sorts top-level keys.
    // If this test fails, it points to a discrepancy that needs fixing.
    expect(id1).toBe(id2);
  });
});
