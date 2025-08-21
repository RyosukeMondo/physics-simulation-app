import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ControlPanel from '../ControlPanel';

describe('ControlPanel', () => {
  const mockOnAddBall = jest.fn();
  const mockOnAddBox = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders control panel with title and buttons', () => {
    render(
      <ControlPanel
        onAddBall={mockOnAddBall}
        onAddBox={mockOnAddBox}
        objectCount={0}
      />
    );

    expect(screen.getByText('Physics Simulation Controls')).toBeInTheDocument();
    expect(screen.getByText('Add Ball')).toBeInTheDocument();
    expect(screen.getByText('Add Square')).toBeInTheDocument();
    expect(screen.getByText('Objects: 0')).toBeInTheDocument();
  });

  it('calls onAddBall when Add Ball button is clicked', () => {
    render(
      <ControlPanel
        onAddBall={mockOnAddBall}
        onAddBox={mockOnAddBox}
        objectCount={0}
      />
    );

    fireEvent.click(screen.getByText('Add Ball'));
    expect(mockOnAddBall).toHaveBeenCalledTimes(1);
  });

  it('calls onAddBox when Add Square button is clicked', () => {
    render(
      <ControlPanel
        onAddBall={mockOnAddBall}
        onAddBox={mockOnAddBox}
        objectCount={0}
      />
    );

    fireEvent.click(screen.getByText('Add Square'));
    expect(mockOnAddBox).toHaveBeenCalledTimes(1);
  });

  it('displays correct object count', () => {
    render(
      <ControlPanel
        onAddBall={mockOnAddBall}
        onAddBox={mockOnAddBox}
        objectCount={5}
      />
    );

    expect(screen.getByText('Objects: 5')).toBeInTheDocument();
  });

  it('has proper button titles for accessibility', () => {
    render(
      <ControlPanel
        onAddBall={mockOnAddBall}
        onAddBox={mockOnAddBox}
        objectCount={0}
      />
    );

    const ballButton = screen.getByText('Add Ball');
    const boxButton = screen.getByText('Add Square');

    expect(ballButton).toHaveAttribute('title', 'Add a physics ball to the scene');
    expect(boxButton).toHaveAttribute('title', 'Add a physics box to the scene');
  });
});