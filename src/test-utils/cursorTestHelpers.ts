/**
 * Cursor Position Test Helpers
 *
 * Utilities for testing cursor positioning and selection behavior
 * in contenteditable elements during focus management tests.
 */

export interface CursorPosition {
  startOffset: number;
  endOffset: number;
  isCollapsed: boolean;
}

export interface MockSelectionAPI {
  removeAllRanges: jest.Mock;
  addRange: jest.Mock;
  getRangeAt: jest.Mock;
  rangeCount: number;
  currentRange?: Range;
}

/**
 * Creates a mock HTML element with contenteditable capabilities
 */
export const createMockContentEditable = (
  content: string = '',
  tag: string = 'div',
): HTMLElement => {
  const element = document.createElement(tag);
  element.textContent = content;
  element.contentEditable = 'true';
  element.setAttribute('data-block-id', Math.random().toString());
  return element;
};

/**
 * Creates a mock form input element
 */
export const createMockInput = (
  type: string = 'text',
  placeholder: string = '',
): HTMLInputElement => {
  const input = document.createElement('input');
  input.type = type;
  input.placeholder = placeholder;
  return input;
};

/**
 * Creates a mock textarea element
 */
export const createMockTextarea = (
  placeholder: string = '',
): HTMLTextAreaElement => {
  const textarea = document.createElement('textarea');
  textarea.placeholder = placeholder;
  return textarea;
};

/**
 * Creates a mock Range object for testing cursor positioning
 */
export const createMockRange = (
  element: HTMLElement,
  startOffset: number,
  endOffset?: number,
): Range => {
  const range = document.createRange();

  if (element.firstChild && element.firstChild.nodeType === Node.TEXT_NODE) {
    range.setStart(element.firstChild, startOffset);
    range.setEnd(element.firstChild, endOffset ?? startOffset);
  } else {
    // If no text node, create one
    if (element.textContent) {
      const textNode = document.createTextNode(element.textContent);
      element.innerHTML = '';
      element.appendChild(textNode);
      range.setStart(textNode, startOffset);
      range.setEnd(textNode, endOffset ?? startOffset);
    } else {
      range.selectNodeContents(element);
      range.collapse(true);
    }
  }

  return range;
};

/**
 * Mock implementation of window.getSelection() for testing
 */
export const createMockSelection = (): MockSelectionAPI => {
  let currentRange: Range | undefined;

  const mockSelection: MockSelectionAPI = {
    removeAllRanges: jest.fn(() => {
      currentRange = undefined;
      mockSelection.rangeCount = 0;
    }),
    addRange: jest.fn((range: Range) => {
      currentRange = range;
      mockSelection.rangeCount = 1;
    }),
    getRangeAt: jest.fn((index: number) => {
      if (index === 0 && currentRange) {
        return currentRange;
      }
      throw new Error('No range at index');
    }),
    rangeCount: 0,
  };

  return mockSelection;
};

/**
 * Sets up the global Selection API mock for testing
 */
export const setupSelectionMock = (): MockSelectionAPI => {
  const mockSelection = createMockSelection();

  Object.defineProperty(window, 'getSelection', {
    writable: true,
    value: jest.fn(() => mockSelection),
  });

  return mockSelection;
};

/**
 * Gets the current cursor position from a mock selection
 */
export const getCursorPosition = (
  mockSelection: MockSelectionAPI,
): CursorPosition | null => {
  if (mockSelection.rangeCount === 0) {
    return null;
  }

  const range = mockSelection.getRangeAt(0);
  return {
    startOffset: range.startOffset,
    endOffset: range.endOffset,
    isCollapsed: range.collapsed,
  };
};

/**
 * Simulates cursor positioning at the start of an element
 */
export const simulateCursorAtStart = (
  element: HTMLElement,
  mockSelection: MockSelectionAPI,
): void => {
  const range = createMockRange(element, 0);
  mockSelection.removeAllRanges();
  mockSelection.addRange(range);
};

/**
 * Simulates cursor positioning at the end of an element
 */
export const simulateCursorAtEnd = (
  element: HTMLElement,
  mockSelection: MockSelectionAPI,
): void => {
  const content = element.textContent || '';
  const range = createMockRange(element, content.length);
  mockSelection.removeAllRanges();
  mockSelection.addRange(range);
};

/**
 * Simulates cursor positioning at a specific offset
 */
export const simulateCursorAtOffset = (
  element: HTMLElement,
  offset: number,
  mockSelection: MockSelectionAPI,
): void => {
  const range = createMockRange(element, offset);
  mockSelection.removeAllRanges();
  mockSelection.addRange(range);
};

/**
 * Creates a mock block structure for testing
 */
export const createMockBlock = (config: {
  type: 'text' | 'heading' | 'short_answer' | 'multiple_choice' | 'multiselect';
  content: string;
  id?: number;
}): HTMLElement => {
  const { type, content, id = Math.floor(Math.random() * 1000) } = config;

  const container = document.createElement('div');
  container.setAttribute('data-block-id', id.toString());
  container.setAttribute('data-sortable-id', id.toString());

  if (type === 'text' || type === 'heading') {
    const contentDiv = createMockContentEditable(content);
    container.appendChild(contentDiv);
  } else {
    // Form blocks
    const label = createMockContentEditable('Question label');
    const input =
      type === 'short_answer'
        ? createMockInput('text', 'Short answer text')
        : createMockTextarea('Your answer here');

    container.appendChild(label);
    container.appendChild(input);
  }

  return container;
};

/**
 * Simulates the block splitting operation
 */
export const simulateBlockSplit = (
  element: HTMLElement,
  cursorOffset: number,
): { beforeContent: string; afterContent: string } => {
  const content = element.textContent || '';
  const beforeContent = content.slice(0, cursorOffset);
  const afterContent = content.slice(cursorOffset);

  return { beforeContent, afterContent };
};

/**
 * Verifies that cursor is positioned correctly
 */
export const verifyCursorPosition = (
  mockSelection: MockSelectionAPI,
  expectedOffset: number,
): boolean => {
  const position = getCursorPosition(mockSelection);
  return position !== null && position.startOffset === expectedOffset;
};

/**
 * Gets all focusable elements within a container
 */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const selector =
    'input, textarea, [contenteditable="true"], button, select, [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
};
