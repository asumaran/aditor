import { type FC, useMemo } from 'react';
import {
  useContentEditable,
  useBlockCommands,
  useBlockCreation,
  useBlockNavigation,
} from '@/hooks';
import { useEditor } from '@/hooks';
import { cn } from '@/lib/utils';
import { getPreviousBlockId } from '@/lib/editorUtils';
import type { BlockComponentProps } from '@/types';

interface TextBlockProps extends BlockComponentProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  cursorAtStart?: boolean;
  onCreateBlockAfter?: (options?: {
    initialContent?: string;
    cursorAtStart?: boolean;
  }) => number;
  onDeleteBlock?: () => void;
  onMergeWithPrevious?: (currentContent: string) => void;
  blockId?: number;
}

export const TextBlock: FC<TextBlockProps> = ({
  value,
  onChange,
  placeholder = "Write, enter '/' for commands…",
  className,
  autoFocus = false,
  cursorAtStart = false,
  onCreateBlockAfter,
  onDeleteBlock,
  onMergeWithPrevious,
  blockId,
}) => {
  const { state } = useEditor();
  const {
    elementRef,
    handleInput,
    handleCompositionStart,
    handleCompositionEnd,
    currentValue,
  } = useContentEditable({
    value,
    onChange,
    autoFocus,
    cursorAtStart,
    blockId,
  });

  const hasPreviousBlock = useMemo(() => {
    if (!blockId) return false;
    const previousBlockId = getPreviousBlockId(state, blockId);
    return !!previousBlockId;
  }, [state, blockId]);

  const { splitAndCreateBlock, isCursorAtStart, handleBackspace } =
    useBlockCreation({
      onCreateBlockAfter,
      onChange,
      onMergeWithPrevious,
      onDeleteBlock,
      hasPreviousBlock,
    });

  const { navigationCommands } = useBlockNavigation({ blockId, elementRef });

  const commands = useMemo(
    () => [
      {
        key: 'Enter',
        handler: () => {
          // Enter: Split content and create new TextBlock
          if (elementRef.current) {
            splitAndCreateBlock(elementRef.current);
          }
        },
      },
      {
        key: 'Backspace',
        condition: () => {
          // Handle two cases:
          // 1. Empty block (delete block)
          // 2. Cursor at start (merge with previous)
          return (
            !currentValue.trim() ||
            (elementRef.current && isCursorAtStart(elementRef.current))
          );
        },
        handler: () => {
          if (elementRef.current) {
            handleBackspace(elementRef.current, currentValue);
          }
        },
      },
      {
        key: 'Backspace',
        modifiers: ['meta'], // Cmd+Backspace on Mac
        condition: () => {
          // Only handle when cursor is at the very start of the block
          return elementRef.current && isCursorAtStart(elementRef.current);
        },
        handler: () => {
          if (elementRef.current) {
            handleBackspace(elementRef.current, currentValue);
          }
        },
      },
      ...navigationCommands,
    ],
    [
      currentValue,
      splitAndCreateBlock,
      isCursorAtStart,
      handleBackspace,
      navigationCommands,
      elementRef,
    ],
  );

  const { handleKeyDown } = useBlockCommands({ commands });

  return (
    <div className='mt-[2px] mb-[1px] w-full max-w-[1285px]'>
      <div
        ref={elementRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleKeyDown}
        data-block-id={blockId}
        className={cn(
          'w-full max-w-full px-[2px] pt-[3px] pb-[3px] break-words whitespace-break-spaces caret-[#322f2c]',
          'focus:outline-none',
          'min-h-[1.5em]', // Ensure minimum height for empty lines
          !currentValue && 'text-gray-400',
          !currentValue && 'focus:after:content-[attr(data-placeholder)]',
          className,
        )}
        data-placeholder={placeholder}
      />
    </div>
  );
};
