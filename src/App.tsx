import { type FC, useState, useEffect, useRef, useCallback } from 'react';
import { EditorProvider } from '@/contexts';
import {
  useEditor,
  useClickToFocus,
  useGlobalFocusManager,
  useBlockEventHandlers,
  useDragAndDrop,
} from '@/hooks';
import { EditorSidebar, EditorCanvas } from '@/components';
import { createTextBlock } from '@/lib/blockFactory';
import { getOrderedBlocks } from '@/lib/editorUtils';
import type { Block } from '@/types';

const INITIAL_BLOCKS: readonly Block[] = [createTextBlock()] as const;

const EditorContent: FC = () => {
  const { state } = useEditor();
  const focusManager = useGlobalFocusManager();

  const [lastFocusedBlockId, setLastFocusedBlockId] = useState<number | null>(
    null,
  );
  const [dragHandlesVisible, setDragHandlesVisible] = useState(true);

  // Custom hooks for organized functionality
  const blockEventHandlers = useBlockEventHandlers();

  // Smart delete handler that uses appropriate deletion method based on block type
  const handleSmartDeleteBlock = useCallback(
    (blockId: Block['id']) => {
      const block = state.blockMap[blockId];
      if (!block) return;

      const isFormBlock = [
        'short_answer',
        'multiple_choice',
        'multiselect',
      ].includes(block.type);

      if (isFormBlock) {
        blockEventHandlers.handleDeleteFormBlock(blockId);
      } else {
        blockEventHandlers.handleDeleteBlockAndFocusPrevious(blockId);
      }
    },
    [state.blockMap, blockEventHandlers],
  );
  const { activeBlockId, handleDragStart, handleDragEnd } = useDragAndDrop();

  // Focus the last block on initial mount if there are blocks
  useEffect(() => {
    const blocks = getOrderedBlocks(state);
    if (blocks.length > 0 && !lastFocusedBlockId) {
      const lastBlock = blocks[blocks.length - 1];
      // Only focus text blocks on initial load
      if (lastBlock.type === 'text' || lastBlock.type === 'heading') {
        focusManager.focusBlock(lastBlock.id, {
          autoFocus: true,
          deferred: true, // Wait for DOM to be ready
        });
        setLastFocusedBlockId(lastBlock.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Handle click-to-focus functionality with auto text block creation
  // Use a ref to always have access to the latest state
  const stateRef = useRef(state);
  stateRef.current = state;

  useClickToFocus({
    containerId: 'mouse-listener',
    onEmptyAreaClick: (clickY: number) => {
      // Use the ref to get the current state
      const currentState = stateRef.current;
      const blocks = getOrderedBlocks(currentState);

      if (blocks.length > 0) {
        const lastBlock = blocks[blocks.length - 1];

        // Get the DOM element for the last block to check its position
        const lastBlockElement = document.querySelector(
          `[data-block-id="${lastBlock.id}"]`,
        ) as HTMLElement;
        if (!lastBlockElement) {
          return false;
        }

        const lastBlockRect = lastBlockElement.getBoundingClientRect();
        const lastBlockBottom = lastBlockRect.bottom;

        // Check if click is below the last block
        if (clickY <= lastBlockBottom) {
          return false;
        }

        const lastBlockTitle =
          lastBlock.type === 'text' || lastBlock.type === 'heading'
            ? lastBlock.properties.title
            : '';

        // Conditions to create new text block:
        // a) last block is not a text block
        // b) last block is a text block that is not empty
        const shouldCreateNewBlock =
          lastBlock.type !== 'text' ||
          (lastBlock.type === 'text' && lastBlockTitle.trim() !== '');

        if (shouldCreateNewBlock) {
          // Can't use hooks conditionally, so we'll handle this differently
          // The EditorSidebar will handle block creation
          return false; // Let the sidebar handle it
        }
      }
      return false; // No block was created
    },
  });

  // Track last focused block and hide drag handles when user starts typing
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const blockElement = target.closest('[data-block-id]') as HTMLElement;
      if (blockElement) {
        const blockId = parseInt(blockElement.getAttribute('data-block-id')!);
        setLastFocusedBlockId(blockId);
      }

      // Hide drag handles when user focuses on any contenteditable or input
      if (target.matches('[contenteditable="true"], input, textarea')) {
        setDragHandlesVisible(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only hide drag handles when user starts typing if there's a focused contenteditable
      if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key.length === 1) {
        const activeElement = document.activeElement;
        if (
          activeElement &&
          activeElement.matches('[contenteditable="true"], input, textarea')
        ) {
          setDragHandlesVisible(false);
        }
      }
    };

    const handleMouseMove = () => {
      // Show drag handles when user moves mouse (not typing)
      // Only update if currently hidden to avoid unnecessary re-renders
      setDragHandlesVisible((prev) => {
        if (!prev) {
          return true;
        }
        return prev;
      });
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <main>
      <div className='flex min-h-dvh shadow-xl shadow-gray-900'>
        <EditorSidebar lastFocusedBlockId={lastFocusedBlockId} />
        <EditorCanvas
          activeBlockId={activeBlockId}
          dragHandlesVisible={dragHandlesVisible}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onBlockChange={blockEventHandlers.handleBlockChange}
          onFieldChange={blockEventHandlers.handleFieldChange}
          onOptionsChange={blockEventHandlers.handleOptionsChange}
          onRequiredChange={blockEventHandlers.handleRequiredChange}
          onDescriptionChange={blockEventHandlers.handleDescriptionChange}
          onBlockClick={blockEventHandlers.handleBlockClick}
          onCreateBlockAfter={blockEventHandlers.handleCreateBlockAfter}
          onChangeBlockType={blockEventHandlers.handleChangeBlockType}
          onDeleteBlock={handleSmartDeleteBlock}
          onMergeWithPrevious={blockEventHandlers.handleMergeWithPrevious}
          onNavigateToPrevious={blockEventHandlers.handleNavigateToPrevious}
          onNavigateToNext={blockEventHandlers.handleNavigateToNext}
        />
      </div>
      {/* <div className='m-10 text-[12px] text-gray-100'>
        <pre>{JSON.stringify(getOrderedBlocks(state), null, 2)}</pre>
      </div> */}
    </main>
  );
};

const App: FC = () => {
  return (
    <EditorProvider initialBlocks={INITIAL_BLOCKS}>
      <EditorContent />
    </EditorProvider>
  );
};

export default App;
