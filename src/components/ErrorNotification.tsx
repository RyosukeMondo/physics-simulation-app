import React, { useState, useEffect } from 'react';
import { SimulationError } from '../utils/errorHandling';
import './ErrorNotification.css';

interface ErrorNotificationProps {
  error: SimulationError | null;
  onDismiss: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  onDismiss,
  autoHide = false,
  autoHideDelay = 5000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      setShowDetails(false);

      if (autoHide) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoHideDelay);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [error, autoHide, autoHideDelay]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 300); // Wait for animation to complete
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  if (!error || !isVisible) {
    return null;
  }

  return (
    <div className={`error-notification ${isVisible ? 'visible' : ''}`}>
      <div className="error-notification-content">
        <div className="error-header">
          <div className="error-icon">⚠️</div>
          <div className="error-title">Error</div>
          <button 
            className="error-close"
            onClick={handleDismiss}
            title="Dismiss error"
          >
            ×
          </button>
        </div>

        <div className="error-message">
          {error.userMessage}
        </div>

        {error.suggestions && error.suggestions.length > 0 && (
          <div className="error-suggestions">
            <div className="suggestions-title">Try this:</div>
            <ul className="suggestions-list">
              {error.suggestions.map((suggestion, index) => (
                <li key={index} className="suggestion-item">
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        {(error.context || error.stack) && (
          <div className="error-details-toggle">
            <button 
              className="details-button"
              onClick={toggleDetails}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
        )}

        {showDetails && (
          <div className="error-details">
            {error.context && (
              <div className="error-context">
                <div className="context-title">Context:</div>
                <pre className="context-content">
                  {JSON.stringify(error.context, null, 2)}
                </pre>
              </div>
            )}
            
            {process.env.NODE_ENV === 'development' && error.stack && (
              <div className="error-stack">
                <div className="stack-title">Stack Trace:</div>
                <pre className="stack-content">
                  {error.stack}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="error-actions">
          <button 
            className="dismiss-button"
            onClick={handleDismiss}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorNotification;