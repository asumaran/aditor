import type { Block, BlockType, TextBlock, ShortAnswerBlock } from '@/types';
import { generateId } from './utils';

export const createTextBlock = (
  title: string = 'New text block',
): TextBlock => ({
  id: generateId(),
  type: 'text' as const,
  properties: {
    title,
  },
});

export const createShortAnswerBlock = (
  label: string = 'Question',
): ShortAnswerBlock => ({
  id: generateId(),
  type: 'short_answer' as const,
  properties: {
    label,
  },
});

export const createBlock = (type: BlockType, content: string = ''): Block => {
  switch (type) {
    case 'text':
      return createTextBlock(content || 'New text block');
    case 'short_answer':
      return createShortAnswerBlock(content || 'Question');
    default:
      throw new Error(`Unknown block type: ${type}`);
  }
};

export const cloneBlock = (block: Block): Block => ({
  ...block,
  id: generateId(),
});
