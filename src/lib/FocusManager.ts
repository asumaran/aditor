/**
 * FocusManager - Centralized Focus Management System
 *
 * This system provides a unified interface for managing focus behavior
 * across different block types in the editor, ensuring consistent
 * cursor positioning and focus handling.
 *
 * Key responsibilities:
 * 1. Block focus with cursor positioning control
 * 2. Form block vs text block focus differences
 * 3. Focus restoration after operations
 * 4. Integration with existing focus patterns
 */

export interface CursorPosition {
  offset: number;
  atStart: boolean;
  atEnd: boolean;
}

export interface FocusOptions {
  /** Position cursor at start of block */
  cursorAtStart?: boolean;
  /** Position cursor at end of block */
  cursorAtEnd?: boolean;
  /** Position cursor at specific offset */
  cursorOffset?: number;
  /** Auto-focus the block immediately */
  autoFocus?: boolean;
  /** Preserve current cursor position if possible */
  preserveCursor?: boolean;
  /** Delay focus to next frame (useful for React updates) */
  deferred?: boolean;
}

export interface BlockFocusInfo {
  blockId: number;
  blockType: string;
  element: HTMLElement;
  focusableElements: HTMLElement[];
  isFormBlock: boolean;
}

export type FocusEventType =
  | 'block-created'
  | 'block-split'
  | 'block-merged'
  | 'block-deleted'
  | 'slash-command'
  | 'navigation'
  | 'manual';

export interface FocusEvent {
  type: FocusEventType;
  blockId: number;
  options: FocusOptions;
  context?: Record<string, unknown>;
}

export class FocusManager {
  private static instance: FocusManager;
  private eventListeners: Map<
    FocusEventType,
    Array<(event: FocusEvent) => void>
  > = new Map();
  private lastFocusedBlock: number | null = null;
  private cursorAtStartBlocks = new Set<number>();

  static getInstance(): FocusManager {
    if (!FocusManager.instance) {
      FocusManager.instance = new FocusManager();
    }
    return FocusManager.instance;
  }

  /**
   * Register a block as needing cursor at start
   */
  setCursorAtStart(blockId: number): void {
    this.cursorAtStartBlocks.add(blockId);
  }

  /**
   * Remove cursor at start flag for a block
   */
  clearCursorAtStart(blockId: number): void {
    this.cursorAtStartBlocks.delete(blockId);
  }

  /**
   * Check if block should have cursor at start
   */
  shouldCursorBeAtStart(blockId: number): boolean {
    return this.cursorAtStartBlocks.has(blockId);
  }

  /**
   * Get information about a block for focus management
   */
  getBlockInfo(blockId: number): BlockFocusInfo | null {
    const element = document.querySelector(
      `[data-block-id="${blockId}"]`,
    ) as HTMLElement;
    if (!element) {
      return null;
    }

    const blockType = this.getBlockType(element);
    const focusableElements = this.getFocusableElements(element);
    const isFormBlock = this.isFormBlock(blockType);

    return {
      blockId,
      blockType,
      element,
      focusableElements,
      isFormBlock,
    };
  }

  /**
   * Focus a block with specified options
   */
  focusBlock(blockId: number, options: FocusOptions = {}): boolean {
    // Only apply cursorAtStart from internal state if not explicitly overridden
    const focusOptions = {
      ...(options.cursorAtStart === undefined &&
      options.cursorAtEnd === undefined
        ? {
            cursorAtStart: this.shouldCursorBeAtStart(blockId),
          }
        : {}),
      ...options,
    };

    // Emit BEFORE event so React can prepare components
    this.emitEvent({
      type: 'manual',
      blockId,
      options: focusOptions,
    });

    const blockInfo = this.getBlockInfo(blockId);
    if (!blockInfo) {
      console.warn(`FocusManager: Block ${blockId} not found`);
      return false;
    }

    const success = this.performFocus(blockInfo, focusOptions);

    if (success) {
      this.lastFocusedBlock = blockId;
      // Clear cursor at start flag after successful focus
      this.clearCursorAtStart(blockId);
    }

    return success;
  }

