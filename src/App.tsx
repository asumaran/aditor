import { type FC, useCallback, useState, useEffect } from 'react';
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
import { useEditor, useClickToFocus } from '@/hooks';
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
  const [focusBlockId, setFocusBlockId] = useState<number | null>(null);
  const [cursorAtStartBlockIds, setCursorAtStartBlockIds] = useState<
    Set<number>
  >(new Set());
  const [lastFocusedBlockId, setLastFocusedBlockId] = useState<number | null>(
    null,
  );
  const [activeBlockId, setActiveBlockId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Helper to focus a block imperatively via DOM
  const focusBlockImperatively = useCallback((blockId: number) => {
    // Find the contentEditable element and trigger the imperativo focus method
    setTimeout(() => {
      const element = document.querySelector(
        `[data-block-id="${blockId}"]`,
      ) as HTMLElement;
      if (element) {
        element.focus();
        // Move cursor to end using the same logic as moveCursorToEnd
        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }, 0);
  }, []);

  // Clear focus block ID after it's been applied
  useEffect(() => {
    if (focusBlockId) {
      focusBlockImperatively(focusBlockId);
      // Clear focus block ID immediately
      setFocusBlockId(null);
      setCursorAtStartBlockIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(focusBlockId);
        return newSet;
      });
    }
  }, [focusBlockId, focusBlockImperatively]);

  // Handle click-to-focus functionality
  useClickToFocus('mouse-listener');

  // Track last focused block
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const blockElement = target.closest('[data-block-id]') as HTMLElement;
      if (blockElement) {
        const blockId = parseInt(blockElement.getAttribute('data-block-id')!);
        setLastFocusedBlockId(blockId);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
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
      },
    ) => {
      const {
        initialContent = '',
        cursorAtStart = false,
        blockType = 'text',
      } = options || {};

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

      dispatch({
        type: 'INSERT_BLOCK_AFTER',
        payload: { afterBlockId, newBlock },
      });
      setFocusBlockId(newBlock.id);

      // Set cursor position based on context
      if (cursorAtStart) {
        setCursorAtStartBlockIds((prev) => new Set(prev).add(newBlock.id));
      }

      return newBlock.id;
    },
    [dispatch],
  );

  const handleDeleteBlockAndFocusPrevious = useCallback(
    (blockId: Block['id']) => {
      // Don't delete if it's the only block
      if (getOrderedBlocks(state).length <= 1) return;

      // Find the previous block to focus
      const previousBlockId = getPreviousBlockId(state, blockId);

      // Delete the block
      dispatch({ type: 'REMOVE_BLOCK', payload: { id: blockId } });

      // Focus the previous block if it exists
      if (previousBlockId) {
        setFocusBlockId(previousBlockId);
      }
    },
    [state, dispatch],
  );

  const handleChangeBlockType = useCallback(
    (blockId: Block['id'], newType: string) => {
      // Use the existing CHANGE_BLOCK_TYPE action which handles this properly
      dispatch({
        type: 'CHANGE_BLOCK_TYPE',
        payload: { id: blockId, newType },
      });

      // Set focus to the same block (which now has the new type)
      setFocusBlockId(blockId);
    },
    [dispatch],
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

      // Focus the block
      setFocusBlockId(previousBlockId);

      // Handle cursor positioning outside of React
      requestAnimationFrame(() => {
        const element = document.querySelector(
          `[data-block-id="${previousBlockId}"]`,
        ) as HTMLElement;
        if (!element) return;

        element.focus();

        // Set cursor at junction point using vanilla JS
        const selection = window.getSelection();
        if (!selection) return;

        const range = document.createRange();
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
          null,
        );

        let currentOffset = 0;
        let node: Node | null;

        while ((node = walker.nextNode())) {
          const nodeLength = node.textContent?.length || 0;
          if (currentOffset + nodeLength >= junctionPoint) {
            range.setStart(node, junctionPoint - currentOffset);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            return;
          }
          currentOffset += nodeLength;
        }
      });
    },
    [state, dispatch],
  );

  const handleNavigateToPrevious = useCallback(
    (blockId: Block['id']) => {
      const previousBlockId = getPreviousBlockId(state, blockId);
      if (previousBlockId) {
        // Find the DOM element and focus it directly
        const element = document.querySelector(
          `[data-block-id="${previousBlockId}"]`,
        ) as HTMLElement;
        if (element) {
          element.focus();
          // Move cursor to end
          const range = document.createRange();
          range.selectNodeContents(element);
          range.collapse(false);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }
    },
    [state],
  );

  const handleNavigateToNext = useCallback(
    (blockId: Block['id']) => {
      const nextBlockId = getNextBlockId(state, blockId);
      if (nextBlockId) {
        // Find the DOM element and focus it directly
        const element = document.querySelector(
          `[data-block-id="${nextBlockId}"]`,
        ) as HTMLElement;
        if (element) {
          element.focus();
          // Move cursor to end
          const range = document.createRange();
          range.selectNodeContents(element);
          range.collapse(false);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }
    },
    [state],
  );

  const addTextBlock = useCallback(() => {
    // Check if block should be replaced by sidebar buttons (only "" or "\n")
    const shouldReplaceBlock = (content: string) => {
      return content === '' || content === '\n';
    };

    if (lastFocusedBlockId) {
      const block = state.blockMap[lastFocusedBlockId];
      const blockTitle =
        block.type === 'text' || block.type === 'heading'
          ? block.properties.title
          : '';
      const isEmpty = shouldReplaceBlock(blockTitle || '');

      if ((block.type === 'text' || block.type === 'heading') && isEmpty) {
        // Replace empty text/heading block
        dispatch({
          type: 'CHANGE_BLOCK_TYPE',
          payload: { id: lastFocusedBlockId, newType: 'text' },
        });
        setFocusBlockId(lastFocusedBlockId);
      } else {
        // Insert after current block
        const newBlock = createTextBlock('');
        dispatch({
          type: 'INSERT_BLOCK_AFTER',
          payload: { afterBlockId: lastFocusedBlockId, newBlock },
        });
        setFocusBlockId(newBlock.id);
      }
    } else {
      // No focus - handle last block
      const blocks = getOrderedBlocks(state);
      const lastBlock = blocks[blocks.length - 1];

      if (!lastBlock) {
        const newBlock = createTextBlock('');
        dispatch({ type: 'ADD_BLOCK', payload: newBlock });
        setFocusBlockId(newBlock.id);
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
          setFocusBlockId(lastBlock.id);
        } else {
          // Insert after last block
          const newBlock = createTextBlock('');
          dispatch({
            type: 'INSERT_BLOCK_AFTER',
            payload: { afterBlockId: lastBlock.id, newBlock },
          });
          setFocusBlockId(newBlock.id);
        }
      }
    }
  }, [state, dispatch, lastFocusedBlockId]);

  const addHeadingBlock = useCallback(() => {
    // Check if block should be replaced by sidebar buttons (only "" or "\n")
    const shouldReplaceBlock = (content: string) => {
      return content === '' || content === '\n';
    };

    if (lastFocusedBlockId) {
      const block = state.blockMap[lastFocusedBlockId];
      const blockTitle =
        block.type === 'text' || block.type === 'heading'
          ? block.properties.title
          : '';
      const isEmpty = shouldReplaceBlock(blockTitle || '');

      if ((block.type === 'text' || block.type === 'heading') && isEmpty) {
        // Replace empty text/heading block
        dispatch({
          type: 'CHANGE_BLOCK_TYPE',
          payload: { id: lastFocusedBlockId, newType: 'heading' },
        });
        setFocusBlockId(lastFocusedBlockId);
      } else {
        // Insert after current block
        const newBlock = createHeadingBlock('');
        dispatch({
          type: 'INSERT_BLOCK_AFTER',
          payload: { afterBlockId: lastFocusedBlockId, newBlock },
        });
        setFocusBlockId(newBlock.id);
      }
    } else {
      // No focus - handle last block
      const blocks = getOrderedBlocks(state);
      const lastBlock = blocks[blocks.length - 1];

      if (!lastBlock) {
        const newBlock = createHeadingBlock('');
        dispatch({ type: 'ADD_BLOCK', payload: newBlock });
        setFocusBlockId(newBlock.id);
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
          // Replace empty last block
          dispatch({
            type: 'CHANGE_BLOCK_TYPE',
            payload: { id: lastBlock.id, newType: 'heading' },
          });
          setFocusBlockId(lastBlock.id);
        } else {
          // Insert after last block
          const newBlock = createHeadingBlock('');
          dispatch({
            type: 'INSERT_BLOCK_AFTER',
            payload: { afterBlockId: lastBlock.id, newBlock },
          });
          setFocusBlockId(newBlock.id);
        }
      }
    }
  }, [state, dispatch, lastFocusedBlockId]);

  const addShortAnswerBlock = useCallback(() => {
    if (lastFocusedBlockId) {
      // Always insert after focused block (never replace for form blocks)
      const newBlock = createShortAnswerBlock('Sample Short Answer Question');
      dispatch({
        type: 'INSERT_BLOCK_AFTER',
        payload: { afterBlockId: lastFocusedBlockId, newBlock },
      });
      setFocusBlockId(newBlock.id);
    } else {
      // No focus - insert at end
      const newBlock = createShortAnswerBlock('Sample Short Answer Question');
      dispatch({ type: 'ADD_BLOCK', payload: newBlock });
      setFocusBlockId(newBlock.id);
    }
  }, [dispatch, lastFocusedBlockId]);

  const addMultipleChoiceBlock = useCallback(() => {
    if (lastFocusedBlockId) {
      // Always insert after focused block (never replace for form blocks)
      const newBlock = createMultipleChoiceBlock('Question');
      dispatch({
        type: 'INSERT_BLOCK_AFTER',
        payload: { afterBlockId: lastFocusedBlockId, newBlock },
      });
      setFocusBlockId(newBlock.id);
    } else {
      // No focus - insert at end
      const newBlock = createMultipleChoiceBlock('Question');
      dispatch({ type: 'ADD_BLOCK', payload: newBlock });
      setFocusBlockId(newBlock.id);
    }
  }, [dispatch, lastFocusedBlockId]);

  const addMultiselectBlock = useCallback(() => {
    if (lastFocusedBlockId) {
      // Always insert after focused block (never replace for form blocks)
      const newBlock = createMultiselectBlock('Select label');
      dispatch({
        type: 'INSERT_BLOCK_AFTER',
        payload: { afterBlockId: lastFocusedBlockId, newBlock },
      });
      setFocusBlockId(newBlock.id);
    } else {
      // No focus - insert at end
      const newBlock = createMultiselectBlock('Select label');
      dispatch({ type: 'ADD_BLOCK', payload: newBlock });
      setFocusBlockId(newBlock.id);
    }
  }, [dispatch, lastFocusedBlockId]);

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
        }
      }
    },
    [state, dispatch],
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
                {getOrderedBlocks(state).map((block, index) => {
                  // Auto-focus if it's the first block AND the only block,
                  // OR if it's a newly created block that should be focused
                  const orderedBlocks = getOrderedBlocks(state);
                  const shouldAutoFocus =
                    focusBlockId === block.id ||
                    (index === 0 &&
                      block.type === 'text' &&
                      orderedBlocks.length === 1 &&
                      !focusBlockId);

                  const shouldCursorAtStart = cursorAtStartBlockIds.has(
                    block.id,
                  );

                  return (
                    <BlockRenderer
                      key={block.id}
                      block={block}
                      onChange={handleBlockChange}
                      onFieldChange={handleFieldChange}
                      onOptionsChange={handleOptionsChange}
                      onRequiredChange={handleRequiredChange}
                      onBlockClick={handleBlockClick}
                      onCreateBlockAfter={handleCreateBlockAfter}
                      onChangeBlockType={handleChangeBlockType}
                      onDeleteBlock={handleDeleteBlockAndFocusPrevious}
                      onMergeWithPrevious={handleMergeWithPrevious}
                      onNavigateToPrevious={handleNavigateToPrevious}
                      onNavigateToNext={handleNavigateToNext}
                      autoFocus={shouldAutoFocus}
                      cursorAtStart={shouldCursorAtStart}
                    />
                  );
                })}
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
                      autoFocus={false}
                      cursorAtStart={false}
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
