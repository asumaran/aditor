/**
 * FocusManager Tests
 * 
 * Tests the centralized focus management system that handles:
 * 1. Block creation focus (cursor positioning)
 * 2. Block splitting focus (Enter key behavior) 
 * 3. Block merging focus (Backspace behavior)
 * 4. Form block vs text block focus differences
 * 5. Cursor positioning options (start, end, offset)
 * 6. Deferred focus for React rendering
 */

import { FocusManager } from '../src/lib/FocusManager';

// Mock DOM environment
const createMockBlock = (
  blockId: number, 
  blockType: 'text' | 'heading' | 'short_answer' | 'multiple_choice' | 'multiselect' = 'text',
  content: string = ''
): HTMLElement => {
  const blockElement = document.createElement('div');
  blockElement.setAttribute('data-block-id', blockId.toString());
  blockElement.className = 'block-element';

  if (blockType === 'text' || blockType === 'heading') {
    // Text/heading blocks have contenteditable
    const contentEl = document.createElement(blockType === 'heading' ? 'h2' : 'div');
    contentEl.setAttribute('contenteditable', 'true');  // Use setAttribute instead of property
    contentEl.textContent = content;
    contentEl.className = blockType === 'heading' ? 'text-3xl font-semibold' : ''; // Help with detection
    contentEl.setAttribute('role', 'textbox');
    blockElement.appendChild(contentEl);
  } else {
    // Form blocks have label (contenteditable) + input elements  
    const labelEl = document.createElement('div');
    labelEl.setAttribute('contenteditable', 'true');  // Use setAttribute instead of property
    labelEl.textContent = content || 'Sample Question';
    labelEl.setAttribute('role', 'textbox');
    blockElement.appendChild(labelEl);

    if (blockType === 'short_answer') {
      const inputEl = document.createElement('input');
      inputEl.type = 'text';
      inputEl.placeholder = 'Your answer here...';
      // Make input focusable
      inputEl.tabIndex = 0;
      blockElement.appendChild(inputEl);
    } else if (blockType === 'multiple_choice') {
      const radioEl = document.createElement('input');
      radioEl.type = 'radio';
      radioEl.tabIndex = 0;
      blockElement.appendChild(radioEl);
    } else if (blockType === 'multiselect') {
      const checkboxEl = document.createElement('input');
      checkboxEl.type = 'checkbox';
      checkboxEl.tabIndex = 0;
      blockElement.appendChild(checkboxEl);
    }
  }

  // Mock focus function for all focusable elements
  const focusableElements = blockElement.querySelectorAll('[contenteditable="true"], input, textarea');
  focusableElements.forEach(el => {
    (el as HTMLElement).focus = jest.fn();
  });

  return blockElement;
};

