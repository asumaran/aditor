import { useEffect } from 'react';

export const useClickToFocus = (containerId: string) => {
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      // Don't intercept clicks on actual blocks
      if ((e.target as HTMLElement).closest('[data-block-id]')) return;

      const blocks = container.querySelectorAll('[data-block-id]');
      if (!blocks.length) return;

      const clickY = e.clientY;
      let closestBlock: HTMLElement | null = null;
      let minDistance = Infinity;

      blocks.forEach((block) => {
        const rect = block.getBoundingClientRect();
        const blockCenterY = rect.top + rect.height / 2;
        const distance = Math.abs(clickY - blockCenterY);

        if (distance < minDistance) {
          minDistance = distance;
          closestBlock = block as HTMLElement;
        }
      });

      if (closestBlock) {
        closestBlock.focus();

        // Determine cursor position based on click position
        const blockRect = closestBlock.getBoundingClientRect();
        const blockCenterX = blockRect.left + blockRect.width / 2;
        const isLeftHalf = e.clientX < blockCenterX;

        const range = document.createRange();
        range.selectNodeContents(closestBlock);
        range.collapse(isLeftHalf); // true = start, false = end

        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [containerId]);
};
