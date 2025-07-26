import { type FC, useMemo } from 'react';
import { useContentEditable, useBlockCommands } from '@/hooks';
import { useEditor } from '@/hooks';
import { cn, isCursorAtFirstLine, isCursorAtLastLine } from '@/lib/utils';
import { getPreviousBlockId, getNextBlockId } from '@/lib/editorUtils';
import type { BlockComponentProps } from '@/types';

interface TextBlockProps extends BlockComponentProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onCreateBlockAfter?: () => number;
  onDeleteBlock?: () => void;
  blockId?: number;
}

export const TextBlock: FC<TextBlockProps> = ({
  value,
  onChange,
  placeholder = "Write, enter '/' for commands…",
  className,
  autoFocus = false,
  onCreateBlockAfter,
  onDeleteBlock,
  blockId,
}) => {
  const { state } = useEditor();
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
      {
        key: 'ArrowUp',
        condition: () =>
          elementRef.current && isCursorAtFirstLine(elementRef.current),
        handler: () => {
          // Arrow up at first line: Navigate to previous block directly in DOM
          if (elementRef.current && blockId) {
            const previousBlockId = getPreviousBlockId(state, blockId);
            if (previousBlockId) {
              const previousBlock = document.querySelector(
                `[data-block-id="${previousBlockId}"]`,
              ) as HTMLElement;

              if (previousBlock) {
                previousBlock.focus();
                // Move cursor to end of previous block (natural for up arrow)
                const range = document.createRange();
                range.selectNodeContents(previousBlock);
                range.collapse(false);
                const selection = window.getSelection();
                selection?.removeAllRanges();
                selection?.addRange(range);
              }
            }
          }
        },
      },
      {
        key: 'ArrowDown',
        condition: () =>
          elementRef.current && isCursorAtLastLine(elementRef.current),
        handler: () => {
          // Arrow down at last line: Navigate to next block directly in DOM
          if (elementRef.current && blockId) {
            const nextBlockId = getNextBlockId(state, blockId);
            if (nextBlockId) {
              const nextBlock = document.querySelector(
                `[data-block-id="${nextBlockId}"]`,
              ) as HTMLElement;

              if (nextBlock) {
                nextBlock.focus();
                // Move cursor to beginning of next block (natural for down arrow)
                const range = document.createRange();
                range.selectNodeContents(nextBlock);
                range.collapse(true);
                const selection = window.getSelection();
                selection?.removeAllRanges();
                selection?.addRange(range);
              }
            }
          }
        },
      },
    ],
    [
      currentValue,
      onCreateBlockAfter,
      onDeleteBlock,
      blockId,
      elementRef,
      state,
    ],
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
      data-block-id={blockId}
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
