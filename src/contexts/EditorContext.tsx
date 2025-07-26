import { useReducer, type ReactNode } from 'react';
import type { Block, EditorAction } from '@/types';
import { EditorContext, type EditorState } from './EditorContextDefinition';

const editorReducer = (
  state: EditorState,
  action: EditorAction,
): EditorState => {
  switch (action.type) {
    case 'ADD_BLOCK':
      return {
        ...state,
        blocks: [...state.blocks, action.payload],
      };

    case 'INSERT_BLOCK_AFTER':
      const afterIndex = state.blocks.findIndex(
        (block) => block.id === action.payload.afterBlockId
      );
      if (afterIndex === -1) {
        // If block not found, add at the end
        return {
          ...state,
          blocks: [...state.blocks, action.payload.newBlock],
        };
      }
      // Insert the new block after the found block
      const newBlocks = [...state.blocks];
      newBlocks.splice(afterIndex + 1, 0, action.payload.newBlock);
      return {
        ...state,
        blocks: newBlocks,
      };

    case 'UPDATE_BLOCK_CONTENT':
      return {
        ...state,
        blocks: state.blocks.map((block) => {
          if (block.id !== action.payload.id) return block;

          switch (block.type) {
            case 'text':
              return {
                ...block,
                properties: {
                  ...block.properties,
                  title: action.payload.value,
                },
              };
            case 'short_answer':
              return {
                ...block,
                properties: {
                  ...block.properties,
                  label: action.payload.value,
                },
              } as typeof block;
            case 'multiple_choice':
              return {
                ...block,
                properties: {
                  ...block.properties,
                  label: action.payload.value,
                },
              } as typeof block;
            case 'multiselect':
              return {
                ...block,
                properties: {
                  ...block.properties,
                  label: action.payload.value,
                },
              } as typeof block;
            default:
              return block;
          }
        }),
      };

    case 'UPDATE_BLOCK_REQUIRED':
      return {
        ...state,
        blocks: state.blocks.map((block) => {
          if (block.id !== action.payload.id) return block;

          switch (block.type) {
            case 'short_answer':
              return {
                ...block,
                properties: {
                  ...block.properties,
                  required: action.payload.required,
                },
              } as typeof block;
            case 'multiple_choice':
              return {
                ...block,
                properties: {
                  ...block.properties,
                  required: action.payload.required,
                },
              } as typeof block;
            case 'multiselect':
              return {
                ...block,
                properties: {
                  ...block.properties,
                  required: action.payload.required,
                },
              } as typeof block;
            default:
              return block;
          }
        }),
      };

    case 'UPDATE_BLOCK_OPTIONS':
      return {
        ...state,
        blocks: state.blocks.map((block) => {
          if (block.id !== action.payload.id) return block;
          if (block.type !== 'multiple_choice' && block.type !== 'multiselect')
            return block;

          return {
            ...block,
            properties: {
              ...block.properties,
              options: action.payload.options,
            },
          };
        }),
      };

    case 'ADD_OPTION':
      return {
        ...state,
        blocks: state.blocks.map((block) => {
          if (block.id !== action.payload.blockId) return block;
          if (block.type !== 'multiple_choice' && block.type !== 'multiselect')
            return block;

          return {
            ...block,
            properties: {
              ...block.properties,
              options: [action.payload.option, ...block.properties.options],
            },
          };
        }),
      };

    case 'REMOVE_OPTION':
      return {
        ...state,
        blocks: state.blocks.map((block) => {
          if (block.id !== action.payload.blockId) return block;
          if (block.type !== 'multiple_choice' && block.type !== 'multiselect')
            return block;

          return {
            ...block,
            properties: {
              ...block.properties,
              options: block.properties.options.filter(
                (option) => option.id !== action.payload.optionId,
              ),
            },
          };
        }),
      };

    case 'UPDATE_OPTION':
      return {
        ...state,
        blocks: state.blocks.map((block) => {
          if (block.id !== action.payload.blockId) return block;
          if (block.type !== 'multiple_choice' && block.type !== 'multiselect')
            return block;

          return {
            ...block,
            properties: {
              ...block.properties,
              options: block.properties.options.map((option) =>
                option.id === action.payload.optionId
                  ? { ...option, text: action.payload.text }
                  : option,
              ),
            },
          };
        }),
      };

    case 'REMOVE_BLOCK':
      return {
        ...state,
        blocks: state.blocks.filter((block) => block.id !== action.payload.id),
      };

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
  const [state, dispatch] = useReducer(editorReducer, {
    blocks: initialBlocks,
  });

  return (
    <EditorContext.Provider value={{ state, dispatch }}>
      {children}
    </EditorContext.Provider>
  );
};
