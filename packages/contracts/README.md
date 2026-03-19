# @dailyuse/contracts

统一契约定义包 - 定义所有模块的类型、接口、枚举和 DTO。

## 📐 Contract Layering Architecture

每个模块采用分层结构确保关注点分离和类型复用：

### 层级定义

| 层级         | 文件夹      | 职责                                            | 导入来源             |
| ------------ | ----------- | ----------------------------------------------- | -------------------- |
| **Protocol** | `protocol/` | RPC/Event 映射表，定义事件键和请求/响应类型关联 | 从 api/ 导入         |
| **API**      | `api/`      | Zod schema、请求/响应类型定义和验证             | 独立定义             |
| **DTOs**     | `dtos/`     | 复杂/组合响应类型（聚合、组合、数据传输对象）   | 组合或引用 api/ 类型 |

### 层级依赖关系

```
protocol/ → api/ ← dtos/
 (引用)      (导出)   (组合)
```

### 模块事件键命名规范

事件键采用 **namespace:action** 格式：

- **Namespace**: 模块名称（小写）。例如：`auth`, `task`, `goal`, `notification`
- **Action**: 动作描述（kebab-case）。例如：`login`, `create-task`, `update-goal-status`
- **完整示例**：
  - `auth:login`
  - `task:create`
  - `goal:update-status`
  - `notification:send`

### 模块结构示例（以 authentication 为例）

```
src/modules/authentication/
├── protocol/
│   ├── auth-rpc-map.ts          # RPC 事件映射 (从 api/ 导入类型)
│   ├── auth-event-map.ts        # Domain 事件映射 (从 api/ 和 dtos/ 导入)
│   └── index.ts                 # 导出 rpc-map 和 event-map
├── api/
│   ├── login.ts                 # 登录相关 schema 和类型
│   ├── register.ts              # 注册相关 schema 和类型
│   ├── verify.ts                # 验证相关 schema 和类型
│   └── index.ts                 # 导出所有 API 类型
├── dtos/
│   ├── auth-response.dto.ts     # 复杂响应类型 (登录成功的聚合响应)
│   ├── auth-session.dto.ts      # Session 数据传输对象
│   └── index.ts                 # 导出所有 DTO 类型
└── index.ts                     # 模块统一导出 (protocol + api + dtos)
```

### 实现指引

1. **定义 API Schema**：在 `api/` 下用 Zod 定义请求和响应schema

   ```typescript
   // api/login.ts
   export const LoginByEmailSchema = z.object({
     email: z.string().email(),
     password: z.string(),
   });
   export type LoginByEmailReq = z.infer<typeof LoginByEmailSchema>;
   export type LoginByEmailRes = AuthResponseDTO; // 引用 DTO
   ```

2. **定义 DTOs**：在 `dtos/` 下定义复杂/组合类型

   ```typescript
   // dtos/auth-response.dto.ts
   export interface AuthResponseDTO {
     accessToken: string;
     identity: AuthIdentityDTO;
     session: AuthSessionDTO;
   }
   ```

3. **定义 RPC 映射**：在 `protocol/` 下用 API 类型构建映射

   ```typescript
   // protocol/auth-rpc-map.ts
   import type { LoginByEmailReq, LoginByEmailRes } from '../api/login';
   export type AuthRpcMap = {
     'auth:login': [LoginByEmailReq, LoginByEmailRes];
   };
   ```

4. **模块导出**：在 `index.ts` 统一导出
   ```typescript
   // src/modules/authentication/index.ts
   export * from './protocol';
   export * from './api';
   export * from './dtos';
   ```

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

| 子路径                               | 说明           |
| ------------------------------------ | -------------- |
| `@dailyuse/contracts/task`           | 任务模块契约   |
| `@dailyuse/contracts/goal`           | 目标模块契约   |
| `@dailyuse/contracts/reminder`       | 提醒模块契约   |
| `@dailyuse/contracts/editor`         | 编辑器模块契约 |
| `@dailyuse/contracts/repository`     | 仓库模块契约   |
| `@dailyuse/contracts/account`        | 账户模块契约   |
| `@dailyuse/contracts/authentication` | 认证模块契约   |
| `@dailyuse/contracts/schedule`       | 调度模块契约   |
| `@dailyuse/contracts/setting`        | 设置模块契约   |
| `@dailyuse/contracts/notification`   | 通知模块契约   |
| `@dailyuse/contracts/ai`             | AI 模块契约    |
| `@dailyuse/contracts/dashboard`      | 仪表盘模块契约 |
| `@dailyuse/contracts/response`       | API 响应类型   |
| `@dailyuse/contracts/shared`         | 共享基础类型   |

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
