import type { AnimateLayoutChanges } from '@dnd-kit/sortable';

// Disable all animations during drag
export const animateLayoutChanges: AnimateLayoutChanges = () => false;
