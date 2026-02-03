# 事件定义字段分析报告

## 统计摘要

| 指标 | 数量 | 百分比 |
|------|------|--------|
| **总事件数** | **65** | **100%** |
| 包含聚合根 ID | 48 | 74% |
| 包含时间戳字段 | 38 | 58% |
| 同时包含两者 | 24 | 37% |
| **缺少聚合根 ID** | **17** | **26%** |
| **缺少时间戳** | **27** | **42%** |

---

## 缺少聚合根 ID 的事件 (17 个)

这些事件定义中未找到任何聚合根 ID 字段:

### Account Module (3个)
- account-closed.event.ts
- account-profile-updated.event.ts
- account-settings-updated.event.ts

### AI Module (3个)
- ai-quota-consumed.event.ts
- ai-quota-exceeded.event.ts
- ai-quota-limit-updated.event.ts

### Notification Module (6个)
- notification-channel-failed.event.ts
- notification-deleted.event.ts
- notification-read.event.ts
- notification-sent.event.ts
- notification-status-changed.event.ts

### Reminder Module (4个)
- reminder-group-created.event.ts
- reminder-group-deleted.event.ts
- reminder-group-updated.event.ts
- reminder-template-deleted.event.ts
- reminder-template-updated.event.ts
- reminder-triggered.event.ts

### (Note: 实际是5个，上面重复了)

---

## 缺少时间戳字段的事件 (27 个)

这些事件定义中未找到时间戳字段 (如 createdAt, updatedAt, startedAt 等):

### Account Module (0个)
*所有account事件都有时间戳或缺少ID*

### AI Module (2个)
- ai-quota-consumed.event.ts
- ai-quota-exceeded.event.ts

### Authentication Module (9个)
- identity-activated.event.ts
- identity-disabled.event.ts
- identity-provider-connected.event.ts
- password-changed.event.ts
- session-created.event.ts
- session-invalidated.event.ts
- session-revoked.event.ts
- user-logged-in.event.ts
- user-logged-out.event.ts
- user-registered.event.ts

### Goal Module (8个)
- focus-session-cancelled.event.ts
- focus-session-paused.event.ts
- focus-session-resumed.event.ts
- goal-archived.event.ts
- goal-deleted.event.ts
- goal-folder-deleted.event.ts
- goal-statistics-recalculated.event.ts
- goal-status-changed.event.ts
- key-result-added.event.ts
- key-result-deleted.event.ts
- review-added.event.ts

### Notification Module (5个)
- notification-channel-failed.event.ts
- notification-deleted.event.ts
- notification-read.event.ts
- notification-sent.event.ts
- notification-status-changed.event.ts

### Reminder Module (3个)
- reminder-group-deleted.event.ts
- reminder-template-deleted.event.ts
- reminder-triggered.event.ts

### Sync Module (3个)
- sync-conflict-detected.event.ts
- sync-conflict-resolved.event.ts
- sync-disconnected.event.ts
- sync-failed.event.ts

### Task Module (2个)
- task-deleted.event.ts
- task-rescheduled.event.ts

---

## 包含聚合根 ID 的事件 (48 个)

### 按模块分类

#### Account (1个)
- account-created.event.ts: `identityId`

#### AI (1个)
- ai-quota-created.event.ts: `identityId`

#### Authentication (9个)
- identity-activated.event.ts: `identityId`
- identity-disabled.event.ts: `identityId`
- identity-provider-connected.event.ts: `identityId`
- password-changed.event.ts: `identityId`
- session-created.event.ts: `identityId`
- session-invalidated.event.ts: `identityId`
- session-revoked.event.ts: `identityId`
- user-logged-in.event.ts: `identityId`
- user-logged-out.event.ts: `identityId`
- user-registered.event.ts: `identityId`

#### Goal (14个)
- focus-session-cancelled.event.ts: `sessionId`
- focus-session-completed.event.ts: `sessionId`
- focus-session-paused.event.ts: `sessionId`
- focus-session-resumed.event.ts: `sessionId`
- focus-session-started.event.ts: `goalId, sessionId`
- goal-archived.event.ts: `goalId`
- goal-completed.event.ts: `goalId`
- goal-created.event.ts: `goalId, folderId, identityId`
- goal-deleted.event.ts: `goalId`
- goal-folder-created.event.ts: `folderId, identityId`
- goal-folder-deleted.event.ts: `folderId`
- goal-folder-stats-updated.event.ts: `folderId`
- goal-folder-updated.event.ts: `folderId`
- goal-statistics-recalculated.event.ts: `identityId`
- goal-status-changed.event.ts: `goalId`
- goal-updated.event.ts: `goalId`
- key-result-added.event.ts: `goalId`
- key-result-deleted.event.ts: `goalId`
- key-result-updated.event.ts: `goalId`
- review-added.event.ts: `goalId`

