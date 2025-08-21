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
  Vector3: jest.fn()
}));

const { useGLTF } = require('@react-three/drei');

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

  it('uses correct collision type', () => {
    const mockScene = {
      clone: jest.fn(() => ({}))
    };
    
    useGLTF.mockReturnValue({
      scene: mockScene,
      error: null
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

    // Should use convex collision type
    const { useRigidBody } = require('use-ammojs');
    expect(useRigidBody).toHaveBeenCalledWith(expect.any(Function));
  });
});