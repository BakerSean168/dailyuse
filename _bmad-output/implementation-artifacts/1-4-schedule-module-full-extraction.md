# Story 1.4: schedule-module-full-extraction

Status: ready-for-dev

## Story

As a 后端架构师，
I want 将 apps/api/src/modules/schedule/ 的 domain/application/infrastructure 三层完整迁移到对应 packages，
so that Schedule 模块遵循与 Task 相同的统一拆分模式，支持多容器复用。

## Acceptance Criteria

1. schedule 模块的 domain/application/infrastructure 三个子目录中的所有文件分别迁移到 packages/domain-server/src/schedule/、packages/application-server/src/schedule/、packages/infrastructure-server/src/schedule/。
2. 所有文件名统一为 kebab-case，文件结构对齐 package-implementation-guide 的标准划分（aggregates/events/errors/repositories 等）。
3. 三个 packages 分别更新各自的 index.ts（模块级和根级），导出新的 schedule 模块。
4. apps/api/src/modules/schedule/interface/ 保留，改为从对应 packages 导入 domain/application/infrastructure 的公开 API；不再有相对路径 import。
5. 保持无循环依赖，遵守分层规则（domain 禁止依赖 infrastructure/app，application 仅依赖 domain，infrastructure 实现 domain 接口）。
6. 所有相关测试通过（domain-server schedule、application-server schedule、infrastructure-server schedule、api 集成测试）。

## Tasks / Subtasks

- [ ] 清点 apps/api/src/modules/schedule/domain/、application/、infrastructure/ 的所有文件并规划迁移：domain 到 packages/domain-server/src/schedule/；application 到 packages/application-server/src/schedule/；infrastructure 到 packages/infrastructure-server/src/schedule/。
- [ ] 三层分别执行迁移：修正 import 路径（domain 从 contracts、application 从 domain、infrastructure 从 domain 接口），文件名统一 kebab-case，实现接口无 I 前缀。
- [ ] 为 schedule 模块在三个 packages 中分别补齐 index.ts 导出，保持仅通过包别名导出公开 API；更新三个 packages 的根 index.ts。
- [ ] 更新 apps/api/src/modules/schedule/interface/controllers 对 domain/application/infrastructure 的引用为对应包别名；确保 DI 容器完整组装。
- [ ] 删除/废弃 apps/api/src/modules/schedule/domain/、application/、infrastructure/ 旧目录；运行测试（nx test domain-server、nx test application-server、nx test infrastructure-server、nx test api）。

## Dev Notes

### Previous Story Learnings (Stories 1.1-1.3)

**成功流程确认：**
- Task 模块已完成三层迁移（domain → 1.1、application → 1.2、infrastructure → 1.3）。
- **建立的模式：** 每层单独故事 → 迁移 → index.ts 导出 → 更新 import → 测试，效果良好。
- **此故事合并三层：** Schedule 作为"完整拆分"故事，演示单个故事内同时迁移三层的方式（适用于后续批量迁移）。

**关键检查点（从 Task 学到的）：**
1. Domain 层常有事件和查询对象，需确认是否已在 contracts 中定义（避免重复）。
2. Application 层的 use cases 依赖 domain 接口，务必从 domain-server 导入，不直接依赖 infrastructure。
3. Infrastructure 层要实现 domain 定义的接口（如 ScheduleRepository），确保替换性与可测试性。

**环境与工具：**
- Prisma schema：已为 schedule 表定义？如有变更需同步迁移文件。
- 测试数据库：确保集成测试能访问 schedule 测试表。

### Technical Requirements

- **目标位置：** 
  - Domain: packages/domain-server/src/schedule/（aggregates/events/errors/queries/repositories/values）
  - Application: packages/application-server/src/schedule/（usecases/services/handlers）
  - Infrastructure: packages/infrastructure-server/src/schedule/（repositories/datasources/mappers）
- **命名规范：** kebab-case 文件名；接口无 I 前缀；named exports；导出聚合通过 index.ts
- **依赖约束：**
  - Domain: 仅依赖 contracts、utils
  - Application: 依赖 domain-server、contracts、utils；可依赖 patterns（如通用 use case 基类）
  - Infrastructure: 依赖 domain-server、contracts、utils、prisma；可依赖 application（可选，如事件发送）

### Architecture Compliance

**三层拆分坐标（参考 Task 三层）：**

