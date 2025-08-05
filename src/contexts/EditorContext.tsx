import { useReducer, type ReactNode } from 'react';
import type { Block, EditorAction } from '@/types';
import { EditorContext, type EditorState } from './EditorContextDefinition';
import {
  addBlockToState,
  insertBlockAfter,
  removeBlockFromState,
  updateBlockPropertiesInState,
  getBlockById,
} from '@/lib/editorUtils';
import { createTextBlock, createHeadingBlock } from '@/lib/blockFactory';

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

      switch (block.type) {
        case 'text':
        case 'heading':
          return updateBlockPropertiesInState(state, action.payload.id, {
            title: action.payload.value,
          });
        case 'short_answer':
        case 'multiple_choice':
        case 'multiselect':
          return updateBlockPropertiesInState(state, action.payload.id, {
            label: action.payload.value,
          });
        default:
          return state;
      }
    }

    case 'UPDATE_BLOCK_FIELD': {
      const block = getBlockById(state, action.payload.id);
      if (!block) return state;

      return updateBlockPropertiesInState(state, action.payload.id, {
        [action.payload.fieldId]: action.payload.value,
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

      return updateBlockPropertiesInState(state, action.payload.id, {
        required: action.payload.required,
      });
    }

    case 'UPDATE_BLOCK_DESCRIPTION': {
      const block = getBlockById(state, action.payload.id);
      if (!block) return state;

      if (
        !['short_answer', 'multiple_choice', 'multiselect'].includes(block.type)
      ) {
        return state;
      }

      return updateBlockPropertiesInState(state, action.payload.id, {
        showDescription: action.payload.showDescription,
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

      // If preserveOrder is true (drag & drop), don't apply sorting
      const sortedOptions = action.payload.preserveOrder
        ? action.payload.options
        : block.properties.sortOrder === 'asc'
          ? [...action.payload.options].sort((a, b) =>
              a.text.localeCompare(b.text),
            )
          : block.properties.sortOrder === 'desc'
            ? [...action.payload.options].sort((a, b) =>
                b.text.localeCompare(a.text),
              )
            : action.payload.options; // For 'manual', keep the order as provided

      return updateBlockPropertiesInState(state, action.payload.id, {
        options: sortedOptions,
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

      // For all modes, add new option at the end first
      const newOptions = [...block.properties.options, action.payload.option];

      // Apply current sort order to the new options array
      let sortedOptions;
      if (block.properties.sortOrder === 'asc') {
        sortedOptions = [...newOptions].sort((a, b) =>
          a.text.localeCompare(b.text),
        );
      } else if (block.properties.sortOrder === 'desc') {
        sortedOptions = [...newOptions].sort((a, b) =>
          b.text.localeCompare(a.text),
        );
      } else {
        // For 'manual', keep the current order (new option at the end)
        sortedOptions = newOptions;
      }

      return updateBlockPropertiesInState(state, action.payload.blockId, {
        options: sortedOptions,
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

      return updateBlockPropertiesInState(state, action.payload.blockId, {
        options: block.properties.options.filter(
          (option) => option.id !== action.payload.optionId,
        ),
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

      return updateBlockPropertiesInState(state, action.payload.blockId, {
        options: block.properties.options.map((option) =>
          option.id === action.payload.optionId
            ? { ...option, text: action.payload.text }
            : option,
        ),
      });
    }

    case 'REMOVE_BLOCK':
      return removeBlockFromState(state, action.payload.id);

    case 'CHANGE_BLOCK_TYPE': {
      const { id, newType } = action.payload;
      const block = getBlockById(state, id);
      if (!block) return state;

      // For slash commands, we always create empty blocks
      // This action is primarily used for slash command conversions
      const newBlock = (() => {
        switch (newType) {
          case 'text':
            return { ...createTextBlock(''), id };
          case 'heading':
            return { ...createHeadingBlock(''), id };
          default:
            return block;
        }
      })();

      return {
        ...state,
        blockMap: { ...state.blockMap, [id]: newBlock },
      };
    }

    case 'UPDATE_SORT_ORDER': {
      const { id, sortOrder } = action.payload;
      const block = getBlockById(state, id);
      if (
        !block ||
        (block.type !== 'multiple_choice' && block.type !== 'multiselect')
      ) {
        return state;
      }

      // Sort options based on the selected order
      const sortedOptions = [...block.properties.options];
      if (sortOrder === 'asc') {
        sortedOptions.sort((a, b) => a.text.localeCompare(b.text));
      } else if (sortOrder === 'desc') {
        sortedOptions.sort((a, b) => b.text.localeCompare(a.text));
      }
      // For 'manual', keep the current order

      return updateBlockPropertiesInState(state, id, {
        sortOrder,
        options: sortedOptions,
      });
    }

    case 'REORDER_BLOCKS': {
      return {
        ...state,
        blocks: action.payload.blockIds,
      };
    }

    case 'REPLACE_BLOCK': {
      const { id, newBlock } = action.payload;
      const existingBlock = getBlockById(state, id);
      if (!existingBlock) return state;

      // Replace the block with the new one, keeping the same ID and position
      const replacementBlock = { ...newBlock, id };

      return {
        ...state,
        blockMap: { ...state.blockMap, [id]: replacementBlock },
      };
    }

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
