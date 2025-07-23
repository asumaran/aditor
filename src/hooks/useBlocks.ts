import { useState, useCallback } from 'react';
import type { Block, Option } from '@/types';
import {
  createTextBlock,
  createShortAnswerBlock,
  createMultipleChoiceBlock,
  createMultiselectBlock,
} from '@/lib/blockFactory';

interface UseBlocksReturn {
  blocks: readonly Block[];
  addTextBlock: () => void;
  addShortAnswerBlock: () => void;
  addMultipleChoiceBlock: () => void;
  addMultiselectBlock: () => void;
  updateBlock: (id: Block['id'], value: string) => void;
  updateBlockOptions: (id: Block['id'], options: readonly Option[]) => void;
  updateBlockRequired: (id: Block['id'], required: boolean) => void;
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

  const addMultipleChoiceBlock = useCallback(() => {
    const newBlock = createMultipleChoiceBlock('Question');
    setBlocks((prevBlocks) => [...prevBlocks, newBlock]);
  }, []);

  const addMultiselectBlock = useCallback(() => {
    const newBlock = createMultiselectBlock('Select label');
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
          case 'multiple_choice':
            return {
              ...block,
              properties: { ...block.properties, label: value },
            };
          case 'multiselect':
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

  const updateBlockOptions = useCallback(
    (id: Block['id'], options: readonly Option[]) => {
      setBlocks((prevBlocks) =>
        prevBlocks.map((block) => {
          if (block.id !== id || block.type !== 'multiple_choice') return block;

          return {
            ...block,
            properties: { ...block.properties, options },
          };
        }),
      );
    },
    [],
  );

  const updateBlockRequired = useCallback(
    (id: Block['id'], required: boolean) => {
      setBlocks((prevBlocks) =>
        prevBlocks.map((block) => {
          if (block.id !== id) return block;

          switch (block.type) {
            case 'short_answer':
              return {
                ...block,
                properties: { ...block.properties, required },
              };
            case 'multiple_choice':
              return {
                ...block,
                properties: { ...block.properties, required },
              };
            case 'multiselect':
              return {
                ...block,
                properties: { ...block.properties, required },
              };
            default:
              return block;
          }
        }),
      );
    },
    [],
  );

  const removeBlock = useCallback((id: Block['id']) => {
    setBlocks((prevBlocks) => prevBlocks.filter((block) => block.id !== id));
  }, []);

  return {
    blocks,
    addTextBlock,
    addShortAnswerBlock,
    addMultipleChoiceBlock,
    addMultiselectBlock,
    updateBlock,
    updateBlockOptions,
    updateBlockRequired,
    removeBlock,
  };
};
