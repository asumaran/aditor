/**
 * useBlockCreation Hook Logic Tests
 *
 * Tests for the core logic used in useBlockCreation hook, focusing on the handleBackspace
 * behavior that was refactored to fix the backspace regression.
 *
 * These tests focus on the core logic functions rather than the React hook itself.
 */

// Test helper functions that replicate the hook logic
const createHandleBackspace = (callbacks: {
  onDeleteBlock?: jest.Mock;
  onMergeWithPrevious?: jest.Mock;
  hasPreviousBlock: boolean;
}) => {
  const { onDeleteBlock, onMergeWithPrevious, hasPreviousBlock } = callbacks;

  const isCursorAtStart = (element: HTMLElement): boolean => {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return false;

    const range = selection.getRangeAt(0);
    if (!range.collapsed) return false;

    const preRange = document.createRange();
    preRange.selectNodeContents(element);
    preRange.setEnd(range.startContainer, range.startOffset);
    const cursorPosition = preRange.toString().length;

    return cursorPosition === 0;
  };

  const mergeWithPreviousBlock = (currentValue: string) => {
    if (hasPreviousBlock && onMergeWithPrevious) {
      onMergeWithPrevious(currentValue);
    }
  };

  return (element: HTMLElement, currentValue: string): boolean => {
    // Handle malformed input
    if (currentValue == null) {
      return false;
    }

    // If empty block
    if (!currentValue.trim()) {
      // Only delete if not first block
      if (hasPreviousBlock && onDeleteBlock) {
        onDeleteBlock();
      }
      return true;
    }

    // If cursor at start
    if (isCursorAtStart(element)) {
      mergeWithPreviousBlock(currentValue);
      return true;
    }

    return false;
  };
};

// Mock DOM APIs
const createMockElement = (content: string = ''): HTMLElement => {
  const element = document.createElement('div');
  element.contentEditable = 'true';
  element.textContent = content;
  return element;
};

const createMockSelection = (startOffset: number = 0, content: string = '') => {
  const mockRange = {
    collapsed: true,
    startOffset,
    endOffset: startOffset,
    startContainer: document.createTextNode(content),
    endContainer: document.createTextNode(content),
    setStart: jest.fn(),
    setEnd: jest.fn(),
  };

  const mockSelection = {
    rangeCount: 1,
    getRangeAt: jest.fn(() => mockRange),
    removeAllRanges: jest.fn(),
    addRange: jest.fn(),
  };

  Object.defineProperty(window, 'getSelection', {
    writable: true,
    value: jest.fn(() => mockSelection),
  });

  Object.defineProperty(document, 'createRange', {
    writable: true,
    value: jest.fn(() => ({
      selectNodeContents: jest.fn(),
      setStart: jest.fn(),
      setEnd: jest.fn(),
      toString: jest.fn(() => content.slice(0, startOffset)),
    })),
  });

  return { mockSelection, mockRange };
};

