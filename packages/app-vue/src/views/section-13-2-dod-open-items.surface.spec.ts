import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 891: honest §13.2 completion-definition open-items re-audit.
 * Residual 1327: P0 real E2E/runtime blocker reduction after Residual 1326 tip refresh
 * (Web password 2x3/3, Desktop production Electron guest 2x1/1, Agent/Vault/Pi fixture 7/114,
 * governance 4/23 + GOV_EXIT:0)
 * while 12-project lint has 8 failures, web:typecheck remains red, and OAuth/App fixture
 * credentials remain externally blocked;
 * Residual 1328: the same 12-project lint set is 12/12 green and formal web:typecheck
 * plus 24 dependencies passes; focused regressions are 8 files/160 tests and governance
 * remains green, while test-utils lint still has 2 pre-existing layer-boundary errors and
 * the full workspace/E2E/prod-like/OAuth bundle remains incomplete;
 * Residual 1329: test-utils lint is 0 errors, test-utils typecheck + 4 dependencies,
 * goal lint, integration seams 3/12, AI Service 4/25, open-items 1/3, and governance
 * 4/23 + governance-check pass; after fixing 7 Ruff I001 errors the full workspace
 * lint is 36/36 green, while the remaining typecheck/test/E2E/prod-like/OAuth bundle
 * is still incomplete;
 * Residual 1330: full workspace typecheck contracts from 8 failures to 34/34 EXIT:0;
 * utils recurrence 1/4, schedule-orchestration 4/7, and governance-check pass, while
 * full workspace test/Web/Desktop E2E/prod-like/OAuth remain incomplete/external;
 * Residual 1331: full workspace standard test 30 targets from 11 failures to 3 failures /
 * 27 pass EXIT:1; desktop low-risk harness closed (ipc dual→contracts, vault-path
 * path.resolve, AIStreamChannels allowlist, provider list envelope; focused 6/58);
 * Residual 1332: full workspace standard test 30/30 EXIT:0 (powersync goal_records bind,
 * desktop GIT_CONFIG_GLOBAL=NUL, app-vue TaskService/useRoute/LangGraph stub/icon a11y);
 * Residual 1333: VPS prod-like docker:local:up EXIT:0 + six services healthy + probes OK
 * Residual 1334: tip re-verify workspace lint 36/36 + typecheck 34/34 + standard test 30/30 EXIT:0,
 * governance GOV_EXIT:0, Web auth e2e 14/14, Desktop guest xvfb 1/1, ADR-035 multi-engine 45,
 * live-github 1/1; still no checkbox flips (interactive OAuth / durable multi-engine / full E2E+prod-like);
 * Residual 1335: skip interactive OAuth by decision; e2e LOG_DIR fix; business E2E 24/24 +
 * goal-workflow+note 10/10 after app-shell wait; Dockerfile.api contracts dist; still 12/15;
 * Residual 1336: default Playwright testMatch web:e2e 71/71 EXIT:0; still 12/15 (Desktop E2E /
 * interactive OAuth / durable multi-engine open);
 * Residual 1337: remote shell 8/8 + desktop:e2e 1/1 + ai-workspace 8/8 + sync 3/3; still 12/15;
 * (tip 140ce022a); Web auth mainline 2×9/9 + note-boundary 1/1; workspace lint 36/36 +
 * typecheck 34/34 + standard test 30/30 re-verified; governance-check GOV_EXIT:0;
 * historical plan note still records goal-workflow 8/8 red; follow-up green is goal-workflow
 * 8/8 after Host SSE mock + conversation list persistence (not a full PR gate);
 * Desktop Linux guest e2e fixed via safeStorage basic_text on Linux E2E (1/1 under xvfb);
 * GitHub App JWT wired; historical installations_count=0 then browser install → installation
 * 148867606 + desktop:test:live-github 1/1 green (App installation-token path, not PAT);
 * interactive browser OAuth login consent + full Web/Desktop E2E bundle remain incomplete/external;
 * Residual 1338: Windows residual handoff — desktop:e2e 1/1 EXIT:0 (password+guest);
 * interactive real GitHub OAuth blocked (GITHUB_OAUTH_CLIENT_SECRET absent; e2e-mock not counted);
 * ADR-035 multi-engine focused 4 files / 33 tests (no Agent checkbox flip); Docker Desktop
 * unavailable → reuse remote 1333/1335 prod-like; still 12/15; PR readiness no;
 * Residual 1339: push-A attempt — web:e2e:oauth-real host-dev real provider harness +
 * createRealOAuthApiServer + readWebAuthSessionIdentity; ADR-035 6 files / 51 tests;
 * docker:local:up npipe EOF; still no CLIENT_SECRET consent session; still 12/15; PR readiness no;
 * Residual 1340: web:e2e:oauth-real 1/1 real GitHub consent hasOAuth; flip §13.2 entry item;
 * still 13/15 (Agent + full gate open); PR readiness no;
 * Residual 1341: prod-like six services healthy + probes 200; governance GOV_EXIT:0;
 * desktop:e2e 1/1; flip gate item; still 14/15 (Agent only); PR readiness no;
 * reaffirms loadWorkspaceEnv + toast-only + parseJson family +
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

  it('keeps exactly one unchecked §13.2 item after residual 1341 gate flip', () => {
    expect(plan).toContain('Residual 891');
    expect(plan).toContain('残留八百九十一轮');
    expect(plan).toContain('Residual 1327');
    expect(plan).toContain('Residual 1328');
    expect(plan).toContain('Residual 1329');
    expect(plan).toContain('Residual 1330');
    expect(plan).toContain('Residual 1331');
    expect(plan).toContain('Residual 1332');
    expect(plan).toContain('Residual 1333');
    expect(plan).toContain('Residual 1334');
    expect(plan).toContain('残留一千三百三十三轮');
    expect(plan).toContain('残留一千三百三十四轮');
    expect(plan).toContain('Residual 1335');
    expect(plan).toContain('残留一千三百三十五轮');
    expect(plan).toContain('Residual 1336');
    expect(plan).toContain('残留一千三百三十六轮');
    expect(plan).toContain('Residual 1337');
    expect(plan).toContain('残留一千三百三十七轮');
    expect(plan).toContain('Residual 1338');
    expect(plan).toContain('残留一千三百三十八轮');
    expect(plan).toContain('Residual 1339');
    expect(plan).toContain('残留一千三百三十九轮');
    expect(plan).toContain('Residual 1340');
    expect(plan).toContain('残留一千三百四十轮');
    expect(plan).toContain('Residual 1341');
    expect(plan).toContain('残留一千三百四十一轮');
    expect(plan).toContain('残留一千二百一十八轮');
    const sec = section132();
    const unchecked = sec.match(/- \[ \]/g) ?? [];
    const checked = sec.match(/- \[x\]/g) ?? [];
    expect(unchecked).toHaveLength(1);
    expect(checked.length).toBeGreaterThanOrEqual(14);

    expect(sec).toContain('- [x] 账密、GitHub 和访客入口均可用。 **（已证明）**');
    expect(sec).toContain(
      '- [ ] Agent 上下文不能逃逸 Vault、执行代码、扩大授权或绕过用户确认。 **（部分实现）**',
    );
    expect(sec).toContain(
      '- [x] 相关 lint、typecheck、test、Web/Desktop E2E、governance 和 prod-like 验收通过。 **（已证明）**',
    );
    expect(sec).not.toContain(
      '- [ ] 账密、GitHub 和访客入口均可用。',
    );
    expect(sec).not.toContain(
      '- [x] Agent 上下文不能逃逸 Vault、执行代码、扩大授权或绕过用户确认。',
    );
    expect(sec).not.toContain(
      '- [ ] 相关 lint、typecheck、test、Web/Desktop E2E、governance 和 prod-like 验收通过。',
    );
  });

  it('records tip focused suite evidence without claiming full PR gate completion', () => {
    const sec = section132();
    expect(sec).toContain('403 文件 / 1766 测试');
    expect(sec).toContain('Residual 1325');
    expect(sec).toContain('Residual 1326');
    expect(sec).toContain('Residual 1327');
    expect(sec).toContain('Residual 1328');
    expect(sec).toContain('Residual 1329');
    expect(sec).toContain('Residual 1330');
    expect(sec).toContain('Residual 1331');
    expect(sec).toContain('Residual 1332');
    expect(sec).toContain('Residual 1333');
    expect(sec).toContain('Residual 1334');
    expect(sec).toContain('Residual 1335');
    expect(sec).toContain('Residual 1336');
    expect(sec).toContain('Residual 1337');
    expect(sec).toContain('Residual 1338');
    expect(sec).toContain('Residual 1339');
    expect(sec).toContain('Residual 1340');
    expect(sec).toContain('Residual 1341');
    expect(sec).toContain('Web 账密两轮 3/3');



    expect(sec).toContain('Desktop production Electron guest 两轮 1/1');
    expect(sec).toContain('Agent/Vault/Pi fixture 7/114');
    expect(sec).toContain('governance 4/23 + GOV_EXIT:0');
    expect(sec).toContain('web:typecheck');
    expect(sec).toContain('12-project lint 集合仍有 8 个失败');
    expect(sec).toContain('12-project lint 集合');
    expect(sec).toContain('12/12 通过');
    expect(sec).toContain('focused 回归 **8 文件 / 160 测试**');
    expect(sec).toContain('@dailyuse/test-utils:lint');
    expect(sec).toContain('2 个既有 layer-boundary error');
    expect(sec).toContain('24 个依赖任务通过');
    expect(sec).toContain('全 workspace lint **36/36 项目通过**');
    expect(sec).toContain('integration seam focused **3 文件 / 12 测试**');
    expect(sec).toContain('AI Service **4 文件 / 25 测试**');
    expect(sec).toContain('open-items **1 文件 / 3 测试**');
    expect(sec).toContain('全 workspace typecheck');
    expect(sec).toContain('**34/34 项目通过（EXIT:0）**');
    expect(sec).toContain('utils recurrence **1 文件 / 4 测试**');
    expect(sec).toContain('schedule-orchestration **4 文件 / 7 测试**');
    expect(sec).toContain('全 workspace 标准 test 目标 **30**');
    expect(sec).toContain('**3 失败 / 27 通过（EXIT:1）**');
    expect(sec).toContain('desktop 低风险 harness 已收口');
    expect(sec).toContain('**30/30 项目通过（EXIT:0）**');
    expect(sec).toContain('这只证明 lint + typecheck + **标准 test** 门禁已绿');
    expect(sec).toContain('OAuth/App fixture 无凭据为外部阻塞');
    expect(sec).toContain('docker:local:up');
    expect(sec).toContain('六服务 healthy');
    expect(sec).toContain('Web 认证主线两轮 **9/9**');
    expect(sec).toContain('note-boundary **1/1**');
    expect(sec).toContain('goal-workflow 8/8 红');
    expect(sec).toContain('GOV_EXIT:0');
    expect(sec).toContain('不改 checkbox');
    expect(sec).toContain('三入口完整 E2E');
    expect(sec).toContain('Agent multi-engine');
    expect(sec).toContain('全量 PR 门禁');
    // Residual 1333 closure: App install + live-github proven; three open items keep handoffs.
    expect(sec).toContain('installations_count=1');
    expect(sec).toContain('148867606');
    expect(sec).toContain('desktop:test:live-github');
    expect(sec).toContain('残留 1333 收口 handoff（仍不打勾）');
    expect(sec).toContain('残留 1334 handoff（仍不打勾）');
    expect(sec).toContain('残留 1335 handoff（仍不打勾）');
    expect(sec).toContain('明确延后');
    expect(sec).toContain('业务 E2E 子集 **24/24**');
    expect(sec).toContain('goal-workflow+note **10/10**');
    expect(sec).toContain('waitForAuthenticatedShell');
    expect(sec).toContain('残留 1336 handoff（仍不打勾）');
    expect(sec).toContain('web:e2e` 71/71');
    expect(sec).toContain('残留一千三百三十六轮');
    expect(sec).toContain('71 passed');
    expect(sec).toContain('残留 1337 handoff（仍不打勾）');
    expect(sec).toContain('web:e2e:shell');
    expect(sec).toContain('web:e2e:sync');
    expect(sec).toContain('残留一千三百三十七轮');
    expect(sec).toContain('残留 1338 handoff（仍不打勾）');
    expect(sec).toContain('残留一千三百三十八轮');
    expect(sec).toContain('残留 1339 handoff（仍不打勾');
    expect(sec).toContain('残留一千三百三十九轮');
    expect(sec).toContain('残留一千三百四十轮');
    expect(sec).toContain('残留一千三百四十一轮');
    expect(sec).toContain('web:e2e:oauth-real');
    expect(sec).toContain('createRealOAuthApiServer');
    expect(sec).toContain('hasOAuth');
    expect(sec).toContain('14 [x] / 1 [ ]');
    expect(sec).toContain('六服务');
    expect(sec).toContain('healthy');
    expect(sec).toContain('desktop:e2e');
    expect(sec).toContain('**1/1 EXIT:0**');
    expect(sec).toContain('Docker Desktop');
    expect(sec).toContain('claimsFullProductE2E');
    expect(sec).toContain('ensureE2EAccount');




    expect(sec).toContain('残留一千三百三十四轮');
    expect(sec).toContain('Web auth **14/14**');
    expect(sec).toContain('Desktop guest xvfb **1/1**');
    expect(sec).toContain('ADR-035 multi-engine');
    expect(sec).toContain('**5 文件 / 45 测试**');
    expect(sec).toContain('标准 test **30/30 EXIT:0**');
    expect(sec).toContain('PR readiness **no**');

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
    expect(sec).toContain('ScheduleFormDemo datetime-local→formatDateToYMD+formatLocalHHmm dual-retired');
    expect(sec).toContain('padTwoDigits multi-sole compose dual-retired');
    expect(sec).toContain('toLocalDateKey→padTwoDigits dual-retired');
    expect(sec).toContain('formatScheduleDurationMinutes dual-retired 不强制');
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
    expect(sec).not.toContain('focused evidence suite tip（Residual 1319）：**401 文件 / 1756 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1322）：**402 文件 / 1761 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1316）：**400 文件 / 1751 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1313）：**399 文件 / 1746 测试**');
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
    expect(section132()).toContain('账密、GitHub 和访客入口均可用。 **（已证明）**');
    expect(section132()).toContain('web:e2e:oauth-real');
  });
});
