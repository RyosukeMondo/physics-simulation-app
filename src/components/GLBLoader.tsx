import React, { useRef, useState } from 'react';

interface GLBLoaderProps {
  onLoadGLB: (url: string, file: File, collisionType?: 'box' | 'convex') => void;
  disabled?: boolean;
  className?: string;
}

const GLBLoader: React.FC<GLBLoaderProps> = ({
  onLoadGLB,
  disabled = false,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collisionType, setCollisionType] = useState<'box' | 'convex'>('box');

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.glb') && !file.name.toLowerCase().endsWith('.gltf')) {
      setError('Please select a GLB or GLTF file');
      return;
    }

    // Validate file size (limit to 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError('File size must be less than 50MB');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create object URL for the file
      const url = URL.createObjectURL(file);
      
      // Call the parent callback with the URL, file, and collision type
      onLoadGLB(url, file, collisionType);
      
      setIsLoading(false);
      
      // Clear the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load GLB file');
      setIsLoading(false);
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
          className={`control-button load-glb ${isLoading ? 'loading' : ''}`}
          onClick={handleFileSelect}
          disabled={disabled || isLoading}
          title={disabled ? "Resume simulation to load GLB models" : "Load a GLB or GLTF model file"}
        >
          {isLoading ? 'Loading...' : 'Load GLB'}
        </button>
      </div>
      
      {error && (
        <div className="error-message" style={{ 
          color: 'red', 
          fontSize: '12px', 
          marginTop: '4px',
          maxWidth: '200px',
          wordWrap: 'break-word'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default GLBLoader;