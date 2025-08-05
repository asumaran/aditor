/**
 * Field Navigation Utilities
 *
 * Reusable conditions and handlers for keyboard navigation between
 * multiple editable fields within the same block (e.g., label and description).
 *
 * Uses the same horizontal position preservation logic as inter-block navigation.
 */

import { getCursorHorizontalPosition } from '@/lib/utils';

/**
 * Checks if cursor is at the bottom of a contenteditable element
 */
export const isAtBottomOfField = (element: HTMLElement | null): boolean => {
  if (!element) return false;

  const selection = window.getSelection();
  if (!selection?.rangeCount) return false;

  const range = selection.getRangeAt(0);
  const preRange = document.createRange();
  preRange.selectNodeContents(element);
  preRange.setEnd(range.startContainer, range.startOffset);
  const cursorPosition = preRange.toString().length;
  const content = element.textContent || '';
  const textAfterCursor = content.substring(cursorPosition);

  // At bottom if cursor is at end OR if there's no newline after cursor
  return cursorPosition === content.length || !textAfterCursor.includes('\n');
};

/**
 * Checks if cursor is at the top of a contenteditable element
 */
export const isAtTopOfField = (element: HTMLElement | null): boolean => {
  if (!element) return false;

  const selection = window.getSelection();
  if (!selection?.rangeCount) return false;

  const range = selection.getRangeAt(0);
  const preRange = document.createRange();
  preRange.selectNodeContents(element);
  preRange.setEnd(range.startContainer, range.startOffset);
  const cursorPosition = preRange.toString().length;
  const content = element.textContent || '';
  const textBeforeCursor = content.substring(0, cursorPosition);

  // At top if cursor is at start OR if there's no newline before cursor
  return cursorPosition === 0 || !textBeforeCursor.includes('\n');
};

/**
 * Helper function to focus at start/end position (reusable logic)
 */
const focusAtPosition = (element: HTMLElement, targetPos: number): void => {
  const selection = window.getSelection();
  if (!selection) return;

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
  let currentOffset = 0;
  let node: Node | null;

  while ((node = walker.nextNode())) {
    const textLength = node.textContent?.length || 0;
    if (currentOffset + textLength >= targetPos) {
      const range = document.createRange();
      range.setStart(node, targetPos - currentOffset);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    currentOffset += textLength;
  }
};

/**
 * Helper function to focus at element start/end (reusable logic)
 */
const focusAtEdge = (element: HTMLElement, atStart: boolean): void => {
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(atStart);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
};

/**
 * Focuses an element and positions cursor at the beginning or at horizontal position
 */
export const focusAtStart = (
  element: HTMLElement | null,
  horizontalPosition?: number,
): void => {
  if (!element) return;

  element.focus();

  if (horizontalPosition === undefined) {
    focusAtEdge(element, true);
    return;
  }

  const content = element.textContent || '';
  if (!content) {
    focusAtEdge(element, true);
    return;
  }

  // Same logic as navigateToFirstLine
  const firstLineEnd = content.indexOf('\n');
  const firstLineLength = firstLineEnd === -1 ? content.length : firstLineEnd;
  const targetPos = Math.min(horizontalPosition, firstLineLength);

  focusAtPosition(element, targetPos);
};

/**
 * Focuses an element and positions cursor at the end or at horizontal position in last line
 */
export const focusAtEnd = (
  element: HTMLElement | null,
  horizontalPosition?: number,
): void => {
  if (!element) return;

  element.focus();

  if (horizontalPosition === undefined) {
    focusAtEdge(element, false);
    return;
  }

  const content = element.textContent || '';
  if (!content) {
    focusAtEdge(element, true);
    return;
  }

  // Same logic as navigateToLastLine
  const lastLineStart = content.lastIndexOf('\n');
  const lastLineStartPos = lastLineStart === -1 ? 0 : lastLineStart + 1;
  const lastLineLength = content.length - lastLineStartPos;
  const targetPos =
    lastLineStartPos + Math.min(horizontalPosition, lastLineLength);

  focusAtPosition(element, targetPos);
};

/**
 * Creates a navigation command for moving down from one field to another
 * Preserves horizontal cursor position like inter-block navigation
 */
export const createDownNavigationCommand = (
  fromElement: React.RefObject<HTMLElement | null>,
  toElement: React.RefObject<HTMLElement | null>,
) => ({
  key: 'ArrowDown',
  condition: () => isAtBottomOfField(fromElement.current),
  handler: () => {
    const currentElement = fromElement.current;
    if (currentElement) {
      const horizontalPos = getCursorHorizontalPosition(currentElement);
      focusAtStart(toElement.current, horizontalPos);
    } else {
      focusAtStart(toElement.current);
    }
  },
});

/**
 * Creates a navigation command for moving up from one field to another
 * Preserves horizontal cursor position like inter-block navigation
 */
export const createUpNavigationCommand = (
  fromElement: React.RefObject<HTMLElement | null>,
  toElement: React.RefObject<HTMLElement | null>,
) => ({
  key: 'ArrowUp',
  condition: () => isAtTopOfField(fromElement.current),
  handler: () => {
    const currentElement = fromElement.current;
    if (currentElement) {
      const horizontalPos = getCursorHorizontalPosition(currentElement);
      focusAtEnd(toElement.current, horizontalPos);
    } else {
      focusAtEnd(toElement.current);
    }
  },
});
