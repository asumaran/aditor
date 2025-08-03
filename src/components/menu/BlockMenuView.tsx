import { type FC } from 'react';
import { Database, Trash2, Asterisk } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { MenuItem } from './MenuItem';
import { MenuHeader } from './MenuHeader';
import type { BlockType } from '@/types';

interface BlockMenuViewProps {
  blockType: BlockType;
  required?: boolean;
  optionsCount?: number;
  onRequiredChange?: (required: boolean) => void;
  onOptionsClick?: () => void;
  onDeleteClick?: () => void;
  onClose?: () => void;
}

export const BlockMenuView: FC<BlockMenuViewProps> = ({
  blockType,
  required = false,
  optionsCount = 0,
  onRequiredChange,
  onOptionsClick,
  onDeleteClick,
  onClose,
}) => {
  const hasOptionsSupport =
    blockType === 'multiple_choice' || blockType === 'multiselect';

  const handleRequiredToggle = () => {
    onRequiredChange?.(!required);
  };

  return (
    <div>
      <MenuHeader title="Question options" onClose={onClose} />

      <div className='p-2'>
        <MenuItem
          icon={<Asterisk className='h-4 w-4' />}
          label="Required"
          onClick={handleRequiredToggle}
          rightElement={
            <Switch
              checked={required}
              onCheckedChange={onRequiredChange}
              onClick={(e) => e.stopPropagation()}
            />
          }
        />

        {hasOptionsSupport && (
          <MenuItem
            icon={<Database className='h-4 w-4' />}
            label="Edit options"
            onClick={onOptionsClick}
            rightElement={
              <span className='text-xs text-gray-500'>{optionsCount}</span>
            }
          />
        )}

        <MenuItem
          icon={<Trash2 className='h-4 w-4' />}
          label="Delete question"
          onClick={onDeleteClick}
          variant="danger"
        />
      </div>
    </div>
  );
};