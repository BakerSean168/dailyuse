/**
 * createGoalModule — explicit composition root for the goal server runtime.
 * createGoalModule —— 目标模块服务端运行时的显式组合根。
 *
 * The outer app selects concrete adapters and passes them in here.
 * This module then assembles the application layer exactly once and exposes a
 * stable facade to HTTP / IPC transports.
 *
 * 外层应用负责选择具体适配器并传入这里。
 * 组合根只做一次组装，然后向 HTTP / IPC 等传输层暴露稳定门面。
 *
 * Goal uses the governance module as reference pattern: one composition root per
 * module, constructor injection only, no hidden service locator.
 * 目标模块以 governance 模块为参考模式：每个模块只有一个组合根，
 * 只使用构造函数注入，不使用隐藏的服务定位器。
 */

import type {
  IGoalRepository,
  IGoalFolderRepository,
  IGoalRecordRepository,
} from '../domain-server';
import { GoalPolicy } from '../domain-server';
import {
  CreateGoal,
  GetGoal,
  ListGoals,
  UpdateGoal,
  DeleteGoal,
  ArchiveGoal,
  ArchiveExpiredGoals,
  ActivateGoal,
  CompleteGoal,
  SearchGoals,
  ListGoalFolders,
  CreateGoalFolder,
  GetGoalFolder,
  UpdateGoalFolder,
  DeleteGoalFolder,
  AddGoalKeyResult,
  UpdateGoalKeyResult,
  UpdateGoalKeyResultProgress,
  DeleteGoalKeyResult,
  AddGoalReview,
  ListGoalReviews,
  UpdateGoalReview,
  DeleteGoalReview,
  CreateGoalRecord,
  ListGoalRecords,
  DeleteGoalRecord,
  PermanentlyDeleteGoal,
} from '../application-server';
import type { Result } from '@dailyuse/contracts/result';
import type {
  CreateGoalReq,
  CreateGoalRes,
  UpdateGoalReq,
  UpdateGoalRes,
  DeleteGoalRes,
  GetGoalRes,
  ListGoalsQuery,
  QueryGoalsRes,
  GoalClientDTO,
  GoalReviewClientDTO,
  KeyResultClientDTO,
  GoalFolderClientDTO,
  GoalRecordClientDTO,
  ListGoalFoldersQuery,
  QueryGoalFoldersRes,
  CreateGoalFolderReq,
  UpdateGoalFolderReq,
  UpdateGoalFolderRes,
  GoalServerDTO,
} from '@dailyuse/contracts/goal';
import type { Context } from '@dailyuse/contracts/shared';
import type { IdentityId } from '@dailyuse/domain-shared';
import type {
  ListGoalRecordsParams,
  ListGoalRecordsResult,
} from '../application-server/use-cases/queries/list-goal-records';
import type { ListGoalReviewsResult } from '../application-server/use-cases/queries/list-goal-reviews';

// ---------------------------------------------------------------------------
// Dependencies — everything the goal server runtime needs from the outside.
// 依赖 — 目标模块服务端运行时向外部索取的全部依赖。
//
// Refactor rule (same as governance):
// - only put ports or runtime contributions here
// - never put transport objects (Express req/res, ipcMain, Router) here
// - never hide these dependencies behind a singleton container
// ---------------------------------------------------------------------------

export type GoalRuntimeContributionsInput =
  | GoalModuleRuntimeContribution
  | readonly GoalModuleRuntimeContribution[];

export interface GoalModuleDependencies {
  readonly goalRepository: IGoalRepository;
  readonly goalFolderRepository: IGoalFolderRepository;
  readonly goalRecordRepository: IGoalRecordRepository;
  readonly runtimeContributions?: GoalRuntimeContributionsInput;
}

/**
 * Module-owned runtime side effects.
 * 模块拥有的运行时副作用。
 *
 * A contribution is the unit we start/stop together with the module instance.
 * This is the replacement for older global initialization hooks.
 * 贡献是我们与模块实例一起启动/停止的单元。
 * 这是旧的全局初始化钩子的替代品。
 */
export interface GoalModuleRuntimeContribution {
  start(): void;
  stop(): void;
}

// ---------------------------------------------------------------------------
// Use Cases — lower-level assembled use case collection.
// 用例 — 已完成接线的底层 use case 集合。
//
// We keep this type because tests and low-level assembly sometimes need direct
// access to use-case objects, but transports should prefer `GoalApplicationPort`.
// 保留此类型供测试和底层组装直接使用，传输层应优先使用 `GoalApplicationPort`。
// ---------------------------------------------------------------------------

