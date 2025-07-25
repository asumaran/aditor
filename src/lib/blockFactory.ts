import type {
  TextBlock,
  ShortAnswerBlock,
  MultipleChoiceBlock,
  MultiselectBlock,
  HeadingBlock,
} from '@/types';
import { generateId } from './utils';
import { createDefaultOptions } from './optionUtils';

export const createTextBlock = (title: string = ''): TextBlock => ({
  id: generateId(),
  type: 'text' as const,
  properties: {
    title,
  },
});

export const createHeadingBlock = (
  title: string = 'New heading block',
): HeadingBlock => ({
  id: generateId(),
  type: 'heading' as const,
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
    required: false,
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
    required: false,
  },
});

export const createMultiselectBlock = (
  label: string = 'Select label',
): MultiselectBlock => ({
  id: generateId(),
  type: 'multiselect' as const,
  properties: {
    label,
    options: createDefaultOptions(),
    required: false,
  },
});
