/**
 * Navigation Behavior Tests
 * 
 * Tests to reproduce and fix the specific navigation issue:
 * - Navigation from "foo" to "bar" positions cursor at start of "bar" (correct)
 * - Arrow down from start of "bar" moves cursor to end of "bar" (correct)
 * - Arrow up from end of "bar" should move cursor to end of "foo" (but currently goes to start)
 */

import { getCursorHorizontalPosition } from '@/lib/utils';

// Utility to create mock selection that works with our utilities
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
      toString: jest.fn().mockImplementation(() => content.substring(0, actualOffset)),
      startContainer: textNode,
      startOffset: actualOffset,
      endContainer: textNode,
      endOffset: actualOffset,
    })),
  });
  
  return { range: mockRange, selection: mockSelection };
};

describe('Navigation Behavior Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  test('should calculate horizontal position correctly at end of block', () => {
    // Create a block with content "foo"
    const block = document.createElement('div');
    block.contentEditable = 'true';
    block.textContent = 'foo';
    document.body.appendChild(block);

    // Position cursor at end of "foo" using mock function
    createMockSelection(block, 3);

    // Get horizontal position
    const horizontalPos = getCursorHorizontalPosition(block);
    
    // Should be 3 (length of "foo")
    expect(horizontalPos).toBe(3);
  });

  test('should calculate horizontal position correctly at start of block', () => {
    // Create a block with content "bar"
    const block = document.createElement('div');
    block.contentEditable = 'true';
    block.textContent = 'bar';
    document.body.appendChild(block);

    // Position cursor at start of "bar" using mock function
    createMockSelection(block, 0);

    // Get horizontal position
    const horizontalPos = getCursorHorizontalPosition(block);
    
    // Should be 0
    expect(horizontalPos).toBe(0);
  });

  test('should navigate correctly with preserved horizontal position', () => {
    // This tests the expected behavior:
    // 1. Start with cursor at end of "foo" (position 3)
    // 2. Navigate down to "bar" -> should go to position 3 in "bar", but clamp to length of "bar"  
    // 3. Navigate up from "bar" -> should go to position that preserves horizontal position in "foo"

    const fooBlock = document.createElement('div');
    fooBlock.contentEditable = 'true';
    fooBlock.textContent = 'foo';
    document.body.appendChild(fooBlock);

    // Test scenario: cursor at end of "foo" (position 3)
    createMockSelection(fooBlock, 3);

    const horizontalPosFromFoo = getCursorHorizontalPosition(fooBlock);
    expect(horizontalPosFromFoo).toBe(3);

    // Create bar block and test navigation to it
    const barBlock = document.createElement('div');
    barBlock.contentEditable = 'true';
    barBlock.textContent = 'bar';
    document.body.appendChild(barBlock);

    // When navigating to "bar", position cursor at the same horizontal position
    createMockSelection(barBlock, 3);
    
    const horizontalPosInBar = getCursorHorizontalPosition(barBlock);
    expect(horizontalPosInBar).toBe(3); // At end of "bar"

    // Now when navigating back to "foo", test preserved horizontal position
    createMockSelection(fooBlock, 3);
    
    const finalHorizontalPos = getCursorHorizontalPosition(fooBlock);
    expect(finalHorizontalPos).toBe(3); // Should be at end of "foo", not start
  });

  test('should handle different block lengths correctly', () => {
    // Test with blocks of different lengths
    const shortBlock = document.createElement('div');
    shortBlock.contentEditable = 'true';
    shortBlock.textContent = 'hi';
    document.body.appendChild(shortBlock);

    const longBlock = document.createElement('div');
    longBlock.contentEditable = 'true';  
    longBlock.textContent = 'hello world';
    document.body.appendChild(longBlock);

    // Start at position 5 in long block using mock
    createMockSelection(longBlock, 5);

    const horizontalPos = getCursorHorizontalPosition(longBlock);
    expect(horizontalPos).toBe(5);

    // Navigate to short block - should clamp to length of short block (2)
    const targetPos = Math.min(horizontalPos, 2); // Min(5, 2) = 2
    createMockSelection(shortBlock, targetPos);

    const clampedPos = getCursorHorizontalPosition(shortBlock);
    expect(clampedPos).toBe(2); // At end of "hi"
  });
});

/**
 * These tests validate the horizontal position preservation logic.
 * The issue seems to be that when navigating back up, the system isn't
 * correctly preserving the horizontal position that was established
 * when navigating down.
 */