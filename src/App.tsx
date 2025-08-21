import React from 'react';
import PhysicsCanvas from './components/PhysicsCanvas';
import ControlPanel from './components/ControlPanel';
import ObjectSpawner from './components/ObjectSpawner';
import { useSimulation } from './hooks/useSimulation';
import './App.css';

function App() {
  const {
    objects,
    isRunning,
    resetKey,
    addBall,
    addBox,
    addGLB,
    toggleSimulation,
    removeAllObjects,
    objectCount
  } = useSimulation();

  const handleLoadGLB = (url: string, file: File) => {
    addGLB(url, file);
  };

  return (
    <div className="App" style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, position: 'relative' }}>
      <PhysicsCanvas key={resetKey} isRunning={isRunning}>
        <ObjectSpawner objects={objects} />
      </PhysicsCanvas>
      
      <ControlPanel
        onAddBall={addBall}
        onAddBox={addBox}
        onLoadGLB={handleLoadGLB}
        onToggleSimulation={toggleSimulation}
        onReset={removeAllObjects}
        isRunning={isRunning}
        objectCount={objectCount}
      />
    </div>
  );
}

export default App;
