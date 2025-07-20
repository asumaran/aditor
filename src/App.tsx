import { useState, useCallback, type FC } from 'react';
import { Button } from '@/components/ui/button';
import { generateId } from '@/lib/utils';
import type { Block, BlockType, BlockComponentProps } from '@/types';

const INITIAL_BLOCKS: readonly Block[] = [
  {
    id: 1,
    type: 'text',
    properties: {
      title: 'foo',
    },
  },
] as const;

const TextBlock: FC<BlockComponentProps> = ({ children }) => {
  return <div contentEditable={true}>{children}</div>;
};

const COMPONENT_REGISTRY = {
  text: TextBlock,
} as const satisfies Record<BlockType, FC<BlockComponentProps>>;

const App: FC = () => {
  const [blocks, setBlocks] = useState<readonly Block[]>(INITIAL_BLOCKS);

  const addTextBlock = useCallback(() => {
    const newBlock: Block = {
      id: generateId(),
      type: 'text',
      properties: {
        title: 'bar',
      },
    };

    setBlocks((prevBlocks) => [...prevBlocks, newBlock]);
  }, []);

  return (
    <main className='max-w-screen-xl mx-auto bg-white p-10 m-10 rounded shadow-sm'>
      <h1>Form Editor</h1>
      <hr />
      <div className='mb-10'>
        <section className='space-y-3' aria-label='Content blocks'>
          {blocks.map((block) => {
            const Component = COMPONENT_REGISTRY[block.type];
            return (
              <Component key={block.id}>{block.properties.title}</Component>
            );
          })}
        </section>

        <div className='mt-6'>
          <Button onClick={addTextBlock}>Add new component</Button>
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
