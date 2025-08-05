import { useCommandIndicator } from './useCommandIndicator';
import { AVAILABLE_BLOCKS } from '@/config/blocks';

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
       *
       * NOTE: This logic matches the shared logic in handleSmartBlockCreation
       * but is kept here for slash command specific behavior (like focus handling)
       */
      const isBlockEmpty = originalContent.trim() === '';

      /**
       * SELECTION LOGIC CASES (shared with sidebar buttons):
       *
       * 1. Empty text block + select "Text" → Just exit slash mode (stay in same block)
       * 2. Empty text block + select different type → Replace current block with new type
       * 3. Text block with content + select "Text" → Create new text block after current
       * 4. All other cases → Create new block after current
       */

      // Case 1: Empty text block selecting text - just exit slash mode
      if (blockType === 'text' && selectedType === 'text' && isBlockEmpty) {
        // Exit slash mode without blur (stay in same element)
        exitCommandMode(false, false);
        return;
      }

      // Case 1b: Empty text block selecting different block type - replace current block
      if (blockType === 'text' && selectedType !== 'text' && isBlockEmpty) {
        // Exit slash mode with blur (will create new block)
        exitCommandMode(false, true);
        // Different block types replace empty text blocks
        onCreateBlockAfter?.({
          blockType: selectedType,
          replaceCurrentBlock: true,
        });
        return;
      }

      // Case 3: Text block with content selecting text - create new text block after
      if (blockType === 'text' && selectedType === 'text' && !isBlockEmpty) {
        // Exit slash mode with blur (will create new block)
        exitCommandMode(false, true);
        onCreateBlockAfter?.({
          blockType: selectedType,
          replaceCurrentBlock: false,
        });
        return;
      }

      // Case 4: All other cases - create new block after current one
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
