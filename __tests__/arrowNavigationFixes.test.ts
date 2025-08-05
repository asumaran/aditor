/**
 * Arrow Navigation Tests - Fixed Approach
 *
 * Tests navigation functions by checking their observable behavior rather than internal implementation
 */

import {
  isCursorAtFirstLine,
  isCursorAtLastLine,
  navigateToFirstLine,
  navigateToLastLine,
  setCursorAtPosition,
} from '../src/lib/utils';

describe('Arrow Navigation Tests (Fixed)', () => {
  // Helper to create properly mocked DOM elements
  const createMockElement = (content: string) => {
    const element = document.createElement('div');
    element.setAttribute('contenteditable', 'true');
    element.textContent = content;

    // Mock innerText for JSDOM compatibility
    Object.defineProperty(element, 'innerText', {
      get: () => element.textContent || '',
      configurable: true,
    });

    // Mock focus
    element.focus = jest.fn();

    document.body.appendChild(element);
    return element;
  };

  // Helper to setup selection mocking
  const setupSelectionMock = () => {
    const mockRange = {
      selectNodeContents: jest.fn(),
      setStart: jest.fn(),
      setEnd: jest.fn(),
      collapse: jest.fn(),
      toString: jest.fn().mockReturnValue(''),
    };

    const mockSelection = {
      rangeCount: 1,
      getRangeAt: jest.fn().mockReturnValue(mockRange),
      removeAllRanges: jest.fn(),
      addRange: jest.fn(),
      toString: jest.fn().mockReturnValue(''),
    };

    Object.defineProperty(window, 'getSelection', {
      writable: true,
      value: jest.fn().mockReturnValue(mockSelection),
    });

    Object.defineProperty(document, 'createRange', {
      writable: true,
      value: jest.fn().mockReturnValue(mockRange),
    });

    // Mock TreeWalker for setCursorAtPosition
    Object.defineProperty(document, 'createTreeWalker', {
      writable: true,
      value: jest.fn().mockImplementation((root) => ({
        nextNode: jest
          .fn()
          .mockReturnValueOnce({
            textContent: root.textContent || '',
            nodeType: 3,
          })
          .mockReturnValue(null),
      })),
    });

    return { mockRange, mockSelection };
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    setupSelectionMock();
  });

  describe('Cursor Position Detection Functions', () => {
    const mockCursorPosition = (element: HTMLElement, offset: number) => {
      const content = element.textContent || '';
      const actualOffset = Math.min(offset, content.length);

      // Mock the range toString to return text up to cursor position
      const mockRange = {
        toString: jest.fn().mockReturnValue(content.substring(0, actualOffset)),
        startContainer: element.firstChild || element,
        startOffset: actualOffset,
      };

      const mockSelection = {
        rangeCount: 1,
        getRangeAt: jest.fn().mockReturnValue(mockRange),
      };

      Object.defineProperty(window, 'getSelection', {
        writable: true,
        value: jest.fn().mockReturnValue(mockSelection),
      });

      // Mock createRange for the preRange in cursor detection
      Object.defineProperty(document, 'createRange', {
        writable: true,
        value: jest.fn().mockReturnValue({
          selectNodeContents: jest.fn(),
          setEnd: jest.fn(),
          toString: jest
            .fn()
            .mockReturnValue(content.substring(0, actualOffset)),
        }),
      });
    };

    describe('isCursorAtFirstLine', () => {
      test('returns true for cursor at start of single line', () => {
        const element = createMockElement('Hello world');
        mockCursorPosition(element, 0);

        expect(isCursorAtFirstLine(element)).toBe(true);
      });

      test('returns true for cursor anywhere on first line', () => {
        const element = createMockElement('Hello world');
        mockCursorPosition(element, 5);

        expect(isCursorAtFirstLine(element)).toBe(true);
      });

      test('returns false for cursor on second line', () => {
        const element = createMockElement('First line\nSecond line');
        mockCursorPosition(element, 15); // After newline

        expect(isCursorAtFirstLine(element)).toBe(false);
      });

      test('returns true for empty element', () => {
        const element = createMockElement('');
        mockCursorPosition(element, 0);

        expect(isCursorAtFirstLine(element)).toBe(true);
      });
    });

    describe('isCursorAtLastLine', () => {
      test('returns true for cursor at end of single line', () => {
        const element = createMockElement('Hello world');
        mockCursorPosition(element, 11);

        expect(isCursorAtLastLine(element)).toBe(true);
      });

      test('returns true for cursor anywhere on last line of multiline', () => {
        const element = createMockElement('First line\nSecond line');
        mockCursorPosition(element, 15); // On second line

        expect(isCursorAtLastLine(element)).toBe(true);
      });

      test('returns false for cursor on first line of multiline', () => {
        const element = createMockElement('First line\nSecond line');
        mockCursorPosition(element, 5); // On first line

        expect(isCursorAtLastLine(element)).toBe(false);
      });

      test('returns true for empty element', () => {
        const element = createMockElement('');
        mockCursorPosition(element, 0);

        expect(isCursorAtLastLine(element)).toBe(true);
      });
    });
  });

  describe('Navigation Functions - Behavioral Tests', () => {
    test('navigateToFirstLine calls focus and does not throw', () => {
      const element = createMockElement('Hello world\nSecond line');

      expect(() => navigateToFirstLine(element, 5)).not.toThrow();
      expect(element.focus).toHaveBeenCalled();
    });

    test('navigateToFirstLine with single line content', () => {
      const element = createMockElement('Single line');

      expect(() => navigateToFirstLine(element, 5)).not.toThrow();
      expect(element.focus).toHaveBeenCalled();
    });

    test('navigateToLastLine calls focus and does not throw', () => {
      const element = createMockElement('First line\nSecond line');

      expect(() => navigateToLastLine(element, 5)).not.toThrow();
      expect(element.focus).toHaveBeenCalled();
    });

    test('navigateToLastLine with single line content', () => {
      const element = createMockElement('Single line');

      expect(() => navigateToLastLine(element, 5)).not.toThrow();
      expect(element.focus).toHaveBeenCalled();
    });

    test('setCursorAtPosition does not throw and manipulates selection', () => {
      const element = createMockElement('Hello world');
      const { mockSelection } = setupSelectionMock();

      expect(() => setCursorAtPosition(element, 6)).not.toThrow();

      // Should have manipulated the selection
      expect(mockSelection.removeAllRanges).toHaveBeenCalled();
      expect(mockSelection.addRange).toHaveBeenCalled();
    });

    test('setCursorAtPosition with position beyond content length', () => {
      const element = createMockElement('Hello');
      const { mockSelection } = setupSelectionMock();

      expect(() => setCursorAtPosition(element, 10)).not.toThrow();

      expect(mockSelection.removeAllRanges).toHaveBeenCalled();
      expect(mockSelection.addRange).toHaveBeenCalled();
    });

    test('setCursorAtPosition with empty content', () => {
      const element = createMockElement('');
      const { mockSelection } = setupSelectionMock();

      expect(() => setCursorAtPosition(element, 0)).not.toThrow();

      expect(mockSelection.removeAllRanges).toHaveBeenCalled();
      expect(mockSelection.addRange).toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    test('navigation between blocks with different lengths completes successfully', () => {
      const block1 = createMockElement('foo');
      const block2 = createMockElement('bar');

      // Test navigation from foo to bar
      expect(() => navigateToFirstLine(block2, 3)).not.toThrow();
      expect(block2.focus).toHaveBeenCalled();
    });

    test('multiple navigation calls complete successfully', () => {
      const element = createMockElement('Line 1\nLine 2 is longer\nLine 3');

      expect(() => {
        navigateToLastLine(element, 8);
        navigateToFirstLine(element, 8);
      }).not.toThrow();

      expect(element.focus).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    test('functions handle missing elements gracefully', () => {
      // Test with elements that might not be in DOM
      const element = document.createElement('div');
      element.setAttribute('contenteditable', 'true');
      element.textContent = 'Test content';

      Object.defineProperty(element, 'innerText', {
        get: () => element.textContent || '',
        configurable: true,
      });
      element.focus = jest.fn();

      expect(() => navigateToFirstLine(element, 5)).not.toThrow();
      expect(() => navigateToLastLine(element, 5)).not.toThrow();
      expect(() => setCursorAtPosition(element, 5)).not.toThrow();
    });

    test('functions handle elements without contenteditable', () => {
      const element = document.createElement('div');
      element.textContent = 'Test content';
      element.focus = jest.fn();

      // These should handle non-contenteditable elements gracefully
      expect(() => navigateToFirstLine(element, 5)).not.toThrow();
      expect(() => navigateToLastLine(element, 5)).not.toThrow();
    });
  });
});
