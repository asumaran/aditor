import { useReducer, type ReactNode } from 'react';
import type { Block, EditorAction } from '@/types';
import { EditorContext, type EditorState } from './EditorContextDefinition';
import {
  addBlockToState,
  insertBlockAfter,
  removeBlockFromState,
  updateBlockInState,
  getBlockById,
} from '@/lib/editorUtils';

const editorReducer = (
  state: EditorState,
  action: EditorAction,
): EditorState => {
  switch (action.type) {
    case 'ADD_BLOCK':
      return addBlockToState(state, action.payload);

    case 'INSERT_BLOCK_AFTER':
      return insertBlockAfter(
        state,
        action.payload.afterBlockId,
        action.payload.newBlock,
      );

    case 'UPDATE_BLOCK_CONTENT': {
      const block = getBlockById(state, action.payload.id);
      if (!block) return state;

      let updatedProperties;
      switch (block.type) {
        case 'text':
        case 'heading':
          updatedProperties = {
            ...block.properties,
            title: action.payload.value,
          };
          break;
        case 'short_answer':
        case 'multiple_choice':
        case 'multiselect':
          updatedProperties = {
            ...block.properties,
            label: action.payload.value,
          };
          break;
        default:
          return state;
      }

      return updateBlockInState(state, action.payload.id, {
        properties: updatedProperties,
      });
    }

    case 'UPDATE_BLOCK_REQUIRED': {
      const block = getBlockById(state, action.payload.id);
      if (!block) return state;

      if (
        !['short_answer', 'multiple_choice', 'multiselect'].includes(block.type)
      ) {
        return state;
      }

      return updateBlockInState(state, action.payload.id, {
        properties: {
          ...block.properties,
          required: action.payload.required,
        },
      });
    }

    case 'UPDATE_BLOCK_OPTIONS': {
      const block = getBlockById(state, action.payload.id);
      if (
        !block ||
        (block.type !== 'multiple_choice' && block.type !== 'multiselect')
      ) {
        return state;
      }

      return updateBlockInState(state, action.payload.id, {
        properties: {
          ...block.properties,
          options: action.payload.options,
        },
      });
    }

    case 'ADD_OPTION': {
      const block = getBlockById(state, action.payload.blockId);
      if (
        !block ||
        (block.type !== 'multiple_choice' && block.type !== 'multiselect')
      ) {
        return state;
      }

      return updateBlockInState(state, action.payload.blockId, {
        properties: {
          ...block.properties,
          options: [action.payload.option, ...block.properties.options],
        },
      });
    }

    case 'REMOVE_OPTION': {
      const block = getBlockById(state, action.payload.blockId);
      if (
        !block ||
        (block.type !== 'multiple_choice' && block.type !== 'multiselect')
      ) {
        return state;
      }

      return updateBlockInState(state, action.payload.blockId, {
        properties: {
          ...block.properties,
          options: block.properties.options.filter(
            (option) => option.id !== action.payload.optionId,
          ),
        },
      });
    }

    case 'UPDATE_OPTION': {
      const block = getBlockById(state, action.payload.blockId);
      if (
        !block ||
        (block.type !== 'multiple_choice' && block.type !== 'multiselect')
      ) {
        return state;
      }

      return updateBlockInState(state, action.payload.blockId, {
        properties: {
          ...block.properties,
          options: block.properties.options.map((option) =>
            option.id === action.payload.optionId
              ? { ...option, text: action.payload.text }
              : option,
          ),
        },
      });
    }

    case 'REMOVE_BLOCK':
      return removeBlockFromState(state, action.payload.id);

    default:
      return state;
  }
};

interface EditorProviderProps {
  children: ReactNode;
  initialBlocks?: readonly Block[];
}

export const EditorProvider = ({
  children,
  initialBlocks = [],
}: EditorProviderProps) => {
  const initialState = {
    blocks: initialBlocks.map((block) => block.id),
    blockMap: initialBlocks.reduce(
      (map, block) => {
        map[block.id] = block;
        return map;
      },
      {} as Record<number, Block>,
    ),
  };

  const [state, dispatch] = useReducer(editorReducer, initialState);

  return (
    <EditorContext.Provider value={{ state, dispatch }}>
      {children}
    </EditorContext.Provider>
  );
};
