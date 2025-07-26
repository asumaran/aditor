import { type FC, useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BlockRenderer } from '@/components';
import { EditorProvider } from '@/contexts';
import { useEditor } from '@/hooks';
import {
  createTextBlock,
  createShortAnswerBlock,
  createMultipleChoiceBlock,
  createMultiselectBlock,
  createHeadingBlock,
} from '@/lib/blockFactory';
import type { Block, Option } from '@/types';

const INITIAL_BLOCKS: readonly Block[] = [createTextBlock()] as const;

const EditorContent: FC = () => {
  const { state, dispatch } = useEditor();
  const [focusBlockId, setFocusBlockId] = useState<number | null>(null);

  // Clear focus block ID after it's been applied
  useEffect(() => {
    if (focusBlockId) {
      const timer = setTimeout(() => {
        setFocusBlockId(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [focusBlockId]);

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

  const handleCreateBlockAfter = useCallback((afterBlockId: Block['id']) => {
    const newBlock = createTextBlock();
    dispatch({ type: 'INSERT_BLOCK_AFTER', payload: { afterBlockId, newBlock } });
    setFocusBlockId(newBlock.id);
    return newBlock.id;
  }, [dispatch]);

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
      <div className='m-10 mx-auto flex max-w-5xl gap-2 rounded'>
        <div className='w-40 shrink rounded-sm bg-white shadow-sm'>
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
        <div className='grow rounded-sm bg-white p-5 shadow-sm'>
          <section className='space-y-3' aria-label='Content blocks'>
            {state.blocks.map((block, index) => {
              // Auto-focus if it's the first text block AND the only block, 
              // OR if it's a newly created block that should be focused
              const shouldAutoFocus = 
                (index === 0 && block.type === 'text' && state.blocks.length === 1) ||
                (focusBlockId === block.id);
              
              return (
                <BlockRenderer
                  key={block.id}
                  block={block}
                  onChange={handleBlockChange}
                  onOptionsChange={handleOptionsChange}
                  onRequiredChange={handleRequiredChange}
                  onBlockClick={handleBlockClick}
                  onCreateBlockAfter={handleCreateBlockAfter}
                  className='w-full'
                  autoFocus={shouldAutoFocus}
                />
              );
            })}
          </section>
        </div>
      </div>
      <div className='my-10 text-[12px] text-gray-500'>
        <pre>{JSON.stringify(state.blocks, null, 2)}</pre>
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
