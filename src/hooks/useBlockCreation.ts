import { useCallback } from 'react';
import { splitContentAtCursor } from '@/lib/splitContent';

interface UseBlockCreationProps {
  onCreateBlockAfter?: (options?: {
    initialContent?: string;
    cursorAtStart?: boolean;
  }) => number;
  onChange?: (value: string) => void;
  onMergeWithPrevious?: (currentContent: string) => void;
  onDeleteBlock?: () => void;
  hasPreviousBlock?: boolean;
}

export const useBlockCreation = ({
  onCreateBlockAfter,
  onChange,
  onMergeWithPrevious,
  onDeleteBlock,
  hasPreviousBlock = true,
}: UseBlockCreationProps) => {
  const splitAndCreateBlock = useCallback(
    (element: HTMLElement) => {
      if (!onCreateBlockAfter || !onChange) return null;

      const { before, after } = splitContentAtCursor(element);

      // Update current block with content before cursor
      onChange(before);

      // If after content is exactly one newline, create empty block
      const cleanAfter = after === '\n' ? '' : after;
      
      // Create new block with content after cursor
      // Always position cursor at start of new block
      return onCreateBlockAfter({
        initialContent: cleanAfter,
        cursorAtStart: true,
      });
    },
    [onCreateBlockAfter, onChange],
  );

  const isCursorAtStart = useCallback((element: HTMLElement) => {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return false;

    const range = selection.getRangeAt(0);

    // If there's a selection (not just cursor), don't treat as "at start"
    if (!range.collapsed) return false;

    // Get cursor position as character offset
    const preRange = document.createRange();
    preRange.selectNodeContents(element);
    preRange.setEnd(range.startContainer, range.startOffset);
    const cursorPosition = preRange.toString().length;

    return cursorPosition === 0;
  }, []);

  const mergeWithPreviousBlock = useCallback(
    (currentValue: string) => {
      // Only merge if there's a previous block
      if (hasPreviousBlock && onMergeWithPrevious) {
        onMergeWithPrevious(currentValue);
      }
    },
    [onMergeWithPrevious, hasPreviousBlock],
  );

  const canMergeWithPrevious = useCallback(() => {
    return hasPreviousBlock && onMergeWithPrevious !== undefined;
  }, [onMergeWithPrevious, hasPreviousBlock]);

  const handleBackspace = useCallback(
    (element: HTMLElement, currentValue: string) => {
      // If empty block
      if (!currentValue.trim()) {
        // Only delete if not first block
        if (hasPreviousBlock && onDeleteBlock) {
          onDeleteBlock();
        }
        return true;
      }

      // If cursor at start
      if (isCursorAtStart(element)) {
        mergeWithPreviousBlock(currentValue);
        return true;
      }

      return false;
    },
    [hasPreviousBlock, onDeleteBlock, isCursorAtStart, mergeWithPreviousBlock],
  );

  return {
    splitAndCreateBlock,
    isCursorAtStart,
    mergeWithPreviousBlock,
    canMergeWithPrevious,
    handleBackspace,
  };
};
