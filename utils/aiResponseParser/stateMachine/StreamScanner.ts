/* autobyteus-web/utils/aiResponseParser/stateMachine/StreamScanner.ts */

/**
 * A class to manage a string buffer and a cursor position for sequential reading.
 * This encapsulates the logic of navigating a stream of text, preventing direct
 * manipulation of the cursor and buffer from multiple state classes.
 */
export class StreamScanner {
  private buffer: string;
  private pos: number = 0;

  constructor(initialBuffer: string = '') {
    this.buffer = initialBuffer;
  }

  /**
   * Appends more text to the end of the buffer.
   * @param text The text to append.
   */
  append(text: string): void {
    this.buffer += text;
  }

  /**
   * Looks at the character at the current cursor position without advancing.
   * @returns The character at the cursor, or undefined if at the end.
   */
  peek(): string | undefined {
    return this.buffer[this.pos];
  }

  /**
   * Moves the cursor forward by one position.
   */
  advance(): void {
    if (this.hasMoreChars()) {
      this.pos++;
    }
  }

  /**
   * Moves the cursor forward by a specified number of positions.
   * @param count The number of characters to advance.
   */
  advanceBy(count: number): void {
    this.pos = Math.min(this.buffer.length, this.pos + count);
  }

  /**
   * Checks if there are more characters to read from the buffer.
   * @returns True if the cursor is not at the end of the buffer.
   */
  hasMoreChars(): boolean {
    return this.pos < this.buffer.length;
  }

  /**
   * Extracts a substring from the buffer.
   * @param start The starting index.
   * @param end The ending index.
   * @returns The extracted substring.
   */
  substring(start: number, end?: number): string {
    return this.buffer.substring(start, end);
  }

  /**
   * Returns the current zero-based position of the cursor.
   * @returns The current cursor position.
   */
  getPosition(): number {
    return this.pos;
  }

  /**
   * Returns the total length of the internal buffer.
   * @returns The length of the buffer.
   */
  getBufferLength(): number {
    return this.buffer.length;
  }

  /**
   * Sets the cursor to a specific position.
   * @param position The new cursor position.
   */
  setPosition(position: number): void {
    this.pos = Math.max(0, Math.min(this.buffer.length, position));
  }
}
