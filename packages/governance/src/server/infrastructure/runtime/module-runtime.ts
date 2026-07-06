/**
 * Governance runtime lifecycle adapter seam.
 * Governance 运行时生命周期适配器 seam。
 *
 * Module-owned side effects are modeled as explicit start/stop adapters so the
 * composition root can own them without inventing a fifth server layer.
 *
 * 模块自有副作用统一建模为显式 start/stop 适配器，
 * 由组合根拥有其生命周期，不再额外发明第五层 server seam。
 */

export interface GovernanceRuntimeAdapter {
  start(): void;
  stop(): void;
}

export type GovernanceRuntimeAdaptersInput =
  | GovernanceRuntimeAdapter
  | readonly GovernanceRuntimeAdapter[];