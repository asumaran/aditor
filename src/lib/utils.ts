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

    // Get cursor position
    const preRange = document.createRange();
    preRange.selectNodeContents(editableElement);
    preRange.setEnd(range.startContainer, range.startOffset);
    const cursorPosition = preRange.toString().length;

    // Check if there's a newline before cursor position
    const textBeforeCursor = content.substring(0, cursorPosition);
    const lastNewlineBeforeCursor = textBeforeCursor.lastIndexOf('\n');

    // If there's a newline before cursor, we're not on first line
    if (lastNewlineBeforeCursor !== -1) {
      return false;
    }

    // No newline before cursor - we're on the first line
    // Now check if we need to navigate based on visual position
    const rect = range.getBoundingClientRect();
    const elementRect = editableElement.getBoundingClientRect();

    // For wrapped text, only return true if cursor is visually at the top
    if (rect.top > elementRect.top + 10) {
      // Cursor is visually below the first line due to wrapping
      return false;
    }

    return true;
  } catch {
    return false;
  }
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

    // Get cursor position
    const preRange = document.createRange();
    preRange.selectNodeContents(editableElement);
    preRange.setEnd(range.startContainer, range.startOffset);
    const cursorPosition = preRange.toString().length;

    // Check if there's a newline after cursor position
    const textAfterCursor = content.substring(cursorPosition);
    const hasNewlineAfter = textAfterCursor.includes('\n');

    // If there's a newline after cursor, we're not on last line
    if (hasNewlineAfter) {
      return false;
    }

    // No newline after cursor - we're on the last line
    // Now check if we need to navigate based on visual position
    const rect = range.getBoundingClientRect();
    const elementRect = editableElement.getBoundingClientRect();

    // For wrapped text, only return true if cursor is visually at the bottom
    if (rect.bottom < elementRect.bottom - 10) {
      // Cursor is visually above the last line due to wrapping
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Get the horizontal position of the cursor for navigation
 */
export const getCursorHorizontalPosition = (
  editableElement: HTMLElement,
): number => {
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
        offset =
          node.nodeType === Node.TEXT_NODE ? node.textContent?.length || 0 : 0;
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
  preferEnd: boolean = false,
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
    null,
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
 * Set cursor at specific character position in element
 */
const setCursorAtPosition = (element: HTMLElement, position: number): void => {
  const selection = window.getSelection();
  if (!selection) return;

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

  let currentOffset = 0;
  let node: Node | null;

  while ((node = walker.nextNode())) {
    const nodeLength = node.textContent?.length || 0;
    if (currentOffset + nodeLength >= position) {
      const offsetInNode = position - currentOffset;
      const range = document.createRange();
      range.setStart(node, offsetInNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    currentOffset += nodeLength;
  }

  // Fallback: go to end
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
};

/**
 * Navigate to last line of target element and set cursor at horizontal position
 */
export const navigateToLastLine = (
  targetElement: HTMLElement,
  horizontalPosition: number,
): void => {
  const selection = window.getSelection();
  if (!selection) return;

  // Calculate target position directly without intermediate steps
  const content = targetElement.innerText || '';

  if (!content) {
    // Empty element - focus at start
    const range = document.createRange();
    range.selectNodeContents(targetElement);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    targetElement.focus();
    return;
  }

  // Find last line start position
  const lines = content.split('\n');
  let lastLineStart = 0;
  for (let i = 0; i < lines.length - 1; i++) {
    lastLineStart += lines[i].length + 1; // +1 for \n
  }

  // Calculate final position (start of last line + horizontal offset)
  const lastLineLength = lines[lines.length - 1].length;
  const targetPos =
    lastLineStart + Math.min(horizontalPosition, lastLineLength);

  // Set cursor directly to calculated position
  setCursorAtPosition(targetElement, targetPos);
  targetElement.focus();
};

/**
 * Navigate to first line of target element and set cursor at horizontal position
 */
export const navigateToFirstLine = (
  targetElement: HTMLElement,
  horizontalPosition: number,
): void => {
  const content = targetElement.innerText || '';

  if (!content) {
    // Empty element - focus at start
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(targetElement);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    targetElement.focus();
    return;
  }

  // Find first line length and calculate position
  const firstLineEnd = content.indexOf('\n');
  const firstLineLength = firstLineEnd === -1 ? content.length : firstLineEnd;
  const targetPos = Math.min(horizontalPosition, firstLineLength);

  // Set cursor directly to calculated position
  setCursorAtPosition(targetElement, targetPos);
  targetElement.focus();
};
