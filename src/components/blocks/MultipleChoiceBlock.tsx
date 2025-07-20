import { type FC, useCallback, useRef, useEffect } from 'react';
import { useContentEditable } from '@/hooks';
import { cn, generateId } from '@/lib/utils';
import type { BlockComponentProps, Option } from '@/types';

interface MultipleChoiceBlockProps extends BlockComponentProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly Option[];
  onOptionsChange: (options: readonly Option[]) => void;
  className?: string;
}

interface OptionItemProps {
  option: Option;
  onChange: (optionId: number, text: string) => void;
  onEnterPress: () => void;
  onRemove: (optionId: number) => void;
  shouldFocus?: boolean;
}

const OptionItem: FC<OptionItemProps> = ({
  option,
  onChange,
  onEnterPress,
  onRemove,
  shouldFocus,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (shouldFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [shouldFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEnterPress();
    }
  };

  const handleBlur = () => {
    if (option.text.trim() === '') {
      onRemove(option.id);
    }
  };

  return (
    <div className='flex items-center space-x-2'>
      <input
        type='radio'
        name='multiple-choice-preview'
        className='h-4 w-4 text-blue-600'
        disabled
      />
      <input
        ref={inputRef}
        type='text'
        value={option.text}
        onChange={(e) => onChange(option.id, e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className='flex-1 p-1 border-none outline-none focus:bg-gray-50 rounded'
        placeholder='Option text'
      />
    </div>
  );
};

export const MultipleChoiceBlock: FC<MultipleChoiceBlockProps> = ({
  value,
  onChange,
  options,
  onOptionsChange,
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

  const addOption = useCallback(() => {
    const newOption: Option = {
      id: generateId(),
      text: '',
    };
    onOptionsChange([...options, newOption]);
  }, [options, onOptionsChange]);

  const updateOption = useCallback(
    (optionId: number, text: string) => {
      onOptionsChange(
        options.map((option) =>
          option.id === optionId ? { ...option, text } : option,
        ),
      );
    },
    [options, onOptionsChange],
  );

  const removeOption = useCallback(
    (optionId: number) => {
      onOptionsChange(options.filter((option) => option.id !== optionId));
    },
    [options, onOptionsChange],
  );

  const handleEnterPress = useCallback(() => {
    addOption();
  }, [addOption]);

  return (
    <div className={cn('space-y-3', className)}>
      <div
        ref={elementRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onBlur={handleBlur}
        className={cn(
          'min-h-[1.5rem] p-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500',
          !currentValue && 'text-gray-400',
        )}
        data-placeholder='Question label'
      />

      <div className='space-y-2'>
        {options.map((option, index) => (
          <OptionItem
            key={option.id}
            option={option}
            onChange={updateOption}
            onEnterPress={handleEnterPress}
            onRemove={removeOption}
            shouldFocus={index === options.length - 1 && option.text === ''}
          />
        ))}

        <button
          type='button'
          onClick={addOption}
          className='text-blue-600 hover:text-blue-800 text-sm font-medium'
        >
          Add option
        </button>
      </div>
    </div>
  );
};
