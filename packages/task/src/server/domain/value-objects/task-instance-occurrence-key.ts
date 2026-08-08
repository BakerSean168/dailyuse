/**
 * TaskInstance occurrence key（R2-1 / P0-03）
 *
 * 确定性幂等键：`{templateId}:{localDate}`。同一模板同一天最多一个实例，
 * 数据库层加 `@@unique([templateId, occurrenceKey])` 唯一约束，杜绝
 * 并发/双宿主重复生成。
 *
 * 说明：key 基于本地时区日期（startOfLocalDay 语义），不使用 UTC 日期，
 * 避免 DST/跨时区把同一天拆成两天。
 */

export function startOfLocalDay(value: number): number {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** 本地时区 YYYY-MM-DD（非 UTC）。 */
export function toLocalDateKey(dayStartMs: number): string {
  const d = new Date(dayStartMs);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildTaskInstanceOccurrenceKey(
  templateId: string,
  instanceDate: number,
): string {
  return `${templateId}:${toLocalDateKey(startOfLocalDay(instanceDate))}`;
}
