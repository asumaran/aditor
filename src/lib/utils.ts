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

    // If there's a newline before cursor, we're definitely not on first line
    if (lastNewlineBeforeCursor !== -1) {
      return false;
    }

    // No explicit newlines before cursor - we're on the first "text line"
    // But for wrapped text, check if we're visually on the first line
    const rect = range.getBoundingClientRect();
    const elementRect = editableElement.getBoundingClientRect();

    // For wrapped text, check if cursor is visually on the first line
    // Use a smaller threshold for more precise detection
    const lineHeight =
      parseInt(window.getComputedStyle(editableElement).lineHeight) || 20;
    if (rect.top > elementRect.top + lineHeight * 0.5) {
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

    // Get cursor position as character offset
    const preRange = document.createRange();
    preRange.selectNodeContents(editableElement);
    preRange.setEnd(range.startContainer, range.startOffset);
    const cursorOffset = preRange.toString().length;

    // DEBUG: Add console log to understand what's happening
    console.log('DEBUG isCursorAtLastLine:', {
      content: JSON.stringify(content),
      cursorOffset,
      contentLength: content.length,
      endsWithNewline: content.endsWith('\n'),
      textAfterCursor: JSON.stringify(content.substring(cursorOffset)),
      cursorAtEnd: cursorOffset === content.length,
    });

    // Check if there's a newline after cursor position (explicit line breaks)
    const textAfterCursor = content.substring(cursorOffset);

    // Special handling for empty lines: if text after cursor is only "\n" and it's the final newline
    if (textAfterCursor === '\n' && content.endsWith('\n')) {
      return true;
    }

    const hasNewlineAfter = textAfterCursor.includes('\n');

    // If there's a newline after cursor, we're definitely not on last line
    if (hasNewlineAfter) {
      return false;
    }

    // Special case: if content ends with \n, the cursor might be on the empty line after
    if (content.endsWith('\n') && cursorOffset === content.length) {
      return true;
    }

    // No explicit newlines after cursor - we're on the last "text line"
    // But for wrapped text, check if we're visually on the last line
    const rect = range.getBoundingClientRect();
    const elementRect = editableElement.getBoundingClientRect();

    // For wrapped text, use precise CSS line height measurement
    const computedStyle = window.getComputedStyle(editableElement);
    let actualLineHeight: number;

    if (computedStyle.lineHeight === 'normal') {
      // Browser default is usually fontSize * 1.2
      actualLineHeight = parseInt(computedStyle.fontSize) * 1.2;
    } else if (computedStyle.lineHeight.endsWith('px')) {
      actualLineHeight = parseInt(computedStyle.lineHeight);
    } else if (
      computedStyle.lineHeight.endsWith('em') ||
      computedStyle.lineHeight.endsWith('rem')
    ) {
      const multiplier = parseFloat(computedStyle.lineHeight);
      actualLineHeight = parseInt(computedStyle.fontSize) * multiplier;
    } else {
      // Unitless number like "1.5"
      const multiplier = parseFloat(computedStyle.lineHeight);
      actualLineHeight = parseInt(computedStyle.fontSize) * multiplier;
    }

    // Special handling for form block labels with standardized CSS
    const isFormBlockLabel =
      editableElement.getAttribute('data-placeholder') === 'Question name';
    if (isFormBlockLabel) {
      // Form block labels use standardized leading-[30px] exactly
      actualLineHeight = 30;
    }

    // Calculate actual number of lines in the element
    const totalLines = Math.round(
      (elementRect.bottom - elementRect.top) / actualLineHeight,
    );

    // Much more strict detection: only last line if within 0.6 of line height
    // But use the line count to ensure we only trigger on actual last line
    const strictThreshold = actualLineHeight * 0.6;

    // Additional safety check: if there are multiple lines, be extra careful
    const preciseThreshold =
      totalLines > 1 ? strictThreshold : actualLineHeight * 0.9;

    if (rect.bottom < elementRect.bottom - preciseThreshold) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Get the horizontal position of the cursor for navigation
 * Returns character count from start of current visual line
 */
export const getCursorHorizontalPosition = (
  editableElement: HTMLElement,
): number => {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return 0;

  const range = selection.getRangeAt(0);
  const content = editableElement.textContent || '';

  // Get absolute cursor position in text
  const preRange = document.createRange();
  preRange.selectNodeContents(editableElement);
  preRange.setEnd(range.startContainer, range.startOffset);
  const cursorOffset = preRange.toString().length;

  // Check for explicit newlines first
  const textBeforeCursor = content.substring(0, cursorOffset);
  const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');

  if (lastNewlineIndex !== -1) {
    // Explicit newline found - return distance from last \n
    return cursorOffset - lastNewlineIndex - 1;
  }

  // For wrapped text without explicit newlines:
  // We need to find where the current visual line starts
  const cursorRect = range.getBoundingClientRect();

  // Walk backwards character by character to find start of visual line
  let lineStartOffset = 0;
  for (let i = cursorOffset - 1; i >= 0; i--) {
    // Create a range at position i
    const testRange = document.createRange();
    let charFound = false;

    // Find the character at position i using TreeWalker
    const walker = document.createTreeWalker(
      editableElement,
      NodeFilter.SHOW_TEXT,
      null,
    );

    let currentOffset = 0;
    let node: Node | null;

    while ((node = walker.nextNode())) {
      const nodeLength = node.textContent?.length || 0;
      if (currentOffset + nodeLength > i) {
        // Found the node containing position i
        try {
          testRange.setStart(node, i - currentOffset);
          testRange.setEnd(node, i - currentOffset + 1);
          const testRect = testRange.getBoundingClientRect();

          // If this character is on a different line (different Y position)
          if (Math.abs(testRect.top - cursorRect.top) > 5) {
            lineStartOffset = i + 1;
            charFound = true;
            break;
          }
        } catch {
          // Invalid position, continue
        }
        break;
      }
      currentOffset += nodeLength;
    }

    if (charFound) break;
  }

  const positionInLine = cursorOffset - lineStartOffset;

  return positionInLine;
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

  // Special case: if horizontalPosition is 0, go to the very beginning
  if (horizontalPosition === 0) {
    range.selectNodeContents(targetElement);
    range.collapse(true); // Collapse to start
    selection.removeAllRanges();
    selection.addRange(range);
    return;
  }

  // For non-zero positions, use the existing logic
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
  targetBlock: HTMLElement,
  horizontalPosition: number,
): void => {
  const selection = window.getSelection();
  if (!selection) return;

  // Find the contentEditable element - could be the block itself or within the block
  let editableElement: HTMLElement;

  if (targetBlock.hasAttribute('contenteditable')) {
    // TextBlock case - the block itself is contentEditable
    editableElement = targetBlock;
  } else {
    // Form block case - find contentEditable within the block
    const found = targetBlock.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    if (!found) return;
    editableElement = found;
  }

  editableElement.focus();

  const content = editableElement.textContent || '';
  if (!content) {
    // Empty element - focus at start
    const range = document.createRange();
    range.selectNodeContents(editableElement);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    return;
  }

  // To find the last line, place cursor one character before the end
  // This avoids the issue where cursor at very end might be considered a new empty line
  const range = document.createRange();
  const walker = document.createTreeWalker(
    editableElement,
    NodeFilter.SHOW_TEXT,
    null,
  );
  let lastNode: Node | null = null;
  let node: Node | null;

  while ((node = walker.nextNode())) {
    lastNode = node;
  }

  if (lastNode && lastNode.textContent && lastNode.textContent.length > 0) {
    // Place cursor at last character (not after it)
    range.setStart(lastNode, lastNode.textContent.length - 1);
    range.setEnd(lastNode, lastNode.textContent.length - 1);
  } else {
    // Fallback for empty or single character
    range.selectNodeContents(editableElement);
    range.collapse(false);
  }

  selection.removeAllRanges();
  selection.addRange(range);

  // Get how many characters from start of last line to last character
  const charsFromLineStart = getCursorHorizontalPosition(editableElement);

  // Since we measured to the last character (not after it), add 1
  const lineLength = charsFromLineStart + 1;

  // Calculate absolute position for start of last line
  const lastLineStart = content.length - lineLength;

  // Target position is start of last line + desired horizontal position
  // But don't go past the line length
  const targetPos = lastLineStart + Math.min(horizontalPosition, lineLength);

  setCursorAtPosition(editableElement, targetPos);
};

/**
 * Navigate to first line of target element and set cursor at horizontal position
 */
export const navigateToFirstLine = (
  targetBlock: HTMLElement,
  horizontalPosition: number,
): void => {
  // Find the contentEditable element - could be the block itself or within the block
  let editableElement: HTMLElement;

  if (targetBlock.hasAttribute('contenteditable')) {
    // TextBlock case - the block itself is contentEditable
    editableElement = targetBlock;
  } else {
    // Form block case - find contentEditable within the block
    const found = targetBlock.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    if (!found) return;
    editableElement = found;
  }

  const content = editableElement.innerText || '';

  if (!content) {
    // Empty element - focus at start
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(editableElement);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    editableElement.focus();
    return;
  }

  // Find first line length and calculate position
  const firstLineEnd = content.indexOf('\n');
  const firstLineLength = firstLineEnd === -1 ? content.length : firstLineEnd;
  const targetPos = Math.min(horizontalPosition, firstLineLength);

  // Set cursor directly to calculated position
  setCursorAtPosition(editableElement, targetPos);
  editableElement.focus();
};
