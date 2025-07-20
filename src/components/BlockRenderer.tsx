import { type FC } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { getBlockComponent } from '@/lib/componentRegistry';
import type { Block, Option } from '@/types';

interface BlockRendererProps {
  block: Block;
  onChange: (id: Block['id'], value: string) => void;
  onOptionsChange?: (id: Block['id'], options: readonly Option[]) => void;
  className?: string;
}

const getBlockValue = (block: Block): string => {
  switch (block.type) {
    case 'text':
      return block.properties.title;
    case 'short_answer':
      return block.properties.label;
    case 'multiple_choice':
      return block.properties.label;
    default:
      return '';
  }
};

export const BlockRenderer: FC<BlockRendererProps> = ({
  block,
  onChange,
  onOptionsChange,
  className,
}) => {
  const Component = getBlockComponent(block.type);

  const handleChange = (value: string) => {
    onChange(block.id, value);
  };

  const handleOptionsChange = (options: readonly Option[]) => {
    if (onOptionsChange) {
      onOptionsChange(block.id, options);
    }
  };

  const commonProps = {
    value: getBlockValue(block),
    onChange: handleChange,
    className,
  };

  const specificProps = block.type === 'multiple_choice' 
    ? {
        ...commonProps,
        options: block.properties.options,
        onOptionsChange: handleOptionsChange,
      }
    : commonProps;

  return (
    <ErrorBoundary
      fallback={
        <div className='p-2 border border-red-200 rounded bg-red-50 text-red-600 text-sm'>
          Error rendering block: {block.type}
        </div>
      }
    >
      <Component {...specificProps} />
    </ErrorBoundary>
  );
};
