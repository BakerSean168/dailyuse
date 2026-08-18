import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResultIpcClient } from '../result-ipc-client';
import type { ElectronBridge } from '../types';

function createMockBridge(): ElectronBridge {
  return {
    invoke: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };
}

describe('ResultIpcClient', () => {
  let bridge: ElectronBridge;
  let client: ResultIpcClient;

  beforeEach(() => {
    bridge = createMockBridge();
    client = new ResultIpcClient({ bridge, timeout: 0 });
  });

  it('returns Result.ok for successful IpcResult envelope', async () => {
    vi.mocked(bridge.invoke).mockResolvedValue({ ok: true, data: [1, 2, 3] });

    const result = await client.invoke<number[]>('test:channel');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([1, 2, 3]);
    }
  });

  it('returns Result.fail for failed IpcResult envelope', async () => {
    vi.mocked(bridge.invoke).mockResolvedValue({
      ok: false,
      error: { message: 'denied', code: 'FORBIDDEN' },
    });

    const result = await client.invoke('test:channel');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('FORBIDDEN');
    }
  });

  it('returns Result.fail for raw non-IpcResult response', async () => {
    vi.mocked(bridge.invoke).mockResolvedValue({ custom: 'format' });

    const result = await client.invoke('test:channel');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INTERNAL_ERROR');
      expect(result.error.message).toContain('not an IpcResult envelope');
    }
  });

  it('does not misclassify domain ok DTOs as IpcResult envelopes', async () => {
    vi.mocked(bridge.invoke).mockResolvedValue({ ok: true, authenticated: false });

    const result = await client.invoke('test:channel');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('not an IpcResult envelope');
    }
  });

  it('returns Result.fail when bridge is missing', async () => {
    const noBridgeClient = new ResultIpcClient({
      bridge: undefined as unknown as ElectronBridge,
      timeout: 0,
    });

    const result = await noBridgeClient.invoke('test:channel');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('bridge not available');
    }
  });

  it('returns Result.fail on bridge error', async () => {
    vi.mocked(bridge.invoke).mockRejectedValue(new Error('crash'));

    const result = await client.invoke('test:channel');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('IPC 调用异常');
    }
  });

  it('returns Result.fail on timeout', async () => {
    vi.useFakeTimers();
    const timeoutClient = new ResultIpcClient({ bridge, timeout: 500 });
    vi.mocked(bridge.invoke).mockReturnValue(new Promise(() => {}));

    const invokePromise = timeoutClient.invoke('slow:channel');
    vi.advanceTimersByTime(501);

    const result = await invokePromise;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('TIMEOUT');
    }

    vi.useRealTimers();
  });

  it('treats an unregistered handler as an internal IPC transport failure', async () => {
    vi.mocked(bridge.invoke).mockRejectedValue(new Error('No handler registered for channel'));

    const result = await client.invoke('unregistered:channel');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INTERNAL_ERROR');
    }
  });
});
