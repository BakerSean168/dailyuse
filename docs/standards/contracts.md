# Contracts 包定义规范

> 所有共享类型、接口、DTO 必须在 `@dailyuse/contracts` 中集中定义，禁止在其他包中内联定义

## 📦 为什么集中在 Contracts?

- **单一真实来源** - 类型定义只有一处，避免重复和不一致
- **防止循环依赖** - contracts 作为最底层依赖，不依赖其他业务包
- **易于维护** - 修改共享类型只需改一处
- **类型安全** - 所有包都使用同一个定义，避免类型不匹配

## ✅ 应该在 Contracts 中定义

| 类型 | 示例 | 位置 |
|------|------|------|
| 业务实体 | `Task`, `Reminder`, `User` | `contracts/src/entities/` |
| API DTO | `CreateTaskRequest`, `TaskResponse` | `contracts/src/modules/{feature}/api-*` |
| 结果类型 | `ActionResult`, `CountResult` | `contracts/src/result/` |
| 枚举 | `TaskStatus`, `Priority` | `contracts/src/enums/` |
| 共享接口 | `IRepository`, `IService` | `contracts/src/interfaces/` |
| 常量 | 业务常量、错误码 | `contracts/src/constants/` |

## ❌ 禁止的做法

```typescript
// ❌ 在 application-server 中定义 DTO
// application-server/src/tasks/CreateTaskRequest.ts
export interface CreateTaskRequest {
  name: string;
  description: string;
}

// ❌ 在 domain-server 中内联定义返回类型
export interface TaskWithCount {
  tasks: Task[];
  total: number;
}

// ❌ 在 infrastructure 中定义共享类型
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}
```

## ✅ 正确的做法

```typescript
// contracts/src/modules/task/api-requests.ts
export interface CreateTaskRequest {
  name: string;
  description: string;
}

// contracts/src/result/action.ts
export interface ActionWithCountResult {
  ok: boolean;
  data?: { items: unknown[]; count: number };
  error?: ErrorInfo;
}

// contracts/src/modules/task/api-responses.ts
export interface TaskResponseDTO {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
}

// domain-server/src/task/services/TaskService.ts
import type { ActionWithCountResult } from '@dailyuse/contracts';

export class TaskService {
  async getTasks(): Promise<ActionWithCountResult> {
    // 使用 contracts 中的类型
    return {
      ok: true,
      data: {
        items: tasks,
        count: total
      }
    };
  }
}
```

## 📂 Contracts 包结构

```
packages/contracts/src/
├── entities/              # 核心业务实体
│   ├── Task.ts
│   ├── Reminder.ts
│   └── User.ts
├── modules/               # 按功能模块组织
│   ├── task/
│   │   ├── api-requests.ts
│   │   ├── api-responses.ts
│   │   └── types.ts
│   └── reminder/
├── result/                # 统一的结果类型
│   ├── action.ts
│   ├── base.ts
│   └── index.ts
├── enums/                 # 共享枚举
│   └── TaskStatus.ts
├── constants/             # 共享常量
│   ├── API_ENDPOINTS.ts
│   └── ERROR_CODES.ts
├── interfaces/            # 抽象接口
│   └── IRepository.ts
└── index.ts               # 导出所有公共 API
```

## 🔧 导入规范

```typescript
// ✅ 从 contracts 导入
import type { Task, CreateTaskRequest, TaskStatus } from '@dailyuse/contracts';
import { ActionWithDataResult } from '@dailyuse/contracts/result/action';

// ❌ 不要在其他包中重新定义
import Task from './types/Task';  // 即使名字相同

// ❌ 不要导入 contracts 内部路径（除非必要）
import type { Task } from '@dailyuse/contracts/src/entities/Task';  // 应该走 index 导出
```

## 🚀 迁移现有定义

如果发现 contracts 外有类型定义：

1. **移到 contracts** - 创建相应的文件
2. **在 contracts/src/index.ts 导出** - 确保公共 API
3. **更新导入** - 所有包改为从 contracts 导入
4. **删除旧文件** - 清理原位置的定义

## 📋 检查清单

- [ ] 新增共享类型必须在 contracts 中定义
- [ ] 检查是否有 contracts 外的内联类型定义
- [ ] 所有导入都来自 contracts
- [ ] 没有重复的类型定义
