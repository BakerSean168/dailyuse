/**
 * Mock data factory for goal module stories.
 */
import type {
  GoalClientDTO,
  KeyResultClientDTO,
  GoalRecordClientDTO,
  GoalReviewClientDTO,
} from '@dailyuse/contracts/goal';

const now = Date.now();
const DAY = 86400000;

export function createMockKeyResult(
  overrides: Partial<KeyResultClientDTO> = {},
): KeyResultClientDTO {
  return {
    id: 'kr-1',
    title: '每日完成3道算法题',
    description: '在 LeetCode 上完成中等难度以上题目',
    progress: {
      valueType: 'Number',
      aggregationMethod: 'SUM',
      initialValue: 0,
      targetValue: 90,
      currentValue: 45,
      unit: '题',
    },
    weight: 40,
    order: 0,
    version: 1,
    createdAt: now - 30 * DAY,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  } as unknown as KeyResultClientDTO;
}

export function createMockKeyResults(): KeyResultClientDTO[] {
  return [
    createMockKeyResult(),
    createMockKeyResult({
      id: 'kr-2',
      title: '阅读3本技术书籍',
      description: '深入学习设计模式和系统架构',
      progress: {
        valueType: 'Number',
        aggregationMethod: 'SUM',
        initialValue: 0,
        targetValue: 3,
        currentValue: 2,
        unit: '本',
      } as any,
      weight: 30,
      order: 1,
    }),
    createMockKeyResult({
      id: 'kr-3',
      title: '完成2个开源项目贡献',
      description: null,
      progress: {
        valueType: 'Number',
        aggregationMethod: 'SUM',
        initialValue: 0,
        targetValue: 2,
        currentValue: 0,
        unit: '个',
      } as any,
      weight: 30,
      order: 2,
    }),
  ];
}

export function createMockGoal(overrides: Partial<GoalClientDTO> = {}): GoalClientDTO {
  return {
    id: 'goal-1',
    identityId: 'user-1',
    name: '提升编程能力',
    description: '通过系统学习和实践提升编程水平',
    color: '#4CAF50',
    feasibilityAnalysis: '每天投入2小时学习，配合实际项目练习，预计3个月可以达到目标。',
    motivation: '编程能力是核心竞争力，提升后可以更高效地完成工作任务。',
    status: 'Active',
    importance: 'Important',
    priority: 80,
    category: '个人成长',
    tags: ['编程', '学习'],
    startDate: now - 30 * DAY,
    targetDate: now + 60 * DAY,
    completedAt: null,
    archivedAt: null,
    folderId: null,
    parentGoalId: null,
    sortOrder: 0,
    reminderConfig: null,
    createdAt: now - 30 * DAY,
    updatedAt: now,
    deletedAt: null,
    version: 1,
    keyResults: createMockKeyResults(),
    reviews: [],
    ...overrides,
  } as unknown as GoalClientDTO;
}

export function createMockGoals(): GoalClientDTO[] {
  return [
    createMockGoal(),
    createMockGoal({
      id: 'goal-2',
      name: '健康管理',
      description: '保持良好的健康习惯',
      color: '#FF5722',
      feasibilityAnalysis: '通过合理的运动计划和饮食管理，逐步改善身体状况。',
      motivation: '身体是革命的本钱，健康的身体才能支撑长期的工作和生活。',
      status: 'Active',
      importance: 'Vital',
      priority: 90,
      category: '健康',
      tags: ['健康', '运动'],
      startDate: now - 15 * DAY,
      targetDate: now + 75 * DAY,
      createdAt: now - 15 * DAY,
      sortOrder: 1,
      keyResults: [
        createMockKeyResult({
          id: 'kr-4',
          title: '每周运动3次',
          progress: {
            valueType: 'Number',
            aggregationMethod: 'SUM',
            initialValue: 0,
            targetValue: 36,
            currentValue: 20,
            unit: '次',
          } as any,
          weight: 50,
        }),
        createMockKeyResult({
          id: 'kr-5',
          title: '体重降至70kg',
          progress: {
            valueType: 'Number',
            aggregationMethod: 'LAST',
            initialValue: 80,
            targetValue: 70,
            currentValue: 74,
            unit: 'kg',
          } as any,
          weight: 50,
        }),
      ],
    } as any),
    createMockGoal({
      id: 'goal-3',
      name: '完成项目重构',
      description: '将旧系统迁移到新架构',
      color: '#2196F3',
      status: 'Completed',
      importance: 'Important',
      priority: 70,
      startDate: now - 60 * DAY,
      targetDate: now - 5 * DAY,
      completedAt: now - 5 * DAY,
      sortOrder: 2,
      keyResults: [
        createMockKeyResult({
          id: 'kr-6',
          title: '迁移所有API',
          progress: {
            valueType: 'Number',
            aggregationMethod: 'SUM',
            initialValue: 0,
            targetValue: 20,
            currentValue: 20,
            unit: '个',
          } as any,
          weight: 60,
        }),
      ],
    } as any),
  ];
}

export function createMockGoalRecord(
  overrides: Partial<GoalRecordClientDTO> = {},
): GoalRecordClientDTO {
  return {
    id: 'record-1',
    keyResultId: 'kr-1',
    goalId: 'goal-1',
    value: 3,
    valueAfter: 48,
    comment: '今天完成了3道动态规划题目',
    version: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  } as unknown as GoalRecordClientDTO;
}

export function createMockRecords(): GoalRecordClientDTO[] {
  return [
    createMockGoalRecord(),
    createMockGoalRecord({
      id: 'record-2' as unknown as GoalRecordClientDTO['id'],
      value: 2,
      valueAfter: 45,
      comment: '完成了链表相关题目',
      createdAt: now - DAY,
      updatedAt: now - DAY,
    }),
    createMockGoalRecord({
      id: 'record-3' as unknown as GoalRecordClientDTO['id'],
      value: 5,
      valueAfter: 43,
      comment: null,
      createdAt: now - 2 * DAY,
      updatedAt: now - 2 * DAY,
    }),
  ];
}

export function createMockReview(
  overrides: Partial<GoalReviewClientDTO> = {},
): GoalReviewClientDTO {
  return {
    id: 'review-1',
    goalId: 'goal-1',
    type: 'Weekly',
    summary: '本周完成了15道算法题，阅读了设计模式第3章',
    achievements: '完成了树和图的相关算法专题',
    challenges: '动态规划的状态转移方程推导仍需加强',
    nextSteps: '下周集中练习DP专题',
    rating: 4,
    reviewedAt: now,
    keyResultSnapshots: [
      {
        keyResultId: 'kr-1',
        title: '每日完成3道算法题',
        currentValue: 45,
        targetValue: 90,
        progressPercentage: 50,
      },
      {
        keyResultId: 'kr-2',
        title: '阅读3本技术书籍',
        currentValue: 2,
        targetValue: 3,
        progressPercentage: 66.7,
      },
    ],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
    ...overrides,
  } as unknown as GoalReviewClientDTO;
}

/** Linear-style GoalCard 专用的 mock（带 statusText/overallProgress 等派生属性） */
export function createLinearGoalCard(overrides: Record<string, any> = {}) {
  return {
    id: 'goal-1',
    title: '提升编程能力',
    statusText: '进行中',
    status: 'ACTIVE',
    color: '#4CAF50',
    overallProgress: 65,
    keyResultCount: 3,
    completedKeyResultCount: 1,
    daysRemaining: 30,
    team: 'Engineering',
    owner: { name: 'Zhang Wei' },
    ...overrides,
  };
}
