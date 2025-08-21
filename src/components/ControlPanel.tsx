import React from 'react';
import './ControlPanel.css';

interface ControlPanelProps {
  onAddBall: () => void;
  onAddBox: () => void;
  onToggleSimulation: () => void;
  onReset: () => void;
  isRunning: boolean;
  objectCount: number;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onAddBall,
  onAddBox,
  onToggleSimulation,
  onReset,
  isRunning,
  objectCount
}) => {
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
        <div className="object-count">
          Objects: {objectCount}
        </div>
        <div className="simulation-status">
          Status: {isRunning ? 'Running' : 'Paused'}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;