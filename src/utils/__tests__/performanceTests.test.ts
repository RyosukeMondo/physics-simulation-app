import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
  PerformanceTestRunner,
  PERFORMANCE_TEST_PRESETS,
  analyzePerformanceData,
  PerformanceTestResult
} from '../performanceTests';
import { ObjectType } from '../../types/simulation';

describe('PerformanceTestRunner', () => {
  let testRunner: PerformanceTestRunner;
  let mockAddObjects: jest.Mock;
  let mockClearObjects: jest.Mock;
  let mockGetCurrentMetrics: jest.Mock;

  beforeEach(() => {
    mockAddObjects = jest.fn();
    mockClearObjects = jest.fn();
    mockGetCurrentMetrics = jest.fn().mockReturnValue({
      fps: 60,
      frameTime: 16.67,
      memoryUsage: 50
    });

    testRunner = new PerformanceTestRunner(
      mockAddObjects,
      mockClearObjects,
      mockGetCurrentMetrics
    );
  });

  describe('runTest', () => {
    it('should run a complete performance test', async () => {
      const config = PERFORMANCE_TEST_PRESETS.quick;
      
      // Mock decreasing FPS as objects increase
      let callCount = 0;
      mockGetCurrentMetrics.mockImplementation(() => ({
        fps: Math.max(30, 60 - callCount * 5),
        frameTime: 16.67 + callCount * 2,
        memoryUsage: 50 + callCount * 10
      }));

      const summary = await testRunner.runTest(config);

      expect(mockClearObjects).toHaveBeenCalled();
      expect(mockAddObjects).toHaveBeenCalledTimes(5); // 25 objects / 5 step size
      expect(summary.results).toHaveLength(5);
      expect(summary.analysis.averageFPS).toBeGreaterThan(0);
      expect(summary.analysis.performanceGrade).toMatch(/[A-F]/);
    });

    it('should stop early on poor performance', async () => {
      const config = PERFORMANCE_TEST_PRESETS.quick;
      
      // Mock very poor FPS
      mockGetCurrentMetrics.mockReturnValue({
        fps: 10,
        frameTime: 100,
        memoryUsage: 200
      });

      const summary = await testRunner.runTest(config);

      // Should stop early due to poor performance
      expect(summary.results.length).toBeLessThan(5);
    });

    it('should handle test cancellation', async () => {
      const config = PERFORMANCE_TEST_PRESETS.quick;
      
      // Start test and immediately stop it
      const testPromise = testRunner.runTest(config);
      testRunner.stopTest();
      
      const summary = await testPromise;
      
      expect(summary.results.length).toBeLessThanOrEqual(1);
    });

    it('should prevent concurrent tests', async () => {
      const config = PERFORMANCE_TEST_PRESETS.quick;
      
      const testPromise1 = testRunner.runTest(config);
      
      await expect(testRunner.runTest(config)).rejects.toThrow('Test is already running');
      
      await testPromise1;
    });
  });

  describe('callbacks', () => {
    it('should call progress callback during test', async () => {
      const config = PERFORMANCE_TEST_PRESETS.quick;
      const progressCallback = jest.fn();
      
      testRunner.setProgressCallback(progressCallback);
      await testRunner.runTest(config);
      
      expect(progressCallback).toHaveBeenCalledWith(0, 'Clearing scene...');
      expect(progressCallback).toHaveBeenCalledWith(100, 'Test completed');
    });

    it('should call result callback for each measurement', async () => {
      const config = PERFORMANCE_TEST_PRESETS.quick;
      const resultCallback = jest.fn();
      
      testRunner.setResultCallback(resultCallback);
      await testRunner.runTest(config);
      
      expect(resultCallback).toHaveBeenCalledTimes(5);
      expect(resultCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          objectCount: expect.any(Number),
          fps: expect.any(Number),
          frameTime: expect.any(Number)
        })
      );
    });
  });

  describe('performance analysis', () => {
    it('should calculate correct performance grade', async () => {
      const config = PERFORMANCE_TEST_PRESETS.quick;
      
      // Mock excellent performance
      mockGetCurrentMetrics.mockReturnValue({
        fps: 60,
        frameTime: 16.67,
        memoryUsage: 30
      });

      const summary = await testRunner.runTest(config);
      
      expect(summary.analysis.performanceGrade).toBe('A');
      expect(summary.analysis.averageFPS).toBe(60);
      expect(summary.analysis.minFPS).toBe(60);
      expect(summary.analysis.maxFPS).toBe(60);
    });

    it('should identify FPS dropoff point', async () => {
      const config = PERFORMANCE_TEST_PRESETS.quick;
      
      let callCount = 0;
      mockGetCurrentMetrics.mockImplementation(() => {
        callCount++;
        return {
          fps: callCount <= 2 ? 60 : 25, // Drop after 2 calls
          frameTime: 16.67,
          memoryUsage: 50
        };
      });

      const summary = await testRunner.runTest(config);
      
      expect(summary.analysis.fpsDropoffPoint).toBe(15); // Third call = 15 objects
    });

    it('should calculate memory efficiency', async () => {
      const config = PERFORMANCE_TEST_PRESETS.quick;
      
      let callCount = 0;
      mockGetCurrentMetrics.mockImplementation(() => {
        callCount++;
        return {
          fps: 60,
          frameTime: 16.67,
          memoryUsage: 50 + callCount * 10 // Increasing memory
        };
      });

      const summary = await testRunner.runTest(config);
      
      expect(summary.analysis.memoryEfficiency).toBeGreaterThan(0);
    });
  });
});

