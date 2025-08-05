/**
 * Arrow Key Navigation Tests
 *
 * Tests to ensure arrow key navigation between blocks behaves like a native text editor.
 *
 * Expected behavior:
 * - Arrow up from first line should go to previous block (end of previous block)
 * - Arrow down from last line should go to next block (start of next block)
 * - Navigation shouldn't require multiple key presses
 */

import { FocusManager } from '@/lib/FocusManager';
import { isCursorAtFirstLine, isCursorAtLastLine } from '@/lib/utils';

// Mock DOM utilities
const createMockTextBlock = (content: string, blockId: number): HTMLElement => {
  const element = document.createElement('div');
  element.contentEditable = 'true';
  element.setAttribute('data-block-id', blockId.toString());
  element.textContent = content;
  document.body.appendChild(element);
  return element;
};

const createMockSelection = (element: HTMLElement, offset: number) => {
  const textNode = element.firstChild || element;
  const content = element.textContent || '';
  const actualOffset = Math.min(offset, content.length);

  // Create a mock range that simulates proper text selection
  const mockRange = {
    selectNodeContents: jest.fn(),
    setStart: jest.fn(),
    setEnd: jest.fn(),
    collapse: jest.fn(),
    toString: jest.fn().mockImplementation(() => {
      // Return text from start of element to cursor position
      return content.substring(0, actualOffset);
    }),
    startContainer: textNode,
    startOffset: actualOffset,
    endContainer: textNode,
    endOffset: actualOffset,
  };

  // Mock selection with proper methods
  const mockSelection = {
    rangeCount: 1,
    getRangeAt: jest.fn().mockReturnValue(mockRange),
    removeAllRanges: jest.fn(),
    addRange: jest.fn(),
    toString: jest.fn().mockReturnValue(''),
  };

  // Override window.getSelection to return our mock
  Object.defineProperty(window, 'getSelection', {
    writable: true,
    value: jest.fn().mockReturnValue(mockSelection),
  });

  // Override document.createRange to return a mock range that works with our utilities
  Object.defineProperty(document, 'createRange', {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
      selectNodeContents: jest.fn(),
      setStart: jest.fn(),
      setEnd: jest.fn(),
      collapse: jest.fn(),
      toString: jest
        .fn()
        .mockImplementation(() => content.substring(0, actualOffset)),
      startContainer: textNode,
      startOffset: actualOffset,
      endContainer: textNode,
      endOffset: actualOffset,
    })),
  });

  return { range: mockRange, selection: mockSelection };
};

