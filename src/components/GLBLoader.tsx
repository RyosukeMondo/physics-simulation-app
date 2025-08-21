import React, { useRef, useState } from 'react';
import { SimulationError, ErrorType, validateGLBFile, formatFileSize, logError } from '../utils/errorHandling';
import LoadingIndicator from './LoadingIndicator';

interface GLBLoaderProps {
  onLoadGLB: (url: string, file: File, collisionType?: 'box' | 'convex') => void;
  onError?: (error: SimulationError) => void;
  disabled?: boolean;
  limitReached?: boolean;
  className?: string;
}

const GLBLoader: React.FC<GLBLoaderProps> = ({
  onLoadGLB,
  onError,
  disabled = false,
  limitReached = false,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [collisionType, setCollisionType] = useState<'box' | 'convex'>('box');

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear previous states
    setError(null);
    setSuccess(null);

    // Validate file before processing
    const validationError = validateGLBFile(file);
    if (validationError) {
      setError(validationError.userMessage);
      onError?.(validationError);
      logError(validationError);
      return;
    }

    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingMessage(`Loading ${file.name}...`);

    try {
      // Simulate realistic loading progress
      const progressSteps = [
        { progress: 10, message: 'Reading file...' },
        { progress: 30, message: 'Validating format...' },
        { progress: 50, message: 'Processing geometry...' },
        { progress: 70, message: 'Creating physics shape...' },
        { progress: 90, message: 'Finalizing...' }
      ];

      let currentStep = 0;
      const progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length) {
          const step = progressSteps[currentStep];
          setLoadingProgress(step.progress);
          setLoadingMessage(step.message);
          currentStep++;
        } else {
          clearInterval(progressInterval);
        }
      }, 200);

      // Create object URL for the file
      const url = URL.createObjectURL(file);
      
      // Add a small delay to show the loading process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call the parent callback with the URL, file, and collision type
      onLoadGLB(url, file, collisionType);
      
      // Complete the progress
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setLoadingMessage('Complete!');
      
      // Show success message
      const fileSize = formatFileSize(file.size);
      setSuccess(`Loaded ${file.name} (${fileSize}) successfully!`);
      setIsLoading(false);
      
      // Clear success message after 4 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 4000);
      
      // Clear the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const simulationError = err instanceof SimulationError 
        ? err 
        : new SimulationError(
            ErrorType.GLB_LOADING_FAILED, 
            err instanceof Error ? err : new Error('Unknown error'),
            { fileName: file.name, fileSize: file.size }
          );
      
      setError(simulationError.userMessage);
      onError?.(simulationError);
      logError(simulationError);
      setIsLoading(false);
      setLoadingProgress(0);
    }
  };

  return (
    <div className={`glb-loader ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled || isLoading}
      />
      
      <div className="glb-controls">
        <select
          value={collisionType}
          onChange={(e) => setCollisionType(e.target.value as 'box' | 'convex')}
          disabled={disabled || isLoading}
          className="collision-type-select"
          title="Choose collision detection method"
        >
          <option value="box">Box Collision</option>
          <option value="convex">Convex Hull</option>
        </select>
        
        <button
          className={`control-button load-glb ${isLoading ? 'loading' : ''} ${limitReached ? 'disabled' : ''}`}
          onClick={handleFileSelect}
          disabled={disabled || isLoading || limitReached}
          title={
            disabled ? "Resume simulation to load GLB models" :
            limitReached ? "GLB model limit reached" :
            "Load a GLB or GLTF model file"
          }
        >
          {isLoading ? `Loading... ${loadingProgress}%` : 
           limitReached ? 'Load GLB (Limit)' : 'Load GLB'}
        </button>
        
        {isLoading && (
          <LoadingIndicator
            isLoading={isLoading}
            progress={loadingProgress}
            message={loadingMessage}
            size="small"
          />
        )}
      </div>
      
      {error && (
        <div className="feedback-message error-message">
          {error}
        </div>
      )}
      
      {success && (
        <div className="feedback-message success-message">
          {success}
        </div>
      )}
    </div>
  );
};

export default GLBLoader;