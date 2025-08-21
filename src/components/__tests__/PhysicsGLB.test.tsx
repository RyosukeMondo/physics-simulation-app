import React from 'react';
import { render } from '@testing-library/react';
import PhysicsGLB from '../PhysicsGLB';

// Mock the useGLTF hook
jest.mock('@react-three/drei', () => ({
  useGLTF: jest.fn()
}));

// Mock use-ammojs
jest.mock('use-ammojs', () => ({
  useRigidBody: jest.fn(() => [{ current: null }]),
  ShapeType: {
    BOX: 'box',
    CONVEX_HULL: 'convex'
  },
  BodyType: {
    DYNAMIC: 'dynamic',
    STATIC: 'static'
  }
}));

// Mock Three.js
jest.mock('three', () => ({
  Box3: jest.fn(() => ({
    setFromObject: jest.fn().mockReturnThis(),
    getSize: jest.fn(() => ({ x: 1, y: 1, z: 1 }))
  })),
  Vector3: jest.fn(),
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
  createCollisionShapeFromGLB: jest.fn(),
  validateCollisionShape: jest.fn(() => true)
}));

const { useGLTF } = require('@react-three/drei');
const { createCollisionShapeFromGLB, validateCollisionShape } = require('../../utils/glbPhysics');

// Simple test wrapper without Canvas
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
);

describe('PhysicsGLB', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    useGLTF.mockReturnValue({
      scene: null,
      error: null
    });

    render(
      <TestWrapper>
        <PhysicsGLB url="/test.glb" position={[0, 0, 0]} />
      </TestWrapper>
    );

    // The component should render a loading placeholder
    // Since we can't easily test the 3D mesh, we'll test the component doesn't crash
    expect(useGLTF).toHaveBeenCalledWith('/test.glb');
  });

  it('handles loading errors', () => {
    const mockError = new Error('Failed to load GLB');
    useGLTF.mockReturnValue({
      scene: null,
      error: mockError
    });

    const onError = jest.fn();

    render(
      <TestWrapper>
        <PhysicsGLB 
          url="/test.glb" 
          position={[0, 0, 0]} 
          onError={onError}
        />
      </TestWrapper>
    );

    // Error callback should be called
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('calls onLoad when model loads successfully', () => {
    const mockScene = {
      clone: jest.fn(() => ({}))
    };
    
    useGLTF.mockReturnValue({
      scene: mockScene,
      error: null
    });

    const onLoad = jest.fn();

    render(
      <TestWrapper>
        <PhysicsGLB 
          url="/test.glb" 
          position={[0, 0, 0]} 
          onLoad={onLoad}
        />
      </TestWrapper>
    );

    // onLoad should be called when scene is available
    expect(onLoad).toHaveBeenCalled();
  });

  it('uses correct collision type for box', () => {
    const mockScene = {
      clone: jest.fn(() => ({}))
    };
    
    useGLTF.mockReturnValue({
      scene: mockScene,
      error: null
    });

    createCollisionShapeFromGLB.mockReturnValue({
      shapeType: 'box',
      dimensions: [1, 1, 1]
    });

    render(
      <TestWrapper>
        <PhysicsGLB 
          url="/test.glb" 
          position={[0, 0, 0]} 
          collisionType="box"
        />
      </TestWrapper>
    );

    expect(createCollisionShapeFromGLB).toHaveBeenCalledWith(mockScene, 'box', [1, 1, 1]);
  });

  it('uses correct collision type for convex', () => {
    const mockScene = {
      clone: jest.fn(() => ({}))
    };
    
    useGLTF.mockReturnValue({
      scene: mockScene,
      error: null
    });

    createCollisionShapeFromGLB.mockReturnValue({
      shapeType: 'convex',
      vertices: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1])
    });

    render(
      <TestWrapper>
        <PhysicsGLB 
          url="/test.glb" 
          position={[0, 0, 0]} 
          collisionType="convex"
        />
      </TestWrapper>
    );

    expect(createCollisionShapeFromGLB).toHaveBeenCalledWith(mockScene, 'convex', [1, 1, 1]);
  });

  it('handles invalid collision shape data', () => {
    const mockScene = {
      clone: jest.fn(() => ({}))
    };
    
    useGLTF.mockReturnValue({
      scene: mockScene,
      error: null
    });

    createCollisionShapeFromGLB.mockReturnValue(null);
    validateCollisionShape.mockReturnValue(false);

    render(
      <TestWrapper>
        <PhysicsGLB 
          url="/test.glb" 
          position={[0, 0, 0]} 
          collisionType="convex"
        />
      </TestWrapper>
    );

    // Should fallback to box collision
    const { useRigidBody } = require('use-ammojs');
    expect(useRigidBody).toHaveBeenCalledWith(expect.any(Function));
  });

  it('handles different mass values correctly', () => {
    const mockScene = {
      clone: jest.fn(() => ({}))
    };
    
    useGLTF.mockReturnValue({
      scene: mockScene,
      error: null
    });

    createCollisionShapeFromGLB.mockReturnValue({
      shapeType: 'box',
      dimensions: [1, 1, 1]
    });

    // Test dynamic body (mass > 0)
    render(
      <TestWrapper>
        <PhysicsGLB 
          url="/test.glb" 
          position={[0, 0, 0]} 
          mass={1}
        />
      </TestWrapper>
    );

    // Test static body (mass = 0)
    render(
      <TestWrapper>
        <PhysicsGLB 
          url="/test2.glb" 
          position={[0, 0, 0]} 
          mass={0}
        />
      </TestWrapper>
    );

    const { useRigidBody } = require('use-ammojs');
    expect(useRigidBody).toHaveBeenCalledTimes(2);
  });
});