import React, { useMemo, useEffect, useRef, useCallback } from 'react';

import { ShapeType, BodyType } from 'use-ammojs';
import { SphereGeometry, MeshStandardMaterial } from 'three';
import { PerformanceOptimizer, createMaterialKey, createGeometryKey } from '../utils/performanceOptimization';
import { useSafeRigidBody } from '../hooks/useSafeRigidBody';
import { debugLogger } from '../utils/debugLogger';

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
  const componentIdRef = useRef<string>(`PhysicsBall-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // Debug logging for props
  useEffect(() => {
    const componentId = componentIdRef.current;
    debugLogger.info(`PhysicsBall ${componentId} mounted`, {
      position,
      radius,
      mass,
      color
    });

    return () => {
      debugLogger.info(`PhysicsBall ${componentId} unmounting`);
    };
  }, [position, radius, mass, color]);

  // Validate props with detailed logging
  const validatedProps = useMemo(() => {
    const componentId = componentIdRef.current;
    debugLogger.info(`Validating props for ${componentId}`, { position, radius, mass, color });

    const validPosition = debugLogger.validatePosition(position, componentId);
    const safePosition: [number, number, number] = validPosition || [0, 5, 0];
    
    const safeMass = typeof mass === 'number' && !isNaN(mass) && mass > 0 ? mass : 1;
    const safeRadius = typeof radius === 'number' && !isNaN(radius) && radius > 0 ? radius : 0.5;
    const safeColor = typeof color === 'string' ? color : 'orange';

    if (!validPosition) {
      debugLogger.warn(`Using fallback position for ${componentId}`, { original: position, fallback: safePosition });
    }

    const validated = {
      position: safePosition,
      radius: safeRadius,
      mass: safeMass,
      color: safeColor
    };

    debugLogger.info(`Props validated for ${componentId}`, validated);
    return validated;
  }, [position, radius, mass, color]);

  // Use safe rigid body hook
  const configFactory = useCallback(() => {
    const componentId = componentIdRef.current;
    debugLogger.info(`Creating rigid body config for ${componentId}`, validatedProps);
    return {
      shapeType: ShapeType.SPHERE,
      bodyType: BodyType.DYNAMIC,
      position: validatedProps.position,
      mass: validatedProps.mass,
      material: {
        friction: 0.4,
        restitution: 0.6
      },
      shapeConfig: {
        radius: validatedProps.radius
      }
    };
  }, [validatedProps]);

  const { ref, config, error, hasError } = useSafeRigidBody(configFactory, componentIdRef.current);

  // Cache geometry and material for performance
  const geometry = useMemo(() => {
    try {
      const componentId = componentIdRef.current;
      debugLogger.info(`Creating geometry for ${componentId}`, { radius: validatedProps.radius });

      const geometryKey = createGeometryKey('sphere', [validatedProps.radius, 32, 32]);
      const geom = optimizer.getCachedGeometry(geometryKey, () => new SphereGeometry(validatedProps.radius, 32, 32));
      debugLogger.info(`Geometry created successfully for ${componentId}`);
      return geom;
    } catch (error) {
      debugLogger.error(`Failed to create geometry for ${componentIdRef.current}`, error);
      return new SphereGeometry(0.5, 32, 32); // Fallback
    }
  }, [validatedProps.radius, optimizer]);

  const material = useMemo(() => {
    try {
      const componentId = componentIdRef.current;
      debugLogger.info(`Creating material for ${componentId}`, { color: validatedProps.color });

      const materialKey = createMaterialKey('standard', validatedProps.color, { metalness: 0.1, roughness: 0.8 });
      const mat = optimizer.getCachedMaterial(materialKey, () => new MeshStandardMaterial({ 
        color: validatedProps.color,
        metalness: 0.1,
        roughness: 0.8
      }));
      debugLogger.info(`Material created successfully for ${componentId}`);
      return mat;
    } catch (error) {
      debugLogger.error(`Failed to create material for ${componentIdRef.current}`, error);
      return new MeshStandardMaterial({ color: 'orange' }); // Fallback
    }
  }, [validatedProps.color, optimizer]);

  // Log any physics errors
  useEffect(() => {
    if (hasError) {
      debugLogger.error(`Physics error in ${componentIdRef.current}`, { error, config });
    }
  }, [hasError, error, config]);

  debugLogger.info(`Rendering physics ball ${componentIdRef.current}`, { 
    config, 
    hasError, 
    position: validatedProps.position 
  });

  // Always render with physics - let the safe hook handle errors internally
  return (
    <mesh ref={ref} castShadow receiveShadow geometry={geometry} material={material} />
  );
};

export default PhysicsBall;