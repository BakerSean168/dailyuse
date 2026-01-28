# @dailyuse/contracts

统一契约定义包 - 定义所有模块的类型、接口、枚举和 DTO。

## 🎨 子路径导出架构

本包采用**子路径导出**模式，支持极致的 Tree-Shaking 和模块隔离。

### 导入方式
```typescript

// ✅ 方式: 从子路径导入完整模块（推荐，极致 Tree-Shaking）
import { GoalServerDTO, GoalClientDTO } from '@dailyuse/contracts/goal';
import { TaskTemplateServer } from '@dailyuse/contracts/task';
import { AccountDTO } from '@dailyuse/contracts/account';

```

### 子路径列表

| 子路径                               | 说明                        |
| ------------------------------------ | --------------------------- |
| `@dailyuse/contracts/task`           | 任务模块契约                |
| `@dailyuse/contracts/goal`           | 目标模块契约                |
| `@dailyuse/contracts/reminder`       | 提醒模块契约                |
| `@dailyuse/contracts/editor`         | 编辑器模块契约              |
| `@dailyuse/contracts/repository`     | 仓库模块契约                |
| `@dailyuse/contracts/account`        | 账户模块契约                |
| `@dailyuse/contracts/authentication` | 认证模块契约                |
| `@dailyuse/contracts/schedule`       | 调度模块契约                |
| `@dailyuse/contracts/setting`        | 设置模块契约                |
| `@dailyuse/contracts/notification`   | 通知模块契约                |
| `@dailyuse/contracts/document`       | 文档模块契约                |
| `@dailyuse/contracts/ai`             | AI 模块契约                 |
| `@dailyuse/contracts/dashboard`      | 仪表盘模块契约              |
| `@dailyuse/contracts/response`       | API 响应类型                |
| `@dailyuse/contracts/shared`         | 共享基础类型                |

## 根入口导出内容

根入口 (`@dailyuse/contracts`) 导出以下内容：

### 响应系统

```typescript
import {
  ResponseCode,
  ResponseStatus,
  ResponseBuilder,
  createResponseBuilder,
  type ApiResponse,
  type SuccessResponse,
  type ErrorResponse,
} from '@dailyuse/contracts';
```

### 常用枚举

```typescript
import {
  // Goal
  GoalStatus,
  KeyResultValueType,
  ReviewType,
  FolderType,
  // Task
  TaskType,
  TaskTemplateStatus,
  TaskInstanceStatus,
  TimeType,
  // AI
  AIProvider,
  AIModel,
  ConversationStatus,
  // Account
  AccountStatus,
  SubscriptionPlan,
  // ...更多枚举
} from '@dailyuse/contracts';
```

## 最佳实践

### 1. 新代码使用子路径导入

```typescript
// ✅ 推荐：明确的模块边界
import { GoalServerDTO, GoalStatus } from '@dailyuse/contracts/goal';
import { TaskTemplateServer } from '@dailyuse/contracts/task';
```

### 2. 避免命名冲突时使用命名空间

```typescript
// ✅ 当多个模块有同名类型时
import * as GoalContracts from '@dailyuse/contracts/goal';
import * as TaskContracts from '@dailyuse/contracts/task';

function process(
  goal: GoalContracts.StatusDTO,  // Goal 的状态
  task: TaskContracts.StatusDTO,  // Task 的状态
) { ... }
```

### 3. 类型导入使用 `import type`

```typescript
// ✅ 确保无运行时代码
import type { GoalServerDTO } from '@dailyuse/contracts/goal';
import { GoalStatus } from '@dailyuse/contracts/goal'; // 枚举是运行时值
```

## 开发

```bash
# 构建
pnpm --filter @dailyuse/contracts build

# 监听模式
pnpm --filter @dailyuse/contracts dev
```
