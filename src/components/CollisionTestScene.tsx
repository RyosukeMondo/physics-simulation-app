import React, { useEffect, useState } from 'react';
import PhysicsBall from './PhysicsBall';
import PhysicsBox from './PhysicsBox';
import PhysicsGLB from './PhysicsGLB';

interface CollisionTestSceneProps {
  glbUrl?: string;
  onCollisionDetected?: (objectA: string, objectB: string) => void;
}

/**
 * Test scene component to verify collision interactions between different object types
 */
const CollisionTestScene: React.FC<CollisionTestSceneProps> = ({
  glbUrl,
  onCollisionDetected
}) => {
  const [collisions, setCollisions] = useState<Array<{ objectA: string; objectB: string; timestamp: number }>>([]);

  // Simulate collision detection (in a real implementation, this would come from the physics engine)
  const handleCollision = (objectA: string, objectB: string) => {
    const collision = { objectA, objectB, timestamp: Date.now() };
    setCollisions(prev => [...prev, collision]);
    onCollisionDetected?.(objectA, objectB);
  };

  // Test setup: Create objects positioned to collide
  return (
    <>
      {/* Test Ball - positioned to fall and collide */}
      <PhysicsBall
        position={[-2, 5, 0]}
        radius={0.5}
        mass={1}
        color="red"
      />

      {/* Test Box - positioned to fall and collide */}
      <PhysicsBox
        position={[0, 6, 0]}
        size={[1, 1, 1]}
        mass={1}
        color="blue"
      />

      {/* Test GLB with Box collision - positioned to fall */}
      {glbUrl && (
        <PhysicsGLB
          url={glbUrl}
          position={[2, 7, 0]}
          scale={[1, 1, 1]}
          mass={1}
          collisionType="box"
        />
      )}

      {/* Test GLB with Convex collision - positioned to fall */}
      {glbUrl && (
        <PhysicsGLB
          url={glbUrl}
          position={[-1, 8, 2]}
          scale={[0.8, 0.8, 0.8]}
          mass={1}
          collisionType="convex"
        />
      )}

      {/* Static GLB obstacle - positioned on ground */}
      {glbUrl && (
        <PhysicsGLB
          url={glbUrl}
          position={[0, 1, 0]}
          scale={[2, 0.5, 2]}
          mass={0} // Static
          collisionType="box"
        />
      )}

      {/* Additional test objects for complex interactions */}
      <PhysicsBall
        position={[3, 4, -1]}
        radius={0.3}
        mass={0.5}
        color="green"
      />

      <PhysicsBox
        position={[-3, 5, 1]}
        size={[0.8, 0.8, 0.8]}
        mass={0.8}
        color="yellow"
      />
    </>
  );
};

export default CollisionTestScene;