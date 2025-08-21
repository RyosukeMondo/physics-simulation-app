import React, { useState } from 'react';
import GLBLoader from './GLBLoader';
import { usePerformance } from '../hooks/usePerformance';
import './ControlPanel.css';

import { SimulationError } from '../utils/errorHandling';

interface ControlPanelProps {
  onAddBall: () => void;
  onAddBox: () => void;
  onLoadGLB: (url: string, file: File, collisionType?: 'box' | 'convex', scale?: number) => void;
  onToggleSimulation: () => void;
  onReset: () => void;
  isRunning: boolean;
  objectCount: number;
  maxObjects?: number;
  canAddBall?: boolean;
  canAddBox?: boolean;
  canAddGLB?: boolean;
  performanceWarnings?: string[];
  onError?: (error: SimulationError) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onAddBall,
  onAddBox,
  onLoadGLB,
  onToggleSimulation,
  onReset,
  isRunning,
  objectCount,
  maxObjects = 50,
  canAddBall = true,
  canAddBox = true,
  canAddGLB = true,
  performanceWarnings = [],
  onError
}) => {
  const { fps, frameTime, memoryUsage } = usePerformance();
  const [glbScale, setGlbScale] = useState<number>(1);
  return (
    <div className="control-panel">
      <h3>Physics Simulation Controls</h3>
      
      <div className="button-group">
        <button 
          className={`control-button add-ball ${!canAddBall ? 'disabled' : ''}`}
          onClick={onAddBall}
          disabled={!isRunning || !canAddBall}
          title={
            !isRunning ? "Resume simulation to add objects" :
            !canAddBall ? "Ball limit reached" :
            "Add a physics ball to the scene"
          }
        >
          Add Ball {!canAddBall && '(Limit)'}
        </button>
        
        <button 
          className={`control-button add-box ${!canAddBox ? 'disabled' : ''}`}
          onClick={onAddBox}
          disabled={!isRunning || !canAddBox}
          title={
            !isRunning ? "Resume simulation to add objects" :
            !canAddBox ? "Box limit reached" :
            "Add a physics box to the scene"
          }
        >
          Add Square {!canAddBox && '(Limit)'}
        </button>
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
            <span className={`info-value ${objectCount >= maxObjects * 0.9 ? 'warning' : ''}`}>
              {objectCount}/{maxObjects}
            </span>
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
        
        {performanceWarnings.length > 0 && (
          <div className="info-section warnings-section">
            <div className="info-title">⚠️ Warnings</div>
            {performanceWarnings.slice(0, 3).map((warning, index) => (
              <div key={index} className="warning-item">
                {warning}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GLB controls at the bottom: Load + Scale slider */}
      <div className="info-section glb-controls-section" style={{ marginTop: '12px' }}>
        <div className="info-title">GLB Model</div>
        <GLBLoader
          onLoadGLB={(url, file, collisionType) => onLoadGLB(url, file, collisionType, glbScale)}
          onError={onError}
          disabled={!isRunning || !canAddGLB}
          limitReached={!canAddGLB}
        />
        <div className="info-item" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <span className="info-label">Scale:</span>
          <input
            type="range"
            min={0.1}
            max={100}
            step={0.1}
            value={glbScale}
            onChange={(e) => setGlbScale(Number(e.target.value))}
            title="Scale of loaded GLB models"
            style={{ flex: 1 }}
          />
          <span className="info-value" style={{ width: 60, textAlign: 'right' }}>{glbScale.toFixed(2)}x</span>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;