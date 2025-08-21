import { Material, BufferGeometry, Mesh } from 'three';
import { SpawnedObject } from '../types/simulation';

// Configuration for performance limits
export const PERFORMANCE_LIMITS = {
  MAX_OBJECTS: 50,
  MAX_BALLS: 25,
  MAX_BOXES: 25,
  MAX_GLB_MODELS: 10,
  CLEANUP_THRESHOLD: 45, // Start cleanup when approaching limit
  MEMORY_WARNING_THRESHOLD: 100, // MB
  FPS_WARNING_THRESHOLD: 30
} as const;

// Material cache for reusing materials across objects
class MaterialCache {
  private static instance: MaterialCache;
  private cache = new Map<string, Material>();

  static getInstance(): MaterialCache {
    if (!MaterialCache.instance) {
      MaterialCache.instance = new MaterialCache();
    }
    return MaterialCache.instance;
  }

  getMaterial(key: string, factory: () => Material): Material {
    if (!this.cache.has(key)) {
      this.cache.set(key, factory());
    }
    return this.cache.get(key)!;
  }

  disposeMaterial(key: string): void {
    const material = this.cache.get(key);
    if (material) {
      material.dispose();
      this.cache.delete(key);
    }
  }

  disposeAll(): void {
    this.cache.forEach(material => material.dispose());
    this.cache.clear();
  }

  getSize(): number {
    return this.cache.size;
  }
}

// Geometry cache for reusing geometries
class GeometryCache {
  private static instance: GeometryCache;
  private cache = new Map<string, BufferGeometry>();

  static getInstance(): GeometryCache {
    if (!GeometryCache.instance) {
      GeometryCache.instance = new GeometryCache();
    }
    return GeometryCache.instance;
  }

  getGeometry(key: string, factory: () => BufferGeometry): BufferGeometry {
    if (!this.cache.has(key)) {
      this.cache.set(key, factory());
    }
    return this.cache.get(key)!;
  }

  disposeGeometry(key: string): void {
    const geometry = this.cache.get(key);
    if (geometry) {
      geometry.dispose();
      this.cache.delete(key);
    }
  }

  disposeAll(): void {
    this.cache.forEach(geometry => geometry.dispose());
    this.cache.clear();
  }

  getSize(): number {
    return this.cache.size;
  }
}

// Performance monitoring and optimization utilities
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private materialCache = MaterialCache.getInstance();
  private geometryCache = GeometryCache.getInstance();
  private cleanupCallbacks = new Set<() => void>();

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Check if we can add more objects based on limits
  canAddObject(objects: SpawnedObject[], type: string): boolean {
    const totalCount = objects.length;
    if (totalCount >= PERFORMANCE_LIMITS.MAX_OBJECTS) {
      return false;
    }

    // Normalize type to handle both enum values and string values
    const normalizedType = type.toLowerCase();
    const typeCount = objects.filter(obj => obj.type.toLowerCase() === normalizedType).length;
    
    switch (normalizedType) {
      case 'ball':
        return typeCount < PERFORMANCE_LIMITS.MAX_BALLS;
      case 'box':
        return typeCount < PERFORMANCE_LIMITS.MAX_BOXES;
      case 'glb':
      case 'glb_model':
        return typeCount < PERFORMANCE_LIMITS.MAX_GLB_MODELS;
      default:
        return false;
    }
  }

  // Get performance status and warnings
  getPerformanceStatus(objects: SpawnedObject[], fps: number, memoryUsage?: number) {
    const warnings: string[] = [];
    const totalObjects = objects.length;

    // Object count warnings
    if (totalObjects >= PERFORMANCE_LIMITS.CLEANUP_THRESHOLD) {
      warnings.push(`High object count (${totalObjects}/${PERFORMANCE_LIMITS.MAX_OBJECTS})`);
    }

    // FPS warnings
    if (fps > 0 && fps < PERFORMANCE_LIMITS.FPS_WARNING_THRESHOLD) {
      warnings.push(`Low FPS detected (${fps})`);
    }

    // Memory warnings
    if (memoryUsage && memoryUsage > PERFORMANCE_LIMITS.MEMORY_WARNING_THRESHOLD) {
      warnings.push(`High memory usage (${memoryUsage}MB)`);
    }

    return {
      isOptimal: warnings.length === 0,
      warnings,
      objectCount: totalObjects,
      maxObjects: PERFORMANCE_LIMITS.MAX_OBJECTS,
      utilizationPercentage: Math.round((totalObjects / PERFORMANCE_LIMITS.MAX_OBJECTS) * 100)
    };
  }

  // Get cached or create new material
  getCachedMaterial(key: string, factory: () => Material): Material {
    return this.materialCache.getMaterial(key, factory);
  }

  // Get cached or create new geometry
  getCachedGeometry(key: string, factory: () => BufferGeometry): BufferGeometry {
    return this.geometryCache.getGeometry(key, factory);
  }

  // Register cleanup callback for when objects are removed
  registerCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.add(callback);
  }

  // Unregister cleanup callback
  unregisterCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.delete(callback);
  }

  // Perform cleanup operations
  performCleanup(): void {
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('Cleanup callback failed:', error);
      }
    });
  }

  // Clean up oldest objects when approaching limits
  suggestObjectsForRemoval(objects: SpawnedObject[], count: number = 5): string[] {
    return objects
      .sort((a, b) => a.timestamp - b.timestamp) // Oldest first
      .slice(0, count)
      .map(obj => obj.id);
  }

  // Dispose all cached resources
  disposeAll(): void {
    this.materialCache.disposeAll();
    this.geometryCache.disposeAll();
    this.cleanupCallbacks.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      materials: this.materialCache.getSize(),
      geometries: this.geometryCache.getSize(),
      cleanupCallbacks: this.cleanupCallbacks.size
    };
  }
}

// Utility function to create material keys for caching
export const createMaterialKey = (type: string, color: string, properties?: Record<string, any>): string => {
  const props = properties ? JSON.stringify(properties) : '';
  return `${type}-${color}-${props}`;
};

// Utility function to create geometry keys for caching
export const createGeometryKey = (type: string, args: any[]): string => {
  return `${type}-${JSON.stringify(args)}`;
};

// Memory cleanup utility for Three.js objects
export const cleanupThreeJSObject = (object: Mesh): void => {
  if (object.geometry) {
    object.geometry.dispose();
  }
  
  if (object.material) {
    if (Array.isArray(object.material)) {
      object.material.forEach(material => material.dispose());
    } else {
      object.material.dispose();
    }
  }
  
  // Remove from parent if it has one
  if (object.parent) {
    object.parent.remove(object);
  }
};