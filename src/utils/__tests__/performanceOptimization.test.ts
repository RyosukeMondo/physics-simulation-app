import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  PerformanceOptimizer, 
  PERFORMANCE_LIMITS,
  createMaterialKey,
  createGeometryKey,
  cleanupThreeJSObject
} from '../performanceOptimization';
import { SpawnedObject, ObjectType } from '../../types/simulation';
import { Mesh, BoxGeometry, MeshStandardMaterial } from 'three';

describe('PerformanceOptimizer', () => {
  let optimizer: PerformanceOptimizer;
  let mockObjects: SpawnedObject[];

  beforeEach(() => {
    optimizer = PerformanceOptimizer.getInstance();
    mockObjects = [
      {
        id: 'ball-1',
        type: ObjectType.BALL,
        position: [0, 0, 0],
        timestamp: Date.now() - 1000,
        props: { radius: 0.5, mass: 1, color: 'red' }
      },
      {
        id: 'box-1',
        type: ObjectType.BOX,
        position: [1, 0, 0],
        timestamp: Date.now() - 500,
        props: { size: [1, 1, 1], mass: 1, color: 'blue' }
      }
    ];
  });

  afterEach(() => {
    optimizer.disposeAll();
  });

  describe('canAddObject', () => {
    it('should allow adding objects when under limits', () => {
      expect(optimizer.canAddObject([], ObjectType.BALL)).toBe(true);
      expect(optimizer.canAddObject(mockObjects, ObjectType.BALL)).toBe(true);
    });

    it('should prevent adding objects when at total limit', () => {
      const maxObjects = Array.from({ length: PERFORMANCE_LIMITS.MAX_OBJECTS }, (_, i) => ({
        id: `obj-${i}`,
        type: ObjectType.BALL,
        position: [0, 0, 0] as [number, number, number],
        timestamp: Date.now()
      }));

      expect(optimizer.canAddObject(maxObjects, ObjectType.BALL)).toBe(false);
    });

    it('should prevent adding specific type when at type limit', () => {
      const maxBalls = Array.from({ length: PERFORMANCE_LIMITS.MAX_BALLS }, (_, i) => ({
        id: `ball-${i}`,
        type: ObjectType.BALL,
        position: [0, 0, 0] as [number, number, number],
        timestamp: Date.now()
      }));

      expect(optimizer.canAddObject(maxBalls, ObjectType.BALL)).toBe(false);
      expect(optimizer.canAddObject(maxBalls, ObjectType.BOX)).toBe(true);
    });
  });

  describe('getPerformanceStatus', () => {
    it('should return optimal status for low object count and good FPS', () => {
      const status = optimizer.getPerformanceStatus(mockObjects, 60, 50);
      
      expect(status.isOptimal).toBe(true);
      expect(status.warnings).toHaveLength(0);
      expect(status.objectCount).toBe(2);
      expect(status.utilizationPercentage).toBe(4); // 2/50 * 100
    });

    it('should return warnings for high object count', () => {
      const manyObjects = Array.from({ length: PERFORMANCE_LIMITS.CLEANUP_THRESHOLD }, (_, i) => ({
        id: `obj-${i}`,
        type: ObjectType.BALL,
        position: [0, 0, 0] as [number, number, number],
        timestamp: Date.now()
      }));

      const status = optimizer.getPerformanceStatus(manyObjects, 60, 50);
      
      expect(status.isOptimal).toBe(false);
      expect(status.warnings.some(w => w.includes('High object count'))).toBe(true);
    });

    it('should return warnings for low FPS', () => {
      const status = optimizer.getPerformanceStatus(mockObjects, 25, 50);
      
      expect(status.isOptimal).toBe(false);
      expect(status.warnings.some(w => w.includes('Low FPS'))).toBe(true);
    });

    it('should return warnings for high memory usage', () => {
      const status = optimizer.getPerformanceStatus(mockObjects, 60, 150);
      
      expect(status.isOptimal).toBe(false);
      expect(status.warnings.some(w => w.includes('High memory usage'))).toBe(true);
    });
  });

  describe('material and geometry caching', () => {
    it('should cache and reuse materials', () => {
      const materialFactory = () => new MeshStandardMaterial({ color: 'red' });
      
      const material1 = optimizer.getCachedMaterial('test-material', materialFactory);
      const material2 = optimizer.getCachedMaterial('test-material', materialFactory);
      
      expect(material1).toBe(material2);
    });

    it('should cache and reuse geometries', () => {
      const geometryFactory = () => new BoxGeometry(1, 1, 1);
      
      const geometry1 = optimizer.getCachedGeometry('test-geometry', geometryFactory);
      const geometry2 = optimizer.getCachedGeometry('test-geometry', geometryFactory);
      
      expect(geometry1).toBe(geometry2);
    });

    it('should track cache statistics', () => {
      optimizer.getCachedMaterial('mat1', () => new MeshStandardMaterial());
      optimizer.getCachedMaterial('mat2', () => new MeshStandardMaterial());
      optimizer.getCachedGeometry('geo1', () => new BoxGeometry());
      
      const stats = optimizer.getCacheStats();
      expect(stats.materials).toBe(2);
      expect(stats.geometries).toBe(1);
    });
  });

  describe('cleanup functionality', () => {
    it('should register and execute cleanup callbacks', () => {
      let cleanupCalled = false;
      const cleanupCallback = () => { cleanupCalled = true; };
      
      optimizer.registerCleanupCallback(cleanupCallback);
      optimizer.performCleanup();
      
      expect(cleanupCalled).toBe(true);
    });

    it('should suggest oldest objects for removal', () => {
      const objectsToRemove = optimizer.suggestObjectsForRemoval(mockObjects, 1);
      
      expect(objectsToRemove).toHaveLength(1);
      expect(objectsToRemove[0]).toBe('ball-1'); // Oldest object
    });

    it('should dispose all cached resources', () => {
      optimizer.getCachedMaterial('test', () => new MeshStandardMaterial());
      optimizer.getCachedGeometry('test', () => new BoxGeometry());
      
      optimizer.disposeAll();
      
      const stats = optimizer.getCacheStats();
      expect(stats.materials).toBe(0);
      expect(stats.geometries).toBe(0);
    });
  });
});

