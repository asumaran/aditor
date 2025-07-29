import { type FC, useMemo } from 'react';
import {
  useContentEditable,
  useBlockCommands,
  useBlockCreation,
  useBlockNavigation,
  useSlashCommands,
} from '@/hooks';
import type { Modifier } from '@/hooks/useBlockCommands';
import { useEditor } from '@/hooks';
import { SlashCommandDropdown } from '@/components/SlashCommandDropdown';
import { cn } from '@/lib/utils';
import { getPreviousBlockId } from '@/lib/editorUtils';
import type { BlockComponentProps } from '@/types';

interface TextBlockProps extends BlockComponentProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  cursorAtStart?: boolean;
  onCreateBlockAfter?: (options?: {
    initialContent?: string;
    cursorAtStart?: boolean;
  }) => number;
  onDeleteBlock?: () => void;
  onMergeWithPrevious?: (currentContent: string) => void;
  blockId?: number;
}

const metaModifier: Modifier[] = ['meta'];

export const TextBlock: FC<TextBlockProps> = ({
  value,
  onChange,
  placeholder = "Write, enter '/' for commands…",
  className,
  autoFocus = false,
  cursorAtStart = false,
  onCreateBlockAfter,
  onDeleteBlock,
  onMergeWithPrevious,
  blockId,
}) => {
  const { state } = useEditor();
  const {
    elementRef,
    handleInput,
    handleCompositionStart,
    handleCompositionEnd,
    currentValue,
  } = useContentEditable({
    value,
    onChange,
    autoFocus,
    cursorAtStart,
    blockId,
  });

  const hasPreviousBlock = useMemo(() => {
    if (!blockId) return false;
    const previousBlockId = getPreviousBlockId(state, blockId);
    return !!previousBlockId;
  }, [state, blockId]);

  const { splitAndCreateBlock, isCursorAtStart, handleBackspace } =
    useBlockCreation({
      onCreateBlockAfter,
      onChange,
      onMergeWithPrevious,
      onDeleteBlock,
      hasPreviousBlock,
    });

  /**
   * HOOK ORDER CRITICAL SECTION
   * 
   * useSlashCommands MUST be called before useBlockNavigation because:
   * - useBlockNavigation needs the isSlashInputMode value from useSlashCommands
   * - React hooks must maintain consistent order between renders
   * - Wrong order causes "Cannot access before initialization" errors
   */
  const {
    isOpen,
    filteredBlocks,
    handleSelectBlock,
    handleBlur: handleSlashBlur,
    slashCommands,
    isSlashInputMode,
    selectedIndex,
  } = useSlashCommands({
    elementRef,
    currentValue,
    onChange,
  });

  const { navigationCommands } = useBlockNavigation({
    blockId,
    elementRef,
    isSlashInputMode, // This value comes from useSlashCommands above
  });

  const commands = useMemo(
    () => [
      {
        key: 'Enter',
        /**
         * ENTER KEY CONFLICT PREVENTION
         * 
         * Prevents block's Enter command from executing when slash dropdown is open.
         * Without this condition, pressing Enter to select a slash command would ALSO
         * create a new block, causing unwanted block creation.
         * 
         * The slash command's Enter handler has higher priority in the command array
         * and will handle Enter when dropdown is open. This condition ensures the
         * block's Enter only runs when appropriate.
         */
        condition: () => !isOpen, // Only handle Enter when slash menu is not open
        handler: () => {
          // Enter: Split content and create new TextBlock
          if (elementRef.current) {
            splitAndCreateBlock(elementRef.current);
          }
        },
      },
      {
        key: 'Backspace',
        condition: () => {
          // Handle two cases:
          // 1. Empty block (delete block)
          // 2. Cursor at start (merge with previous)
          return (
            !currentValue.trim() ||
            (elementRef.current ? isCursorAtStart(elementRef.current) : false)
          );
        },
        handler: () => {
          if (elementRef.current) {
            handleBackspace(elementRef.current, currentValue);
          }
        },
      },
      {
        key: 'Backspace',
        modifiers: metaModifier, // Cmd+Backspace on Mac
        condition: () => {
          // Only handle when cursor is at the very start of the block
          return elementRef.current ? isCursorAtStart(elementRef.current) : false;
        },
        handler: () => {
          if (elementRef.current) {
            handleBackspace(elementRef.current, currentValue);
          }
        },
      },
      ...slashCommands,
      ...navigationCommands,
    ],
    [
      currentValue,
      splitAndCreateBlock,
      isCursorAtStart,
      handleBackspace,
      navigationCommands,
      slashCommands,
      elementRef,
      isOpen,
    ],
  );

  const { handleKeyDown } = useBlockCommands({ commands });

  const renderContent = () => {
    return (
      <div
        ref={elementRef as React.RefObject<HTMLDivElement>}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleKeyDown}
        onBlur={handleSlashBlur}
        data-block-id={blockId}
        className={cn(
          'w-full max-w-full px-[2px] pt-[3px] pb-[3px] break-words whitespace-break-spaces caret-[#322f2c]',
          'focus:outline-none',
          'min-h-[1.5em]',
          !currentValue && !isSlashInputMode && 'text-gray-400',
          !currentValue &&
            !isSlashInputMode &&
            'focus:after:content-[attr(data-placeholder)]',
          className,
        )}
        data-placeholder={placeholder}
      />
    );
  };

  return (
    <>
      <div className='mt-[2px] mb-[1px] w-full max-w-[1285px]'>
        {renderContent()}
      </div>
      <SlashCommandDropdown
        isOpen={isOpen}
        filteredBlocks={filteredBlocks}
        onSelect={handleSelectBlock}
        targetRef={elementRef}
        selectedIndex={selectedIndex}
      />
    </>
  );
};
