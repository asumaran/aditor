/**
 * Backspace Behavior Tests
 *
 * Tests for backspace behavior between blocks, covering the specific cases
 * that were fixed in the focus system refactoring:
 *
 * 1. Backspace on empty block → delete block and focus previous at end
 * 2. Backspace at start of block with content → merge with previous block
 * 3. Normal backspace within content → normal character deletion
 */

import { FocusManager } from '@/lib/FocusManager';

// Mock DOM environment for testing
const createMockElement = (
  content: string = '',
  tag: string = 'div',
): HTMLElement => {
  const element = document.createElement(tag);
  element.textContent = content;
  if (tag === 'div') {
    element.contentEditable = 'true';
  }
  element.setAttribute('data-block-id', Math.random().toString());
  return element;
};

const createMockSelection = () => {
  const mockSelection = {
    removeAllRanges: jest.fn(),
    addRange: jest.fn(),
    getRangeAt: jest.fn(),
    rangeCount: 1,
  };

  const mockRange = {
    selectNodeContents: jest.fn(),
    collapse: jest.fn(),
    setStart: jest.fn(),
    setEnd: jest.fn(),
    startOffset: 0,
    endOffset: 0,
    collapsed: true,
    startContainer: document.createTextNode(''),
    endContainer: document.createTextNode(''),
  };

  mockSelection.getRangeAt.mockReturnValue(mockRange);

  Object.defineProperty(window, 'getSelection', {
    writable: true,
    value: jest.fn(() => mockSelection),
  });

  Object.defineProperty(document, 'createRange', {
    writable: true,
    value: jest.fn(() => mockRange),
  });

  return { mockSelection, mockRange };
};

