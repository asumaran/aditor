import { useRef, useEffect, useCallback, useState } from 'react';

interface UseContentEditableProps {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}

export const useContentEditable = ({
  value,
  onChange,
  autoFocus = false,
}: UseContentEditableProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
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

  const handleInput = useCallback(
    (event: React.FormEvent<HTMLDivElement>) => {
      if (isComposingRef.current) return;

      const target = event.target as HTMLDivElement;
      const newValue = target.innerText;

      setCurrentValue(newValue);
      onChange(newValue);
    },
    [onChange],
  );

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
    if (!element || element.innerText === value) return;

    element.innerText = value;
    setCurrentValue(value);
    moveCursorToEnd();
  }, [value, moveCursorToEnd]);

  // Handle autoFocus
  useEffect(() => {
    if (autoFocus && elementRef.current) {
      // Force focus with a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        elementRef.current?.focus();
        moveCursorToEnd();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, moveCursorToEnd]);

  return {
    elementRef,
    handleInput,
    handleCompositionStart,
    handleCompositionEnd,
    currentValue,
  };
};
