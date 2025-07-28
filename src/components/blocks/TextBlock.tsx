import { type FC, useMemo, useCallback } from 'react';
import { useContentEditable, useBlockCommands, useBlockCreation } from '@/hooks';
import { useEditor } from '@/hooks';
import {
  cn,
  isCursorAtFirstLine,
  isCursorAtLastLine,
  getCursorHorizontalPosition,
  navigateToLastLine,
  navigateToFirstLine,
} from '@/lib/utils';
import { getPreviousBlockId, getNextBlockId } from '@/lib/editorUtils';
import type { BlockComponentProps } from '@/types';

interface TextBlockProps extends BlockComponentProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  cursorAtStart?: boolean;
  onCreateBlockAfter?: (options?: { initialContent?: string; cursorAtStart?: boolean }) => number;
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
  } = useContentEditable({ value, onChange, autoFocus, cursorAtStart, blockId });

  const hasPreviousBlock = useMemo(() => {
    if (!blockId) return false;
    const previousBlockId = getPreviousBlockId(state, blockId);
    return !!previousBlockId;
  }, [state, blockId]);

  const { splitAndCreateBlock, isCursorAtStart, mergeWithPreviousBlock, handleBackspace } = useBlockCreation({
    onCreateBlockAfter,
    onChange,
    onMergeWithPrevious,
    onDeleteBlock,
    hasPreviousBlock,
  });

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
          return !currentValue.trim() || (elementRef.current && isCursorAtStart(elementRef.current));
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
      {
        key: 'ArrowUp',
        condition: () => {
          // Only handle if we're at first line
          return elementRef.current && isCursorAtFirstLine(elementRef.current);
        },
        handler: (e) => {
          // Navigate to previous block
          if (elementRef.current && blockId) {
            const horizontalPos = getCursorHorizontalPosition(
              elementRef.current,
            );
            const previousBlockId = getPreviousBlockId(state, blockId);
            
            
            if (previousBlockId) {
              const previousBlock = document.querySelector(
                `[data-block-id="${previousBlockId}"]`,
              ) as HTMLElement;

              if (previousBlock) {
                navigateToLastLine(previousBlock, horizontalPos);
              }
            } else {
              // No previous block - this is the first block (Example 1)
              // Move cursor to beginning of current block
              const range = document.createRange();
              range.selectNodeContents(elementRef.current);
              range.collapse(true);
              const selection = window.getSelection();
              selection?.removeAllRanges();
              selection?.addRange(range);
            }
          }
        },
      },
      {
        key: 'ArrowDown',
        condition: () => {
          // Only handle if we're at last line
          return elementRef.current && isCursorAtLastLine(elementRef.current);
        },
        handler: (e) => {
          // Navigate to next block
          if (elementRef.current && blockId) {
            const horizontalPos = getCursorHorizontalPosition(
              elementRef.current,
            );
            const nextBlockId = getNextBlockId(state, blockId);
            
            
            if (nextBlockId) {
              const nextBlock = document.querySelector(
                `[data-block-id="${nextBlockId}"]`,
              ) as HTMLElement;

              if (nextBlock) {
                navigateToFirstLine(nextBlock, horizontalPos);
              }
            } else {
              // No next block - this is the last block (Example 2)
              // Move cursor to end of current block
              const range = document.createRange();
              range.selectNodeContents(elementRef.current);
              range.collapse(false);
              const selection = window.getSelection();
              selection?.removeAllRanges();
              selection?.addRange(range);
            }
          }
        },
      },
    ],
    [
      currentValue,
      splitAndCreateBlock,
      isCursorAtStart,
      handleBackspace,
      blockId,
      elementRef,
      state,
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
