import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GLBLoader from '../GLBLoader';

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');

// Mock file reading
Object.defineProperty(window, 'FileReader', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    readAsDataURL: jest.fn(),
    result: 'mock-url',
    onload: null,
    onerror: null
  }))
});

describe('GLBLoader', () => {
  const mockOnLoadGLB = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders load GLB button', () => {
    render(<GLBLoader onLoadGLB={mockOnLoadGLB} />);
    
    expect(screen.getByText('Load GLB')).toBeInTheDocument();
  });

  it('disables button when disabled prop is true', () => {
    render(<GLBLoader onLoadGLB={mockOnLoadGLB} disabled={true} />);
    
    const button = screen.getByText('Load GLB');
    expect(button).toBeDisabled();
  });

  it('calls onLoadGLB when valid file is selected', async () => {
    render(<GLBLoader onLoadGLB={mockOnLoadGLB} />);
    
    const button = screen.getByText('Load GLB');
    fireEvent.click(button);

    // Create a mock file
    const file = new File(['mock content'], 'test.glb', { type: 'model/gltf-binary' });
    
    // Get the hidden file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Simulate file selection
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(mockOnLoadGLB).toHaveBeenCalledWith(expect.any(String), file);
    });
  });

  it('validates file type', async () => {
    render(<GLBLoader onLoadGLB={mockOnLoadGLB} />);
    
    const button = screen.getByText('Load GLB');
    fireEvent.click(button);

    // Create a mock file with wrong type
    const file = new File(['mock content'], 'test.txt', { type: 'text/plain' });
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('Please select a GLB or GLTF file')).toBeInTheDocument();
    });

    expect(mockOnLoadGLB).not.toHaveBeenCalled();
  });

  it('validates file size', async () => {
    render(<GLBLoader onLoadGLB={mockOnLoadGLB} />);
    
    const button = screen.getByText('Load GLB');
    fireEvent.click(button);

    // Create a mock file that's too large (over 50MB)
    const largeFile = new File(['x'.repeat(51 * 1024 * 1024)], 'large.glb', { 
      type: 'model/gltf-binary' 
    });
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [largeFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('File size must be less than 50MB')).toBeInTheDocument();
    });

    expect(mockOnLoadGLB).not.toHaveBeenCalled();
  });

  it('accepts GLB files', async () => {
    render(<GLBLoader onLoadGLB={mockOnLoadGLB} />);
    
    const button = screen.getByText('Load GLB');
    fireEvent.click(button);

    const file = new File(['mock content'], 'test.glb', { type: 'model/gltf-binary' });
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(mockOnLoadGLB).toHaveBeenCalledWith(expect.any(String), file);
    });
  });

  it('accepts GLTF files', async () => {
    render(<GLBLoader onLoadGLB={mockOnLoadGLB} />);
    
    const button = screen.getByText('Load GLB');
    fireEvent.click(button);

    const file = new File(['mock content'], 'test.gltf', { type: 'model/gltf+json' });
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(mockOnLoadGLB).toHaveBeenCalledWith(expect.any(String), file);
    });
  });
});