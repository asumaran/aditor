import { type FC } from 'react';
import { useContentEditable } from '@/hooks';
import { cn } from '@/lib/utils';
import type { BlockComponentProps } from '@/types';

interface ShortAnswerBlockProps extends BlockComponentProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const ShortAnswerBlock: FC<ShortAnswerBlockProps> = ({
  value,
  onChange,
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
    <div className={cn('space-y-2', className)}>
      <div
        ref={elementRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onBlur={handleBlur}
        className={cn(
          'min-h-[1.5rem] p-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500',
          !currentValue && 'text-gray-400',
        )}
        data-placeholder='Question label'
      />
      <input
        type='text'
        placeholder='Short answer text'
        className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
      />
    </div>
  );
};
