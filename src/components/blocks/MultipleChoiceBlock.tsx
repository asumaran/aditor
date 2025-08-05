import {
  type FC,
  useCallback,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useState,
} from 'react';
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
import { GripVertical } from 'lucide-react';
import {
  useContentEditable,
  useStopPropagation,
  useBlockOptions,
  useBlockCommands,
  useBlockNavigation,
} from '@/hooks';
import { cn } from '@/lib/utils';
import {
  createDownNavigationCommand,
  createUpNavigationCommand,
} from '@/lib/fieldNavigation';
import { DescriptionField } from '@/components/DescriptionField';
import { LabelField } from '@/components/LabelField';
import type { BlockComponentProps, Option, BlockHandle } from '@/types';

interface MultipleChoiceBlockProps extends BlockComponentProps {
  value: string;
  onFieldChange: (fieldId: string, value: string) => void;
  options: readonly Option[];
  required?: boolean;
  showDescription?: boolean;
  description?: string;
  blockId: number;
  className?: string;
  autoFocus?: boolean;
  sortOrder?: 'manual' | 'asc' | 'desc';
  onNavigateToPrevious?: (blockId: number) => void;
  onNavigateToNext?: (blockId: number) => void;
}

interface OptionItemProps {
  option: Option;
  onChange: (optionId: number, text: string) => void;
  onEnterPress: () => void;
  onRemove: (optionId: number) => void;
  blockId: number;
  isDraggable?: boolean;
  dragHandleProps?: Record<string, unknown>;
}

const OptionItem: FC<OptionItemProps> = ({
  option,
  onChange,
  onEnterPress,
  onRemove,
  isDraggable = false,
  dragHandleProps,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Always call onEnterPress to show new option input
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
  };

  const handleClick = useStopPropagation();

  return (
    <div
      className='flex items-center'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isDraggable && (
        <div
          className={cn(
            'cursor-grab touch-none px-1 transition-opacity',
            isHovered ? 'opacity-100' : 'opacity-0',
          )}
          {...dragHandleProps}
        >
          <GripVertical className='h-4 w-4 text-gray-400' />
        </div>
      )}
      <div className='flex flex-1 items-center space-x-2'>
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
    </div>
  );
};

type SortableOptionItemProps = Omit<OptionItemProps, 'dragHandleProps'>;

const SortableOptionItem: FC<SortableOptionItemProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.option.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <OptionItem
        {...props}
        isDraggable={true}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

export const MultipleChoiceBlock = forwardRef<
  BlockHandle,
  MultipleChoiceBlockProps
