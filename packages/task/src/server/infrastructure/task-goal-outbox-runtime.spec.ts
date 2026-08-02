import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTaskGoalOutboxRuntime } from './task-goal-outbox-runtime';

describe('createTaskGoalOutboxRuntime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('dispatches immediately, repeats on the interval, and stops with the module', async () => {
    vi.useFakeTimers();
    const dispatchPending = vi.fn(async () => {});
    const runtime = createTaskGoalOutboxRuntime({ dispatchPending } as never, {
      intervalMs: 1_000,
      batchSize: 25,
    });

    runtime.start();
    await vi.waitFor(() => expect(dispatchPending).toHaveBeenCalledTimes(1));
    expect(dispatchPending).toHaveBeenLastCalledWith(25);

    await vi.advanceTimersByTimeAsync(1_000);
    expect(dispatchPending).toHaveBeenCalledTimes(2);

    runtime.stop();
    await vi.advanceTimersByTimeAsync(2_000);
    expect(dispatchPending).toHaveBeenCalledTimes(2);
  });

  it('does not overlap dispatch cycles when one poll is still running', async () => {
    vi.useFakeTimers();
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const dispatchPending = vi.fn(() => pending);
    const runtime = createTaskGoalOutboxRuntime({ dispatchPending } as never, {
      intervalMs: 100,
    });

    runtime.start();
    await vi.advanceTimersByTimeAsync(500);
    expect(dispatchPending).toHaveBeenCalledTimes(1);

    release();
    await pending;
    await vi.advanceTimersByTimeAsync(100);
    expect(dispatchPending).toHaveBeenCalledTimes(2);
    runtime.stop();
  });
});
