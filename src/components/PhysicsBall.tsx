import React from 'react';
import { useRigidBody, ShapeType, BodyType } from 'use-ammojs';

interface PhysicsBallProps {
  position: [number, number, number];
  radius?: number;
  mass?: number;
  color?: string;
}

const PhysicsBall: React.FC<PhysicsBallProps> = ({
  position,
  radius = 0.5,
  mass = 1,
  color = 'orange'
}) => {
  const [ref] = useRigidBody(() => ({
    shapeType: ShapeType.SPHERE,
    bodyType: BodyType.DYNAMIC,
    position,
    mass,
    material: {
      friction: 0.4,
      restitution: 0.6
    }
  }));

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

export default PhysicsBall;