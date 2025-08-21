import React from 'react';
import './LoadingIndicator.css';

interface LoadingIndicatorProps {
  isLoading: boolean;
  progress?: number;
  message?: string;
  size?: 'small' | 'medium' | 'large';
  overlay?: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  isLoading,
  progress,
  message = 'Loading...',
  size = 'medium',
  overlay = false
}) => {
  if (!isLoading) {
    return null;
  }

  const content = (
    <div className={`loading-indicator ${size}`}>
      <div className="loading-spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      
      <div className="loading-content">
        <div className="loading-message">{message}</div>
        
        {typeof progress === 'number' && (
          <div className="loading-progress">
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
            <div className="progress-text">
              {Math.round(progress)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div className="loading-overlay">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingIndicator;