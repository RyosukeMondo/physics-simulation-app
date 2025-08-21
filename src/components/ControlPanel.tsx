import React from 'react';
import GLBLoader from './GLBLoader';
import { usePerformance } from '../hooks/usePerformance';
import './ControlPanel.css';

interface ControlPanelProps {
  onAddBall: () => void;
  onAddBox: () => void;
  onLoadGLB: (url: string, file: File, collisionType?: 'box' | 'convex') => void;
  onToggleSimulation: () => void;
  onReset: () => void;
  isRunning: boolean;
  objectCount: number;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onAddBall,
  onAddBox,
  onLoadGLB,
  onToggleSimulation,
  onReset,
  isRunning,
  objectCount
}) => {
  const { fps, frameTime, memoryUsage } = usePerformance();
  return (
    <div className="control-panel">
      <h3>Physics Simulation Controls</h3>
      
      <div className="button-group">
        <button 
          className="control-button add-ball"
          onClick={onAddBall}
          disabled={!isRunning}
          title={isRunning ? "Add a physics ball to the scene" : "Resume simulation to add objects"}
        >
          Add Ball
        </button>
        
        <button 
          className="control-button add-box"
          onClick={onAddBox}
          disabled={!isRunning}
          title={isRunning ? "Add a physics box to the scene" : "Resume simulation to add objects"}
        >
          Add Square
        </button>
        
        <GLBLoader
          onLoadGLB={onLoadGLB}
          disabled={!isRunning}
        />
      </div>

      <div className="button-group simulation-controls">
        <button 
          className={`control-button ${isRunning ? 'pause' : 'play'}`}
          onClick={onToggleSimulation}
          title={isRunning ? 'Pause the physics simulation' : 'Resume the physics simulation'}
        >
          {isRunning ? 'Pause' : 'Play'}
        </button>
        
        <button 
          className="control-button reset"
          onClick={onReset}
          title="Remove all objects and reset the simulation"
        >
          Reset
        </button>
      </div>
      
      <div className="info-panel">
        <div className="info-section">
          <div className="info-title">Simulation</div>
          <div className="info-item">
            <span className="info-label">Objects:</span>
            <span className="info-value">{objectCount}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Status:</span>
            <span className={`info-value status-${isRunning ? 'running' : 'paused'}`}>
              {isRunning ? 'Running' : 'Paused'}
            </span>
          </div>
        </div>
        
        <div className="info-section performance-section">
          <div className="info-title">Performance</div>
          <div className="info-item">
            <span className="info-label">FPS:</span>
            <span className={`info-value fps-${fps >= 50 ? 'good' : fps >= 30 ? 'ok' : 'poor'}`}>
              {fps}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Frame:</span>
            <span className="info-value">{frameTime}ms</span>
          </div>
          {memoryUsage !== undefined && memoryUsage > 0 && (
            <div className="info-item">
              <span className="info-label">Memory:</span>
              <span className="info-value">{memoryUsage}MB</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;