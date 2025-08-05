import { type FC, useMemo, useCallback } from 'react';
import {
  useContentEditable,
  useBlockCommands,
  useBlockNavigation,
  useBlockCreation,
  useSlashCommands,
} from '@/hooks';
import type { Modifier } from '@/hooks/useBlockCommands';
import { useEditor } from '@/hooks';
import { SlashCommandDropdown } from '@/components/SlashCommandDropdown';
import { cn } from '@/lib/utils';
import { getPreviousBlockId } from '@/lib/editorUtils';
import type { BlockComponentProps } from '@/types';

interface HeadingBlockProps extends BlockComponentProps {
  value: string;
  onFieldChange: (fieldId: string, value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  cursorAtStart?: boolean;
  blockId?: number;
  onCreateBlockAfter?: (options?: {
    initialContent?: string;
    cursorAtStart?: boolean;
    blockType?: string;
    replaceCurrentBlock?: boolean;
  }) => number;
  onChangeBlockType?: (blockId: number, newType: string) => void;
  onDeleteBlock?: () => void;
  onMergeWithPrevious?: (currentContent: string) => void;
}

const metaModifier: Modifier[] = ['meta'];

export const HeadingBlock: FC<HeadingBlockProps> = ({
  value,
  onFieldChange,
  placeholder = 'Heading',
  className,
  blockId,
  onCreateBlockAfter,
  onDeleteBlock,
  onMergeWithPrevious,
}) => {
  const { state } = useEditor();
  const {
    elementRef,
    handleInput: baseHandleInput,
    handleCompositionStart,
    handleCompositionEnd,
    currentValue,
  } = useContentEditable({
    value,
    onChange: (newValue) => onFieldChange('title', newValue),
    blockId,
  });

  const hasPreviousBlock = useMemo(() => {
    if (!blockId) return false;
    const previousBlockId = getPreviousBlockId(state, blockId);
    return !!previousBlockId;
  }, [state, blockId]);

  /**
   * HOOK ORDER CRITICAL SECTION
   *
   * useSlashCommands MUST be called before useBlockCreation and useBlockNavigation because:
   * - useBlockCreation needs the isSlashInputMode value to prevent block deletion
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
    onChange: (newValue) => onFieldChange('title', newValue),
    blockType: 'heading',
    onCreateBlockAfter: (options: {
      blockType: string;
      replaceCurrentBlock?: boolean;
    }) => {
      if (onCreateBlockAfter) {
        // Pass through the replacement decision from useSlashCommands
        onCreateBlockAfter({
          blockType: options.blockType,
          replaceCurrentBlock: options.replaceCurrentBlock,
        });
      }
    },
  });

  // Create updated handleInput with slash mode awareness
  const handleInput = useCallback(
    (event: React.FormEvent<HTMLDivElement>) => {
      const target = event.target as HTMLDivElement;

      // Check for and clean up any leftover background spans (from slash commands)
      // Only clean up when NOT in slash mode to avoid interfering with active slash commands
      if (!isSlashInputMode) {
        const backgroundSpans = target.querySelectorAll(
          'span[style*="background"]',
        );
        if (backgroundSpans.length > 0) {
          // Get the text content before cleaning
          const textContent = target.textContent || '';
          // Clear all HTML and set plain text
          target.innerHTML = '';
          target.textContent = textContent;
        }
      }

      // Call the base handler
      baseHandleInput(event);
    },
    [baseHandleInput, isSlashInputMode],
  );

  const { splitAndCreateBlock, isCursorAtStart, handleBackspace } =
    useBlockCreation({
      onCreateBlockAfter,
      onChange: (newValue) => onFieldChange('title', newValue),
      onMergeWithPrevious,
      onDeleteBlock,
      hasPreviousBlock,
      isInSlashMode: isSlashInputMode, // Pass slash mode state to prevent block deletion
    });

  const { navigationCommands } = useBlockNavigation({
    blockId,
    elementRef,
    isSlashInputMode, // This value comes from useSlashCommands above
  });

  const commands = useMemo(
    () => [
      // Slash commands have highest priority (must come first)
      ...slashCommands,
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
          // Headings don't support line breaks - split content and create new TextBlock
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
          return elementRef.current
            ? isCursorAtStart(elementRef.current)
            : false;
        },
        handler: () => {
          if (elementRef.current) {
            handleBackspace(elementRef.current, currentValue);
          }
        },
      },
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
      <div className='mt-8 mb-1 w-full'>
        <h2
          ref={elementRef as React.RefObject<HTMLHeadingElement>}
          contentEditable
          suppressContentEditableWarning
          role='textbox'
          onInput={handleInput}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onKeyDown={handleKeyDown}
          onBlur={handleSlashBlur}
          data-block-id={blockId}
          className={cn(
            'm-0 w-full max-w-full px-[2px] pt-[3px] pb-[3px] text-3xl leading-[1.3] font-semibold break-words whitespace-break-spaces',
            'focus:outline-none',
            !currentValue && !isSlashInputMode && 'text-gray-400',
            !currentValue &&
              !isSlashInputMode &&
              'after:content-[attr(data-placeholder)]',
            className,
          )}
          data-placeholder={placeholder}
        />
      </div>
    );
  };

  return (
    <>
      {renderContent()}
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
