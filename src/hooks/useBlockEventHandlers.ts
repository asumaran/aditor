import { useCallback } from 'react';
import { useEditor, useGlobalFocusManager } from '@/hooks';
import {
  createTextBlock,
  createHeadingBlock,
  createShortAnswerBlock,
  createMultipleChoiceBlock,
  createMultiselectBlock,
} from '@/lib/blockFactory';
import {
  getOrderedBlocks,
  getPreviousBlockId,
  getNextBlockId,
  getBlockTextContent,
  shouldReplaceBlock,
} from '@/lib/editorUtils';
import { getBlockConfig } from '@/config/blocks';
import type {
  Block,
  Option,
  TextBlockProperties,
  HeadingBlockProperties,
} from '@/types';

export const useBlockEventHandlers = () => {
  const { state, dispatch } = useEditor();
  const focusManager = useGlobalFocusManager();

  const handleBlockChange = useCallback(
    (id: Block['id'], value: string) => {
      dispatch({ type: 'UPDATE_BLOCK_CONTENT', payload: { id, value } });
    },
    [dispatch],
  );

  const handleFieldChange = useCallback(
    (id: Block['id'], fieldId: string, value: string) => {
      dispatch({ type: 'UPDATE_BLOCK_FIELD', payload: { id, fieldId, value } });
    },
    [dispatch],
  );

  const handleOptionsChange = useCallback(
    (id: Block['id'], options: readonly Option[]) => {
      dispatch({ type: 'UPDATE_BLOCK_OPTIONS', payload: { id, options } });
    },
    [dispatch],
  );

  const handleRequiredChange = useCallback(
    (id: Block['id'], required: boolean) => {
      dispatch({ type: 'UPDATE_BLOCK_REQUIRED', payload: { id, required } });
    },
    [dispatch],
  );

  const handleDescriptionChange = useCallback(
    (id: Block['id'], showDescription: boolean) => {
      dispatch({
        type: 'UPDATE_BLOCK_DESCRIPTION',
        payload: { id, showDescription },
      });
    },
    [dispatch],
  );

  const handleBlockClick = useCallback((blockId: Block['id']) => {
    console.log('Block clicked:', blockId);
  }, []);

  const handleCreateBlockAfter = useCallback(
    (
      afterBlockId: Block['id'],
      options?: {
        initialContent?: string;
        cursorAtStart?: boolean;
        blockType?: string;
        onFocusTransferred?: () => void;
        replaceCurrentBlock?: boolean;
      },
    ) => {
      const {
        initialContent = '',
        cursorAtStart = false,
        blockType = 'text',
        onFocusTransferred,
        replaceCurrentBlock = false,
      } = options || {};

      // For text/heading blocks created via slash commands with no content,
      // we want cursor at start
      const shouldCursorBeAtStart =
        cursorAtStart ||
        ((blockType === 'text' || blockType === 'heading') && !initialContent);

      let newBlock: Block;
      switch (blockType) {
        case 'heading':
          newBlock = createHeadingBlock(initialContent);
          break;
        case 'short_answer':
          newBlock = createShortAnswerBlock(initialContent);
          break;
        case 'multiple_choice':
          newBlock = createMultipleChoiceBlock(initialContent);
          break;
        case 'multiselect':
          newBlock = createMultiselectBlock(initialContent);
          break;
        default:
          newBlock = createTextBlock(initialContent);
      }

      if (replaceCurrentBlock) {
        // Use REPLACE_BLOCK for slash commands to avoid visual jump
        dispatch({
          type: 'REPLACE_BLOCK',
          payload: { id: afterBlockId, newBlock },
        });

        // If there's a callback to execute after focus, set up a one-time listener
        if (onFocusTransferred) {
          // Use multiple requestAnimationFrame to wait for focus to complete
          // This matches FocusManager's deferred timing (double RAF)
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                onFocusTransferred();
              });
            });
          });
        }

        // Use FocusManager for replaced block focus (keeping the same ID)
        focusManager.onBlockCreated(afterBlockId, {
          cursorAtStart: shouldCursorBeAtStart,
          autoFocus: true,
          deferred: true,
          ...(blockType === 'short_answer' ||
          blockType === 'multiple_choice' ||
          blockType === 'multiselect'
            ? { cursorAtEnd: true }
            : {}),
        });

        return afterBlockId;
      } else {
        // Normal case: insert after
        dispatch({
          type: 'INSERT_BLOCK_AFTER',
          payload: { afterBlockId, newBlock },
        });

        // If there's a callback to execute after focus, set up a one-time listener
        if (onFocusTransferred) {
          // Use multiple requestAnimationFrame to wait for focus to complete
          // This matches FocusManager's deferred timing (double RAF)
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                onFocusTransferred();
              });
            });
          });
        }

        // Use FocusManager for new block focus
        focusManager.onBlockCreated(newBlock.id, {
          cursorAtStart: shouldCursorBeAtStart,
          autoFocus: true,
          deferred: true,
          ...(blockType === 'short_answer' ||
          blockType === 'multiple_choice' ||
          blockType === 'multiselect'
            ? { cursorAtEnd: true }
            : {}),
        });

        return newBlock.id;
      }
    },
    [dispatch, focusManager],
  );

  const handleDeleteBlockAndFocusPrevious = useCallback(
    (blockId: Block['id']) => {
      // Don't delete if it's the only block
      if (getOrderedBlocks(state).length <= 1) return;

      // Find the previous block to focus
      const previousBlockId = getPreviousBlockId(state, blockId);

      // Delete the block
      dispatch({ type: 'REMOVE_BLOCK', payload: { id: blockId } });

      // Focus the previous block if it exists using FocusManager
      if (previousBlockId) {
        focusManager.focusBlockForEvent(previousBlockId, 'block-deleted', {
          cursorAtEnd: true, // Position cursor at end when focusing after deletion
          autoFocus: true,
          deferred: true, // Wait for React to remove the deleted block from DOM
        });
      }
    },
    [state, dispatch, focusManager],
  );

  const handleChangeBlockType = useCallback(
    (blockId: Block['id'], newType: string) => {
      // Use the existing CHANGE_BLOCK_TYPE action which handles this properly
      dispatch({
        type: 'CHANGE_BLOCK_TYPE',
        payload: { id: blockId, newType },
      });

      // Focus the same block (which now has the new type) using FocusManager
      focusManager.focusBlock(blockId, {
        autoFocus: true,
        deferred: true, // Wait for React to update the block type
        cursorAtStart: true, // Position cursor at start for empty blocks
      });
    },
    [dispatch, focusManager],
  );

  const handleMergeWithPrevious = useCallback(
    (blockId: Block['id'], currentContent: string) => {
      // Don't merge if it's the first block
      const previousBlockId = getPreviousBlockId(state, blockId);
      if (!previousBlockId) return;

      const previousBlock = state.blockMap[previousBlockId];

      // Only merge with text/heading blocks
      if (!previousBlock || !['text', 'heading'].includes(previousBlock.type))
        return;

      // Get the previous block's content
      // TypeScript: We know this is safe because we checked the block type above
      const previousContent =
        (
          previousBlock.properties as
            | TextBlockProperties
            | HeadingBlockProperties
        ).title || '';
      const mergedContent = previousContent + currentContent;

      // Store the junction point position before updating
      const junctionPoint = previousContent.length;

      // Delete the current block first
      dispatch({ type: 'REMOVE_BLOCK', payload: { id: blockId } });

      // Update the previous block with merged content
      dispatch({
        type: 'UPDATE_BLOCK_CONTENT',
        payload: { id: previousBlockId, value: mergedContent },
      });

      // Use FocusManager for merge focus
      focusManager.onBlockMerged(previousBlockId, junctionPoint, {
        autoFocus: true,
        deferred: true, // Wait for React content update
      });
    },
    [state, dispatch, focusManager],
  );

  const handleNavigateToPrevious = useCallback(
    (blockId: Block['id']) => {
      const previousBlockId = getPreviousBlockId(state, blockId);
      if (previousBlockId) {
        focusManager.onNavigation(previousBlockId, {
          cursorAtEnd: true, // Navigation typically goes to end
          autoFocus: true,
        });
      }
    },
    [state, focusManager],
  );

  const handleNavigateToNext = useCallback(
    (blockId: Block['id']) => {
      const nextBlockId = getNextBlockId(state, blockId);
      if (nextBlockId) {
        focusManager.onNavigation(nextBlockId, {
          cursorAtEnd: true, // Navigation typically goes to end
          autoFocus: true,
        });
      }
    },
    [state, focusManager],
  );

  /**
   * Shared logic for creating blocks with smart replacement/insertion decisions
   * Used by both sidebar buttons and slash commands
   */
  const handleSmartBlockCreation = useCallback(
    (
      targetBlockId: Block['id'] | null,
      newBlockType: string,
      options: {
        source: 'sidebar' | 'slash-command';
        preserveFocus?: boolean; // For slash commands to preserve focus
        onFocusTransferred?: () => void;
      } = { source: 'sidebar' },
    ) => {
      const blockConfig = getBlockConfig(newBlockType);
      if (!blockConfig) {
        console.error(`Unknown block type: ${newBlockType}`);
        return;
      }

      const { defaultContent } = blockConfig;
      const { source, preserveFocus = false, onFocusTransferred } = options;

      // Handle case when no target block is specified
      if (!targetBlockId) {
        const blocks = getOrderedBlocks(state);
        const lastBlock = blocks[blocks.length - 1];

        if (!lastBlock) {
          // No blocks exist, create the first one
          return handleCreateBlockAfter(0, {
            blockType: newBlockType,
            initialContent: defaultContent,
            onFocusTransferred,
          });
        }

        targetBlockId = lastBlock.id;
      }

      const targetBlock = state.blockMap[targetBlockId];
      if (!targetBlock) return;

      const blockContent = getBlockTextContent(targetBlock);
      const isEmpty = shouldReplaceBlock(blockContent);

      // Shared logic for both sidebar and slash commands:
      // 1. Empty text block + same type (text) → Stay in current block or just focus
      // 2. Empty text block + different type → Replace
      // 3. Empty heading block → NEVER replace, always insert after
      // 4. Non-empty blocks → Always insert after

      if (targetBlock.type === 'text' && newBlockType === 'text' && isEmpty) {
        // Text-to-text on empty block:
        // - Sidebar: Just focus current block
        // - Slash: Exit slash mode (handled by caller)
        if (source === 'sidebar') {
          focusManager.focusBlock(targetBlockId, {
            autoFocus: true,
            deferred: true,
          });
        }
        return targetBlockId;
      }

      if (targetBlock.type === 'text' && newBlockType !== 'text' && isEmpty) {
        // Empty text block + different type → Replace
        const isFormBlock = [
          'short_answer',
          'multiple_choice',
          'multiselect',
        ].includes(newBlockType);
        return handleCreateBlockAfter(targetBlockId, {
          blockType: newBlockType,
          initialContent: defaultContent,
          replaceCurrentBlock: true,
          cursorAtStart: !preserveFocus && !isFormBlock, // Form blocks need cursor at end
          onFocusTransferred,
        });
      }

      // All other cases: insert after (including empty heading blocks)
      const isFormBlock = [
        'short_answer',
        'multiple_choice',
        'multiselect',
      ].includes(newBlockType);
      return handleCreateBlockAfter(targetBlockId, {
        blockType: newBlockType,
        initialContent: defaultContent,
        replaceCurrentBlock: false,
        cursorAtStart: !preserveFocus && !isFormBlock, // Form blocks need cursor at end
        onFocusTransferred,
      });
    },
    [state, focusManager, handleCreateBlockAfter],
  );

  return {
    handleBlockChange,
    handleFieldChange,
    handleOptionsChange,
    handleRequiredChange,
    handleDescriptionChange,
    handleBlockClick,
    handleCreateBlockAfter,
    handleSmartBlockCreation,
    handleDeleteBlockAndFocusPrevious,
    handleChangeBlockType,
    handleMergeWithPrevious,
    handleNavigateToPrevious,
    handleNavigateToNext,
  };
};
