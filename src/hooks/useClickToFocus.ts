import { useEffect } from 'react';

export const useClickToFocus = (containerId: string) => {
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Don't intercept clicks on editable elements, within blocks, or on dropdowns
      if (
        target.closest(
          '[contenteditable="true"], input, textarea, [data-editable]',
        )
      )
        return;
      if (target.closest('[data-block-id]')) return;
      if (target.closest('[data-slash-dropdown]')) return; // Don't intercept clicks on slash command dropdown

      const blocks = container.querySelectorAll('[data-block-id]');
      if (!blocks.length) return;

      const clickY = e.clientY;
      let closestBlock: HTMLElement | null = null as HTMLElement | null;
      let minDistance = Infinity;

      blocks.forEach((block) => {
        const htmlBlock = block as HTMLElement;
        const rect = htmlBlock.getBoundingClientRect();
        const blockCenterY = rect.top + rect.height / 2;
        const distance = Math.abs(clickY - blockCenterY);

        if (distance < minDistance) {
          minDistance = distance;
          closestBlock = htmlBlock;
        }
      });

      if (closestBlock !== null) {
        const block = closestBlock;
        // The block itself should be contenteditable
        const primaryEditable = block.hasAttribute('contenteditable') 
          ? block as HTMLElement
          : block.querySelector('[contenteditable="true"]') as HTMLElement | null;
        const focusTarget = primaryEditable || block;

        focusTarget.focus();

        if (primaryEditable) {
          // Determine cursor position based on click position
          const blockRect = focusTarget.getBoundingClientRect();
          const blockCenterX = blockRect.left + blockRect.width / 2;
          const isLeftHalf = e.clientX < blockCenterX;

          const range = document.createRange();
          range.selectNodeContents(focusTarget);
          range.collapse(isLeftHalf); // true = start, false = end

          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [containerId]);
};
