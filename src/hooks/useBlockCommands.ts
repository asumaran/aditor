import { useCallback } from 'react';

interface BlockCommand {
  key: string;
  modifiers?: ('shift' | 'ctrl' | 'meta' | 'alt')[];
  condition?: () => boolean;
  handler: () => void;
}

interface UseBlockCommandsProps {
  commands: BlockCommand[];
}

export const useBlockCommands = ({ commands }: UseBlockCommandsProps) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      for (const command of commands) {
        // Check if key matches
        if (e.key !== command.key) continue;

        // Check modifiers
        const requiredModifiers = command.modifiers || [];
        const hasShift = requiredModifiers.includes('shift');
        const hasCtrl = requiredModifiers.includes('ctrl');
        const hasMeta = requiredModifiers.includes('meta');
        const hasAlt = requiredModifiers.includes('alt');

        if (
          e.shiftKey !== hasShift ||
          e.ctrlKey !== hasCtrl ||
          e.metaKey !== hasMeta ||
          e.altKey !== hasAlt
        ) {
          continue;
        }

        // Check condition if provided
        if (command.condition && !command.condition()) {
          continue;
        }

        // Execute command - only prevent default if modifiers don't include shift for Enter
        if (!(command.key === 'Enter' && e.shiftKey)) {
          e.preventDefault();
        }
        command.handler();
        return; // Stop after first matching command
      }
    },
    [commands],
  );

  return { handleKeyDown };
};
