import { useCallback } from 'react';

export type Modifier = 'shift' | 'ctrl' | 'meta' | 'alt';

interface BlockCommand {
  key: string;
  modifiers?: Modifier[];
  ignoreModifiers?: boolean;
  condition?: () => boolean;
  handler: (e?: React.KeyboardEvent | undefined) => void;
  commandType?: string; // Add commandType as optional property for debugging
}

interface UseBlockCommandsProps {
  commands: BlockCommand[];
}

export const useBlockCommands = ({ commands }: UseBlockCommandsProps) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      console.log('Key pressed:', e.key); // Debug

      for (const command of commands) {
        // Check if key matches
        if (e.key !== command.key) continue;

        console.log('Found matching command for key:', e.key); // Debug

        // Skip modifier check if ignoreModifiers is true
        if (!command.ignoreModifiers) {
          // Check modifiers
          const requiredModifiers: Modifier[] = command.modifiers || [];
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
            console.log('Modifiers do not match'); // Debug
            continue;
          }
        }

        // Check condition if provided
        if (command.condition && !command.condition()) {
          console.log('Condition failed for key:', command.key); // Debug
          continue;
        } else if (command.condition) {
          console.log('Condition passed for key:', command.key); // Debug
        }

        console.log(
          'Executing command for key:',
          e.key,
          'from command type:',
          command.key,
          'commandType:',
          command.commandType || 'unknown',
        ); // Debug

        // Execute command - only prevent default if modifiers don't include shift for Enter
        if (!(command.key === 'Enter' && e.shiftKey)) {
          e.preventDefault();
        }
        command.handler(e);
        return; // Stop after first matching command
      }
    },
    [commands],
  );

  return { handleKeyDown };
};
