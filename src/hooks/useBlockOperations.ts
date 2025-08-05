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
  shouldReplaceBlock,
  getBlockTextContent,
} from '@/lib/editorUtils';
import type { Block } from '@/types';

export const useBlockOperations = (lastFocusedBlockId: number | null) => {
  const { state, dispatch } = useEditor();
  const focusManager = useGlobalFocusManager();

  // Helper function to replace empty text/heading blocks with form blocks
  const replaceEmptyBlock = useCallback(
    (blockId: number, newBlock: Block) => {
      dispatch({
        type: 'REPLACE_BLOCK',
        payload: { id: blockId, newBlock },
      });

      // Use onBlockCreated since the structure has changed significantly
      focusManager.onBlockCreated(blockId, {
        autoFocus: true,
        deferred: true,
        cursorAtEnd: true,
      });
    },
    [dispatch, focusManager],
  );

  const addTextBlock = useCallback(() => {
    if (lastFocusedBlockId) {
      const block = state.blockMap[lastFocusedBlockId];
      const blockTitle = getBlockTextContent(block);
      const isEmpty = shouldReplaceBlock(blockTitle);

      if ((block.type === 'text' || block.type === 'heading') && isEmpty) {
        // Replace empty text/heading block
        dispatch({
          type: 'CHANGE_BLOCK_TYPE',
          payload: { id: lastFocusedBlockId, newType: 'text' },
        });
        focusManager.focusBlock(lastFocusedBlockId, {
          autoFocus: true,
          deferred: true,
        });
      } else {
        // Insert after current block
        const newBlock = createTextBlock('');
        dispatch({
          type: 'INSERT_BLOCK_AFTER',
          payload: { afterBlockId: lastFocusedBlockId, newBlock },
        });
        focusManager.onBlockCreated(newBlock.id, {
          autoFocus: true,
          deferred: true,
        });
      }
    } else {
      // No focus - handle last block
      const blocks = getOrderedBlocks(state);
      const lastBlock = blocks[blocks.length - 1];

      if (!lastBlock) {
        const newBlock = createTextBlock('');
        dispatch({ type: 'ADD_BLOCK', payload: newBlock });
        focusManager.onBlockCreated(newBlock.id, {
          autoFocus: true,
          deferred: true,
        });
      } else {
        const lastBlockTitle =
          lastBlock.type === 'text' || lastBlock.type === 'heading'
            ? lastBlock.properties.title
            : '';
        const isEmpty = shouldReplaceBlock(lastBlockTitle || '');

        if (
          (lastBlock.type === 'text' || lastBlock.type === 'heading') &&
          isEmpty
        ) {
          // Replace empty text/heading block
          dispatch({
            type: 'CHANGE_BLOCK_TYPE',
            payload: { id: lastBlock.id, newType: 'text' },
          });
          focusManager.focusBlock(lastBlock.id, {
            autoFocus: true,
            deferred: true,
          });
        } else {
          // Insert after last block
          const newBlock = createTextBlock('');
          dispatch({
            type: 'INSERT_BLOCK_AFTER',
            payload: { afterBlockId: lastBlock.id, newBlock },
          });
          focusManager.onBlockCreated(newBlock.id, {
            autoFocus: true,
            deferred: true,
          });
        }
      }
    }
  }, [state, dispatch, lastFocusedBlockId, focusManager]);

  const addHeadingBlock = useCallback(() => {
    if (lastFocusedBlockId) {
      const block = state.blockMap[lastFocusedBlockId];
      const blockTitle = getBlockTextContent(block);
      const isEmpty = shouldReplaceBlock(blockTitle);

      if ((block.type === 'text' || block.type === 'heading') && isEmpty) {
        // Replace empty text/heading block
        dispatch({
          type: 'CHANGE_BLOCK_TYPE',
          payload: { id: lastFocusedBlockId, newType: 'heading' },
        });
        focusManager.focusBlock(lastFocusedBlockId, {
          autoFocus: true,
          deferred: true,
        });
      } else {
        // Insert after current block
        const newBlock = createHeadingBlock('');
        dispatch({
          type: 'INSERT_BLOCK_AFTER',
          payload: { afterBlockId: lastFocusedBlockId, newBlock },
        });
        focusManager.onBlockCreated(newBlock.id, {
          autoFocus: true,
          deferred: true,
        });
      }
    } else {
      // No focus - handle last block
      const blocks = getOrderedBlocks(state);
      const lastBlock = blocks[blocks.length - 1];

      if (!lastBlock) {
        const newBlock = createHeadingBlock('');
        dispatch({ type: 'ADD_BLOCK', payload: newBlock });
        focusManager.onBlockCreated(newBlock.id, {
          autoFocus: true,
          deferred: true,
        });
      } else {
        const lastBlockTitle = getBlockTextContent(lastBlock);
        const isEmpty = shouldReplaceBlock(lastBlockTitle);

        if (
          (lastBlock.type === 'text' || lastBlock.type === 'heading') &&
          isEmpty
        ) {
          // Replace empty last block
          dispatch({
            type: 'CHANGE_BLOCK_TYPE',
            payload: { id: lastBlock.id, newType: 'heading' },
          });
          focusManager.focusBlock(lastBlock.id, {
            autoFocus: true,
            deferred: true,
          });
        } else {
          // Insert after last block
          const newBlock = createHeadingBlock('');
          dispatch({
            type: 'INSERT_BLOCK_AFTER',
            payload: { afterBlockId: lastBlock.id, newBlock },
          });
          focusManager.onBlockCreated(newBlock.id, {
            autoFocus: true,
            deferred: true,
          });
        }
      }
    }
  }, [state, dispatch, lastFocusedBlockId, focusManager]);

  const addShortAnswerBlock = useCallback(() => {
    if (lastFocusedBlockId) {
      const block = state.blockMap[lastFocusedBlockId];
      const blockTitle = getBlockTextContent(block);
      const isEmpty = shouldReplaceBlock(blockTitle);

      if ((block.type === 'text' || block.type === 'heading') && isEmpty) {
        // Replace empty text/heading block
        const newBlock = createShortAnswerBlock('Sample Short Answer Question');
        replaceEmptyBlock(lastFocusedBlockId, newBlock);
      } else {
        // Insert after focused block for non-empty blocks
        const newBlock = createShortAnswerBlock('Sample Short Answer Question');
        dispatch({
          type: 'INSERT_BLOCK_AFTER',
          payload: { afterBlockId: lastFocusedBlockId, newBlock },
        });
        focusManager.onBlockCreated(newBlock.id, {
          autoFocus: true,
          deferred: true,
          cursorAtEnd: true,
        });
      }
    } else {
      // No focus - insert at end
      const newBlock = createShortAnswerBlock('Sample Short Answer Question');
      dispatch({ type: 'ADD_BLOCK', payload: newBlock });
      focusManager.onBlockCreated(newBlock.id, {
        autoFocus: true,
        deferred: true,
        cursorAtEnd: true,
      });
    }
  }, [state, dispatch, lastFocusedBlockId, focusManager, replaceEmptyBlock]);

  const addMultipleChoiceBlock = useCallback(() => {
    if (lastFocusedBlockId) {
      const block = state.blockMap[lastFocusedBlockId];
      const blockTitle = getBlockTextContent(block);
      const isEmpty = shouldReplaceBlock(blockTitle);

      if ((block.type === 'text' || block.type === 'heading') && isEmpty) {
        // Replace empty text/heading block
        const newBlock = createMultipleChoiceBlock('Question');
        replaceEmptyBlock(lastFocusedBlockId, newBlock);
      } else {
        // Insert after focused block for non-empty blocks
        const newBlock = createMultipleChoiceBlock('Question');
        dispatch({
          type: 'INSERT_BLOCK_AFTER',
          payload: { afterBlockId: lastFocusedBlockId, newBlock },
        });
        focusManager.onBlockCreated(newBlock.id, {
          autoFocus: true,
          deferred: true,
          cursorAtEnd: true,
        });
      }
    } else {
      // No focus - insert at end
      const newBlock = createMultipleChoiceBlock('Question');
      dispatch({ type: 'ADD_BLOCK', payload: newBlock });
      focusManager.onBlockCreated(newBlock.id, {
        autoFocus: true,
        deferred: true,
        cursorAtEnd: true,
      });
    }
  }, [state, dispatch, lastFocusedBlockId, focusManager, replaceEmptyBlock]);

  const addMultiselectBlock = useCallback(() => {
    if (lastFocusedBlockId) {
      const block = state.blockMap[lastFocusedBlockId];
      const blockTitle = getBlockTextContent(block);
      const isEmpty = shouldReplaceBlock(blockTitle);

      if ((block.type === 'text' || block.type === 'heading') && isEmpty) {
        // Replace empty text/heading block
        const newBlock = createMultiselectBlock('Select label');
        replaceEmptyBlock(lastFocusedBlockId, newBlock);
      } else {
        // Insert after focused block for non-empty blocks
        const newBlock = createMultiselectBlock('Select label');
        dispatch({
          type: 'INSERT_BLOCK_AFTER',
          payload: { afterBlockId: lastFocusedBlockId, newBlock },
        });
        focusManager.onBlockCreated(newBlock.id, {
          autoFocus: true,
          deferred: true,
          cursorAtEnd: true,
        });
      }
    } else {
      // No focus - insert at end
      const newBlock = createMultiselectBlock('Select label');
      dispatch({ type: 'ADD_BLOCK', payload: newBlock });
      focusManager.onBlockCreated(newBlock.id, {
        autoFocus: true,
        deferred: true,
        cursorAtEnd: true,
      });
    }
  }, [state, dispatch, lastFocusedBlockId, focusManager, replaceEmptyBlock]);

  return {
    addTextBlock,
    addHeadingBlock,
    addShortAnswerBlock,
    addMultipleChoiceBlock,
    addMultiselectBlock,
  };
};
