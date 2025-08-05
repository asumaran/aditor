/**
 * useSlashCommands Hook Tests
 *
 * Tests the slash command logic for different block types and scenarios.
 * Covers the new implementation that handles:
 * 1. Empty text block + select "Text" → Exit slash mode (no change)
 * 2. Text block with content + select "Text" → Create new text block after
 * 3. Empty text block + select different type → Replace current block
 * 4. Heading block + select "Text/Heading" → Create after (never replace)
 * 5. All other cases → Create new block after current
 */

import { useSlashCommands } from '../src/hooks/useSlashCommands';
import { createRef } from 'react';
import { renderHook, act } from '@testing-library/react';

// Mock useCommandIndicator
jest.mock('../src/hooks/useCommandIndicator', () => ({
  useCommandIndicator: jest.fn(),
}));

import { useCommandIndicator } from '../src/hooks/useCommandIndicator';
const mockUseCommandIndicator = useCommandIndicator as jest.MockedFunction<
  typeof useCommandIndicator
>;

describe('useSlashCommands', () => {
  let mockElementRef: React.RefObject<HTMLElement>;
  let mockOnChange: jest.Mock;
  let mockOnCreateBlockAfter: jest.Mock;
  let mockExitCommandMode: jest.Mock;

  beforeEach(() => {
    mockElementRef = createRef<HTMLElement>();
    mockOnChange = jest.fn();
    mockOnCreateBlockAfter = jest.fn();
    mockExitCommandMode = jest.fn();

    // Setup default mock return for useCommandIndicator
    mockUseCommandIndicator.mockReturnValue({
      isOpen: false,
      query: '',
      filteredCommands: [],
      shouldShowCommandIndicator: false,
      handleSelectCommand: jest.fn(),
      handleQueryChange: jest.fn(),
      handleBlur: jest.fn(),
      commandCommands: [],
      isCommandMode: false,
      selectedIndex: 0,
      originalContent: '',
      exitCommandMode: mockExitCommandMode,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Case 1: Empty text block selecting "Text"', () => {
    it('should exit slash mode without creating new block', () => {
      const mockOnCommandSelect = jest.fn();

      // Setup the onCommandSelect callback to trigger our logic
      mockUseCommandIndicator.mockImplementation(({ onCommandSelect }) => {
        mockOnCommandSelect.mockImplementation((command) => {
          if (onCommandSelect) {
            onCommandSelect(command);
          }
        });

        return {
          isOpen: true,
          query: '',
          filteredCommands: [{ id: 'text', label: 'Text' }],
          shouldShowCommandIndicator: false,
          handleSelectCommand: mockOnCommandSelect,
          handleQueryChange: jest.fn(),
          handleBlur: jest.fn(),
          commandCommands: [],
          isCommandMode: true,
          selectedIndex: 0,
          originalContent: '', // Empty original content
          exitCommandMode: mockExitCommandMode,
        };
      });

      // Render the hook with empty text block
      renderHook(() =>
        useSlashCommands({
          elementRef: mockElementRef,
          currentValue: '', // Empty current value
          onChange: mockOnChange,
          blockType: 'text',
          onCreateBlockAfter: mockOnCreateBlockAfter,
        }),
      );

      // Simulate selecting "Text" command
      act(() => {
        mockOnCommandSelect({ id: 'text', label: 'Text' });
      });

      // Should exit command mode without blur (stay in same element)
      expect(mockExitCommandMode).toHaveBeenCalledWith(false, false);
      // Should NOT create a new block
      expect(mockOnCreateBlockAfter).not.toHaveBeenCalled();
    });
  });

  describe('Case 2: Text block with content selecting "Text"', () => {
    it('should create new text block after current', () => {
      const mockOnCommandSelect = jest.fn();

      mockUseCommandIndicator.mockImplementation(({ onCommandSelect }) => {
        mockOnCommandSelect.mockImplementation((command) => {
          if (onCommandSelect) {
            onCommandSelect(command);
          }
        });

        return {
          isOpen: true,
          query: '',
          filteredCommands: [{ id: 'text', label: 'Text' }],
          shouldShowCommandIndicator: false,
          handleSelectCommand: mockOnCommandSelect,
          handleQueryChange: jest.fn(),
          handleBlur: jest.fn(),
          commandCommands: [],
          isCommandMode: true,
          selectedIndex: 0,
          originalContent: 'Some content', // Has content
          exitCommandMode: mockExitCommandMode,
        };
      });

      renderHook(() =>
        useSlashCommands({
          elementRef: mockElementRef,
          currentValue: 'Some content', // Has content
          onChange: mockOnChange,
          blockType: 'text',
          onCreateBlockAfter: mockOnCreateBlockAfter,
        }),
      );

      // Simulate selecting "Text" command
      act(() => {
        mockOnCommandSelect({ id: 'text', label: 'Text' });
      });

      // Should exit command mode with blur (will create new block)
      expect(mockExitCommandMode).toHaveBeenCalledWith(false, true);
      // Should create new text block after current
      expect(mockOnCreateBlockAfter).toHaveBeenCalledWith({
        blockType: 'text',
        replaceCurrentBlock: false,
      });
    });
  });

  describe('Case 3: Empty text block selecting different type', () => {
    it('should replace current block with new type', () => {
      const mockOnCommandSelect = jest.fn();

      mockUseCommandIndicator.mockImplementation(({ onCommandSelect }) => {
        mockOnCommandSelect.mockImplementation((command) => {
          if (onCommandSelect) {
            onCommandSelect(command);
          }
        });

        return {
          isOpen: true,
          query: '',
          filteredCommands: [{ id: 'heading', label: 'Heading' }],
          shouldShowCommandIndicator: false,
          handleSelectCommand: mockOnCommandSelect,
          handleQueryChange: jest.fn(),
          handleBlur: jest.fn(),
          commandCommands: [],
          isCommandMode: true,
          selectedIndex: 0,
          originalContent: '', // Empty content
          exitCommandMode: mockExitCommandMode,
        };
      });

      renderHook(() =>
        useSlashCommands({
          elementRef: mockElementRef,
          currentValue: '', // Empty
          onChange: mockOnChange,
          blockType: 'text',
          onCreateBlockAfter: mockOnCreateBlockAfter,
        }),
      );

      // Simulate selecting "Heading" command
      act(() => {
        mockOnCommandSelect({ id: 'heading', label: 'Heading' });
      });

      // Should exit command mode with blur (will create new block)
      expect(mockExitCommandMode).toHaveBeenCalledWith(false, true);
      // Should replace current block
      expect(mockOnCreateBlockAfter).toHaveBeenCalledWith({
        blockType: 'heading',
        replaceCurrentBlock: true,
      });
    });
  });

  describe('Case 4: Heading block selecting text', () => {
    it('should create text block after heading (never replace)', () => {
      const mockOnCommandSelect = jest.fn();

      mockUseCommandIndicator.mockImplementation(({ onCommandSelect }) => {
        mockOnCommandSelect.mockImplementation((command) => {
          if (onCommandSelect) {
            onCommandSelect(command);
          }
        });

        return {
          isOpen: true,
          query: '',
          filteredCommands: [{ id: 'text', label: 'Text' }],
          shouldShowCommandIndicator: false,
          handleSelectCommand: mockOnCommandSelect,
          handleQueryChange: jest.fn(),
          handleBlur: jest.fn(),
          commandCommands: [],
          isCommandMode: true,
          selectedIndex: 0,
          originalContent: 'Heading content',
          exitCommandMode: mockExitCommandMode,
        };
      });

      renderHook(() =>
        useSlashCommands({
          elementRef: mockElementRef,
          currentValue: 'Heading content',
          onChange: mockOnChange,
          blockType: 'heading',
          onCreateBlockAfter: mockOnCreateBlockAfter,
        }),
      );

      // Simulate selecting "Text" command
      act(() => {
        mockOnCommandSelect({ id: 'text', label: 'Text' });
      });

      // Should exit command mode with blur (will create new block)
      expect(mockExitCommandMode).toHaveBeenCalledWith(false, true);
      // Should create after (not replace)
      expect(mockOnCreateBlockAfter).toHaveBeenCalledWith({
        blockType: 'text',
        replaceCurrentBlock: false,
      });
    });
  });

  describe('Case 4b: Empty heading block selecting different type', () => {
    it('should create new block after heading (never replace empty heading)', () => {
      const mockOnCommandSelect = jest.fn();

      mockUseCommandIndicator.mockImplementation(({ onCommandSelect }) => {
        mockOnCommandSelect.mockImplementation((command) => {
          if (onCommandSelect) {
            onCommandSelect(command);
          }
        });

        return {
          isOpen: true,
          query: '',
          filteredCommands: [{ id: 'text', label: 'Text' }],
          shouldShowCommandIndicator: false,
          handleSelectCommand: mockOnCommandSelect,
          handleQueryChange: jest.fn(),
          handleBlur: jest.fn(),
          commandCommands: [],
          isCommandMode: true,
          selectedIndex: 0,
          originalContent: '', // Empty heading
          exitCommandMode: mockExitCommandMode,
        };
      });

      renderHook(() =>
        useSlashCommands({
          elementRef: mockElementRef,
          currentValue: '', // Empty
          onChange: mockOnChange,
          blockType: 'heading',
          onCreateBlockAfter: mockOnCreateBlockAfter,
        }),
      );

      // Simulate selecting "Text" command
      act(() => {
        mockOnCommandSelect({ id: 'text', label: 'Text' });
      });

      // Should exit command mode with blur (will create new block)
      expect(mockExitCommandMode).toHaveBeenCalledWith(false, true);
      // Should create after (never replace empty heading)
      expect(mockOnCreateBlockAfter).toHaveBeenCalledWith({
        blockType: 'text',
        replaceCurrentBlock: false,
      });
    });
  });

  describe('Case 5: All other cases', () => {
    it('should create new block after current for form blocks', () => {
      const mockOnCommandSelect = jest.fn();

      mockUseCommandIndicator.mockImplementation(({ onCommandSelect }) => {
        mockOnCommandSelect.mockImplementation((command) => {
          if (onCommandSelect) {
            onCommandSelect(command);
          }
        });

        return {
          isOpen: true,
          query: '',
          filteredCommands: [{ id: 'short_answer', label: 'Short Answer' }],
          shouldShowCommandIndicator: false,
          handleSelectCommand: mockOnCommandSelect,
          handleQueryChange: jest.fn(),
          handleBlur: jest.fn(),
          commandCommands: [],
          isCommandMode: true,
          selectedIndex: 0,
          originalContent: 'Some content',
          exitCommandMode: mockExitCommandMode,
        };
      });

      renderHook(() =>
        useSlashCommands({
          elementRef: mockElementRef,
          currentValue: 'Some content',
          onChange: mockOnChange,
          blockType: 'heading',
          onCreateBlockAfter: mockOnCreateBlockAfter,
        }),
      );

      // Simulate selecting "Short Answer" command
      act(() => {
        mockOnCommandSelect({ id: 'short_answer', label: 'Short Answer' });
      });

      // Should exit command mode with blur (will create new block)
      expect(mockExitCommandMode).toHaveBeenCalledWith(false, true);
      // Should create after current
      expect(mockOnCreateBlockAfter).toHaveBeenCalledWith({
        blockType: 'short_answer',
        replaceCurrentBlock: false,
      });
    });
  });

  describe('Block type filtering', () => {
    it('should return available block types', () => {
      const { result } = renderHook(() =>
        useSlashCommands({
          elementRef: mockElementRef,
          currentValue: '',
          onChange: mockOnChange,
          blockType: 'text',
          onCreateBlockAfter: mockOnCreateBlockAfter,
        }),
      );

      // The hook should expose filtered blocks from useCommandIndicator
      expect(result.current.filteredBlocks).toBeDefined();
    });
  });
});
