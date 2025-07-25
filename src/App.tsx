import { type FC, useCallback } from 'react';
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
    <main className='max-w-2xl mx-auto bg-white p-10 m-10 rounded shadow-sm'>
      <h1 className='mb-10'>Form Editor</h1>
      <div className='mb-10'>
        <section className='space-y-3 my-10' aria-label='Content blocks'>
          {state.blocks.map((block) => (
            <BlockRenderer
              key={block.id}
              block={block}
              onChange={handleBlockChange}
              onOptionsChange={handleOptionsChange}
              onRequiredChange={handleRequiredChange}
              onBlockClick={handleBlockClick}
              className='w-full'
            />
          ))}
        </section>
        <hr />
        <div className='flex flex-col items-start space-y-2 my-10'>
          <Button size='sm' onClick={addTextBlock}>
            Add Text Block
          </Button>
          <Button size='sm' onClick={addHeadingBlock}>
            Add Heading Block
          </Button>
          <Button size='sm' onClick={addShortAnswerBlock}>
            Add Short Answer
          </Button>
          <Button size='sm' onClick={addMultipleChoiceBlock}>
            Add Multiple Choice
          </Button>
          <Button size='sm' onClick={addMultiselectBlock}>
            Add Multiselect
          </Button>
        </div>
      </div>
      <hr />
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
