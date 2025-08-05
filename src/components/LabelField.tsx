import { forwardRef } from 'react';
import { useContentEditable, useStopPropagation } from '@/hooks';
import { cn } from '@/lib/utils';

interface LabelFieldProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export const LabelField = forwardRef<HTMLDivElement, LabelFieldProps>(
  (
    {
      value,
      onChange,
      onKeyDown,
      required = false,
      placeholder = 'Question name',
      className,
    },
    ref,
  ) => {
    const {
      elementRef,
      handleInput,
      handleCompositionStart,
      handleCompositionEnd,
      handleBlur,
      currentValue,
    } = useContentEditable({
      value,
      onChange,
    });

    const handleClickWithStopPropagation = useStopPropagation();

    // Merge the forwarded ref with our internal ref
    const mergedRef = (node: HTMLDivElement | null) => {
      if (ref) {
        if (typeof ref === 'function') {
          ref(node);
        } else {
          ref.current = node;
        }
      }
      if (elementRef) {
        (elementRef as React.MutableRefObject<HTMLDivElement | null>).current =
          node;
      }
    };

    return (
      <div
        ref={mergedRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onBlur={handleBlur}
        onClick={handleClickWithStopPropagation}
        onKeyDown={onKeyDown}
        className={cn(
          // CRITICAL FOR ARROW NAVIGATION: These CSS classes ensure consistent line detection
          // Consistent layout for precise line detection
          'block w-fit max-w-full cursor-text text-[24px] font-bold break-words text-[rgb(50,48,44)] caret-[rgb(50,48,44)] focus:outline-none',
          // IMPORTANT: leading-[30px] is hardcoded in utils.ts for form block detection
          // DO NOT CHANGE without updating isCursorAtLastLine() form block detection
          'mb-[10px] p-0 leading-[30px]',
          // Border and background for visual consistency
          'rounded-md border-0 bg-transparent',
          // Empty state - use before for placeholder with webkit-text-fill-color
          !currentValue &&
            'empty:[-webkit-text-fill-color:rgba(70,68,64,0.45)] empty:before:content-[attr(data-placeholder)]',
          // After pseudo-element for required asterisk
          required &&
            'after:font-normal after:text-[rgba(70,68,64,0.45)] after:content-["*"]',
          className,
        )}
        data-placeholder={placeholder}
        role='textbox'
        aria-label='Start typing to edit text'
        tabIndex={0}
      />
    );
  },
);

LabelField.displayName = 'LabelField';
