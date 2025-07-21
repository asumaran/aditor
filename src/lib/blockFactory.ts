import type {
  Block,
  TextBlock,
  ShortAnswerBlock,
  MultipleChoiceBlock,
  MultiselectBlock,
} from '@/types';
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

export const createMultiselectBlock = (
  label: string = 'Select label',
): MultiselectBlock => ({
  id: generateId(),
  type: 'multiselect' as const,
  properties: {
    label,
  },
});

export const cloneBlock = (block: Block): Block => ({
  ...block,
  id: generateId(),
});
