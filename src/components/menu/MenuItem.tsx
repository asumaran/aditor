import { type FC, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MenuItemProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'danger';
  rightElement?: ReactNode;
  className?: string;
}

export const MenuItem: FC<MenuItemProps> = ({
  icon,
  label,
  onClick,
  variant = 'default',
  rightElement,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex min-h-[28px] cursor-pointer items-center justify-between rounded-sm px-2 transition-colors',
        variant === 'default' && 'hover:bg-gray-100',
        variant === 'danger' && 'hover:bg-red-50',
        className,
      )}
      onClick={onClick}
    >
      <div className='flex items-center gap-2'>
        <div
          className={cn(
            variant === 'default' && 'text-gray-600',
            variant === 'danger' && 'text-red-600',
          )}
        >
          {icon}
        </div>
        <span
          className={cn(
            'text-sm',
            variant === 'default' && 'text-gray-900',
            variant === 'danger' && 'text-red-600',
          )}
        >
          {label}
        </span>
      </div>
      {rightElement && <div>{rightElement}</div>}
    </div>
  );
};
