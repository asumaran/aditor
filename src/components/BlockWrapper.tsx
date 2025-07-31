import { type FC, type ReactNode, useState, useCallback } from 'react';
import { useBlockInteraction } from '@/hooks';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { OptionsView } from './OptionsView';
import type { BlockType, PopoverView, Option } from '@/types';

interface BlockWrapperProps {
  children: ReactNode;
  onBlockClick?: () => void;
  className?: string;
  blockType?: BlockType;
  blockId?: number;
  required?: boolean;
  options?: readonly Option[];
  onRequiredChange?: (required: boolean) => void;
}

export const BlockWrapper: FC<BlockWrapperProps> = ({
  children,
  onBlockClick,
  className,
  blockType,
  blockId,
  required = false,
  options = [],
  onRequiredChange,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [currentView, setCurrentView] = useState<PopoverView>('menu');
  const { isHovered, handleMouseEnter, handleMouseLeave } =
    useBlockInteraction();

  const isFormBlock =
    blockType &&
    ['short_answer', 'multiple_choice', 'multiselect'].includes(blockType);

  const hasOptionsSupport =
    blockType === 'multiple_choice' || blockType === 'multiselect';

  const handleClick = () => {
    if (isFormBlock) {
      setCurrentView('menu');
      setIsPopoverOpen(true);
    }
    onBlockClick?.();
  };

  const handleRequiredToggle = useCallback(() => {
    onRequiredChange?.(!required);
  }, [onRequiredChange, required]);

  const handleOptionsClick = useCallback(() => {
    setCurrentView('options');
  }, []);

  const handleBackToMenu = useCallback(() => {
    setCurrentView('menu');
  }, []);

  const handlePopoverOpenChange = useCallback((open: boolean) => {
    setIsPopoverOpen(open);
    // Only reset to menu view when opening the popover
    // This prevents the visual flick from options -> menu -> closed when closing
    if (open) {
      setCurrentView('menu');
    }
  }, []);

  const handleEscapeKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check if the focused element is an input within the OptionsView
      // This prevents popover close for ANY input in the options management view,
      // including both "add option" and "edit option" inputs.
      const activeElement = document.activeElement as HTMLInputElement;
      if (
        activeElement &&
        activeElement.tagName === 'INPUT' &&
        currentView === 'options'
      ) {
        event.preventDefault();
        // Let the OptionsView handle the escape behavior for its inputs
      }
    },
    [currentView],
  );

  if (!isFormBlock) {
    return (
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={cn(
          'relative w-full rounded-md p-2 transition-all duration-200',
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
    <Popover
      open={isPopoverOpen}
      onOpenChange={handlePopoverOpenChange}
      modal={true}
    >
      <PopoverTrigger asChild>
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          className={cn(
            'relative m-0 w-full rounded-xl border border-[rgba(35,131,226,0.35)] bg-white p-3 shadow-[rgba(35,131,226,0.35)_0px_0px_0px_0px,rgba(35,131,226,0.35)_0px_0px_0px_0.5px_inset] transition-shadow',
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
        className='max-h-[min(80vh,40rem)] w-80 p-0'
        onEscapeKeyDown={handleEscapeKeyDown}
      >
        {currentView === 'menu' ? (
          <div className='py-2'>
            <div
              className='hover:bg-accent flex items-center justify-between px-4 py-2 hover:cursor-pointer'
              onClick={handleRequiredToggle}
            >
              <span className='text-sm font-medium'>Required</span>
              <Switch
                checked={required}
                onCheckedChange={onRequiredChange}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            {hasOptionsSupport && (
              <div
                className='hover:bg-accent flex items-center justify-between px-4 py-2 hover:cursor-pointer'
                onClick={handleOptionsClick}
              >
                <span className='text-sm font-medium'>Options</span>
                <span className='text-xs text-gray-500'>{options.length}</span>
              </div>
            )}
          </div>
        ) : (
          <OptionsView
            blockId={blockId!}
            options={options}
            onBack={handleBackToMenu}
          />
        )}
      </PopoverContent>
    </Popover>
  );
};
