import { type FC } from 'react';
import {
  TextBlock,
  HeadingBlock,
  ShortAnswerBlock,
  MultipleChoiceBlock,
  MultiselectBlock,
} from '@/components/blocks';
import type { BlockType, BlockComponentProps, Option } from '@/types';

export interface BlockComponentBaseProps extends BlockComponentProps {
  value: string;
  onChange: (value: string) => void;
}

export interface MultipleChoiceComponentProps extends BlockComponentBaseProps {
  options: readonly Option[];
  onOptionsChange: (options: readonly Option[]) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComponentRegistry = Record<BlockType, FC<any>>;

export const COMPONENT_REGISTRY: ComponentRegistry = {
  text: TextBlock,
  heading: HeadingBlock,
  short_answer: ShortAnswerBlock,
  multiple_choice: MultipleChoiceBlock,
  multiselect: MultiselectBlock,
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getBlockComponent = (type: BlockType): FC<any> => {
  const Component = COMPONENT_REGISTRY[type];

  if (!Component) {
    throw new Error(`No component found for block type: ${type}`);
  }

  return Component;
};

export const isValidBlockType = (type: string): type is BlockType => {
  return type in COMPONENT_REGISTRY;
};
