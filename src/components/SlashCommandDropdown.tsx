import { type FC, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface BlockType {
  id: string;
  label: string;
  description?: string;
}

interface SlashCommandDropdownProps {
  isOpen: boolean;
  filteredBlocks: BlockType[];
  onSelect: (block: BlockType) => void;
  targetRef?: React.RefObject<HTMLElement | null>;
  selectedIndex?: number;
}

export const SlashCommandDropdown: FC<SlashCommandDropdownProps> = ({
  isOpen,
  filteredBlocks,
  onSelect,
  targetRef,
  selectedIndex = 0,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Position dropdown below the target element
  useEffect(() => {
    if (!isOpen || !targetRef?.current || !dropdownRef.current) return;

    const target = targetRef.current;
    const dropdown = dropdownRef.current;

    const rect = target.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.top = `${rect.bottom + 4}px`;
    dropdown.style.width = '240px';
  }, [isOpen, targetRef]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      data-slash-dropdown
      data-testid='slash-dropdown'
      className={cn(
        'z-50 min-w-[240px] overflow-hidden rounded-md bg-white shadow-md',
        'border border-gray-200',
        'animate-in fade-in-0 zoom-in-95',
      )}
    >
      <div className='p-1'>
        {filteredBlocks.length > 0 ? (
          filteredBlocks.map((block, index) => (
            <button
              key={block.id}
              onClick={() => onSelect(block)}
              role='option'
              className={cn(
                'flex w-full cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-sm outline-none select-none',
                'hover:bg-gray-100 focus:bg-gray-100',
                'transition-colors',
                index === selectedIndex && 'selected bg-gray-100', // Highlight selected item
              )}
            >
              <div className='flex flex-col items-start'>
                <div className='font-medium'>{block.label}</div>
                {block.description && (
                  <div className='text-xs text-gray-500'>
                    {block.description}
                  </div>
                )}
              </div>
            </button>
          ))
        ) : (
          <div className='px-2 py-1.5 text-sm text-gray-500'>
            No blocks found
          </div>
        )}
      </div>
    </div>
  );
};
