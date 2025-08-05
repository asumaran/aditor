import type { FC } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { BlockRenderer } from '@/components';
import { useEditor } from '@/hooks';
import { getOrderedBlocks } from '@/lib/editorUtils';
import type { Block, Option } from '@/types';

interface EditorCanvasProps {
  activeBlockId: number | null;
  dragHandlesVisible: boolean;
  onDragStart: (event: { active: { id: string | number } }) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onBlockChange: (id: Block['id'], value: string) => void;
  onFieldChange: (id: Block['id'], fieldId: string, value: string) => void;
  onOptionsChange: (id: Block['id'], options: readonly Option[]) => void;
  onRequiredChange: (id: Block['id'], required: boolean) => void;
  onDescriptionChange: (id: Block['id'], showDescription: boolean) => void;
  onBlockClick: (blockId: Block['id']) => void;
  onCreateBlockAfter: (
    afterBlockId: Block['id'],
    options?: {
      initialContent?: string;
      cursorAtStart?: boolean;
      blockType?: string;
      onFocusTransferred?: () => void;
      replaceCurrentBlock?: boolean;
    },
  ) => number;
  onChangeBlockType: (blockId: Block['id'], newType: string) => void;
  onDeleteBlock: (blockId: Block['id']) => void;
  onMergeWithPrevious: (blockId: Block['id'], currentContent: string) => void;
  onNavigateToPrevious: (blockId: Block['id']) => void;
  onNavigateToNext: (blockId: Block['id']) => void;
}

export const EditorCanvas: FC<EditorCanvasProps> = ({
  activeBlockId,
  dragHandlesVisible,
  onDragStart,
  onDragEnd,
  onBlockChange,
  onFieldChange,
  onOptionsChange,
  onRequiredChange,
  onDescriptionChange,
  onBlockClick,
  onCreateBlockAfter,
  onChangeBlockType,
  onDeleteBlock,
  onMergeWithPrevious,
  onNavigateToPrevious,
  onNavigateToNext,
}) => {
  const { state } = useEditor();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  return (
    <div className='main-container grow bg-white py-5' id='mouse-listener'>
      <div id='form-container' className='m-auto w-[600px]'>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={getOrderedBlocks(state).map((block) => block.id.toString())}
            strategy={verticalListSortingStrategy}
          >
            {getOrderedBlocks(state).map((block) => (
              <BlockRenderer
                key={block.id}
                block={block}
                onChange={onBlockChange}
                onFieldChange={onFieldChange}
                onOptionsChange={onOptionsChange}
                onRequiredChange={onRequiredChange}
                onDescriptionChange={onDescriptionChange}
                onBlockClick={onBlockClick}
                onCreateBlockAfter={onCreateBlockAfter}
                onChangeBlockType={onChangeBlockType}
                onDeleteBlock={onDeleteBlock}
                onMergeWithPrevious={onMergeWithPrevious}
                onNavigateToPrevious={onNavigateToPrevious}
                onNavigateToNext={onNavigateToNext}
                dragHandlesVisible={dragHandlesVisible}
              />
            ))}
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {activeBlockId ? (
              <div className='opacity-50'>
                <BlockRenderer
                  block={state.blockMap[activeBlockId]}
                  onChange={() => {}}
                  onFieldChange={() => {}}
                  onOptionsChange={() => {}}
                  onRequiredChange={() => {}}
                  onBlockClick={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};
