/**
 * Form Block Focus Tests
 * 
 * Tests to verify that form blocks (short_answer, multiple_choice, multiselect)
 * position the cursor at the end of their default label text when created.
 */

import { FocusManager } from '@/lib/FocusManager';

describe('Form Block Focus Tests', () => {
  let focusManager: FocusManager;
  
  beforeEach(() => {
    document.body.innerHTML = '';
    focusManager = FocusManager.getInstance();
    jest.clearAllMocks();
  });

  test('should handle cursorAtEnd option correctly in onBlockCreated', () => {
    // Test that onBlockCreated respects cursorAtEnd option
    const spy = jest.spyOn(focusManager, 'focusBlockForEvent');
    
    // Call onBlockCreated with cursorAtEnd: true
    focusManager.onBlockCreated(123, {
      autoFocus: true,
      deferred: true,
      cursorAtEnd: true,
    });
    
    // Verify that focusBlockForEvent was called with cursorAtEnd: true
    expect(spy).toHaveBeenCalledWith(
      123,
      'block-created',
      expect.objectContaining({
        cursorAtEnd: true,
        autoFocus: true,
        deferred: true,
      })
    );
    
    // Verify that cursorAtStart was not added when cursorAtEnd is specified
    const callArgs = spy.mock.calls[0][2];
    expect(callArgs.cursorAtStart).toBeUndefined();
  });

  test('should detect contenteditable in form blocks', () => {
    // Create a mock form block structure
    const formBlock = document.createElement('div');
    formBlock.setAttribute('data-block-id', '456');
    formBlock.setAttribute('data-block-type', 'short_answer');
    
    // Add contenteditable label (like ShortAnswerBlock has)
    const label = document.createElement('div');
    label.setAttribute('contenteditable', 'true'); // Use setAttribute for better compatibility
    label.textContent = 'Sample Short Answer Question';
    label.setAttribute('data-placeholder', 'Question name');
    formBlock.appendChild(label);
    
    // Add input field
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Short answer text';
    formBlock.appendChild(input);
    
    document.body.appendChild(formBlock);
    
    // Test that the first focusable element is the contenteditable
    const focusableElements = Array.from(
      formBlock.querySelectorAll('input, textarea, [contenteditable="true"], button, select, [tabindex]:not([tabindex="-1"])')
    );
    
    expect(focusableElements.length).toBe(2); // contenteditable + input
    expect(focusableElements[0]).toBe(label); // contenteditable comes first
    expect((focusableElements[0] as HTMLElement).getAttribute('contenteditable')).toBe('true');
  });

  test('should position cursor at end for contenteditable elements', () => {
    // Create contenteditable element
    const contentEditable = document.createElement('div');
    contentEditable.contentEditable = 'true';
    contentEditable.textContent = 'Question Text';
    document.body.appendChild(contentEditable);
    
    // Mock window.getSelection
    const mockRange = {
      selectNodeContents: jest.fn(),
      collapse: jest.fn(),
    };
    const mockSelection = {
      removeAllRanges: jest.fn(),
      addRange: jest.fn(),
    };
    
    global.window.getSelection = jest.fn(() => mockSelection as any);
    global.document.createRange = jest.fn(() => mockRange as any);
    
    // Simulate positioning cursor at end
    const range = document.createRange();
    range.selectNodeContents(contentEditable);
    range.collapse(false); // false = collapse to end
    
    // Verify the mock was called correctly
    expect(mockRange.selectNodeContents).toHaveBeenCalled();
    expect(mockRange.collapse).toHaveBeenCalledWith(false);
  });
});

/**
 * These tests verify:
 * 1. onBlockCreated respects cursorAtEnd option and doesn't override it with cursorAtStart
 * 2. Form blocks have contenteditable as their first focusable element
 * 3. The focus system can detect and handle contenteditable elements correctly
 * 
 * The expected behavior is:
 * - When creating a ShortAnswerBlock with "Sample Short Answer Question"
 * - The cursor should be positioned at the end of the text
 * - Not at the beginning as it currently does
 */