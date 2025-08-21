// Core types for the physics simulation app

export interface PhysicsObject {
  id: string;
  type: ObjectType;
  position: [number, number, number];
  timestamp: number;
}

export enum ObjectType {
  BALL = 'ball',
  BOX = 'box',
  GLB_MODEL = 'glb'
}

export interface PhysicsBodyProps {
  mass: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  material?: {
    friction?: number;
    restitution?: number;
  };
}

export interface SimulationState {
  objects: PhysicsObject[];
  isRunning: boolean;
  selectedGLBUrl: string | null;
  performance: {
    fps: number;
  };
}