/* autobyteus-web/utils/aiResponseParser/stateMachine/__tests__/StreamScanner.spec.ts */
import { describe, it, expect } from 'vitest';
import { StreamScanner } from '../StreamScanner';

describe('StreamScanner', () => {
  it('should initialize with an empty or provided buffer', () => {
    const scanner1 = new StreamScanner();
    expect(scanner1.getBufferLength()).toBe(0);

    const scanner2 = new StreamScanner('hello');
    expect(scanner2.getBufferLength()).toBe(5);
  });

  it('should append text to the buffer', () => {
    const scanner = new StreamScanner('hello');
    scanner.append(' world');
    expect(scanner.substring(0)).toBe('hello world');
  });

  it('should peek at the current character without advancing', () => {
    const scanner = new StreamScanner('abc');
    expect(scanner.peek()).toBe('a');
    expect(scanner.getPosition()).toBe(0);
  });

  it('should advance the cursor', () => {
    const scanner = new StreamScanner('abc');
    scanner.advance();
    expect(scanner.peek()).toBe('b');
    expect(scanner.getPosition()).toBe(1);
  });

  it('should not advance past the end of the buffer', () => {
    const scanner = new StreamScanner('a');
    scanner.advance();
    expect(scanner.getPosition()).toBe(1);
    scanner.advance();
    expect(scanner.getPosition()).toBe(1);
  });

  it('should advance by a given count', () => {
    const scanner = new StreamScanner('hello world');
    scanner.advanceBy(6);
    expect(scanner.peek()).toBe('w');
    expect(scanner.getPosition()).toBe(6);
  });

  it('should check if it has more characters', () => {
    const scanner = new StreamScanner('a');
    expect(scanner.hasMoreChars()).toBe(true);
    scanner.advance();
    expect(scanner.hasMoreChars()).toBe(false);
  });

  it('should return a substring', () => {
    const scanner = new StreamScanner('hello world');
    expect(scanner.substring(0, 5)).toBe('hello');
  });

  it('should get the current position', () => {
    const scanner = new StreamScanner('hello');
    expect(scanner.getPosition()).toBe(0);
    scanner.advanceBy(2);
    expect(scanner.getPosition()).toBe(2);
  });

  it('should set the current position', () => {
    const scanner = new StreamScanner('hello');
    scanner.setPosition(3);
    expect(scanner.peek()).toBe('l');
    expect(scanner.getPosition()).toBe(3);
  });

  it('should not set position out of bounds', () => {
    const scanner = new StreamScanner('hello');
    scanner.setPosition(10);
    expect(scanner.getPosition()).toBe(5);
    expect(scanner.hasMoreChars()).toBe(false);

    scanner.setPosition(-5);
    expect(scanner.getPosition()).toBe(0);
  });
});
