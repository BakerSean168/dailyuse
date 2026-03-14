/**
 * Shared mapper helper utilities for persistence adapters.
 * 持久化适配器的共享映射器辅助工具。
 *
 * Centralizes defensive parsing logic used across both Prisma and PowerSync mappers.
 * 集中了 Prisma 和 PowerSync 映射器共用的防御性解析逻辑。
 *
 * @internal Infrastructure implementation detail — not part of the public API.
 * @internal 基础设施实现细节 — 非公开 API。
 */

// ---------------------------------------------------------------------------
// Error helpers. 错误辅助函数。
// ---------------------------------------------------------------------------

/**
 * Extracts a human-readable message from an unknown caught value.
 * 从未知的捕获值中提取人类可读的错误消息。
 *
 * Safely handles Error instances, strings, and arbitrary objects.
 * 安全处理 Error 实例、字符串和任意对象。
 */
export function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return String(err);
}

/**
 * Appends the original error cause to a repository error message.
 * 将原始错误原因附加到仓储错误消息中。
 *
 * Produces messages like: "Failed to save rule [cause: connection refused]"
 * 生成如："Failed to save rule [cause: connection refused]" 的消息。
 */
export function withCause(message: string, err: unknown): string {
  return `${message} [cause: ${extractErrorMessage(err)}]`;
}

// ---------------------------------------------------------------------------
// Date helpers. 日期辅助函数。
// ---------------------------------------------------------------------------

/**
 * Safely restores a Date from a database field (strict mode — throws on invalid).
 * 从数据库字段安全还原 Date（严格模式 — 无效时抛异常）。
 *
 * Used by Prisma mappers where DateTime is expected to always be valid.
 * 用于 Prisma 映射器，DateTime 预期总是有效的。
 */
export function fromDbDate(value: Date | string): Date {
  if (value instanceof Date) return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) throw new Error(`Invalid date from DB: ${String(value)}`);
  return d;
}

/**
 * Safely parses a date string, falling back to current date on failure.
 * 安全解析日期字符串，解析失败时回退到当前日期。
 *
 * Used by PowerSync mappers where all fields come as strings from SQLite.
 * 用于 PowerSync 映射器，SQLite 的所有字段以字符串形式返回。
 */
export function toDate(value: string | null | undefined): Date {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

// ---------------------------------------------------------------------------
// JSON parsing helpers. JSON 解析辅助函数。
// ---------------------------------------------------------------------------

/**
 * Safely deserializes a JSON string with a typed fallback.
 * 安全反序列化 JSON 字符串，带类型化回退值。
 *
 * Used for SQLite TEXT columns that store JSON (tags, examples, etc.).
 * 用于存储 JSON 的 SQLite TEXT 列（标签、示例等）。
 */
export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/**
 * Safely parses a JSON string as a string array, returning [] on failure.
 * 安全地将 JSON 字符串解析为字符串数组，失败时返回空数组。
 *
 * Filters out non-string elements defensively.
 * 防御性地过滤非字符串元素。
 */
export function parseStringArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

/**
 * Safely parses a JSON string as an object record, returning {} on failure.
 * 安全地将 JSON 字符串解析为对象记录，失败时返回空对象。
 *
 * Defends against null, non-object, and array values.
 * 防御 null、非对象和数组值。
 */
export function parseRecord(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}
