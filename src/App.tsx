import { type FC, useCallback, useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { BlockRenderer } from '@/components';
import { EditorProvider } from '@/contexts';
import { useEditor, useClickToFocus, useGlobalFocusManager } from '@/hooks';
import {
  createTextBlock,
  createShortAnswerBlock,
  createMultipleChoiceBlock,
  createMultiselectBlock,
  createHeadingBlock,
} from '@/lib/blockFactory';
import {
  getOrderedBlocks,
  getPreviousBlockId,
  getNextBlockId,
  shouldReplaceBlock,
  getBlockTextContent,
} from '@/lib/editorUtils';
import type {
  Block,
  Option,
  TextBlockProperties,
  HeadingBlockProperties,
} from '@/types';

const INITIAL_BLOCKS: readonly Block[] = [createTextBlock()] as const;

const EditorContent: FC = () => {
  const { state, dispatch } = useEditor();
  const focusManager = useGlobalFocusManager();

  const [lastFocusedBlockId, setLastFocusedBlockId] = useState<number | null>(
    null,
  );

  const [activeBlockId, setActiveBlockId] = useState<number | null>(null);
  const [dragHandlesVisible, setDragHandlesVisible] = useState(true);

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // LEGACY SYSTEM REMOVED - Now using only FocusManager

  // Handle click-to-focus functionality with auto text block creation
  // Use a ref to always have access to the latest state
  const stateRef = useRef(state);
  stateRef.current = state;

  // Helper function to replace empty text/heading blocks with form blocks
  const replaceEmptyBlock = useCallback(
    (blockId: number, newBlock: Block) => {
      dispatch({
        type: 'REPLACE_BLOCK',
        payload: { id: blockId, newBlock },
      });

      // Use onBlockCreated since the structure has changed significantly
      focusManager.onBlockCreated(blockId, {
        autoFocus: true,
        deferred: true,
        cursorAtEnd: true,
      });
    },
    [dispatch, focusManager],
  );

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
          const newBlock = createTextBlock('');
          dispatch({
            type: 'INSERT_BLOCK_AFTER',
            payload: { afterBlockId: lastBlock.id, newBlock },
          });

          // Focus the new block
          focusManager.onBlockCreated(newBlock.id, {
            autoFocus: true,
            deferred: true,
          });

          return true; // Block was created
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

  const handleBlockChange = useCallback(
    (id: Block['id'], value: string) => {
      dispatch({ type: 'UPDATE_BLOCK_CONTENT', payload: { id, value } });
    },
    [dispatch],
  );

  const handleFieldChange = useCallback(
    (id: Block['id'], fieldId: string, value: string) => {
      dispatch({ type: 'UPDATE_BLOCK_FIELD', payload: { id, fieldId, value } });
    },
    [dispatch],
  );

  const handleOptionsChange = useCallback(
    (id: Block['id'], options: readonly Option[]) => {
      dispatch({ type: 'UPDATE_BLOCK_OPTIONS', payload: { id, options } });
    },
    [dispatch],
  );

  const handleRequiredChange = useCallback(
    (id: Block['id'], required: boolean) => {
      dispatch({ type: 'UPDATE_BLOCK_REQUIRED', payload: { id, required } });
    },
    [dispatch],
  );

  const handleDescriptionChange = useCallback(
    (id: Block['id'], showDescription: boolean) => {
      dispatch({
        type: 'UPDATE_BLOCK_DESCRIPTION',
        payload: { id, showDescription },
      });
    },
    [dispatch],
  );

  const handleBlockClick = useCallback((blockId: Block['id']) => {
    console.log('Block clicked:', blockId);
  }, []);

  const handleCreateBlockAfter = useCallback(
    (
      afterBlockId: Block['id'],
      options?: {
        initialContent?: string;
        cursorAtStart?: boolean;
        blockType?: string;
        onFocusTransferred?: () => void;
        replaceCurrentBlock?: boolean;
      },
    ) => {
      const {
        initialContent = '',
        cursorAtStart = false,
        blockType = 'text',
        onFocusTransferred,
        replaceCurrentBlock = false,
      } = options || {};

      // For text/heading blocks created via slash commands with no content,
      // we want cursor at start
      const shouldCursorBeAtStart =
        cursorAtStart ||
        ((blockType === 'text' || blockType === 'heading') && !initialContent);

      let newBlock: Block;
      switch (blockType) {
        case 'heading':
          newBlock = createHeadingBlock(initialContent);
          break;
        case 'short_answer':
          newBlock = createShortAnswerBlock(initialContent);
          break;
        case 'multiple_choice':
          newBlock = createMultipleChoiceBlock(initialContent);
          break;
        case 'multiselect':
          newBlock = createMultiselectBlock(initialContent);
          break;
        default:
          newBlock = createTextBlock(initialContent);
      }

      if (replaceCurrentBlock) {
        // Use REPLACE_BLOCK for slash commands to avoid visual jump
        dispatch({
          type: 'REPLACE_BLOCK',
          payload: { id: afterBlockId, newBlock },
        });

        // If there's a callback to execute after focus, set up a one-time listener
        if (onFocusTransferred) {
          // Use multiple requestAnimationFrame to wait for focus to complete
          // This matches FocusManager's deferred timing (double RAF)
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                onFocusTransferred();
              });
            });
          });
        }

        // Use FocusManager for replaced block focus (keeping the same ID)
        focusManager.onBlockCreated(afterBlockId, {
          cursorAtStart: shouldCursorBeAtStart,
          autoFocus: true,
          deferred: true,
          ...(blockType === 'short_answer' ||
          blockType === 'multiple_choice' ||
          blockType === 'multiselect'
            ? { cursorAtEnd: true }
            : {}),
        });

        return afterBlockId;
      } else {
        // Normal case: insert after
        dispatch({
          type: 'INSERT_BLOCK_AFTER',
          payload: { afterBlockId, newBlock },
        });

        // If there's a callback to execute after focus, set up a one-time listener
        if (onFocusTransferred) {
          // Use multiple requestAnimationFrame to wait for focus to complete
          // This matches FocusManager's deferred timing (double RAF)
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                onFocusTransferred();
              });
            });
          });
        }

        // Use FocusManager for new block focus
        focusManager.onBlockCreated(newBlock.id, {
          cursorAtStart: shouldCursorBeAtStart,
          autoFocus: true,
          deferred: true,
          ...(blockType === 'short_answer' ||
          blockType === 'multiple_choice' ||
          blockType === 'multiselect'
            ? { cursorAtEnd: true }
            : {}),
        });

        return newBlock.id;
      }
    },
    [dispatch, focusManager],
  );

  const handleDeleteBlockAndFocusPrevious = useCallback(
    (blockId: Block['id']) => {
      // Don't delete if it's the only block
      if (getOrderedBlocks(state).length <= 1) return;

      // Find the previous block to focus
      const previousBlockId = getPreviousBlockId(state, blockId);

      // Delete the block
      dispatch({ type: 'REMOVE_BLOCK', payload: { id: blockId } });

      // Focus the previous block if it exists using FocusManager
      if (previousBlockId) {
        focusManager.focusBlockForEvent(previousBlockId, 'block-deleted', {
          cursorAtEnd: true, // Position cursor at end when focusing after deletion
          autoFocus: true,
          deferred: true, // Wait for React to remove the deleted block from DOM
        });
      }
    },
    [state, dispatch, focusManager],
  );

  const handleChangeBlockType = useCallback(
    (blockId: Block['id'], newType: string) => {
      // Use the existing CHANGE_BLOCK_TYPE action which handles this properly
      dispatch({
        type: 'CHANGE_BLOCK_TYPE',
        payload: { id: blockId, newType },
      });

      // Focus the same block (which now has the new type) using FocusManager
      focusManager.focusBlock(blockId, {
        autoFocus: true,
        deferred: true, // Wait for React to update the block type
        cursorAtStart: true, // Position cursor at start for empty blocks
      });
    },
    [dispatch, focusManager],
  );

  const handleMergeWithPrevious = useCallback(
    (blockId: Block['id'], currentContent: string) => {
      // Don't merge if it's the first block
      const previousBlockId = getPreviousBlockId(state, blockId);
      if (!previousBlockId) return;

      const previousBlock = state.blockMap[previousBlockId];

      // Only merge with text/heading blocks
      if (!previousBlock || !['text', 'heading'].includes(previousBlock.type))
        return;

      // Get the previous block's content
      // TypeScript: We know this is safe because we checked the block type above
      const previousContent =
        (
          previousBlock.properties as
            | TextBlockProperties
            | HeadingBlockProperties
        ).title || '';
      const mergedContent = previousContent + currentContent;

      // Store the junction point position before updating
      const junctionPoint = previousContent.length;

      // Delete the current block first
      dispatch({ type: 'REMOVE_BLOCK', payload: { id: blockId } });

      // Update the previous block with merged content
      dispatch({
        type: 'UPDATE_BLOCK_CONTENT',
        payload: { id: previousBlockId, value: mergedContent },
      });

      // Use FocusManager for merge focus
      focusManager.onBlockMerged(previousBlockId, junctionPoint, {
        autoFocus: true,
        deferred: true, // Wait for React content update
      });
    },
    [state, dispatch, focusManager],
  );

  const handleNavigateToPrevious = useCallback(
    (blockId: Block['id']) => {
      const previousBlockId = getPreviousBlockId(state, blockId);
      if (previousBlockId) {
        focusManager.onNavigation(previousBlockId, {
          cursorAtEnd: true, // Navigation typically goes to end
          autoFocus: true,
        });
      }
    },
    [state, focusManager],
  );

  const handleNavigateToNext = useCallback(
    (blockId: Block['id']) => {
      const nextBlockId = getNextBlockId(state, blockId);
      if (nextBlockId) {
        focusManager.onNavigation(nextBlockId, {
          cursorAtEnd: true, // Navigation typically goes to end
          autoFocus: true,
        });
      }
    },
    [state, focusManager],
  );

  const addTextBlock = useCallback(() => {
    if (lastFocusedBlockId) {
      const block = state.blockMap[lastFocusedBlockId];
      const blockTitle = getBlockTextContent(block);
      const isEmpty = shouldReplaceBlock(blockTitle);

      if ((block.type === 'text' || block.type === 'heading') && isEmpty) {
        // Replace empty text/heading block
        dispatch({
          type: 'CHANGE_BLOCK_TYPE',
          payload: { id: lastFocusedBlockId, newType: 'text' },
        });
        focusManager.focusBlock(lastFocusedBlockId, {
          autoFocus: true,
          deferred: true,
        });
      } else {
        // Insert after current block
        const newBlock = createTextBlock('');
        dispatch({
          type: 'INSERT_BLOCK_AFTER',
          payload: { afterBlockId: lastFocusedBlockId, newBlock },
        });
        focusManager.onBlockCreated(newBlock.id, {
          autoFocus: true,
          deferred: true,
        });
      }
    } else {
      // No focus - handle last block
      const blocks = getOrderedBlocks(state);
      const lastBlock = blocks[blocks.length - 1];

      if (!lastBlock) {
        const newBlock = createTextBlock('');
        dispatch({ type: 'ADD_BLOCK', payload: newBlock });
        focusManager.onBlockCreated(newBlock.id, {
          autoFocus: true,
          deferred: true,
        });
      } else {
        const lastBlockTitle =
          lastBlock.type === 'text' || lastBlock.type === 'heading'
            ? lastBlock.properties.title
            : '';
        const isEmpty = shouldReplaceBlock(lastBlockTitle || '');

        if (
          (lastBlock.type === 'text' || lastBlock.type === 'heading') &&
          isEmpty
        ) {
          // Replace empty text/heading block
          dispatch({
            type: 'CHANGE_BLOCK_TYPE',
            payload: { id: lastBlock.id, newType: 'text' },
          });
          focusManager.focusBlock(lastBlock.id, {
            autoFocus: true,
            deferred: true,
          });
        } else {
          // Insert after last block
          const newBlock = createTextBlock('');
          dispatch({
            type: 'INSERT_BLOCK_AFTER',
            payload: { afterBlockId: lastBlock.id, newBlock },
          });
          focusManager.onBlockCreated(newBlock.id, {
            autoFocus: true,
            deferred: true,
          });
        }
      }
    }
  }, [state, dispatch, lastFocusedBlockId, focusManager]);

  const addHeadingBlock = useCallback(() => {
    if (lastFocusedBlockId) {
      const block = state.blockMap[lastFocusedBlockId];
      const blockTitle = getBlockTextContent(block);
      const isEmpty = shouldReplaceBlock(blockTitle);

      if ((block.type === 'text' || block.type === 'heading') && isEmpty) {
        // Replace empty text/heading block
        dispatch({
          type: 'CHANGE_BLOCK_TYPE',
          payload: { id: lastFocusedBlockId, newType: 'heading' },
        });
        focusManager.focusBlock(lastFocusedBlockId, {
          autoFocus: true,
          deferred: true,
        });
      } else {
        // Insert after current block
        const newBlock = createHeadingBlock('');
        dispatch({
          type: 'INSERT_BLOCK_AFTER',
          payload: { afterBlockId: lastFocusedBlockId, newBlock },
        });
        focusManager.onBlockCreated(newBlock.id, {
          autoFocus: true,
          deferred: true,
        });
      }
    } else {
      // No focus - handle last block
      const blocks = getOrderedBlocks(state);
      const lastBlock = blocks[blocks.length - 1];

      if (!lastBlock) {
        const newBlock = createHeadingBlock('');
        dispatch({ type: 'ADD_BLOCK', payload: newBlock });
        focusManager.onBlockCreated(newBlock.id, {
          autoFocus: true,
          deferred: true,
        });
      } else {
        const lastBlockTitle = getBlockTextContent(lastBlock);
        const isEmpty = shouldReplaceBlock(lastBlockTitle);

        if (
          (lastBlock.type === 'text' || lastBlock.type === 'heading') &&
          isEmpty
        ) {
          // Replace empty last block
          dispatch({
            type: 'CHANGE_BLOCK_TYPE',
            payload: { id: lastBlock.id, newType: 'heading' },
          });
          focusManager.focusBlock(lastBlock.id, {
            autoFocus: true,
            deferred: true,
          });
        } else {
          // Insert after last block
          const newBlock = createHeadingBlock('');
          dispatch({
            type: 'INSERT_BLOCK_AFTER',
            payload: { afterBlockId: lastBlock.id, newBlock },
          });
          focusManager.onBlockCreated(newBlock.id, {
            autoFocus: true,
            deferred: true,
          });
        }
      }
    }
  }, [state, dispatch, lastFocusedBlockId, focusManager]);

  const addShortAnswerBlock = useCallback(() => {
    if (lastFocusedBlockId) {
      const block = state.blockMap[lastFocusedBlockId];
      const blockTitle = getBlockTextContent(block);
      const isEmpty = shouldReplaceBlock(blockTitle);

      if ((block.type === 'text' || block.type === 'heading') && isEmpty) {
        // Replace empty text/heading block
        const newBlock = createShortAnswerBlock('Sample Short Answer Question');
        replaceEmptyBlock(lastFocusedBlockId, newBlock);
      } else {
        // Insert after focused block for non-empty blocks
        const newBlock = createShortAnswerBlock('Sample Short Answer Question');
        dispatch({
          type: 'INSERT_BLOCK_AFTER',
          payload: { afterBlockId: lastFocusedBlockId, newBlock },
        });
        focusManager.onBlockCreated(newBlock.id, {
          autoFocus: true,
          deferred: true,
          cursorAtEnd: true,
        });
      }
    } else {
      // No focus - insert at end
      const newBlock = createShortAnswerBlock('Sample Short Answer Question');
      dispatch({ type: 'ADD_BLOCK', payload: newBlock });
      focusManager.onBlockCreated(newBlock.id, {
        autoFocus: true,
        deferred: true,
        cursorAtEnd: true,
      });
    }
  }, [state, dispatch, lastFocusedBlockId, focusManager, replaceEmptyBlock]);

  const addMultipleChoiceBlock = useCallback(() => {
    if (lastFocusedBlockId) {
      const block = state.blockMap[lastFocusedBlockId];
      const blockTitle = getBlockTextContent(block);
      const isEmpty = shouldReplaceBlock(blockTitle);

      if ((block.type === 'text' || block.type === 'heading') && isEmpty) {
        // Replace empty text/heading block
        const newBlock = createMultipleChoiceBlock('Question');
        replaceEmptyBlock(lastFocusedBlockId, newBlock);
      } else {
        // Insert after focused block for non-empty blocks
        const newBlock = createMultipleChoiceBlock('Question');
        dispatch({
          type: 'INSERT_BLOCK_AFTER',
          payload: { afterBlockId: lastFocusedBlockId, newBlock },
        });
        focusManager.onBlockCreated(newBlock.id, {
          autoFocus: true,
          deferred: true,
          cursorAtEnd: true,
        });
      }
    } else {
      // No focus - insert at end
      const newBlock = createMultipleChoiceBlock('Question');
      dispatch({ type: 'ADD_BLOCK', payload: newBlock });
      focusManager.onBlockCreated(newBlock.id, {
        autoFocus: true,
        deferred: true,
        cursorAtEnd: true,
      });
    }
  }, [state, dispatch, lastFocusedBlockId, focusManager, replaceEmptyBlock]);

  const addMultiselectBlock = useCallback(() => {
    if (lastFocusedBlockId) {
      const block = state.blockMap[lastFocusedBlockId];
      const blockTitle = getBlockTextContent(block);
      const isEmpty = shouldReplaceBlock(blockTitle);

      if ((block.type === 'text' || block.type === 'heading') && isEmpty) {
        // Replace empty text/heading block
        const newBlock = createMultiselectBlock('Select label');
        replaceEmptyBlock(lastFocusedBlockId, newBlock);
      } else {
        // Insert after focused block for non-empty blocks
        const newBlock = createMultiselectBlock('Select label');
        dispatch({
          type: 'INSERT_BLOCK_AFTER',
          payload: { afterBlockId: lastFocusedBlockId, newBlock },
        });
        focusManager.onBlockCreated(newBlock.id, {
          autoFocus: true,
          deferred: true,
          cursorAtEnd: true,
        });
      }
    } else {
      // No focus - insert at end
      const newBlock = createMultiselectBlock('Select label');
      dispatch({ type: 'ADD_BLOCK', payload: newBlock });
      focusManager.onBlockCreated(newBlock.id, {
        autoFocus: true,
        deferred: true,
        cursorAtEnd: true,
      });
    }
  }, [state, dispatch, lastFocusedBlockId, focusManager, replaceEmptyBlock]);

  const handleDragStart = useCallback(
    (event: { active: { id: string | number } }) => {
      setActiveBlockId(Number(event.active.id));
    },
    [],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveBlockId(null);

      if (over && active.id !== over.id) {
        const orderedBlocks = getOrderedBlocks(state);
        const oldIndex = orderedBlocks.findIndex(
          (block) => block.id.toString() === active.id,
        );
        const newIndex = orderedBlocks.findIndex(
          (block) => block.id.toString() === over.id,
        );

        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedBlockIds = arrayMove(
            orderedBlocks.map((block) => block.id),
            oldIndex,
            newIndex,
          );
          dispatch({
            type: 'REORDER_BLOCKS',
            payload: { blockIds: reorderedBlockIds },
          });

          // Restore focus to the dragged block after drag operation
          const draggedBlockId = Number(active.id);
          focusManager.focusBlock(draggedBlockId, {
            autoFocus: true,
            deferred: true, // Wait for React reorder
          });
        }
      }
    },
    [state, dispatch, focusManager],
  );

  return (
    <main>
      <div className='flex min-h-[calc(100vh-200px)] shadow-xl shadow-gray-900'>
        <div className='w-40 shrink basis-50 bg-gray-100'>
          <div className='flex flex-col items-start space-y-1 p-5'>
            <Button size='sm' onClick={addTextBlock}>
              Text Block
            </Button>
            <Button size='sm' onClick={addHeadingBlock}>
              Heading Block
            </Button>
            <Button size='sm' onClick={addShortAnswerBlock}>
              Short Answer
            </Button>
            <Button size='sm' onClick={addMultipleChoiceBlock}>
              Multiple Choice
            </Button>
            <Button size='sm' onClick={addMultiselectBlock}>
              Multiselect
            </Button>
          </div>
        </div>
        <div className='main-container grow bg-white py-5' id='mouse-listener'>
          <div id='form-container' className='m-auto w-[600px]'>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              // modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext
                items={getOrderedBlocks(state).map((block) =>
                  block.id.toString(),
                )}
                strategy={verticalListSortingStrategy}
              >
                {getOrderedBlocks(state).map((block) => (
                  <BlockRenderer
                    key={block.id}
                    block={block}
                    onChange={handleBlockChange}
                    onFieldChange={handleFieldChange}
                    onOptionsChange={handleOptionsChange}
                    onRequiredChange={handleRequiredChange}
                    onDescriptionChange={handleDescriptionChange}
                    onBlockClick={handleBlockClick}
                    onCreateBlockAfter={handleCreateBlockAfter}
                    onChangeBlockType={handleChangeBlockType}
                    onDeleteBlock={handleDeleteBlockAndFocusPrevious}
                    onMergeWithPrevious={handleMergeWithPrevious}
                    onNavigateToPrevious={handleNavigateToPrevious}
                    onNavigateToNext={handleNavigateToNext}
                    dragHandlesVisible={dragHandlesVisible}
                  />
                ))}
              </SortableContext>
              <DragOverlay dropAnimation={null}>
                {activeBlockId ? (
                  // Apply opacity to the component during drag
                  <div className='opacity-50'>
                    <BlockRenderer
                      block={state.blockMap[activeBlockId]}
                      onChange={() => {}}
                      onFieldChange={() => {}}
                      onOptionsChange={() => {}}
                      onRequiredChange={() => {}}
                      onBlockClick={() => {}}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </div>
      <div className='m-10 text-[12px] text-gray-100'>
        <pre>{JSON.stringify(getOrderedBlocks(state), null, 2)}</pre>
      </div>
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
