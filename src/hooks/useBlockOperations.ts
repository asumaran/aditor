import { useCallback } from 'react';
import { useBlockEventHandlers } from '@/hooks';
import { AVAILABLE_BLOCKS } from '@/config/blocks';

export const useBlockOperations = (lastFocusedBlockId: number | null) => {
  const { handleSmartBlockCreation } = useBlockEventHandlers();

  // Generic function to add any block type
  const addBlock = useCallback(
    (blockType: string) => {
      return handleSmartBlockCreation(lastFocusedBlockId, blockType, {
        source: 'sidebar',
      });
    },
    [lastFocusedBlockId, handleSmartBlockCreation],
  );

  // Create specific methods for each block type
  const blockOperations = AVAILABLE_BLOCKS.reduce(
    (acc, block) => {
      const methodName = `add${block.id
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')}Block`;
      acc[methodName] = () => addBlock(block.id);
      return acc;
    },
    {} as Record<string, () => void>,
  );

  return {
    addBlock, // Generic method
    addTextBlock: blockOperations.addTextBlock,
    addHeadingBlock: blockOperations.addHeadingBlock,
    addShortAnswerBlock: blockOperations.addShortAnswerBlock,
    addMultipleChoiceBlock: blockOperations.addMultipleChoiceBlock,
    addMultiselectBlock: blockOperations.addMultiselectBlock,
  };
};
