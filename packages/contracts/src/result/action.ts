/**
 * Action Result Types - 操作响应类型
 *
 * 专门用于 API 操作响应的轻量级类型定义
 * 解决内联类型定义分散、不可复用的问题
 *
 * 设计原则：
 * 1. 统一使用 `ok` 字段，与 Result/IpcResult/HttpResponse 保持一致
 * 2. 提供常用的操作响应类型，避免内联定义
 * 3. 支持泛型扩展，满足各种业务场景
 *
 * @example
 * ```ts
 * // ❌ 不推荐：内联定义
 * changePassword(): Promise<{ ok: boolean; message: string }>;
 * markAllAsRead(): Promise<{ ok: boolean; count: number }>;
 *
 * // ✅ 推荐：使用统一类型
 * changePassword(request: ChangePasswordRequest): Promise<ActionResult>;
 * markAllAsRead(): Promise<CountResult>;
 * ```
 *
 * @module @dailyuse/contracts/result/action
 */

// ============================================================================
// Base Action Result Types
// ============================================================================

/**
 * 基础操作结果
 *
 * 用于不需要返回数据的操作，如：
 * - 修改密码
 * - 删除操作
 * - 发送邮件
 *
 * @example
 * ```ts
 * async changePassword(request: ChangePasswordRequest): Promise<ActionResult> {
 *   // ... 业务逻辑
 *   return { ok: true, message: '密码修改成功' };
 * }
 * ```
 */
export interface ActionResult {
  /** 操作是否成功 */
  ok: boolean;
  /** 操作结果消息 */
  message?: string;
  /** 错误信息（失败时） */
  error?: string;
}

/**
 * 带数据的操作结果
 *
 * 用于需要返回额外数据的操作
 *
 * @example
 * ```ts
 * async createUser(request: CreateUserRequest): Promise<ActionResultWithData<{ id: string }>> {
 *   const id = await userService.create(request);
 *   return { ok: true, message: '用户创建成功', data: { id } };
 * }
 * ```
 */
export interface ActionResultWithData<T> extends ActionResult {
  /** 返回数据 */
  data?: T;
}

// ============================================================================
// Common Action Result Variants
// ============================================================================

/**
 * 计数操作结果
 *
 * 用于批量操作返回受影响的数量，如：
 * - 标记全部已读
 * - 批量删除
 * - 清理过期数据
 *
 * @example
 * ```ts
 * // Port 定义
 * markAllAsRead(): Promise<CountResult>;
 *
 * // 实现
 * async markAllAsRead(): Promise<CountResult> {
 *   const count = await notificationRepo.markAllAsRead(identityId);
 *   return { ok: true, count, message: `已标记 ${count} 条通知为已读` };
 * }
 * ```
 */
export interface CountResult extends ActionResult {
  /** 受影响的数量 */
  count: number;
}

/**
 * 批量操作结果（Action 版本）
 *
 * 用于批量操作需要区分成功/失败的场景
 * 注意：与 index.ts 中的泛型 BatchResult<T, E> 不同，这是简化版
 *
 * @example
 * ```ts
 * async batchDelete(ids: string[]): Promise<BatchActionResult> {
 *   const succeeded: string[] = [];
 *   const failed: BatchFailure[] = [];
 *   // ... 逐个处理
 *   return {
 *     ok: failed.length === 0,
 *     succeeded,
 *     failed,
 *     message: `成功 ${succeeded.length} 个，失败 ${failed.length} 个`
 *   };
 * }
 * ```
 */
export interface BatchActionResult extends ActionResult {
  /** 成功的 UUID 列表 */
  succeeded: string[];
  /** 失败的项及原因 */
  failed: BatchFailure[];
}

/**
 * 批量操作失败项
 */
export interface BatchFailure {
  /** 失败项的 UUID */
  id: string;
  /** 失败原因 */
  error: string;
}

/**
 * 删除操作结果
 *
 * @example
 * ```ts
 * async deleteNotification(id: string): Promise<DeleteResult> {
 *   const deleted = await repo.delete(id);
 *   return { ok: deleted, message: deleted ? '删除成功' : '未找到记录' };
 * }
 * ```
 */
export interface DeleteResult extends ActionResult {
  /** 是否实际删除了记录（区分未找到和删除成功） */
  deleted?: boolean;
}

/**
 * 验证操作结果
 *
 * 用于连接测试、凭证验证等场景
 *
 * @example
 * ```ts
 * async testConnection(config: ConnectionConfig): Promise<ValidationResult> {
 *   const startTime = Date.now();
 *   try {
 *     await client.ping();
 *     return {
 *       ok: true,
 *       valid: true,
 *       message: '连接成功',
 *       latencyMs: Date.now() - startTime
 *     };
 *   } catch (e) {
 *     return { ok: false, valid: false, error: e.message };
 *   }
 * }
 * ```
 */
export interface ValidationResult extends ActionResult {
  /** 验证是否通过 */
  valid: boolean;
  /** 响应延迟（毫秒） */
  latencyMs?: number;
}

/**
 * 同步操作结果
 *
 * 用于数据同步场景
 */
export interface SyncResult extends ActionResult {
  /** 同步的记录数 */
  synced: number;
  /** 跳过的记录数 */
  skipped: number;
  /** 冲突数 */
  conflicts: number;
}

/**
 * 导入/导出操作结果
 */
export interface ImportExportResult extends ActionResult {
  /** 文件路径 */
  filePath?: string;
  /** 文件大小（字节） */
  fileSize?: number;
  /** 各实体类型的记录数 */
  statistics: Record<string, number>;
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * 创建成功的操作结果
 *
 * @example
 * ```ts
 * return actionOk('密码修改成功');
 * return actionOk('删除成功', { deleted: true });
 * ```
 */
export function actionOk<T extends ActionResult = ActionResult>(
  message?: string,
  extra?: Omit<T, 'ok' | 'message'>,
): T {
  return {
    ok: true,
    message,
    ...extra,
  } as T;
}

/**
 * 创建失败的操作结果
 *
 * @example
 * ```ts
 * return actionFail('密码不正确');
 * return actionFail('删除失败', { count: 0 });
 * ```
 */
export function actionFail<T extends ActionResult = ActionResult>(
  error: string,
  extra?: Omit<T, 'ok' | 'error'>,
): T {
  return {
    ok: false,
    error,
    ...extra,
  } as T;
}

/**
 * 创建计数结果
 *
 * @example
 * ```ts
 * return countResult(5, '已标记 5 条通知为已读');
 * return countResult(0, '没有需要处理的记录');
 * ```
 */
export function countResult(count: number, message?: string): CountResult {
  return {
    ok: true,
    count,
    message: message ?? `操作成功，共 ${count} 条记录`,
  };
}

/**
 * 创建批量操作结果
 */
export function batchActionResult(
  succeeded: string[],
  failed: BatchFailure[] = [],
  message?: string,
): BatchActionResult {
  const ok = failed.length === 0;
  return {
    ok,
    succeeded,
    failed,
    message: message ?? `成功 ${succeeded.length} 个${failed.length > 0 ? `，失败 ${failed.length} 个` : ''}`,
  };
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * 判断操作是否成功
 */
export function isActionOk<T extends ActionResult>(result: T): boolean {
  return result.ok === true;
}

/**
 * 判断操作是否失败
 */
export function isActionFail<T extends ActionResult>(result: T): boolean {
  return result.ok === false;
}
