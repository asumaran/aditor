import { type FC, type ReactNode } from 'react';
import { useBlockInteraction } from '@/hooks';
import { cn } from '@/lib/utils';

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
  const { isHovered, handleMouseEnter, handleMouseLeave, handleClick } =
    useBlockInteraction({ onBlockClick });

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
};
