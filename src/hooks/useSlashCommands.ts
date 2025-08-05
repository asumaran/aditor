import { useCommandIndicator } from './useCommandIndicator';

interface BlockType {
  id: string;
  label: string;
}

const AVAILABLE_BLOCKS: BlockType[] = [
  { id: 'text', label: 'Text' },
  { id: 'heading', label: 'Heading' },
  { id: 'short_answer', label: 'Short Answer' },
  { id: 'multiple_choice', label: 'Multiple Choice' },
  { id: 'multiselect', label: 'Multiselect' },
];

interface UseSlashCommandsProps {
  elementRef: React.RefObject<HTMLElement | null>;
  currentValue: string;
  onChange: (value: string) => void;
  blockType?: string;
  onCreateBlockAfter?: (options: {
    blockType: string;
    replaceCurrentBlock?: boolean;
  }) => void;
}

export const useSlashCommands = ({
  elementRef,
  currentValue,
  onChange,
  blockType = 'text',
  onCreateBlockAfter,
}: UseSlashCommandsProps) => {
  const {
    isOpen,
    query,
    filteredCommands: filteredBlocks,
    shouldShowCommandIndicator: shouldShowSlashIndicator,
    handleSelectCommand: handleSelectBlock,
    handleQueryChange,
    handleBlur,
    commandCommands: slashCommands,
    isCommandMode: isSlashInputMode,
    selectedIndex,
    originalContent,
    exitCommandMode,
  } = useCommandIndicator({
    elementRef,
    currentValue,
    onChange,
    commandSymbol: '/',
    availableCommands: AVAILABLE_BLOCKS,
    onCommandSelect: (command) => {
      const selectedType = command.id;

      /**
       * BLOCK TYPE SELECTION LOGIC
       *
       * We need to check if the block is empty by looking at the original content
       * that was stored before slash mode was activated, not the currentValue
       * which includes the slash command content.
       */
      const isBlockEmpty = originalContent.trim() === '';

      console.log('Block selection logic:', {
        blockType,
        selectedType,
        originalContent,
        currentValue,
        isBlockEmpty,
      });

      /**
       * SELECTION LOGIC CASES:
       *
       * 1. Empty text block + select "Text" → Just exit slash mode (stay in same block)
       * 2. Empty text block + select different type → Replace current block with new type
       * 3. Text block with content + select "Text" → Create new text block after current
       * 4. All other cases → Create new block after current
       */

      // Case 1: Empty text block selecting text - just exit slash mode
      if (blockType === 'text' && selectedType === 'text' && isBlockEmpty) {
        console.log(
          'Case 1: Empty text block selecting text - just exit slash mode',
        );
        // Exit slash mode without blur (stay in same element)
        exitCommandMode(false, false);
        return;
      }

      // Case 2: Text block with content selecting text - create new text block after
      if (blockType === 'text' && selectedType === 'text' && !isBlockEmpty) {
        console.log(
          'Case 2: Text block with content selecting text - create new text block after',
        );
        // Exit slash mode with blur (will create new block)
        exitCommandMode(false, true);
        onCreateBlockAfter?.({
          blockType: selectedType,
          replaceCurrentBlock: false,
        });
        return;
      }

      // Case 3: Empty text block selecting different type - replace current block
      if (blockType === 'text' && selectedType !== 'text' && isBlockEmpty) {
        console.log(
          'Case 3: Empty text block selecting different type - replace current block',
        );

        // Exit slash mode with blur (will create new block)
        exitCommandMode(false, true);
        // For all block types, create new block after current and replace
        onCreateBlockAfter?.({
          blockType: selectedType,
          replaceCurrentBlock: true,
        });
        return;
      }

      // Case 4: All other cases - create new block after current one
      console.log(
        'Case 4: All other cases - create new block after current one',
      );
      // Exit slash mode with blur (will create new block)
      exitCommandMode(false, true);
      onCreateBlockAfter?.({
        blockType: selectedType,
        replaceCurrentBlock: false,
      });
    },
  });

  return {
    isOpen,
    query,
    filteredBlocks,
    shouldShowSlashIndicator,
    handleSelectBlock,
    handleQueryChange,
    handleBlur,
    slashCommands,
    isSlashInputMode, // Keep for backward compatibility
    selectedIndex,
  };
};
