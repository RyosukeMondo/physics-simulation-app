import React, { useState } from 'react';
import PhysicsCanvas from './components/PhysicsCanvas';
import ControlPanel from './components/ControlPanel';
import ObjectSpawner from './components/ObjectSpawner';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorNotification from './components/ErrorNotification';
import LoadingIndicator from './components/LoadingIndicator';
import DebugPanel from './components/DebugPanel';
import { useSimulation } from './hooks/useSimulation';
import { SimulationError, ErrorType } from './utils/errorHandling';
import { debugLogger } from './utils/debugLogger';
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
    maxObjects,
    canAddBall,
    canAddBox,
    canAddGLB
  } = useSimulation();

  // Error handling state
  const [currentError, setCurrentError] = useState<SimulationError | null>(null);
  const [isInitializing] = useState(false);
  const [debugPanelVisible, setDebugPanelVisible] = useState(false);

  const handleLoadGLB = (url: string, file: File, collisionType?: 'box' | 'convex') => {
    debugLogger.info('Loading GLB file', { fileName: file.name, size: file.size, collisionType });
    
    try {
      if (collisionType) {
        addGLBWithCollisionType(url, file, collisionType);
      } else {
        addGLB(url, file);
      }
      debugLogger.info('GLB loading initiated successfully');
    } catch (err) {
      debugLogger.error('GLB loading failed', err);
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

        {/* Debug panel */}
        <DebugPanel
          isVisible={debugPanelVisible}
          onToggle={() => setDebugPanelVisible(!debugPanelVisible)}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
