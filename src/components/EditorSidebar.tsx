import type { FC } from 'react';
import { Button } from '@/components/ui/button';

interface EditorSidebarProps {
  onAddTextBlock: () => void;
  onAddHeadingBlock: () => void;
  onAddShortAnswerBlock: () => void;
  onAddMultipleChoiceBlock: () => void;
  onAddMultiselectBlock: () => void;
}

export const EditorSidebar: FC<EditorSidebarProps> = ({
  onAddTextBlock,
  onAddHeadingBlock,
  onAddShortAnswerBlock,
  onAddMultipleChoiceBlock,
  onAddMultiselectBlock,
}) => {
  return (
    <div className='w-40 shrink basis-50 bg-gray-100'>
      <div className='flex flex-col items-start space-y-1 p-5'>
        <Button size='sm' onClick={onAddTextBlock}>
          Text Block
        </Button>
        <Button size='sm' onClick={onAddHeadingBlock}>
          Heading Block
        </Button>
        <Button size='sm' onClick={onAddShortAnswerBlock}>
          Short Answer
        </Button>
        <Button size='sm' onClick={onAddMultipleChoiceBlock}>
          Multiple Choice
        </Button>
        <Button size='sm' onClick={onAddMultiselectBlock}>
          Multiselect
        </Button>
      </div>
    </div>
  );
};
