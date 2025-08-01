import type { Block, Option } from './blocks';

export type EditorAction =
  | { type: 'ADD_BLOCK'; payload: Block }
  | {
      type: 'INSERT_BLOCK_AFTER';
      payload: { afterBlockId: number; newBlock: Block };
    }
  | { type: 'UPDATE_BLOCK_CONTENT'; payload: { id: number; value: string } }
  | {
      type: 'UPDATE_BLOCK_FIELD';
      payload: { id: number; fieldId: string; value: string };
    }
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
  | { type: 'REMOVE_BLOCK'; payload: { id: number } }
  | { type: 'CHANGE_BLOCK_TYPE'; payload: { id: number; newType: string } }
  | { type: 'UPDATE_SORT_ORDER'; payload: { id: number; sortOrder: 'manual' | 'asc' | 'desc' } };
