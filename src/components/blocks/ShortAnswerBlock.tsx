import { forwardRef, useImperativeHandle, useMemo } from 'react';
import {
  useContentEditable,
  useStopPropagation,
  useBlockCommands,
  useBlockNavigation,
} from '@/hooks';
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
  onNavigateToPrevious?: (blockId: number) => void;
  onNavigateToNext?: (blockId: number) => void;
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

    // Navigation commands
    const { navigationCommands } = useBlockNavigation({
      blockId,
      elementRef,
      isSlashInputMode: false,
    });

    // Command configuration
    const commands = useMemo(
      () => [...navigationCommands],
      [navigationCommands],
    );

    const { handleKeyDown } = useBlockCommands({ commands });

    // Expose focus method to parent
    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          // Focus the first editable element (the label in this case)
          elementRef.current?.focus();
        },
      }),
      [elementRef],
    );

    return (
      <div
        className={cn('w-full space-y-2', className)}
        data-block-id={blockId}
      >
        <div
          ref={elementRef as React.RefObject<HTMLDivElement>}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onBlur={handleBlur}
          onClick={handleClickWithStopPropagation}
          onKeyDown={handleKeyDown}
          className={cn(
            'my-[10px] min-h-[1em] w-fit max-w-full cursor-text rounded-md px-[10px] text-[24px] leading-[30px] font-bold break-words whitespace-break-spaces text-[rgb(50,48,44)] caret-[rgb(50,48,44)] focus:outline-none',
            // Empty state - use before for placeholder with webkit-text-fill-color
            !currentValue &&
              'empty:[-webkit-text-fill-color:rgba(70,68,64,0.45)] empty:before:content-[attr(data-placeholder)]',
            // After pseudo-element for required asterisk
            required &&
              'after:font-normal after:text-[rgba(70,68,64,0.45)] after:content-["*"]',
          )}
          data-placeholder='Question name'
          role='textbox'
          aria-label='Start typing to edit text'
          tabIndex={0}
        />
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
