/**
 * 依赖类型
 * 定义任务之间的依赖关系类型
 */
export const DependencyType = {
  /** 完成-开始（最常见）：Predecessor 完成后，Successor 才能开始 */
  FinishToStart: 'FinishToStart',
  /** 开始-开始：Predecessor 开始后，Successor 才能开始 */
  StartToStart: 'StartToStart',
  /** 完成-完成：Predecessor 完成后，Successor 才能完成 */
  FinishToFinish: 'FinishToFinish',
  /** 开始-完成（少见）：Predecessor 开始后，Successor 才能完成 */
  StartToFinish: 'StartToFinish',
} as const;

export type DependencyType = (typeof DependencyType)[keyof typeof DependencyType];
