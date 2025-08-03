import { type FC } from 'react';
import { X } from 'lucide-react';

interface MenuHeaderProps {
  title: string;
  onClose?: () => void;
}

export const MenuHeader: FC<MenuHeaderProps> = ({ title, onClose }) => {
  return (
    <div className='flex items-center justify-between px-4 py-2 pt-3 pb-1'>
      <h3 className='text-sm font-semibold text-gray-900'>{title}</h3>
      {onClose && (
        <button
          onClick={onClose}
          className='flex h-[18px] w-[18px] flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-[rgba(55,53,47,0.06)] transition-[background] duration-[20ms] ease-in select-none hover:bg-[rgba(55,53,47,0.16)]'
        >
          <X className='h-3 w-3 text-gray-500' />
        </button>
      )}
    </div>
  );
};