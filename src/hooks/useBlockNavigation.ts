import { useMemo, useCallback } from 'react';
import { useEditor } from '@/hooks';
import {
  getCursorHorizontalPosition,
  navigateToLastLine,
  navigateToFirstLine,
} from '@/lib/utils';
import { getPreviousBlockId, getNextBlockId } from '@/lib/editorUtils';
import type { Modifier } from '@/hooks/useBlockCommands';

const metaModifier: Modifier[] = ['meta'];
const ctrlModifier: Modifier[] = ['ctrl'];

interface UseBlockNavigationProps {
  blockId?: number;
  elementRef: React.RefObject<HTMLElement | null>;
  /**
   * SLASH COMMAND CONFLICT PREVENTION
   *
   * This flag prevents block navigation when slash command dropdown is open.
   * Without this, arrow keys would both navigate the slash dropdown AND move between blocks,
   * causing confusing UX where the cursor jumps to other blocks while selecting commands.
   *
   * When true: Block navigation is disabled, allowing slash dropdown to handle arrow keys
   * When false: Normal block navigation behavior
   */
  isSlashInputMode?: boolean;
}

export const useBlockNavigation = ({
  blockId,
  elementRef,
  isSlashInputMode = false,
}: UseBlockNavigationProps) => {
  const { state } = useEditor();

  const handleArrowUp = useCallback(
    (e?: React.KeyboardEvent) => {
      if (elementRef.current && blockId) {
        e?.preventDefault(); // Prevent default browser behavior
        const horizontalPos = getCursorHorizontalPosition(elementRef.current);
        const previousBlockId = getPreviousBlockId(state, blockId);

        if (previousBlockId) {
          const previousBlock = document.querySelector(
            `[data-block-id="${previousBlockId}"]`,
          ) as HTMLElement;

          if (previousBlock) {
            navigateToLastLine(previousBlock, horizontalPos);
          }
        } else {
          // No previous block - move cursor to beginning of current block
          const range = document.createRange();
          range.selectNodeContents(elementRef.current);
          range.collapse(true);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }
    },
    [blockId, state, elementRef],
  );

  const handleArrowDown = useCallback(
    (e?: React.KeyboardEvent) => {
      if (elementRef.current && blockId) {
        e?.preventDefault(); // Prevent default browser behavior
        const horizontalPos = getCursorHorizontalPosition(elementRef.current);
        const nextBlockId = getNextBlockId(state, blockId);

        if (nextBlockId) {
          const nextBlock = document.querySelector(
            `[data-block-id="${nextBlockId}"]`,
          ) as HTMLElement;

          if (nextBlock) {
            navigateToFirstLine(nextBlock, horizontalPos);
          }
        } else {
          // No next block - move cursor to end of current block
          const range = document.createRange();
          range.selectNodeContents(elementRef.current);
          range.collapse(false);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }
    },
    [blockId, state, elementRef],
  );

  // Simplified cursor position checks for more natural navigation
  const isAtTopOfBlock = useCallback(() => {
    if (!elementRef.current) return false;
    
    const selection = window.getSelection();
    if (!selection?.rangeCount) return false;
    
    const range = selection.getRangeAt(0);
    const preRange = document.createRange();
    preRange.selectNodeContents(elementRef.current);
    preRange.setEnd(range.startContainer, range.startOffset);
    const cursorPosition = preRange.toString().length;
    
    // Consider top if cursor is at start OR if there's no newline before cursor
    const content = elementRef.current.textContent || '';
    const textBeforeCursor = content.substring(0, cursorPosition);
    return cursorPosition === 0 || !textBeforeCursor.includes('\n');
  }, [elementRef]);
  
  const isAtBottomOfBlock = useCallback(() => {
    if (!elementRef.current) return false;
    
    const selection = window.getSelection();
    if (!selection?.rangeCount) return false;
    
    const range = selection.getRangeAt(0);
    const preRange = document.createRange();
    preRange.selectNodeContents(elementRef.current);
    preRange.setEnd(range.startContainer, range.startOffset);
    const cursorPosition = preRange.toString().length;
    
    // Consider bottom if cursor is at end OR if there's no newline after cursor
    const content = elementRef.current.textContent || '';
    const textAfterCursor = content.substring(cursorPosition);
    return cursorPosition === content.length || !textAfterCursor.includes('\n');
  }, [elementRef]);

  const navigationCommands = useMemo(
    () => [
      {
        key: 'ArrowUp',
        condition: () => !isSlashInputMode && isAtTopOfBlock(),
        handler: handleArrowUp,
      },
      {
        key: 'ArrowUp',
        modifiers: metaModifier, // Cmd+ArrowUp on Mac
        condition: () => !isSlashInputMode && isAtTopOfBlock(),
        handler: handleArrowUp,
      },
      {
        key: 'ArrowUp',
        modifiers: ctrlModifier, // Ctrl+ArrowUp on Windows/Linux
        condition: () => !isSlashInputMode && isAtTopOfBlock(),
        handler: handleArrowUp,
      },
      {
        key: 'ArrowDown',
        condition: () => !isSlashInputMode && isAtBottomOfBlock(),
        handler: handleArrowDown,
      },
      {
        key: 'ArrowDown',
        modifiers: metaModifier, // Cmd+ArrowDown on Mac
        condition: () => !isSlashInputMode && isAtBottomOfBlock(),
        handler: handleArrowDown,
      },
      {
        key: 'ArrowDown',
        modifiers: ctrlModifier, // Ctrl+ArrowDown on Windows/Linux
        condition: () => !isSlashInputMode && isAtBottomOfBlock(),
        handler: handleArrowDown,
      },
    ],
    [handleArrowUp, handleArrowDown, isSlashInputMode, isAtTopOfBlock, isAtBottomOfBlock],
  );

  return { navigationCommands };
};
