import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Physics, useRigidBody, ShapeType, BodyType } from 'use-ammojs';
import { Vector3 } from 'three';

interface PhysicsCanvasProps {
  children?: React.ReactNode;
}

const PhysicsCanvas: React.FC<PhysicsCanvasProps> = ({ children }) => {
  return (
    <Canvas
      shadows
      camera={{
        position: [10, 10, 10],
        fov: 60,
        near: 0.1,
        far: 1000
      }}
      style={{ width: '100vw', height: '100vh' }}
    >
      <Physics gravity={[0, -9.81, 0]}>
        {/* Default lighting setup */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        
        {/* Camera controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          dampingFactor={0.1}
          enableDamping={true}
        />
        
        {/* Ground plane */}
        <GroundPlane />
        
        {children}
      </Physics>
    </Canvas>
  );
};

// Ground plane component with physics
const GroundPlane: React.FC = () => {
  const [ref] = useRigidBody(() => ({
    shapeType: ShapeType.BOX,
    bodyType: BodyType.STATIC,
    position: [0, -0.5, 0],
    shapeConfig: {
      halfExtents: new Vector3(10, 0.5, 10)
    }
  }));

  return (
    <mesh
      ref={ref}
      receiveShadow
    >
      <boxGeometry args={[20, 1, 20]} />
      <meshStandardMaterial color="#cccccc" />
    </mesh>
  );
};

export default PhysicsCanvas;