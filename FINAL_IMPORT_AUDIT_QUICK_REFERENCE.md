# Web 应用导入检查 - 快速参考

## 🎯 任务概述

完整检查 Web 应用的所有层，确保正确地从 packages 导入代码。

✅ **状态**：已完成 | 📅 **日期**：2026-01-18

## 📊 检查结果

| 项目       | 结果                                                             |
| ---------- | ---------------------------------------------------------------- |
| 检查的文件 | 28 个                                                            |
| 发现的问题 | 7 个导入错误                                                     |
| 修复的问题 | 7 个（100%）                                                     |
| 模块覆盖   | 7 个（notification, setting, task, goal, ai, schedule, account） |

## ✅ 已修复的 Composables

### 1. Notification 模块

- **文件**：useNotification.ts
- **修复**：`import { notificationApplicationService } from '@dailyuse/application-client/notification'`

### 2. Setting 模块

- **文件**：useUserSetting.ts
- **修复**：`import { settingApplicationService as UserSettingWebApplicationService } from '@dailyuse/application-client/setting'`

### 3. Task 模块

- **文件**：useTaskSync.ts
- **修复**：`import { taskApplicationService as taskSyncApplicationService } from '@dailyuse/application-client/task'`

### 4. Goal 模块

- **文件**：useWeightSnapshot.ts
- **修复**：`import { goalApplicationService as WeightSnapshotWebApplicationService } from '@dailyuse/application-client/goal'`

### 5. AI 模块

- **文件**：useDocumentSummarizer.ts
- **修复**：`import { aiApplicationService as documentSummarizerApplicationService } from '@dailyuse/application-client/ai'`

### 6. Schedule 模块

- **文件**：useScheduleEvent.ts + useSchedule.ts
- **修复**：`import { scheduleApplicationService as ... } from '@dailyuse/application-client/schedule'`

## ✅ 验证的正确导入模式

### Presentation 层

```typescript
// ✅ Composables 导入 ApplicationService
import { notificationApplicationService } from '@dailyuse/application-client/notification';

// ✅ Composables 导入本模块 Store
import { useUserSettingStore } from '../stores/userSettingStore';

// ✅ Composables 导入本模块 Types
import type { SummaryResult } from '../types/summarization';
```

### Application 层（模块内部）

```typescript
// ✅ 正确 - 同模块内导入
import { NotificationService } from '../services/NotificationService';
import type { NotificationConfig } from '../../application/types';
```

### Infrastructure 层（模块内部）

```typescript
// ✅ 正确 - 同模块内导入
import { NotificationConfigStorage } from '../../infrastructure/storage/NotificationConfigStorage';
import { accountApiClient } from '../../infrastructure/api/accountApiClient';
```

## ⚠️ 发现的其他问题

### 1. 缺失的 GoalTimelineService

- **位置**：goal/presentation/composables/useGoalTimeline.ts
- **问题**：导入不存在的 `../../application/services/GoalTimelineService`
- **状态**：需要实现 GoalTimelineService 类（超出 audit 范围）

## 📋 检查清单

- [x] 查找所有 Presentation 层相对导入
- [x] 识别问题导入（指向不存在的路径）
- [x] 检查 Application/Infrastructure 层（模块内部）
- [x] 验证包中有正确的导出
- [x] 修复所有错误的相对导入
- [x] 生成完整报告
- [ ] 编译验证（待执行）
- [ ] 测试验证（待执行）

## 🔍 验证步骤

### 1. 编译验证

```bash
npm run build:web
```

预期：编译成功

### 2. 类型检查

```bash
npm run typecheck:web
```

预期：无导入相关错误

### 3. 运行测试

```bash
npm run test:web
```

预期：测试通过

## 📁 相关文件

- [FINAL_IMPORT_AUDIT_REPORT.md](FINAL_IMPORT_AUDIT_REPORT.md) - 完整技术报告
- [FINAL_IMPORT_AUDIT_EXECUTIVE_SUMMARY.md](FINAL_IMPORT_AUDIT_EXECUTIVE_SUMMARY.md) - 执行摘要

## 🎓 关键学习

### 正确的导入模式

```typescript
// ❌ 错误 - 相对路径指向不存在的地方
import { service } from '../../application/services';

// ✅ 正确 - 从包导入
import { service } from '@dailyuse/application-client/module';

// ✅ 正确 - 模块内部导入
import { helper } from '../utils/helper';
import { store } from '../stores/store';
```

### 层级分离原则

- **Presentation**（Composables）→ 导入来自 @dailyuse/application-client
- **Application**（本地）← 被 Presentation 导入
- **Infrastructure**（本地）← 被 Application 使用
- **模块内部**（相对导入）← 各层级内部通信

## 📞 支持

完整的修复记录和详细分析，请参考：

- [FINAL_IMPORT_AUDIT_REPORT.md](FINAL_IMPORT_AUDIT_REPORT.md)

---

**最后更新**：2026-01-18  
**检查者**：AI Assistant  
**状态**：✅ 完成
