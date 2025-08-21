import React from 'react';
import { SpawnedObject, ObjectType } from '../types/simulation';
import PhysicsBall from './PhysicsBall';
import PhysicsBox from './PhysicsBox';
import PhysicsGLB from './PhysicsGLB';

interface ObjectSpawnerProps {
  objects: SpawnedObject[];
}

const ObjectSpawner: React.FC<ObjectSpawnerProps> = ({ objects }) => {
  return (
    <>
      {objects.map((obj) => {
        switch (obj.type) {
          case ObjectType.BALL:
            return (
              <PhysicsBall
                key={obj.id}
                position={obj.position}
                radius={obj.props?.radius}
                mass={obj.props?.mass}
                color={obj.props?.color}
              />
            );
          case ObjectType.BOX:
            return (
              <PhysicsBox
                key={obj.id}
                position={obj.position}
                size={obj.props?.size}
                mass={obj.props?.mass}
                color={obj.props?.color}
              />
            );
          case ObjectType.GLB_MODEL:
            return obj.props?.url ? (
              <PhysicsGLB
                key={obj.id}
                url={obj.props.url}
                position={obj.position}
                scale={obj.props?.scale}
                mass={obj.props?.mass}
                collisionType={obj.props?.collisionType}
              />
            ) : null;
          default:
            return null;
        }
      })}
    </>
  );
};

export default ObjectSpawner;