import { forwardRef } from 'react';
import { useContentEditable, useStopPropagation } from '@/hooks';
import { cn } from '@/lib/utils';

interface DescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  placeholder?: string;
  className?: string;
}

export const DescriptionField = forwardRef<
  HTMLDivElement,
  DescriptionFieldProps
>(
  (
    { value, onChange, onKeyDown, placeholder = 'Add description', className },
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
          'block w-full cursor-text text-[14px] break-words text-[rgb(50,48,44)] caret-[rgb(50,48,44)] focus:outline-none',
          'mb-[10px] p-0 leading-[20px]',
          'rounded-md border-0 bg-transparent',
          !currentValue &&
            'empty:[-webkit-text-fill-color:rgba(70,68,64,0.45)] empty:before:content-[attr(data-placeholder)]',
          className,
        )}
        data-placeholder={placeholder}
        role='textbox'
        aria-label='Start typing to edit description'
        tabIndex={0}
      />
    );
  },
);

DescriptionField.displayName = 'DescriptionField';
