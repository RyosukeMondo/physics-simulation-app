import { useRigidBody, ShapeType, BodyType } from 'use-ammojs';
import { useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { debugLogger } from '../utils/debugLogger';
import { addRecentRigidBodyConfig } from '../utils/physicsDebugRegistry';

interface RigidBodyConfig {
  shapeType: ShapeType;
  bodyType: BodyType;
  position: [number, number, number];
  mass: number;
  material?: {
    friction: number;
    restitution: number;
  };
  shapeConfig?: any;
  // Extra debug fields are ignored by physics lib but useful in logs
  debugId?: string;
}

export const useSafeRigidBody = (
  configFactory: () => RigidBodyConfig,
  componentName: string = 'Unknown',
  threeObject?: THREE.Object3D
) => {
  const errorRef = useRef<string | null>(null);
  const cacheRef = useRef<RigidBodyConfig | null>(null);
  const callCountRef = useRef<number>(0);
  const lastConfigRef = useRef<RigidBodyConfig | null>(null);
  // Stable per-component instance token for dev StrictMode
  const instanceIdRef = useRef<string>(`${componentName}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const lastPushedDebugIdRef = useRef<string | null>(null);

  // Helper: normalize and validate shapeConfig based on shapeType
  const normalizeConfig = useCallback((cfg: RigidBodyConfig): RigidBodyConfig => {
    const normalized: RigidBodyConfig = { ...cfg };

    if (!(typeof normalized.mass === 'number' && isFinite(normalized.mass) && normalized.mass >= 0)) {
      normalized.mass = 1;
    }

    if (normalized.shapeType === ShapeType.SPHERE) {
      const radius = normalized.shapeConfig?.radius;
      if (!(typeof radius === 'number' && isFinite(radius) && radius > 0)) {
        normalized.shapeConfig = { ...(normalized.shapeConfig || {}), radius: 0.5 };
        debugLogger.warn(`Normalized missing/invalid sphere radius for ${componentName}`, { prev: radius, next: 0.5 });
      }
    } else if (normalized.shapeType === ShapeType.BOX) {
      const he = normalized.shapeConfig?.halfExtents;
      const ok = he && typeof he.x === 'number' && he.x > 0 && typeof he.y === 'number' && he.y > 0 && typeof he.z === 'number' && he.z > 0;
      if (!ok) {
        const next = { x: 0.5, y: 0.5, z: 0.5 };
        normalized.shapeConfig = { ...(normalized.shapeConfig || {}), halfExtents: next };
        debugLogger.warn(`Normalized missing/invalid box halfExtents for ${componentName}`, { prev: he, next });
      }
    }

    return normalized;
  }, [componentName]);

  // Memoize the safe config factory to prevent unnecessary re-renders
  const safeConfigFactory = useCallback(() => {
    try {
      callCountRef.current += 1;
      debugLogger.info(`Creating rigid body config for ${componentName}`, { callCount: callCountRef.current });
      // Dev-only cache to mitigate React.StrictMode double-invocation
      if (process.env.NODE_ENV !== 'production' && cacheRef.current) {
        debugLogger.info(`Reusing cached rigid body config for ${componentName} (StrictMode mitigation)`, cacheRef.current);
        lastConfigRef.current = cacheRef.current;
        addRecentRigidBodyConfig(componentName, cacheRef.current);
        return cacheRef.current;
      }
      
      const config = configFactory();

      // Validate the configuration
      if (!config) {
        throw new Error('Config factory returned null/undefined');
      }

      // Validate position
      const validPosition = debugLogger.validatePosition(config.position, componentName);
      if (!validPosition) {
        throw new Error('Invalid position in rigid body config');
      }

      // Validate mass
      if (typeof config.mass !== 'number' || isNaN(config.mass)) {
        debugLogger.error(`Invalid mass for ${componentName}`, { mass: config.mass });
        throw new Error('Invalid mass in rigid body config');
      }

      // Validate shape type
      if (!Object.values(ShapeType).includes(config.shapeType)) {
        debugLogger.error(`Invalid shape type for ${componentName}`, { shapeType: config.shapeType });
        throw new Error('Invalid shape type in rigid body config');
      }

      // Validate body type
      if (!Object.values(BodyType).includes(config.bodyType)) {
        debugLogger.error(`Invalid body type for ${componentName}`, { bodyType: config.bodyType });
        throw new Error('Invalid body type in rigid body config');
      }

      // Attach debug info and normalize
      // Ensure a stable debugId across dev double-invocation to make registration idempotent-ish
      const debugId = cacheRef.current?.debugId || `${instanceIdRef.current}`;
      const validatedConfig = normalizeConfig({
        ...config,
        position: validPosition,
        debugId
      });

      debugLogger.info(`Rigid body config validated successfully for ${componentName}`, validatedConfig);
      errorRef.current = null;
      if (process.env.NODE_ENV !== 'production') {
        cacheRef.current = validatedConfig;
      }
      lastConfigRef.current = validatedConfig;
      if (lastPushedDebugIdRef.current !== validatedConfig.debugId) {
        addRecentRigidBodyConfig(componentName, validatedConfig);
        lastPushedDebugIdRef.current = validatedConfig.debugId || null;
      }
      
      return validatedConfig;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      debugLogger.error(`Failed to create rigid body config for ${componentName}`, { error: errorMessage });
      errorRef.current = errorMessage;
      
      // Return a safe fallback configuration
      const fallbackConfig: RigidBodyConfig = {
        shapeType: ShapeType.BOX,
        bodyType: BodyType.DYNAMIC,
        position: [0, 5, 0],
        mass: 1,
        material: {
          friction: 0.4,
          restitution: 0.3
        },
        shapeConfig: {
          halfExtents: { x: 0.5, y: 0.5, z: 0.5 }
        },
        debugId: `${componentName}-fallback-${Date.now()}`
      };
      
      const normalizedFallback = normalizeConfig(fallbackConfig);
      debugLogger.warn(`Using fallback config for ${componentName}`, normalizedFallback);
      lastConfigRef.current = normalizedFallback;
      if (lastPushedDebugIdRef.current !== normalizedFallback.debugId) {
        addRecentRigidBodyConfig(componentName, normalizedFallback);
        lastPushedDebugIdRef.current = normalizedFallback.debugId || null;
      }
      return normalizedFallback;
    }
  }, [configFactory, componentName, normalizeConfig]);

  // Always call useRigidBody - hooks must be called unconditionally
  debugLogger.info(`Calling useRigidBody for ${componentName}`);
  const [rigidBodyRef] = useRigidBody(safeConfigFactory, threeObject as any);
  debugLogger.info(`useRigidBody completed for ${componentName}`);

  // Lifecycle logs to correlate mount/unmount in diagnostics
  useEffect(() => {
    const instId = instanceIdRef.current;
    debugLogger.info(`useSafeRigidBody mounted for ${componentName}`, { instanceId: instId });
    return () => {
      debugLogger.info(`useSafeRigidBody unmounted for ${componentName}`, { instanceId: instId });
    };
  }, [componentName]);

  return {
    ref: rigidBodyRef,
    config: lastConfigRef.current || undefined,
    error: errorRef.current,
    hasError: !!errorRef.current
  };
};