describe('utility functions', () => {
  describe('createMaterialKey', () => {
    it('should create consistent keys for same parameters', () => {
      const key1 = createMaterialKey('standard', 'red', { metalness: 0.5 });
      const key2 = createMaterialKey('standard', 'red', { metalness: 0.5 });
      
      expect(key1).toBe(key2);
    });

    it('should create different keys for different parameters', () => {
      const key1 = createMaterialKey('standard', 'red');
      const key2 = createMaterialKey('standard', 'blue');
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('createGeometryKey', () => {
    it('should create consistent keys for same parameters', () => {
      const key1 = createGeometryKey('box', [1, 1, 1]);
      const key2 = createGeometryKey('box', [1, 1, 1]);
      
      expect(key1).toBe(key2);
    });

    it('should create different keys for different parameters', () => {
      const key1 = createGeometryKey('box', [1, 1, 1]);
      const key2 = createGeometryKey('sphere', [1]);
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('cleanupThreeJSObject', () => {
    it('should dispose geometry and material', () => {
      const geometry = new BoxGeometry();
      const material = new MeshStandardMaterial();
      const mesh = new Mesh(geometry, material);
      
      const geometryDisposeSpy = jest.spyOn(geometry, 'dispose');
      const materialDisposeSpy = jest.spyOn(material, 'dispose');
      
      cleanupThreeJSObject(mesh);
      
      expect(geometryDisposeSpy).toHaveBeenCalled();
      expect(materialDisposeSpy).toHaveBeenCalled();
    });
  });
});