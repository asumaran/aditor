import { useCommandIndicator } from './useCommandIndicator';

interface BlockType {
  id: string;
  label: string;
}

const AVAILABLE_BLOCKS: BlockType[] = [
  { id: 'text', label: 'Text' },
  { id: 'heading', label: 'Heading' },
  { id: 'short-answer', label: 'Short Answer' },
  { id: 'multiple-choice', label: 'Multiple Choice' },
  { id: 'multiselect', label: 'Multiselect' },
];

interface UseSlashCommandsProps {
  elementRef: React.RefObject<HTMLElement | null>;
  currentValue: string;
  onChange: (value: string) => void;
}

export const useSlashCommands = ({
  elementRef,
  currentValue,
  onChange,
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
  } = useCommandIndicator({
    elementRef,
    currentValue,
    onChange,
    commandSymbol: '/',
    availableCommands: AVAILABLE_BLOCKS,
    onCommandSelect: (command) => {
      // TODO: Trigger block type change
      console.log('Block type selected:', command.id);
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
