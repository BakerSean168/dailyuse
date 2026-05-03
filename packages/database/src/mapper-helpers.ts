/**
 * Mapper Helpers — shared persistence parsing utilities.
 * 映射器辅助函数 —— 共享的持久化解析工具。
 *
 * Used by Prisma and PowerSync mappers across all modules for defensive parsing
 * of database values (dates, JSON, error messages, SQL escaping).
 *
 * 供所有模块的 Prisma 和 PowerSync 映射器使用，防御性解析数据库值（日期、JSON、错误消息、SQL 转义）。
 */

// ---------------------------------------------------------------------------
// Error helpers. 错误辅助函数。
// ---------------------------------------------------------------------------

/**
 * Extracts a human-readable message from an unknown caught value.
 * 从未知的捕获值中提取人类可读的错误消息。
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
 */
export function withCause(message: string, err: unknown): string {
  return `${message} [cause: ${extractErrorMessage(err)}]`;
}

// ---------------------------------------------------------------------------
// Date helpers. 日期辅助函数。
// ---------------------------------------------------------------------------

/**
 * Strictly restores a Date from a database field. Throws on invalid input.
 * 从数据库字段严格还原 Date。无效输入时抛出异常。
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
 * Leniently parses a date value, falling back to current date on failure.
 * 宽松解析日期值，解析失败时回退到当前日期。
 *
 * Used by PowerSync mappers where all fields come as strings from SQLite.
 * 用于 PowerSync 映射器，SQLite 的所有字段以字符串形式返回。
 */
export function toDate(value: Date | number | string | null | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Leniently parses an optional date value, returning null on failure.
 * 宽松解析可选日期值，解析失败时返回 null。
 *
 * Used for optional date fields (readAt, deletedAt, etc.).
 * 用于可选日期字段（readAt、deletedAt 等）。
 */
export function toDateOrNull(value: Date | number | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// ---------------------------------------------------------------------------
// JSON parsing helpers. JSON 解析辅助函数。
// ---------------------------------------------------------------------------

/**
 * Safely deserializes a JSON string with a typed fallback.
 * 安全反序列化 JSON 字符串，带类型化回退值。
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

// ---------------------------------------------------------------------------
// SQL helpers. SQL 辅助函数。
// ---------------------------------------------------------------------------

/**
 * Escapes special characters in a string before embedding it inside a SQL LIKE pattern.
 * 在将字符串嵌入 SQL LIKE 模式之前转义特殊字符。
 */
export function escapeSqlLike(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/"/g, '\\"');
}
