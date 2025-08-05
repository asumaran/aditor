import { type FC, type ReactNode, useState, useCallback } from 'react';
import { useBlockInteraction } from '@/hooks';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { OptionsView } from './OptionsView';
import { BlockMenuView } from './menu';
import type { BlockType, PopoverView, Option } from '@/types';

interface BlockWrapperProps {
  children: ReactNode;
  onBlockClick?: () => void;
  className?: string;
  blockType?: BlockType;
  blockId?: number;
  required?: boolean;
  description?: boolean;
  options?: readonly Option[];
  sortOrder?: 'manual' | 'asc' | 'desc';
  onRequiredChange?: (required: boolean) => void;
  onDescriptionChange?: (description: boolean) => void;
  onDeleteBlock?: () => void;
}

export const BlockWrapper: FC<BlockWrapperProps> = ({
  children,
  onBlockClick,
  className,
  blockType,
  blockId,
  required = false,
  description = false,
  options = [],
  sortOrder = 'manual',
  onRequiredChange,
  onDescriptionChange,
  onDeleteBlock,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [currentView, setCurrentView] = useState<PopoverView>('menu');
  const { isHovered, handleMouseEnter, handleMouseLeave } = useBlockInteraction(
    { onBlockClick },
  );

  const isFormBlock =
    blockType &&
    ['short_answer', 'multiple_choice', 'multiselect'].includes(blockType);

  const handleClick = () => {
    if (isFormBlock) {
      setCurrentView('menu');
      setIsPopoverOpen(true);
    }
    onBlockClick?.();
  };

  const handleRequiredToggle = useCallback(
    (newRequired: boolean) => {
      onRequiredChange?.(newRequired);
    },
    [onRequiredChange],
  );

  const handleDescriptionToggle = useCallback(
    (newDescription: boolean) => {
      onDescriptionChange?.(newDescription);
    },
    [onDescriptionChange],
  );

  const handleOptionsClick = useCallback(() => {
    setCurrentView('options');
  }, []);

  const handleBackToMenu = useCallback(() => {
    setCurrentView('menu');
  }, []);

  const handleDeleteClick = useCallback(() => {
    setIsPopoverOpen(false);
    onDeleteBlock?.();
  }, [onDeleteBlock]);

  const handleClosePopover = useCallback(() => {
    setIsPopoverOpen(false);
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
          // Base classes - always applied
          'relative w-full rounded-md p-2 transition-all hover:cursor-pointer',
          // Border - always the same width
          'border-[0.5px] border-[rgba(35,131,226,0.35)]',
          className,
        )}
        style={{
          // Dynamic box-shadow based on state (no click state for non-form blocks)
          boxShadow: isHovered
            ? 'rgba(35, 131, 226, 0.35) 0px 0px 0px 1px, rgba(35, 131, 226, 0.35) 0px 0px 0px 1px inset'
            : 'rgba(35, 131, 226, 0.35) 0px 0px 0px 0px, rgba(35, 131, 226, 0.35) 0px 0px 0px 0px inset',
          transition: 'all 0.2s',
        }}
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
            // Base classes - always applied
            'relative m-0 mb-6 w-full rounded-xl bg-white p-3 transition-all hover:cursor-pointer',
            // Border - always the same width
            'border-[0.5px] border-[rgba(35,131,226,0.35)]',
            className,
          )}
          style={{
            // Dynamic box-shadow based on state
            boxShadow: isPopoverOpen
              ? '0 0 0 1px rgb(35,131,226), inset 0 0 0 1px rgb(35,131,226)'
              : isHovered
                ? 'rgba(35, 131, 226, 0.35) 0px 0px 0px 1px, rgba(35, 131, 226, 0.35) 0px 0px 0px 1px inset'
                : 'rgba(35, 131, 226, 0.35) 0px 0px 0px 0px, rgba(35, 131, 226, 0.35) 0px 0px 0px 0px inset',
            // Border color changes when clicked/open
            borderColor: isPopoverOpen
              ? 'rgb(35,131,226)'
              : 'rgba(35,131,226,0.35)',
            transition: 'all 0.2s',
          }}
        >
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent
        side='right'
        align='start'
        alignOffset={-2}
        className='max-h-[min(80vh,40rem)] w-70 p-0'
        onEscapeKeyDown={handleEscapeKeyDown}
      >
        {currentView === 'menu' ? (
          <BlockMenuView
            blockType={blockType!}
            required={required}
            description={description}
            optionsCount={options.length}
            onRequiredChange={handleRequiredToggle}
            onDescriptionChange={handleDescriptionToggle}
            onOptionsClick={handleOptionsClick}
            onDeleteClick={handleDeleteClick}
            onClose={handleClosePopover}
          />
        ) : (
          <OptionsView
            blockId={blockId!}
            options={options}
            onBack={handleBackToMenu}
            onClose={handleClosePopover}
            sortOrder={sortOrder}
          />
        )}
      </PopoverContent>
    </Popover>
  );
};