export interface GoalModuleUseCases {
  // Goal CRUD / 目标增删改查
  readonly createGoal: CreateGoal;
  readonly getGoal: GetGoal;
  readonly listGoals: ListGoals;
  readonly updateGoal: UpdateGoal;
  readonly deleteGoal: DeleteGoal;
  readonly permanentlyDeleteGoal: PermanentlyDeleteGoal;
  readonly archiveGoal: ArchiveGoal;
  readonly archiveExpiredGoals: ArchiveExpiredGoals;
  readonly activateGoal: ActivateGoal;
  readonly completeGoal: CompleteGoal;
  readonly searchGoals: SearchGoals;

  // Folder CRUD / 文件夹增删改查
  readonly listGoalFolders: ListGoalFolders;
  readonly createGoalFolder: CreateGoalFolder;
  readonly getGoalFolder: GetGoalFolder;
  readonly updateGoalFolder: UpdateGoalFolder;
  readonly deleteGoalFolder: DeleteGoalFolder;

  // Key Result / 关键结果
  readonly addKeyResult: AddGoalKeyResult;
  readonly updateKeyResult: UpdateGoalKeyResult;
  readonly updateKeyResultProgress: UpdateGoalKeyResultProgress;
  readonly deleteKeyResult: DeleteGoalKeyResult;

  // Review / 复盘
  readonly addReview: AddGoalReview;
  readonly listReviews: ListGoalReviews;
  readonly updateReview: UpdateGoalReview;
  readonly deleteReview: DeleteGoalReview;

  // Record / 进度记录
  readonly createRecord: CreateGoalRecord;
  readonly listRecords: ListGoalRecords;
  readonly deleteRecord: DeleteGoalRecord;
}

// ---------------------------------------------------------------------------
// Application Port — transport-neutral callable application surface.
// 应用端口 — 传输层无关的可调用应用层门面。
//
// This is the type that HTTP / Electron / IPC transports should consume.
// It mirrors the use case execute signatures but decouples transports from
// use-case class instances, exactly as governance's GovernanceApplicationPort.
// 这是 HTTP / Electron / IPC 传输层应使用的类型。
// 它镜像用例的 execute 签名，但将传输层与用例类实例解耦，
// 与治理模块的 GovernanceApplicationPort 完全一致。
// ---------------------------------------------------------------------------

/** Transport-neutral callable application surface. 传输层无关的可调用应用层门面。 */
export interface GoalApplicationPort {
  // Goal CRUD / 目标增删改查
  createGoal(input: CreateGoalReq, context: Context): Promise<Result<CreateGoalRes>>;
  getGoal(id: string, includeChildren?: boolean): Promise<Result<GetGoalRes>>;
  listGoals(input: ListGoalsQuery): Promise<Result<QueryGoalsRes>>;
  updateGoal(id: string, input: UpdateGoalReq): Promise<Result<UpdateGoalRes>>;
  deleteGoal(id: string): Promise<Result<DeleteGoalRes>>;
  permanentlyDeleteGoal(id: string): Promise<Result<{ id: string }>>;
  archiveGoal(id: string): Promise<Result<GoalClientDTO>>;
  archiveExpiredGoals(identityId: string): Promise<Result<{ archivedCount: number }>>;
  activateGoal(id: string): Promise<Result<GoalClientDTO>>;
  completeGoal(id: string): Promise<{ goal: GoalServerDTO }>;
  searchGoals(
    identityId: string,
    query: string,
    systemView?: string,
  ): Promise<Result<QueryGoalsRes>>;

  // Folder CRUD / 文件夹增删改查
  listGoalFolders(input: ListGoalFoldersQuery): Promise<QueryGoalFoldersRes>;
  createGoalFolder(
    identityId: IdentityId,
    input: CreateGoalFolderReq,
  ): Promise<GoalFolderClientDTO>;
  getGoalFolder(id: string): Promise<GoalFolderClientDTO | null>;
  updateGoalFolder(
    id: string,
    identityId: string,
    input: UpdateGoalFolderReq,
  ): Promise<UpdateGoalFolderRes>;
  deleteGoalFolder(id: string, identityId: string): Promise<void>;

  // Key Result / 关键结果
  addKeyResult(
    goalId: string,
    keyResult: {
      title: string;
      valueType: string;
      aggregationMethod?: string;
      startValue?: number;
      targetValue: number;
      currentValue?: number;
      unit?: string;
      weight: number;
    },
  ): Promise<Result<KeyResultClientDTO>>;
  updateKeyResult(
    goalId: string,
    keyResultId: string,
    updates: {
      title?: string;
      description?: string;
      weight?: number;
      startValue?: number;
      currentValue?: number;
      targetValue?: number;
      unit?: string;
    },
  ): Promise<Result<KeyResultClientDTO>>;
  updateKeyResultProgress(
    goalId: string,
    keyResultId: string,
    currentValue: number,
    note?: string,
  ): Promise<Result<KeyResultClientDTO>>;
  deleteKeyResult(goalId: string, keyResultId: string): Promise<Result<void>>;