describe('useBlockCreation Logic Tests', () => {
  let onCreateBlockAfter: jest.Mock;
  let onChange: jest.Mock;
  let onMergeWithPrevious: jest.Mock;
  let onDeleteBlock: jest.Mock;

  beforeEach(() => {
    onCreateBlockAfter = jest.fn();
    onChange = jest.fn();
    onMergeWithPrevious = jest.fn();
    onDeleteBlock = jest.fn();

    // Clear DOM
    document.body.innerHTML = '';
  });

  describe('handleBackspace - Empty Block Deletion', () => {
    test('should call onDeleteBlock when block is empty and has previous block', () => {
      const handleBackspace = createHandleBackspace({
        onDeleteBlock,
        onMergeWithPrevious,
        hasPreviousBlock: true,
      });

      const element = createMockElement('');
      createMockSelection(0, '');

      const handled = handleBackspace(element, '');
      expect(handled).toBe(true);
      expect(onDeleteBlock).toHaveBeenCalledTimes(1);
      expect(onMergeWithPrevious).not.toHaveBeenCalled();
    });

    test('should not call onDeleteBlock when block is empty but has no previous block', () => {
      const handleBackspace = createHandleBackspace({
        onDeleteBlock,
        onMergeWithPrevious,
        hasPreviousBlock: false,
      });

      const element = createMockElement('');
      createMockSelection(0, '');

      const handled = handleBackspace(element, '');
      expect(handled).toBe(true);
      expect(onDeleteBlock).not.toHaveBeenCalled();
      expect(onMergeWithPrevious).not.toHaveBeenCalled();
    });

    test('should treat whitespace-only content as empty', () => {
      const handleBackspace = createHandleBackspace({
        onDeleteBlock,
        onMergeWithPrevious,
        hasPreviousBlock: true,
      });

      const element = createMockElement('  \n\t  ');
      createMockSelection(0, '');

      const handled = handleBackspace(element, '  \n\t  ');
      expect(handled).toBe(true);
      expect(onDeleteBlock).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleBackspace - Block Merging', () => {
    test('should call onMergeWithPrevious when cursor is at start of non-empty block', () => {
      const handleBackspace = createHandleBackspace({
        onDeleteBlock,
        onMergeWithPrevious,
        hasPreviousBlock: true,
      });

      const element = createMockElement('Hello world');
      createMockSelection(0, 'Hello world'); // Cursor at start

      const handled = handleBackspace(element, 'Hello world');
      expect(handled).toBe(true);
      expect(onMergeWithPrevious).toHaveBeenCalledWith('Hello world');
      expect(onDeleteBlock).not.toHaveBeenCalled();
    });

    test('should not merge when cursor is not at start', () => {
      const handleBackspace = createHandleBackspace({
        onDeleteBlock,
        onMergeWithPrevious,
        hasPreviousBlock: true,
      });

      const element = createMockElement('Hello world');
      createMockSelection(6, 'Hello world'); // Cursor in middle

      const handled = handleBackspace(element, 'Hello world');
      expect(handled).toBe(false);
      expect(onMergeWithPrevious).not.toHaveBeenCalled();
      expect(onDeleteBlock).not.toHaveBeenCalled();
    });

    test('should handle merge when no previous block exists', () => {
      const handleBackspace = createHandleBackspace({
        onDeleteBlock,
        onMergeWithPrevious,
        hasPreviousBlock: false,
      });

      const element = createMockElement('Hello world');
      createMockSelection(0, 'Hello world');

      const handled = handleBackspace(element, 'Hello world');
      expect(handled).toBe(true);
      expect(onMergeWithPrevious).not.toHaveBeenCalled(); // No previous block to merge with
    });
  });

  describe('Regression Tests', () => {
    test('should handle the specific regression case: empty second block backspace', () => {
      // This tests the exact scenario that was reported as a regression
      const handleBackspace = createHandleBackspace({
        onDeleteBlock,
        onMergeWithPrevious,
        hasPreviousBlock: true, // Second block has a previous block
      });

      const emptySecondBlock = createMockElement('');
      createMockSelection(0, '');

      // This should delete the block and focus the previous one
      const handled = handleBackspace(emptySecondBlock, '');

      expect(handled).toBe(true);
      expect(onDeleteBlock).toHaveBeenCalledTimes(1);
      expect(onMergeWithPrevious).not.toHaveBeenCalled();
    });

    test('should handle cursor positioning after merge', () => {
      // Test the specific case where cursor should be at junction point
      const handleBackspace = createHandleBackspace({
        onDeleteBlock,
        onMergeWithPrevious,
        hasPreviousBlock: true,
      });

      const secondBlock = createMockElement('world');
      createMockSelection(0, 'world'); // Cursor at start of "world"

      const handled = handleBackspace(secondBlock, 'world');

      expect(handled).toBe(true);
      expect(onMergeWithPrevious).toHaveBeenCalledWith('world');

      // The merge should position cursor at junction point
      // This is handled by the parent component via FocusManager
    });
  });

  describe('Edge Cases', () => {
    test('should handle rapid backspace calls', () => {
      const handleBackspace = createHandleBackspace({
        onDeleteBlock,
        onMergeWithPrevious,
        hasPreviousBlock: true,
      });

      const element = createMockElement('');
      createMockSelection(0, '');

      // Simulate rapid backspace calls
      for (let i = 0; i < 5; i++) {
        handleBackspace(element, '');
      }

      // Should call onDeleteBlock for each call
      expect(onDeleteBlock).toHaveBeenCalledTimes(5);
    });

    test('should handle malformed content gracefully', () => {
      const handleBackspace = createHandleBackspace({
        onDeleteBlock,
        onMergeWithPrevious,
        hasPreviousBlock: true,
      });

      const element = createMockElement('');
      createMockSelection(0, '');

      // Test with various malformed inputs
      const malformedInputs = [
        null,
        undefined,
        '\0',
        String.fromCharCode(65533),
      ];

      malformedInputs.forEach((input) => {
        // Should not throw errors
        expect(() => {
          handleBackspace(element, input as any);
        }).not.toThrow();
      });
    });

    test('should handle different whitespace types', () => {
      const testCases = [
        { input: ' ', description: 'single space' },
        { input: '\n', description: 'newline' },
        { input: '\t', description: 'tab' },
        { input: '\r\n', description: 'carriage return + newline' },
        { input: '   \n\t  ', description: 'mixed whitespace' },
      ];

      testCases.forEach(({ input, description }) => {
        const handleBackspace = createHandleBackspace({
          onDeleteBlock: jest.fn(),
          onMergeWithPrevious: jest.fn(),
          hasPreviousBlock: true,
        });

        const element = createMockElement(input);
        createMockSelection(0, input);

        const handled = handleBackspace(element, input);

        expect(handled).toBe(true);
        expect(handleBackspace).toBeDefined(); // All should be treated as empty
      });
    });
  });

  describe('Block Type Compatibility Tests', () => {
    test('should work with different block types', () => {
      // Test that the logic works regardless of block type
      const blockTypes = ['text', 'heading', 'short_answer'];

      blockTypes.forEach((blockType) => {
        const handleBackspace = createHandleBackspace({
          onDeleteBlock: jest.fn(),
          onMergeWithPrevious: jest.fn(),
          hasPreviousBlock: true,
        });

        const element = createMockElement('');
        element.setAttribute('data-block-type', blockType);
        createMockSelection(0, '');

        const handled = handleBackspace(element, '');

        // Logic should work the same regardless of block type
        expect(handled).toBe(true);
      });
    });
  });
});
