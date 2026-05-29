/**
 * Electron IPC auth wrapper for the governance module.
 * 治理模块的 Electron IPC 鉴权包装器。
 *
 * Keeps renderer-call authentication and unexpected error normalization at the
 * Electron seam so downstream handlers can stay transport-neutral.
 * 将渲染进程调用鉴权与意外错误归一化收敛在 Electron seam，
 * 使下游处理器保持传输层无关。
 */
import { createAuthenticatedIpcWrapper } from '@dailyuse/contracts/electron';

export const withAuthenticatedValue = createAuthenticatedIpcWrapper({
  unexpectedErrorCode: 'INTERNAL_ERROR',
  unexpectedErrorMessage: 'Governance IPC failed',
});
