import React from 'react';
import './ControlPanel.css';

interface ControlPanelProps {
  onAddBall: () => void;
  onAddBox: () => void;
  objectCount: number;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onAddBall,
  onAddBox,
  objectCount
}) => {
  return (
    <div className="control-panel">
      <h3>Physics Simulation Controls</h3>
      
      <div className="button-group">
        <button 
          className="control-button add-ball"
          onClick={onAddBall}
          title="Add a physics ball to the scene"
        >
          Add Ball
        </button>
        
        <button 
          className="control-button add-box"
          onClick={onAddBox}
          title="Add a physics box to the scene"
        >
          Add Square
        </button>
      </div>
      
      <div className="info-panel">
        <div className="object-count">
          Objects: {objectCount}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;