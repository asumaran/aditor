import { type FC } from 'react';
import { useContentEditable } from '@/hooks';
import { cn } from '@/lib/utils';
import type { BlockComponentProps } from '@/types';

interface TextBlockProps extends BlockComponentProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const TextBlock: FC<TextBlockProps> = ({
  value,
  onChange,
  placeholder = "Write, enter '/' for commands…",
  className,
}) => {
  console.log('placeholder', placeholder);
  const {
    elementRef,
    handleInput,
    handleCompositionStart,
    handleCompositionEnd,
    handleBlur,
    currentValue,
  } = useContentEditable({ value, onChange });

  return (
    <div
      ref={elementRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onBlur={handleBlur}
      className={cn(
        'focus:outline-none cursor-text',
        !currentValue && 'text-gray-400',
        !currentValue && 'after:content-[attr(data-placeholder)]',
        className,
      )}
      data-placeholder={placeholder}
    />
  );
};
