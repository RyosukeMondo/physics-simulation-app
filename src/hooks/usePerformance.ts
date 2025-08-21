import { useState, useEffect, useRef } from 'react';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage?: number;
}

export const usePerformance = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    memoryUsage: 0
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsUpdateIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    let animationFrameId: number;

    const updateFPS = () => {
      const now = performance.now();
      const deltaTime = now - lastTimeRef.current;
      
      frameCountRef.current++;

      // Update FPS every 500ms for smooth display
      if (deltaTime >= 500) {
        const fps = Math.round((frameCountRef.current * 1000) / deltaTime);
        const frameTime = Math.round(deltaTime / frameCountRef.current * 100) / 100;
        
        // Get memory usage if available
        let memoryUsage = 0;
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100; // MB
        }

        setMetrics({
          fps,
          frameTime,
          memoryUsage
        });

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animationFrameId = requestAnimationFrame(updateFPS);
    };

    animationFrameId = requestAnimationFrame(updateFPS);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      const intervalId = fpsUpdateIntervalRef.current;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  return metrics;
};