import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { debounce } from '@/lib/utils';

interface UseContentEditableProps {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

export const useContentEditable = ({ 
  value, 
  onChange, 
  debounceMs = 300 
}: UseContentEditableProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);
  const [currentValue, setCurrentValue] = useState(value);

  const debouncedOnChange = useMemo(
    () => debounce(onChange, debounceMs),
    [onChange, debounceMs]
  );

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

  const handleInput = useCallback((event: React.FormEvent<HTMLDivElement>) => {
    if (isComposingRef.current) return;
    
    const target = event.target as HTMLDivElement;
    const newValue = target.innerText.replace(/^\n+|\n+$/g, '').trim();
    setCurrentValue(newValue);
    debouncedOnChange(newValue);
  }, [debouncedOnChange]);

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback((event: React.CompositionEvent<HTMLDivElement>) => {
    isComposingRef.current = false;
    const target = event.target as HTMLDivElement;
    const newValue = target.innerText.replace(/^\n+|\n+$/g, '').trim();
    setCurrentValue(newValue);
    debouncedOnChange(newValue);
  }, [debouncedOnChange]);

  const handleBlur = useCallback((event: React.FocusEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const newValue = target.innerText.replace(/^\n+|\n+$/g, '').trim();
    
    // Si el contenido está vacío, limpiar el elemento
    if (!newValue) {
      target.innerHTML = '';
      setCurrentValue('');
      debouncedOnChange('');
    }
  }, [debouncedOnChange]);

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