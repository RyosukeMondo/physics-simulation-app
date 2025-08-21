import { useState, useCallback } from 'react';
import { SpawnedObject, ObjectType } from '../types/simulation';

export const useSimulation = () => {
  const [objects, setObjects] = useState<SpawnedObject[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const [resetKey, setResetKey] = useState(0);

  const generateRandomPosition = (): [number, number, number] => {
    // Generate random position above the scene for objects to fall
    const x = (Math.random() - 0.5) * 8; // Random x between -4 and 4
    const y = Math.random() * 3 + 5; // Random y between 5 and 8 (above scene)
    const z = (Math.random() - 0.5) * 8; // Random z between -4 and 4
    return [x, y, z];
  };

  const addObject = useCallback((type: ObjectType, customProps?: Partial<SpawnedObject['props']>) => {
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
  }, []);

  const removeObject = useCallback((id: string) => {
    setObjects(prev => prev.filter(obj => obj.id !== id));
  }, []);

  const removeAllObjects = useCallback(() => {
    // Pause simulation briefly during reset to prevent physics update errors
    setIsRunning(false);
    setObjects([]);
    
    // Force physics world to remount by changing key
    setResetKey(prev => prev + 1);
    
    // Resume simulation after a brief delay to allow cleanup
    setTimeout(() => {
      setIsRunning(true);
    }, 100);
  }, []);

  const addBall = useCallback(() => {
    return addObject(ObjectType.BALL);
  }, [addObject]);

  const addBox = useCallback(() => {
    return addObject(ObjectType.BOX);
  }, [addObject]);

  const toggleSimulation = useCallback(() => {
    setIsRunning(prev => !prev);
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
    toggleSimulation,
    objectCount: objects.length
  };
};