import { useMemo, forwardRef, useImperativeHandle } from 'react';
import {
  useContentEditable,
  useStopPropagation,
  useBlockCommands,
  useBlockNavigation,
} from '@/hooks';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BlockComponentProps, Option, BlockHandle } from '@/types';

interface MultiselectBlockProps extends BlockComponentProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly Option[];
  required?: boolean;
  className?: string;
  blockId?: number;
  autoFocus?: boolean;
  onNavigateToPrevious?: (blockId: number) => void;
  onNavigateToNext?: (blockId: number) => void;
}

export const MultiselectBlock = forwardRef<BlockHandle, MultiselectBlockProps>(
  (
    {
      value,
      onChange,
      options,
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
      onChange,
    });

    const handleClickWithStopPropagation = useStopPropagation();
    const handleSelectClickWithStopPropagation = useStopPropagation();

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
      <div className={cn('space-y-2', className)} data-block-id={blockId}>
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
            'mb-[10px] min-h-[1em] w-fit max-w-full cursor-text rounded-md text-[24px] leading-[30px] font-bold break-words whitespace-break-spaces text-[rgb(50,48,44)] caret-[rgb(50,48,44)] focus:outline-none',
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
        <Select>
          <SelectTrigger
            className='w-full'
            onClick={handleSelectClickWithStopPropagation}
          >
            <SelectValue placeholder='Select an option' />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.id} value={option.id.toString()}>
                {option.text || 'Empty option'}
              </SelectItem>
            ))}
            {options.length === 0 && (
              <SelectItem value='no-options' disabled>
                No options available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    );
  },
);

MultiselectBlock.displayName = 'MultiselectBlock';
