import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the physics components to avoid Jest configuration issues
jest.mock('./components/PhysicsCanvas', () => {
  return function MockPhysicsCanvas({ children }: { children: React.ReactNode }) {
    return <div data-testid="physics-canvas">{children}</div>;
  };
});

jest.mock('./components/ObjectSpawner', () => {
  return function MockObjectSpawner() {
    return <div data-testid="object-spawner" />;
  };
});

test('renders control panel with physics simulation controls', () => {
  render(<App />);
  const controlsTitle = screen.getByText(/Physics Simulation Controls/i);
  expect(controlsTitle).toBeInTheDocument();
});

test('renders add ball and add square buttons', () => {
  render(<App />);
  const addBallButton = screen.getByText(/Add Ball/i);
  const addSquareButton = screen.getByText(/Add Square/i);
  expect(addBallButton).toBeInTheDocument();
  expect(addSquareButton).toBeInTheDocument();
});

test('renders physics canvas and object spawner', () => {
  render(<App />);
  const physicsCanvas = screen.getByTestId('physics-canvas');
  const objectSpawner = screen.getByTestId('object-spawner');
  expect(physicsCanvas).toBeInTheDocument();
  expect(objectSpawner).toBeInTheDocument();
});
