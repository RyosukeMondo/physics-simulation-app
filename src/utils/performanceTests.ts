import { SpawnedObject, ObjectType } from '../types/simulation';

export interface PerformanceTestConfig {
  maxObjects: number;
  testDuration: number; // seconds
  objectTypes: ObjectType[];
  stepSize: number;
  stabilizationTime: number; // ms to wait between steps
}

export interface PerformanceTestResult {
  objectCount: number;
  fps: number;
  frameTime: number;
  memoryUsage?: number;
  timestamp: number;
  testType: string;
}

export interface PerformanceTestSummary {
  testConfig: PerformanceTestConfig;
  results: PerformanceTestResult[];
  analysis: {
    averageFPS: number;
    minFPS: number;
    maxFPS: number;
    fpsDropoffPoint?: number; // Object count where FPS drops below 30
    recommendedLimit: number;
    memoryEfficiency: number; // MB per object
    performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  };
  timestamp: number;
}

export class PerformanceTestRunner {
  private isRunning = false;
  private currentTest: PerformanceTestConfig | null = null;
  private results: PerformanceTestResult[] = [];
  private onProgress?: (progress: number, status: string) => void;
  private onResult?: (result: PerformanceTestResult) => void;

  constructor(
    private addObjects: (count: number, type: ObjectType) => void,
    private clearObjects: () => void,
    private getCurrentMetrics: () => { fps: number; frameTime: number; memoryUsage?: number }
  ) {}

  setProgressCallback(callback: (progress: number, status: string) => void) {
    this.onProgress = callback;
  }

  setResultCallback(callback: (result: PerformanceTestResult) => void) {
    this.onResult = callback;
  }

  async runTest(config: PerformanceTestConfig): Promise<PerformanceTestSummary> {
    if (this.isRunning) {
      throw new Error('Test is already running');
    }

    this.isRunning = true;
    this.currentTest = config;
    this.results = [];

    try {
      // Clear existing objects
      this.clearObjects();
      this.onProgress?.(0, 'Clearing scene...');
      await this.wait(1000);

      const steps = Math.ceil(config.maxObjects / config.stepSize);
      
      for (let step = 0; step < steps; step++) {
        if (!this.isRunning) break;

        const objectCount = (step + 1) * config.stepSize;
        const progress = ((step + 1) / steps) * 100;
        
        this.onProgress?.(progress, `Testing with ${objectCount} objects...`);

        // Add objects for this step
        const objectType = config.objectTypes[step % config.objectTypes.length];
        this.addObjects(config.stepSize, objectType);

        // Wait for physics to stabilize
        await this.wait(config.stabilizationTime);

        // Collect performance data
        const metrics = this.getCurrentMetrics();
        const result: PerformanceTestResult = {
          objectCount,
          fps: metrics.fps,
          frameTime: metrics.frameTime,
          memoryUsage: metrics.memoryUsage,
          timestamp: Date.now(),
          testType: objectType
        };

        this.results.push(result);
        this.onResult?.(result);

        // Stop early if performance is too poor
        if (metrics.fps < 15 && objectCount > 10) {
          this.onProgress?.(100, 'Test stopped due to poor performance');
          break;
        }
      }

      this.onProgress?.(100, 'Test completed');
      return this.generateSummary();
    } finally {
      this.isRunning = false;
      this.currentTest = null;
    }
  }

  stopTest() {
    this.isRunning = false;
  }

  private generateSummary(): PerformanceTestSummary {
    if (!this.currentTest || this.results.length === 0) {
      throw new Error('No test data available');
    }

    const fps = this.results.map(r => r.fps);
    const averageFPS = fps.reduce((sum, f) => sum + f, 0) / fps.length;
    const minFPS = Math.min(...fps);
    const maxFPS = Math.max(...fps);

    // Find FPS dropoff point (where FPS drops below 30)
    const fpsDropoffPoint = this.results.find(r => r.fps < 30)?.objectCount;

    // Calculate recommended limit (conservative estimate)
    const recommendedLimit = fpsDropoffPoint 
      ? Math.max(5, fpsDropoffPoint - 5)
      : Math.min(this.currentTest.maxObjects, Math.max(...this.results.map(r => r.objectCount)));

    // Calculate memory efficiency
    const memoryResults = this.results.filter(r => r.memoryUsage !== undefined);
    const memoryEfficiency = memoryResults.length > 0
      ? memoryResults.reduce((sum, r) => sum + (r.memoryUsage! / r.objectCount), 0) / memoryResults.length
      : 0;

    // Assign performance grade
    const performanceGrade = this.calculatePerformanceGrade(averageFPS, minFPS, recommendedLimit);

    return {
      testConfig: this.currentTest,
      results: [...this.results],
      analysis: {
        averageFPS: Math.round(averageFPS * 100) / 100,
        minFPS,
        maxFPS,
        fpsDropoffPoint,
        recommendedLimit,
        memoryEfficiency: Math.round(memoryEfficiency * 100) / 100,
        performanceGrade
      },
      timestamp: Date.now()
    };
  }

