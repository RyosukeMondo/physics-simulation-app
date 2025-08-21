import React from 'react';
import { SpawnedObject, ObjectType } from '../types/simulation';
import { SimulationError } from '../utils/errorHandling';
import PhysicsBall from './PhysicsBall';
import PhysicsBox from './PhysicsBox';
import PhysicsGLB from './PhysicsGLB';
import SafePhysicsWrapper from './SafePhysicsWrapper';

interface ObjectSpawnerProps {
  objects: SpawnedObject[];
  onError?: (error: SimulationError) => void;
}

const ObjectSpawner: React.FC<ObjectSpawnerProps> = ({ objects, onError }) => {
  return (
    <>
      {objects.filter(obj => obj && obj.position).map((obj) => {
        switch (obj.type) {
          case ObjectType.BALL:
            return (
              <SafePhysicsWrapper key={obj.id} position={obj.position}>
                <PhysicsBall
                  position={obj.position}
                  radius={obj.props?.radius}
                  mass={obj.props?.mass}
                  color={obj.props?.color}
                />
              </SafePhysicsWrapper>
            );
          case ObjectType.BOX:
            return (
              <SafePhysicsWrapper key={obj.id} position={obj.position}>
                <PhysicsBox
                  position={obj.position}
                  size={obj.props?.size}
                  mass={obj.props?.mass}
                  color={obj.props?.color}
                />
              </SafePhysicsWrapper>
            );
          case ObjectType.GLB_MODEL:
            return obj.props?.url ? (
              <SafePhysicsWrapper key={obj.id} position={obj.position}>
                <PhysicsGLB
                  url={obj.props.url}
                  position={obj.position}
                  scale={obj.props?.scale}
                  mass={obj.props?.mass}
                  collisionType={obj.props?.collisionType}
                  onError={onError}
                />
              </SafePhysicsWrapper>
            ) : null;
          default:
            return null;
        }
      })}
    </>
  );
};

export default ObjectSpawner;