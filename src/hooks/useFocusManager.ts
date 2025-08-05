/**
 * useFocusManager - React Hook for Focus Management
 *
 * This hook provides a React-friendly interface to the FocusManager,
 * ensuring proper lifecycle management and integration with React
 * component updates and re-renders.
 */

import { useCallback, useEffect, useRef } from 'react';
import {
  FocusManager,
  type FocusOptions,
  type FocusEventType,
} from '@/lib/FocusManager';

export interface UseFocusManagerOptions {
  /** Block ID this hook is managing */
  blockId?: number;
  /** Debug logging */
  debug?: boolean;
}

export interface FocusManagerHook {
  /** Focus this block */
  focus: (options?: FocusOptions) => boolean;
  /** Focus block for specific event */
  focusForEvent: (
    eventType: FocusEventType,
    options?: FocusOptions,
    context?: Record<string, unknown>,
  ) => boolean;
  /** Set cursor at start flag for this block */
  setCursorAtStart: () => void;
  /** Clear cursor at start flag for this block */
  clearCursorAtStart: () => void;
  /** Check if cursor should be at start */
  shouldCursorBeAtStart: () => boolean;
  /** Get the focus manager instance */
  manager: FocusManager;
}

export const useFocusManager = (
  options: UseFocusManagerOptions = {},
): FocusManagerHook => {
  const { blockId, debug = false } = options;
  const managerRef = useRef<FocusManager>(FocusManager.getInstance());
  const manager = managerRef.current;

  const focus = useCallback(
    (focusOptions: FocusOptions = {}) => {
      if (!blockId) {
        if (debug)
          console.warn('useFocusManager: No blockId provided for focus');
        return false;
      }

      return manager.focusBlock(blockId, focusOptions);
    },
    [blockId, manager, debug],
  );

  const focusForEvent = useCallback(
    (
      eventType: FocusEventType,
      focusOptions: FocusOptions = {},
      context?: Record<string, unknown>,
    ) => {
      if (!blockId) {
        return false;
      }

      return manager.focusBlockForEvent(
        blockId,
        eventType,
        focusOptions,
        context,
      );
    },
    [blockId, manager],
  );

  const setCursorAtStart = useCallback(() => {
    if (blockId) {
      manager.setCursorAtStart(blockId);
    }
  }, [blockId, manager]);

  const clearCursorAtStart = useCallback(() => {
    if (blockId) {
      manager.clearCursorAtStart(blockId);
    }
  }, [blockId, manager]);

  const shouldCursorBeAtStart = useCallback(() => {
    return blockId ? manager.shouldCursorBeAtStart(blockId) : false;
  }, [blockId, manager]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (blockId) {
        manager.clearCursorAtStart(blockId);
      }
    };
  }, [blockId, manager, debug]);

  return {
    focus,
    focusForEvent,
    setCursorAtStart,
    clearCursorAtStart,
    shouldCursorBeAtStart,
    manager,
  };
};

/**
 * Hook for global focus management operations
 */
export const useGlobalFocusManager = () => {
  const manager = FocusManager.getInstance();

  const focusBlock = useCallback(
    (blockId: number, options: FocusOptions = {}) => {
      return manager.focusBlock(blockId, options);
    },
    [manager],
  );

  const focusBlockForEvent = useCallback(
    (
      blockId: number,
      eventType: FocusEventType,
      options: FocusOptions = {},
      context?: Record<string, unknown>,
    ) => {
      return manager.focusBlockForEvent(blockId, eventType, options, context);
    },
    [manager],
  );

  const onBlockCreated = useCallback(
    (blockId: number, options: FocusOptions = {}) => {
      return manager.onBlockCreated(blockId, options);
    },
    [manager],
  );

  const onBlockSplit = useCallback(
    (newBlockId: number, options: FocusOptions = {}) => {
      return manager.onBlockSplit(newBlockId, options);
    },
    [manager],
  );

  const onBlockMerged = useCallback(
    (
      targetBlockId: number,
      junctionOffset: number,
      options: FocusOptions = {},
    ) => {
      return manager.onBlockMerged(targetBlockId, junctionOffset, options);
    },
    [manager],
  );

  const onSlashCommandBlock = useCallback(
    (blockId: number, blockType: string, options: FocusOptions = {}) => {
      return manager.onSlashCommandBlock(blockId, blockType, options);
    },
    [manager],
  );

  const onNavigation = useCallback(
    (blockId: number, options: FocusOptions = {}) => {
      return manager.onNavigation(blockId, options);
    },
    [manager],
  );

  const addEventListener = useCallback(
    (
      eventType: FocusEventType,
      listener: (event: import('@/lib/FocusManager').FocusEvent) => void,
    ) => {
      manager.addEventListener(eventType, listener);
      return () => manager.removeEventListener(eventType, listener);
    },
    [manager],
  );

  const getLastFocusedBlock = useCallback(() => {
    return manager.getLastFocusedBlock();
  }, [manager]);

  return {
    focusBlock,
    focusBlockForEvent,
    onBlockCreated,
    onBlockSplit,
    onBlockMerged,
    onSlashCommandBlock,
    onNavigation,
    addEventListener,
    getLastFocusedBlock,
    manager,
  };
};
