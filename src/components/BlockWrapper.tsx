import { type FC, type ReactNode, useState } from 'react';
import { useBlockInteraction } from '@/hooks';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface BlockWrapperProps {
  children: ReactNode;
  onBlockClick?: () => void;
  className?: string;
}

export const BlockWrapper: FC<BlockWrapperProps> = ({
  children,
  onBlockClick,
  className,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { isHovered, handleMouseEnter, handleMouseLeave } = useBlockInteraction();

  const handleClick = () => {
    setIsPopoverOpen(true);
    onBlockClick?.();
  };

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
            (isHovered || isPopoverOpen) && 'shadow-[0_0_0_2px_rgb(59_130_246_/_0.5)]', // Blue shadow on hover or when popover is open
            className,
          )}
        >
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent 
        side="right" 
        align="start" 
        alignOffset={-2}
        className="w-80"
      >
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Block Settings</h4>
          <p className="text-sm text-muted-foreground">
            Configure this block's settings and properties.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
