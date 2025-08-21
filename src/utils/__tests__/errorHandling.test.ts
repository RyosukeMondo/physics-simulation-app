import {
  SimulationError,
  ErrorType,
  detectErrorType,
  createSimulationError,
  validateGLBFile,
  formatFileSize
} from '../errorHandling';

describe('errorHandling', () => {
  describe('SimulationError', () => {
    it('creates error with correct properties', () => {
      const originalError = new Error('Original error');
      const context = { fileName: 'test.glb' };
      
      const error = new SimulationError(ErrorType.GLB_LOADING_FAILED, originalError, context);

      expect(error.type).toBe(ErrorType.GLB_LOADING_FAILED);
      expect(error.message).toBe('Failed to load GLB file');
      expect(error.userMessage).toBe('Unable to load the 3D model file. Please check the file and try again.');
      expect(error.context).toBe(context);
      expect(error.suggestions).toEqual([
        'Make sure the file is a valid GLB or GLTF format',
        'Check that the file is not corrupted',
        'Try a different GLB file'
      ]);
      expect(error.timestamp).toBeGreaterThan(0);
    });
  });

  describe('detectErrorType', () => {
    it('detects GLB loading errors', () => {
      expect(detectErrorType(new Error('GLB file failed to load'))).toBe(ErrorType.GLB_LOADING_FAILED);
      expect(detectErrorType(new Error('GLTF parsing error'))).toBe(ErrorType.GLB_LOADING_FAILED);
    });

    it('detects GLB size errors', () => {
      expect(detectErrorType(new Error('GLB file too large'))).toBe(ErrorType.GLB_TOO_LARGE);
      expect(detectErrorType(new Error('File size exceeded'))).toBe(ErrorType.GLB_TOO_LARGE);
    });

    it('detects GLB format errors', () => {
      expect(detectErrorType(new Error('Invalid GLB format'))).toBe(ErrorType.GLB_INVALID_FORMAT);
      expect(detectErrorType(new Error('GLB format not supported'))).toBe(ErrorType.GLB_INVALID_FORMAT);
    });

    it('detects WebGL errors', () => {
      expect(detectErrorType(new Error('WebGL not supported'))).toBe(ErrorType.WEBGL_NOT_SUPPORTED);
    });

    it('detects physics errors', () => {
      expect(detectErrorType(new Error('Physics simulation failed'))).toBe(ErrorType.PHYSICS_SIMULATION_ERROR);
      expect(detectErrorType(new Error('Ammo.js error'))).toBe(ErrorType.PHYSICS_SIMULATION_ERROR);
    });

    it('detects memory errors', () => {
      expect(detectErrorType(new Error('Out of memory'))).toBe(ErrorType.MEMORY_LIMIT_EXCEEDED);
      expect(detectErrorType(new Error('Heap size exceeded'))).toBe(ErrorType.MEMORY_LIMIT_EXCEEDED);
    });

    it('detects network errors', () => {
      expect(detectErrorType(new Error('Network connection failed'))).toBe(ErrorType.NETWORK_ERROR);
      expect(detectErrorType(new Error('Fetch request failed'))).toBe(ErrorType.NETWORK_ERROR);
    });

    it('defaults to unknown error', () => {
      expect(detectErrorType(new Error('Some random error'))).toBe(ErrorType.UNKNOWN_ERROR);
    });
  });

  describe('createSimulationError', () => {
    it('creates SimulationError from generic Error', () => {
      const originalError = new Error('GLB loading failed');
      const context = { test: true };
      
      const simError = createSimulationError(originalError, context);

      expect(simError).toBeInstanceOf(SimulationError);
      expect(simError.type).toBe(ErrorType.GLB_LOADING_FAILED);
      expect(simError.context).toBe(context);
    });
  });

  describe('validateGLBFile', () => {
    it('returns null for valid GLB file', () => {
      const file = new File(['test'], 'test.glb', { type: 'model/gltf-binary' });
      expect(validateGLBFile(file)).toBeNull();
    });

    it('returns null for valid GLTF file', () => {
      const file = new File(['test'], 'test.gltf', { type: 'model/gltf+json' });
      expect(validateGLBFile(file)).toBeNull();
    });

    it('returns error for invalid file extension', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const error = validateGLBFile(file);
      
      expect(error).toBeInstanceOf(SimulationError);
      expect(error?.type).toBe(ErrorType.GLB_INVALID_FORMAT);
    });

    it('returns error for file too large', () => {
      const largeContent = new Array(51 * 1024 * 1024).fill('a').join(''); // 51MB
      const file = new File([largeContent], 'large.glb', { type: 'model/gltf-binary' });
      const error = validateGLBFile(file);
      
      expect(error).toBeInstanceOf(SimulationError);
      expect(error?.type).toBe(ErrorType.GLB_TOO_LARGE);
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(512)).toBe('512 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });
});