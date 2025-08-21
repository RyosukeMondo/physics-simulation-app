import React from 'react';
import { render } from '@testing-library/react';
import ObjectSpawner from '../ObjectSpawner';
import { SpawnedObject, ObjectType } from '../../types/simulation';

// Mock the physics components
jest.mock('../PhysicsBall', () => {
  return function MockPhysicsBall({ position, radius, mass, color }: any) {
    return (
      <div 
        data-testid="physics-ball"
        data-position={JSON.stringify(position)}
        data-radius={radius}
        data-mass={mass}
        data-color={color}
      />
    );
  };
});

jest.mock('../PhysicsBox', () => {
  return function MockPhysicsBox({ position, size, mass, color }: any) {
    return (
      <div 
        data-testid="physics-box"
        data-position={JSON.stringify(position)}
        data-size={JSON.stringify(size)}
        data-mass={mass}
        data-color={color}
      />
    );
  };
});

describe('ObjectSpawner', () => {
  it('renders without crashing with empty objects array', () => {
    render(<ObjectSpawner objects={[]} />);
  });

  it('renders PhysicsBall components for ball objects', () => {
    const ballObjects: SpawnedObject[] = [
      {
        id: 'ball-1',
        type: ObjectType.BALL,
        position: [1, 2, 3],
        timestamp: Date.now(),
        props: {
          radius: 0.5,
          mass: 1,
          color: 'red'
        }
      },
      {
        id: 'ball-2',
        type: ObjectType.BALL,
        position: [4, 5, 6],
        timestamp: Date.now(),
        props: {
          radius: 0.8,
          mass: 2,
          color: 'blue'
        }
      }
    ];

    const { getAllByTestId } = render(<ObjectSpawner objects={ballObjects} />);
    
    const ballElements = getAllByTestId('physics-ball');
    expect(ballElements).toHaveLength(2);
    
    // Check first ball properties
    expect(ballElements[0]).toHaveAttribute('data-position', '[1,2,3]');
    expect(ballElements[0]).toHaveAttribute('data-radius', '0.5');
    expect(ballElements[0]).toHaveAttribute('data-mass', '1');
    expect(ballElements[0]).toHaveAttribute('data-color', 'red');
    
    // Check second ball properties
    expect(ballElements[1]).toHaveAttribute('data-position', '[4,5,6]');
    expect(ballElements[1]).toHaveAttribute('data-radius', '0.8');
    expect(ballElements[1]).toHaveAttribute('data-mass', '2');
    expect(ballElements[1]).toHaveAttribute('data-color', 'blue');
  });

  it('renders PhysicsBox components for box objects', () => {
    const boxObjects: SpawnedObject[] = [
      {
        id: 'box-1',
        type: ObjectType.BOX,
        position: [1, 2, 3],
        timestamp: Date.now(),
        props: {
          size: [1, 1, 1],
          mass: 1,
          color: 'green'
        }
      },
      {
        id: 'box-2',
        type: ObjectType.BOX,
        position: [7, 8, 9],
        timestamp: Date.now(),
        props: {
          size: [2, 2, 2],
          mass: 3,
          color: 'yellow'
        }
      }
    ];

    const { getAllByTestId } = render(<ObjectSpawner objects={boxObjects} />);
    
    const boxElements = getAllByTestId('physics-box');
    expect(boxElements).toHaveLength(2);
    
    // Check first box properties
    expect(boxElements[0]).toHaveAttribute('data-position', '[1,2,3]');
    expect(boxElements[0]).toHaveAttribute('data-size', '[1,1,1]');
    expect(boxElements[0]).toHaveAttribute('data-mass', '1');
    expect(boxElements[0]).toHaveAttribute('data-color', 'green');
    
    // Check second box properties
    expect(boxElements[1]).toHaveAttribute('data-position', '[7,8,9]');
    expect(boxElements[1]).toHaveAttribute('data-size', '[2,2,2]');
    expect(boxElements[1]).toHaveAttribute('data-mass', '3');
    expect(boxElements[1]).toHaveAttribute('data-color', 'yellow');
  });

  it('renders mixed object types correctly', () => {
    const mixedObjects: SpawnedObject[] = [
      {
        id: 'ball-1',
        type: ObjectType.BALL,
        position: [1, 2, 3],
        timestamp: Date.now(),
        props: {
          radius: 0.5,
          mass: 1,
          color: 'orange'
        }
      },
      {
        id: 'box-1',
        type: ObjectType.BOX,
        position: [4, 5, 6],
        timestamp: Date.now(),
        props: {
          size: [1, 1, 1],
          mass: 1,
          color: 'blue'
        }
      }
    ];

    const { getByTestId } = render(<ObjectSpawner objects={mixedObjects} />);
    
    expect(getByTestId('physics-ball')).toBeInTheDocument();
    expect(getByTestId('physics-box')).toBeInTheDocument();
  });

  it('uses unique keys for each object', () => {
    const objects: SpawnedObject[] = [
      {
        id: 'unique-ball-1',
        type: ObjectType.BALL,
        position: [1, 2, 3],
        timestamp: Date.now(),
        props: { radius: 0.5, mass: 1, color: 'red' }
      },
      {
        id: 'unique-box-1',
        type: ObjectType.BOX,
        position: [4, 5, 6],
        timestamp: Date.now(),
        props: { size: [1, 1, 1], mass: 1, color: 'blue' }
      }
    ];

    // This test ensures no React key warnings are thrown
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<ObjectSpawner objects={objects} />);
    
    // Check that no React key warnings were logged
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Warning: Each child in a list should have a unique "key" prop')
    );
    
    consoleSpy.mockRestore();
  });

  it('handles objects with missing props gracefully', () => {
    const objectsWithMissingProps: SpawnedObject[] = [
      {
        id: 'ball-no-props',
        type: ObjectType.BALL,
        position: [1, 2, 3],
        timestamp: Date.now()
        // No props object
      },
      {
        id: 'box-partial-props',
        type: ObjectType.BOX,
        position: [4, 5, 6],
        timestamp: Date.now(),
        props: {
          mass: 2
          // Missing size and color
        }
      }
    ];

    const { getByTestId } = render(<ObjectSpawner objects={objectsWithMissingProps} />);
    
    // Should still render the components
    expect(getByTestId('physics-ball')).toBeInTheDocument();
    expect(getByTestId('physics-box')).toBeInTheDocument();
  });

  it('ignores unknown object types', () => {
    const objectsWithUnknownType: SpawnedObject[] = [
      {
        id: 'ball-1',
        type: ObjectType.BALL,
        position: [1, 2, 3],
        timestamp: Date.now(),
        props: { radius: 0.5, mass: 1, color: 'red' }
      },
      {
        id: 'unknown-1',
        type: 'unknown' as ObjectType,
        position: [4, 5, 6],
        timestamp: Date.now(),
        props: {}
      }
    ];

    const { queryByTestId, getByTestId } = render(<ObjectSpawner objects={objectsWithUnknownType} />);
    
    // Should render the ball but ignore the unknown type
    expect(getByTestId('physics-ball')).toBeInTheDocument();
    expect(queryByTestId('unknown-object')).not.toBeInTheDocument();
  });
});