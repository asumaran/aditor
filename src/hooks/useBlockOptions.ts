import { useCallback } from 'react';
import { useEditor } from './useEditor';
import { generateId } from '@/lib/utils';
import type { Option } from '@/types';

export const useBlockOptions = (blockId: number) => {
  const { dispatch } = useEditor();

  const addOption = useCallback(
    (text: string = '') => {
      const newOption: Option = {
        id: generateId(),
        text,
      };
      dispatch({
        type: 'ADD_OPTION',
        payload: { blockId, option: newOption },
      });
    },
    [dispatch, blockId],
  );

  const removeOption = useCallback(
    (optionId: number) => {
      dispatch({
        type: 'REMOVE_OPTION',
        payload: { blockId, optionId },
      });
    },
    [dispatch, blockId],
  );

  const updateOption = useCallback(
    (optionId: number, text: string) => {
      dispatch({
        type: 'UPDATE_OPTION',
        payload: { blockId, optionId, text },
      });
    },
    [dispatch, blockId],
  );

  const reorderOptions = useCallback(
    (newOptions: readonly Option[]) => {
      dispatch({
        type: 'UPDATE_BLOCK_OPTIONS',
        payload: { id: blockId, options: newOptions },
      });
    },
    [dispatch, blockId],
  );

  return {
    addOption,
    removeOption,
    updateOption,
    reorderOptions,
  };
};
