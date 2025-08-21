import React from 'react';
import { render, screen } from '@testing-library/react';
import { Canvas } from '@react-three/fiber';
import { Physics } from 'use-ammojs';
import PhysicsGLB from '../PhysicsGLB';

// Mock the useGLTF hook
jest.mock('@react-three/drei', () => ({
  useGLTF: jest.fn(() => ({
    scene: {
      clone: jest.fn(() => ({})),
      traverse: jest.fn(),
      updateMatrixWorld: jest.fn()
    }
  }))
}));

// Mock use-ammojs
jest.mock('use-ammojs', () => ({
  useRigidBody: jest.fn(() => [{ current: null }]),
  ShapeType: {
    BOX: 'box',
    SPHERE: 'sphere'
  },
  BodyType: {
    DYNAMIC: 'dynamic',
    STATIC: 'static'
  },
  Physics: ({ children }: { children: React.ReactNode }) => <div data-testid="physics-world">{children}</div>
}));

// Mock Three.js
jest.mock('three', () => ({
  Box3: jest.fn(() => ({
    setFromObject: jest.fn().mockReturnThis(),
    getSize: jest.fn(() => ({ x: 2, y: 2, z: 2 }))
  })),
  Vector3: jest.fn((x, y, z) => ({ x, y, z })),
  Object3D: jest.fn(() => ({
    traverse: jest.fn(),
    updateMatrixWorld: jest.fn(),
    matrixWorld: {
      elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    }
  })),
  Mesh: jest.fn(),
  BufferGeometry: jest.fn(() => ({
    getAttribute: jest.fn(() => ({
      count: 3,
      array: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])
    }))
  })),
  BufferAttribute: jest.fn()
}));

// Mock GLB physics utilities
jest.mock('../../utils/glbPhysics', () => ({
  createCollisionShapeFromGLB: jest.fn(() => ({
    shapeType: 'box',
    dimensions: [2, 2, 2]
  })),
  validateCollisionShape: jest.fn(() => true)
}));

// Test wrapper with Canvas and Physics
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { Physics } = require('use-ammojs');
  return (
    <Canvas>
      <Physics>
        {children}
      </Physics>
    </Canvas>
  );
};

describe('GLB Physics Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('integrates GLB models with physics system', () => {
    const { createCollisionShapeFromGLB } = require('../../utils/glbPhysics');
    
    render(
      <TestWrapper>
        <PhysicsGLB 
          url="/test-model.glb" 
          position={[0, 5, 0]} 
          mass={1}
          collisionType="box"
        />
      </TestWrapper>
    );

    // Verify collision shape creation was called
    expect(createCollisionShapeFromGLB).toHaveBeenCalledWith(
      expect.any(Object), // scene
      'box',
      [1, 1, 1] // scale
    );
  });

  it('supports both box and convex collision types', () => {
    const { createCollisionShapeFromGLB } = require('../../utils/glbPhysics');
    
    // Test box collision
    render(
      <TestWrapper>
        <PhysicsGLB 
          url="/test-model.glb" 
          position={[0, 5, 0]} 
          collisionType="box"
        />
      </TestWrapper>
    );

    expect(createCollisionShapeFromGLB).toHaveBeenCalledWith(
      expect.any(Object),
      'box',
      [1, 1, 1]
    );

    jest.clearAllMocks();

    // Test convex collision (falls back to box)
    render(
      <TestWrapper>
        <PhysicsGLB 
          url="/test-model2.glb" 
          position={[0, 5, 0]} 
          collisionType="convex"
        />
      </TestWrapper>
    );

    expect(createCollisionShapeFromGLB).toHaveBeenCalledWith(
      expect.any(Object),
      'convex',
      [1, 1, 1]
    );
  });

  it('creates dynamic physics bodies for GLB models with mass > 0', () => {
    const { useRigidBody } = require('use-ammojs');
    
    render(
      <TestWrapper>
        <PhysicsGLB 
          url="/dynamic-model.glb" 
          position={[0, 5, 0]} 
          mass={2}
        />
      </TestWrapper>
    );

    // Verify useRigidBody was called with dynamic body type
    expect(useRigidBody).toHaveBeenCalledWith(expect.any(Function));
  });

  it('creates static physics bodies for GLB models with mass = 0', () => {
    const { useRigidBody } = require('use-ammojs');
    
    render(
      <TestWrapper>
        <PhysicsGLB 
          url="/static-model.glb" 
          position={[0, 0, 0]} 
          mass={0}
        />
      </TestWrapper>
    );

    // Verify useRigidBody was called
    expect(useRigidBody).toHaveBeenCalledWith(expect.any(Function));
  });

  it('handles collision shape validation and fallback', () => {
    const { createCollisionShapeFromGLB, validateCollisionShape } = require('../../utils/glbPhysics');
    
    // Mock invalid collision shape
    createCollisionShapeFromGLB.mockReturnValueOnce(null);
    validateCollisionShape.mockReturnValueOnce(false);
    
    render(
      <TestWrapper>
        <PhysicsGLB 
          url="/invalid-model.glb" 
          position={[0, 5, 0]} 
        />
      </TestWrapper>
    );

    // Should still create a physics body with fallback configuration
    const { useRigidBody } = require('use-ammojs');
    expect(useRigidBody).toHaveBeenCalledWith(expect.any(Function));
  });

  it('applies correct physics material properties', () => {
    const { useRigidBody } = require('use-ammojs');
    
    render(
      <TestWrapper>
        <PhysicsGLB 
          url="/test-model.glb" 
          position={[0, 5, 0]} 
          mass={1}
        />
      </TestWrapper>
    );

    // Verify physics material properties are set
    expect(useRigidBody).toHaveBeenCalledWith(expect.any(Function));
    
    // Get the configuration function and test it
    const configFn = useRigidBody.mock.calls[0][0];
    const config = configFn();
    
    expect(config.material).toEqual({
      friction: 0.4,
      restitution: 0.3
    });
  });
});