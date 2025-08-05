/**
 * Navigation Utils Tests
 *
 * Tests the core navigation utility functions that were improved:
 * 1. Cursor position detection (first line, last line)
 * 2. Line-based navigation logic
 * 3. Horizontal position preservation
 */

import { isCursorAtFirstLine, isCursorAtLastLine } from '../src/lib/utils';

// Mock DOM selection for testing
const mockSelection = (element: HTMLElement, offset: number) => {
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
  const mockSelectionObj = {
    rangeCount: 1,
    getRangeAt: jest.fn().mockReturnValue(mockRange),
    removeAllRanges: jest.fn(),
    addRange: jest.fn(),
    toString: jest.fn().mockReturnValue(''),
  };

  // Override window.getSelection to return our mock
  Object.defineProperty(window, 'getSelection', {
    writable: true,
    value: jest.fn().mockReturnValue(mockSelectionObj),
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

  return mockSelectionObj;
};

describe('Navigation Utils', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('isCursorAtFirstLine', () => {
    it('should return true for cursor at start of single line', () => {
      const element = document.createElement('div');
      element.textContent = 'Hello world';
      document.body.appendChild(element);

      mockSelection(element, 0);

      expect(isCursorAtFirstLine(element)).toBe(true);
    });

    it('should return true for cursor in middle of single line', () => {
      const element = document.createElement('div');
      element.textContent = 'Hello world';
      document.body.appendChild(element);

      mockSelection(element, 5);

      expect(isCursorAtFirstLine(element)).toBe(true);
    });

    it('should return true for cursor at end of single line', () => {
      const element = document.createElement('div');
      element.textContent = 'Hello world';
      document.body.appendChild(element);

      mockSelection(element, 11);

      expect(isCursorAtFirstLine(element)).toBe(true);
    });

    it('should return true for cursor on first line of multiline content', () => {
      const element = document.createElement('div');
      element.textContent = 'First line\nSecond line';
      document.body.appendChild(element);

      mockSelection(element, 5); // Middle of "First line"

      expect(isCursorAtFirstLine(element)).toBe(true);
    });

    it('should return false for cursor on second line of multiline content', () => {
      const element = document.createElement('div');
      element.textContent = 'First line\nSecond line';
      document.body.appendChild(element);

      mockSelection(element, 15); // Middle of "Second line"

      expect(isCursorAtFirstLine(element)).toBe(false);
    });

    it('should return true for empty element', () => {
      const element = document.createElement('div');
      element.textContent = '';
      document.body.appendChild(element);

      mockSelection(element, 0);

      expect(isCursorAtFirstLine(element)).toBe(true);
    });

    it('should handle element with only newlines', () => {
      const element = document.createElement('div');
      element.textContent = '\n\n';
      document.body.appendChild(element);

      mockSelection(element, 0); // At very start
      expect(isCursorAtFirstLine(element)).toBe(true);

      mockSelection(element, 1); // After first newline
      expect(isCursorAtFirstLine(element)).toBe(false);
    });
  });

  describe('isCursorAtLastLine', () => {
    it('should return true for cursor at end of single line', () => {
      const element = document.createElement('div');
      element.textContent = 'Hello world';
      document.body.appendChild(element);

      mockSelection(element, 11);

      expect(isCursorAtLastLine(element)).toBe(true);
    });

    it('should return true for cursor in middle of single line', () => {
      const element = document.createElement('div');
      element.textContent = 'Hello world';
      document.body.appendChild(element);

      mockSelection(element, 5);

      expect(isCursorAtLastLine(element)).toBe(true);
    });

    it('should return false for cursor on first line of multiline content', () => {
      const element = document.createElement('div');
      element.textContent = 'First line\nSecond line';
      document.body.appendChild(element);

      mockSelection(element, 5); // Middle of "First line"

      expect(isCursorAtLastLine(element)).toBe(false);
    });

    it('should return true for cursor on last line of multiline content', () => {
      const element = document.createElement('div');
      element.textContent = 'First line\nSecond line';
      document.body.appendChild(element);

      mockSelection(element, 15); // Middle of "Second line"

      expect(isCursorAtLastLine(element)).toBe(true);
    });

    it('should return true for empty element', () => {
      const element = document.createElement('div');
      element.textContent = '';
      document.body.appendChild(element);

      mockSelection(element, 0);

      expect(isCursorAtLastLine(element)).toBe(true);
    });

    it('should handle three-line content correctly', () => {
      const element = document.createElement('div');
      element.textContent = 'Line 1\nLine 2\nLine 3';
      document.body.appendChild(element);

      mockSelection(element, 3); // Middle of "Line 1"
      expect(isCursorAtLastLine(element)).toBe(false);

      mockSelection(element, 10); // Middle of "Line 2"
      expect(isCursorAtLastLine(element)).toBe(false);

      mockSelection(element, 17); // Middle of "Line 3"
      expect(isCursorAtLastLine(element)).toBe(true);
    });

    it('should handle trailing newline correctly', () => {
      const element = document.createElement('div');
      element.textContent = 'First line\n';
      document.body.appendChild(element);

      mockSelection(element, 5); // Middle of "First line"
      expect(isCursorAtLastLine(element)).toBe(false);

      mockSelection(element, 11); // After newline (empty last line)
      expect(isCursorAtLastLine(element)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle elements without text content', () => {
      const element = document.createElement('div');
      // No textContent set
      document.body.appendChild(element);

      mockSelection(element, 0);

      expect(isCursorAtFirstLine(element)).toBe(true);
      expect(isCursorAtLastLine(element)).toBe(true);
    });

    it('should handle elements with only whitespace', () => {
      const element = document.createElement('div');
      element.textContent = '   ';
      document.body.appendChild(element);

      mockSelection(element, 1); // Middle of whitespace

      expect(isCursorAtFirstLine(element)).toBe(true);
      expect(isCursorAtLastLine(element)).toBe(true);
    });

    it('should handle selection API not available', () => {
      const element = document.createElement('div');
      element.textContent = 'Hello world';
      document.body.appendChild(element);

      Object.defineProperty(window, 'getSelection', {
        writable: true,
        value: jest.fn().mockReturnValue(null),
      });

      // Should not throw and return safe defaults
      expect(() => {
        isCursorAtFirstLine(element);
        isCursorAtLastLine(element);
      }).not.toThrow();
    });
  });

  describe('Real world scenarios', () => {
    it('should correctly identify cursor position in "foo" -> "bar" navigation scenario', () => {
      const fooElement = document.createElement('div');
      fooElement.textContent = 'foo';

      const barElement = document.createElement('div');
      barElement.textContent = 'bar';

      document.body.appendChild(fooElement);
      document.body.appendChild(barElement);

      // Cursor at end of "foo"
      mockSelection(fooElement, 3);
      expect(isCursorAtLastLine(fooElement)).toBe(true);

      // When navigating to "bar", cursor should be detectable correctly
      mockSelection(barElement, 0);
      expect(isCursorAtFirstLine(barElement)).toBe(true);

      mockSelection(barElement, 3);
      expect(isCursorAtLastLine(barElement)).toBe(true);
    });

    it('should handle paragraph with multiple sentences', () => {
      const element = document.createElement('div');
      element.textContent =
        'First sentence. Second sentence.\nNew paragraph here.';
      document.body.appendChild(element);

      // Cursor in middle of first line
      mockSelection(element, 20); // Around "Second"
      expect(isCursorAtFirstLine(element)).toBe(true);
      expect(isCursorAtLastLine(element)).toBe(false);

      // Cursor on second line
      mockSelection(element, 40); // In "New paragraph"
      expect(isCursorAtFirstLine(element)).toBe(false);
      expect(isCursorAtLastLine(element)).toBe(true);
    });
  });
});
