import React from 'react';
import PhysicsCanvas from './components/PhysicsCanvas';
import ControlPanel from './components/ControlPanel';
import ObjectSpawner from './components/ObjectSpawner';
import { useSimulation } from './hooks/useSimulation';
import './App.css';

function App() {
  const {
    objects,
    addBall,
    addBox,
    objectCount
  } = useSimulation();

  return (
    <div className="App" style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, position: 'relative' }}>
      <PhysicsCanvas>
        <ObjectSpawner objects={objects} />
      </PhysicsCanvas>
      
      <ControlPanel
        onAddBall={addBall}
        onAddBox={addBox}
        objectCount={objectCount}
      />
    </div>
  );
}

export default App;
