import { renderHook, act } from '@testing-library/react';
import { useSimulation } from '../useSimulation';
import { ObjectType } from '../../types/simulation';

describe('useSimulation', () => {
  it('initializes with empty objects array and running state', () => {
    const { result } = renderHook(() => useSimulation());

    expect(result.current.objects).toEqual([]);
    expect(result.current.isRunning).toBe(true);
    expect(result.current.objectCount).toBe(0);
  });

  it('adds a ball when addBall is called', () => {
    const { result } = renderHook(() => useSimulation());

    act(() => {
      result.current.addBall();
    });

    expect(result.current.objects).toHaveLength(1);
    expect(result.current.objects[0].type).toBe(ObjectType.BALL);
    expect(result.current.objects[0].props?.color).toBe('orange');
    expect(result.current.objects[0].props?.radius).toBe(0.5);
    expect(result.current.objectCount).toBe(1);
  });

  it('adds a box when addBox is called', () => {
    const { result } = renderHook(() => useSimulation());

    act(() => {
      result.current.addBox();
    });

    expect(result.current.objects).toHaveLength(1);
    expect(result.current.objects[0].type).toBe(ObjectType.BOX);
    expect(result.current.objects[0].props?.color).toBe('blue');
    expect(result.current.objects[0].props?.size).toEqual([1, 1, 1]);
    expect(result.current.objectCount).toBe(1);
  });

  it('generates unique IDs for objects', () => {
    const { result } = renderHook(() => useSimulation());

    act(() => {
      result.current.addBall();
      result.current.addBall();
    });

    expect(result.current.objects).toHaveLength(2);
    expect(result.current.objects[0].id).not.toBe(result.current.objects[1].id);
  });

  it('generates random positions within expected ranges', () => {
    const { result } = renderHook(() => useSimulation());

    act(() => {
      result.current.addBall();
    });

    const position = result.current.objects[0].position;
    const [x, y, z] = position;

    // Check that positions are within expected ranges
    expect(x).toBeGreaterThanOrEqual(-4);
    expect(x).toBeLessThanOrEqual(4);
    expect(y).toBeGreaterThanOrEqual(5);
    expect(y).toBeLessThanOrEqual(8);
    expect(z).toBeGreaterThanOrEqual(-4);
    expect(z).toBeLessThanOrEqual(4);
  });

  it('removes all objects when removeAllObjects is called', () => {
    const { result } = renderHook(() => useSimulation());

    act(() => {
      result.current.addBall();
      result.current.addBox();
    });

    expect(result.current.objects).toHaveLength(2);

    act(() => {
      result.current.removeAllObjects();
    });

    expect(result.current.objects).toHaveLength(0);
    expect(result.current.objectCount).toBe(0);
  });

  it('toggles simulation state', () => {
    const { result } = renderHook(() => useSimulation());

    expect(result.current.isRunning).toBe(true);

    act(() => {
      result.current.toggleSimulation();
    });

    expect(result.current.isRunning).toBe(false);

    act(() => {
      result.current.toggleSimulation();
    });

    expect(result.current.isRunning).toBe(true);
  });
});