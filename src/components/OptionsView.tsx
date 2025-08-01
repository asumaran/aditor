import { useState, useRef, useEffect, type FC } from 'react';
import {
  ArrowLeft,
  X,
  Trash2,
  GripVertical,
  ArrowDownUp,
  Plus,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useBlockOptions } from '@/hooks';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Option } from '@/types';

interface OptionsViewProps {
  blockId: number;
  options: readonly Option[];
  onBack: () => void;
  onClose?: () => void;
  sortOrder: 'manual' | 'asc' | 'desc';
}

export const OptionsView: FC<OptionsViewProps> = ({
  blockId,
  options,
  onBack,
  onClose,
  sortOrder,
}) => {
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [newOptionText, setNewOptionText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    addOption,
    removeOption,
    updateOption,
    reorderOptions,
    changeSortOrder,
  } = useBlockOptions(blockId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = options.findIndex(
        (option) => option.id.toString() === active.id,
      );
      const newIndex = options.findIndex(
        (option) => option.id.toString() === over.id,
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOptions = arrayMove([...options], oldIndex, newIndex);
        reorderOptions(newOptions, true); // preserveOrder = true

        // Switch to manual mode when user manually sorts
        if (sortOrder !== 'manual') {
          changeSortOrder('manual');
        }
      }
    }
  };

  useEffect(() => {
    if (isAddingOption && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingOption]);

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

  const handleShowInput = () => {
    setIsAddingOption(true);
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
      <div className='flex items-center justify-between px-4 py-2 pt-3 pb-1'>
        <div className='flex items-center gap-2'>
          <button
            onClick={onBack}
            className='cursor-pointer rounded-sm transition-colors'
          >
            <ArrowLeft className='h-4 w-4 text-gray-600' />
          </button>
          <h3 className='text-sm font-semibold text-gray-900'>Edit options</h3>
        </div>
        <button
          onClick={onClose}
          className='flex h-[18px] w-[18px] flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-[rgba(55,53,47,0.06)] transition-[background] duration-[20ms] ease-in select-none hover:bg-[rgba(55,53,47,0.16)]'
        >
          <X className='h-3 w-3 text-gray-500' />
        </button>
      </div>

      {/* Content */}
      <div className='flex min-h-0 flex-col'>
        {/* Sort Section */}
        <div className='flex-shrink-0 px-4 pt-2 pb-0'>
          <div className='flex items-center justify-between pb-2'>
            <div className='flex items-center gap-2'>
              <ArrowDownUp className='h-4 w-4 text-gray-600' />
              <label htmlFor='sort-select' className='text-sm text-gray-900'>
                Sort
              </label>
            </div>
            <Select
              value={sortOrder}
              onValueChange={(value) => {
                changeSortOrder(value as 'manual' | 'asc' | 'desc');
              }}
            >
              <SelectTrigger id='sort-select' size='sm'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='manual'>Manual</SelectItem>
                <SelectItem value='asc'>A to Z</SelectItem>
                <SelectItem value='desc'>Z to A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Add Option Section */}
        <div className='flex-shrink-0 px-4 py-2 pb-0'>
          <div className='mb-2 flex min-h-6 items-center justify-between'>
            <h3 className='text-xs font-bold text-[rgb(115,114,110)]'>
              Options
            </h3>
            {!isAddingOption && (
              <button
                onClick={handleShowInput}
                className='flex h-6 w-6 items-center justify-center rounded hover:bg-gray-100'
              >
                <Plus className='h-4 w-4 text-gray-600' />
              </button>
            )}
          </div>
          {isAddingOption && (
            <div className='flex items-center gap-2'>
              <Input
                ref={inputRef}
                type='text'
                value={newOptionText}
                onChange={(e) => setNewOptionText(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                placeholder='Type a new option…'
                className='rounded-sm'
              />
            </div>
          )}
        </div>

        {/* Options List */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToFirstScrollableAncestor]}
        >
          <div className='max-h-[25rem] overflow-y-auto p-2 pt-1'>
            <SortableContext
              items={options.map((option) => option.id.toString())}
              strategy={verticalListSortingStrategy}
            >
              {options.map((option) => (
                <SortableOptionItem
                  key={option.id}
                  option={option}
                  onChange={handleOptionChange}
                  onRemove={handleRemoveOption}
                />
              ))}
            </SortableContext>
            {options.length === 0 && (
              <div className='px-2 py-8 text-center text-sm text-gray-500'>
                No options yet.
              </div>
            )}
          </div>
        </DndContext>
      </div>
    </div>
  );
};

interface OptionItemProps {
  option: Option;
  onChange: (optionId: number, text: string) => void;
  onRemove: (optionId: number) => void;
}

type SortableOptionItemProps = OptionItemProps;

const SortableOptionItem: FC<SortableOptionItemProps> = ({
  option,
  onChange,
  onRemove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <OptionItem
        option={option}
        onChange={onChange}
        onRemove={onRemove}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

const OptionItem: FC<
  OptionItemProps & { dragHandleProps?: Record<string, unknown> }
> = ({ option, onChange, onRemove, dragHandleProps }) => {
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
    <div className='group flex items-center rounded px-1 py-0.5 hover:bg-gray-100'>
      <div className='cursor-grab touch-none' {...dragHandleProps}>
        <GripVertical className='h-4 w-4 text-gray-400' />
      </div>
      <div className='flex-1'>
        {isEditing ? (
          <Input
            ref={inputRef}
            type='text'
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className='h-7 rounded-sm px-2 py-1 text-sm'
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
        className='rounded p-1 text-red-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-100'
      >
        <Trash2 className='h-3 w-3' />
      </button>
    </div>
  );
};
