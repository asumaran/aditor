import { type FC, useCallback, useRef, useEffect } from 'react';
import {
  useContentEditable,
  useStopPropagation,
  useBlockOptions,
} from '@/hooks';
import { cn, generateId } from '@/lib/utils';
import type { BlockComponentProps, Option } from '@/types';

interface MultipleChoiceBlockProps extends BlockComponentProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly Option[];
  onOptionsChange: (options: readonly Option[]) => void;
  required?: boolean;
  blockId: number;
  className?: string;
}

interface OptionItemProps {
  option: Option;
  onChange: (optionId: number, text: string) => void;
  onEnterPress: () => void;
  onRemove: (optionId: number) => void;
  shouldFocus?: boolean;
  blockId: number;
}

const OptionItem: FC<OptionItemProps> = ({
  option,
  onChange,
  onEnterPress,
  onRemove,
  shouldFocus,
  blockId,
}) => {
  const blockOptions = useBlockOptions(blockId!);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    onChange(option.id, newText);
    blockOptions.updateOption(option.id, newText);
  };

  const handleClick = useStopPropagation();

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
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onClick={handleClick}
        className='flex-1 cursor-text rounded border-none p-1 outline-none focus:bg-gray-50'
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
  required = false,
  blockId,
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

  const addOption = useCallback(() => {
    const newOption: Option = {
      id: generateId(),
      text: '',
    };
    onOptionsChange([...options, newOption]);
  }, [options, onOptionsChange]);

  const handleAddOptionClick = useStopPropagation(() => {
    addOption();
  });

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
          data-placeholder='Question label'
        />
        {required && (
          <span className='ml-1 text-red-500' aria-label='Required field'>
            *
          </span>
        )}
      </div>

      <div className='space-y-2'>
        {options.map((option, index) => (
          <OptionItem
            key={option.id}
            option={option}
            onChange={updateOption}
            onEnterPress={handleEnterPress}
            onRemove={removeOption}
            shouldFocus={index === options.length - 1 && option.text === ''}
            blockId={blockId}
          />
        ))}

        <button
          type='button'
          onClick={handleAddOptionClick}
          className='text-sm font-medium text-blue-600 hover:text-blue-800'
        >
          Add option
        </button>
      </div>
    </div>
  );
};
