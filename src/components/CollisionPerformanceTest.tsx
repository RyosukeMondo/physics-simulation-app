import React, { useState, useCallback, useEffect } from 'react';
import { usePerformance } from '../hooks/usePerformance';
import { PerformanceOptimizer } from '../utils/performanceOptimization';
import './CollisionPerformanceTest.css';

interface CollisionTestResult {
  objectCount: number;
  fps: number;
  frameTime: number;
  memoryUsage?: number;
  timestamp: number;
}

interface CollisionPerformanceTestProps {
  onSpawnTestObjects: (count: number, type: 'ball' | 'box' | 'mixed') => void;
  onClearObjects: () => void;
  currentObjectCount: number;
  isRunning: boolean;
}

const CollisionPerformanceTest: React.FC<CollisionPerformanceTestProps> = ({
  onSpawnTestObjects,
  onClearObjects,
  currentObjectCount,
  isRunning
}) => {
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testResults, setTestResults] = useState<CollisionTestResult[]>([]);
  const [testType, setTestType] = useState<'ball' | 'box' | 'mixed'>('mixed');
  const [testDuration, setTestDuration] = useState(10); // seconds
  const [testProgress, setTestProgress] = useState(0);
  
  const { fps, frameTime, memoryUsage } = usePerformance();
  const optimizer = PerformanceOptimizer.getInstance();

  // Record performance data during test
  useEffect(() => {
    if (isTestRunning && fps > 0) {
      const result: CollisionTestResult = {
        objectCount: currentObjectCount,
        fps,
        frameTime,
        memoryUsage,
        timestamp: Date.now()
      };
      
      setTestResults(prev => [...prev, result]);
    }
  }, [isTestRunning, fps, frameTime, memoryUsage, currentObjectCount]);

  const runPerformanceTest = useCallback(async () => {
    if (!isRunning) {
      alert('Please start the simulation first');
      return;
    }

    setIsTestRunning(true);
    setTestResults([]);
    setTestProgress(0);
    
    // Clear existing objects
    onClearObjects();
    
    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const testSteps = [
      { count: 5, delay: 1000 },
      { count: 10, delay: 1000 },
      { count: 15, delay: 1000 },
      { count: 20, delay: 1000 },
      { count: 25, delay: 1000 },
      { count: 30, delay: 1000 },
      { count: 35, delay: 1000 },
      { count: 40, delay: 1000 }
    ];
    
    for (let i = 0; i < testSteps.length; i++) {
      const step = testSteps[i];
      
      // Spawn objects for this step
      onSpawnTestObjects(step.count, testType);
      
      // Update progress
      setTestProgress(((i + 1) / testSteps.length) * 100);
      
      // Wait for physics to stabilize
      await new Promise(resolve => setTimeout(resolve, step.delay));
      
      if (!isTestRunning) break; // Allow early termination
    }
    
    setIsTestRunning(false);
    setTestProgress(100);
  }, [isRunning, onSpawnTestObjects, onClearObjects, testType, isTestRunning]);

  const stopTest = useCallback(() => {
    setIsTestRunning(false);
    setTestProgress(0);
  }, []);

  const clearResults = useCallback(() => {
    setTestResults([]);
    setTestProgress(0);
  }, []);

  const getPerformanceAnalysis = () => {
    if (testResults.length === 0) return null;
    
    const avgFps = testResults.reduce((sum, r) => sum + r.fps, 0) / testResults.length;
    const minFps = Math.min(...testResults.map(r => r.fps));
    const maxFps = Math.max(...testResults.map(r => r.fps));
    const maxObjects = Math.max(...testResults.map(r => r.objectCount));
    
    const performanceDropoff = testResults.find(r => r.fps < 30);
    const recommendedMaxObjects = performanceDropoff ? performanceDropoff.objectCount - 5 : maxObjects;
    
    return {
      avgFps: Math.round(avgFps),
      minFps,
      maxFps,
      maxObjects,
      recommendedMaxObjects: Math.max(5, recommendedMaxObjects),
      totalSamples: testResults.length
    };
  };

  const analysis = getPerformanceAnalysis();

  return (
    <div className="collision-performance-test">
      <div className="test-header">
        <h3>🔬 Collision Performance Test</h3>
        <p>Test collision detection performance with increasing object counts</p>
      </div>

      <div className="test-controls">
        <div className="test-config">
          <label>
            Test Type:
            <select 
              value={testType} 
              onChange={(e) => setTestType(e.target.value as 'ball' | 'box' | 'mixed')}
              disabled={isTestRunning}
            >
              <option value="ball">Balls Only</option>
              <option value="box">Boxes Only</option>
              <option value="mixed">Mixed Objects</option>
            </select>
          </label>
        </div>

        <div className="test-buttons">
          {!isTestRunning ? (
            <button 
              className="test-button start-test"
              onClick={runPerformanceTest}
              disabled={!isRunning}
            >
              Start Test
            </button>
          ) : (
            <button 
              className="test-button stop-test"
              onClick={stopTest}
            >
              Stop Test
            </button>
          )}
          
          <button 
            className="test-button clear-results"
            onClick={clearResults}
            disabled={isTestRunning}
          >
            Clear Results
          </button>
        </div>
      </div>

      {isTestRunning && (
        <div className="test-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${testProgress}%` }}
            />
          </div>
          <div className="progress-text">
            Testing... {Math.round(testProgress)}%
          </div>
        </div>
      )}

      {analysis && (
        <div className="test-analysis">
          <h4>📊 Performance Analysis</h4>
          <div className="analysis-grid">
            <div className="analysis-item">
              <span className="analysis-label">Average FPS:</span>
              <span className={`analysis-value ${analysis.avgFps >= 45 ? 'good' : analysis.avgFps >= 30 ? 'ok' : 'poor'}`}>
                {analysis.avgFps}
              </span>
            </div>
            <div className="analysis-item">
              <span className="analysis-label">FPS Range:</span>
              <span className="analysis-value">
                {analysis.minFps} - {analysis.maxFps}
              </span>
            </div>
            <div className="analysis-item">
              <span className="analysis-label">Max Objects Tested:</span>
              <span className="analysis-value">{analysis.maxObjects}</span>
            </div>
            <div className="analysis-item">
              <span className="analysis-label">Recommended Limit:</span>
              <span className="analysis-value recommended">
                {analysis.recommendedMaxObjects}
              </span>
            </div>
          </div>
          
          <div className="performance-recommendation">
            {analysis.avgFps >= 45 ? (
              <div className="recommendation good">
                ✅ Excellent performance! Your system handles collision detection well.
              </div>
            ) : analysis.avgFps >= 30 ? (
              <div className="recommendation ok">
                ⚠️ Good performance, but consider limiting objects to maintain 60 FPS.
              </div>
            ) : (
              <div className="recommendation poor">
                ❌ Performance issues detected. Consider reducing object limits or complexity.
              </div>
            )}
          </div>
        </div>
      )}

      {testResults.length > 0 && (
        <div className="test-chart">
          <h4>📈 Performance Chart</h4>
          <div className="chart-container">
            {testResults.map((result, index) => (
              <div 
                key={index}
                className="chart-bar"
                style={{ 
                  height: `${Math.max(10, (result.fps / 60) * 100)}%`,
                  backgroundColor: result.fps >= 45 ? '#4ade80' : result.fps >= 30 ? '#fbbf24' : '#f87171'
                }}
                title={`Objects: ${result.objectCount}, FPS: ${result.fps}`}
              />
            ))}
          </div>
          <div className="chart-labels">
            <span>Objects →</span>
            <span>FPS ↑</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollisionPerformanceTest;