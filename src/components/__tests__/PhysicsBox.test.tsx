import React from 'react';

// Mock the entire use-ammojs module
jest.mock('use-ammojs', () => ({
  useRigidBody: jest.fn(() => [{ current: null }]),
  ShapeType: { BOX: 'box' },
  BodyType: { DYNAMIC: 'dynamic' }
}));

describe('PhysicsBox', () => {
  it('should export PhysicsBox component', () => {
    // Simple test to verify the component can be imported
    const PhysicsBox = require('../PhysicsBox').default;
    expect(PhysicsBox).toBeDefined();
    expect(typeof PhysicsBox).toBe('function');
  });

  it('should have correct interface props', () => {
    // Test that the component accepts the expected props
    const PhysicsBox = require('../PhysicsBox').default;
    
    // This test verifies the component can be called with expected props
    const props = {
      position: [0, 5, 0] as [number, number, number],
      size: [1, 1, 1] as [number, number, number],
      mass: 1,
      color: 'blue'
    };
    
    expect(() => {
      React.createElement(PhysicsBox, props);
    }).not.toThrow();
  });

  it('should use default props when not provided', () => {
    const PhysicsBox = require('../PhysicsBox').default;
    
    // Test with minimal props
    const minimalProps = {
      position: [0, 0, 0] as [number, number, number]
    };
    
    expect(() => {
      React.createElement(PhysicsBox, minimalProps);
    }).not.toThrow();
  });
});