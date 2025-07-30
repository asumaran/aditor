import { useMemo, useCallback } from 'react';
import { useEditor } from '@/hooks';
import {
  isCursorAtFirstLine,
  isCursorAtLastLine,
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

  const navigationCommands = useMemo(
    () => [
      {
        key: 'ArrowUp',
        condition: () => {
          return !isSlashInputMode && // Prevent navigation when slash dropdown is open
            elementRef.current
            ? isCursorAtFirstLine(elementRef.current)
            : false;
        },
        handler: handleArrowUp,
      },
      {
        key: 'ArrowUp',
        modifiers: metaModifier, // Cmd+ArrowUp on Mac
        condition: () => {
          return !isSlashInputMode && // Prevent navigation when slash dropdown is open
            elementRef.current
            ? isCursorAtFirstLine(elementRef.current)
            : false;
        },
        handler: handleArrowUp,
      },
      {
        key: 'ArrowUp',
        modifiers: ctrlModifier, // Ctrl+ArrowUp on Windows/Linux
        condition: () => {
          return !isSlashInputMode && // Prevent navigation when slash dropdown is open
            elementRef.current
            ? isCursorAtFirstLine(elementRef.current)
            : false;
        },
        handler: handleArrowUp,
      },
      {
        key: 'ArrowDown',
        condition: () => {
          return !isSlashInputMode && // Prevent navigation when slash dropdown is open
            elementRef.current
            ? isCursorAtLastLine(elementRef.current)
            : false;
        },
        handler: handleArrowDown,
      },
      {
        key: 'ArrowDown',
        modifiers: metaModifier, // Cmd+ArrowDown on Mac
        condition: () => {
          return !isSlashInputMode && // Prevent navigation when slash dropdown is open
            elementRef.current
            ? isCursorAtLastLine(elementRef.current)
            : false;
        },
        handler: handleArrowDown,
      },
      {
        key: 'ArrowDown',
        modifiers: ctrlModifier, // Ctrl+ArrowDown on Windows/Linux
        condition: () => {
          return !isSlashInputMode && // Prevent navigation when slash dropdown is open
            elementRef.current
            ? isCursorAtLastLine(elementRef.current)
            : false;
        },
        handler: handleArrowDown,
      },
    ],
    [handleArrowUp, handleArrowDown, elementRef, isSlashInputMode],
  );

  return { navigationCommands };
};
