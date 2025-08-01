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
}: UseContentEditableProps) => {
  const elementRef = useRef<HTMLElement>(null);
  const isComposingRef = useRef(false);
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
    if (!element) return;

    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(true);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
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
    if (!element || element.textContent === value) return;

    // Simple update - just set the content
    element.textContent = value;
    setCurrentValue(value);

    // Normal cursor positioning
    if (cursorAtStart) {
      moveCursorToStart();
    } else {
      moveCursorToEnd();
    }
  }, [value, moveCursorToEnd, moveCursorToStart, cursorAtStart]);

  // Handle autoFocus
  useEffect(() => {
    if (autoFocus && elementRef.current) {
      // Force focus with a small delay to ensure DOM is ready
      // Use Promise to avoid setTimeout
      Promise.resolve().then(() => {
        elementRef.current?.focus();
        if (cursorAtStart) {
          moveCursorToStart();
        } else {
          moveCursorToEnd();
        }
      });
    }
  }, [autoFocus, moveCursorToEnd, moveCursorToStart, cursorAtStart]);

  return {
    elementRef,
    handleInput,
    handleCompositionStart,
    handleCompositionEnd,
    handleBlur,
    currentValue,
  };
};
