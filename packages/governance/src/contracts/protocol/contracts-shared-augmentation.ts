/**
 * Governance augmentation for the shared app protocol registry.
 * 治理模块对共享应用协议注册表的增强。
 *
 * Governance keeps its protocol files inside the feature package, but it still
 * participates in the global typed event/RPC bus through this augmentation seam.
 * governance 的协议文件仍保留在 feature 包内，
 * 但会通过这个 augmentation seam 参与全局类型化 event/RPC 总线。
 */

import type { AppEventRegistryExtensions, AppRpcRegistryExtensions } from '@dailyuse/contracts/shared';
import type { GovernanceEventMap } from './governance-event-map';
import type { GovernanceRpcMap } from './governance-rpc-map';

declare module '@dailyuse/contracts/shared' {
  interface AppEventRegistryExtensions extends GovernanceEventMap {}
  interface AppRpcRegistryExtensions extends GovernanceRpcMap {}
}

export type GovernanceSharedEventRegistryExtension = AppEventRegistryExtensions;
export type GovernanceSharedRpcRegistryExtension = AppRpcRegistryExtensions;
