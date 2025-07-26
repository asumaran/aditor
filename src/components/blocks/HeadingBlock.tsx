import { type FC } from 'react';
import { useContentEditable } from '@/hooks';
import { cn } from '@/lib/utils';
import type { BlockComponentProps } from '@/types';

interface HeadingBlockProps extends BlockComponentProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const HeadingBlock: FC<HeadingBlockProps> = ({
  value,
  onChange,
  placeholder = 'Enter text...',
  className,
}) => {
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
        'min-h-[1.5rem] cursor-text rounded-md border border-gray-200 p-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none',
        !currentValue && 'text-gray-400',
        className,
      )}
      data-placeholder={placeholder}
    />
  );
};
