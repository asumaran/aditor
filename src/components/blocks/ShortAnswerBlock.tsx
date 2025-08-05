import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
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
import type { BlockComponentProps, BlockHandle } from '@/types';
import type { FieldChangeHandler } from '@/types/editables';

interface ShortAnswerBlockProps extends BlockComponentProps {
  value: string;
  onFieldChange: FieldChangeHandler;
  required?: boolean;
  showDescription?: boolean;
  description?: string;
  className?: string;
  blockId?: number;
  autoFocus?: boolean;
  onNavigateToPrevious?: (blockId: number) => void;
  onNavigateToNext?: (blockId: number) => void;
}

export const ShortAnswerBlock = forwardRef<BlockHandle, ShortAnswerBlockProps>(
  (
    {
      value,
      onFieldChange,
      required = false,
      showDescription = false,
      description = '',
      className,
      blockId,
    },
    ref,
  ) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const descriptionRef = useRef<HTMLDivElement>(null);
    const handleInputClickWithStopPropagation = useStopPropagation();

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
      <div
        className={cn('w-full space-y-2', className)}
        data-block-id={blockId}
      >
        <LabelField
          ref={elementRef}
          value={value}
          onChange={(newValue) => onFieldChange?.('label', newValue)}
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
        <input
          type='text'
          placeholder='Short answer text'
          onClick={handleInputClickWithStopPropagation}
          className='w-full rounded-md border border-gray-300 p-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none'
        />
      </div>
    );
  },
);

ShortAnswerBlock.displayName = 'ShortAnswerBlock';
