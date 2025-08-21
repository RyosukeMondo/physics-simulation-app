import React, { useEffect, Suspense, useMemo, useState, useRef, useCallback } from 'react';

import { useGLTF } from '@react-three/drei';
import { ShapeType, BodyType } from 'use-ammojs';
import * as THREE from 'three';
import { createCollisionShapeFromGLB, validateCollisionShape } from '../utils/glbPhysics';
import { SimulationError, ErrorType, logError } from '../utils/errorHandling';
import { useSafeRigidBody } from '../hooks/useSafeRigidBody';
import { debugLogger } from '../utils/debugLogger';

interface PhysicsGLBProps {
  url: string;
  position: [number, number, number];
  scale?: [number, number, number];
  mass?: number;
  collisionType?: 'box' | 'convex';
  onLoad?: () => void;
  onError?: (error: SimulationError) => void;
}

// Extracted GLBInstance to stabilize component identity across re-renders.
// Defining a component inside another function component creates a new type on every render,
// which causes React to unmount/mount the child. That was resetting physics bodies.
const GLBInstance: React.FC<{
  instance: THREE.Group;
  collisionData: any;
  validatedProps: { position: [number, number, number]; mass: number; scale: [number, number, number] };
  url: string;
  scale: [number, number, number];
  componentId: string;
}> = ({ instance, collisionData, validatedProps, url, scale, componentId }) => {
  // Keep latest values in refs to avoid unnecessary dependencies while preserving correctness
  const collisionDataRef = useRef(collisionData);
  const validatedPropsRef = useRef(validatedProps);
  const urlRef = useRef(url);
  const sceneInstanceRef = useRef(instance);
  // Cache to preserve config object identity across unrelated re-renders
  const cachedConfigRef = useRef<any | null>(null);
  const prevSignatureRef = useRef<string>("");

  // Sync refs on each render
  collisionDataRef.current = collisionData;
  validatedPropsRef.current = validatedProps;
  urlRef.current = url;
  sceneInstanceRef.current = instance;

  // Stable factory using refs; reuses cached config when inputs are unchanged
  const configFactory = useCallback(() => {
    const latestCollision = collisionDataRef.current;
    const latestProps = validatedPropsRef.current;
    const latestUrl = urlRef.current;
    const hasScene = !!sceneInstanceRef.current;

    debugLogger.info(`Creating physics config for GLB ${componentId}`, {
      collisionData: latestCollision,
      validatedProps: latestProps,
      url: latestUrl,
      hasScene
    });

    const sigParts = [
      latestCollision ? String(latestCollision.shapeType) : 'BOX',
      latestCollision ? JSON.stringify(latestCollision.shapeConfig ?? {}) : JSON.stringify({ halfExtents: { x: 0.5, y: 0.5, z: 0.5 } }),
      Array.isArray(latestProps?.position) ? latestProps.position.join(',') : '0,5,0',
      String(latestProps?.mass ?? 1),
      latestProps?.mass && latestProps.mass > 0 ? 'DYNAMIC' : 'STATIC'
    ];
    const signature = sigParts.join('|');

    if (prevSignatureRef.current === signature && cachedConfigRef.current) {
      debugLogger.info(`Reusing cached physics config for GLB ${componentId}`);
      return cachedConfigRef.current;
    }

    let nextConfig: any;
    if (!latestCollision) {
      debugLogger.warn(`No collision data for GLB ${componentId}, using fallback box`);
      nextConfig = {
        shapeType: ShapeType.BOX,
        bodyType: latestProps.mass > 0 ? BodyType.DYNAMIC : BodyType.STATIC,
        position: latestProps.position,
        mass: latestProps.mass,
        material: {
          friction: 0.4,
          restitution: 0.3
        },
        shapeConfig: {
          halfExtents: { x: 0.5, y: 0.5, z: 0.5 }
        }
      };
    } else {
      const bodyType = latestProps.mass > 0 ? BodyType.DYNAMIC : BodyType.STATIC;
      const mass = latestProps.mass;

      nextConfig = {
        shapeType: latestCollision.shapeType,
        bodyType,
        position: latestProps.position,
        mass,
        material: {
          friction: 0.4,
          restitution: 0.3
        },
        shapeConfig: latestCollision.shapeConfig
      };
    }

    cachedConfigRef.current = nextConfig;
    prevSignatureRef.current = signature;
    return nextConfig;
  }, [componentId]);

  const { ref, config, error: physicsError, hasError } = useSafeRigidBody(
    configFactory,
    componentId,
    sceneInstanceRef.current
  );

  useEffect(() => {
    if (hasError) {
      debugLogger.error(`Physics error in GLB ${componentId}`, {
        error: physicsError,
        config,
        url,
        position: validatedProps.position
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasError]);

  return (
    <primitive
      ref={ref}
      object={instance}
      scale={scale}
      castShadow
      receiveShadow
    />
  );
};

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
  const componentIdRef = useRef<string>(`GLBModel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // Debug logging and validation
  useEffect(() => {
    const componentId = componentIdRef.current;
    debugLogger.info(`GLBModel ${componentId} mounted`, {
      url,
      position,
      scale,
      mass,
      collisionType
    });

    // Validate position immediately
    const validPosition = debugLogger.validatePosition(position, componentId);
    if (!validPosition) {
      debugLogger.error(`GLBModel ${componentId} has invalid position, this will cause physics errors`, {
        position,
        url
      });
    }

    return () => {
      debugLogger.info(`GLBModel ${componentId} unmounting`);
    };
  }, [url, position, scale, mass, collisionType]);

  // Load GLB model using useGLTF hook. Let Suspense/ErrorBoundary handle loading/errors.
  const gltf = useGLTF(url);
  const scene: THREE.Group | null = gltf?.scene ?? null;
  useEffect(() => {
    if (scene) {
      debugLogger.info(`GLB scene loaded successfully for ${componentIdRef.current}`, { url });
    }
  }, [scene, url]);

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
            halfExtents: { x: 0.5, y: 0.5, z: 0.5 }
          }
        };
      }

      if (shapeData.shapeType === 'convex') {
        // Use convex hull shape (dynamic-friendly and lighter than triangle mesh)
        return {
          shapeType: ShapeType.HULL,
          shapeConfig: {
            // Reasonable defaults for performance/quality balance
            hullMaxVertices: 64,
            includeInvisible: false
          }
        };
      } else if (shapeData.shapeType === 'box' && shapeData.dimensions) {
        return {
          shapeType: ShapeType.BOX,
          shapeConfig: {
            halfExtents: {
              x: shapeData.dimensions[0] / 2,
              y: shapeData.dimensions[1] / 2,
              z: shapeData.dimensions[2] / 2
            }
          }
        };
      }

      // Fallback
      return {
        shapeType: ShapeType.BOX,
        shapeConfig: {
          halfExtents: { x: 0.5, y: 0.5, z: 0.5 }
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

  // Create a stable cloned scene instance to attach refs without remounting each render
  const sceneInstance = useMemo(() => {
    if (!scene) return null;
    const cloned = scene.clone(true);
    // Ensure world matrices are up-to-date before physics reads them
    cloned.updateMatrixWorld(true);
    return cloned;
  }, [scene]);

  // Validate props before creating physics body
  const validatedProps = useMemo(() => {
    const validPosition = debugLogger.validatePosition(position, componentIdRef.current);
    const safePosition: [number, number, number] = validPosition || [0, 5, 0];
    const safeMass = typeof mass === 'number' && !isNaN(mass) && mass > 0 ? mass : 1;

    if (!validPosition) {
      debugLogger.warn(`Using fallback position for GLB ${componentIdRef.current}`, { 
        original: position, 
        fallback: safePosition 
      });
    }

    const safeScale: [number, number, number] = Array.isArray(scale) && scale.length === 3
      ? [scale[0], scale[1], scale[2]] as [number, number, number]
      : [1, 1, 1];

    return {
      position: safePosition,
      mass: safeMass,
      scale: safeScale
    };
  }, [position, mass, scale]);

  // Let Suspense fallback render during loading; if no scene, render nothing here.
  if (!sceneInstance) {
    return null;
  }

  return sceneInstance ? (
    <GLBInstance
      instance={sceneInstance}
      collisionData={collisionData}
      validatedProps={validatedProps}
      url={url}
      scale={scale}
      componentId={componentIdRef.current}
    />
  ) : null;
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
      const safePosition: [number, number, number] = this.props.position || [0, 5, 0];
      return (
        <mesh position={safePosition}>
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
  const [hasLoadingError, setHasLoadingError] = useState(false);
  
  const handleError = (error: SimulationError) => {
    debugLogger.error('GLB loading error caught by main component', { error, url: props.url });
    setHasLoadingError(true);
    props.onError?.(error);
  };

  // If there's a loading error, render a simple fallback without physics
  if (hasLoadingError) {
    debugLogger.info('Rendering static fallback due to loading error', { url: props.url });
    return (
      <mesh position={props.position || [0, 5, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="red" transparent opacity={0.7} />
      </mesh>
    );
  }

  return (
    <GLBErrorBoundary onError={handleError} position={props.position}>
      <Suspense
        fallback={
          <mesh position={props.position || [0, 5, 0]}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="gray" transparent opacity={0.5} />
          </mesh>
        }
      >
        <GLBModel {...props} onError={handleError} />
      </Suspense>
    </GLBErrorBoundary>
  );
};

export default PhysicsGLB;