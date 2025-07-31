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
  onCreateBlockAfter?: (type: string) => void;
  onChangeBlockType?: (type: string) => void;
}

export const useSlashCommands = ({
  elementRef,
  currentValue,
  onChange,
  blockType = 'text',
  onCreateBlockAfter,
  onChangeBlockType,
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
       * 2. Empty text block + select different type → Change current block type
       * 3. Any other block + select "Text" → Create new TextBlock after current
       * 4. Any block + select any type → Create new block after current
       */

      // Case 1: Empty text block selecting text - just exit slash mode
      if (blockType === 'text' && selectedType === 'text' && isBlockEmpty) {
        console.log(
          'Case 1: Empty text block selecting text - just exit slash mode',
        );
        return;
      }

      // Case 2: Empty text block selecting different type - change block type
      if (blockType === 'text' && selectedType !== 'text' && isBlockEmpty) {
        console.log(
          'Case 2: Empty text block selecting different type - change block type',
        );
        onChangeBlockType?.(selectedType);
        return;
      }

      // Case 3 & 4: All other cases - create new block after current one
      console.log('Case 3/4: Create new block after current one');
      onCreateBlockAfter?.(selectedType);
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