  /**
   * Focus block for specific events (block creation, splitting, etc.)
   */
  focusBlockForEvent(
    blockId: number,
    _eventType: FocusEventType,
    options: FocusOptions = {},
  ): boolean {
    // Only apply cursorAtStart from internal state if not explicitly overridden
    const focusOptions = {
      ...(options.cursorAtStart === undefined &&
      options.cursorAtEnd === undefined
        ? {
            cursorAtStart: this.shouldCursorBeAtStart(blockId),
          }
        : {}),
      ...options,
    };

    // For deferred focus, wait for DOM to be ready, then focus
    if (focusOptions.deferred) {
      // Use double requestAnimationFrame to ensure React has rendered
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const blockInfo = this.getBlockInfo(blockId);
          if (blockInfo) {
            const success = this.performFocus(blockInfo, focusOptions);
            if (success) {
              this.lastFocusedBlock = blockId;
              this.clearCursorAtStart(blockId);
            }
          } else {
            console.warn(
              `FocusManager: Deferred focus failed - Block ${blockId} not found`,
            );
          }
        });
      });
      return true;
    }

    // Immediate focus
    const blockInfo = this.getBlockInfo(blockId);
    if (!blockInfo) {
      console.warn(`FocusManager: Block ${blockId} not found`);
      return false;
    }

    const success = this.performFocus(blockInfo, focusOptions);

    if (success) {
      this.lastFocusedBlock = blockId;
      // Clear cursor at start flag after successful focus
      this.clearCursorAtStart(blockId);
    }

    return success;
  }

  /**
   * Handle block creation focus
   */
  onBlockCreated(blockId: number, options: FocusOptions = {}): boolean {
    // New blocks typically want cursor at start unless specified otherwise
    const defaultOptions: FocusOptions = {
      ...(options.cursorAtEnd === undefined &&
      options.cursorAtStart === undefined
        ? { cursorAtStart: true }
        : {}),
      autoFocus: true,
      deferred: true, // Wait for React render
      ...options,
    };

    // Set the cursor at start flag for this block only if cursorAtEnd is not specified
    if (defaultOptions.cursorAtStart && !defaultOptions.cursorAtEnd) {
      this.setCursorAtStart(blockId);
    }

    return this.focusBlockForEvent(blockId, 'block-created', defaultOptions);
  }

  /**
   * Handle block splitting focus (Enter key)
   */
  onBlockSplit(newBlockId: number, options: FocusOptions = {}): boolean {
    // Split blocks want cursor at start of new block
    const defaultOptions: FocusOptions = {
      cursorAtStart: true,
      autoFocus: true,
      deferred: true,
      ...options,
    };

    return this.focusBlockForEvent(newBlockId, 'block-split', defaultOptions);
  }

  /**
   * Handle block merging focus (Backspace key)
   */
  onBlockMerged(
    targetBlockId: number,
    junctionOffset: number,
    options: FocusOptions = {},
  ): boolean {
    // Merged blocks want cursor at junction point
    const defaultOptions: FocusOptions = {
      cursorOffset: junctionOffset,
      autoFocus: true,
      ...options,
    };

    return this.focusBlockForEvent(
      targetBlockId,
      'block-merged',
      defaultOptions,
    );
  }

  /**
   * Handle slash command block creation
   */
  onSlashCommandBlock(
    blockId: number,
    blockType: string,
    options: FocusOptions = {},
  ): boolean {
    // Form blocks need special handling for input elements
    const isFormBlock = this.isFormBlock(blockType);
    const defaultOptions: FocusOptions = {
      autoFocus: true,
      deferred: true,
      // Form blocks focus on input, text blocks at start
      ...(isFormBlock ? {} : { cursorAtStart: true }),
      ...options,
    };

    return this.focusBlockForEvent(blockId, 'slash-command', defaultOptions);
  }

  /**
   * Handle arrow key navigation
   */
  onNavigation(blockId: number, options: FocusOptions = {}): boolean {
    const defaultOptions: FocusOptions = {
      autoFocus: true,
      preserveCursor: false, // Navigation usually sets specific position
      ...options,
    };

    return this.focusBlockForEvent(blockId, 'navigation', defaultOptions);
  }

  /**
   * Add event listener for focus events
   */
  addEventListener(
    eventType: FocusEventType,
    listener: (event: FocusEvent) => void,
  ): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(
    eventType: FocusEventType,
    listener: (event: FocusEvent) => void,
  ): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Get the last focused block ID
   */
  getLastFocusedBlock(): number | null {
    return this.lastFocusedBlock;
  }

  // Private implementation methods

  private performFocus(
    blockInfo: BlockFocusInfo,
    options: FocusOptions,
  ): boolean {
    const { element, focusableElements, isFormBlock } = blockInfo;

    const focusFunction = () => {
      try {
        if (isFormBlock && focusableElements.length > 0) {
          // Focus first focusable element in form blocks
          const targetElement = focusableElements[0];
          targetElement.focus();

          // Position cursor based on element type
          if (
            targetElement.contentEditable === 'true' ||
            targetElement.getAttribute('contenteditable') === 'true'
          ) {
            // It's a contenteditable element (like the label in form blocks)
            this.positionCursorInContentEditable(targetElement, options);
          } else if (this.isTextInput(targetElement)) {
            // It's an input/textarea
            this.positionCursorInInput(
              targetElement as HTMLInputElement | HTMLTextAreaElement,
              options,
            );
          }
        } else {
          // Focus contenteditable element for text blocks
          // First try to find contenteditable within the element, then check if element itself is contenteditable
          let contentEditable = element.querySelector(
            '[contenteditable="true"]',
          ) as HTMLElement;
          if (!contentEditable && element.contentEditable === 'true') {
            contentEditable = element;
          }

          if (contentEditable) {
            contentEditable.focus();
            this.positionCursorInContentEditable(contentEditable, options);
          } else {
            element.focus();
          }
        }
        return true;
      } catch (error) {
        console.error('FocusManager: Focus failed', error);
        return false;
      }
    };

    if (options.deferred) {
      // Use double requestAnimationFrame to ensure React has finished rendering
      requestAnimationFrame(() => {
        requestAnimationFrame(focusFunction);
      });
      return true; // Assume success for deferred operations
    } else {
      return focusFunction();
    }
  }

  private positionCursorInContentEditable(
    element: HTMLElement,
    options: FocusOptions,
  ): void {
    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();

    if (options.cursorOffset !== undefined) {
      // Position at specific offset
      this.setCursorAtOffset(element, options.cursorOffset, range);
    } else if (options.cursorAtStart) {
      // Position at start
      range.selectNodeContents(element);
      range.collapse(true);
    } else if (options.cursorAtEnd) {
      // Position at end
      range.selectNodeContents(element);
      range.collapse(false);
    } else {
      // Default behavior - no cursor positioning
      return;
    }

    selection.removeAllRanges();
    selection.addRange(range);
  }

  private positionCursorInInput(
    element: HTMLInputElement | HTMLTextAreaElement,
    options: FocusOptions,
  ): void {
    if (options.cursorOffset !== undefined) {
      element.setSelectionRange(options.cursorOffset, options.cursorOffset);
    } else if (options.cursorAtStart) {
      element.setSelectionRange(0, 0);
    } else if (options.cursorAtEnd) {
      const length = element.value.length;
      element.setSelectionRange(length, length);
    }
  }

  private setCursorAtOffset(
    element: HTMLElement,
    offset: number,
    range: Range,
  ): void {
    const textContent = element.textContent || '';
    const clampedOffset = Math.min(offset, textContent.length);

    if (element.firstChild && element.firstChild.nodeType === Node.TEXT_NODE) {
      range.setStart(element.firstChild, clampedOffset);
      range.setEnd(element.firstChild, clampedOffset);
    } else {
      range.selectNodeContents(element);
      range.collapse(clampedOffset === 0);
    }
  }

  private getFocusableElements(element: HTMLElement): HTMLElement[] {
    const selector =
      'input, textarea, [contenteditable="true"], button, select, [tabindex]:not([tabindex="-1"])';
    return Array.from(element.querySelectorAll(selector)) as HTMLElement[];
  }

  private getBlockType(element: HTMLElement): string {
    // Try to determine block type from DOM structure
    if (element.querySelector('input[type="text"]')) return 'short_answer';
    if (element.querySelector('input[type="radio"]')) return 'multiple_choice';
    if (element.querySelector('input[type="checkbox"]')) return 'multiselect';
    if (element.querySelector('[contenteditable="true"]')) {
      const contentEl = element.querySelector(
        '[contenteditable="true"]',
      ) as HTMLElement;
      // Check for heading indicators: large font size, heading tag, or heading classes
      if (
        contentEl.tagName === 'H1' ||
        contentEl.tagName === 'H2' ||
        contentEl.tagName === 'H3' ||
        contentEl.style.fontSize === '24px' ||
        contentEl.classList.contains('text-2xl') ||
        contentEl.classList.contains('text-3xl') ||
        contentEl.classList.contains('font-semibold')
      ) {
        return 'heading';
      }
      return 'text';
    }
    return 'unknown';
  }

  private isFormBlock(blockType: string): boolean {
    return ['short_answer', 'multiple_choice', 'multiselect'].includes(
      blockType,
    );
  }

  private isTextInput(element: HTMLElement): boolean {
    return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
  }

  private emitEvent(event: FocusEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error('FocusManager: Event listener error', error);
        }
      });
    }
  }
}
