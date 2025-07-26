import { useState, useRef, useEffect, type FC } from 'react';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useBlockOptions } from '@/hooks';
import { cn } from '@/lib/utils';
import type { Option } from '@/types';

interface OptionsViewProps {
  blockId: number;
  options: readonly Option[];
  onBack: () => void;
}

export const OptionsView: FC<OptionsViewProps> = ({
  blockId,
  options,
  onBack,
}) => {
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [newOptionText, setNewOptionText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { addOption, removeOption, updateOption } = useBlockOptions(blockId);

  useEffect(() => {
    if (isAddingOption && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingOption]);

  const handleAddClick = () => {
    setIsAddingOption(true);
  };

  const handleAddOption = () => {
    if (newOptionText.trim()) {
      addOption(newOptionText.trim());
      setNewOptionText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddOption();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsAddingOption(false);
      setNewOptionText('');
    }
  };

  const handleOptionChange = (optionId: number, text: string) => {
    updateOption(optionId, text);
  };

  const handleRemoveOption = (optionId: number) => {
    removeOption(optionId);
  };

  return (
    <div className='flex h-full w-full flex-col p-0'>
      {/* Header */}
      <div className='flex flex-shrink-0 items-center justify-between border-b p-4'>
        <div className='flex items-center gap-2'>
          <button
            onClick={onBack}
            className='hover:bg-accent rounded-sm p-1 transition-colors'
          >
            <ArrowLeft className='h-4 w-4' />
          </button>
          <span className='font-medium'>Options</span>
        </div>
        <button
          onClick={handleAddClick}
          disabled={isAddingOption}
          className='hover:bg-accent rounded-sm p-1 transition-colors disabled:opacity-50'
        >
          <Plus className='h-4 w-4' />
        </button>
      </div>

      {/* Content */}
      <div className='flex min-h-0 flex-col'>
        {/* Add Option Input */}
        {isAddingOption && (
          <div className='flex-shrink-0 border-b p-4'>
            <input
              ref={inputRef}
              type='text'
              value={newOptionText}
              onChange={(e) => setNewOptionText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!newOptionText.trim()) {
                  setIsAddingOption(false);
                  setNewOptionText('');
                }
              }}
              placeholder='Option text'
              className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none'
            />
          </div>
        )}

        {/* Options List */}
        <div className='max-h-[32rem] overflow-y-auto py-2'>
          {options.map((option) => (
            <OptionItem
              key={option.id}
              option={option}
              onChange={handleOptionChange}
              onRemove={handleRemoveOption}
            />
          ))}
          {options.length === 0 && !isAddingOption && (
            <div className='px-4 py-8 text-center text-sm text-gray-500'>
              No options yet. Click + to add one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface OptionItemProps {
  option: Option;
  onChange: (optionId: number, text: string) => void;
  onRemove: (optionId: number) => void;
}

const OptionItem: FC<OptionItemProps> = ({ option, onChange, onRemove }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(option.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    onChange(option.id, text);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setText(option.text);
      setIsEditing(false);
    }
  };

  return (
    <div className='hover:bg-accent group flex items-center gap-2 px-4 py-2'>
      <div className='flex-1'>
        {isEditing ? (
          <input
            ref={inputRef}
            type='text'
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className='w-full rounded border border-gray-300 px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none'
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className={cn(
              'block cursor-pointer rounded px-2 py-1 text-sm hover:bg-gray-50',
              !option.text && 'text-gray-400 italic',
            )}
          >
            {option.text || 'Empty option'}
          </span>
        )}
      </div>
      <button
        onClick={() => onRemove(option.id)}
        className='rounded p-1 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-100 hover:text-red-600'
      >
        <X className='h-3 w-3' />
      </button>
    </div>
  );
};
