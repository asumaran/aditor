import { createContext, type Dispatch } from 'react';
import type { Block, EditorAction } from '@/types';

interface EditorState {
  readonly blocks: readonly number[]; // Array of IDs for order
  readonly blockMap: Record<number, Block>; // Map for O(1) access
}

interface EditorContextType {
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
}

export const EditorContext = createContext<EditorContextType | null>(null);
export type { EditorState, EditorContextType };
