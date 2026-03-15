/**
 * Governance Module - Protocol Definitions. 治理模块 - 协议定义。
 *
 * 【规范说明：Protocol】
 * Protocol 定义模块间的通信协议，包括：
 * - EventMap：模块发出的事件
 * - RpcMap：模块处理的 RPC 请求
 */

/**
 * Governance Module - Protocol Exports
 * 规则治理模块 - 协议导出
 */

// Event Map
export type { GovernanceEventMap } from './governance-event-map';

// RPC Map
export type { GovernanceRpcMap } from './governance-rpc-map';
