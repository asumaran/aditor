import { useCallback } from 'react';
import { splitContentAtCursor } from '@/lib/splitContent';

interface UseBlockCreationProps {
  onCreateBlockAfter?: (options?: { initialContent?: string; cursorAtStart?: boolean }) => number;
  onChange?: (value: string) => void;
  onMergeWithPrevious?: (currentContent: string) => void;
}

export const useBlockCreation = ({ onCreateBlockAfter, onChange, onMergeWithPrevious }: UseBlockCreationProps) => {
  
  const splitAndCreateBlock = useCallback((element: HTMLElement) => {
    if (!onCreateBlockAfter || !onChange) return null;

    const { before, after } = splitContentAtCursor(element);
    
    // Update current block with content before cursor
    onChange(before);
    
    // If after content is exactly one newline, create empty block
    const cleanAfter = after === '\n' ? '' : after;
    const shouldCursorAtStart = cleanAfter.length > 0;
    
    // Create new block with content after cursor
    return onCreateBlockAfter({ 
      initialContent: cleanAfter, 
      cursorAtStart: shouldCursorAtStart 
    });
  }, [onCreateBlockAfter, onChange]);

  const isCursorAtStart = useCallback((element: HTMLElement) => {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return false;

    const range = selection.getRangeAt(0);
    
    // Get cursor position as character offset
    const preRange = document.createRange();
    preRange.selectNodeContents(element);
    preRange.setEnd(range.startContainer, range.startOffset);
    const cursorPosition = preRange.toString().length;
    
    return cursorPosition === 0;
  }, []);

  const mergeWithPreviousBlock = useCallback((currentValue: string) => {
    if (onMergeWithPrevious) {
      onMergeWithPrevious(currentValue);
    }
  }, [onMergeWithPrevious]);

  return {
    splitAndCreateBlock,
    isCursorAtStart,
    mergeWithPreviousBlock,
  };
};