  // Review / 复盘
  addReview(
    goalId: string,
    params: {
      title: string;
      content: string;
      reviewType: string;
      rating?: number;
      achievements?: string;
      challenges?: string;
      nextActions?: string;
    },
  ): Promise<Result<GoalReviewClientDTO>>;
  listReviews(goalId: string): Promise<Result<ListGoalReviewsResult>>;
  updateReview(
    goalId: string,
    reviewId: string,
    params: {
      title?: string;
      content?: string;
      rating?: number | null;
      achievements?: string | null;
      challenges?: string | null;
      nextActions?: string | null;
    },
  ): Promise<Result<GoalReviewClientDTO>>;
  deleteReview(goalId: string, reviewId: string): Promise<Result<void>>;

  // Record / 进度记录
  createRecord(
    goalId: string,
    keyResultId: string,
    params: { value: number; note?: string },
    identityId: string,
  ): Promise<Result<GoalRecordClientDTO>>;
  listRecords(params: ListGoalRecordsParams): Promise<Result<ListGoalRecordsResult>>;
  deleteRecord(recordId: string): Promise<Result<void>>;
}

/**
 * Primary goal composition root return type.
 * 目标模块主组合根返回类型。
 *
 * `api` is the transport-facing surface.
 * `api` 是面向传输层的门面。
 * `useCases` is kept for low-level tests and diagnostics.
 * `useCases` 保留供底层测试和诊断使用。
 * `start` / `dispose` own runtime side effects (event subscriptions, etc.).
 * `start` / `dispose` 负责运行时副作用（事件订阅等）。
 */
