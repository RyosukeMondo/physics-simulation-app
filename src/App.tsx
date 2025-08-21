import React, { useState } from 'react';
import PhysicsCanvas from './components/PhysicsCanvas';
import ControlPanel from './components/ControlPanel';
import ObjectSpawner from './components/ObjectSpawner';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorNotification from './components/ErrorNotification';
import LoadingIndicator from './components/LoadingIndicator';
import { useSimulation } from './hooks/useSimulation';
import { SimulationError, ErrorType } from './utils/errorHandling';
import './App.css';

function App() {
  const {
    objects,
    isRunning,
    resetKey,
    addBall,
    addBox,
    addGLB,
    addGLBWithCollisionType,
    toggleSimulation,
    removeAllObjects,
    objectCount,
    performanceWarnings,
    clearPerformanceWarnings,
    maxObjects,
    canAddBall,
    canAddBox,
    canAddGLB
  } = useSimulation();

  // Error handling state
  const [currentError, setCurrentError] = useState<SimulationError | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const handleLoadGLB = (url: string, file: File, collisionType?: 'box' | 'convex') => {
    try {
      if (collisionType) {
        addGLBWithCollisionType(url, file, collisionType);
      } else {
        addGLB(url, file);
      }
    } catch (err) {
      const error = err instanceof SimulationError 
        ? err 
        : new SimulationError(ErrorType.GLB_LOADING_FAILED, err instanceof Error ? err : new Error('Unknown error'));
      setCurrentError(error);
    }
  };

  const handleError = (error: SimulationError) => {
    setCurrentError(error);
  };

  const handleDismissError = () => {
    setCurrentError(null);
  };

  const handleAppError = (error: Error, errorInfo: React.ErrorInfo) => {
    const simulationError = new SimulationError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { errorInfo }
    );
    setCurrentError(simulationError);
  };

  return (
    <ErrorBoundary 
      onError={handleAppError}
      resetKeys={[resetKey]}
      resetOnPropsChange={true}
    >
      <div className="App" style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, position: 'relative' }}>
        <PhysicsCanvas key={resetKey} isRunning={isRunning}>
          <ObjectSpawner objects={objects} onError={handleError} />
        </PhysicsCanvas>
        
        <ControlPanel
          onAddBall={addBall}
          onAddBox={addBox}
          onLoadGLB={handleLoadGLB}
          onToggleSimulation={toggleSimulation}
          onReset={removeAllObjects}
          isRunning={isRunning}
          objectCount={objectCount}
          maxObjects={maxObjects}
          canAddBall={canAddBall}
          canAddBox={canAddBox}
          canAddGLB={canAddGLB}
          performanceWarnings={performanceWarnings}
          onError={handleError}
        />

        {/* Loading indicator for app initialization */}
        <LoadingIndicator
          isLoading={isInitializing}
          message="Initializing physics simulation..."
          overlay={true}
        />

        {/* Error notification */}
        <ErrorNotification
          error={currentError}
          onDismiss={handleDismissError}
          autoHide={false}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
