# 需要修改的 Prisma Model 详细清单

## 需要改 DateTime 的 Model 汇总

### ⚠️ 需要修改的模型（按优先级排序）

#### 第一批：时间戳混乱最严重（8个模型，18个字段）

```
1. focusMode
   - startTime: BigInt → DateTime
   - endTime: BigInt → DateTime
   - actualEndTime: BigInt? → DateTime?
   - createdAt: BigInt → DateTime
   - updatedAt: BigInt → DateTime

2. repository
   - createdAt: BigInt → DateTime
   - updatedAt: BigInt → DateTime

3. folder
   - createdAt: BigInt → DateTime
   - updatedAt: BigInt → DateTime

4. resource
   - createdAt: BigInt → DateTime
   - updatedAt: BigInt → DateTime
   - modifiedAt: BigInt? → DateTime?

5. document
   - createdAt: Int → DateTime
   - updatedAt: Int → DateTime
   - deletedAt: Int? → DateTime?

6. document_version
   - createdAt: Int → DateTime

7. document_link
   - createdAt: Int → DateTime
   - updatedAt: Int → DateTime

8. schedule
   - startTime: BigInt → DateTime
   - endTime: BigInt → DateTime
```

#### 第二批：部分时间戳字段混乱（5个模型，8个字段）

```
9. reminderTemplate
   - lastAnalysisTime: BigInt? → DateTime?
   - adjustmentTime: BigInt? → DateTime?

10. reminderResponse
    - timestamp: BigInt → DateTime

11. keyResultWeightSnapshot
    - snapshotTime: BigInt → DateTime

12. taskTemplate
    - startDate: BigInt? → DateTime?
    - dueDate: BigInt? → DateTime?
    - completedAt: BigInt? → DateTime?

13. taskInstance
    - instanceDate: DateTime ✅ (保持)
```

#### 第三批：已正确但需确认（40+个模型）

```
✅ 以下模型已使用 DateTime，保持不变：
- account (createdAt, updatedAt, lastActiveAt?, deletedAt?)
- appConfig (createdAt, updatedAt)
- authCredential (createdAt, updatedAt, expiresAt?, lastUsedAt?, revokedAt?)
- authSession (createdAt, updatedAt, lastAccessedAt, revokedAt?)
- editorWorkspaceSessionGroupTab (createdAt, updatedAt)
- editorWorkspaceSessionGroup (createdAt, updatedAt)
- editorWorkspaceSession (createdAt, updatedAt)
- editorWorkspace (createdAt, updatedAt, accessedAt)
- focusSession (createdAt, updatedAt, startedAt?, pausedAt?, resumedAt?, completedAt?, cancelledAt?)
- goalFolder (createdAt, updatedAt, deletedAt?)
- goalRecord (recordedAt, createdAt)
- goalReview (createdAt, updatedAt)
- goalStatistic (lastCalculatedAt, createdAt, updatedAt)
- goal (startDate?, targetDate?, completedAt?, archivedAt?, createdAt, updatedAt, deletedAt?)
- keyResult (createdAt, updatedAt)
- linkedContent (publishedAt?, lastCheckedAt?, cachedAt?, createdAt, updatedAt)
- notificationChannel (无时间字段)
- notificationHistory (createdAt)
- notificationPreference (createdAt, updatedAt)
- notificationTemplate (createdAt, updatedAt)
- notification (readAt?, sentAt?, expiresAt?, createdAt, updatedAt, deletedAt?)
- reminderGroup (createdAt, updatedAt, deletedAt?)
- reminderHistory (triggeredAt, createdAt)
- reminderInstance (triggerAt, createdAt, updatedAt)
- reminderStatistic (calculatedAt)
- repositoryExplorer (lastScanAt?, createdAt, updatedAt)
- repositoryResource (createdAt, updatedAt, modifiedAt?)
- repositoryStatistic (lastUpdatedAt, createdAt)
- resourceReference (createdAt, updatedAt, lastVerifiedAt?)
- scheduleExecution (executionTime, createdAt)
- scheduleStatistic (lastUpdatedAt, createdAt)
- scheduleTask (startDate?, endDate?, nextRunAt?, lastRunAt?, createdAt, updatedAt)
- settingGroup (createdAt, updatedAt)
- settingItem (createdAt, updatedAt)
- setting (createdAt, updatedAt, deletedAt?)
- taskDependency (createdAt, updatedAt)
- taskStatistic (calculatedAt)
- taskTemplateHistory (createdAt)
- userSetting (createdAt, updatedAt)
- aiConversation (createdAt, updatedAt, deletedAt?, lastMessageAt?)
- aiMessage (createdAt)
- aiGenerationTask (需查看详细定义)
- aiUsageQuota (需查看详细定义)
- aiProviderConfig (需查看详细定义)
```