describe('PERFORMANCE_TEST_PRESETS', () => {
  it('should have valid preset configurations', () => {
    Object.values(PERFORMANCE_TEST_PRESETS).forEach(preset => {
      expect(preset.maxObjects).toBeGreaterThan(0);
      expect(preset.testDuration).toBeGreaterThan(0);
      expect(preset.objectTypes).toHaveLength.greaterThan(0);
      expect(preset.stepSize).toBeGreaterThan(0);
      expect(preset.stabilizationTime).toBeGreaterThan(0);
    });
  });

  it('should have different configurations for different test types', () => {
    const quick = PERFORMANCE_TEST_PRESETS.quick;
    const comprehensive = PERFORMANCE_TEST_PRESETS.comprehensive;
    
    expect(comprehensive.maxObjects).toBeGreaterThan(quick.maxObjects);
    expect(comprehensive.testDuration).toBeGreaterThan(quick.testDuration);
    expect(comprehensive.objectTypes).toHaveLength.greaterThanOrEqual(quick.objectTypes.length);
  });
});

describe('analyzePerformanceData', () => {
  const mockResults: PerformanceTestResult[] = [
    { objectCount: 5, fps: 60, frameTime: 16.67, timestamp: 1000, testType: 'ball' },
    { objectCount: 10, fps: 55, frameTime: 18.18, timestamp: 2000, testType: 'ball' },
    { objectCount: 15, fps: 50, frameTime: 20.00, timestamp: 3000, testType: 'box' },
    { objectCount: 20, fps: 45, frameTime: 22.22, timestamp: 4000, testType: 'box' },
    { objectCount: 25, fps: 25, frameTime: 40.00, timestamp: 5000, testType: 'ball' }
  ];

  it('should return null for empty results', () => {
    expect(analyzePerformanceData([])).toBeNull();
  });

  it('should calculate correct FPS statistics', () => {
    const analysis = analyzePerformanceData(mockResults);
    
    expect(analysis).not.toBeNull();
    expect(analysis!.fpsStats.min).toBe(25);
    expect(analysis!.fpsStats.max).toBe(60);
    expect(analysis!.fpsStats.avg).toBe(47); // (60+55+50+45+25)/5
  });

  it('should calculate correct object statistics', () => {
    const analysis = analyzePerformanceData(mockResults);
    
    expect(analysis!.objectStats.min).toBe(5);
    expect(analysis!.objectStats.max).toBe(25);
    expect(analysis!.objectStats.range).toBe(20);
  });

  it('should identify performance trend', () => {
    const analysis = analyzePerformanceData(mockResults);
    
    expect(analysis!.performanceTrend).toBe('declining');
  });

  it('should identify bottlenecks', () => {
    const analysis = analyzePerformanceData(mockResults);
    
    expect(analysis!.bottlenecks).toContain('Significant FPS drop at 25 objects');
  });

  it('should handle stable performance trend', () => {
    const stableResults: PerformanceTestResult[] = [
      { objectCount: 5, fps: 60, frameTime: 16.67, timestamp: 1000, testType: 'ball' },
      { objectCount: 10, fps: 59, frameTime: 16.95, timestamp: 2000, testType: 'ball' },
      { objectCount: 15, fps: 58, frameTime: 17.24, timestamp: 3000, testType: 'ball' }
    ];
    
    const analysis = analyzePerformanceData(stableResults);
    
    expect(analysis!.performanceTrend).toBe('stable');
  });
});