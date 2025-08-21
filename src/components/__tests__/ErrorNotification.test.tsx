import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ErrorNotification from '../ErrorNotification';
import { SimulationError, ErrorType } from '../../utils/errorHandling';

describe('ErrorNotification', () => {
  const mockError = new SimulationError(
    ErrorType.GLB_LOADING_FAILED,
    new Error('Test error'),
    { fileName: 'test.glb' }
  );

  it('does not render when error is null', () => {
    const { container } = render(
      <ErrorNotification error={null} onDismiss={jest.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders error notification when error is provided', () => {
    render(
      <ErrorNotification error={mockError} onDismiss={jest.fn()} />
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText(mockError.userMessage)).toBeInTheDocument();
  });

  it('shows suggestions when available', () => {
    render(
      <ErrorNotification error={mockError} onDismiss={jest.fn()} />
    );

    expect(screen.getByText('Try this:')).toBeInTheDocument();
    expect(screen.getByText('Make sure the file is a valid GLB or GLTF format')).toBeInTheDocument();
  });

  it('calls onDismiss when close button is clicked', () => {
    const onDismiss = jest.fn();
    
    render(
      <ErrorNotification error={mockError} onDismiss={onDismiss} />
    );

    const closeButton = screen.getByTitle('Dismiss error');
    fireEvent.click(closeButton);

    // Should call onDismiss after animation delay
    setTimeout(() => {
      expect(onDismiss).toHaveBeenCalled();
    }, 400);
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = jest.fn();
    
    render(
      <ErrorNotification error={mockError} onDismiss={onDismiss} />
    );

    const dismissButton = screen.getByText('Dismiss');
    fireEvent.click(dismissButton);

    // Should call onDismiss after animation delay
    setTimeout(() => {
      expect(onDismiss).toHaveBeenCalled();
    }, 400);
  });

  it('shows and hides details when toggle is clicked', () => {
    render(
      <ErrorNotification error={mockError} onDismiss={jest.fn()} />
    );

    const detailsButton = screen.getByText('Show Details');
    fireEvent.click(detailsButton);

    expect(screen.getByText('Hide Details')).toBeInTheDocument();
    expect(screen.getByText('Context:')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Hide Details'));
    expect(screen.getByText('Show Details')).toBeInTheDocument();
  });

  it('auto-hides when autoHide is enabled', async () => {
    const onDismiss = jest.fn();
    
    render(
      <ErrorNotification 
        error={mockError} 
        onDismiss={onDismiss} 
        autoHide={true}
        autoHideDelay={100}
      />
    );

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalled();
    }, { timeout: 200 });
  });
});