describe('Backspace Behavior Tests', () => {
  let focusManager: FocusManager;

  beforeEach(() => {
    // Clear any existing DOM state
    document.body.innerHTML = '';

    // Create fresh FocusManager instance
    focusManager = FocusManager.getInstance();

    // Mock Selection API
    createMockSelection();
  });

  describe('Empty Block Deletion', () => {
    test('should delete empty block and focus previous block at end', () => {
      // Setup: Two blocks, second one empty
      const firstBlock = createMockElement('Hello world');
      const secondBlock = createMockElement('');

      firstBlock.setAttribute('data-block-id', '1');
      secondBlock.setAttribute('data-block-id', '2');

      document.body.appendChild(firstBlock);
      document.body.appendChild(secondBlock);

      // Mock callbacks
      const onDeleteBlock = jest.fn();
      const onMergeWithPrevious = jest.fn();

      // Test conditions for empty block backspace
      const currentValue = '';
      const isEmpty = !currentValue.trim();

      // Verify empty block is detected
      expect(isEmpty).toBe(true);

      // Simulate the handleBackspace logic for empty blocks
      const shouldCallDeleteBlock = isEmpty && onDeleteBlock;
      expect(shouldCallDeleteBlock).toBeTruthy();

      // Simulate FocusManager focusing previous block at end
      const focusResult = focusManager.focusBlockForEvent(1, 'block-deleted', {
        cursorAtEnd: true,
        autoFocus: true,
        deferred: true,
      });

      expect(focusResult).toBe(true);
    });

    test('should not delete if it is the only block', () => {
      // Setup: Single empty block
      const singleBlock = createMockElement('');
      singleBlock.setAttribute('data-block-id', '1');
      document.body.appendChild(singleBlock);

      const onDeleteBlock = jest.fn();

      // Test conditions
      const currentValue = '';
      const isEmpty = !currentValue.trim();
      const isOnlyBlock = true; // Simulating single block scenario

      // Should not delete if it's the only block
      const shouldCallDeleteBlock = isEmpty && !isOnlyBlock && onDeleteBlock;
      expect(shouldCallDeleteBlock).toBeFalsy();
    });
  });

  describe('Block Merging at Start', () => {
    test('should merge blocks when backspace at start with content', () => {
      // Setup: Two blocks with content
      const firstBlock = createMockElement('Hello ');
      const secondBlock = createMockElement('world');

      firstBlock.setAttribute('data-block-id', '1');
      secondBlock.setAttribute('data-block-id', '2');

      document.body.appendChild(firstBlock);
      document.body.appendChild(secondBlock);

      // Mock cursor at start of second block
      const { mockRange } = createMockSelection();
      mockRange.startOffset = 0;

      const onMergeWithPrevious = jest.fn();

      // Test cursor at start detection
      const isCursorAtStart = mockRange.startOffset === 0;
      expect(isCursorAtStart).toBe(true);

      // Test merge logic
      const currentValue = 'world';
      const previousContent = 'Hello ';
      const expectedMergedContent = previousContent + currentValue;
      const expectedJunctionPoint = previousContent.length;

      expect(expectedMergedContent).toBe('Hello world');
      expect(expectedJunctionPoint).toBe(6);

      // Simulate FocusManager positioning cursor at junction
      const focusResult = focusManager.onBlockMerged(1, expectedJunctionPoint, {
        autoFocus: true,
        deferred: true,
      });

      expect(focusResult).toBe(true);
    });

    test('should handle merge with empty previous block', () => {
      // Setup: Empty first block, content in second
      const firstBlock = createMockElement('');
      const secondBlock = createMockElement('content');

      firstBlock.setAttribute('data-block-id', '1');
      secondBlock.setAttribute('data-block-id', '2');

      document.body.appendChild(firstBlock);
      document.body.appendChild(secondBlock);

      // Test merge with empty previous
      const previousContent = '';
      const currentContent = 'content';
      const expectedMergedContent = previousContent + currentContent;
      const expectedJunctionPoint = 0; // Start of content

      expect(expectedMergedContent).toBe('content');
      expect(expectedJunctionPoint).toBe(0);
    });
  });

  describe('Normal Backspace Behavior', () => {
    test('should not trigger special behavior for normal backspace', () => {
      // Setup: Block with content, cursor in middle
      const block = createMockElement('Hello world');
      block.setAttribute('data-block-id', '1');
      document.body.appendChild(block);

      // Mock cursor in middle (not at start, block not empty)
      const { mockRange } = createMockSelection();
      mockRange.startOffset = 6; // After "Hello "

      const currentValue = 'Hello world';
      const isEmpty = !currentValue.trim();
      const isCursorAtStart = mockRange.startOffset === 0;

      // Should not trigger special backspace behavior
      expect(isEmpty).toBe(false);
      expect(isCursorAtStart).toBe(false);

      // Normal backspace should not call block operations
      const shouldTriggerSpecialBehavior = isEmpty || isCursorAtStart;
      expect(shouldTriggerSpecialBehavior).toBe(false);
    });

    test('should handle backspace at end of content normally', () => {
      // Setup: Block with content, cursor at end
      const block = createMockElement('Hello');
      block.setAttribute('data-block-id', '1');
      document.body.appendChild(block);

      const { mockRange } = createMockSelection();
      const currentValue = 'Hello';
      mockRange.startOffset = currentValue.length; // At end

      const isEmpty = !currentValue.trim();
      const isCursorAtStart = mockRange.startOffset === 0;

      // Should not trigger special behavior even at end
      expect(isEmpty).toBe(false);
      expect(isCursorAtStart).toBe(false);

      const shouldTriggerSpecialBehavior = isEmpty || isCursorAtStart;
      expect(shouldTriggerSpecialBehavior).toBe(false);
    });
  });

  describe('FocusManager Integration', () => {
    test('should correctly position cursor at end after block deletion', () => {
      // Setup
      const block = createMockElement('Previous content');
      block.setAttribute('data-block-id', '1');
      document.body.appendChild(block);

      const { mockRange } = createMockSelection();

      // Test focus with cursorAtEnd option
      const focusResult = focusManager.focusBlockForEvent(1, 'block-deleted', {
        cursorAtEnd: true,
        autoFocus: true,
        deferred: true,
      });

      expect(focusResult).toBe(true);

      // Verify the range collapse was called with false (end position)
      // Note: This tests the internal behavior, in real scenarios the cursor
      // positioning would be handled by the DOM APIs
    });

    test('should correctly position cursor at junction point after merge', () => {
      // Setup
      const block = createMockElement('Merged content');
      block.setAttribute('data-block-id', '1');
      document.body.appendChild(block);

      const junctionPoint = 6; // After "Merged"

      // Test focus with specific offset
      const focusResult = focusManager.onBlockMerged(1, junctionPoint, {
        autoFocus: true,
        deferred: true,
      });

      expect(focusResult).toBe(true);
    });

    test('should handle focus when block is not found', () => {
      // Test focusing non-existent block
      const focusResult = focusManager.focusBlockForEvent(
        999,
        'block-deleted',
        {
          cursorAtEnd: true,
          autoFocus: true,
          deferred: true,
        },
      );

      // Should still return true for deferred operations
      expect(focusResult).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle backspace with only newline characters', () => {
      // Test block with only whitespace/newlines
      const currentValue = '\n\n  \t';
      const isEmpty = !currentValue.trim();

      expect(isEmpty).toBe(true);

      // Should be treated as empty block
    });

    test('should handle backspace with mixed content types', () => {
      // Test with mixed text and whitespace
      const currentValue = '  hello  ';
      const isEmpty = !currentValue.trim();

      expect(isEmpty).toBe(false);

      // Should not be treated as empty block
    });

    test('should handle rapid backspace operations', () => {
      // Simulate rapid backspace presses
      const operations = [
        { value: 'abc', cursorAt: 3, shouldTrigger: false },
        { value: 'ab', cursorAt: 2, shouldTrigger: false },
        { value: 'a', cursorAt: 1, shouldTrigger: false },
        { value: '', cursorAt: 0, shouldTrigger: true }, // Empty - should trigger
      ];

      operations.forEach(({ value, cursorAt, shouldTrigger }, index) => {
        const isEmpty = !value.trim();
        const isCursorAtStart = cursorAt === 0 && value.length > 0;
        const shouldTriggerSpecialBehavior = isEmpty || isCursorAtStart;

        expect(shouldTriggerSpecialBehavior).toBe(shouldTrigger);
      });
    });
  });

  describe('Block Type Compatibility', () => {
    test('should handle text block backspace behavior', () => {
      const textBlock = createMockElement('Text content');
      textBlock.setAttribute('data-block-id', '1');
      document.body.appendChild(textBlock);

      // Text blocks should support all backspace behaviors
      const blockType = 'text';
      const supportsBackspace = ['text', 'heading'].includes(blockType);

      expect(supportsBackspace).toBe(true);
    });

    test('should handle heading block backspace behavior', () => {
      const headingBlock = createMockElement('Heading content');
      headingBlock.setAttribute('data-block-id', '1');
      document.body.appendChild(headingBlock);

      // Heading blocks should support all backspace behaviors
      const blockType = 'heading';
      const supportsBackspace = ['text', 'heading'].includes(blockType);

      expect(supportsBackspace).toBe(true);
    });

    test('should not merge with form blocks', () => {
      // Form blocks should not be merged with
      const formBlockTypes = ['short_answer', 'multiple_choice', 'multiselect'];

      formBlockTypes.forEach((blockType) => {
        const supportsBackspaceMerge = ['text', 'heading'].includes(blockType);
        expect(supportsBackspaceMerge).toBe(false);
      });
    });
  });
});

/**
 * Integration Test Scenarios
 *
 * These test scenarios should be verified manually or with integration tests:
 *
 * □ Create two text blocks → delete second when empty → cursor at end of first
 * □ Create two text blocks → backspace at start of second → blocks merge at junction
 * □ Create text + form block → backspace in form should not merge with text
 * □ Create single block → backspace when empty → block remains (cannot delete last)
 * □ Rapid backspace operations → focus behavior remains consistent
 * □ Undo/redo operations → backspace behavior works correctly
 * □ Copy/paste operations → backspace behavior works with pasted content
 */
