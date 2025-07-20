import { type FC } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { getBlockComponent } from '@/lib/componentRegistry';
import type { Block } from '@/types';

interface BlockRendererProps {
  block: Block;
  onChange: (id: Block['id'], value: string) => void;
  className?: string;
}

export const BlockRenderer: FC<BlockRendererProps> = ({ 
  block, 
  onChange, 
  className 
}) => {
  const Component = getBlockComponent(block.type);
  
  const handleChange = (value: string) => {
    onChange(block.id, value);
  };

  return (
    <ErrorBoundary
      fallback={
        <div className="p-2 border border-red-200 rounded bg-red-50 text-red-600 text-sm">
          Error rendering block: {block.type}
        </div>
      }
    >
      <Component
        value={block.properties.title}
        onChange={handleChange}
        className={className}
      />
    </ErrorBoundary>
  );
};