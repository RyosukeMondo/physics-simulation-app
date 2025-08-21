import React from 'react';
import { usePerformance } from '../hooks/usePerformance';
import { PerformanceOptimizer, PERFORMANCE_LIMITS } from '../utils/performanceOptimization';
import './PerformanceMonitor.css';

interface PerformanceMonitorProps {
  objectCount: number;
  performanceWarnings: string[];
  onClearWarnings: () => void;
  className?: string;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  objectCount,
  performanceWarnings,
  onClearWarnings,
  className = ''
}) => {
  const { fps, frameTime, memoryUsage } = usePerformance();
  const optimizer = PerformanceOptimizer.getInstance();
  
  const performanceStatus = optimizer.getPerformanceStatus([], fps, memoryUsage);
  const cacheStats = optimizer.getCacheStats();
  
  const utilizationPercentage = Math.round((objectCount / PERFORMANCE_LIMITS.MAX_OBJECTS) * 100);
  const isHighUtilization = utilizationPercentage > 80;
  const isNearLimit = utilizationPercentage > 90;

  return (
    <div className={`performance-monitor ${className}`}>
      <div className="performance-header">
        <h3>Performance Monitor</h3>
        {performanceWarnings.length > 0 && (
          <button 
            className="clear-warnings-btn"
            onClick={onClearWarnings}
            title="Clear warnings"
          >
            ✕
          </button>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="performance-metrics">
        <div className="metric">
          <span className="metric-label">FPS:</span>
          <span className={`metric-value ${fps < 30 ? 'warning' : fps < 45 ? 'caution' : 'good'}`}>
            {fps}
          </span>
        </div>
        
        <div className="metric">
          <span className="metric-label">Frame Time:</span>
          <span className="metric-value">{frameTime}ms</span>
        </div>
        
        {memoryUsage !== undefined && (
          <div className="metric">
            <span className="metric-label">Memory:</span>
            <span className={`metric-value ${memoryUsage > 100 ? 'warning' : 'good'}`}>
              {memoryUsage}MB
            </span>
          </div>
        )}
      </div>

      {/* Object Count and Limits */}
      <div className="object-limits">
        <div className="limit-bar">
          <div className="limit-label">
            Objects: {objectCount}/{PERFORMANCE_LIMITS.MAX_OBJECTS}
          </div>
          <div className="limit-progress">
            <div 
              className={`limit-fill ${isNearLimit ? 'critical' : isHighUtilization ? 'warning' : 'normal'}`}
              style={{ width: `${utilizationPercentage}%` }}
            />
          </div>
          <div className="limit-percentage">{utilizationPercentage}%</div>
        </div>
        
        <div className="type-limits">
          <div className="type-limit">
            <span>Balls: {objectCount}/{PERFORMANCE_LIMITS.MAX_BALLS}</span>
          </div>
          <div className="type-limit">
            <span>Boxes: {objectCount}/{PERFORMANCE_LIMITS.MAX_BOXES}</span>
          </div>
          <div className="type-limit">
            <span>GLB: {objectCount}/{PERFORMANCE_LIMITS.MAX_GLB_MODELS}</span>
          </div>
        </div>
      </div>

      {/* Cache Statistics */}
      <div className="cache-stats">
        <div className="cache-stat">
          <span>Materials: {cacheStats.materials}</span>
        </div>
        <div className="cache-stat">
          <span>Geometries: {cacheStats.geometries}</span>
        </div>
      </div>

      {/* Performance Warnings */}
      {performanceWarnings.length > 0 && (
        <div className="performance-warnings">
          <div className="warnings-header">⚠️ Warnings:</div>
          {performanceWarnings.map((warning, index) => (
            <div key={index} className="warning-item">
              {warning}
            </div>
          ))}
        </div>
      )}

      {/* Performance Tips */}
      {(isHighUtilization || fps < 45) && (
        <div className="performance-tips">
          <div className="tips-header">💡 Tips:</div>
          {isHighUtilization && (
            <div className="tip-item">Consider removing some objects to improve performance</div>
          )}
          {fps < 45 && (
            <div className="tip-item">Low FPS detected - try reducing object count or complexity</div>
          )}
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;