export interface GoalModuleInstance {
  readonly goalRepository: IGoalRepository;
  readonly goalFolderRepository: IGoalFolderRepository;
  readonly goalRecordRepository: IGoalRecordRepository;
  readonly useCases: GoalModuleUseCases;
  readonly api: GoalApplicationPort;
  start(): void;
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Pure assembly helper — can be used by tests directly.
// 纯组装函数 — 可以直接被测试使用。
// ---------------------------------------------------------------------------

export function createGoalUseCases(deps: GoalModuleDependencies): GoalModuleUseCases {
  const { goalRepository, goalFolderRepository, goalRecordRepository } = deps;

  const goalPolicy = new GoalPolicy();

  return {
    // Goal CRUD / 目标增删改查
    createGoal: new CreateGoal(goalRepository, goalPolicy),
    getGoal: new GetGoal(goalRepository),
    listGoals: new ListGoals(goalRepository),
    updateGoal: new UpdateGoal(goalRepository, goalPolicy),
    deleteGoal: new DeleteGoal(goalRepository, goalPolicy),
    permanentlyDeleteGoal: new PermanentlyDeleteGoal(goalRepository, goalPolicy),
    archiveGoal: new ArchiveGoal(goalRepository, goalPolicy),
    archiveExpiredGoals: new ArchiveExpiredGoals(goalRepository),
    activateGoal: new ActivateGoal(goalRepository, goalPolicy),
    completeGoal: new CompleteGoal(goalRepository, goalPolicy),
    searchGoals: new SearchGoals(goalRepository),

    // Folder CRUD / 文件夹增删改查
    listGoalFolders: new ListGoalFolders(goalFolderRepository),
    createGoalFolder: new CreateGoalFolder(goalFolderRepository),
    getGoalFolder: new GetGoalFolder(goalFolderRepository),
    updateGoalFolder: new UpdateGoalFolder(goalFolderRepository),
    deleteGoalFolder: new DeleteGoalFolder(goalFolderRepository),

    // Key Result / 关键结果
    addKeyResult: new AddGoalKeyResult(goalRepository, goalPolicy),
    updateKeyResult: new UpdateGoalKeyResult(goalRepository, goalPolicy),
    updateKeyResultProgress: new UpdateGoalKeyResultProgress(goalRepository, goalPolicy),
    deleteKeyResult: new DeleteGoalKeyResult(goalRepository, goalPolicy),

    // Review / 复盘
    addReview: new AddGoalReview(goalRepository, goalPolicy),
    listReviews: new ListGoalReviews(goalRepository),
    updateReview: new UpdateGoalReview(goalRepository, goalPolicy),
    deleteReview: new DeleteGoalReview(goalRepository, goalPolicy),

    // Record / 进度记录
    createRecord: new CreateGoalRecord(goalRepository, goalRecordRepository),
    listRecords: new ListGoalRecords(goalRecordRepository, goalRepository),
    deleteRecord: new DeleteGoalRecord(goalRecordRepository),
  };
}

// ---------------------------------------------------------------------------
// Runtime contribution normalization helper.
// 运行时贡献规范化辅助函数。
// ---------------------------------------------------------------------------

function normalizeRuntimeContributions(
  input?: GoalModuleRuntimeContribution | ReadonlyArray<GoalModuleRuntimeContribution>,
): readonly GoalModuleRuntimeContribution[] {
  if (!input) return [];
  if (Array.isArray(input)) return Array.from(input);
  return [input as GoalModuleRuntimeContribution];
}

// ---------------------------------------------------------------------------
// Canonical composition root.
// 规范化的目标模块主组合根。
//
// Reading order (same as governance):
// 1. define `Dependencies`
// 2. define transport-neutral `ApplicationPort`
// 3. assemble use cases once
// 4. wrap them in `api`
// 5. let the module instance own `start` / `dispose`
// ---------------------------------------------------------------------------

export function createGoalModule(deps: GoalModuleDependencies): GoalModuleInstance {
  const { goalRepository, goalFolderRepository, goalRecordRepository } = deps;
  const runtimeContributions = normalizeRuntimeContributions(deps.runtimeContributions);
  const useCases = createGoalUseCases(deps);
  let started = false;

  const api: GoalApplicationPort = {
    // Goal CRUD / 目标增删改查
    createGoal: (input, context) => useCases.createGoal.execute(input, context),
    getGoal: (id, includeChildren) => useCases.getGoal.execute(id, includeChildren),
    listGoals: (input) => useCases.listGoals.execute(input),
    updateGoal: (id, input) => useCases.updateGoal.execute(id, input),
    deleteGoal: (id) => useCases.deleteGoal.execute(id),
    permanentlyDeleteGoal: (id) => useCases.permanentlyDeleteGoal.execute(id),
    archiveGoal: (id) => useCases.archiveGoal.execute(id),
    archiveExpiredGoals: (identityId) => useCases.archiveExpiredGoals.execute(identityId),
    activateGoal: (id) => useCases.activateGoal.execute(id),
    completeGoal: (id) => useCases.completeGoal.execute(id),
    searchGoals: (identityId, query, systemView) =>
      useCases.searchGoals.execute(identityId, query, systemView as any),

    // Folder CRUD / 文件夹增删改查
    listGoalFolders: (input) => useCases.listGoalFolders.execute(input),
    createGoalFolder: (identityId, input) => useCases.createGoalFolder.execute(identityId, input),
    getGoalFolder: (id) => useCases.getGoalFolder.execute(id),
    updateGoalFolder: (id, identityId, input) =>
      useCases.updateGoalFolder.execute(id, identityId, input),
    deleteGoalFolder: (id, identityId) => useCases.deleteGoalFolder.execute(id, identityId),

    // Key Result / 关键结果
    addKeyResult: (goalId, keyResult) => useCases.addKeyResult.execute(goalId, keyResult),
    updateKeyResult: (goalId, keyResultId, updates) =>
      useCases.updateKeyResult.execute(goalId, keyResultId, updates),
    updateKeyResultProgress: (goalId, keyResultId, currentValue, note) =>
      useCases.updateKeyResultProgress.execute(goalId, keyResultId, currentValue, note),
    deleteKeyResult: (goalId, keyResultId) => useCases.deleteKeyResult.execute(goalId, keyResultId),

    // Review / 复盘
    addReview: (goalId, params) => useCases.addReview.execute(goalId, params),
    listReviews: (goalId) => useCases.listReviews.execute(goalId),
    updateReview: (goalId, reviewId, params) =>
      useCases.updateReview.execute(goalId, reviewId, params),
    deleteReview: (goalId, reviewId) => useCases.deleteReview.execute(goalId, reviewId),

    // Record / 进度记录
    createRecord: (goalId, keyResultId, params, identityId) =>
      useCases.createRecord.execute(goalId, keyResultId, params, identityId),
    listRecords: (params) => useCases.listRecords.execute(params),
    deleteRecord: (recordId) => useCases.deleteRecord.execute(recordId),
  };

  return {
    goalRepository,
    goalFolderRepository,
    goalRecordRepository,
    useCases,
    api,

    start(): void {
      if (started) return;
      for (const runtime of runtimeContributions) {
        runtime.start();
      }
      started = true;
    },

    dispose(): void {
      if (!started) return;
      for (const runtime of [...runtimeContributions].reverse()) {
        runtime.stop();
      }
      started = false;
    },
  };
}
