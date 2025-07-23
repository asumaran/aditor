import { type FC, type ReactNode, useState, useCallback } from 'react';
import { useBlockInteraction } from '@/hooks';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import type { BlockType } from '@/types';

interface BlockWrapperProps {
  children: ReactNode;
  onBlockClick?: () => void;
  className?: string;
  blockType?: BlockType;
  required?: boolean;
  onRequiredChange?: (required: boolean) => void;
}

export const BlockWrapper: FC<BlockWrapperProps> = ({
  children,
  onBlockClick,
  className,
  blockType,
  required = false,
  onRequiredChange,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { isHovered, handleMouseEnter, handleMouseLeave } =
    useBlockInteraction();

  const isFormBlock =
    blockType &&
    ['short_answer', 'multiple_choice', 'multiselect'].includes(blockType);

  const handleClick = () => {
    if (isFormBlock) {
      setIsPopoverOpen(true);
    }
    onBlockClick?.();
  };

  const handleRequiredToggle = useCallback(() => {
    onRequiredChange?.(!required);
  }, [onRequiredChange, required]);

  if (!isFormBlock) {
    return (
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={cn(
          'relative transition-all duration-200 rounded-md p-2',
          'hover:cursor-pointer',
          isHovered && 'shadow-[0_0_0_2px_rgb(59_130_246_/_0.5)]', // Blue shadow on hover
          className,
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          className={cn(
            'relative transition-all duration-200 rounded-md p-2',
            'hover:cursor-pointer',
            (isHovered || isPopoverOpen) &&
              'shadow-[0_0_0_2px_rgb(59_130_246_/_0.5)]', // Blue shadow on hover or when popover is open
            className,
          )}
        >
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent
        side='right'
        align='start'
        alignOffset={-2}
        className='w-80 p-0'
      >
        <div className='py-2'>
          <div
            className='flex items-center justify-between px-4 py-2 hover:bg-accent hover:cursor-pointer'
            onClick={handleRequiredToggle}
          >
            <span className='text-sm font-medium'>Required</span>
            <Switch
              checked={required}
              onCheckedChange={onRequiredChange}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
