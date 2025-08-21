// Debug logging utility for physics simulation
export class DebugLogger {
  private static instance: DebugLogger;
  private logs: Array<{ timestamp: number; level: string; message: string; data?: any }> = [];
  private isEnabled = process.env.NODE_ENV === 'development';
  private maxLogs = 1000;

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    if (!this.isEnabled) return;

    const logEntry = {
      timestamp: Date.now(),
      level,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : undefined
    };

    this.logs.push(logEntry);
    
    // Keep only last maxLogs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with color coding
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [PHYSICS-DEBUG]`;
    
    switch (level) {
      case 'info':
        console.log(`%c${prefix} ${message}`, 'color: blue', data);
        break;
      case 'warn':
        console.warn(`%c${prefix} ${message}`, 'color: orange', data);
        break;
      case 'error':
        console.error(`%c${prefix} ${message}`, 'color: red', data);
        break;
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  getLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  // Create a JSON string for export
  toJSON() {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'node',
      logs: this.logs,
    }, null, 2);
  }

  // Trigger a client-side download of the logs
  exportToFile(filename: string = `physics-logs-${Date.now()}.json`) {
    if (typeof window === 'undefined') return;
    const json = this.toJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Validate object properties with detailed logging
  validateObject(obj: any, name: string, requiredProps: string[]): boolean {
    this.info(`Validating ${name}`, { obj, requiredProps });
    
    if (!obj) {
      this.error(`${name} is null or undefined`);
      return false;
    }

    for (const prop of requiredProps) {
      if (!(prop in obj)) {
        this.error(`${name} missing required property: ${prop}`, obj);
        return false;
      }
      
      if (obj[prop] === undefined || obj[prop] === null) {
        this.error(`${name}.${prop} is null or undefined`, obj);
        return false;
      }
    }

    this.info(`${name} validation passed`);
    return true;
  }

  // Validate position array specifically
  validatePosition(position: any, context: string): [number, number, number] | null {
    this.info(`Validating position for ${context}`, { position });

    if (!position) {
      this.error(`Position is null/undefined for ${context}`);
      return null;
    }

    if (!Array.isArray(position)) {
      this.error(`Position is not an array for ${context}`, { position, type: typeof position });
      return null;
    }

    if (position.length !== 3) {
      this.error(`Position array length is ${position.length}, expected 3 for ${context}`, position);
      return null;
    }

    for (let i = 0; i < 3; i++) {
      if (typeof position[i] !== 'number' || isNaN(position[i])) {
        this.error(`Position[${i}] is not a valid number for ${context}`, { position, invalidValue: position[i] });
        return null;
      }
    }

    this.info(`Position validation passed for ${context}`, position);
    return position as [number, number, number];
  }
}

export const debugLogger = DebugLogger.getInstance();