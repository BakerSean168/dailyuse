# Story 1.8: api-entry-container-refactor

Status: ready-for-dev

## Story

As a 后端架构师，
I want 重构 apps/api/src/app.ts 和路由配置，使其成为纯粹的组装入口，
so that API 应用只负责 wiring 与启动，所有业务逻辑已完全迁移至 packages。

## Acceptance Criteria

1. apps/api/src/ 目录仅包含：app.ts（Express/NestJS 应用实例）、index.ts（启动入口）、controllers/（纯控制器）、routes/（路由定义）、middleware/（中间件）、container.ts（DI 容器）。
2. apps/api/src/modules/ 中的所有 domain/application/infrastructure 目录已删除，仅保留 interface 层（controllers/routes）。
3. 所有依赖通过 DI 容器注入或直接从 packages 导入（@dailyuse/domain-server、@dailyuse/application-server、@dailyuse/infrastructure-server）。
4. API 启动正常，所有端点可用，集成测试通过。
5. apps/api 代码行数相比重构前减少 70%+。

## Tasks / Subtasks

- [ ] 检查 apps/api/src/modules/ 确保所有 domain/application/infrastructure 已完全迁移（通过前序故事 1.1-1.7），仅保留 interface 层。
- [ ] 重构 apps/api/src/container.ts：集中组装所有 repositories、use cases、services 的依赖注入，从 packages 导入具体实现。
- [ ] 重构 apps/api/src/app.ts：移除内嵌的业务逻辑，仅保留路由注册、中间件配置、错误处理等框架级代码。
- [ ] 整理 apps/api/src/routes/：确保所有路由引用 controllers，controllers 依赖注入自 container。
- [ ] 删除 apps/api/src/modules/*/domain|application|infrastructure 废弃目录；简化目录结构（可选：controllers 平铺或按模块分组）。
- [ ] 运行 API 启动测试与端点集成测试；统计代码行数验证减少 70%+ 目标。

## Dev Notes

### Previous Story Context

**依赖的完成状态：**
- 故事 1.1-1.3：Task 模块三层迁移 ✓
- 故事 1.4：Schedule 模块完整迁移 ✓
- 故事 1.5：Goal 模块完整迁移 ✓
- 故事 1.6：Authentication 模块迁移（含安全层）✓
- 故事 1.7：剩余 10 个模块批量迁移 ✓

**此故事的前提：**
所有业务逻辑已在 packages 中，apps/api 仅剩框架集成代码。

### Technical Requirements

- **目标结构：**
  ```
  apps/api/src/
  ├── app.ts                  # 应用实例（Express/NestJS）
  ├── index.ts                # 启动入口
  ├── container.ts            # DI 容器（组装 packages）
  ├── controllers/            # 纯控制器（调用 use cases）
  ├── routes/                 # 路由定义
  ├── middleware/             # 中间件（auth guards 等）
  └── config/                 # 环境配置
  ```

- **删除：**
  ```
  apps/api/src/modules/*/domain/
  apps/api/src/modules/*/application/
  apps/api/src/modules/*/infrastructure/
  ```

- **命名规范：** 保持 kebab-case 文件名，named exports。

### Architecture Compliance

**DI 容器模式（apps/api/src/container.ts）：**
```typescript
import { PrismaClient } from '@prisma/client';
import { 
  PrismaTaskRepository,
  PrismaScheduleRepository,
  PrismaGoalRepository,
  // ... 其他 repositories
} from '@dailyuse/infrastructure-server';
import {
  CreateTaskUseCase,
  CreateScheduleUseCase,
  // ... 其他 use cases
} from '@dailyuse/application-server';

export interface APIContainer {
  // Repositories
  taskRepository: TaskRepository;
  scheduleRepository: ScheduleRepository;
  // ... 其他

  // Use Cases
  createTaskUseCase: CreateTaskUseCase;
  createScheduleUseCase: CreateScheduleUseCase;
  // ... 其他
}

export function createAPIContainer(): APIContainer {
  const prisma = new PrismaClient();
  
  // Infrastructure 层实例化
  const taskRepository = new PrismaTaskRepository(prisma);
  const scheduleRepository = new PrismaScheduleRepository(prisma);
  
  // Application 层实例化（注入 repositories）
  const createTaskUseCase = new CreateTaskUseCase(taskRepository);
  const createScheduleUseCase = new CreateScheduleUseCase(scheduleRepository);
  
  return {
    taskRepository,
    scheduleRepository,
    createTaskUseCase,
    createScheduleUseCase,
    // ... 其他
  };
}
```

**Controller 模式：**
```typescript
// apps/api/src/controllers/task.controller.ts
import { CreateTaskUseCase } from '@dailyuse/application-server';
import { CreateTaskDTO } from '@dailyuse/contracts';

export class TaskController {
  constructor(private createTaskUseCase: CreateTaskUseCase) {}
  
  async createTask(req, res) {
    const dto: CreateTaskDTO = req.body;
    const result = await this.createTaskUseCase.execute(dto);
    res.json({ ok: true, data: result });
  }
}
```

**App 集成（apps/api/src/app.ts）：**
```typescript
import express from 'express';
import { createAPIContainer } from './container';
import { setupRoutes } from './routes';

const app = express();
const container = createAPIContainer();

app.use(express.json());
setupRoutes(app, container);

export { app };
```

### Library & Framework Requirements

- **框架：** Express 或 NestJS（保持当前框架）
- **DI：** 手动 DI 或 NestJS IoC（如适用）
- **Validation：** class-validator（DTO 验证在 controller 层）
- **Error Handling：** 统一错误处理中间件

### File Structure Requirements

保持简洁的 apps/api 结构，所有 controllers 依赖 container 注入的 use cases。

### Testing Requirements

- **启动测试：** API 应用能成功启动并监听端口。
- **端点集成测试：** 所有主要路由（task/schedule/goal/auth 等）可正常调用并返回预期结果。
- **健康检查：** /health 端点正常。
- **错误处理测试：** 验证 404、500 等错误响应正确。
- **代码行数统计：** 使用工具（如 cloc）统计重构前后对比，验证减少 70%+。

### References

- [docs/PRD-Codebase-Refactor.md](docs/PRD-Codebase-Refactor.md) - 纯容器化目标
- [docs/architecture/package-implementation-guide.md](docs/architecture/package-implementation-guide.md) - L5 Apps 层规范
- [docs/architecture/adr/ADR-016-apps-as-containers.md](docs/architecture/adr/ADR-016-apps-as-containers.md) - 应用容器决策记录
- [1-7-remaining-api-modules-batch-extraction.md](1-7-remaining-api-modules-batch-extraction.md) - 批量迁移完成参考

## Dev Agent Record

### Agent Model Used

_待填充_

### Debug Log References

_待填充_

### Completion Notes List

_待填充_

### File List

**预期修改文件：**
- apps/api/src/app.ts（简化为框架集成）
- apps/api/src/index.ts（启动入口）
- apps/api/src/container.ts（DI 容器重构）
- apps/api/src/controllers/**/*.ts（更新 import）
- apps/api/src/routes/**/*.ts（更新路由注册）

**预期删除：**
- apps/api/src/modules/*/domain/
- apps/api/src/modules/*/application/
- apps/api/src/modules/*/infrastructure/
- 任何残留的业务逻辑文件

**预期保留：**
- apps/api/src/controllers/（纯控制器）
- apps/api/src/routes/（路由定义）
- apps/api/src/middleware/（中间件）
- apps/api/src/config/（配置）
