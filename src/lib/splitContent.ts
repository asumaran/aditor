/**
 * Split content at cursor position and return both parts
 */
export const splitContentAtCursor = (
  element: HTMLElement,
): { before: string; after: string } => {
  const selection = window.getSelection();
  if (!selection?.rangeCount) {
    return { before: element.textContent || '', after: '' };
  }

  const range = selection.getRangeAt(0);
  const content = element.textContent || '';

  // Get cursor position as character offset
  const preRange = document.createRange();
  preRange.selectNodeContents(element);
  preRange.setEnd(range.startContainer, range.startOffset);
  const cursorPosition = preRange.toString().length;

  const before = content.substring(0, cursorPosition);
  const after = content.substring(cursorPosition);

  // If before ends with single \n and there's content after,
  // we need double \n to preserve the visual empty line
  const adjustedBefore =
    before.endsWith('\n') && !before.endsWith('\n\n') && after
      ? before + '\n'
      : before;

  return {
    before: adjustedBefore,
    after: after,
  };
};
