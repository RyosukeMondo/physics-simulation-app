export enum ObjectType {
  BALL = 'ball',
  BOX = 'box',
  GLB_MODEL = 'glb'
}

export interface SpawnedObject {
  id: string;
  type: ObjectType;
  position: [number, number, number];
  timestamp: number;
  props?: {
    radius?: number;
    size?: [number, number, number];
    mass?: number;
    color?: string;
    url?: string; // For GLB models
    scale?: [number, number, number]; // For GLB models
    collisionType?: 'box' | 'convex'; // For GLB models
  };
}

export interface SimulationState {
  objects: SpawnedObject[];
  isRunning: boolean;
  selectedGLBUrl: string | null;
  performance: {
    fps: number;
  };
}