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
    <div className='w-full p-0 h-full flex flex-col'>
      {/* Header */}
      <div className='flex items-center justify-between p-4 border-b flex-shrink-0'>
        <div className='flex items-center gap-2'>
          <button
            onClick={onBack}
            className='p-1 hover:bg-accent rounded-sm transition-colors'
          >
            <ArrowLeft className='h-4 w-4' />
          </button>
          <span className='font-medium'>Options</span>
        </div>
        <button
          onClick={handleAddClick}
          disabled={isAddingOption}
          className='p-1 hover:bg-accent rounded-sm transition-colors disabled:opacity-50'
        >
          <Plus className='h-4 w-4' />
        </button>
      </div>

      {/* Content */}
      <div className='flex flex-col min-h-0'>
        {/* Add Option Input */}
        {isAddingOption && (
          <div className='p-4 border-b flex-shrink-0'>
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
              className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>
        )}

        {/* Options List */}
        <div className='py-2 overflow-y-auto max-h-[32rem]'>
          {options.map((option) => (
            <OptionItem
              key={option.id}
              option={option}
              onChange={handleOptionChange}
              onRemove={handleRemoveOption}
            />
          ))}
          {options.length === 0 && !isAddingOption && (
            <div className='px-4 py-8 text-center text-gray-500 text-sm'>
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
    <div className='flex items-center gap-2 px-4 py-2 hover:bg-accent group'>
      <div className='flex-1'>
        {isEditing ? (
          <input
            ref={inputRef}
            type='text'
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className='w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className={cn(
              'block px-2 py-1 text-sm cursor-pointer hover:bg-gray-50 rounded',
              !option.text && 'text-gray-400 italic',
            )}
          >
            {option.text || 'Empty option'}
          </span>
        )}
      </div>
      <button
        onClick={() => onRemove(option.id)}
        className='p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 rounded transition-all'
      >
        <X className='h-3 w-3' />
      </button>
    </div>
  );
};