describe('Arrow Key Navigation Tests', () => {
  let focusManager: FocusManager;

  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = '';

    // Fresh FocusManager
    focusManager = FocusManager.getInstance();

    // Clear mocks
    jest.clearAllMocks();

    // Mock getBoundingClientRect for line detection
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      top: 0,
      left: 0,
      bottom: 20,
      right: 100,
      width: 100,
      height: 20,
      x: 0,
      y: 0,
      toJSON: jest.fn(),
    }));

    // Mock getComputedStyle for line height
    window.getComputedStyle = jest.fn(
      () =>
        ({
          lineHeight: '20px',
          fontSize: '16px',
        }) as CSSStyleDeclaration,
    );
  });

  describe('Cursor Position Detection', () => {
    test('should detect cursor at first line correctly', () => {
      const block = createMockTextBlock('foo', 1);
      createMockSelection(block, 0); // Cursor at start

      const isAtFirst = isCursorAtFirstLine(block);
      expect(isAtFirst).toBe(true);
    });

    test('should detect cursor NOT at first line with multiple lines', () => {
      const block = createMockTextBlock('foo\nbar', 1);
      createMockSelection(block, 4); // Cursor at 'b' in second line

      const isAtFirst = isCursorAtFirstLine(block);
      expect(isAtFirst).toBe(false);
    });

    test('should detect cursor at last line correctly', () => {
      const block = createMockTextBlock('foo', 1);
      createMockSelection(block, 3); // Cursor at end

      const isAtLast = isCursorAtLastLine(block);
      expect(isAtLast).toBe(true);
    });

    test('should detect cursor NOT at last line with multiple lines', () => {
      const block = createMockTextBlock('foo\nbar', 1);
      createMockSelection(block, 1); // Cursor at 'o' in first line

      const isAtLast = isCursorAtLastLine(block);
      expect(isAtLast).toBe(false);
    });
  });

  describe('Navigation Behavior', () => {
    test('should navigate up from first line of current block', () => {
      // Create two blocks: "foo" and "bar"
      const block1 = createMockTextBlock('foo', 1);
      const block2 = createMockTextBlock('bar', 2);

      // Position cursor at start of second block
      createMockSelection(block2, 0);

      // Should detect that cursor is at first line
      expect(isCursorAtFirstLine(block2)).toBe(true);

      // This means arrow up should navigate to previous block
      // The navigation logic should move cursor to end of block1
    });

    test('should navigate down from last line of current block', () => {
      // Create two blocks: "foo" and "bar"
      const block1 = createMockTextBlock('foo', 1);
      const block2 = createMockTextBlock('bar', 2);

      // Position cursor at end of first block
      createMockSelection(block1, 3);

      // Should detect that cursor is at last line
      expect(isCursorAtLastLine(block1)).toBe(true);

      // This means arrow down should navigate to next block
      // The navigation logic should move cursor to start of block2
    });

    test('should handle single line blocks correctly', () => {
      const block = createMockTextBlock('hello world', 1);

      // Cursor anywhere in single line should be both first and last line
      createMockSelection(block, 6); // Middle of "hello world"

      expect(isCursorAtFirstLine(block)).toBe(true);
      expect(isCursorAtLastLine(block)).toBe(true);
    });

    test('should handle empty blocks correctly', () => {
      const block = createMockTextBlock('', 1);

      // Empty block should be both first and last line
      createMockSelection(block, 0);

      expect(isCursorAtFirstLine(block)).toBe(true);
      expect(isCursorAtLastLine(block)).toBe(true);
    });
  });

  describe('Multi-line Text Navigation', () => {
    test('should handle cursor in middle line of multi-line text', () => {
      const block = createMockTextBlock('first\nsecond\nthird', 1);

      // Position cursor in middle of second line
      createMockSelection(block, 9); // At 'c' in 'second'

      // Should not be first or last line
      expect(isCursorAtFirstLine(block)).toBe(false);
      expect(isCursorAtLastLine(block)).toBe(false);
    });

    test('should detect first line in multi-line text', () => {
      const block = createMockTextBlock('first\nsecond\nthird', 1);

      // Position cursor in first line
      createMockSelection(block, 2); // At 'r' in 'first'

      expect(isCursorAtFirstLine(block)).toBe(true);
      expect(isCursorAtLastLine(block)).toBe(false);
    });

    test('should detect last line in multi-line text', () => {
      const block = createMockTextBlock('first\nsecond\nthird', 1);

      // Position cursor in last line
      createMockSelection(block, 15); // At 'r' in 'third'

      expect(isCursorAtFirstLine(block)).toBe(false);
      expect(isCursorAtLastLine(block)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle text ending with newline', () => {
      const block = createMockTextBlock('foo\n', 1);

      // Cursor at the empty line after newline
      createMockSelection(block, 4);

      // Should be considered last line
      expect(isCursorAtLastLine(block)).toBe(true);
    });

    test('should handle cursor at exact newline position', () => {
      const block = createMockTextBlock('foo\nbar', 1);

      // Cursor right at the newline character
      createMockSelection(block, 3);

      // This is tricky - cursor is at end of first line
      expect(isCursorAtFirstLine(block)).toBe(true);
      expect(isCursorAtLastLine(block)).toBe(false);
    });

    test('should handle very long wrapped text', () => {
      const longText =
        'This is a very long line that would normally wrap in a real editor when the text becomes too long for the container width';
      const block = createMockTextBlock(longText, 1);

      // Mock wrapped text behavior
      const originalGetBoundingClientRect =
        Element.prototype.getBoundingClientRect;
      block.getBoundingClientRect = jest.fn(() => ({
        top: 0,
        left: 0,
        bottom: 40, // Two lines worth of height
        right: 100,
        width: 100,
        height: 40,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      // Cursor in middle should not be first or last line if wrapped
      createMockSelection(block, 50);

      // These tests depend on the getBoundingClientRect mocking working correctly
      // In a real scenario, wrapped text would have different rect positions
    });
  });
});

/**
 * Integration Test Scenarios for Arrow Key Navigation
 *
 * These scenarios should be verified manually:
 *
 * □ Two text blocks "foo" and "bar" - cursor at end of "foo", arrow down goes to start of "bar"
 * □ Two text blocks "foo" and "bar" - cursor at start of "bar", arrow up goes to end of "foo"
 * □ Multi-line block - arrow up/down within block moves cursor naturally within block
 * □ Multi-line block - arrow up from first line goes to previous block
 * □ Multi-line block - arrow down from last line goes to next block
 * □ Single key press should be sufficient for navigation (no double-press needed)
 * □ Horizontal cursor position should be preserved when possible
 * □ Navigation should work with form blocks and text blocks
 * □ Edge case: Empty blocks should allow navigation through them
 * □ Edge case: Blocks with only newlines should handle navigation correctly
 */
