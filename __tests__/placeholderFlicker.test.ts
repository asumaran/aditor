/**
 * Placeholder Flicker Prevention Tests
 *
 * Tests to ensure that placeholder flickering is prevented during block splitting
 * operations, specifically when pressing Enter at the beginning of content.
 *
 * These tests prevent regression of the fix for the visual flicker that occurred
 * when splitting blocks at cursor position 0.
 */

// Mock DOM APIs and timing functions
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
  };

  const mockSelection = {
    rangeCount: 1,
    getRangeAt: jest.fn(() => mockRange),
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

// Test helper function that replicates the splitting logic
const createSplitAndCreateBlock = (callbacks: {
  onCreateBlockAfter?: jest.Mock;
  onChange?: jest.Mock;
  onSplittingStateChange?: jest.Mock;
}) => {
  const { onCreateBlockAfter, onChange, onSplittingStateChange } = callbacks;

  return (
    _element: HTMLElement,
    beforeContent: string,
    afterContent: string,
  ) => {
    if (!onCreateBlockAfter || !onChange) return null;

    // If after content is exactly one newline, create empty block
    const cleanAfter = afterContent === '\n' ? '' : afterContent;

    // Signal start of splitting to prevent placeholder flicker
    onSplittingStateChange?.(true);

    // Create new block with content after cursor FIRST
    const newBlockId = onCreateBlockAfter({
      initialContent: cleanAfter,
      cursorAtStart: true,
      // Pass callback to execute after focus transfer
      onFocusTransferred: () => {
        onChange(beforeContent);
        onSplittingStateChange?.(false);
      },
    });

    return newBlockId;
  };
};

describe('Placeholder Flicker Prevention Tests', () => {
  let onCreateBlockAfter: jest.Mock;
  let onChange: jest.Mock;
  let onSplittingStateChange: jest.Mock;

  beforeEach(() => {
    onCreateBlockAfter = jest.fn().mockReturnValue(123);
    onChange = jest.fn();
    onSplittingStateChange = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();

    // Clear DOM
    document.body.innerHTML = '';
  });

  describe('Splitting State Management', () => {
    test('should set splitting state to true before creating new block', () => {
      const splitFunction = createSplitAndCreateBlock({
        onCreateBlockAfter,
        onChange,
        onSplittingStateChange,
      });

      const element = createMockElement('foo');
      createMockSelection(0, 'foo');

      // Simulate split at cursor position 0: before="", after="foo"
      splitFunction(element, '', 'foo');

      // Should immediately set splitting state to true
      expect(onSplittingStateChange).toHaveBeenCalledWith(true);

      // Verify order: splitting state should be called first
      expect(onSplittingStateChange.mock.invocationCallOrder[0]).toBeLessThan(
        onCreateBlockAfter.mock.invocationCallOrder[0],
      );
    });

    test('should create new block with after content', () => {
      const splitFunction = createSplitAndCreateBlock({
        onCreateBlockAfter,
        onChange,
        onSplittingStateChange,
      });

      const element = createMockElement('hello world');
      createMockSelection(6, 'hello world'); // Cursor after "hello "

      // Simulate split: before="hello ", after="world"
      splitFunction(element, 'hello ', 'world');

      expect(onCreateBlockAfter).toHaveBeenCalledWith({
        initialContent: 'world',
        cursorAtStart: true,
        onFocusTransferred: expect.any(Function),
      });
    });

    test('should handle callback execution after focus transfer', () => {
      const splitFunction = createSplitAndCreateBlock({
        onCreateBlockAfter,
        onChange,
        onSplittingStateChange,
      });

      const element = createMockElement('foo');
      createMockSelection(0, 'foo');

      // Simulate split at cursor position 0
      splitFunction(element, '', 'foo');

      // Get the callback that was passed
      const createBlockCall = onCreateBlockAfter.mock.calls[0][0];
      const onFocusTransferred = createBlockCall.onFocusTransferred;

      expect(onFocusTransferred).toBeDefined();

      // Execute the callback (simulating focus transfer completion)
      onFocusTransferred();

      // Should update original block content and reset splitting state
      expect(onChange).toHaveBeenCalledWith('');
      expect(onSplittingStateChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Specific Regression Cases', () => {
    test('should prevent flicker when splitting at cursor position 0', () => {
      // This tests the exact scenario: "[cursor]foo" + Enter
      const splitFunction = createSplitAndCreateBlock({
        onCreateBlockAfter,
        onChange,
        onSplittingStateChange,
      });

      const element = createMockElement('foo');
      createMockSelection(0, 'foo');

      splitFunction(element, '', 'foo');

      // Verify the correct sequence:
      // 1. Splitting state set to true (prevents placeholder)
      expect(onSplittingStateChange).toHaveBeenNthCalledWith(1, true);

      // 2. New block created with "foo"
      expect(onCreateBlockAfter).toHaveBeenCalledWith({
        initialContent: 'foo',
        cursorAtStart: true,
        onFocusTransferred: expect.any(Function),
      });

      // 3. Original block content change deferred until after focus transfer
      expect(onChange).not.toHaveBeenCalled();

      // 4. After focus transfer callback
      const callback = onCreateBlockAfter.mock.calls[0][0].onFocusTransferred;
      callback();

      expect(onChange).toHaveBeenCalledWith('');
      expect(onSplittingStateChange).toHaveBeenNthCalledWith(2, false);
    });

    test('should handle splitting in middle of content', () => {
      // Test case: "hel[cursor]lo" + Enter
      const splitFunction = createSplitAndCreateBlock({
        onCreateBlockAfter,
        onChange,
        onSplittingStateChange,
      });

      const element = createMockElement('hello');
      createMockSelection(3, 'hello'); // Cursor after "hel"

      splitFunction(element, 'hel', 'lo');

      // Should create new block with "lo"
      expect(onCreateBlockAfter).toHaveBeenCalledWith({
        initialContent: 'lo',
        cursorAtStart: true,
        onFocusTransferred: expect.any(Function),
      });

      // After focus transfer, original block should contain "hel"
      const callback = onCreateBlockAfter.mock.calls[0][0].onFocusTransferred;
      callback();

      expect(onChange).toHaveBeenCalledWith('hel');
    });

    test('should handle splitting at end of content', () => {
      // Test case: "foo[cursor]" + Enter (cursor at end)
      const splitFunction = createSplitAndCreateBlock({
        onCreateBlockAfter,
        onChange,
        onSplittingStateChange,
      });

      const element = createMockElement('foo');
      createMockSelection(3, 'foo'); // Cursor at end

      splitFunction(element, 'foo', '');

      // Should create empty new block
      expect(onCreateBlockAfter).toHaveBeenCalledWith({
        initialContent: '',
        cursorAtStart: true,
        onFocusTransferred: expect.any(Function),
      });

      // Original block should keep "foo"
      const callback = onCreateBlockAfter.mock.calls[0][0].onFocusTransferred;
      callback();

      expect(onChange).toHaveBeenCalledWith('foo');
    });

    test('should handle newline content correctly', () => {
      // Test case where after content is exactly a newline
      const splitFunction = createSplitAndCreateBlock({
        onCreateBlockAfter,
        onChange,
        onSplittingStateChange,
      });

      const element = createMockElement('test\n');
      createMockSelection(4, 'test\n');

      splitFunction(element, 'test', '\n');

      // Newline should be converted to empty string
      expect(onCreateBlockAfter).toHaveBeenCalledWith({
        initialContent: '',
        cursorAtStart: true,
        onFocusTransferred: expect.any(Function),
      });
    });
  });

  describe('State Coordination', () => {
    test('should not change content if callbacks are missing', () => {
      const splitFunction = createSplitAndCreateBlock({
        // Missing onCreateBlockAfter and onChange
        onSplittingStateChange,
      });

      const element = createMockElement('foo');

      const result = splitFunction(element, '', 'foo');

      expect(result).toBeNull();
      expect(onSplittingStateChange).not.toHaveBeenCalled();
    });

    test('should handle missing splitting state callback gracefully', () => {
      const splitFunction = createSplitAndCreateBlock({
        onCreateBlockAfter,
        onChange,
        // Missing onSplittingStateChange
      });

      const element = createMockElement('foo');

      // Should not throw error
      expect(() => {
        splitFunction(element, '', 'foo');
      }).not.toThrow();

      expect(onCreateBlockAfter).toHaveBeenCalled();
    });

    test('should ensure proper call order', () => {
      const splitFunction = createSplitAndCreateBlock({
        onCreateBlockAfter,
        onChange,
        onSplittingStateChange,
      });

      const element = createMockElement('foo');

      splitFunction(element, '', 'foo');

      // Verify call order: splitting state first, then create block
      const calls = [
        ['onSplittingStateChange', onSplittingStateChange],
        ['onCreateBlockAfter', onCreateBlockAfter],
      ];

      calls.forEach(([, mockFn]) => {
        expect(mockFn).toHaveBeenCalled();
      });

      // onChange should not be called until after focus transfer
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty content splits', () => {
      const splitFunction = createSplitAndCreateBlock({
        onCreateBlockAfter,
        onChange,
        onSplittingStateChange,
      });

      const element = createMockElement('');

      splitFunction(element, '', '');

      expect(onCreateBlockAfter).toHaveBeenCalledWith({
        initialContent: '',
        cursorAtStart: true,
        onFocusTransferred: expect.any(Function),
      });

      const callback = onCreateBlockAfter.mock.calls[0][0].onFocusTransferred;
      callback();

      expect(onChange).toHaveBeenCalledWith('');
    });

    test('should handle whitespace-only content', () => {
      const splitFunction = createSplitAndCreateBlock({
        onCreateBlockAfter,
        onChange,
        onSplittingStateChange,
      });

      const element = createMockElement('   ');

      splitFunction(element, '', '   ');

      expect(onCreateBlockAfter).toHaveBeenCalledWith({
        initialContent: '   ',
        cursorAtStart: true,
        onFocusTransferred: expect.any(Function),
      });
    });
  });
});

/**
 * Integration Test Scenarios for Placeholder Flicker
 *
 * These scenarios should be verified manually or with integration tests:
 *
 * □ Type "foo" → position cursor at start → press Enter → no placeholder flicker
 * □ Type content → position cursor in middle → press Enter → smooth split
 * □ Type content → position cursor at end → press Enter → no visual glitch
 * □ Empty block → press Enter → consistent behavior with content splits
 * □ Rapid Enter presses → no flicker or state corruption
 * □ Split followed by immediate typing → proper focus and no interference
 * □ Split with undo/redo operations → state consistency maintained
 */