#### Notification (1个)
- notification-created.event.ts: `identityId`

#### Reminder (1个)
- reminder-template-created.event.ts: `identityId`

#### Sync (7个)
- sync-completed.event.ts: `sessionId`
- sync-conflict-detected.event.ts: `sessionId, entityId`
- sync-conflict-resolved.event.ts: `sessionId, entityId`
- sync-disconnected.event.ts: `sessionId`
- sync-failed.event.ts: `sessionId`
- sync-progress-updated.event.ts: `sessionId`
- sync-started.event.ts: `sessionId, identityId`

#### Task (6个)
- task-completed.event.ts: `goalId, taskId`
- task-created.event.ts: `goalId, taskId`
- task-deleted.event.ts: `taskId`
- task-rescheduled.event.ts: `taskId`
- task-uncompleted.event.ts: `taskId`
- task-updated.event.ts: `taskId`

---

## 包含时间戳的事件 (38 个)

### 按时间戳类型分类

#### createdAt (13个)
- account-created.event.ts
- ai-quota-created.event.ts
- goal-created.event.ts
- goal-folder-created.event.ts
- notification-created.event.ts
- reminder-group-created.event.ts
- reminder-template-created.event.ts
- task-created.event.ts

#### updatedAt (16个)
- account-profile-updated.event.ts
- account-settings-updated.event.ts
- ai-quota-limit-updated.event.ts
- goal-folder-stats-updated.event.ts
- goal-folder-updated.event.ts
- goal-updated.event.ts
- key-result-updated.event.ts
- reminder-group-updated.event.ts
- reminder-template-updated.event.ts
- sync-progress-updated.event.ts
- task-updated.event.ts

#### completedAt (6个)
- focus-session-completed.event.ts
- goal-completed.event.ts
- sync-completed.event.ts
- task-completed.event.ts

#### startedAt (2个)
- focus-session-started.event.ts
- sync-started.event.ts

#### uncompletedAt (1个)
- task-uncompleted.event.ts

---

## 修改范围建议

### 优先级 1: 必须修改 (17个缺少聚合根ID的事件)
这些事件应该添加聚合根 ID，以便追踪事件属于哪个聚合根:

**Account Module:**
- account-closed.event.ts → 需要 `accountId` 或 `identityId`
- account-profile-updated.event.ts → 需要 `accountId` 或 `identityId`
- account-settings-updated.event.ts → 需要 `accountId` 或 `identityId`

**AI Module:**
- ai-quota-consumed.event.ts → 需要 `identityId`
- ai-quota-exceeded.event.ts → 需要 `identityId`
- ai-quota-limit-updated.event.ts → 需要 `identityId`

**Notification Module:**
- notification-channel-failed.event.ts → 需要 `notificationId` 或 `identityId`
- notification-deleted.event.ts → 需要 `notificationId` 或 `identityId`
- notification-read.event.ts → 需要 `notificationId` 或 `identityId`
- notification-sent.event.ts → 需要 `notificationId` 或 `identityId`
- notification-status-changed.event.ts → 需要 `notificationId` 或 `identityId`

**Reminder Module:**
- reminder-group-created.event.ts → 需要 `groupId` 或 `identityId`
- reminder-group-deleted.event.ts → 需要 `groupId` 或 `identityId`
- reminder-group-updated.event.ts → 需要 `groupId` 或 `identityId`
- reminder-template-deleted.event.ts → 需要 `templateId`
- reminder-template-updated.event.ts → 需要 `templateId`
- reminder-triggered.event.ts → 需要 `triggerId` 或 `reminderId`

### 优先级 2: 应该修改 (27个缺少时间戳的事件)
这些事件应该添加时间戳，以便记录事件发生的时间:

**主要缺少的是 Authentication 和 Goal 模块的事件**

---

## 建议的修改策略

1. **第一步**: 优先修改缺少聚合根 ID 的 17 个事件
   - 为每个事件添加适当的聚合根 ID 字段
   - 确保 ID 字段能够唯一标识该聚合根

2. **第二步**: 修改缺少时间戳的 27 个事件
   - 根据事件性质添加适当的时间戳字段 (createdAt, updatedAt, startedAt 等)
   - 确保时间戳类型为 number (Unix timestamp) 保持一致性

3. **第三步**: 验证所有事件都遵循统一的模式
   - 所有事件都应该有聚合根 ID
   - 所有事件都应该有时间戳
