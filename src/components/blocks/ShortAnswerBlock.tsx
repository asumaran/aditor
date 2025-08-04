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
            // CRITICAL FOR ARROW NAVIGATION: These CSS classes ensure consistent line detection
            // Consistent layout for precise line detection
            'block w-fit max-w-full cursor-text text-[24px] font-bold break-words text-[rgb(50,48,44)] caret-[rgb(50,48,44)] focus:outline-none',
            // IMPORTANT: leading-[30px] is hardcoded in utils.ts for form block detection
            // DO NOT CHANGE without updating isCursorAtLastLine() form block detection
            'mb-[10px] p-0 leading-[30px]',
            // Border and background for visual consistency
            'rounded-md border-0 bg-transparent',
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
