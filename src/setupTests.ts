import '@testing-library/jest-dom';

// Setup DOM globals for testing
Object.defineProperty(window, 'getSelection', {
  writable: true,
  value: jest.fn(() => ({
    removeAllRanges: jest.fn(),
    addRange: jest.fn(),
    getRangeAt: jest.fn(),
    rangeCount: 0,
  })),
});

Object.defineProperty(document, 'createRange', {
  writable: true,
  value: jest.fn(() => ({
    selectNodeContents: jest.fn(),
    collapse: jest.fn(),
    setStart: jest.fn(),
    setEnd: jest.fn(),
    startOffset: 0,
    endOffset: 0,
    collapsed: true,
  })),
});

Object.defineProperty(document, 'createTreeWalker', {
  writable: true,
  value: jest.fn(() => ({
    nextNode: jest.fn(() => null),
  })),
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 0));