describe('FocusManager', () => {
  let focusManager: FocusManager;
  let mockSelection: Selection;
  let mockRange: Range;

  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = '';
    
    // Get fresh instance
    focusManager = FocusManager.getInstance();

    // Mock Selection API
    mockRange = {
      selectNodeContents: jest.fn(),
      collapse: jest.fn(),
      setStart: jest.fn(),
      setEnd: jest.fn(),
    } as unknown as Range;

    mockSelection = {
      removeAllRanges: jest.fn(),
      addRange: jest.fn(),
      getRangeAt: jest.fn().mockReturnValue(mockRange),
      rangeCount: 1,
    } as unknown as Selection;

    Object.defineProperty(window, 'getSelection', {
      writable: true,
      value: jest.fn().mockReturnValue(mockSelection),
    });

    Object.defineProperty(document, 'createRange', {
      writable: true,
      value: jest.fn().mockReturnValue(mockRange),
    });

    // Mock HTMLElement.focus
    HTMLElement.prototype.focus = jest.fn();
    HTMLElement.prototype.blur = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Block Info Detection', () => {
    it('should correctly identify text block', () => {
      const textBlock = createMockBlock(1, 'text', 'Hello world');
      document.body.appendChild(textBlock);

      // Debug: log the HTML structure
      console.log('Text block HTML:', textBlock.outerHTML);
      console.log('Contenteditable elements:', textBlock.querySelectorAll('[contenteditable="true"]'));

      const blockInfo = focusManager.getBlockInfo(1);
      
      expect(blockInfo).toBeTruthy();
      expect(blockInfo!.blockId).toBe(1);
      expect(blockInfo!.blockType).toBe('text');
      expect(blockInfo!.isFormBlock).toBe(false);
      expect(blockInfo!.focusableElements).toHaveLength(1); // contenteditable
    });

    it('should correctly identify form block', () => {
      const formBlock = createMockBlock(2, 'short_answer', 'Question text');
      document.body.appendChild(formBlock);

      const blockInfo = focusManager.getBlockInfo(2);
      
      expect(blockInfo).toBeTruthy();
      expect(blockInfo!.blockId).toBe(2);
      expect(blockInfo!.blockType).toBe('short_answer');
      expect(blockInfo!.isFormBlock).toBe(true);
      expect(blockInfo!.focusableElements).toHaveLength(2); // label + input
    });

    it('should return null for non-existent block', () => {
      const blockInfo = focusManager.getBlockInfo(999);
      expect(blockInfo).toBeNull();
    });
  });

  describe('Block Creation Focus', () => {
    it('should focus text block at start by default', (done) => {
      const textBlock = createMockBlock(1, 'text');
      document.body.appendChild(textBlock);

      const result = focusManager.onBlockCreated(1);

      expect(result).toBe(true);
      
      // onBlockCreated uses deferred focus by default, so wait for requestAnimationFrame
      setTimeout(() => {
        const contentEl = textBlock.querySelector('[contenteditable="true"]') as HTMLElement;
        expect(contentEl.focus).toHaveBeenCalled();
        done();
      }, 50);
    });

    it('should focus form block at end of label when cursorAtEnd is true', (done) => {
      const formBlock = createMockBlock(2, 'short_answer', 'Sample Question');
      document.body.appendChild(formBlock);

      const result = focusManager.onBlockCreated(2, { cursorAtEnd: true });

      expect(result).toBe(true);
      
      // onBlockCreated uses deferred focus by default, so wait for requestAnimationFrame
      setTimeout(() => {
        const labelEl = formBlock.querySelector('[contenteditable="true"]') as HTMLElement;
        expect(labelEl.focus).toHaveBeenCalled();
        // Should position cursor at end
        expect(mockRange.selectNodeContents).toHaveBeenCalledWith(labelEl);
        expect(mockRange.collapse).toHaveBeenCalledWith(false); // false = at end
        done();
      }, 50);
    });

    it('should handle deferred focus with requestAnimationFrame', (done) => {
      const textBlock = createMockBlock(1, 'text');
      document.body.appendChild(textBlock);

      const result = focusManager.onBlockCreated(1, { deferred: true });

      expect(result).toBe(true);
      
      // Focus should not happen immediately
      const contentEl = textBlock.querySelector('[contenteditable="true"]') as HTMLElement;
      expect(contentEl.focus).not.toHaveBeenCalled();

      // Should happen after double requestAnimationFrame
      setTimeout(() => {
        expect(contentEl.focus).toHaveBeenCalled();
        done();
      }, 50);
    });
  });

  describe('Block Merging Focus', () => {
    it('should position cursor at junction point', () => {
      const textBlock = createMockBlock(1, 'text', 'Hello world');
      document.body.appendChild(textBlock);

      const junctionOffset = 5; // After "Hello"
      const result = focusManager.onBlockMerged(1, junctionOffset);

      expect(result).toBe(true);
      
      const contentEl = textBlock.querySelector('[contenteditable="true"]') as HTMLElement;
      expect(contentEl.focus).toHaveBeenCalled();
      
      // Should set cursor at specific offset
      expect(mockRange.setStart).toHaveBeenCalledWith(
        contentEl.firstChild, 
        junctionOffset
      );
      expect(mockRange.setEnd).toHaveBeenCalledWith(
        contentEl.firstChild, 
        junctionOffset
      );
    });
  });

  describe('Navigation Focus', () => {
    it('should focus element for navigation without cursor positioning by default', () => {
      const textBlock = createMockBlock(1, 'text', 'Hello world');
      document.body.appendChild(textBlock);

      const result = focusManager.onNavigation(1);

      expect(result).toBe(true);
      
      const contentEl = textBlock.querySelector('[contenteditable="true"]') as HTMLElement;
      expect(contentEl.focus).toHaveBeenCalled();
      
      // Navigation without cursor options should not position cursor
      expect(mockRange.selectNodeContents).not.toHaveBeenCalled();
      expect(mockRange.collapse).not.toHaveBeenCalled();
    });

    it('should respect cursorAtStart override', () => {
      const textBlock = createMockBlock(1, 'text', 'Hello world');
      document.body.appendChild(textBlock);

      const result = focusManager.onNavigation(1, { cursorAtStart: true });

      expect(result).toBe(true);
      
      const contentEl = textBlock.querySelector('[contenteditable="true"]') as HTMLElement;
      expect(contentEl.focus).toHaveBeenCalled();
      
      // Should position at start when explicitly requested
      expect(mockRange.selectNodeContents).toHaveBeenCalledWith(contentEl);
      expect(mockRange.collapse).toHaveBeenCalledWith(true); // true = at start
    });
  });

  describe('Cursor Position Management', () => {
    it('should track cursor at start blocks', () => {
      focusManager.setCursorAtStart(1);
      expect(focusManager.shouldCursorBeAtStart(1)).toBe(true);
      
      focusManager.clearCursorAtStart(1);
      expect(focusManager.shouldCursorBeAtStart(1)).toBe(false);
    });

    it('should apply cursor at start from internal state', () => {
      const textBlock = createMockBlock(1, 'text');
      document.body.appendChild(textBlock);

      // Set internal cursor at start flag
      focusManager.setCursorAtStart(1);

      const result = focusManager.focusBlock(1);

      expect(result).toBe(true);
      
      const contentEl = textBlock.querySelector('[contenteditable="true"]') as HTMLElement;
      expect(contentEl.focus).toHaveBeenCalled();
      
      // Should position at start due to internal flag
      expect(mockRange.selectNodeContents).toHaveBeenCalledWith(contentEl);
      expect(mockRange.collapse).toHaveBeenCalledWith(true); // true = at start
      
      // Should clear the flag after successful focus
      expect(focusManager.shouldCursorBeAtStart(1)).toBe(false);
    });

    it('should not override explicit cursor options', () => {
      const textBlock = createMockBlock(1, 'text');
      document.body.appendChild(textBlock);

      // Set internal cursor at start flag
      focusManager.setCursorAtStart(1);

      // But explicitly request cursor at end
      const result = focusManager.focusBlock(1, { cursorAtEnd: true });

      expect(result).toBe(true);
      
      const contentEl = textBlock.querySelector('[contenteditable="true"]') as HTMLElement;
      expect(contentEl.focus).toHaveBeenCalled();
      
      // Should position at end (explicit option overrides internal flag)
      expect(mockRange.selectNodeContents).toHaveBeenCalledWith(contentEl);
      expect(mockRange.collapse).toHaveBeenCalledWith(false); // false = at end
    });
  });

  describe('Error Handling', () => {
    it('should handle missing selection gracefully', () => {
      Object.defineProperty(window, 'getSelection', {
        writable: true,
        value: jest.fn().mockReturnValue(null),
      });

      const textBlock = createMockBlock(1, 'text');
      document.body.appendChild(textBlock);

      const result = focusManager.focusBlock(1, { cursorAtStart: true });

      // Should still return true but not crash
      expect(result).toBe(true);
    });

    it('should handle focus errors gracefully', () => {
      const textBlock = createMockBlock(1, 'text');
      document.body.appendChild(textBlock);

      // Make focus throw an error
      const contentEl = textBlock.querySelector('[contenteditable="true"]') as HTMLElement;
      (contentEl.focus as jest.Mock).mockImplementation(() => {
        throw new Error('Focus failed');
      });

      const result = focusManager.focusBlock(1);

      // Should return false when focus fails
      expect(result).toBe(false);
    });
  });
});