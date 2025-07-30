import type { Block } from '@/types';
import type { EditorState } from '@/contexts/EditorContextDefinition';

/**
 * Get all blocks in order
 */
export const getOrderedBlocks = (state: EditorState): Block[] => {
  return state.blocks.map((id) => state.blockMap[id]).filter(Boolean);
};

/**
 * Get block by ID
 */
export const getBlockById = (
  state: EditorState,
  id: number,
): Block | undefined => {
  return state.blockMap[id];
};

/**
 * Get index of block by ID
 */
export const getBlockIndex = (state: EditorState, id: number): number => {
  return state.blocks.indexOf(id);
};

/**
 * Get previous block ID
 */
export const getPreviousBlockId = (
  state: EditorState,
  blockId: number,
): number | null => {
  const index = getBlockIndex(state, blockId);
  if (index <= 0) return null;
  return state.blocks[index - 1];
};

/**
 * Get next block ID
 */
export const getNextBlockId = (
  state: EditorState,
  blockId: number,
): number | null => {
  const index = getBlockIndex(state, blockId);
  if (index === -1 || index >= state.blocks.length - 1) return null;
  return state.blocks[index + 1];
};

/**
 * Add block to state
 */
export const addBlockToState = (
  state: EditorState,
  block: Block,
): EditorState => {
  return {
    blocks: [...state.blocks, block.id],
    blockMap: { ...state.blockMap, [block.id]: block },
  };
};

/**
 * Insert block after specific block ID
 */
export const insertBlockAfter = (
  state: EditorState,
  afterBlockId: number,
  newBlock: Block,
): EditorState => {
  const afterIndex = getBlockIndex(state, afterBlockId);
  if (afterIndex === -1) {
    // If block not found, add at the end
    return addBlockToState(state, newBlock);
  }

  const newBlocks = [...state.blocks];
  newBlocks.splice(afterIndex + 1, 0, newBlock.id);

  return {
    blocks: newBlocks,
    blockMap: { ...state.blockMap, [newBlock.id]: newBlock },
  };
};

/**
 * Remove block from state
 */
export const removeBlockFromState = (
  state: EditorState,
  blockId: number,
): EditorState => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [blockId]: _, ...remainingBlocks } = state.blockMap;
  return {
    blocks: state.blocks.filter((id) => id !== blockId),
    blockMap: remainingBlocks,
  };
};

/**
 * Update block in state
 */
export const updateBlockInState = (
  state: EditorState,
  blockId: number,
  updates: Partial<Block>,
): EditorState => {
  const existingBlock = state.blockMap[blockId];
  if (!existingBlock) return state;

  const updatedBlock = { ...existingBlock, ...updates } as Block;

  return {
    ...state,
    blockMap: {
      ...state.blockMap,
      [blockId]: updatedBlock,
    },
  };
};

/**
 * Update specific block properties in state
 */
export const updateBlockPropertiesInState = (
  state: EditorState,
  blockId: number,
  propertyUpdates: Record<string, any>,
): EditorState => {
  const existingBlock = state.blockMap[blockId];
  if (!existingBlock) return state;

  const updatedBlock: Block = {
    ...existingBlock,
    properties: {
      ...existingBlock.properties,
      ...propertyUpdates,
    },
  } as Block;

  return {
    ...state,
    blockMap: {
      ...state.blockMap,
      [blockId]: updatedBlock,
    },
  };
};
