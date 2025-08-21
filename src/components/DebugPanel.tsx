import React, { useState, useEffect } from 'react';
import { debugLogger } from '../utils/debugLogger';
import './DebugPanel.css';

interface DebugPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ isVisible, onToggle }) => {
  const [logs, setLogs] = useState(debugLogger.getLogs());
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setLogs(debugLogger.getLogs());
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  const filteredLogs = logs.filter(log => 
    filter === 'all' || log.level === filter
  );

  const clearLogs = () => {
    debugLogger.clearLogs();
    setLogs([]);
  };

  if (!isVisible) {
    return (
      <button className="debug-toggle-btn" onClick={onToggle}>
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="debug-panel">
      <div className="debug-header">
        <h3>🐛 Debug Panel</h3>
        <div className="debug-controls">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as any)}
            className="debug-filter"
          >
            <option value="all">All</option>
            <option value="info">Info</option>
            <option value="warn">Warnings</option>
            <option value="error">Errors</option>
          </select>
          <label className="debug-checkbox">
            <input 
              type="checkbox" 
              checked={autoScroll} 
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            Auto-scroll
          </label>
          <button onClick={clearLogs} className="debug-clear-btn">
            Clear
          </button>
          <button onClick={onToggle} className="debug-close-btn">
            ✕
          </button>
        </div>
      </div>
      
      <div className="debug-stats">
        <span>Total: {logs.length}</span>
        <span>Errors: {logs.filter(l => l.level === 'error').length}</span>
        <span>Warnings: {logs.filter(l => l.level === 'warn').length}</span>
        <span>Info: {logs.filter(l => l.level === 'info').length}</span>
      </div>

      <div className="debug-logs" id="debug-logs">
        {filteredLogs.map((log, index) => (
          <div key={index} className={`debug-log-entry ${log.level}`}>
            <div className="debug-log-header">
              <span className="debug-timestamp">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className={`debug-level ${log.level}`}>
                {log.level.toUpperCase()}
              </span>
            </div>
            <div className="debug-message">{log.message}</div>
            {log.data && (
              <details className="debug-data">
                <summary>Data</summary>
                <pre>{JSON.stringify(log.data, null, 2)}</pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {autoScroll && (
        <script>
          {`
            const logsContainer = document.getElementById('debug-logs');
            if (logsContainer) {
              logsContainer.scrollTop = logsContainer.scrollHeight;
            }
          `}
        </script>
      )}
    </div>
  );
};

export default DebugPanel;