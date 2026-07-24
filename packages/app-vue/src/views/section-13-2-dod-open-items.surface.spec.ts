import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 891: honest §13.2 completion-definition open-items re-audit.
 * Residual 1314: tip focused suite pointer refresh (Residual 1313 evidence tip 399/1746)
 * without checkbox flips; reaffirms loadWorkspaceEnv + toast-only + parseJson family +
 * asRecord/toRecord + toTimestamp + toNumber + toStringArray + toBoolean + optionalString/toNonEmptyString +
 * asNonEmptyString dual-retired + toDate/toDateString + extractErrorMessage dual-retired + generateUUID + newId +
 * isPlainObject + toMillis + formatFileSize + toKnowledgeNoteRef + tokenize + toDashboardTaskInstanceRecord + toPrismaJson + contracts-isRecord + startOfDay + mapImportanceToTaskPriority + readString + normalizePath + buildTaskName + comparePriority + defaultExtractContext + getTemplateById + getCorsOrigins + delay dual-retired + scoreIndexedResource dual-retired + readJson + handleAuthSuccess + formatDateTime + formatMessageTime + formatDateToInput + formatTimeRange + formatTimestamp + clampPercentage + isRecord keep-boundaries (no force-merge).
 * Residual 893 (soft): OAuthProvider transport≠domain keep-boundary is separate contracts surface.
 * Residual 1047 (soft): loadWorkspaceEnv keep-boundary surface remains locked in api package.
 * Residual 1254 (soft): prior tip refresh 379/1646 still in history notes only.
 * Does not flip any §13.2 checkbox; focused suite tip remains evidence, not full PR gate.
 */
