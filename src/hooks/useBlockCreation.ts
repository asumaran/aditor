import { useCallback } from 'react';
import { splitContentAtCursor } from '@/lib/splitContent';

interface UseBlockCreationProps {
  onCreateBlockAfter?: (options?: {
    initialContent?: string;
    cursorAtStart?: boolean;
    onFocusTransferred?: () => void;
  }) => number;
  onChange?: (value: string) => void;
  onMergeWithPrevious?: (currentContent: string) => void;
  onDeleteBlock?: () => void;
  hasPreviousBlock?: boolean;
  onSplittingStateChange?: (isSplitting: boolean) => void;
  isInSlashMode?: boolean; // Prevent block deletion when in slash mode
}

export const useBlockCreation = ({
  onCreateBlockAfter,
  onChange,
  onMergeWithPrevious,
  onDeleteBlock,
  hasPreviousBlock = true,
  onSplittingStateChange,
  isInSlashMode = false,
}: UseBlockCreationProps) => {
  const splitAndCreateBlock = useCallback(
    (element: HTMLElement) => {
      if (!onCreateBlockAfter || !onChange) return null;

      const { before, after } = splitContentAtCursor(element);

      // If after content is exactly one newline, create empty block
      const cleanAfter = after === '\n' ? '' : after;
      
      // Signal start of splitting to prevent placeholder flicker
      onSplittingStateChange?.(true);
      
      // Create new block with content after cursor FIRST
      // Always position cursor at start of new block
      const newBlockId = onCreateBlockAfter({
        initialContent: cleanAfter,
        cursorAtStart: true,
        // Pass callback to execute after focus transfer
        onFocusTransferred: () => {
          onChange(before);
          onSplittingStateChange?.(false);
        },
      });

      return newBlockId;
    },
    [onCreateBlockAfter, onChange, onSplittingStateChange],
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
      console.log('🔍 handleBackspace called:', {
        currentValue: `"${currentValue}"`,
        isInSlashMode,
        isEmpty: !currentValue.trim()
      });
      
      // If empty block
      if (!currentValue.trim()) {
        // Don't delete block if in slash mode (user is just deleting the slash)
        if (isInSlashMode) {
          console.log('🔍 Block deletion prevented - in slash mode');
          return false; // Let the slash command handler deal with it
        }
        
        console.log('🔍 Block is empty and not in slash mode - deleting block');
        // Only delete if not first block
        if (hasPreviousBlock && onDeleteBlock) {
          onDeleteBlock();
        }
        return true;
      }

      // If cursor at start
      if (isCursorAtStart(element)) {
        console.log('🔍 Cursor at start - merging with previous');
        mergeWithPreviousBlock(currentValue);
        return true;
      }

      console.log('🔍 Normal backspace - not handling');
      return false;
    },
    [hasPreviousBlock, onDeleteBlock, isCursorAtStart, mergeWithPreviousBlock, isInSlashMode],
  );

  return {
    splitAndCreateBlock,
    isCursorAtStart,
    mergeWithPreviousBlock,
    canMergeWithPrevious,
    handleBackspace,
  };
};
