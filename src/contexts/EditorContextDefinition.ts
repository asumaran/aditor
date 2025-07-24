import { createContext, type Dispatch } from 'react';
import type { Block, EditorAction } from '@/types';

interface EditorState {
  readonly blocks: readonly Block[];
}

interface EditorContextType {
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
}

export const EditorContext = createContext<EditorContextType | null>(null);
export type { EditorState, EditorContextType };
