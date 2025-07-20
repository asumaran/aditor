import { useState, useCallback } from 'react';
import type { Block } from '@/types';
import { createTextBlock } from '@/lib/blockFactory';

interface UseBlocksReturn {
  blocks: readonly Block[];
  addTextBlock: () => void;
  updateBlock: (id: Block['id'], updates: Partial<Block['properties']>) => void;
  removeBlock: (id: Block['id']) => void;
}

export const useBlocks = (initialBlocks: readonly Block[] = []): UseBlocksReturn => {
  const [blocks, setBlocks] = useState<readonly Block[]>(initialBlocks);

  const addTextBlock = useCallback(() => {
    const newBlock = createTextBlock('New text block');
    setBlocks(prevBlocks => [...prevBlocks, newBlock]);
  }, []);

  const updateBlock = useCallback((id: Block['id'], updates: Partial<Block['properties']>) => {
    setBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === id
          ? { ...block, properties: { ...block.properties, ...updates } }
          : block
      )
    );
  }, []);

  const removeBlock = useCallback((id: Block['id']) => {
    setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== id));
  }, []);

  return {
    blocks,
    addTextBlock,
    updateBlock,
    removeBlock,
  };
};