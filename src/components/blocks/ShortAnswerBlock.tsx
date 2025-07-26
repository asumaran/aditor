import { type FC } from 'react';
import { useContentEditable, useStopPropagation } from '@/hooks';
import { cn } from '@/lib/utils';
import type { BlockComponentProps } from '@/types';

interface ShortAnswerBlockProps extends BlockComponentProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

export const ShortAnswerBlock: FC<ShortAnswerBlockProps> = ({
  value,
  onChange,
  required = false,
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

  const handleClickWithStopPropagation = useStopPropagation();
  const handleInputClickWithStopPropagation = useStopPropagation();

  return (
    <div className={cn('space-y-2', className)}>
      <div className='flex items-center'>
        <div
          ref={elementRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onBlur={handleBlur}
          onClick={handleClickWithStopPropagation}
          className={cn(
            'min-h-[1.5rem] w-fit cursor-text rounded p-1 font-bold focus:ring-1 focus:ring-blue-500 focus:outline-none',
            !currentValue && 'text-gray-400',
          )}
          data-placeholder='Question label'
        />
        {required && (
          <span className='ml-1 text-red-500' aria-label='Required field'>
            *
          </span>
        )}
      </div>
      <input
        type='text'
        placeholder='Short answer text'
        onClick={handleInputClickWithStopPropagation}
        className='w-full rounded-md border border-gray-300 p-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none'
      />
    </div>
  );
};
