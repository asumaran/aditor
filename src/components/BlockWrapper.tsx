import { type FC, type ReactNode, useState, useCallback } from 'react';
import { useBlockInteraction } from '@/hooks';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Database, Trash2, Asterisk, X } from 'lucide-react';
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
  sortOrder?: 'manual' | 'asc' | 'desc';
  onRequiredChange?: (required: boolean) => void;
  onDeleteBlock?: () => void;
}

export const BlockWrapper: FC<BlockWrapperProps> = ({
  children,
  onBlockClick,
  className,
  blockType,
  blockId,
  required = false,
  options = [],
  sortOrder = 'manual',
  onRequiredChange,
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
          <div>
            {/* Header */}
            <div className='flex items-center justify-between px-4 py-2 pt-3 pb-1'>
              <h3 className='text-sm font-semibold text-gray-900'>
                Question options
              </h3>
              <button
                onClick={handleClosePopover}
                className='flex h-[18px] w-[18px] flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-[rgba(55,53,47,0.06)] transition-[background] duration-[20ms] ease-in select-none hover:bg-[rgba(55,53,47,0.16)]'
              >
                <X className='h-3 w-3 text-gray-500' />
              </button>
            </div>

            {/* Menu Items */}
            <div className='p-2'>
              <div
                className='flex items-center justify-between rounded-sm px-2 py-1 hover:cursor-pointer hover:bg-gray-100'
                onClick={handleRequiredToggle}
              >
                <div className='flex items-center gap-3'>
                  <Asterisk className='h-4 w-4 text-gray-600' />
                  <span className='text-sm text-gray-900'>Required</span>
                </div>
                <Switch
                  checked={required}
                  onCheckedChange={onRequiredChange}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {hasOptionsSupport && (
                <div
                  className='flex items-center justify-between rounded-sm px-2 py-1 hover:cursor-pointer hover:bg-gray-100'
                  onClick={handleOptionsClick}
                >
                  <div className='flex items-center gap-3'>
                    <Database className='h-4 w-4 text-gray-600' />
                    <span className='text-sm text-gray-900'>Edit options</span>
                  </div>
                  <span className='text-xs text-gray-500'>
                    {options.length}
                  </span>
                </div>
              )}

              <div
                className='flex items-center justify-between rounded-sm px-2 py-1 hover:cursor-pointer hover:bg-red-50'
                onClick={handleDeleteClick}
              >
                <div className='flex items-center gap-3'>
                  <Trash2 className='h-4 w-4 text-red-600' />
                  <span className='text-sm text-red-600'>Delete question</span>
                </div>
              </div>
            </div>
          </div>
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
