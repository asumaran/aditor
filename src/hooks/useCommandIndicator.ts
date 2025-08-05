import { useState, useCallback, useEffect, useMemo, useRef } from 'react';

interface CommandType {
  id: string;
  label: string;
  description?: string;
}

interface UseCommandIndicatorProps {
  elementRef: React.RefObject<HTMLElement | null>;
  currentValue: string;
  onChange: (value: string) => void;
  commandSymbol: string;
  availableCommands: CommandType[];
  onCommandSelect?: (command: CommandType) => void;
}

export const useCommandIndicator = ({
  elementRef,
  onChange,
  commandSymbol,
  availableCommands,
  onCommandSelect,
}: UseCommandIndicatorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isCommandMode, setIsCommandMode] = useState(false);
  const [originalContent, setOriginalContent] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reference to the command indicator span
  const indicatorRef = useRef<HTMLSpanElement | null>(null);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query) return availableCommands;

    return availableCommands.filter((command) =>
      command.label.toLowerCase().includes(query.toLowerCase()),
    );
  }, [query, availableCommands]);

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  // Exit command mode
  const exitCommandMode = useCallback(
    (keepCommandContent: boolean = false, shouldBlur: boolean = false) => {
      if (!elementRef.current || !indicatorRef.current) {
        setIsOpen(false);
        setQuery('');
        setIsCommandMode(false);
        setOriginalContent('');
        return;
      }

      if (keepCommandContent) {
        // Check if we only have the slash with no query
        if (query === '') {
          // Just the slash - restore original content
          elementRef.current.textContent = originalContent;

          // Dispatch input event to trigger useContentEditable's handler
          const inputEvent = new Event('input', { bubbles: true });
          elementRef.current.dispatchEvent(inputEvent);

          onChange(originalContent);
        } else {
          /**
           * CONTENT CONCATENATION ORDER
           *
           * When slash command mode exits with text (no command selected), we preserve
           * the typed text as regular content in the block.
           *
           * Order: commandText + originalContent
           * - commandText: The slash and typed query (e.g., "/hello")
           * - originalContent: Text that was in block before slash (e.g., "foo")
           *
           * Example scenarios:
           * - Empty block + "/hello" → "/hello"
           * - "foo" at start + "/hello" → "/hellofoo"
           * - Slash commands only trigger at cursor position 0, so command always comes first
           */
          const commandText = indicatorRef.current.textContent || '';
          const finalContent = commandText + originalContent;

          // Replace entire content
          elementRef.current.textContent = finalContent;

          /**
           * CURSOR POSITIONING FIX
           *
           * When exiting slash command mode, we need to position the cursor at the end
           * of the command text to make continued typing feel natural.
           *
           * Problem: Without this, cursor ends up in wrong position causing text like
           * "/foobar" to appear as "r/fooba" when user continues typing.
           *
           * Solution: Position cursor at end of command text (not at end of entire content)
           * since user was typing the command and expects to continue from there.
           *
           * Example: "foo" + "/hello" → "/hellofoo" with cursor after "/hello"
           */
          const selection = window.getSelection();
          if (selection && elementRef.current) {
            const range = document.createRange();
            // Cursor should be positioned at the end of the command text
            const cursorPosition = commandText.length;

            // Set cursor at the end of the inserted text
            if (elementRef.current.firstChild) {
              range.setStart(elementRef.current.firstChild, cursorPosition);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }

          onChange(finalContent);
        }
      } else {
        elementRef.current.innerHTML = ''; // Clear all HTML including spans
        elementRef.current.textContent = originalContent; // Set plain text

        // Dispatch input event to trigger useContentEditable's handler
        const inputEvent = new Event('input', { bubbles: true });
        elementRef.current.dispatchEvent(inputEvent);

        // Also call onChange to ensure state is updated
        onChange(originalContent);
      }

      // Clean up - remove the indicator span from DOM (redundant but safe)
      if (indicatorRef.current && indicatorRef.current.parentNode) {
        indicatorRef.current.parentNode.removeChild(indicatorRef.current);
      }
      indicatorRef.current = null;
      setIsOpen(false);
      setQuery('');
      setIsCommandMode(false);
      setOriginalContent('');
      setSelectedIndex(0);

      // Only blur if requested (when creating new blocks)
      if (shouldBlur && elementRef.current) {
        elementRef.current.blur();
      }
    },
    [elementRef, indicatorRef, query, originalContent, onChange],
  );

  /**
   * AUTO-EXIT FUNCTIONALITY
   *
   * Automatically exits slash command mode when user types text that doesn't match any commands.
   * This prevents the slash mode from staying active indefinitely when typing non-command text.
   *
   * Logic:
   * - Only triggers when in command mode AND query is 5+ characters AND no commands match
   * - 5 character threshold allows short commands like "text" (4 chars) to still work
   * - Uses setTimeout(0) to avoid React state update conflicts during render
   * - Calls exitCommandMode(true) to preserve the typed text as regular block content
   *
   * Example: typing "/foobar" will auto-exit at the 5th character since no commands match
   */
  useEffect(() => {
    if (isCommandMode && query.length >= 5 && filteredCommands.length === 0) {
      setTimeout(() => {
        exitCommandMode(true); // Keep the command text as regular text
      }, 0);
    }
  }, [filteredCommands, query, isCommandMode, exitCommandMode]);

  // Handle command selection
  const handleSelectCommand = useCallback(
    (command: CommandType) => {
      // Notify parent first - they will decide how to exit
      onCommandSelect?.(command);
    },
    [onCommandSelect],
  );

  // Handle navigation with arrow keys
  const handleArrowDown = useCallback(() => {
    setSelectedIndex((prev) => {
      const newIndex = prev < filteredCommands.length - 1 ? prev + 1 : prev;
      return newIndex;
    });
  }, [filteredCommands]);

  const handleArrowUp = useCallback(() => {
    setSelectedIndex((prev) => {
      const newIndex = prev > 0 ? prev - 1 : prev;
      return newIndex;
    });
  }, []);

  // Handle Enter key to select current item
  const handleEnterKey = useCallback(() => {
    if (filteredCommands.length > 0 && selectedIndex >= 0) {
      handleSelectCommand(filteredCommands[selectedIndex]);
    }
  }, [filteredCommands, selectedIndex, handleSelectCommand]);

  // Handle query changes from the CommandIndicator (kept for compatibility)
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  // Create command indicator preserving existing content
  const createCommandIndicator = useCallback(() => {
    if (!elementRef.current) return;

    // Get the current text content (not HTML) to preserve
    const existingTextContent = elementRef.current.textContent || '';

    // Create indicator HTML exactly like Notion: symbol inside inner span, with placeholder support
    const indicatorHTML = `<span class="notion-temporary-input pseudoAfter pseudoAfterWhenComposing" style="background:rgba(84, 72, 49, 0.08);border-radius:0.5px;outline:5.5px solid rgba(84, 72, 49, 0.08);--pseudoAfter--content:&quot;Filter…&quot;;--pseudoAfter--color:rgba(70, 68, 64, 0.45);--pseudoAfterWhenComposing--display:none"><span style="color:inherit">${commandSymbol}</span></span>`;

    // Insert indicator at the beginning, followed by existing text as plain text
    if (existingTextContent) {
      elementRef.current.innerHTML = indicatorHTML + existingTextContent;
    } else {
      elementRef.current.innerHTML = indicatorHTML;
    }

    // Find the span we just created
    const indicator = elementRef.current.querySelector(
      '.notion-temporary-input',
    ) as HTMLSpanElement;
    if (indicator) {
      indicatorRef.current = indicator;

      // Show placeholder initially (since we start with no query)
      indicator.classList.add('show-placeholder');

      // Place cursor INSIDE the indicator span, after the symbol (like Notion)
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.setStart(indicator, 1); // After the inner span with symbol
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, [elementRef, commandSymbol]);

  // Listen for typing in command mode
  useEffect(() => {
    const element = elementRef.current;
    if (!isCommandMode || !element) return;

    // Add MutationObserver to detect unwanted spans being created
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check for spans that might have been added after we cleaned up
          const spans = element.querySelectorAll('span[style*="background"]');
          spans.forEach((span) => {
            if (!isCommandMode) {
              span.remove();
            }
          });
        }
      });
    });

    observer.observe(element, {
      childList: true,
      subtree: true,
    });

    // Handle keydown for special cases like Backspace on empty query
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' && indicatorRef.current) {
        const indicatorText = indicatorRef.current.textContent || '';

        // Handle Cmd+Backspace (or Ctrl+Backspace on Windows)
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          exitCommandMode(false);
          return;
        }

        // If we only have the slash, allow user to delete it manually
        // Don't auto-exit here - let the user decide by pressing backspace again
        if (indicatorText === commandSymbol) {
          // Don't preventDefault or exitCommandMode here
          // Let the normal backspace behavior handle deleting the slash
        }
      }
    };

    const handleInput = () => {
      if (!indicatorRef.current || !element) return;

      // Get query text from inside the indicator span (like Notion)
      const indicatorText = indicatorRef.current.textContent || '';
      const symbolLength = commandSymbol.length;

      // Check if the slash itself was deleted or indicator is empty
      if (!indicatorText.startsWith(commandSymbol) || indicatorText === '') {
        // Clean DOM completely by clearing innerHTML and setting textContent
        // This removes all spans and styling, leaving only plain text
        element.innerHTML = ''; // Clear all HTML first
        element.textContent = originalContent; // Set plain text content

        // Reset indicator ref
        indicatorRef.current = null;

        // Exit command mode without keeping command content
        setIsOpen(false);
        setQuery('');
        setIsCommandMode(false);
        setOriginalContent('');
        setSelectedIndex(0);

        // Dispatch input event to synchronize with useContentEditable
        const inputEvent = new Event('input', { bubbles: true });
        element.dispatchEvent(inputEvent);

        return;
      }

      // Extract just the query part (everything after the symbol inside the indicator)
      const query = indicatorText.substring(symbolLength);

      // Control placeholder visibility
      if (query.length > 0) {
        // Hide placeholder when there's a query
        indicatorRef.current.classList.remove('show-placeholder');
      } else {
        // Show placeholder when there's no query (only the symbol)
        indicatorRef.current.classList.add('show-placeholder');
      }

      setQuery(query);
    };

    element.addEventListener('input', handleInput);
    element.addEventListener('keydown', handleKeyDown);

    return () => {
      observer.disconnect();
      element.removeEventListener('input', handleInput);
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isCommandMode,
    originalContent,
    elementRef,
    commandSymbol,
    exitCommandMode,
  ]);

  // Handle command key press
  const handleCommandKey = useCallback(() => {
    if (!elementRef.current) return false;

    const selection = window.getSelection();
    if (!selection?.rangeCount) return false;

    const range = selection.getRangeAt(0);

    // Check if cursor is at start of block
    const preRange = document.createRange();
    preRange.selectNodeContents(elementRef.current);
    preRange.setEnd(range.startContainer, range.startOffset);
    const cursorPosition = preRange.toString().length;

    if (cursorPosition === 0) {
      // Store current content as TEXT only (not HTML) and enter command mode
      setOriginalContent(elementRef.current.textContent || '');
      setIsOpen(true);
      setQuery('');
      setIsCommandMode(true);

      // Create the visual indicator immediately
      createCommandIndicator();

      return true;
    }

    return false;
  }, [elementRef, createCommandIndicator]);

  // Commands for behavior
  const commandCommands = useMemo(
    () => [
      {
        key: commandSymbol,
        ignoreModifiers: true,
        condition: () => {
          if (!elementRef.current) return false;
          const selection = window.getSelection();
          if (!selection?.rangeCount) return false;

          const range = selection.getRangeAt(0);
          const preRange = document.createRange();
          preRange.selectNodeContents(elementRef.current);
          preRange.setEnd(range.startContainer, range.startOffset);
          const cursorPosition = preRange.toString().length;

          return cursorPosition === 0;
        },
        handler: (e?: React.KeyboardEvent) => {
          e?.preventDefault();
          handleCommandKey();
        },
      },
      {
        key: 'Escape',
        condition: () => isOpen,
        handler: () => {
          exitCommandMode(true); // Keep command text when pressing Escape
        },
      },
      {
        key: 'Backspace',
        ignoreModifiers: true,
        condition: () => {
          return isCommandMode && query === '';
        },
        handler: (e?: React.KeyboardEvent) => {
          e?.preventDefault(); // Prevent default backspace behavior
          exitCommandMode(false);
        },
      },
      {
        key: 'ArrowDown',
        ignoreModifiers: true,
        commandType: 'SLASH_ARROW_DOWN', // Debug identifier
        condition: () => {
          return isOpen;
        },
        handler: (e?: React.KeyboardEvent) => {
          e?.preventDefault(); // Prevent cursor movement
          handleArrowDown();
        },
      },
      {
        key: 'ArrowUp',
        ignoreModifiers: true,
        commandType: 'SLASH_ARROW_UP', // Debug identifier
        condition: () => {
          return isOpen;
        },
        handler: (e?: React.KeyboardEvent) => {
          e?.preventDefault(); // Prevent cursor movement
          handleArrowUp();
        },
      },
      {
        key: 'Enter',
        condition: () => isOpen,
        handler: (e?: React.KeyboardEvent) => {
          e?.preventDefault();
          handleEnterKey();
        },
      },
    ],
    [
      isOpen,
      isCommandMode,
      query,
      handleCommandKey,
      elementRef,
      exitCommandMode,
      commandSymbol,
      handleArrowDown,
      handleArrowUp,
      handleEnterKey,
    ],
  );

  // Handle blur - convert command to text
  const handleBlur = useCallback(() => {
    if (isCommandMode) {
      setTimeout(() => {
        if (isOpen) {
          exitCommandMode(true); // Keep the command text when blurring
        }
      }, 200);
    }
  }, [isCommandMode, isOpen, exitCommandMode]);

  return {
    isOpen,
    query,
    filteredCommands,
    shouldShowCommandIndicator: false, // Always false - we handle it via DOM
    handleSelectCommand,
    handleQueryChange,
    handleBlur,
    commandCommands,
    isCommandMode,
    selectedIndex,
    originalContent, // Expose original content for decision making
    exitCommandMode, // Expose for manual exit control
  };
};
