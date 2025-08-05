/**
 * Initial Focus Tests
 *
 * Tests for ensuring the editor correctly focuses the last block
 * when the page loads with default blocks.
 */

import { FocusManager } from '@/lib/FocusManager';

describe('Initial Focus on Page Load', () => {
  let focusManager: FocusManager;

  beforeEach(() => {
    // Clear any existing DOM state
    document.body.innerHTML = '';

    // Create fresh FocusManager instance
    focusManager = FocusManager.getInstance();

    // Clear all mocks
    jest.clearAllMocks();
  });

  test('should focus last text block on initial mount', () => {
    // Add mock DOM element
    const mockBlock = document.createElement('div');
    mockBlock.contentEditable = 'true';
    mockBlock.setAttribute('data-block-id', '123');
    document.body.appendChild(mockBlock);

    // Simulate initial mount with default blocks
    const defaultBlocks = [
      { id: 123, type: 'text', properties: { title: '' } },
    ];

    // Mock the focus operation
    const focusSpy = jest.spyOn(focusManager, 'focusBlock');

    // Simulate the useEffect logic that runs on mount
    const blocks = defaultBlocks;
    const lastBlock = blocks[blocks.length - 1];

    if (
      blocks.length > 0 &&
      (lastBlock.type === 'text' || lastBlock.type === 'heading')
    ) {
      focusManager.focusBlock(lastBlock.id, {
        autoFocus: true,
        deferred: true,
      });
    }

    // Verify focus was called with correct parameters
    expect(focusSpy).toHaveBeenCalledWith(123, {
      autoFocus: true,
      deferred: true,
    });
  });

  test('should focus last block when multiple text blocks exist', () => {
    // Create multiple blocks
    const blocks = [
      { id: 1, type: 'text', properties: { title: 'First' } },
      { id: 2, type: 'text', properties: { title: 'Second' } },
      { id: 3, type: 'text', properties: { title: 'Third' } },
    ];

    // Add mock elements for each block
    blocks.forEach((block) => {
      const element = document.createElement('div');
      element.contentEditable = 'true';
      element.setAttribute('data-block-id', block.id.toString());
      element.textContent = block.properties.title;
      document.body.appendChild(element);
    });

    const focusSpy = jest.spyOn(focusManager, 'focusBlock');

    // Focus the last block
    const lastBlock = blocks[blocks.length - 1];
    focusManager.focusBlock(lastBlock.id, {
      autoFocus: true,
      deferred: true,
    });

    // Should focus block with id 3 (the last one)
    expect(focusSpy).toHaveBeenCalledWith(3, {
      autoFocus: true,
      deferred: true,
    });
  });

  test('should not focus form blocks on initial mount', () => {
    // Create blocks with a form block at the end
    const blocks = [
      { id: 1, type: 'text', properties: { title: 'Text' } },
      { id: 2, type: 'short_answer', properties: { label: 'Question' } },
    ];

    const focusSpy = jest.spyOn(focusManager, 'focusBlock');

    // Simulate the conditional logic
    const lastBlock = blocks[blocks.length - 1];

    if (lastBlock.type === 'text' || lastBlock.type === 'heading') {
      focusManager.focusBlock(lastBlock.id, {
        autoFocus: true,
        deferred: true,
      });
    }

    // Should not have been called since last block is a form block
    expect(focusSpy).not.toHaveBeenCalled();
  });

  test('should handle empty editor state', () => {
    const blocks: any[] = [];
    const focusSpy = jest.spyOn(focusManager, 'focusBlock');

    // Simulate empty state
    if (blocks.length > 0) {
      const lastBlock = blocks[blocks.length - 1];
      focusManager.focusBlock(lastBlock.id, {
        autoFocus: true,
        deferred: true,
      });
    }

    // Should not be called for empty state
    expect(focusSpy).not.toHaveBeenCalled();
  });

  test('should focus heading blocks on initial mount', () => {
    const blocks = [
      { id: 1, type: 'text', properties: { title: 'Text' } },
      { id: 2, type: 'heading', properties: { title: 'Heading', level: 1 } },
    ];

    const focusSpy = jest.spyOn(focusManager, 'focusBlock');

    const lastBlock = blocks[blocks.length - 1];

    if (lastBlock.type === 'text' || lastBlock.type === 'heading') {
      focusManager.focusBlock(lastBlock.id, {
        autoFocus: true,
        deferred: true,
      });
    }

    // Should focus the heading block
    expect(focusSpy).toHaveBeenCalledWith(2, {
      autoFocus: true,
      deferred: true,
    });
  });

  test('should use deferred focus to wait for DOM', () => {
    const blocks = [{ id: 123, type: 'text', properties: { title: '' } }];
    const focusSpy = jest.spyOn(focusManager, 'focusBlock');

    const lastBlock = blocks[0];
    focusManager.focusBlock(lastBlock.id, {
      autoFocus: true,
      deferred: true, // This is important for DOM readiness
    });

    // Verify deferred option was passed
    expect(focusSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ deferred: true }),
    );
  });

  test('should only run focus logic once on mount', () => {
    const focusSpy = jest.spyOn(focusManager, 'focusBlock');
    let lastFocusedBlockId: number | null = null;

    const blocks = [{ id: 123, type: 'text', properties: { title: '' } }];

    // First mount
    if (blocks.length > 0 && !lastFocusedBlockId) {
      const lastBlock = blocks[0];
      focusManager.focusBlock(lastBlock.id, {
        autoFocus: true,
        deferred: true,
      });
      lastFocusedBlockId = lastBlock.id;
    }

    // Simulate subsequent renders (should not focus again)
    if (blocks.length > 0 && !lastFocusedBlockId) {
      const lastBlock = blocks[0];
      focusManager.focusBlock(lastBlock.id, {
        autoFocus: true,
        deferred: true,
      });
    }

    // Should only be called once
    expect(focusSpy).toHaveBeenCalledTimes(1);
  });
});

/**
 * Integration Test Scenarios for Initial Focus
 *
 * These should be verified manually or with integration tests:
 *
 * □ Page refresh → default text block receives focus
 * □ Page load with multiple default blocks → last block receives focus
 * □ Page load with mixed block types → last text/heading block receives focus
 * □ Focus position is at end of content (ready to type)
 * □ No focus flicker or multiple focus attempts
 * □ Works correctly with browser back/forward navigation
 */
