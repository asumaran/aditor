import { useCallback } from 'react';
import { splitContentAtCursor } from '@/lib/splitContent';

interface UseBlockCreationProps {
  onCreateBlockAfter?: (options?: { initialContent?: string; cursorAtStart?: boolean }) => number;
  onChange?: (value: string) => void;
}

export const useBlockCreation = ({ onCreateBlockAfter, onChange }: UseBlockCreationProps) => {
  
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

  return {
    splitAndCreateBlock,
  };
};