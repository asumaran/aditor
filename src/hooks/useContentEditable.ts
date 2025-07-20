import { useRef, useEffect, useCallback, useState } from 'react';

interface UseContentEditableProps {
  value: string;
  onChange: (value: string) => void;
}

export const useContentEditable = ({
  value,
  onChange,
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
      const newValue = target.innerText.replace(/^\n+|\n+$/g, '').trim();
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
      const newValue = target.innerText.replace(/^\n+|\n+$/g, '').trim();
      setCurrentValue(newValue);
      onChange(newValue);
    },
    [onChange],
  );

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      const target = event.target as HTMLDivElement;
      const newValue = target.innerText.replace(/^\n+|\n+$/g, '').trim();

      // Si el contenido está vacío, limpiar el elemento
      if (!newValue) {
        target.innerHTML = '';
        setCurrentValue('');
        onChange('');
      }
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

  return {
    elementRef,
    handleInput,
    handleCompositionStart,
    handleCompositionEnd,
    handleBlur,
    currentValue,
  };
};
