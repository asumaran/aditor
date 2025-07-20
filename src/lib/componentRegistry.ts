import { type FC } from 'react';
import { TextBlock } from '@/components/blocks';
import type { BlockType, BlockComponentProps } from '@/types';

export interface BlockComponentBaseProps extends BlockComponentProps {
  value: string;
  onChange: (value: string) => void;
}

type ComponentRegistry = Record<BlockType, FC<BlockComponentBaseProps>>;

export const COMPONENT_REGISTRY: ComponentRegistry = {
  text: TextBlock,
} as const;

export const getBlockComponent = (type: BlockType): FC<BlockComponentBaseProps> => {
  const Component = COMPONENT_REGISTRY[type];
  
  if (!Component) {
    throw new Error(`No component found for block type: ${type}`);
  }
  
  return Component;
};

export const isValidBlockType = (type: string): type is BlockType => {
  return type in COMPONENT_REGISTRY;
};