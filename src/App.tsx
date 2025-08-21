import React from 'react';
import PhysicsCanvas from './components/PhysicsCanvas';
import './App.css';

function App() {
  return (
    <div className="App" style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <PhysicsCanvas>
        {/* Physics objects will be added here in future tasks */}
      </PhysicsCanvas>
    </div>
  );
}

export default App;
