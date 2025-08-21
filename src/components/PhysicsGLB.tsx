import React, { useEffect, Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useRigidBody, ShapeType, BodyType } from 'use-ammojs';
import * as THREE from 'three';
import { createCollisionShapeFromGLB, validateCollisionShape } from '../utils/glbPhysics';

interface PhysicsGLBProps {
  url: string;
  position: [number, number, number];
  scale?: [number, number, number];
  mass?: number;
  collisionType?: 'box' | 'convex';
  onLoad?: () => void;
  onError?: (error: Error) => void;
}



// Internal component that uses useGLTF
const GLBModel: React.FC<PhysicsGLBProps> = ({
  url,
  position,
  scale = [1, 1, 1],
  mass = 1,
  collisionType = 'box',
  onLoad,
  onError
}) => {

  // Load GLB model using useGLTF hook
  const { scene } = useGLTF(url);

  // Calculate collision shape data based on collision type
  const collisionData = useMemo(() => {
    if (!scene) return null;

    try {
      const shapeData = createCollisionShapeFromGLB(scene, collisionType, scale);
      
      if (!shapeData || !validateCollisionShape(shapeData)) {
        console.warn('Invalid collision shape data, using fallback box');
        return {
          shapeType: ShapeType.BOX,
          shapeConfig: {
            halfExtents: new THREE.Vector3(0.5, 0.5, 0.5)
          }
        };
      }

      if (shapeData.shapeType === 'convex' && shapeData.vertices) {
        // Note: use-ammojs may not support CONVEX_HULL shape type yet
        // For now, we'll use BOX collision as a fallback for convex shapes
        // TODO: Update when convex hull support is available
        console.warn('Convex hull collision requested but not supported, using box collision');
        return {
          shapeType: ShapeType.BOX,
          shapeConfig: {
            halfExtents: new THREE.Vector3(1, 1, 1) // Default size for convex fallback
          }
        };
      } else if (shapeData.shapeType === 'box' && shapeData.dimensions) {
        return {
          shapeType: ShapeType.BOX,
          shapeConfig: {
            halfExtents: new THREE.Vector3(
              shapeData.dimensions[0] / 2,
              shapeData.dimensions[1] / 2,
              shapeData.dimensions[2] / 2
            )
          }
        };
      }

      // Fallback
      return {
        shapeType: ShapeType.BOX,
        shapeConfig: {
          halfExtents: new THREE.Vector3(0.5, 0.5, 0.5)
        }
      };
    } catch (err) {
      console.error('Error calculating collision shape:', err);
      // Fallback to simple box
      return {
        shapeType: ShapeType.BOX,
        shapeConfig: {
          halfExtents: new THREE.Vector3(0.5, 0.5, 0.5)
        }
      };
    }
  }, [scene, collisionType, scale]);

  // Notify when model is loaded
  useEffect(() => {
    if (scene && collisionData) {
      try {
        onLoad?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to process GLB model');
        onError?.(error);
      }
    }
  }, [scene, collisionData, onLoad, onError]);

  // Create physics body using calculated collision shape
  const [ref] = useRigidBody(() => {
    if (!collisionData) {
      // Fallback configuration
      return {
        shapeType: ShapeType.BOX,
        bodyType: mass > 0 ? BodyType.DYNAMIC : BodyType.STATIC,
        position,
        mass,
        material: {
          friction: 0.4,
          restitution: 0.3
        },
        shapeConfig: {
          halfExtents: new THREE.Vector3(0.5, 0.5, 0.5)
        }
      };
    }

    return {
      shapeType: collisionData.shapeType,
      bodyType: mass > 0 ? BodyType.DYNAMIC : BodyType.STATIC,
      position,
      mass,
      material: {
        friction: 0.4,
        restitution: 0.3
      },
      shapeConfig: collisionData.shapeConfig
    };
  });

  if (!scene) {
    return (
      <mesh position={position}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="red" />
      </mesh>
    );
  }

  return (
    <primitive
      ref={ref}
      object={scene.clone()}
      scale={scale}
      castShadow
      receiveShadow
    />
  );
};

// Error boundary component
class GLBErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <mesh>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="red" />
        </mesh>
      );
    }

    return this.props.children;
  }
}

// Main component with Suspense and error handling
const PhysicsGLB: React.FC<PhysicsGLBProps> = (props) => {
  return (
    <GLBErrorBoundary onError={props.onError}>
      <Suspense
        fallback={
          <mesh position={props.position}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="gray" transparent opacity={0.5} />
          </mesh>
        }
      >
        <GLBModel {...props} />
      </Suspense>
    </GLBErrorBoundary>
  );
};

export default PhysicsGLB;