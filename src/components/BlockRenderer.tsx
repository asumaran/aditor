import { type FC } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { BlockWrapper } from './BlockWrapper';
import { getBlockComponent } from '@/lib/componentRegistry';
import type { Block, Option } from '@/types';

interface BlockRendererProps {
  block: Block;
  onChange: (id: Block['id'], value: string) => void;
  onOptionsChange?: (id: Block['id'], options: readonly Option[]) => void;
  onBlockClick?: (blockId: Block['id']) => void;
  onRequiredChange?: (blockId: Block['id'], required: boolean) => void;
  onCreateBlockAfter?: (afterBlockId: Block['id']) => number;
  onDeleteBlock?: (blockId: Block['id']) => void;
  onNavigateToPrevious?: (blockId: Block['id']) => void;
  onNavigateToNext?: (blockId: Block['id']) => void;
  className?: string;
  autoFocus?: boolean;
}

const getBlockValue = (block: Block): string => {
  switch (block.type) {
    case 'text':
    case 'heading':
      return block.properties.title;
    case 'short_answer':
      return block.properties.label;
    case 'multiple_choice':
      return block.properties.label;
    case 'multiselect':
      return block.properties.label;
    default:
      return '';
  }
};

const getBlockRequired = (block: Block): boolean => {
  switch (block.type) {
    case 'short_answer':
      return block.properties.required;
    case 'multiple_choice':
      return block.properties.required;
    case 'multiselect':
      return block.properties.required;
    default:
      return false;
  }
};

const getBlockOptions = (block: Block): readonly Option[] => {
  switch (block.type) {
    case 'multiple_choice':
      return block.properties.options;
    case 'multiselect':
      return block.properties.options;
    default:
      return [];
  }
};

export const BlockRenderer: FC<BlockRendererProps> = ({
  block,
  onChange,
  onOptionsChange,
  onBlockClick,
  onRequiredChange,
  onCreateBlockAfter,
  onDeleteBlock,
  onNavigateToPrevious,
  onNavigateToNext,
  className,
  autoFocus = false,
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

  const handleBlockClick = () => {
    if (onBlockClick) {
      onBlockClick(block.id);
    }
  };

  const handleRequiredChange = (required: boolean) => {
    if (onRequiredChange) {
      onRequiredChange(block.id, required);
    }
  };

  const commonProps = {
    value: getBlockValue(block),
    onChange: handleChange,
    required: getBlockRequired(block),
    autoFocus: autoFocus && (block.type === 'text' || block.type === 'heading'),
    onCreateBlockAfter: onCreateBlockAfter
      ? () => onCreateBlockAfter(block.id)
      : undefined,
    onDeleteBlock: onDeleteBlock ? () => onDeleteBlock(block.id) : undefined,
    onNavigateToPrevious: onNavigateToPrevious
      ? () => onNavigateToPrevious(block.id)
      : undefined,
    onNavigateToNext: onNavigateToNext
      ? () => onNavigateToNext(block.id)
      : undefined,
    blockId: block.id,
  };

  const specificProps =
    block.type === 'multiple_choice'
      ? {
          ...commonProps,
          options: block.properties.options,
          onOptionsChange: handleOptionsChange,
          blockId: block.id,
        }
      : block.type === 'multiselect'
        ? {
            ...commonProps,
            options: block.properties.options,
          }
        : commonProps;

  const isFormBlock = [
    'short_answer',
    'multiple_choice',
    'multiselect',
  ].includes(block.type);

  const content = (
    <ErrorBoundary
      fallback={
        <div className='rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600'>
          Error rendering block: {block.type}
        </div>
      }
    >
      <Component {...specificProps} />
    </ErrorBoundary>
  );

  if (isFormBlock) {
    return (
      <BlockWrapper
        onBlockClick={handleBlockClick}
        blockType={block.type}
        blockId={block.id}
        required={getBlockRequired(block)}
        options={getBlockOptions(block)}
        onRequiredChange={handleRequiredChange}
        className={className}
      >
        {content}
      </BlockWrapper>
    );
  }

  return <>{content}</>;
};
