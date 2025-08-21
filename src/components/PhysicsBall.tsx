import React, { useMemo } from 'react';
import { useRigidBody, ShapeType, BodyType } from 'use-ammojs';
import { SphereGeometry, MeshStandardMaterial } from 'three';
import { PerformanceOptimizer, createMaterialKey, createGeometryKey } from '../utils/performanceOptimization';

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
  const optimizer = PerformanceOptimizer.getInstance();

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

  // Cache geometry and material for performance
  const geometry = useMemo(() => {
    const geometryKey = createGeometryKey('sphere', [radius, 32, 32]);
    return optimizer.getCachedGeometry(geometryKey, () => new SphereGeometry(radius, 32, 32));
  }, [radius, optimizer]);

  const material = useMemo(() => {
    const materialKey = createMaterialKey('standard', color, { metalness: 0.1, roughness: 0.8 });
    return optimizer.getCachedMaterial(materialKey, () => new MeshStandardMaterial({ 
      color,
      metalness: 0.1,
      roughness: 0.8
    }));
  }, [color, optimizer]);

  return (
    <mesh ref={ref} castShadow receiveShadow geometry={geometry} material={material} />
  );
};

export default PhysicsBall;