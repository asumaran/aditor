import { type FC } from 'react';
import { X, ArrowLeft } from 'lucide-react';

interface MenuHeaderProps {
  title: string;
  onClose?: () => void;
  onBack?: () => void;
}

export const MenuHeader: FC<MenuHeaderProps> = ({ title, onClose, onBack }) => {
  return (
    <div className='flex h-[42px] items-center px-4 pt-[14px] pb-[6px]'>
      {onBack && (
        <button
          onClick={onBack}
          className='mr-2 cursor-pointer rounded-sm transition-colors'
        >
          <ArrowLeft className='h-4 w-4 text-gray-600' />
        </button>
      )}
      <h3 className='flex-grow overflow-hidden text-[14px] font-semibold text-ellipsis whitespace-nowrap'>
        {title}
      </h3>
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
