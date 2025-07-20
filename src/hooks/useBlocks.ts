import { useState, useCallback } from 'react';
import type { Block } from '@/types';
import { createTextBlock, createShortAnswerBlock } from '@/lib/blockFactory';

interface UseBlocksReturn {
  blocks: readonly Block[];
  addTextBlock: () => void;
  addShortAnswerBlock: () => void;
  updateBlock: (id: Block['id'], value: string) => void;
  removeBlock: (id: Block['id']) => void;
}

export const useBlocks = (
  initialBlocks: readonly Block[] = [],
): UseBlocksReturn => {
  const [blocks, setBlocks] = useState<readonly Block[]>(initialBlocks);

  const addTextBlock = useCallback(() => {
    const newBlock = createTextBlock('New text block');
    setBlocks((prevBlocks) => [...prevBlocks, newBlock]);
  }, []);

  const addShortAnswerBlock = useCallback(() => {
    const newBlock = createShortAnswerBlock('Question');
    setBlocks((prevBlocks) => [...prevBlocks, newBlock]);
  }, []);

  const updateBlock = useCallback((id: Block['id'], value: string) => {
    setBlocks((prevBlocks) =>
      prevBlocks.map((block) => {
        if (block.id !== id) return block;

        switch (block.type) {
          case 'text':
            return {
              ...block,
              properties: { ...block.properties, title: value },
            };
          case 'short_answer':
            return {
              ...block,
              properties: { ...block.properties, label: value },
            };
          default:
            return block;
        }
      }),
    );
  }, []);

  const removeBlock = useCallback((id: Block['id']) => {
    setBlocks((prevBlocks) => prevBlocks.filter((block) => block.id !== id));
  }, []);

  return {
    blocks,
    addTextBlock,
    addShortAnswerBlock,
    updateBlock,
    removeBlock,
  };
};
