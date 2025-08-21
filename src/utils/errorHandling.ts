// Error types for the physics simulation app
export enum ErrorType {
  GLB_LOADING_FAILED = 'GLB_LOADING_FAILED',
  GLB_PARSING_FAILED = 'GLB_PARSING_FAILED',
  GLB_TOO_LARGE = 'GLB_TOO_LARGE',
  GLB_INVALID_FORMAT = 'GLB_INVALID_FORMAT',
  PHYSICS_INITIALIZATION_FAILED = 'PHYSICS_INITIALIZATION_FAILED',
  PHYSICS_SIMULATION_ERROR = 'PHYSICS_SIMULATION_ERROR',
  WEBGL_NOT_SUPPORTED = 'WEBGL_NOT_SUPPORTED',
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  originalError?: Error;
  timestamp: number;
  context?: Record<string, any>;
}

// User-friendly error messages
const ERROR_MESSAGES: Record<ErrorType, { message: string; userMessage: string; suggestions?: string[] }> = {
  [ErrorType.GLB_LOADING_FAILED]: {
    message: 'Failed to load GLB file',
    userMessage: 'Unable to load the 3D model file. Please check the file and try again.',
    suggestions: [
      'Make sure the file is a valid GLB or GLTF format',
      'Check that the file is not corrupted',
      'Try a different GLB file'
    ]
  },
  [ErrorType.GLB_PARSING_FAILED]: {
    message: 'Failed to parse GLB file structure',
    userMessage: 'The 3D model file appears to be corrupted or in an unsupported format.',
    suggestions: [
      'Export the model again from your 3D software',
      'Use a different GLB file',
      'Check that all textures are embedded in the GLB file'
    ]
  },
  [ErrorType.GLB_TOO_LARGE]: {
    message: 'GLB file exceeds size limit',
    userMessage: 'The 3D model file is too large. Please use a smaller file.',
    suggestions: [
      'Reduce the polygon count of your model',
      'Compress textures or reduce their resolution',
      'Use a file smaller than 50MB'
    ]
  },
  [ErrorType.GLB_INVALID_FORMAT]: {
    message: 'Invalid GLB file format',
    userMessage: 'The selected file is not a valid GLB or GLTF format.',
    suggestions: [
      'Make sure the file has a .glb or .gltf extension',
      'Export your model in GLB format from your 3D software',
      'Try a different file'
    ]
  },
  [ErrorType.PHYSICS_INITIALIZATION_FAILED]: {
    message: 'Physics engine initialization failed',
    userMessage: 'Unable to start the physics simulation. Please refresh the page.',
    suggestions: [
      'Refresh the page and try again',
      'Make sure your browser supports WebAssembly',
      'Close other browser tabs to free up memory'
    ]
  },
  [ErrorType.PHYSICS_SIMULATION_ERROR]: {
    message: 'Physics simulation encountered an error',
    userMessage: 'The physics simulation has stopped working. You can reset to continue.',
    suggestions: [
      'Click the Reset button to restart the simulation',
      'Remove some objects to reduce complexity',
      'Refresh the page if the problem persists'
    ]
  },
  [ErrorType.WEBGL_NOT_SUPPORTED]: {
    message: 'WebGL is not supported or disabled',
    userMessage: 'Your browser does not support 3D graphics. Please use a modern browser.',
    suggestions: [
      'Update your browser to the latest version',
      'Enable WebGL in your browser settings',
      'Try using Chrome, Firefox, or Safari'
    ]
  },
  [ErrorType.MEMORY_LIMIT_EXCEEDED]: {
    message: 'Memory limit exceeded',
    userMessage: 'Too many objects in the scene. Please remove some objects or reset.',
    suggestions: [
      'Click Reset to remove all objects',
      'Add fewer objects at once',
      'Close other browser tabs to free up memory'
    ]
  },
  [ErrorType.NETWORK_ERROR]: {
    message: 'Network connection error',
    userMessage: 'Unable to load resources. Please check your internet connection.',
    suggestions: [
      'Check your internet connection',
      'Refresh the page and try again',
      'Try again in a few moments'
    ]
  },
  [ErrorType.UNKNOWN_ERROR]: {
    message: 'An unknown error occurred',
    userMessage: 'Something unexpected happened. Please try refreshing the page.',
    suggestions: [
      'Refresh the page and try again',
      'Clear your browser cache',
      'Try using a different browser'
    ]
  }
};

export class SimulationError extends Error {
  public readonly type: ErrorType;
  public readonly userMessage: string;
  public readonly timestamp: number;
  public readonly context?: Record<string, any>;
  public readonly suggestions?: string[];

  constructor(type: ErrorType, originalError?: Error, context?: Record<string, any>) {
    const errorConfig = ERROR_MESSAGES[type];
    super(errorConfig.message);
    
    this.name = 'SimulationError';
    this.type = type;
    this.userMessage = errorConfig.userMessage;
    this.suggestions = errorConfig.suggestions;
    this.timestamp = Date.now();
    this.context = context;

    // Preserve original error stack if available
    if (originalError) {
      this.stack = originalError.stack;
      this.cause = originalError;
    }
  }
}

// Error detection utilities
export const detectErrorType = (error: Error): ErrorType => {
  const message = error.message.toLowerCase();
  
  if (message.includes('glb') || message.includes('gltf')) {
    if (message.includes('size') || message.includes('large')) {
      return ErrorType.GLB_TOO_LARGE;
    }
    if (message.includes('format') || message.includes('invalid')) {
      return ErrorType.GLB_INVALID_FORMAT;
    }
    if (message.includes('parse') || message.includes('parsing')) {
      return ErrorType.GLB_PARSING_FAILED;
    }
    return ErrorType.GLB_LOADING_FAILED;
  }
  
  if (message.includes('webgl')) {
    return ErrorType.WEBGL_NOT_SUPPORTED;
  }
  
  if (message.includes('physics') || message.includes('ammo')) {
    return ErrorType.PHYSICS_SIMULATION_ERROR;
  }
  
  if (message.includes('memory') || message.includes('heap')) {
    return ErrorType.MEMORY_LIMIT_EXCEEDED;
  }
  
  if (message.includes('network') || message.includes('fetch')) {
    return ErrorType.NETWORK_ERROR;
  }
  
  return ErrorType.UNKNOWN_ERROR;
};

// Create a simulation error from a generic error
export const createSimulationError = (error: Error, context?: Record<string, any>): SimulationError => {
  const errorType = detectErrorType(error);
  return new SimulationError(errorType, error, context);
};

// Validate GLB file before processing
export const validateGLBFile = (file: File): SimulationError | null => {
  // Check file extension
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.glb') && !fileName.endsWith('.gltf')) {
    return new SimulationError(ErrorType.GLB_INVALID_FORMAT, undefined, { fileName });
  }
  
  // Check file size (50MB limit)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return new SimulationError(ErrorType.GLB_TOO_LARGE, undefined, { 
      fileSize: file.size, 
      maxSize,
      fileName 
    });
  }
  
  return null;
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Log error for debugging
export const logError = (error: SimulationError | Error): void => {
  if (error instanceof SimulationError) {
    console.error(`[${error.type}] ${error.message}`, {
      userMessage: error.userMessage,
      suggestions: error.suggestions,
      context: error.context,
      timestamp: new Date(error.timestamp).toISOString()
    });
  } else {
    console.error('Unhandled error:', error);
  }
};