import { useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import {
  useStopPropagation,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BlockComponentProps, Option, BlockHandle } from '@/types';

interface MultiselectBlockProps extends BlockComponentProps {
  value: string;
  onFieldChange: (fieldId: string, value: string) => void;
  options: readonly Option[];
  required?: boolean;
  showDescription?: boolean;
  description?: string;
  className?: string;
  blockId?: number;
  autoFocus?: boolean;
  onNavigateToPrevious?: (blockId: number) => void;
  onNavigateToNext?: (blockId: number) => void;
}

export const MultiselectBlock = forwardRef<BlockHandle, MultiselectBlockProps>(
  (
    {
      value,
      onFieldChange,
      options,
      showDescription = false,
      description = '',
      required = false,
      className,
      blockId,
    },
    ref,
  ) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const descriptionRef = useRef<HTMLDivElement>(null);

    const handleSelectClickWithStopPropagation = useStopPropagation();

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
      <div className={cn('space-y-2', className)} data-block-id={blockId}>
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
  },
);

MultiselectBlock.displayName = 'MultiselectBlock';
