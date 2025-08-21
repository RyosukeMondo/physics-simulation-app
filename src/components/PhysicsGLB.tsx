import React, { useEffect, Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useRigidBody, ShapeType, BodyType } from 'use-ammojs';
import * as THREE from 'three';
import { createCollisionShapeFromGLB, validateCollisionShape } from '../utils/glbPhysics';
import { SimulationError, ErrorType, logError } from '../utils/errorHandling';

interface PhysicsGLBProps {
  url: string;
  position: [number, number, number];
  scale?: [number, number, number];
  mass?: number;
  collisionType?: 'box' | 'convex';
  onLoad?: () => void;
  onError?: (error: SimulationError) => void;
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

  // Load GLB model using useGLTF hook with error handling
  let scene: THREE.Group | null = null;
  try {
    const gltf = useGLTF(url);
    scene = gltf.scene;
  } catch (err) {
    const error = new SimulationError(
      ErrorType.GLB_LOADING_FAILED,
      err instanceof Error ? err : new Error('Failed to load GLB'),
      { url, collisionType }
    );
    logError(error);
    onError?.(error);
    scene = null;
  }

  // Calculate collision shape data based on collision type
  const collisionData = useMemo(() => {
    if (!scene) return null;

    try {
      const shapeData = createCollisionShapeFromGLB(scene, collisionType, scale);
      
      if (!shapeData || !validateCollisionShape(shapeData)) {
        const error = new SimulationError(
          ErrorType.GLB_PARSING_FAILED,
          new Error('Invalid collision shape data'),
          { url, collisionType, scale }
        );
        logError(error);
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
      const error = new SimulationError(
        ErrorType.GLB_PARSING_FAILED,
        err instanceof Error ? err : new Error('Failed to calculate collision shape'),
        { url, collisionType, scale }
      );
      logError(error);
      onError?.(error);
      
      // Fallback to simple box
      return {
        shapeType: ShapeType.BOX,
        shapeConfig: {
          halfExtents: new THREE.Vector3(0.5, 0.5, 0.5)
        }
      };
    }
  }, [scene, collisionType, scale, url, onError]);

  // Notify when model is loaded
  useEffect(() => {
    if (scene && collisionData) {
      try {
        onLoad?.();
      } catch (err) {
        const error = new SimulationError(
          ErrorType.GLB_LOADING_FAILED,
          err instanceof Error ? err : new Error('Failed to process GLB model'),
          { url, collisionType }
        );
        logError(error);
        onError?.(error);
      }
    }
  }, [scene, collisionData, onLoad, onError, url, collisionType]);

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

// Error boundary component for GLB loading
class GLBErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: SimulationError) => void; position: [number, number, number] },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; onError?: (error: SimulationError) => void; position: [number, number, number] }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const simulationError = new SimulationError(
      ErrorType.GLB_LOADING_FAILED,
      error,
      { errorInfo }
    );
    logError(simulationError);
    this.props.onError?.(simulationError);
  }

  render() {
    if (this.state.hasError) {
      // Render a red error box at the intended position
      return (
        <mesh position={this.props.position}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="red" transparent opacity={0.7} />
        </mesh>
      );
    }

    return this.props.children;
  }
}

// Main component with Suspense and error handling
const PhysicsGLB: React.FC<PhysicsGLBProps> = (props) => {
  return (
    <GLBErrorBoundary onError={props.onError} position={props.position}>
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