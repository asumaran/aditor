import type { Block, BlockType } from '@/types';
import { generateId } from './utils';

export const createTextBlock = (title: string = 'New text block'): Block => ({
  id: generateId(),
  type: 'text' as const,
  properties: {
    title,
  },
});

export const createBlock = (type: BlockType, title: string = 'New block'): Block => {
  switch (type) {
    case 'text':
      return createTextBlock(title);
    default:
      throw new Error(`Unknown block type: ${type}`);
  }
};

export const cloneBlock = (block: Block): Block => ({
  ...block,
  id: generateId(),
});