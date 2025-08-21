import * as THREE from 'three';
import {
  extractVerticesFromGLB,
  calculateGLBDimensions,
  simplifyVertices,
  validateCollisionShape,
  createCollisionShapeFromGLB,
  testCollisionCompatibility
} from '../glbPhysics';

// Mock Three.js objects for testing
const createMockScene = (vertices: number[]): THREE.Object3D => {
  const scene = new THREE.Object3D();
  const geometry = new THREE.BufferGeometry();
  
  // Create position attribute from vertices
  const positionArray = new Float32Array(vertices);
  geometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
  
  const mesh = new THREE.Mesh(geometry);
  scene.add(mesh);
  
  return scene;
};

describe('GLB Physics Utilities', () => {
  describe('extractVerticesFromGLB', () => {
    it('should extract vertices from a simple mesh', () => {
      const vertices = [0, 0, 0, 1, 0, 0, 0, 1, 0];
      const scene = createMockScene(vertices);
      
      const extracted = extractVerticesFromGLB(scene);
      expect(extracted).toHaveLength(9);
      expect(extracted).toEqual(vertices);
    });

    it('should return empty array for scene without meshes', () => {
      const scene = new THREE.Object3D();
      const extracted = extractVerticesFromGLB(scene);
      expect(extracted).toHaveLength(0);
    });

    it('should handle multiple meshes in scene', () => {
      const scene = new THREE.Object3D();
      
      // Add first mesh
      const geometry1 = new THREE.BufferGeometry();
      geometry1.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), 3));
      const mesh1 = new THREE.Mesh(geometry1);
      scene.add(mesh1);
      
      // Add second mesh
      const geometry2 = new THREE.BufferGeometry();
      geometry2.setAttribute('position', new THREE.BufferAttribute(new Float32Array([2, 0, 0, 3, 0, 0, 2, 1, 0]), 3));
      const mesh2 = new THREE.Mesh(geometry2);
      scene.add(mesh2);
      
      const extracted = extractVerticesFromGLB(scene);
      expect(extracted).toHaveLength(18); // 6 vertices total
    });
  });

  describe('calculateGLBDimensions', () => {
    it('should calculate correct dimensions for a simple box', () => {
      // Create a 2x2x2 box centered at origin
      const vertices = [
        -1, -1, -1,  1, -1, -1,  1,  1, -1, -1,  1, -1, // bottom face
        -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,  1  // top face
      ];
      const scene = createMockScene(vertices);
      
      const dimensions = calculateGLBDimensions(scene);
      expect(dimensions[0]).toBeCloseTo(2, 1);
      expect(dimensions[1]).toBeCloseTo(2, 1);
      expect(dimensions[2]).toBeCloseTo(2, 1);
    });

    it('should apply scale correctly', () => {
      const vertices = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];
      const scene = createMockScene(vertices);
      
      const dimensions = calculateGLBDimensions(scene, [2, 3, 4]);
      expect(dimensions[0]).toBeCloseTo(2, 1);
      expect(dimensions[1]).toBeCloseTo(3, 1);
      expect(dimensions[2]).toBeCloseTo(4, 1);
    });

    it('should enforce minimum dimensions', () => {
      // Very small object
      const vertices = [0, 0, 0, 0.01, 0, 0, 0, 0.01, 0];
      const scene = createMockScene(vertices);
      
      const dimensions = calculateGLBDimensions(scene);
      expect(dimensions[0]).toBeGreaterThanOrEqual(0.1);
      expect(dimensions[1]).toBeGreaterThanOrEqual(0.1);
      expect(dimensions[2]).toBeGreaterThanOrEqual(0.1);
    });
  });

  describe('simplifyVertices', () => {
    it('should not modify vertices if count is below limit', () => {
      const vertices = [0, 0, 0, 1, 0, 0, 0, 1, 0];
      const simplified = simplifyVertices(vertices, 10);
      expect(simplified).toEqual(vertices);
    });

    it('should reduce vertex count when above limit', () => {
      // Create 100 vertices (300 numbers)
      const vertices = Array.from({ length: 300 }, (_, i) => i);
      const simplified = simplifyVertices(vertices, 10);
      
      expect(simplified.length).toBeLessThan(vertices.length);
      expect(simplified.length % 3).toBe(0); // Should be divisible by 3
    });

    it('should maintain vertex format (groups of 3)', () => {
      const vertices = Array.from({ length: 150 }, (_, i) => i); // 50 vertices
      const simplified = simplifyVertices(vertices, 10);
      
      expect(simplified.length % 3).toBe(0);
    });
  });

  describe('validateCollisionShape', () => {
    it('should validate box collision shape', () => {
      const validBox = {
        shapeType: 'box' as const,
        dimensions: [1, 2, 3] as [number, number, number]
      };
      expect(validateCollisionShape(validBox)).toBe(true);
    });

    it('should reject invalid box dimensions', () => {
      const invalidBox = {
        shapeType: 'box' as const,
        dimensions: [0, -1, 3] as [number, number, number]
      };
      expect(validateCollisionShape(invalidBox)).toBe(false);
    });

    it('should validate convex collision shape', () => {
      const validConvex = {
        shapeType: 'convex' as const,
        vertices: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1])
      };
      expect(validateCollisionShape(validConvex)).toBe(true);
    });

    it('should reject convex shape with too few vertices', () => {
      const invalidConvex = {
        shapeType: 'convex' as const,
        vertices: new Float32Array([0, 0, 0, 1, 0, 0]) // Only 2 vertices
      };
      expect(validateCollisionShape(invalidConvex)).toBe(false);
    });
  });

  describe('createCollisionShapeFromGLB', () => {
    it('should create box collision shape', () => {
      const vertices = [-1, -1, -1, 1, 1, 1];
      const scene = createMockScene(vertices);
      
      const shape = createCollisionShapeFromGLB(scene, 'box');
      expect(shape).not.toBeNull();
      expect(shape?.shapeType).toBe('box');
      expect(shape?.dimensions).toBeDefined();
    });

    it('should create convex collision shape', () => {
      const vertices = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];
      const scene = createMockScene(vertices);
      
      const shape = createCollisionShapeFromGLB(scene, 'convex');
      expect(shape).not.toBeNull();
      expect(shape?.shapeType).toBe('convex');
      expect(shape?.vertices).toBeDefined();
    });

    it('should fallback to box for empty convex shape', () => {
      const scene = new THREE.Object3D(); // Empty scene
      
      const shape = createCollisionShapeFromGLB(scene, 'convex');
      expect(shape?.shapeType).toBe('box');
    });

    it('should handle errors gracefully', () => {
      // Create a scene that will cause errors
      const scene = new THREE.Object3D();
      const mesh = new THREE.Mesh();
      // Don't add geometry to cause error
      scene.add(mesh);
      
      const shape = createCollisionShapeFromGLB(scene, 'convex');
      // Should either return null or fallback shape
      expect(shape).toBeDefined();
    });
  });

  describe('testCollisionCompatibility', () => {
    it('should return true for compatible object types', () => {
      const ball = { type: 'ball', shapeType: 'sphere' };
      const box = { type: 'box', shapeType: 'box' };
      const glb = { type: 'glb', shapeType: 'convex' };
      
      expect(testCollisionCompatibility(ball, box)).toBe(true);
      expect(testCollisionCompatibility(box, glb)).toBe(true);
      expect(testCollisionCompatibility(ball, glb)).toBe(true);
    });

    it('should return false for unsupported object types', () => {
      const unsupported = { type: 'unknown' };
      const ball = { type: 'ball' };
      
      expect(testCollisionCompatibility(unsupported, ball)).toBe(false);
    });

    it('should return false for unsupported shape types', () => {
      const invalidShape = { type: 'ball', shapeType: 'invalid' };
      const ball = { type: 'ball', shapeType: 'sphere' };
      
      expect(testCollisionCompatibility(invalidShape, ball)).toBe(false);
    });

    it('should handle objects without shapeType', () => {
      const objectA = { type: 'ball' };
      const objectB = { type: 'box' };
      
      expect(testCollisionCompatibility(objectA, objectB)).toBe(true);
    });
  });
});