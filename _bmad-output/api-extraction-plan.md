# API 服务器架构提取计划（方案 B）

**日期**: 2026-01-19  
**目标**: 统一分层提取策略，将 API 中的 Domain/Application/Infrastructure 层提取到 packages  
**预期成果**: API 项目从 267 个 TS 文件 → ~70 个文件（仅 routes + types），业务逻辑全部提取到 packages

---

## 1. 当前 API 结构分析

### 文件统计

- **API 项目总文件数**: 267 个 TS 文件
- **包含 application/**: 8 个模块（account, ai, authentication, dashboard, editor, goal, notification, reminder, repository, setting, schedule, task）
- **包含 infrastructure/**: 同上
- **可提取代码量**: ~15,000+ 行

### 模块清单与优先级

| 优先级 | 模块           | 文件数 | 应用层       | 基础设施层                         | 说明                       |
| ------ | -------------- | ------ | ------------ | ---------------------------------- | -------------------------- |
| P0     | authentication | 15     | Services(6)  | Repositories(2), DI                | 核心认证，其他模块依赖     |
| P0     | account        | 12     | Services(3)  | Repositories(1), DI                | 账户基础，依赖认证         |
| P1     | ai             | 28     | Services(5)  | Adapters(7), Repositories(5), DI   | 最复杂，多个 AI provider   |
| P1     | goal           | 35     | Services(10) | Repositories(5), Cron, DI, Mappers | 目标管理，可能有 cron 任务 |
| P2     | task           | 18     | Services(4)  | Repositories(4), DI                | 任务管理                   |
| P2     | reminder       | 25     | Services(6)  | Repositories(3), Cron, DI          | 提醒系统，有定时任务       |
| P2     | schedule       | 20     | Services(8)  | Repositories(3), Cron, DI          | 日程管理，复杂调度         |
| P3     | dashboard      | 12     | Services(3)  | Repositories(3), DI, Services      | 仪表板统计                 |
| P3     | repository     | 16     | Services(6)  | Repositories(4), DI                | 资源库管理                 |
| P3     | setting        | 8      | Services(2)  | Repositories(1), DI                | 设置管理                   |
| P3     | notification   | 18     | Services(3)  | Repositories(3), DI, Handlers      | 通知系统                   |
| P4     | editor         | 8      | Services(2)  | Repositories(1), DI                | 编辑器（若有）             |
| P4     | metrics        | 3      | -            | -                                  | 指标收集（可能无业务层）   |

---

## 2. 提取策略：模块级别映射

### 2.1 应用层提取目标

**源**: `apps/api/src/modules/[module]/application/services/*.ts`  
**目标**: `packages/application-server/src/[module]/services/*.ts`

**迁移内容**:

- ApplicationService 类（编排服务）
- 单个 Use Case 类（如 CreateGoal, UpdateGoal）
- Event Handlers（应用层事件处理）

**示例**：

```typescript
// 源: apps/api/src/modules/goal/application/services/GoalApplicationService.ts
// 目标: packages/application-server/src/goal/services/goal-application.service.ts

export class GoalApplicationService {
  constructor(
    private readonly goalRepository: IGOalRepository,
    private readonly eventPublisher: EventPublisher
  ) {}

  async createGoal(accountUuid: string, data: CreateGoalRequest) { ... }
}
```

### 2.2 基础设施层提取目标

**源**: `apps/api/src/modules/[module]/infrastructure/`  
**目标**: `packages/infrastructure-server/src/[module]/`

**迁移内容**:

| 子文件夹            | 源路径                                    | 目标路径                    | 说明                              |
| ------------------- | ----------------------------------------- | --------------------------- | --------------------------------- |
| repositories/       | `/infrastructure/repositories/`           | `/repositories/`            | Prisma Repository 实现            |
| di/                 | `/infrastructure/di/[Module]Container.ts` | `/di/[module]-container.ts` | 依赖注入容器                      |
| adapters/           | `/infrastructure/adapters/*.ts`           | `/adapters/`                | 外部服务适配器（如 AI providers） |
| services/           | `/infrastructure/services/*.ts`           | `/services/`                | 基础设施层服务（缓存、工具等）    |
| repositories/ (old) | `/infrastructure/repositories/`           | `/datasources/`             | 底层数据源访问（如果需要）        |

**示例**：

```typescript
// 源: apps/api/src/modules/goal/infrastructure/repositories/PrismaGoalRepository.ts
// 目标: packages/infrastructure-server/src/goal/repositories/prisma-goal.repository.ts

export class PrismaGoalRepository implements IGoalRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateGoalData): Promise<Goal> { ... }
}

// 源: apps/api/src/modules/goal/infrastructure/di/GoalContainer.ts
// 目标: packages/infrastructure-server/src/goal/di/goal-container.ts

export class GoalContainer {
  static getInstance(): GoalContainer {
    if (!GoalContainer.instance) {
      GoalContainer.instance = new GoalContainer();
    }
    return GoalContainer.instance;
  }

  getGoalApplicationService(): GoalApplicationService {
    return new GoalApplicationService(
      this.getGoalRepository(),
      this.getEventPublisher()
    );
  }
}
```

### 2.3 Domain 层处理

**源**: `apps/api/src/modules/[module]/domain/`（如果存在）  
**目标**: `packages/domain-server/src/[module]/`

**注意**: 大多数 Domain 模型已在 `packages/domain-server/` 中，仅需检查是否有遗漏的 Entities/Aggregates/Value Objects

---

## 3. API 项目最终结构设计

### 3.1 目标结构（提取后）

```
apps/api/
├── src/
│   ├── main.ts                          # 入口：初始化 DI + 启动服务器
│   ├── middleware/                      # HTTP 中间件
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── error-handler.middleware.ts
│   ├── modules/
│   │   ├── account/
│   │   │   ├── routes.ts                # (50-70 行) HTTP 路由定义
│   │   │   └── types.ts                 # Express-specific 类型
│   │   ├── authentication/
│   │   │   ├── routes.ts
│   │   │   └── initialization.ts        # (保留：初始化策略等)
│   │   ├── ai/
│   │   │   ├── routes.ts
│   │   │   └── types.ts
│   │   ├── goal/
│   │   │   ├── routes.ts
│   │   │   └── types.ts
│   │   └── ...（其他模块同结构）
│   ├── config/                          # 配置文件
│   ├── utils/                           # API 层工具函数
│   └── app.ts                           # Express 应用设置
├── package.json
└── tsconfig.json
```

### 3.2 Routes 文件规范

```typescript
// apps/api/src/modules/goal/routes.ts
import { Router } from 'express';
import { GoalContainer } from '@dailyuse/infrastructure-server';
import { AuthenticatedRequest } from '../types';

export function registerGoalRoutes(router: Router): void {
  const container = GoalContainer.getInstance();
  const goalService = container.getGoalApplicationService();

  // 创建目标
  router.post('/goals', async (req: AuthenticatedRequest, res) => {
    try {
      const goal = await goalService.createGoal(req.user.accountUuid, req.body);
      res.json({ success: true, data: goal });
    } catch (error) {
      throw error; // 由全局错误处理器接管
    }
  });

  // 获取目标列表
  router.get('/goals', async (req: AuthenticatedRequest, res) => {
    const goals = await goalService.listGoals(req.user.accountUuid, req.query);
    res.json({ success: true, data: goals });
  });

  // 其他端点...
}
```

### 3.3 主文件结构

```typescript
// apps/api/src/main.ts
import express from 'express';
import { registerAccountRoutes } from './modules/account/routes';
import { registerAuthRoutes } from './modules/authentication/routes';
import { registerGoalRoutes } from './modules/goal/routes';
// ... 导入其他 routes

const app = express();

// 中间件
app.use(express.json());
app.use(authMiddleware);
app.use(validationMiddleware);

// 注册模块路由
const api = express.Router();
registerAccountRoutes(api);
registerAuthRoutes(api);
registerGoalRoutes(api);
// ...

app.use('/api', api);

// 错误处理
app.use(errorHandlerMiddleware);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

---

## 4. 具体模块提取计划

### Authentication 模块（P0）

**应用层**:

- `AccountCreatedHandler.ts` → `packages/application-server/src/authentication/handlers/`
- `AuthenticationApplicationService.ts` → `packages/application-server/src/authentication/services/`
- `ApiKeyApplicationService.ts` → `packages/application-server/src/authentication/services/`
- `PasswordManagementApplicationService.ts` → `packages/application-server/src/authentication/services/`
- `SessionManagementApplicationService.ts` → `packages/application-server/src/authentication/services/`
- `TwoFactorApplicationService.ts` → `packages/application-server/src/authentication/services/`
- `RememberMeApplicationService.ts` → `packages/application-server/src/authentication/services/`

**基础设施层**:

- `AuthenticationContainer.ts` → `packages/infrastructure-server/src/authentication/di/`
- `PrismaAuthCredentialRepository.ts` → `packages/infrastructure-server/src/authentication/repositories/`
- `PrismaAuthSessionRepository.ts` → `packages/infrastructure-server/src/authentication/repositories/`

**API 保留**:

```typescript
// apps/api/src/modules/authentication/routes.ts
export function registerAuthRoutes(router: Router): void {
  const container = AuthenticationContainer.getInstance();
  const authService = container.getAuthenticationApplicationService();

  router.post('/auth/login', async (req, res) => {
    const { token } = await authService.login(req.body);
    res.json({ success: true, data: { token } });
  });

  router.post('/auth/logout', async (req: AuthenticatedRequest, res) => {
    await authService.logout(req.user.sessionId);
    res.json({ success: true });
  });
  // ...
}
```

### Account 模块（P0）

类似 Authentication 的提取策略...

---

## 5. 验证与测试计划

### 5.1 验证检查清单

- [ ] 所有 application/services 文件已移至 `packages/application-server`
- [ ] 所有 infrastructure 文件已移至 `packages/infrastructure-server`
- [ ] 所有 imports 更新为 `@dailyuse/application-server` 和 `@dailyuse/infrastructure-server`
- [ ] API routes 文件都遵循规范（50-80 行，只有 HTTP 逻辑）
- [ ] TypeScript 编译零错误
- [ ] 所有测试通过
- [ ] API 项目 `/modules/` 目录中没有 `/application` 和 `/infrastructure` 子目录

### 5.2 自动化验证脚本

```bash
# 验证 API 项目中没有 application/infrastructure 文件夹
if find apps/api/src/modules -type d \( -name "application" -o -name "infrastructure" \) | grep -q .; then
  echo "❌ ERROR: Found application/infrastructure folders in API modules"
  exit 1
fi

# 验证 packages 中有所有必要的文件
for dir in account authentication goal ai task reminder schedule; do
  if [ ! -d "packages/application-server/src/$dir/services" ]; then
    echo "❌ ERROR: Missing services directory for $dir"
    exit 1
  fi
done

echo "✅ Validation passed!"
```

### 5.3 构建与测试

```bash
# 安装依赖
pnpm install

# TypeScript 编译检查
pnpm tsc --noEmit

# 运行测试
pnpm test

# 运行 API 服务器
pnpm dev:api
```

---

## 6. 执行时间表

| 阶段     | 任务                                              | 预计时间 | 优先级 |
| -------- | ------------------------------------------------- | -------- | ------ |
| 准备     | 创建 ADR、分析结构、设计方案                      | 2h       | P0     |
| P0 Phase | 提取 Authentication、Account                      | 8h       | P0     |
| P1 Phase | 提取 AI、Goal                                     | 12h      | P1     |
| P2 Phase | 提取 Task、Reminder、Schedule                     | 10h      | P2     |
| P3 Phase | 提取 Dashboard、Repository、Setting、Notification | 8h       | P3     |
| P4 Phase | 提取 Editor（如有）                               | 2h       | P4     |
| 验证     | 完整测试、修复问题                                | 6h       | P0     |
| 清理     | 删除 API 中的空目录，文档整理                     | 2h       | P0     |

**总计**: ~50 小时工作量

---

## 7. 风险评估与缓解

| 风险                       | 影响         | 概率 | 缓解                   |
| -------------------------- | ------------ | ---- | ---------------------- |
| DI Container 初始化失败    | 服务启动崩溃 | 中   | 提前测试 DI 容器逻辑   |
| 循环依赖                   | 编译失败     | 中   | 仔细检查 packages 结构 |
| 遗漏的 Application Service | 功能缺失     | 低   | 执行前的完整文件扫描   |
| 集成测试失败               | 无法验证完成 | 中   | 逐个模块验证           |

---

## 8. 成功指标

✅ **完成标志**:

1. API 项目中 `/modules/*/application` 和 `/modules/*/infrastructure` 完全删除
2. TypeScript 编译零错误
3. 所有现有测试通过
4. API 服务器正常启动和响应请求
5. Desktop/CLI 等新应用可以直接导入 packages 中的业务逻辑

---

## 9. 相关文档

- [ADR-020: API Server 统一提取策略](./ADR-020-API-server-unified-extraction-strategy.md)
- [Web 应用提取经验总结](../REVIEW_DELIVERABLES_SUMMARY.md)
- [Clean Architecture 分层标准](./ADR-009-standard-clean-architecture-layers.md)

---

## 10. 执行检查清单

### 开始前

- [ ] ADR-020 已批准
- [ ] 团队理解方案 B 的优势
- [ ] 恢复了删除的 API 代码
- [ ] 备份了当前代码分支

### 执行中

- [ ] 按优先级逐个提取模块
- [ ] 每个模块提取后运行测试
- [ ] 记录遇到的问题和解决方案

### 完成后

- [ ] 验证脚本全部通过
- [ ] 更新 README 和文档
- [ ] 团队培训（新架构）
- [ ] 代码审查
- [ ] 合并到主分支

---

**创建日期**: 2026-01-19  
**状态**: 待执行  
**负责人**: _待分配_
