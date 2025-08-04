/**
 * Debug Navigation Tests
 * 
 * Tests to debug why getCursorHorizontalPosition is returning 0
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

describe('Debug Navigation Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  test('debug horizontal position calculation', () => {
    // Create a block with content "foo"
    const block = document.createElement('div');
    block.contentEditable = 'true';
    block.textContent = 'foo';
    document.body.appendChild(block);

    console.log('Block content:', block.textContent);
    console.log('Block firstChild:', block.firstChild);
    console.log('Block firstChild type:', block.firstChild?.nodeType);
    console.log('Block firstChild textContent:', block.firstChild?.textContent);

    // Position cursor at end of "foo" using our mock function
    createMockSelection(block, 3);

    // Test the utility function
    const horizontalPosition = getCursorHorizontalPosition(block);
    console.log('Horizontal position from utility:', horizontalPosition);

    // We expect 3 because cursor is at end of "foo"
    expect(horizontalPosition).toBe(3);
  });

  test('debug simple range test', () => {
    const block = document.createElement('div');
    block.contentEditable = 'true';
    block.textContent = 'foo';
    document.body.appendChild(block);
    
    console.log('Manual text node content:', block.textContent);
    console.log('Block with manual node:', block.textContent);
    
    // Use our mock selection function
    createMockSelection(block, 3);
    
    // Test horizontal position
    const horizontalPos = getCursorHorizontalPosition(block);
    console.log('Horizontal position result:', horizontalPos);
    
    // Should be 3 (position in "foo")
    expect(horizontalPos).toBe(3);
  });
});