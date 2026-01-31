/**
 * 同步方向
 */
export const SyncDirection = {
  Push: 'Push',
  Pull: 'Pull',
  Bidirectional: 'Bidirectional',
} as const;

export type SyncDirection = (typeof SyncDirection)[keyof typeof SyncDirection];
