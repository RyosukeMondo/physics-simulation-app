import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingIndicator from '../LoadingIndicator';

describe('LoadingIndicator', () => {
  it('does not render when isLoading is false', () => {
    const { container } = render(
      <LoadingIndicator isLoading={false} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders loading indicator when isLoading is true', () => {
    render(
      <LoadingIndicator isLoading={true} message="Loading test..." />
    );

    expect(screen.getByText('Loading test...')).toBeInTheDocument();
  });

  it('shows progress bar when progress is provided', () => {
    render(
      <LoadingIndicator isLoading={true} progress={75} />
    );

    expect(screen.getByText('75%')).toBeInTheDocument();
    
    const progressBar = document.querySelector('.progress-bar-fill');
    expect(progressBar).toHaveStyle('width: 75%');
  });

  it('renders with overlay when overlay prop is true', () => {
    render(
      <LoadingIndicator isLoading={true} overlay={true} />
    );

    expect(document.querySelector('.loading-overlay')).toBeInTheDocument();
  });

  it('applies correct size class', () => {
    const { rerender } = render(
      <LoadingIndicator isLoading={true} size="small" />
    );

    expect(document.querySelector('.loading-indicator.small')).toBeInTheDocument();

    rerender(<LoadingIndicator isLoading={true} size="large" />);
    expect(document.querySelector('.loading-indicator.large')).toBeInTheDocument();
  });

  it('clamps progress values to 0-100 range', () => {
    const { rerender } = render(
      <LoadingIndicator isLoading={true} progress={-10} />
    );

    let progressBar = document.querySelector('.progress-bar-fill');
    expect(progressBar).toHaveStyle('width: 0%');

    rerender(<LoadingIndicator isLoading={true} progress={150} />);
    progressBar = document.querySelector('.progress-bar-fill');
    expect(progressBar).toHaveStyle('width: 100%');
  });
});