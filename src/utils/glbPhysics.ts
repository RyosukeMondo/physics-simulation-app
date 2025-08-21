import * as THREE from 'three';

/**
 * Utility functions for GLB physics integration
 */

export interface CollisionShapeData {
  shapeType: 'box' | 'convex';
  vertices?: Float32Array;
  dimensions?: [number, number, number];
}

/**
 * Extract vertices from a GLB scene for convex hull collision detection
 */
export const extractVerticesFromGLB = (scene: THREE.Object3D): number[] => {
  const vertices: number[] = [];
  const processedGeometries = new Set<THREE.BufferGeometry>();
  
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const geometry = child.geometry;
      
      // Avoid processing the same geometry multiple times
      if (processedGeometries.has(geometry)) {
        return;
      }
      processedGeometries.add(geometry);
      
      // Get position attribute
      const positionAttribute = geometry.getAttribute('position');
      if (positionAttribute) {
        // Apply world matrix to get world coordinates
        child.updateMatrixWorld(true);
        const worldMatrix = child.matrixWorld;
        
        for (let i = 0; i < positionAttribute.count; i++) {
          const vertex = new THREE.Vector3();
          vertex.fromBufferAttribute(positionAttribute, i);
          vertex.applyMatrix4(worldMatrix);
          
          vertices.push(vertex.x, vertex.y, vertex.z);
        }
      }
    }
  });
  
  return vertices;
};

/**
 * Calculate accurate bounding box dimensions from GLB scene
 */
export const calculateGLBDimensions = (
  scene: THREE.Object3D, 
  scale: [number, number, number] = [1, 1, 1]
): [number, number, number] => {
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  
  // Apply scale to dimensions and ensure minimum size
  return [
    Math.max(size.x * scale[0], 0.1),
    Math.max(size.y * scale[1], 0.1), 
    Math.max(size.z * scale[2], 0.1)
  ];
};

/**
 * Simplify vertices for better convex hull performance
 * Reduces vertex count while maintaining shape approximation
 */
export const simplifyVertices = (vertices: number[], maxVertices: number = 100): number[] => {
  if (vertices.length / 3 <= maxVertices) {
    return vertices;
  }
  
  // Simple decimation - take every nth vertex
  const step = Math.ceil((vertices.length / 3) / maxVertices);
  const simplified: number[] = [];
  
  for (let i = 0; i < vertices.length; i += step * 3) {
    if (i + 2 < vertices.length) {
      simplified.push(vertices[i], vertices[i + 1], vertices[i + 2]);
    }
  }
  
  return simplified;
};

/**
 * Validate collision shape data for physics engine compatibility
 */
export const validateCollisionShape = (shapeData: CollisionShapeData): boolean => {
  if (shapeData.shapeType === 'box') {
    return shapeData.dimensions !== undefined && 
           shapeData.dimensions.every(d => d > 0 && isFinite(d));
  }
  
  if (shapeData.shapeType === 'convex') {
    return shapeData.vertices !== undefined && 
           shapeData.vertices.length >= 12 && // At least 4 vertices (tetrahedron)
           shapeData.vertices.length % 3 === 0; // Must be divisible by 3 (x,y,z)
  }
  
  return false;
};

/**
 * Create collision shape data from GLB scene
 */
export const createCollisionShapeFromGLB = (
  scene: THREE.Object3D,
  collisionType: 'box' | 'convex',
  scale: [number, number, number] = [1, 1, 1]
): CollisionShapeData | null => {
  try {
    if (collisionType === 'box') {
      const dimensions = calculateGLBDimensions(scene, scale);
      return {
        shapeType: 'box',
        dimensions
      };
    }
    
    if (collisionType === 'convex') {
      const vertices = extractVerticesFromGLB(scene);
      if (vertices.length === 0) {
        console.warn('No vertices found for convex hull, falling back to box');
        return createCollisionShapeFromGLB(scene, 'box', scale);
      }
      
      // Simplify vertices for performance
      const simplifiedVertices = simplifyVertices(vertices, 50);
      
      return {
        shapeType: 'convex',
        vertices: new Float32Array(simplifiedVertices)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error creating collision shape from GLB:', error);
    return null;
  }
};

/**
 * Test collision compatibility between different object types
 */
export const testCollisionCompatibility = (
  objectA: { type: string; shapeType?: string },
  objectB: { type: string; shapeType?: string }
): boolean => {
  // All combinations should work with proper physics engine
  const supportedTypes = ['ball', 'box', 'glb'];
  const supportedShapes = ['sphere', 'box', 'convex'];
  
  const typeAValid = supportedTypes.includes(objectA.type);
  const typeBValid = supportedTypes.includes(objectB.type);
  
  const shapeAValid = !objectA.shapeType || supportedShapes.includes(objectA.shapeType);
  const shapeBValid = !objectB.shapeType || supportedShapes.includes(objectB.shapeType);
  
  return typeAValid && typeBValid && shapeAValid && shapeBValid;
};