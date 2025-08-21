import { useState, useCallback, useEffect } from 'react';
import { SpawnedObject, ObjectType } from '../types/simulation';
import { PerformanceOptimizer, PERFORMANCE_LIMITS } from '../utils/performanceOptimization';

export const useSimulation = () => {
  const [objects, setObjects] = useState<SpawnedObject[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const [performanceWarnings, setPerformanceWarnings] = useState<string[]>([]);
  
  const optimizer = PerformanceOptimizer.getInstance();

  const generateRandomPosition = (): [number, number, number] => {
    // Generate random position above the scene for objects to fall
    const x = (Math.random() - 0.5) * 8; // Random x between -4 and 4
    const y = Math.random() * 3 + 5; // Random y between 5 and 8 (above scene)
    const z = (Math.random() - 0.5) * 8; // Random z between -4 and 4
    return [x, y, z];
  };

  const addObject = useCallback((type: ObjectType, customProps?: Partial<SpawnedObject['props']>) => {
    // Check if we can add more objects based on performance limits
    if (!optimizer.canAddObject(objects, type)) {
      const typeLimit = type === ObjectType.BALL ? PERFORMANCE_LIMITS.MAX_BALLS :
                       type === ObjectType.BOX ? PERFORMANCE_LIMITS.MAX_BOXES :
                       PERFORMANCE_LIMITS.MAX_GLB_MODELS;
      
      setPerformanceWarnings(prev => [
        ...prev.filter(w => !w.includes('limit reached')),
        `${type} limit reached (${typeLimit} max)`
      ]);
      return null;
    }

    // Auto-cleanup if approaching total limit
    if (objects.length >= PERFORMANCE_LIMITS.CLEANUP_THRESHOLD) {
      const toRemove = optimizer.suggestObjectsForRemoval(objects, 3);
      setObjects(prev => prev.filter(obj => !toRemove.includes(obj.id)));
      setPerformanceWarnings(prev => [
        ...prev.filter(w => !w.includes('Auto-cleanup')),
        'Auto-cleanup performed to maintain performance'
      ]);
    }

    const newObject: SpawnedObject = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      position: generateRandomPosition(),
      timestamp: Date.now(),
      props: {
        mass: 1,
        ...customProps
      }
    };

    // Set default props based on object type
    if (type === ObjectType.BALL) {
      newObject.props = {
        radius: 0.5,
        color: 'orange',
        ...newObject.props
      };
    } else if (type === ObjectType.BOX) {
      newObject.props = {
        size: [1, 1, 1] as [number, number, number],
        color: 'blue',
        ...newObject.props
      };
    }

    setObjects(prev => [...prev, newObject]);
    return newObject.id;
  }, [objects, optimizer]);

  const removeObject = useCallback((id: string) => {
    setObjects(prev => prev.filter(obj => obj.id !== id));
  }, []);

  const removeAllObjects = useCallback(() => {
    // Pause simulation briefly during reset to prevent physics update errors
    setIsRunning(false);
    setObjects([]);
    
    // Clear performance warnings
    setPerformanceWarnings([]);
    
    // Perform cleanup operations
    optimizer.performCleanup();
    
    // Force physics world to remount by changing key
    setResetKey(prev => prev + 1);
    
    // Resume simulation after a brief delay to allow cleanup
    setTimeout(() => {
      setIsRunning(true);
    }, 100);
  }, [optimizer]);

  const addBall = useCallback(() => {
    return addObject(ObjectType.BALL);
  }, [addObject]);

  const addBox = useCallback(() => {
    return addObject(ObjectType.BOX);
  }, [addObject]);

  const addGLB = useCallback((url: string, file: File, customProps?: Partial<SpawnedObject['props']>) => {
    return addObject(ObjectType.GLB_MODEL, {
      url,
      scale: [1, 1, 1] as [number, number, number],
      collisionType: 'box' as const,
      mass: 1,
      ...customProps
    });
  }, [addObject]);

  const addGLBWithCollisionType = useCallback((url: string, file: File, collisionType: 'box' | 'convex', customProps?: Partial<SpawnedObject['props']>) => {
    return addObject(ObjectType.GLB_MODEL, {
      url,
      scale: [1, 1, 1] as [number, number, number],
      collisionType,
      mass: 1,
      ...customProps
    });
  }, [addObject]);

  const toggleSimulation = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  // Performance monitoring effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Clear old warnings periodically
      setPerformanceWarnings(prev => 
        prev.filter(warning => 
          !warning.includes('Auto-cleanup') && 
          !warning.includes('limit reached')
        )
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      optimizer.performCleanup();
    };
  }, [optimizer]);

  const clearPerformanceWarnings = useCallback(() => {
    setPerformanceWarnings([]);
  }, []);

  return {
    objects,
    isRunning,
    resetKey,
    addObject,
    removeObject,
    removeAllObjects,
    addBall,
    addBox,
    addGLB,
    addGLBWithCollisionType,
    toggleSimulation,
    objectCount: objects.length,
    performanceWarnings,
    clearPerformanceWarnings,
    maxObjects: PERFORMANCE_LIMITS.MAX_OBJECTS,
    canAddBall: optimizer.canAddObject(objects, ObjectType.BALL),
    canAddBox: optimizer.canAddObject(objects, ObjectType.BOX),
    canAddGLB: optimizer.canAddObject(objects, ObjectType.GLB_MODEL)
  };
};