import { type FC, type ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { GripVertical } from 'lucide-react';
import { animateLayoutChanges } from '@/lib/dndConfig';

interface SortableBlockWrapperProps {
  children: ReactNode;
  blockId: number;
  dragHandlesVisible?: boolean;
}

export const SortableBlockWrapper: FC<SortableBlockWrapperProps> = ({
  children,
  blockId,
  dragHandlesVisible = true,
}) => {
  const { attributes, listeners, setNodeRef, isOver, index, over, active } =
    useSortable({
      id: blockId.toString(),
      animateLayoutChanges,
      transition: {
        duration: 0, // Disable transition duration
        easing: 'linear',
      },
    });

  // Never apply transforms - keep elements always in place
  const style = {};

  // Calculate if we should show the drop indicator
  const showDropIndicator = isOver && over && active && over.id !== active.id;
  const activeIndex = active?.data?.current?.sortable?.index;
  const overIndex = index;
  const showAbove = showDropIndicator && activeIndex > overIndex;
  const showBelow = showDropIndicator && activeIndex < overIndex;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='group relative'
      data-sortable-id={blockId}
    >
      {/* Drop indicator - top */}
      {showAbove && (
        <div className='absolute -top-0.5 right-0 left-0 z-50 h-0.5 bg-blue-500' />
      )}

      {/* Drag Handle - positioned absolutely to not affect layout */}
      {dragHandlesVisible && (
        <div
          className='absolute top-1 left-[-24px] flex h-6 w-6 cursor-grab items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 active:cursor-grabbing'
          {...attributes}
          {...listeners}
        >
          <GripVertical className='h-4 w-4 text-gray-400 hover:text-gray-600' />
        </div>
      )}

      {/* Content */}
      <div>{children}</div>

      {/* Drop indicator - bottom */}
      {showBelow && (
        <div className='absolute right-0 -bottom-0.5 left-0 z-50 h-0.5 bg-blue-500' />
      )}
    </div>
  );
};
