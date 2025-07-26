import { type FC, useMemo } from 'react';
import { useContentEditable, useBlockCommands } from '@/hooks';
import { cn } from '@/lib/utils';
import type { BlockComponentProps } from '@/types';

interface TextBlockProps extends BlockComponentProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onCreateBlockAfter?: () => number;
  onDeleteBlock?: () => void;
}

export const TextBlock: FC<TextBlockProps> = ({
  value,
  onChange,
  placeholder = "Write, enter '/' for commands…",
  className,
  autoFocus = false,
  onCreateBlockAfter,
  onDeleteBlock,
}) => {
  const {
    elementRef,
    handleInput,
    handleCompositionStart,
    handleCompositionEnd,
    handleBlur,
    currentValue,
  } = useContentEditable({ value, onChange, autoFocus });

  const commands = useMemo(
    () => [
      {
        key: 'Enter',
        handler: () => {
          // Enter: Create new TextBlock
          if (onCreateBlockAfter) {
            onCreateBlockAfter();
          }
        },
      },
      {
        key: 'Backspace',
        condition: () => !currentValue.trim(),
        handler: () => {
          // Backspace on empty block: Delete block
          if (onDeleteBlock) {
            onDeleteBlock();
          }
        },
      },
    ],
    [currentValue, onCreateBlockAfter, onDeleteBlock],
  );

  const { handleKeyDown } = useBlockCommands({ commands });

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
        'cursor-text whitespace-break-spaces focus:outline-none',
        !currentValue && 'text-gray-400',
        !currentValue && 'focus:after:content-[attr(data-placeholder)]',
        className,
      )}
      data-placeholder={placeholder}
    />
  );
};
