import React, { useState, useEffect, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import { useRigidBody, ShapeType, BodyType } from 'use-ammojs';
import * as THREE from 'three';

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

  // Notify when model is loaded
  useEffect(() => {
    if (scene) {
      try {
        // Calculate bounding box for future use (e.g., better collision detection)
        const box = new THREE.Box3().setFromObject(scene);
        const size = box.getSize(new THREE.Vector3());
        
        // For now, we use a simple box collision shape
        // In the future, this could be used for more accurate collision detection
        onLoad?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to process GLB model');
        onError?.(error);
      }
    }
  }, [scene, scale, onLoad, onError]);

  // Create physics body using appropriate shape type
  // For now, use BOX for all GLB models as convex hull may not be available
  const [ref] = useRigidBody(() => ({
    shapeType: ShapeType.BOX,
    bodyType: mass > 0 ? BodyType.DYNAMIC : BodyType.STATIC,
    position,
    mass,
    material: {
      friction: 0.4,
      restitution: 0.3
    }
  }));

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