>(
  (
    {
      value,
      onFieldChange,
      options,
      required = false,
      showDescription = false,
      description = '',
      blockId,
      className,
      sortOrder = 'manual',
    },
    ref,
  ) => {
    const [showNewOption, setShowNewOption] = useState(false);
    const [newOptionText, setNewOptionText] = useState('');
    const newOptionRef = useRef<HTMLInputElement>(null);

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
    const elementRef = useRef<HTMLDivElement>(null);
    const descriptionRef = useRef<HTMLDivElement>(null);

    const blockOptions = useBlockOptions(blockId);

    const handleDragEnd = useCallback(
      (event: DragEndEvent) => {
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
            blockOptions.reorderOptions(newOptions, true); // preserveOrder = true

            // Switch to manual mode when user manually sorts
            if (sortOrder !== 'manual') {
              blockOptions.changeSortOrder('manual');
            }
          }
        }
      },
      [options, blockOptions, sortOrder],
    );

    const addOption = useCallback(() => {
      setShowNewOption(true);
      setNewOptionText('');
      // Focus the new option input after render
      setTimeout(() => {
        newOptionRef.current?.focus();
      }, 0);
    }, []);

    const handleAddOptionClick = useStopPropagation(() => {
      addOption();
    });

    const updateOption = useCallback(
      (optionId: number, text: string) => {
        blockOptions.updateOption(optionId, text);
      },
      [blockOptions],
    );

    const removeOption = useCallback(
      (optionId: number) => {
        blockOptions.removeOption(optionId);
      },
      [blockOptions],
    );

    const handleNewOptionKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (newOptionText.trim()) {
            // Add the option through the store (will apply sorting)
            blockOptions.addOption(newOptionText.trim());
            // Reset and show input again for next option
            setNewOptionText('');
            newOptionRef.current?.focus();
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setShowNewOption(false);
          setNewOptionText('');
        }
      },
      [newOptionText, blockOptions],
    );

    const handleNewOptionBlur = useCallback(() => {
      if (newOptionText.trim()) {
        blockOptions.addOption(newOptionText.trim());
      }
      setShowNewOption(false);
      setNewOptionText('');
    }, [newOptionText, blockOptions]);

    const handleEnterPress = useCallback(() => {
      // Show the new option input and focus it
      addOption();
    }, [addOption]);

    // Navigation commands for label field
    const { navigationCommands } = useBlockNavigation({
      blockId,
      elementRef,
      isSlashInputMode: false,
    });

    // Navigation commands for description field
    const { navigationCommands: descriptionNavigationCommands } =
      useBlockNavigation({
        blockId,
        elementRef: descriptionRef,
        isSlashInputMode: false,
      });

    // Enhanced commands for label field with internal navigation
    const commands = useMemo(
      () => [
        // Add downward navigation from label to description when showDescription is true
        ...(showDescription
          ? [createDownNavigationCommand(elementRef, descriptionRef)]
          : []),
        ...navigationCommands,
      ],
      [navigationCommands, showDescription, descriptionRef, elementRef],
    );

    // Enhanced commands for description field with internal navigation
    const descriptionCommands = useMemo(
      () => [
        // Add upward navigation from description to label
        createUpNavigationCommand(descriptionRef, elementRef),
        ...descriptionNavigationCommands,
      ],
      [descriptionNavigationCommands, elementRef, descriptionRef],
    );

    const { handleKeyDown } = useBlockCommands({ commands });
    const { handleKeyDown: handleDescriptionKeyDown } = useBlockCommands({
      commands: descriptionCommands,
    });

    // Expose focus method to parent
    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          // Focus the first editable element (the label in this case)
          elementRef.current?.focus();
        },
      }),
      [elementRef],
    );

    return (
      <div className={cn('space-y-3', className)} data-block-id={blockId}>
        <LabelField
          ref={elementRef}
          value={value}
          onChange={(newValue) => onFieldChange('label', newValue)}
          onKeyDown={handleKeyDown}
          required={required}
        />
        {showDescription && (
          <DescriptionField
            ref={descriptionRef}
            value={description}
            onChange={(newValue) => onFieldChange?.('description', newValue)}
            onKeyDown={handleDescriptionKeyDown}
          />
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToFirstScrollableAncestor]}
        >
          <div className='space-y-2'>
            <SortableContext
              items={options.map((option) => option.id.toString())}
              strategy={verticalListSortingStrategy}
            >
              {options.map((option) => (
                <SortableOptionItem
                  key={option.id}
                  option={option}
                  onChange={updateOption}
                  onEnterPress={handleEnterPress}
                  onRemove={removeOption}
                  blockId={blockId}
                />
              ))}
            </SortableContext>

            {showNewOption && (
              <div className='flex items-center space-x-2'>
                <input
                  type='radio'
                  name='multiple-choice-preview'
                  className='h-4 w-4 text-blue-600'
                  disabled
                />
                <input
                  ref={newOptionRef}
                  type='text'
                  value={newOptionText}
                  onChange={(e) => setNewOptionText(e.target.value)}
                  onKeyDown={handleNewOptionKeyDown}
                  onBlur={handleNewOptionBlur}
                  className='flex-1 cursor-text rounded border-none p-1 outline-none focus:bg-gray-50'
                  placeholder='Option text'
                />
              </div>
            )}

            {!showNewOption && (
              <button
                type='button'
                onClick={handleAddOptionClick}
                className='text-sm font-medium text-blue-600 hover:text-blue-800'
              >
                Add option
              </button>
            )}
          </div>
        </DndContext>
      </div>
    );
  },
);

MultipleChoiceBlock.displayName = 'MultipleChoiceBlock';
