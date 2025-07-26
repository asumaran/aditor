import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generateId = (): number => {
  return Date.now() + Math.floor(Math.random() * 1000);
};

export const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};

export const validateRequired = <T>(
  value: T | null | undefined,
  fieldName: string,
): T => {
  if (value === null || value === undefined) {
    throw new Error(`${fieldName} is required`);
  }
  return value;
};

/**
 * Check if cursor should navigate to previous block on ArrowUp
 * This detects if pressing ArrowUp would navigate to previous block
 */
export const isCursorAtFirstLine = (editableElement: HTMLElement): boolean => {
  const selection = window.getSelection();

  if (
    !selection?.rangeCount ||
    !editableElement.contains(selection.anchorNode)
  ) {
    return false;
  }

  // If element is empty, always consider first line
  const content = editableElement.textContent || '';
  if (!content) {
    return true;
  }

  try {
    const range = selection.getRangeAt(0);
    
    // Get the current cursor position as a character offset from start
    const preRange = document.createRange();
    preRange.selectNodeContents(editableElement);
    preRange.setEnd(range.startContainer, range.startOffset);
    const cursorPosition = preRange.toString().length;
    
    // Find the last newline before cursor position
    const textBeforeCursor = content.substring(0, cursorPosition);
    const lastNewlineBeforeCursor = textBeforeCursor.lastIndexOf('\n');
    
    // If no newline found, we're on the first line
    return lastNewlineBeforeCursor === -1;
  } catch (e) {
    return false;
  }
};

/**
 * Get the last text node in an element
 */
const getLastTextNode = (element: HTMLElement): Text | null => {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null
  );
  
  let lastTextNode: Text | null = null;
  let node: Node | null;
  
  while ((node = walker.nextNode())) {
    lastTextNode = node as Text;
  }
  
  return lastTextNode;
};

/**
 * Check if cursor is at the last line of a contentEditable element
 * This detects if pressing ArrowDown would navigate to next block
 */
export const isCursorAtLastLine = (editableElement: HTMLElement): boolean => {
  const selection = window.getSelection();

  if (
    !selection?.rangeCount ||
    !editableElement.contains(selection.anchorNode)
  ) {
    return false;
  }

  // If element is empty, always consider last line
  const content = editableElement.textContent || '';
  if (!content) {
    return true;
  }

  try {
    const range = selection.getRangeAt(0);
    
    // Get the text content and split into lines
    const lines = content.split('\n');
    const lineCount = lines.length;
    
    // Get cursor position as character offset
    const preRange = document.createRange();
    preRange.selectNodeContents(editableElement);
    preRange.setEnd(range.startContainer, range.startOffset);
    const cursorOffset = preRange.toString().length;
    
    // Find which line the cursor is on
    let currentLine = 0;
    let charCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length;
      const nextCharCount = charCount + lineLength + (i < lines.length - 1 ? 1 : 0);
      
      if (cursorOffset <= charCount + lineLength) {
        currentLine = i;
        break;
      }
      charCount = nextCharCount;
    }
    
    // The last actual line with content
    let lastLineWithContent = lines.length - 1;
    
    // If content ends with \n, there's an empty line at the end that we should ignore
    if (content.endsWith('\n') && lines[lines.length - 1] === '') {
      lastLineWithContent = lines.length - 2;
    }
    
    const isLastLine = currentLine >= lastLineWithContent;
    
    
    return isLastLine;
  } catch (e) {
    return false;
  }
};

/**
 * Get the horizontal position of the cursor for navigation
 */
export const getCursorHorizontalPosition = (editableElement: HTMLElement): number => {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return 0;
  
  const range = selection.getRangeAt(0);
  
  // Create a range from the beginning of the current line to the cursor
  const lineStartRange = range.cloneRange();
  
  // Find the start of the current line
  let node = range.startContainer;
  let offset = range.startOffset;
  
  // Walk backwards to find the start of the line
  while (node && offset > 0) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      const newlineIndex = text.lastIndexOf('\n', offset - 1);
      if (newlineIndex !== -1) {
        lineStartRange.setStart(node, newlineIndex + 1);
        break;
      }
      // Move to previous sibling or parent
      if (node.previousSibling) {
        node = node.previousSibling;
        offset = node.nodeType === Node.TEXT_NODE ? (node.textContent?.length || 0) : 0;
      } else if (node.parentNode && node.parentNode !== editableElement) {
        node = node.parentNode;
        offset = 0;
      } else {
        // We're at the beginning of the element
        lineStartRange.setStart(editableElement, 0);
        break;
      }
    } else {
      lineStartRange.setStart(editableElement, 0);
      break;
    }
  }
  
  if (!node) {
    lineStartRange.setStart(editableElement, 0);
  }
  
  lineStartRange.setEnd(range.startContainer, range.startOffset);
  
  // Return the character offset from start of line
  return lineStartRange.toString().length;
};

