import { type FC } from 'react';
import { useContentEditable, useStopPropagation } from '@/hooks';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BlockComponentProps } from '@/types';

interface MultiselectBlockProps extends BlockComponentProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const MultiselectBlock: FC<MultiselectBlockProps> = ({
  value,
  onChange,
  className,
}) => {
  const {
    elementRef,
    handleInput,
    handleCompositionStart,
    handleCompositionEnd,
    handleBlur,
    currentValue,
  } = useContentEditable({ value, onChange });

  const handleClickWithStopPropagation = useStopPropagation();
  const handleSelectClickWithStopPropagation = useStopPropagation();

  return (
    <div className={cn('space-y-2', className)}>
      <div
        ref={elementRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onBlur={handleBlur}
        onClick={handleClickWithStopPropagation}
        className={cn(
          'min-h-[1.5rem] p-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-fit cursor-text font-bold',
          !currentValue && 'text-gray-400',
        )}
        data-placeholder='Select label'
      />
      <Select>
        <SelectTrigger
          className='w-full'
          onClick={handleSelectClickWithStopPropagation}
        >
          <SelectValue placeholder='Select an option' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='option1'>Option 1</SelectItem>
          <SelectItem value='option2'>Option 2</SelectItem>
          <SelectItem value='option3'>Option 3</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
