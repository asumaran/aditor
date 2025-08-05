import type { LucideIcon } from 'lucide-react';
import {
  Type,
  Heading1,
  MessageSquare,
  ListChecks,
  ToggleLeft,
} from 'lucide-react';
import {
  createTextBlock,
  createHeadingBlock,
  createShortAnswerBlock,
  createMultipleChoiceBlock,
  createMultiselectBlock,
} from '@/lib/blockFactory';
import type { Block } from '@/types';

export interface BlockConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  factory: (content?: string) => Block;
  defaultContent?: string;
}

export const AVAILABLE_BLOCKS: BlockConfig[] = [
  {
    id: 'text',
    label: 'Text',
    icon: Type,
    description: 'Plain text content',
    factory: createTextBlock,
    defaultContent: '',
  },
  {
    id: 'heading',
    label: 'Heading',
    icon: Heading1,
    description: 'Section heading',
    factory: createHeadingBlock,
    defaultContent: '',
  },
  {
    id: 'short_answer',
    label: 'Short Answer',
    icon: MessageSquare,
    description: 'Single-line text input',
    factory: createShortAnswerBlock,
    defaultContent: 'Sample Short Answer Question',
  },
  {
    id: 'multiple_choice',
    label: 'Multiple Choice',
    icon: ListChecks,
    description: 'Select one option',
    factory: createMultipleChoiceBlock,
    defaultContent: 'Question',
  },
  {
    id: 'multiselect',
    label: 'Multiselect',
    icon: ToggleLeft,
    description: 'Select multiple options',
    factory: createMultiselectBlock,
    defaultContent: 'Select label',
  },
];

// Helper function to get block config by ID
export const getBlockConfig = (blockId: string): BlockConfig | undefined => {
  return AVAILABLE_BLOCKS.find((block) => block.id === blockId);
};

// Helper function to get block label by ID
export const getBlockLabel = (blockId: string): string => {
  const block = getBlockConfig(blockId);
  return block?.label || blockId;
};
