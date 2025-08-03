import { useRef, useEffect, useCallback, useState } from 'react';

interface UseContentEditableProps {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  cursorAtStart?: boolean;
  blockId?: number;
}

export const useContentEditable = ({
  value,
  onChange,
  autoFocus = false,
  cursorAtStart = false,
  blockId,
}: UseContentEditableProps) => {
  const elementRef = useRef<HTMLElement>(null);
  const isComposingRef = useRef(false);
  const autoFocusHandledRef = useRef(false);
  const [currentValue, setCurrentValue] = useState(value);

  const moveCursorToEnd = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;

    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, []);

  const moveCursorToStart = useCallback(() => {
    const element = elementRef.current;
    if (!element) {
      console.log('moveCursorToStart: no element');
      return;
    }

    console.log('moveCursorToStart: element content before:', {
      textContent: element.textContent,
      innerHTML: element.innerHTML,
      childNodes: element.childNodes.length
    });

    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(true);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    
    // Verify cursor position immediately and after timeout
    const immediateSelection = window.getSelection();
    if (immediateSelection?.rangeCount) {
      const immediateRange = immediateSelection.getRangeAt(0);
      console.log('moveCursorToStart: immediate offset', immediateRange.startOffset);
    }
    
    setTimeout(() => {
      const newSelection = window.getSelection();
      if (newSelection?.rangeCount) {
        const newRange = newSelection.getRangeAt(0);
        console.log('moveCursorToStart: final offset', newRange.startOffset);
      }
    }, 0);
  }, []);

  const handleInput = useCallback(
    (event: React.FormEvent<HTMLDivElement>) => {
      if (isComposingRef.current) return;

      const target = event.target as HTMLDivElement;
      let newValue = target.innerText;

      // If content is exactly one newline, clear it completely for placeholder
      if (newValue === '\n') {
        newValue = '';
        target.textContent = '';
      }

      // Clean up trailing newlines when backspacing
      // This happens when deleting the last line in multi-line text
      // Only apply this cleanup in very specific cases to avoid interfering with normal backspace
      if (
        newValue.endsWith('\n') &&
        newValue.length > 1 && // Must have content before the newline
        // Only if there's exactly one trailing newline and the previous char is not a newline
        newValue[newValue.length - 2] !== '\n'
      ) {
        // Only one newline at the end, remove it
        newValue = newValue.slice(0, -1);
        // Update the DOM to reflect the cleaned value
        const selection = window.getSelection();
        const range = selection?.getRangeAt(0);

        target.textContent = newValue;

        // Restore cursor position
        if (selection && range && newValue.length > 0) {
          const newRange = document.createRange();
          newRange.selectNodeContents(target);
          newRange.collapse(false); // Move to end
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }

      setCurrentValue(newValue);
      onChange(newValue);
    },
    [onChange],
  );

  const handleBlur = useCallback(() => {
    // Optional blur handler for components that need it
  }, []);

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(
    (event: React.CompositionEvent<HTMLDivElement>) => {
      isComposingRef.current = false;
      const target = event.target as HTMLDivElement;
      const newValue = target.innerText;
      setCurrentValue(newValue);
      onChange(newValue);
    },
    [onChange],
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Only update content if it's different
    if (element.textContent !== value) {
      element.textContent = value;
      setCurrentValue(value);

      // For autofocus blocks, focus first, then position cursor in the next frame
      if (autoFocus && !autoFocusHandledRef.current) {
        autoFocusHandledRef.current = true;
        element.focus();
        
        // Position cursor after focus is complete
        requestAnimationFrame(() => {
          if (cursorAtStart) {
            console.log('useContentEditable: moving cursor to start (autofocus)', { blockId, value, cursorAtStart });
            moveCursorToStart();
          } else {
            console.log('useContentEditable: moving cursor to end (autofocus)', { blockId, value, cursorAtStart });
            moveCursorToEnd();
          }
        });
      } else {
        // For non-autofocus blocks, position cursor immediately
        if (cursorAtStart) {
          console.log('useContentEditable: moving cursor to start', { blockId, value, cursorAtStart });
          moveCursorToStart();
        } else {
          console.log('useContentEditable: moving cursor to end', { blockId, value, cursorAtStart });
          moveCursorToEnd();
        }
      }
    }
  }, [value, moveCursorToEnd, moveCursorToStart, cursorAtStart, autoFocus]);

  // Handle autoFocus - removed since it's now handled in the content effect

  return {
    elementRef,
    handleInput,
    handleCompositionStart,
    handleCompositionEnd,
    handleBlur,
    currentValue,
  };
};
