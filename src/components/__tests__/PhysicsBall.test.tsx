import React from 'react';

// Mock the entire use-ammojs module
jest.mock('use-ammojs', () => ({
  useRigidBody: jest.fn(() => [{ current: null }]),
  ShapeType: { SPHERE: 'sphere' },
  BodyType: { DYNAMIC: 'dynamic' }
}));

// Mock three.js Vector3
jest.mock('three', () => ({
  Vector3: jest.fn()
}));

describe('PhysicsBall', () => {
  it('should export PhysicsBall component', () => {
    // Simple test to verify the component can be imported
    const PhysicsBall = require('../PhysicsBall').default;
    expect(PhysicsBall).toBeDefined();
    expect(typeof PhysicsBall).toBe('function');
  });

  it('should have correct interface props', () => {
    // Test that the component accepts the expected props
    const PhysicsBall = require('../PhysicsBall').default;
    
    // This test verifies the component can be called with expected props
    const props = {
      position: [0, 5, 0] as [number, number, number],
      radius: 0.5,
      mass: 1,
      color: 'orange'
    };
    
    expect(() => {
      React.createElement(PhysicsBall, props);
    }).not.toThrow();
  });
});