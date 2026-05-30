import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IpcClientImpl } from '../ipc-client';
import { ResultIpcClient } from '../result-ipc-client';
import { IpcClientError } from '../types';
import type { ElectronBridge } from '../types';

function createMockBridge(overrides: Partial<ElectronBridge> = {}): ElectronBridge {
  return {
    invoke: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    ...overrides,
  };
}

describe('IpcClientImpl', () => {
  let bridge: ElectronBridge;
  let client: IpcClientImpl;

  beforeEach(() => {
    bridge = createMockBridge();
    client = new IpcClientImpl({ bridge, timeout: 0 });
  });

  it('unwraps successful IpcResult envelope', async () => {
    vi.mocked(bridge.invoke).mockResolvedValue({ ok: true, data: { id: 1, name: 'test' } });

    const result = await client.invoke('test:channel');

    expect(result).toEqual({ id: 1, name: 'test' });
    expect(bridge.invoke).toHaveBeenCalledWith('test:channel');
  });

  it('throws IpcClientError on failed IpcResult envelope', async () => {
    vi.mocked(bridge.invoke).mockResolvedValue({
      ok: false,
      error: { message: 'not found', code: 'NOT_FOUND', details: { id: 99 } },
    });

    await expect(client.invoke('test:channel')).rejects.toThrow(IpcClientError);
    await expect(client.invoke('test:channel')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      channel: 'test:channel',
      details: { id: 99 },
    });
  });

  it('passes through non-IpcResult responses', async () => {
    vi.mocked(bridge.invoke).mockResolvedValue('raw string');

    const result = await client.invoke('test:channel');

    expect(result).toBe('raw string');
  });

  it('passes through null responses', async () => {
    vi.mocked(bridge.invoke).mockResolvedValue(null);

    const result = await client.invoke('test:channel');

    expect(result).toBeNull();
  });

  it('throws IpcClientError when bridge is missing', async () => {
    const noBridgeClient = new IpcClientImpl({ bridge: undefined as unknown as ElectronBridge, timeout: 0 });

    await expect(noBridgeClient.invoke('test:channel')).rejects.toThrow(IpcClientError);
    await expect(noBridgeClient.invoke('test:channel')).rejects.toMatchObject({
      code: 'BRIDGE_NOT_FOUND',
    });
  });

  it('wraps bridge errors in IpcClientError', async () => {
    vi.mocked(bridge.invoke).mockRejectedValue(new Error('connection lost'));

    await expect(client.invoke('test:channel')).rejects.toThrow(IpcClientError);
    await expect(client.invoke('test:channel')).rejects.toMatchObject({
      code: 'IPC_ERROR',
      channel: 'test:channel',
    });
  });

  it('re-throws existing IpcClientError without wrapping', async () => {
    const original = new IpcClientError('original', 'ORIGINAL_CODE', 'test:channel');
    vi.mocked(bridge.invoke).mockRejectedValue(original);

    await expect(client.invoke('test:channel')).rejects.toBe(original);
  });

  it('passes args to bridge.invoke', async () => {
    vi.mocked(bridge.invoke).mockResolvedValue({ ok: true, data: 'ok' });

    await client.invoke('test:channel', 'arg1', 42, { nested: true });

    expect(bridge.invoke).toHaveBeenCalledWith('test:channel', 'arg1', 42, { nested: true });
  });

  it('times out when bridge is slow', async () => {
    vi.useFakeTimers();
    const timeoutClient = new IpcClientImpl({ bridge, timeout: 1000 });
    vi.mocked(bridge.invoke).mockReturnValue(new Promise(() => {})); // never resolves

    const invokePromise = timeoutClient.invoke('slow:channel');
    vi.advanceTimersByTime(1001);

    await expect(invokePromise).rejects.toThrow(IpcClientError);
    await expect(invokePromise).rejects.toMatchObject({ code: 'TIMEOUT' });

    vi.useRealTimers();
  });
});

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

  it('returns Result.ok for raw non-IpcResult response', async () => {
    vi.mocked(bridge.invoke).mockResolvedValue({ custom: 'format' });

    const result = await client.invoke('test:channel');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ custom: 'format' });
    }
  });

  it('returns Result.fail when bridge is missing', async () => {
    const noBridgeClient = new ResultIpcClient({ bridge: undefined as unknown as ElectronBridge, timeout: 0 });

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
      expect(result.error.message).toBe('crash');
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

  it('returns Result.fail for "No handler registered" error', async () => {
    vi.mocked(bridge.invoke).mockRejectedValue(new Error('No handler registered for channel'));

    const result = await client.invoke('unregistered:channel');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });
});