describe('§13.2 DoD open items honest audit (residual 891)', () => {
  const plan = readFileSync(
    resolve(
      __dirname,
      '../../../../docs/plan/active/2026-07-16-obsidian-vault-repository-optimization.md',
    ),
    'utf8',
  );
  const threeLogin = readFileSync(resolve(__dirname, 'three-login-surface.matrix.spec.ts'), 'utf8');

  function section132(): string {
    const start = plan.indexOf('### 13.2');
    expect(start).toBeGreaterThanOrEqual(0);
    const end = plan.indexOf('## 14', start);
    return plan.slice(start, end > start ? end : undefined);
  }

  it('keeps exactly three unchecked §13.2 items with partial/external-block labels', () => {
    expect(plan).toContain('Residual 891');
    expect(plan).toContain('残留八百九十一轮');
    expect(plan).toContain('Residual 1314');
    expect(plan).toContain('残留一千二百一十八轮');
    const sec = section132();
    const unchecked = sec.match(/- \[ \]/g) ?? [];
    const checked = sec.match(/- \[x\]/g) ?? [];
    expect(unchecked).toHaveLength(3);
    expect(checked.length).toBeGreaterThanOrEqual(12);

    expect(sec).toContain('- [ ] 账密、GitHub 和访客入口均可用。 **（部分实现）**');
    expect(sec).toContain(
      '- [ ] Agent 上下文不能逃逸 Vault、执行代码、扩大授权或绕过用户确认。 **（部分实现）**',
    );
    expect(sec).toContain(
      '- [ ] 相关 lint、typecheck、test、Web/Desktop E2E、governance 和 prod-like 验收通过。 **（部分验证 + 外部阻塞）**',
    );
    expect(sec).not.toContain(
      '- [x] 账密、GitHub 和访客入口均可用。',
    );
    expect(sec).not.toContain(
      '- [x] Agent 上下文不能逃逸 Vault、执行代码、扩大授权或绕过用户确认。',
    );
    expect(sec).not.toContain(
      '- [x] 相关 lint、typecheck、test、Web/Desktop E2E、governance 和 prod-like 验收通过。',
    );
  });

  it('records tip focused suite evidence without claiming full PR gate completion', () => {
    const sec = section132();
    expect(sec).toContain('399 文件 / 1746 测试');
    expect(sec).toContain('Residual 1313');
    expect(sec).toContain('Residual 1314');
    expect(sec).toContain('GOV_EXIT:0');
    expect(sec).toContain('不改 checkbox');
    expect(sec).toContain('三入口完整 E2E');
    expect(sec).toContain('Agent multi-engine');
    expect(sec).toContain('全量 PR 门禁');
    expect(sec).toContain('createGoalErrorHandler');
    expect(sec).toContain('schedule route parsers keep-boundary');
    expect(sec).toContain('parseJsonLikeString');
    expect(sec).toContain('parseJsonField');
    expect(sec).toContain('asRecord/toRecord');
    expect(sec).toContain('toTimestamp');
    expect(sec).toContain('toNumber');
    expect(sec).toContain('toStringArray');
    expect(sec).toContain('toBoolean');
    expect(sec).toContain('optionalString');
    expect(sec).toContain('asNonEmptyString');
    expect(sec).toContain('toDate');
    expect(sec).toContain('extractErrorMessage');
    expect(sec).toContain('generateUUID');
    expect(sec).toContain('newId');
    expect(sec).toContain('isPlainObject');
    expect(sec).toContain('toMillis');
    expect(sec).toContain('formatFileSize');
    expect(sec).toContain('toKnowledgeNoteRef');
    expect(sec).toContain('tokenize');
    expect(sec).toContain('toDashboardTaskInstanceRecord');
    expect(sec).toContain('toPrismaJson');
    expect(sec).toContain('startOfDay');
    expect(sec).toContain('mapImportanceToTaskPriority');
    expect(sec).toContain('readString');
    expect(sec).toContain('normalizePath');
    expect(sec).toContain('buildTaskName');
    expect(sec).toContain('comparePriority');
    expect(sec).toContain('defaultExtractContext');
    expect(sec).toContain('getTemplateById');
    expect(sec).toContain('getCorsOrigins');
    expect(sec).toContain('delay dual-retired');
    expect(sec).toContain('scoreIndexedResource dual-retired');
    expect(sec).toContain('readJson');
    expect(sec).toContain('handleAuthSuccess');
    expect(sec).toContain('formatDateTime');
    expect(sec).toContain('formatMessageTime');
    expect(sec).toContain('formatDateToInput');
    expect(sec).toContain('formatTimeRange');
    expect(sec).toContain('formatTimestamp');
    expect(sec).toContain('getImportanceLabel');
    expect(sec).toContain('getStatusLabel');
    expect(sec).toContain('parseDateInput');
    expect(sec).toContain('toDateInput');
    expect(sec).toContain('toTimeInput');
    expect(sec).toContain('combineDateAndTime');
    expect(sec).toContain('parseTimestamp');
    expect(sec).toContain('formatTime、formatDate');
    expect(sec).toContain('formatDate、formatDuration');
    expect(sec).toContain('formatDuration、describeConflict');
    expect(sec).toContain('describeConflict、formatDisplayDate dual-retired');
    expect(sec).toContain('formatDisplayDate dual-retired、formatDateToYMD dual-retired');
    expect(sec).toContain('formatDateToYMD dual-retired、parseToDate dual-retired');
    expect(sec).toContain('parseToDate dual-retired、handleCalendarSelect dual-retired');
    expect(sec).toContain('handleCalendarSelect dual-retired、formatDateNotSet dual-retired');
    expect(sec).toContain('formatDateNotSet dual-retired、formatDateUnknown dual-retired');
    expect(sec).toContain('formatDateUnknown dual-retired、handleEndDateCalendarSelect dual-retired');
    expect(sec).toContain('handleEndDateCalendarSelect dual-retired、handleAbsoluteDateSelect dual-retired');
    expect(sec).toContain('handleAbsoluteDateSelect dual-retired、formatCalendarEventTimeRange dual-retired');
    expect(sec).toContain('formatCalendarEventTimeRange dual-retired、formatHour dual-retired');
    expect(sec).toContain('formatHour dual-retired、formatEventTime');
    expect(sec).toContain('formatEventTime、toLocalDateKey dual-retired');
    expect(sec).toContain('toLocalDateKey dual-retired、getWeekStart dual-retired');
    expect(sec).toContain('getWeekStart dual-retired、calendarEventBgClass dual-retired');
    expect(sec).toContain('calendarEventBgClass dual-retired、calendarEventSourceLabel dual-retired');
    expect(sec).toContain('calendarEventSourceLabel dual-retired、formatLocalHHmm dual-retired');
    expect(sec).toContain('padTwoDigits dual-retired');
    expect(sec).toContain('ScheduleFormDemo datetime-local→formatDateToYMD+formatLocalHHmm dual-retired 不强制');
    expect(sec).toContain('isRecord');
    expect(sec).not.toMatch(/全量 PR 门禁.*已证明/);
    expect(sec).not.toContain('focused evidence suite tip（Residual 1146）：**344 文件 / 1488 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1172）：**352 文件 / 1520 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1175）：**353 文件 / 1524 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1178）：**354 文件 / 1528 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1181）：**355 文件 / 1532 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1184）：**356 文件 / 1536 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1187）：**357 文件 / 1540 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1190）：**358 文件 / 1544 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1193）：**359 文件 / 1548 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1196）：**360 文件 / 1552 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1199）：**361 文件 / 1557 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1202）：**362 文件 / 1561 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1205）：**363 文件 / 1566 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1208）：**364 文件 / 1570 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1211）：**365 文件 / 1574 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1310）：**398 文件 / 1741 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1307）：**397 文件 / 1736 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1304）：**396 文件 / 1731 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1301）：**395 文件 / 1726 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1298）：**394 文件 / 1721 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1295）：**393 文件 / 1716 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1292）：**392 文件 / 1711 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1289）：**391 文件 / 1706 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1286）：**390 文件 / 1701 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1283）：**389 文件 / 1696 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1280）：**388 文件 / 1691 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1277）：**387 文件 / 1686 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1274）：**386 文件 / 1681 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1271）：**385 文件 / 1676 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1268）：**384 文件 / 1671 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1265）：**383 文件 / 1666 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1262）：**382 文件 / 1661 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1259）：**381 文件 / 1656 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1256）：**380 文件 / 1651 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1253）：**379 文件 / 1646 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1250）：**378 文件 / 1641 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1247）：**377 文件 / 1636 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1244）：**376 文件 / 1631 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1241）：**375 文件 / 1626 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1238）：**374 文件 / 1621 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1235）：**373 文件 / 1616 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1232）：**372 文件 / 1611 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1229）：**371 文件 / 1606 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1226）：**370 文件 / 1600 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1223）：**369 文件 / 1595 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1220）：**368 文件 / 1589 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1217）：**367 文件 / 1584 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1214）：**366 文件 / 1579 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1142）：**343 文件 / 1484 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1136）：**341 文件 / 1476 测试**');
  });

  it('three-login matrix remains source/fixture evidence only (not real OAuth E2E)', () => {
    expect(threeLogin).toContain('three-login');
    expect(threeLogin).toContain('not a real GitHub/OAuth E2E');
    expect(threeLogin).toContain('enterGuestMode');
    expect(threeLogin).toMatch(/GitHub OAuth/i);
    expect(section132()).toContain('账密、GitHub 和访客入口均可用。 **（部分实现）**');
  });
});
