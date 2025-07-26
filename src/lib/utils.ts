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
 * Check if cursor is at the first line of a contentEditable element
 * Simplified approach: check if there's any text before cursor on current line
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
  if (!editableElement.textContent?.trim()) {
    return true;
  }

  try {
    const range = selection.getRangeAt(0);

    // Create a range from start of element to cursor position
    const rangeFromStart = document.createRange();
    rangeFromStart.setStart(editableElement, 0);
    rangeFromStart.setEnd(range.startContainer, range.startOffset);

    // Get text content from start to cursor
    const textFromStart = rangeFromStart.toString();

    // If there's no newline before cursor, we're on first line
    return !textFromStart.includes('\n');
  } catch (e) {
    return false;
  }
};

/**
 * Check if cursor is at the last line of a contentEditable element
 * Simplified approach: check if there's any text after cursor on current line
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
  if (!editableElement.textContent?.trim()) {
    return true;
  }

  try {
    const range = selection.getRangeAt(0);

    // Create a range from cursor position to end of element
    const rangeToEnd = document.createRange();
    rangeToEnd.setStart(range.endContainer, range.endOffset);
    rangeToEnd.setEnd(editableElement, editableElement.childNodes.length);

    // Get text content from cursor to end
    const textToEnd = rangeToEnd.toString();

    // If there's no newline after cursor, we're on last line
    return !textToEnd.includes('\n');
  } catch (e) {
    return false;
  }
};
