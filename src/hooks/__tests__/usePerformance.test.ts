import { renderHook } from '@testing-library/react';
import { usePerformance } from '../usePerformance';

// Mock performance.now
const mockPerformanceNow = jest.fn();
Object.defineProperty(global.performance, 'now', {
  writable: true,
  value: mockPerformanceNow,
});

// Mock requestAnimationFrame
const mockRequestAnimationFrame = jest.fn();
Object.defineProperty(global, 'requestAnimationFrame', {
  writable: true,
  value: mockRequestAnimationFrame,
});

// Mock cancelAnimationFrame
const mockCancelAnimationFrame = jest.fn();
Object.defineProperty(global, 'cancelAnimationFrame', {
  writable: true,
  value: mockCancelAnimationFrame,
});

describe('usePerformance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformanceNow.mockReturnValue(0);
  });

  it('initializes with default metrics', () => {
    const { result } = renderHook(() => usePerformance());
    
    expect(result.current.fps).toBe(0);
    expect(result.current.frameTime).toBe(0);
    expect(result.current.memoryUsage).toBe(0);
  });

  it('starts performance monitoring on mount', () => {
    renderHook(() => usePerformance());
    
    expect(mockRequestAnimationFrame).toHaveBeenCalled();
  });

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => usePerformance());
    
    unmount();
    
    expect(mockCancelAnimationFrame).toHaveBeenCalled();
  });

  it('handles memory usage when available', () => {
    // Mock performance.memory
    Object.defineProperty(global.performance, 'memory', {
      writable: true,
      value: {
        usedJSHeapSize: 50 * 1024 * 1024 // 50MB in bytes
      },
    });

    const { result } = renderHook(() => usePerformance());
    
    // The hook should initialize with memory support
    expect(result.current.memoryUsage).toBe(0); // Initial value
  });
});