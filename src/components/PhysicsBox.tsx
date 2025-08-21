import React, { useMemo } from 'react';
import { useRigidBody, ShapeType, BodyType } from 'use-ammojs';
import { BoxGeometry, MeshStandardMaterial } from 'three';
import { PerformanceOptimizer, createMaterialKey, createGeometryKey } from '../utils/performanceOptimization';

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
  const optimizer = PerformanceOptimizer.getInstance();

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

  // Cache geometry and material for performance
  const geometry = useMemo(() => {
    const geometryKey = createGeometryKey('box', size);
    return optimizer.getCachedGeometry(geometryKey, () => new BoxGeometry(...size));
  }, [size, optimizer]);

  const material = useMemo(() => {
    const materialKey = createMaterialKey('standard', color, { metalness: 0.2, roughness: 0.7 });
    return optimizer.getCachedMaterial(materialKey, () => new MeshStandardMaterial({ 
      color,
      metalness: 0.2,
      roughness: 0.7
    }));
  }, [color, optimizer]);

  return (
    <mesh ref={ref} castShadow receiveShadow geometry={geometry} material={material} />
  );
};

export default PhysicsBox;