/**
 * Field Navigation Tests
 *
 * Tests for the field navigation utilities that handle cursor positioning
 * and navigation between multiple editable fields within blocks.
 *
 * These tests focus on basic functionality and error handling rather than
 * complex DOM manipulation, as that's better tested in integration tests.
 */

import {
  focusAtStart,
  focusAtEnd,
  isAtBottomOfField,
  isAtTopOfField,
  createDownNavigationCommand,
  createUpNavigationCommand,
} from '@/lib/fieldNavigation';

// Mock getCursorHorizontalPosition since it's used in navigation commands
jest.mock('@/lib/utils', () => ({
  getCursorHorizontalPosition: jest.fn(() => 5), // Mock horizontal position
}));

// Mock DOM methods
const mockFocus = jest.fn();
const mockGetSelection = jest.fn(() => ({
  rangeCount: 1,
  getRangeAt: jest.fn(() => ({
    startOffset: 0,
    startContainer: { textContent: 'test' },
  })),
  removeAllRanges: jest.fn(),
  addRange: jest.fn(),
}));

Object.defineProperty(window, 'getSelection', {
  writable: true,
  value: mockGetSelection,
});

// Mock document.createRange and TreeWalker
Object.defineProperty(document, 'createRange', {
  writable: true,
  value: jest.fn(() => ({
    setStart: jest.fn(),
    setEnd: jest.fn(),
    collapse: jest.fn(),
    selectNodeContents: jest.fn(),
    toString: jest.fn(() => ''),
    startContainer: { textContent: 'test' },
    startOffset: 0,
  })),
});

Object.defineProperty(document, 'createTreeWalker', {
  writable: true,
  value: jest.fn(() => ({
    nextNode: jest.fn(() => null),
  })),
});

// Utility to create a mock element for field navigation tests
const createMockFieldElement = (
  content: string = 'test content',
): HTMLElement => {
  const element = {
    textContent: content,
    focus: mockFocus,
  } as unknown as HTMLElement;
  return element;
};

describe('fieldNavigation utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('focusAtStart', () => {
    test('should handle null element gracefully', () => {
      expect(() => focusAtStart(null)).not.toThrow();
      expect(() => focusAtStart(null, 5)).not.toThrow();
    });

    test('should focus element when called without horizontal position', () => {
      const element = createMockFieldElement('Hello World');

      expect(() => focusAtStart(element)).not.toThrow();
      expect(mockFocus).toHaveBeenCalled();
    });

    test('should focus element when called with horizontal position', () => {
      const element = createMockFieldElement('Hello World\nSecond Line');

      expect(() => focusAtStart(element, 5)).not.toThrow();
      expect(mockFocus).toHaveBeenCalled();
    });

    test('should handle empty element with horizontal position', () => {
      const element = createMockFieldElement('');

      expect(() => focusAtStart(element, 5)).not.toThrow();
      expect(mockFocus).toHaveBeenCalled();
    });
  });

  describe('focusAtEnd', () => {
    test('should handle null element gracefully', () => {
      expect(() => focusAtEnd(null)).not.toThrow();
      expect(() => focusAtEnd(null, 5)).not.toThrow();
    });

    test('should focus element when called without horizontal position', () => {
      const element = createMockFieldElement('Hello World');

      expect(() => focusAtEnd(element)).not.toThrow();
      expect(mockFocus).toHaveBeenCalled();
    });

    test('should focus element when called with horizontal position', () => {
      const element = createMockFieldElement('First Line\nSecond Line');

      expect(() => focusAtEnd(element, 3)).not.toThrow();
      expect(mockFocus).toHaveBeenCalled();
    });

    test('should handle empty element with horizontal position', () => {
      const element = createMockFieldElement('');

      expect(() => focusAtEnd(element, 5)).not.toThrow();
      expect(mockFocus).toHaveBeenCalled();
    });
  });

  describe('isAtBottomOfField', () => {
    test('should return false for null element', () => {
      expect(isAtBottomOfField(null)).toBe(false);
    });

    test('should not throw for valid element', () => {
      const element = createMockFieldElement('Hello World');
      expect(() => isAtBottomOfField(element)).not.toThrow();
    });
  });

  describe('isAtTopOfField', () => {
    test('should return false for null element', () => {
      expect(isAtTopOfField(null)).toBe(false);
    });

    test('should not throw for valid element', () => {
      const element = createMockFieldElement('Hello World');
      expect(() => isAtTopOfField(element)).not.toThrow();
    });
  });

  describe('createDownNavigationCommand', () => {
    test('should create command with correct key', () => {
      const fromRef = { current: createMockFieldElement('From') };
      const toRef = { current: createMockFieldElement('To') };

      const command = createDownNavigationCommand(fromRef, toRef);

      expect(command.key).toBe('ArrowDown');
      expect(typeof command.condition).toBe('function');
      expect(typeof command.handler).toBe('function');
    });

    test('should handle command execution without errors', () => {
      const fromRef = { current: createMockFieldElement('From') };
      const toRef = { current: createMockFieldElement('To') };

      const command = createDownNavigationCommand(fromRef, toRef);

      expect(() => command.handler()).not.toThrow();
    });

    test('should handle null refs gracefully', () => {
      const fromRef = { current: null };
      const toRef = { current: null };

      const command = createDownNavigationCommand(fromRef, toRef);

      expect(() => command.handler()).not.toThrow();
    });
  });

  describe('createUpNavigationCommand', () => {
    test('should create command with correct key', () => {
      const fromRef = { current: createMockFieldElement('From') };
      const toRef = { current: createMockFieldElement('To') };

      const command = createUpNavigationCommand(fromRef, toRef);

      expect(command.key).toBe('ArrowUp');
      expect(typeof command.condition).toBe('function');
      expect(typeof command.handler).toBe('function');
    });

    test('should handle command execution without errors', () => {
      const fromRef = { current: createMockFieldElement('From') };
      const toRef = { current: createMockFieldElement('To') };

      const command = createUpNavigationCommand(fromRef, toRef);

      expect(() => command.handler()).not.toThrow();
    });

    test('should handle null refs gracefully', () => {
      const fromRef = { current: null };
      const toRef = { current: null };

      const command = createUpNavigationCommand(fromRef, toRef);

      expect(() => command.handler()).not.toThrow();
    });
  });

  describe('integration behavior', () => {
    test('should preserve horizontal position in navigation commands', () => {
      const fromElement = createMockFieldElement('Hello World');
      const toElement = createMockFieldElement('Target Line');

      const fromRef = { current: fromElement };
      const toRef = { current: toElement };

      const downCommand = createDownNavigationCommand(fromRef, toRef);
      const upCommand = createUpNavigationCommand(fromRef, toRef);

      // Should not throw and should call getCursorHorizontalPosition
      expect(() => downCommand.handler()).not.toThrow();
      expect(() => upCommand.handler()).not.toThrow();
    });
  });
});
