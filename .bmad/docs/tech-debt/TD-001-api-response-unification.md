# 技术债清理 - API 响应格式统一

## 📋 概述

将所有 API 响应格式从 `success: boolean` 统一为 `ok: boolean`。

## 🎯 目标

- 统一所有响应格式使用 `ok` 字段
- 使用 `@dailyuse/contracts/result` 中的标准类型
- 消除内联类型定义

## 📊 影响范围

### Packages (已完成 ✅)

- [x] `contracts/` - 已更新
- [x] `infrastructure-client/` - 已更新  
- [x] `domain-server/` - 已更新
- [x] `utils/` - 已更新

### Apps 待修复

#### Desktop App
- [x] `apps/desktop/src/main/` - 已更新
- [x] `apps/desktop/src/renderer/` - 已更新

#### Web App (待修复)
| 文件 | 行数 | 问题 |
|------|------|------|
| `taskScheduleIntegrationService.ts` | 48,124,148,185,217,249 | 内联 `success: boolean` |
| `useTaskBatchOperations.ts` | 19 | 内联类型 |
| `notificationApiClient.ts` | 63,73,85 | 使用 `success` |
| `NotificationApplicationService.ts` | 66,85 | 使用 `success` |
| `TaskDependencyDragDropService.ts` | 21 | 内联类型 |
| `UploadStats.ts` | 19 | 内联类型 |
| `reminderScheduleIntegrationService.ts` | 74 | 内联类型 |
| `useAutoSave.ts` | 14 | 内联类型 |
| `DashboardConfigApiClient.ts` | 13 | 内联类型 |
| `useAccount.ts` | 115 | 内联类型 |

### Application Server
| 文件 | 行数 | 问题 |
|------|------|------|
| `delete-task-template.ts` | 46 | 使用 `success` |

## 🔧 修复方案

### 步骤 1: 更新 Application Server

```typescript
// 修改前
async execute(uuid: string, soft = false): Promise<{ success: boolean }>

// 修改后
import type { ActionResult } from '@dailyuse/contracts/result';
async execute(uuid: string, soft = false): Promise<ActionResult>
```

### 步骤 2: 更新 Web App 通知模块

```typescript
// 修改前
async markAllAsRead(): Promise<{ success: boolean; count: number }>

// 修改后  
import type { CountResult } from '@dailyuse/contracts/result';
async markAllAsRead(): Promise<CountResult>
```

### 步骤 3: 更新其他 Web App 服务

为每个内联类型创建或使用现有的 contracts 类型。

## ⏱️ 估算

- 预计工作量: 2-3 小时
- 风险: 低 (主要是类型重构)

## ✅ 验收标准

1. `grep -r "success: boolean" packages/` 返回 0 结果
2. `grep -r "success: boolean" apps/` 返回 0 结果 (排除文档)
3. 所有测试通过
4. `pnpm nx run-many --target=build --all` 成功
