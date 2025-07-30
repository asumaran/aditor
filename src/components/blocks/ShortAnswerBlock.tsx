import { type FC, forwardRef, useImperativeHandle } from 'react';
import { useContentEditable, useStopPropagation } from '@/hooks';
import { cn } from '@/lib/utils';
import type { BlockComponentProps, BlockHandle } from '@/types';
import type { FieldChangeHandler } from '@/types/editables';

interface ShortAnswerBlockProps extends BlockComponentProps {
  value: string;
  onChange: (value: string) => void;
  onFieldChange?: FieldChangeHandler;
  required?: boolean;
  className?: string;
  blockId?: number;
  autoFocus?: boolean;
}

export const ShortAnswerBlock = forwardRef<BlockHandle, ShortAnswerBlockProps>(
  (
    {
      value,
      onChange,
      onFieldChange,
      required = false,
      className,
      blockId,
      autoFocus = false,
    },
    ref,
  ) => {
    const {
      elementRef,
      handleInput,
      handleCompositionStart,
      handleCompositionEnd,
      handleBlur,
      currentValue,
    } = useContentEditable({
      value,
      onChange: (newValue) => {
        if (onFieldChange) {
          onFieldChange('label', newValue);
        } else {
          onChange(newValue);
        }
      },
      autoFocus,
    });

    const handleClickWithStopPropagation = useStopPropagation();
    const handleInputClickWithStopPropagation = useStopPropagation();

    // Expose focus method to parent
    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          // Focus the first editable element (the label in this case)
          elementRef.current?.focus();
        },
      }),
      [],
    );

    return (
      <div
        className={cn('w-full space-y-2', className)}
        data-block-id={blockId}
      >
        <div className='flex w-full items-center'>
          <div
            ref={elementRef as React.RefObject<HTMLDivElement>}
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
              !currentValue && 'after:content-[attr(data-placeholder)]',
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
  },
);

ShortAnswerBlock.displayName = 'ShortAnswerBlock';
