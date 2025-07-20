import { type FC } from 'react';
import { Button } from '@/components/ui/button';
import { BlockRenderer } from '@/components';
import { useBlocks } from '@/hooks';
import { createTextBlock } from '@/lib/blockFactory';
import type { Block } from '@/types';

const INITIAL_BLOCKS: readonly Block[] = [
  createTextBlock('Welcome to the editor!'),
] as const;

const App: FC = () => {
  const { blocks, addTextBlock, updateBlock } = useBlocks(INITIAL_BLOCKS);

  const handleBlockChange = (id: Block['id'], value: string) => {
    updateBlock(id, { title: value });
  };

  return (
    <main className='max-w-screen-xl mx-auto bg-white p-10 m-10 rounded shadow-sm'>
      <h1 className='mb-10'>Form Editor</h1>
      <div className='mb-10'>
        <section className='space-y-3' aria-label='Content blocks'>
          {blocks.map((block) => (
            <BlockRenderer
              key={block.id}
              block={block}
              onChange={handleBlockChange}
              className='w-full'
            />
          ))}
        </section>

        <div className='mt-6'>
          <Button onClick={addTextBlock} variant='default'>
            Add Text Block
          </Button>
        </div>
      </div>
      <hr />
      <div className='my-10 text-sm text-gray-500'>
        <pre>{JSON.stringify(blocks, null, 2)}</pre>
      </div>
    </main>
  );
};

export default App;
