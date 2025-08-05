import type { FC } from 'react';
import { AVAILABLE_BLOCKS } from '@/config/blocks';
import { useBlockOperations } from '@/hooks';

interface EditorSidebarProps {
  lastFocusedBlockId: number | null;
}

export const EditorSidebar: FC<EditorSidebarProps> = ({
  lastFocusedBlockId,
}) => {
  const { addBlock } = useBlockOperations(lastFocusedBlockId);

  return (
    <div className='w-52 shrink-0 bg-gray-100'>
      <div className='grid grid-cols-2 gap-2 p-4'>
        {AVAILABLE_BLOCKS.map((block) => {
          const Icon = block.icon;

          return (
            <button
              key={block.id}
              onClick={() => addBlock(block.id)}
              className='flex h-20 flex-col items-center justify-center gap-2 rounded-md bg-white p-3 text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md active:scale-95'
              title={block.description}
            >
              <Icon className='h-5 w-5' />
              <span className='text-center text-xs leading-tight font-medium'>
                {block.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
