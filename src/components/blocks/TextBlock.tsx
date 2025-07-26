import { type FC, useEffect } from 'react';
import { useContentEditable } from '@/hooks';
import { cn } from '@/lib/utils';
import type { BlockComponentProps } from '@/types';

interface TextBlockProps extends BlockComponentProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onCreateBlockAfter?: () => number;
}

export const TextBlock: FC<TextBlockProps> = ({
  value,
  onChange,
  placeholder = "Write, enter '/' for commands…",
  className,
  autoFocus = false,
  onCreateBlockAfter,
}) => {
  const {
    elementRef,
    handleInput,
    handleCompositionStart,
    handleCompositionEnd,
    handleBlur,
    currentValue,
  } = useContentEditable({ value, onChange });

  useEffect(() => {
    if (autoFocus && elementRef.current) {
      elementRef.current.focus();
    }
  }, [autoFocus, elementRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter: Allow default behavior (line break)
        return;
      } else {
        // Enter: Create new TextBlock
        e.preventDefault();
        if (onCreateBlockAfter) {
          onCreateBlockAfter();
        }
      }
    }
  };

  return (
    <div
      ref={elementRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={cn(
        'cursor-text focus:outline-none whitespace-break-spaces',
        !currentValue && 'text-gray-400',
        !currentValue && 'after:content-[attr(data-placeholder)]',
        className,
      )}
      data-placeholder={placeholder}
    />
  );
};
