import { describe, it, expect, vi } from 'vitest';
import { FakeTimer, NodeTimer } from '../schedule-timer';

describe('FakeTimer', () => {
  it('should initialize with current time', () => {
    const initialTime = 1000;
    const timer = new FakeTimer(initialTime);
    expect(timer.now()).toBe(initialTime);
  });

  it('should set and trigger timeout', () => {
    const timer = new FakeTimer(0);
    const callback = vi.fn();

    timer.setTimeout(callback, 100);
    expect(callback).not.toHaveBeenCalled();

    timer.tick(100);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should clear timeout', () => {
    const timer = new FakeTimer(0);
    const callback = vi.fn();

    const id = timer.setTimeout(callback, 100);
    timer.clearTimeout(id);

    timer.tick(100);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should trigger multiple timeouts in order', () => {
    const timer = new FakeTimer(0);
    const calls: number[] = [];

    timer.setTimeout(() => calls.push(1), 100);
    timer.setTimeout(() => calls.push(2), 50);
    timer.setTimeout(() => calls.push(3), 150);

    timer.tick(200);
    expect(calls).toEqual([2, 1, 3]);
  });

  it('should set time and trigger pending', () => {
    const timer = new FakeTimer(0);
    const callback = vi.fn();

    timer.setTimeout(callback, 100);
    timer.setTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe('NodeTimer', () => {
  it('should use global setTimeout/clearTimeout', () => {
    const timer = new NodeTimer();
    const callback = vi.fn();

    const id = timer.setTimeout(callback, 0);
    expect(typeof id).toBe('object'); // NodeJS.Timeout

    timer.clearTimeout(id);
  });

  it('should return current timestamp', () => {
    const timer = new NodeTimer();
    const now = timer.now();
    expect(typeof now).toBe('number');
    expect(now).toBeGreaterThan(0);
  });
});