1. **Domain Layer** - schedule 业务规则
   ```
   packages/domain-server/src/schedule/
   ├── aggregates/              # Schedule 聚合根
   ├── events/                  # ScheduleCreated, ScheduleCompleted 等
   ├── errors/                  # ScheduleNotFoundError 等
   ├── queries/                 # FindScheduleQuery 等
   ├── repositories/
   │   └── schedule.repository.ts     # 仅接口定义
   ├── values/                  # ScheduleTimeRange 值对象
   └── index.ts
   ```

2. **Application Layer** - schedule 用例编排
   ```
   packages/application-server/src/schedule/
   ├── usecases/
   │   ├── create-schedule.usecase.ts
   │   ├── complete-schedule.usecase.ts
   │   ├── get-schedule.usecase.ts
   │   ├── list-schedules.usecase.ts
   │   └── index.ts
   ├── services/
   │   ├── schedule-application.service.ts
   │   └── index.ts
   ├── handlers/                # 事件处理（可选）
   │   ├── schedule-created.handler.ts
   │   └── index.ts
   └── index.ts
   ```

3. **Infrastructure Layer** - schedule 数据持久化与外部集成
   ```
   packages/infrastructure-server/src/schedule/
   ├── repositories/
   │   ├── prisma-schedule.repository.ts   # implements ScheduleRepository
   │   ├── mock-schedule.repository.ts
   │   └── index.ts
   ├── datasources/             # 外部 API 集成（如日历同步）
   │   ├── calendar-sync.ts
   │   └── index.ts
   ├── mappers/
   │   ├── schedule.mapper.ts            # Prisma Model ↔ Domain Entity
   │   └── index.ts
   └── index.ts
   ```

**Integration Points:**
- apps/api/src/modules/schedule/interface/ 仅保留 controllers/routes，依赖三层的公开 API。
- DI 容器（apps/api/src/container.ts）负责组装（PrismaScheduleRepository 注入 use cases）。

### Library & Framework Requirements

- **Domain:** 无外部依赖（纯 TS）
- **Application:** 可使用 @dailyuse/patterns（通用基类）
- **Infrastructure:** Prisma 客户端；时间库如 date-fns（如有复杂日期处理）
- **Testing:** Vitest；集成测试使用 in-memory 或测试数据库

### File Structure Requirements

遵循 Task 模块三层结构扩展 Schedule（参考 [1-1/1-2/1-3](#) 故事或 package-implementation-guide）。

### Testing Requirements

- **Domain 单元测试：** aggregates 逻辑、值对象、事件发送
- **Application 单元测试：** use cases（mock repository）、服务编排
- **Infrastructure 集成测试：** repository CRUD、mapper 转换、外部 API 集成（如有）
- **API 集成测试：** 端点 → controller → application → infrastructure 完整链路
- **目标覆盖率：** >=80%

### References

- [docs/PRD-Codebase-Refactor.md](docs/PRD-Codebase-Refactor.md) - 拆分需求
- [docs/architecture/package-implementation-guide.md](docs/architecture/package-implementation-guide.md) - 五层架构与 schedule 案例
- [docs/standards/structure.md](docs/standards/structure.md) - 目录结构
- [docs/standards/naming.md](docs/standards/naming.md) - 命名规范
- [1-1-task-module-domain-migration.md](1-1-task-module-domain-migration.md) - Task domain 迁移
- [1-2-task-module-application-migration.md](1-2-task-module-application-migration.md) - Task application 迁移
- [1-3-task-module-infrastructure-migration.md](1-3-task-module-infrastructure-migration.md) - Task infrastructure 迁移

## Dev Agent Record

### Agent Model Used

_待填充_

### Debug Log References

_待填充_

### Completion Notes List

_待填充_

### File List

**预期新建文件：**
- packages/domain-server/src/schedule/**/*.ts
- packages/application-server/src/schedule/**/*.ts
- packages/infrastructure-server/src/schedule/**/*.ts
- 三个 packages 的 schedule index.ts 与根 index.ts（更新导出）

**预期修改文件：**
- apps/api/src/modules/schedule/interface/controllers/*.ts（更新 import）
- apps/api/src/container.ts（DI 组装）

**预期删除：**
- apps/api/src/modules/schedule/domain/
- apps/api/src/modules/schedule/application/
- apps/api/src/modules/schedule/infrastructure/
