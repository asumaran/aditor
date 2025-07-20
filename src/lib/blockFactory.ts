import type { Block, BlockType, TextBlock, ShortAnswerBlock, MultipleChoiceBlock } from '@/types';
import { generateId } from './utils';
import { createDefaultOptions } from './optionUtils';

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

export const createMultipleChoiceBlock = (
  label: string = 'Question',
): MultipleChoiceBlock => ({
  id: generateId(),
  type: 'multiple_choice' as const,
  properties: {
    label,
    options: createDefaultOptions(),
  },
});

export const createBlock = (type: BlockType, content: string = ''): Block => {
  switch (type) {
    case 'text':
      return createTextBlock(content || 'New text block');
    case 'short_answer':
      return createShortAnswerBlock(content || 'Question');
    case 'multiple_choice':
      return createMultipleChoiceBlock(content || 'Question');
    default:
      throw new Error(`Unknown block type: ${type}`);
  }
};

export const cloneBlock = (block: Block): Block => ({
  ...block,
  id: generateId(),
});
