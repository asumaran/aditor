import { type FC, useMemo } from 'react';
import { useContentEditable, useBlockCommands } from '@/hooks';
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
              // No previous block - this is the first block
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
              // No next block - this is the last block
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
      onCreateBlockAfter,
      onDeleteBlock,
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
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        data-block-id={blockId}
        className={cn(
          'w-full max-w-full px-[2px] pt-[3px] pb-[3px] break-words whitespace-break-spaces caret-[#322f2c]',
          'focus:outline-none',
          !currentValue && 'text-gray-400',
          !currentValue && 'focus:after:content-[attr(data-placeholder)]',
          className,
        )}
        data-placeholder={placeholder}
      />
    </div>
  );
};
