/**
 * DesktopProfileAccessContext lifecycle spec — RefArch Phase 2 producer.
 * 验证每个 `requireRequestContext()` 调用：owner 只解析一次、每次生成全新
 * requestId（traceId 相同）、startedAt 来自注入时钟、source 固定为 'ipc'。
 */
import { describe, expect, it, vi } from 'vitest';
import { DesktopProfileAccessContext } from './profile-access-context';

describe('DesktopProfileAccessContext (RefArch Phase 2 producer)', () => {
  it('mints a fresh requestId per invocation and resolves the owner exactly once', async () => {
    const resolveOwner = vi.fn(() => 'identity-desktop-1');
    let counter = 0;
    const idFactory = vi.fn(() => `ipc-req-${++counter}`);
    const now = vi.fn(() => 1_700_000_000_000);
    const auth = new DesktopProfileAccessContext(resolveOwner, 'desktop-app', idFactory, now);

    const first = await auth.requireRequestContext();
    const second = await auth.requireRequestContext();

    expect(first.requestId).toBe('ipc-req-1');
    expect(second.requestId).toBe('ipc-req-2');
    expect(first.requestId).not.toBe(second.requestId);
    // Owner is resolved once per invocation (two invocations → two resolutions).
    expect(resolveOwner).toHaveBeenCalledTimes(2);
    expect(idFactory).toHaveBeenCalledTimes(2);
  });

  it('returns a full canonical ExecutionContext shape (source ipc, traceId = requestId)', async () => {
    const auth = new DesktopProfileAccessContext(
      () => 'identity-desktop-1',
      'desktop-app',
      () => 'ipc-req-fixed',
      () => 1_700_000_000_000,
    );

    const context = await auth.requireRequestContext();

    expect(context).toEqual({
      requestId: 'ipc-req-fixed',
      traceId: 'ipc-req-fixed',
      startedAt: 1_700_000_000_000,
      source: 'ipc',
      identityId: 'identity-desktop-1',
      deviceId: 'desktop-app',
    });
  });

  it('fails closed with AUTH_REQUIRED when no owner resolves', async () => {
    const auth = new DesktopProfileAccessContext(() => null);
    await expect(auth.requireRequestContext()).rejects.toMatchObject({
      name: 'ElectronAuthResolutionError',
    });
  });

  it('getRequestContext returns null (not a throw) when no owner resolves', async () => {
    const auth = new DesktopProfileAccessContext(() => null);
    expect(await auth.getRequestContext()).toBeNull();
  });
});
