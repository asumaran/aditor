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
import type { BlockComponentProps, Option } from '@/types';

interface MultiselectBlockProps extends BlockComponentProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly Option[];
  required?: boolean;
  className?: string;
}

export const MultiselectBlock: FC<MultiselectBlockProps> = ({
  value,
  onChange,
  options,
  required = false,
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
      <div className='flex items-center'>
        <div
          ref={elementRef as React.RefObject<HTMLDivElement>}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onBlur={handleBlur}
          onClick={handleClickWithStopPropagation}
          className={cn(
            'min-h-[1.5rem] w-fit cursor-text rounded p-1 font-bold focus:ring-1 focus:ring-blue-500 focus:outline-none',
            !currentValue && 'text-gray-400',
          )}
          data-placeholder='Select label'
        />
        {required && (
          <span className='ml-1 text-red-500' aria-label='Required field'>
            *
          </span>
        )}
      </div>
      <Select>
        <SelectTrigger
          className='w-full'
          onClick={handleSelectClickWithStopPropagation}
        >
          <SelectValue placeholder='Select an option' />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id.toString()}>
              {option.text || 'Empty option'}
            </SelectItem>
          ))}
          {options.length === 0 && (
            <SelectItem value='no-options' disabled>
              No options available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