  private calculatePerformanceGrade(avgFPS: number, minFPS: number, recommendedLimit: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (avgFPS >= 55 && minFPS >= 45 && recommendedLimit >= 40) return 'A';
    if (avgFPS >= 45 && minFPS >= 35 && recommendedLimit >= 30) return 'B';
    if (avgFPS >= 35 && minFPS >= 25 && recommendedLimit >= 20) return 'C';
    if (avgFPS >= 25 && minFPS >= 15 && recommendedLimit >= 10) return 'D';
    return 'F';
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isTestRunning(): boolean {
    return this.isRunning;
  }

  getCurrentTestConfig(): PerformanceTestConfig | null {
    return this.currentTest;
  }
}

// Predefined test configurations
export const PERFORMANCE_TEST_PRESETS: Record<string, PerformanceTestConfig> = {
  quick: {
    maxObjects: 25,
    testDuration: 5,
    objectTypes: [ObjectType.BALL, ObjectType.BOX],
    stepSize: 5,
    stabilizationTime: 1000
  },
  
  standard: {
    maxObjects: 40,
    testDuration: 10,
    objectTypes: [ObjectType.BALL, ObjectType.BOX],
    stepSize: 5,
    stabilizationTime: 1500
  },
  
  comprehensive: {
    maxObjects: 60,
    testDuration: 15,
    objectTypes: [ObjectType.BALL, ObjectType.BOX, ObjectType.GLB_MODEL],
    stepSize: 3,
    stabilizationTime: 2000
  },
  
  stress: {
    maxObjects: 100,
    testDuration: 20,
    objectTypes: [ObjectType.BALL, ObjectType.BOX],
    stepSize: 5,
    stabilizationTime: 2000
  }
};

// Utility functions for performance analysis
export const analyzePerformanceData = (results: PerformanceTestResult[]) => {
  if (results.length === 0) return null;

  const fps = results.map(r => r.fps);
  const objectCounts = results.map(r => r.objectCount);
  
  return {
    totalSamples: results.length,
    fpsStats: {
      min: Math.min(...fps),
      max: Math.max(...fps),
      avg: fps.reduce((sum, f) => sum + f, 0) / fps.length,
      median: fps.sort((a, b) => a - b)[Math.floor(fps.length / 2)]
    },
    objectStats: {
      min: Math.min(...objectCounts),
      max: Math.max(...objectCounts),
      range: Math.max(...objectCounts) - Math.min(...objectCounts)
    },
    performanceTrend: calculatePerformanceTrend(results),
    bottlenecks: identifyBottlenecks(results)
  };
};

const calculatePerformanceTrend = (results: PerformanceTestResult[]): 'improving' | 'stable' | 'declining' => {
  if (results.length < 3) return 'stable';
  
  const firstThird = results.slice(0, Math.floor(results.length / 3));
  const lastThird = results.slice(-Math.floor(results.length / 3));
  
  const firstAvg = firstThird.reduce((sum, r) => sum + r.fps, 0) / firstThird.length;
  const lastAvg = lastThird.reduce((sum, r) => sum + r.fps, 0) / lastThird.length;
  
  const difference = lastAvg - firstAvg;
  
  if (difference > 2) return 'improving';
  if (difference < -2) return 'declining';
  return 'stable';
};

const identifyBottlenecks = (results: PerformanceTestResult[]): string[] => {
  const bottlenecks: string[] = [];
  
  // Check for sudden FPS drops
  for (let i = 1; i < results.length; i++) {
    const fpsDrop = results[i - 1].fps - results[i].fps;
    if (fpsDrop > 10) {
      bottlenecks.push(`Significant FPS drop at ${results[i].objectCount} objects`);
    }
  }
  
  // Check for memory issues
  const memoryResults = results.filter(r => r.memoryUsage !== undefined);
  if (memoryResults.length > 0) {
    const maxMemory = Math.max(...memoryResults.map(r => r.memoryUsage!));
    if (maxMemory > 200) {
      bottlenecks.push(`High memory usage detected (${maxMemory}MB)`);
    }
  }
  
  // Check for frame time spikes
  const highFrameTimes = results.filter(r => r.frameTime > 33.33); // > 30 FPS
  if (highFrameTimes.length > results.length * 0.3) {
    bottlenecks.push('Frequent frame time spikes detected');
  }
  
  return bottlenecks;
};