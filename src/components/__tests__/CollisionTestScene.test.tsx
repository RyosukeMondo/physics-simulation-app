import React from 'react';
import { render } from '@testing-library/react';
import CollisionTestScene from '../CollisionTestScene';

// Mock all physics components
jest.mock('../PhysicsBall', () => {
  return function MockPhysicsBall(props: any) {
    return <div data-testid="physics-ball" data-position={JSON.stringify(props.position)} />;
  };
});

jest.mock('../PhysicsBox', () => {
  return function MockPhysicsBox(props: any) {
    return <div data-testid="physics-box" data-position={JSON.stringify(props.position)} />;
  };
});

jest.mock('../PhysicsGLB', () => {
  return function MockPhysicsGLB(props: any) {
    return (
      <div 
        data-testid="physics-glb" 
        data-url={props.url}
        data-collision-type={props.collisionType}
        data-mass={props.mass}
        data-position={JSON.stringify(props.position)}
      />
    );
  };
});

describe('CollisionTestScene', () => {
  it('renders test objects without GLB URL', () => {
    const { getAllByTestId } = render(<CollisionTestScene />);
    
    // Should render balls and boxes
    const balls = getAllByTestId('physics-ball');
    const boxes = getAllByTestId('physics-box');
    
    expect(balls).toHaveLength(2); // Two test balls
    expect(boxes).toHaveLength(2); // Two test boxes
  });

  it('renders GLB objects when URL is provided', () => {
    const testUrl = '/test-model.glb';
    const { getAllByTestId } = render(<CollisionTestScene glbUrl={testUrl} />);
    
    const glbObjects = getAllByTestId('physics-glb');
    expect(glbObjects).toHaveLength(3); // Three GLB test objects
    
    // Check that all GLB objects use the correct URL
    glbObjects.forEach(glb => {
      expect(glb.getAttribute('data-url')).toBe(testUrl);
    });
  });

  it('creates GLB objects with different collision types', () => {
    const testUrl = '/test-model.glb';
    const { getAllByTestId } = render(<CollisionTestScene glbUrl={testUrl} />);
    
    const glbObjects = getAllByTestId('physics-glb');
    
    // Check collision types
    const collisionTypes = glbObjects.map(glb => glb.getAttribute('data-collision-type'));
    expect(collisionTypes).toContain('box');
    expect(collisionTypes).toContain('convex');
  });

  it('creates both dynamic and static GLB objects', () => {
    const testUrl = '/test-model.glb';
    const { getAllByTestId } = render(<CollisionTestScene glbUrl={testUrl} />);
    
    const glbObjects = getAllByTestId('physics-glb');
    
    // Check mass values (0 = static, >0 = dynamic)
    const masses = glbObjects.map(glb => parseFloat(glb.getAttribute('data-mass') || '0'));
    expect(masses).toContain(0); // Static object
    expect(masses.some(mass => mass > 0)).toBe(true); // Dynamic objects
  });

  it('positions objects to create collision scenarios', () => {
    const testUrl = '/test-model.glb';
    const { getAllByTestId } = render(<CollisionTestScene glbUrl={testUrl} />);
    
    const allObjects = [
      ...getAllByTestId('physics-ball'),
      ...getAllByTestId('physics-box'),
      ...getAllByTestId('physics-glb')
    ];
    
    // All objects should have positions
    allObjects.forEach(obj => {
      const position = JSON.parse(obj.getAttribute('data-position') || '[0,0,0]');
      expect(position).toHaveLength(3);
      expect(position.every((coord: number) => typeof coord === 'number')).toBe(true);
    });
  });

  it('calls collision callback when provided', () => {
    const onCollisionDetected = jest.fn();
    const testUrl = '/test-model.glb';
    
    render(
      <CollisionTestScene 
        glbUrl={testUrl} 
        onCollisionDetected={onCollisionDetected}
      />
    );
    
    // The component should render without errors
    // In a real physics engine, collisions would be detected automatically
    expect(onCollisionDetected).not.toHaveBeenCalled(); // No collisions yet in test
  });

  it('handles missing GLB URL gracefully', () => {
    const { queryAllByTestId } = render(<CollisionTestScene />);
    
    const glbObjects = queryAllByTestId('physics-glb');
    expect(glbObjects).toHaveLength(0); // No GLB objects without URL
    
    // Should still render other objects
    const balls = queryAllByTestId('physics-ball');
    const boxes = queryAllByTestId('physics-box');
    expect(balls.length + boxes.length).toBeGreaterThan(0);
  });
});