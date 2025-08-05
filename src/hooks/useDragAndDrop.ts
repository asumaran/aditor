import { useState, useCallback } from 'react';
import { useEditor, useGlobalFocusManager } from '@/hooks';
import { arrayMove } from '@dnd-kit/sortable';
import { getOrderedBlocks } from '@/lib/editorUtils';
import type { DragEndEvent } from '@dnd-kit/core';

export const useDragAndDrop = () => {
  const { state, dispatch } = useEditor();
  const focusManager = useGlobalFocusManager();
  const [activeBlockId, setActiveBlockId] = useState<number | null>(null);

  const handleDragStart = useCallback(
    (event: { active: { id: string | number } }) => {
      setActiveBlockId(Number(event.active.id));
    },
    [],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveBlockId(null);

      if (over && active.id !== over.id) {
        const orderedBlocks = getOrderedBlocks(state);
        const oldIndex = orderedBlocks.findIndex(
          (block) => block.id.toString() === active.id,
        );
        const newIndex = orderedBlocks.findIndex(
          (block) => block.id.toString() === over.id,
        );

        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedBlockIds = arrayMove(
            orderedBlocks.map((block) => block.id),
            oldIndex,
            newIndex,
          );
          dispatch({
            type: 'REORDER_BLOCKS',
            payload: { blockIds: reorderedBlockIds },
          });

          // Restore focus to the dragged block after drag operation
          const draggedBlockId = Number(active.id);
          focusManager.focusBlock(draggedBlockId, {
            autoFocus: true,
            deferred: true, // Wait for React reorder
          });
        }
      }
    },
    [state, dispatch, focusManager],
  );

  return {
    activeBlockId,
    handleDragStart,
    handleDragEnd,
  };
};
