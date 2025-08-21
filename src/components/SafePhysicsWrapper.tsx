import React, { ErrorInfo, ReactNode } from 'react';

interface SafePhysicsWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  position?: [number, number, number];
}

interface SafePhysicsWrapperState {
  hasError: boolean;
  error: Error | null;
}

class SafePhysicsWrapper extends React.Component<SafePhysicsWrapperProps, SafePhysicsWrapperState> {
  constructor(props: SafePhysicsWrapperProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): SafePhysicsWrapperState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Physics component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default fallback - a simple red box at the intended position
      const safePosition: [number, number, number] = this.props.position || [0, 5, 0];
      return (
        <mesh position={safePosition}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="red" transparent opacity={0.7} />
        </mesh>
      );
    }

    return this.props.children;
  }
}

export default SafePhysicsWrapper;