/**
 * Set cursor position at a specific horizontal offset in the target element
 */
export const setCursorAtHorizontalPosition = (
  targetElement: HTMLElement,
  horizontalPosition: number,
  preferEnd: boolean = false
): void => {
  const selection = window.getSelection();
  if (!selection) return;
  
  const range = document.createRange();
  
  // If element is empty, just focus it
  if (!targetElement.textContent) {
    range.selectNodeContents(targetElement);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    return;
  }
  
  // Find the correct position
  let currentOffset = 0;
  let targetNode: Node | null = null;
  let targetOffset = 0;
  let foundPosition = false;
  
  const walker = document.createTreeWalker(
    targetElement,
    NodeFilter.SHOW_TEXT,
    null
  );
  
  let node: Node | null;
  let lastValidNode: Node | null = null;
  let lastValidOffset = 0;
  
  while ((node = walker.nextNode())) {
    const text = node.textContent || '';
    
    // Check each character in the text node
    for (let i = 0; i < text.length; i++) {
      if (currentOffset === horizontalPosition) {
        targetNode = node;
        targetOffset = i;
        foundPosition = true;
        break;
      }
      
      // Reset position counter at newlines
      if (text[i] === '\n') {
        if (currentOffset <= horizontalPosition && preferEnd) {
          // If we haven't reached the target position and we hit a newline,
          // place cursor at end of current line
          targetNode = node;
          targetOffset = i;
          foundPosition = true;
          break;
        }
        currentOffset = 0;
      } else {
        currentOffset++;
      }
      
      lastValidNode = node;
      lastValidOffset = i + 1;
    }
    
    if (foundPosition) break;
  }
  
  // If we didn't find the exact position, use the last valid position
  if (!foundPosition && lastValidNode) {
    targetNode = lastValidNode;
    targetOffset = lastValidOffset;
  }
  
  if (targetNode) {
    range.setStart(targetNode, targetOffset);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
};

/**
 * Navigate to last line of target element and set cursor at horizontal position
 */
export const navigateToLastLine = (
  targetElement: HTMLElement,
  horizontalPosition: number
): void => {
  targetElement.focus();
  
  setTimeout(() => {
    const selection = window.getSelection();
    if (!selection) return;
    
    // Place cursor at the end of the element
    const range = document.createRange();
    range.selectNodeContents(targetElement);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Move cursor to beginning of current line
    selection.modify('move', 'backward', 'lineboundary');
    
    // Now set horizontal position from the beginning of this line
    const lineStart = selection.getRangeAt(0).cloneRange();
    
    // Move forward by horizontalPosition characters
    for (let i = 0; i < horizontalPosition; i++) {
      const before = selection.getRangeAt(0).cloneRange();
      selection.modify('move', 'forward', 'character');
      const after = selection.getRangeAt(0);
      
      // Check if we hit a newline or end of content
      if (before.compareBoundaryPoints(Range.START_TO_START, after) === 0) {
        // Cursor didn't move, we're at the end
        break;
      }
    }
  }, 0);
};

/**
 * Navigate to first line of target element and set cursor at horizontal position
 */
export const navigateToFirstLine = (
  targetElement: HTMLElement,
  horizontalPosition: number
): void => {
  targetElement.focus();
  
  const selection = window.getSelection();
  if (!selection) return;
  
  // Go to start of element
  const range = document.createRange();
  range.selectNodeContents(targetElement);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  
  // Now set horizontal position on first line
  setTimeout(() => {
    setCursorAtHorizontalPosition(targetElement, horizontalPosition, false);
  }, 0);
};
