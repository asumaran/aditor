import { type FC } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { BlockWrapper } from './BlockWrapper';
import { getBlockComponent } from '@/lib/componentRegistry';
import type { Block, Option } from '@/types';
import type { FieldChangeHandler } from '@/types/editables';

interface BlockRendererProps {
  block: Block;
  onChange: (id: Block['id'], value: string) => void;
  onFieldChange?: (id: Block['id'], fieldId: string, value: string) => void;
  onOptionsChange?: (id: Block['id'], options: readonly Option[]) => void;
  onBlockClick?: (blockId: Block['id']) => void;
  onRequiredChange?: (blockId: Block['id'], required: boolean) => void;
  onCreateBlockAfter?: (
    afterBlockId: Block['id'],
    options?: {
      initialContent?: string;
      cursorAtStart?: boolean;
      blockType?: string;
    },
  ) => number;
  onChangeBlockType?: (blockId: Block['id'], newType: string) => void;
  onDeleteBlock?: (blockId: Block['id']) => void;
  onMergeWithPrevious?: (blockId: Block['id'], currentContent: string) => void;
  onNavigateToPrevious?: (blockId: Block['id']) => void;
  onNavigateToNext?: (blockId: Block['id']) => void;
  className?: string;
  autoFocus?: boolean;
  cursorAtStart?: boolean;
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

const getBlockSortOrder = (block: Block): 'manual' | 'asc' | 'desc' => {
  switch (block.type) {
    case 'multiple_choice':
      return block.properties.sortOrder;
    case 'multiselect':
      return block.properties.sortOrder;
    default:
      return 'manual';
  }
};

export const BlockRenderer: FC<BlockRendererProps> = ({
  block,
  onChange,
  onFieldChange,
  onOptionsChange,
  onBlockClick,
  onRequiredChange,
  onCreateBlockAfter,
  onChangeBlockType,
  onDeleteBlock,
  onMergeWithPrevious,
  onNavigateToPrevious,
  onNavigateToNext,
  className,
  autoFocus = false,
  cursorAtStart = false,
}) => {
  const Component = getBlockComponent(block.type);

  const handleChange = (value: string) => {
    onChange(block.id, value);
  };

  const handleFieldChange: FieldChangeHandler = (
    fieldId: string,
    value: string,
  ) => {
    if (onFieldChange) {
      onFieldChange(block.id, fieldId, value);
    } else {
      // Fallback to legacy onChange for primary field
      onChange(block.id, value);
    }
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
    onFieldChange: handleFieldChange,
    required: getBlockRequired(block),
    autoFocus: autoFocus,
    cursorAtStart: cursorAtStart,
    onCreateBlockAfter: onCreateBlockAfter
      ? (options?: {
          initialContent?: string;
          cursorAtStart?: boolean;
          blockType?: string;
        }) => onCreateBlockAfter(block.id, options)
      : undefined,
    onChangeBlockType: onChangeBlockType
      ? (blockId: number, newType: string) =>
          onChangeBlockType(blockId, newType)
      : undefined,
    onDeleteBlock: onDeleteBlock ? () => onDeleteBlock(block.id) : undefined,
    onMergeWithPrevious: onMergeWithPrevious
      ? (currentContent: string) =>
          onMergeWithPrevious(block.id, currentContent)
      : undefined,
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
          sortOrder: block.properties.sortOrder,
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
        sortOrder={getBlockSortOrder(block)}
        onRequiredChange={handleRequiredChange}
        onDeleteBlock={
          onDeleteBlock ? () => onDeleteBlock(block.id) : undefined
        }
        className={className}
      >
        {content}
      </BlockWrapper>
    );
  }

  return <>{content}</>;
};
