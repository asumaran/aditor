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
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
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
