import { type FC, useCallback, useState, useEffect } from 'react';
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
import type { Block, Option } from '@/types';

const INITIAL_BLOCKS: readonly Block[] = [createTextBlock()] as const;

const EditorContent: FC = () => {
  const { state, dispatch } = useEditor();
  const [focusBlockId, setFocusBlockId] = useState<number | null>(null);
  const [cursorAtStartBlockIds, setCursorAtStartBlockIds] = useState<Set<number>>(new Set());

  // Clear focus block ID after it's been applied
  useEffect(() => {
    if (focusBlockId) {
      // Clear on next tick to ensure React has applied the focus
      Promise.resolve().then(() => {
        setFocusBlockId(null);
        setCursorAtStartBlockIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(focusBlockId);
          return newSet;
        });
      });
    }
  }, [focusBlockId]);

  // Handle click-to-focus functionality
  useClickToFocus('mouse-listener');

  const handleBlockChange = useCallback(
    (id: Block['id'], value: string) => {
      dispatch({ type: 'UPDATE_BLOCK_CONTENT', payload: { id, value } });
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
    (afterBlockId: Block['id'], options?: { initialContent?: string; cursorAtStart?: boolean }) => {
      const { initialContent = '', cursorAtStart = false } = options || {};
      
      const newBlock = createTextBlock(initialContent);
      dispatch({
        type: 'INSERT_BLOCK_AFTER',
        payload: { afterBlockId, newBlock },
      });
      setFocusBlockId(newBlock.id);
      
      // Set cursor position based on context
      if (cursorAtStart) {
        setCursorAtStartBlockIds(prev => new Set(prev).add(newBlock.id));
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

  const handleMergeWithPrevious = useCallback(
    (blockId: Block['id'], currentContent: string) => {
      // Don't merge if it's the first block
      const previousBlockId = getPreviousBlockId(state, blockId);
      if (!previousBlockId) return;

      const previousBlock = state.blockMap[previousBlockId];
      
      // Only merge with text/heading blocks
      if (!previousBlock || !['text', 'heading'].includes(previousBlock.type)) return;

      // Get the previous block's content
      const previousContent = previousBlock.properties.title || '';
      const mergedContent = previousContent + currentContent;

      // Store the junction point position before updating
      const junctionPoint = previousContent.length;
      
      // Delete the current block first
      dispatch({ type: 'REMOVE_BLOCK', payload: { id: blockId } });
      
      // Update the previous block with merged content
      dispatch({ 
        type: 'UPDATE_BLOCK_CONTENT', 
        payload: { id: previousBlockId, value: mergedContent } 
      });

      // Focus the block
      setFocusBlockId(previousBlockId);
      
      // Handle cursor positioning outside of React
      requestAnimationFrame(() => {
        const element = document.querySelector(`[data-block-id="${previousBlockId}"]`) as HTMLElement;
        if (!element) return;
        
        element.focus();
        
        // Set cursor at junction point using vanilla JS
        const selection = window.getSelection();
        if (!selection) return;
        
        const range = document.createRange();
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
          null
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
    const newBlock = createTextBlock('New text block');
    dispatch({ type: 'ADD_BLOCK', payload: newBlock });
  }, [dispatch]);

  const addHeadingBlock = useCallback(() => {
    const newBlock = createHeadingBlock('New heading block');
    dispatch({ type: 'ADD_BLOCK', payload: newBlock });
  }, [dispatch]);

  const addShortAnswerBlock = useCallback(() => {
    const newBlock = createShortAnswerBlock('Sample Short Answer Question');
    dispatch({ type: 'ADD_BLOCK', payload: newBlock });
  }, [dispatch]);

  const addMultipleChoiceBlock = useCallback(() => {
    const newBlock = createMultipleChoiceBlock('Question');
    dispatch({ type: 'ADD_BLOCK', payload: newBlock });
  }, [dispatch]);

  const addMultiselectBlock = useCallback(() => {
    const newBlock = createMultiselectBlock('Select label');
    dispatch({ type: 'ADD_BLOCK', payload: newBlock });
  }, [dispatch]);

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
        <div className='grow bg-white p-5' id='mouse-listener'>
          <div className='m-auto w-[600px]'>
            <section
              className='flex w-full max-w-full shrink-0 grow flex-col items-start text-base leading-[1.5]'
              aria-label='Content blocks'
            >
              {getOrderedBlocks(state).map((block, index) => {
                // Auto-focus if it's the first text block AND the only block,
                // OR if it's a newly created block that should be focused
                const orderedBlocks = getOrderedBlocks(state);
                const shouldAutoFocus =
                  (index === 0 &&
                    block.type === 'text' &&
                    orderedBlocks.length === 1) ||
                  focusBlockId === block.id;
                
                const shouldCursorAtStart = cursorAtStartBlockIds.has(block.id);

                return (
                  <BlockRenderer
                    key={block.id}
                    block={block}
                    onChange={handleBlockChange}
                    onOptionsChange={handleOptionsChange}
                    onRequiredChange={handleRequiredChange}
                    onBlockClick={handleBlockClick}
                    onCreateBlockAfter={handleCreateBlockAfter}
                    onDeleteBlock={handleDeleteBlockAndFocusPrevious}
                    onMergeWithPrevious={handleMergeWithPrevious}
                    onNavigateToPrevious={handleNavigateToPrevious}
                    onNavigateToNext={handleNavigateToNext}
                    autoFocus={shouldAutoFocus}
                    cursorAtStart={shouldCursorAtStart}
                  />
                );
              })}
            </section>
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
