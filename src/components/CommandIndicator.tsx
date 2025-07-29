import { type FC } from 'react';
import { cn } from '@/lib/utils';

interface CommandIndicatorProps {
  type: 'slash' | 'mention'; // Extensible para futuros comandos
  query?: string;
  className?: string;
  placeholder?: string;
}

const COMMAND_CONFIG = {
  slash: {
    symbol: '/',
    placeholder: 'Filter...',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
  },
  mention: {
    symbol: '@',
    placeholder: 'User...',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
  },
} as const;

export const CommandIndicator: FC<CommandIndicatorProps> = ({
  type,
  query = '',
  className,
  placeholder: customPlaceholder,
}) => {
  const config = COMMAND_CONFIG[type];
  const placeholderText = customPlaceholder || config.placeholder;

  return (
    <span
      className={cn(
        'mr-1 inline-flex items-center rounded px-1 py-0.5',
        'font-medium',
        config.bgColor,
        config.textColor,
        className,
      )}
      contentEditable={false}
    >
      <span className='font-medium'>{config.symbol}</span>
      {query && <span>{query}</span>}
      {!query && <span className='text-gray-400'>{placeholderText}</span>}
    </span>
  );
};