---

## 修改顺序建议

### Phase 1: 核心模型（5个，影响最大）
1. `repository` → 很多其他模型依赖
2. `resource` → Epic 10 核心
3. `document` → 文档管理核心
4. `goal` + `taskTemplate` → 任务系统核心

### Phase 2: 时间逻辑相关（3个）
5. `schedule` + `focusMode` → 日程和专注模块
6. `reminderTemplate` + `reminderResponse` → 提醒系统

### Phase 3: 支持字段（1个）
7. 其他小模型的 BigInt/Int 时间字段

---

## 需要修改的 DTO 文件位置（预计）

```
packages/infrastructure-server/src/
├── modules/
│   ├── account/dtos/
│   │   └── account.persistence.dto.ts
│   ├── auth/dtos/
│   │   ├── auth-credential.persistence.dto.ts
│   │   └── auth-session.persistence.dto.ts
│   ├── document/dtos/
│   │   ├── document.persistence.dto.ts
│   │   ├── document-version.persistence.dto.ts
│   │   └── document-link.persistence.dto.ts
│   ├── goal/dtos/
│   │   ├── goal.persistence.dto.ts
│   │   ├── goal-folder.persistence.dto.ts
│   │   ├── goal-record.persistence.dto.ts
│   │   ├── goal-review.persistence.dto.ts
│   │   └── goal-statistic.persistence.dto.ts
│   ├── task/dtos/
│   │   ├── task-template.persistence.dto.ts
│   │   ├── task-instance.persistence.dto.ts
│   │   ├── task-dependency.persistence.dto.ts
│   │   └── task-statistic.persistence.dto.ts
│   ├── reminder/dtos/
│   │   ├── reminder-template.persistence.dto.ts
│   │   ├── reminder-instance.persistence.dto.ts
│   │   ├── reminder-response.persistence.dto.ts
│   │   ├── reminder-history.persistence.dto.ts
│   │   └── reminder-statistic.persistence.dto.ts
│   ├── schedule/dtos/
│   │   ├── schedule.persistence.dto.ts
│   │   ├── schedule-task.persistence.dto.ts
│   │   └── schedule-execution.persistence.dto.ts
│   ├── repository/dtos/
│   │   ├── repository.persistence.dto.ts
│   │   ├── repository-resource.persistence.dto.ts
│   │   ├── folder.persistence.dto.ts
│   │   └── resource.persistence.dto.ts
│   ├── editor/dtos/
│   │   ├── editor-workspace.persistence.dto.ts
│   │   ├── editor-workspace-session.persistence.dto.ts
│   │   └── editor-workspace-session-group.persistence.dto.ts
│   ├── focus/dtos/
│   │   ├── focus-mode.persistence.dto.ts
│   │   └── focus-session.persistence.dto.ts
│   ├── notification/dtos/
│   │   └── notification.persistence.dto.ts
│   ├── ai/dtos/
│   │   ├── ai-conversation.persistence.dto.ts
│   │   ├── ai-generation-task.persistence.dto.ts
│   │   ├── ai-usage-quota.persistence.dto.ts
│   │   └── ai-provider-config.persistence.dto.ts
│   └── ... 其他模块
├── shared/dtos/
│   └── common.persistence.dto.ts
└── common/dtos/
    └── base.persistence.dto.ts
```

---

## 执行时间估算

| 任务 | 文件数 | 行数 | 时间 |
|------|-------|------|------|
| 修改 Prisma Schema | 1 | 13 | 30 min |
| 创建 TimestampUtil | 1 | 50 | 20 min |
| 更新 DTO 文件 | 35-50 | 300-500 | 2-3 hours |
| 更新 Service 逻辑 | 20-30 | 100-200 | 1-2 hours |
| 更新 API 序列化 | 3-5 | 50-100 | 30 min |
| 测试和验证 | - | - | 1-2 hours |
| **总计** | **60-90** | **500-1000** | **5-9 hours** |

---

## 验证检查清单

```
[ ] Schema 文件通过 prisma validate
[ ] 没有 type 错误 (tsc --noEmit)
[ ] 所有 DateTime 字段在 DTO 中为 Date 类型
[ ] 没有手动 getTime() / new Date(bigint) 调用
[ ] API 返回格式正确（ISO 8601 或时间戳）
[ ] 时区转换逻辑工作正常
[ ] 单元测试通过
[ ] 集成测试通过
[ ] 关键接口能正常返回数据
```

---

**生成日期**: 2026-01-25  
**预计完成**: 2026-01-28
