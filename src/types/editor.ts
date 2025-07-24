import type { Block, Option } from './blocks';

export type EditorAction =
  | { type: 'ADD_BLOCK'; payload: Block }
  | { type: 'UPDATE_BLOCK_CONTENT'; payload: { id: number; value: string } }
  | {
      type: 'UPDATE_BLOCK_REQUIRED';
      payload: { id: number; required: boolean };
    }
  | {
      type: 'UPDATE_BLOCK_OPTIONS';
      payload: { id: number; options: readonly Option[] };
    }
  | { type: 'ADD_OPTION'; payload: { blockId: number; option: Option } }
  | { type: 'REMOVE_OPTION'; payload: { blockId: number; optionId: number } }
  | {
      type: 'UPDATE_OPTION';
      payload: { blockId: number; optionId: number; text: string };
    }
  | { type: 'REMOVE_BLOCK'; payload: { id: number } };
