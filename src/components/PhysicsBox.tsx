import React, { useMemo, useEffect, useRef } from 'react';

import { ShapeType, BodyType } from 'use-ammojs';
import { BoxGeometry, MeshStandardMaterial } from 'three';
import { PerformanceOptimizer, createMaterialKey, createGeometryKey } from '../utils/performanceOptimization';
import { useSafeRigidBody } from '../hooks/useSafeRigidBody';
import { debugLogger } from '../utils/debugLogger';

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
  const componentIdRef = useRef<string>(`PhysicsBox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // Debug logging for props
  useEffect(() => {
    const componentId = componentIdRef.current;
    debugLogger.info(`PhysicsBox ${componentId} mounted`, {
      position,
      size,
      mass,
      color
    });

    return () => {
      debugLogger.info(`PhysicsBox ${componentId} unmounting`);
    };
  }, [position, size, mass, color]);

  // Validate props with detailed logging
  const validatedProps = useMemo(() => {
    const componentId = componentIdRef.current;
    debugLogger.info(`Validating props for ${componentId}`, { position, size, mass, color });

    const validPosition = debugLogger.validatePosition(position, componentId);

    const safePosition: [number, number, number] = validPosition || [0, 5, 0];

    const safeMass = typeof mass === 'number' && !isNaN(mass) && mass > 0 ? mass : 1;
    const safeSize = size && Array.isArray(size) && size.length === 3 ? size : [1, 1, 1];
    const safeColor = typeof color === 'string' ? color : 'blue';

    if (!validPosition) {
      debugLogger.warn(`Using fallback position for ${componentId}`, { original: position, fallback: safePosition });
    }

    const validated = {
      position: safePosition,
      size: safeSize,
      mass: safeMass,
      color: safeColor
    };

    debugLogger.info(`Props validated for ${componentId}`, validated);
    return validated;
  }, [position, size, mass, color]);

  // Use safe rigid body hook
  const { ref, config, error, hasError } = useSafeRigidBody(() => {
    const componentId = componentIdRef.current;
    debugLogger.info(`Creating rigid body config for ${componentId}`, validatedProps);

    return {
      shapeType: ShapeType.BOX,
      bodyType: BodyType.DYNAMIC,
      position: validatedProps.position,
      mass: validatedProps.mass,
      material: {
        friction: 0.4,
        restitution: 0.3
      },
      shapeConfig: {
        halfExtents: {
          x: validatedProps.size[0] / 2,
          y: validatedProps.size[1] / 2,
          z: validatedProps.size[2] / 2
        }
      }
    };
  }, componentIdRef.current);

  // Cache geometry and material for performance
  const geometry = useMemo(() => {
    try {
      const componentId = componentIdRef.current;
      debugLogger.info(`Creating geometry for ${componentId}`, { size: validatedProps.size });

      const geometryKey = createGeometryKey('box', validatedProps.size);
      const geom = optimizer.getCachedGeometry(geometryKey, () => new BoxGeometry(...validatedProps.size));
      debugLogger.info(`Geometry created successfully for ${componentId}`);
      return geom;
    } catch (error) {
      debugLogger.error(`Failed to create geometry for ${componentIdRef.current}`, error);
      return new BoxGeometry(1, 1, 1); // Fallback
    }
  }, [validatedProps.size, optimizer]);

  const material = useMemo(() => {
    try {
      const componentId = componentIdRef.current;
      debugLogger.info(`Creating material for ${componentId}`, { color: validatedProps.color });

      const materialKey = createMaterialKey('standard', validatedProps.color, { metalness: 0.2, roughness: 0.7 });
      const mat = optimizer.getCachedMaterial(materialKey, () => new MeshStandardMaterial({
        color: validatedProps.color,
        metalness: 0.2,
        roughness: 0.7
      }));
      debugLogger.info(`Material created successfully for ${componentId}`);
      return mat;
    } catch (error) {
      debugLogger.error(`Failed to create material for ${componentIdRef.current}`, error);
      return new MeshStandardMaterial({ color: 'blue' }); // Fallback
    }
  }, [validatedProps.color, optimizer]);

  // Log any physics errors
  useEffect(() => {
    if (hasError) {
      debugLogger.error(`Physics error in ${componentIdRef.current}`, { error, config });
    }
  }, [hasError, error, config]);

  debugLogger.info(`Rendering physics box ${componentIdRef.current}`, {
    config,
    hasError,
    position: validatedProps.position
  });

  return (
    <mesh ref={ref} castShadow receiveShadow geometry={geometry} material={material} />
  );
};

export default PhysicsBox;