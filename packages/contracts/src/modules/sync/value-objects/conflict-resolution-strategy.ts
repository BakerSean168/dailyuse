/**
 * 冲突解决策略
 */
export const ConflictResolutionStrategy = {
  LocalWins: 'LocalWins',
  RemoteWins: 'RemoteWins',
  LatestWins: 'LatestWins',
  VectorClock: 'VectorClock',
  Manual: 'Manual',
} as const;

export type ConflictResolutionStrategy = (typeof ConflictResolutionStrategy)[keyof typeof ConflictResolutionStrategy];
