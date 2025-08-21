import React from 'react';
import { useRigidBody, ShapeType, BodyType } from 'use-ammojs';

interface PhysicsBoxProps {
  position: [number, number, number];
  size?: [number, number, number];
  mass?: number;
  color?: string;
}

const PhysicsBox: React.FC<PhysicsBoxProps> = ({
  position,
  size = [1, 1, 1],
  mass = 1,
  color = 'blue'
}) => {
  const [ref] = useRigidBody(() => ({
    shapeType: ShapeType.BOX,
    bodyType: BodyType.DYNAMIC,
    position,
    mass,
    material: {
      friction: 0.4,
      restitution: 0.3
    }
  }));

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

export default PhysicsBox;