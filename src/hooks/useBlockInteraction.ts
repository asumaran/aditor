import { useCallback, useState } from 'react';

interface UseBlockInteractionProps {
  onBlockClick?: () => void;
}

interface UseBlockInteractionReturn {
  isHovered: boolean;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  handleClick: () => void;
}

export const useBlockInteraction = ({
  onBlockClick,
}: UseBlockInteractionProps = {}): UseBlockInteractionReturn => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback(() => {
    console.log('handleMouseEnter called');
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    console.log('handleMouseLeave called');
    setIsHovered(false);
  }, []);

  const handleClick = useCallback(() => {
    if (onBlockClick) {
      onBlockClick();
    }
  }, [onBlockClick]);

  return {
    isHovered,
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
  };
};
