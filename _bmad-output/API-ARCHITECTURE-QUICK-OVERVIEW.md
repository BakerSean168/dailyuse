# API 架构统一方案总览

**概述**: 统一 API 和 Web 的架构策略，将 API 中的所有业务逻辑（Domain/Application/Infrastructure）提取到 packages，API 项目仅保留 HTTP 适配层。

---

## 核心决策：方案 B

### 不采用方案 A 的原因

❌ **方案 A**：在 API 中引入 Handler/Orchestrator 中间层（类似 Web Composables）

- Web Composables 存在的原因：Vue + Pinia 框架适配需求
- API 无需框架适配，多中间层增加复杂度

### ✅ 采用方案 B：完全提取到 Packages

```
原则：所有框架无关的代码都在 packages
      所有框架特定的代码都在 apps
```

**结果**：

- API: 仅 HTTP 路由 + 中间件 + DI 初始化（50-80 行/路由）
- Web: 仅 Composables + Components + Stores（已完成）
- Packages: Domain + Application + Infrastructure（可复用）
- Desktop/CLI: 直接导入 packages 中的所有代码

---

## 架构对比

### Before（当前状态）

```
API 项目：
├── application/     ← 66 个文件，待提取
├── infrastructure/  ← 79 个文件，待提取
├── domain/          ← 需要整理
└── interface/http/  ← 保留，改为 routes.ts

业务逻辑散落在 API 项目中，无法被其他应用（Desktop/CLI）复用
```

### After（目标状态）

```
packages/application-server/   ← 所有业务编排
packages/infrastructure-server/← 所有数据访问、Adapters
packages/domain-server/        ← 所有领域模型

apps/api/modules/[module]/
├── routes.ts                  ← 仅 HTTP 路由（50-80 行）
└── types.ts                   ← Express-specific 类型

可复用代码量 ↑ 30%
API 项目体积 ↓ 70%
```

---

## 提取规模

| 指标                | 数值     |
| ------------------- | -------- |
| API 应用层文件      | 66       |
| API 基础设施层文件  | 79       |
| 待迁移代码行数      | ~15,000  |
| 预期 API 最终文件数 | ~70      |
| API 项目体积缩减    | 70%      |
| 工作量              | ~50 小时 |

---

## 执行计划（分阶段）

### P0 阶段（关键路径）

- **Authentication** (核心认证)
- **Account** (账户管理)
- 工作量: 4-8 小时

### P1 阶段（核心功能）

- **AI** (5 services + 8 adapters)
- **Goal** (10 services)
- 工作量: 12+ 小时

### P2 阶段（常用模块）

- **Task**, **Reminder**, **Schedule**
- 工作量: 10+ 小时

### P3 阶段（辅助模块）

- **Dashboard**, **Repository**, **Setting**, **Notification**
- 工作量: 8+ 小时

### P4 阶段（可选）

- **Editor**
- 工作量: 2 小时

**总计**: ~50 小时

---

## 关键约定

### 1. Packages 结构不变

```
packages/
├── domain-server/          (Entities, Aggregates, Validators)
├── application-server/     (Use Cases, Application Services)
├── infrastructure-server/  (Repositories, DI Containers, Adapters)
└── contracts/              (DTOs, Types)
```

### 2. API 项目极简化

```typescript
// apps/api/src/main.ts
const app = express();
app.use(middleware);

const router = express.Router();
registerAuthRoutes(router); // 从各模块导入
registerGoalRoutes(router);
app.use('/api', router);
app.listen(3000);

// apps/api/src/modules/authentication/routes.ts
export function registerAuthRoutes(router: Router): void {
  const container = AuthenticationContainer.getInstance();
  const authService = container.getAuthenticationApplicationService();

  router.post('/auth/login', async (req, res) => {
    const result = await authService.login(req.body);
    res.json({ success: true, data: result });
  });
}
```

### 3. DI Container 在 Packages 中

```typescript
// packages/infrastructure-server/src/authentication/di/authentication-container.ts
export class AuthenticationContainer {
  static getInstance(): AuthenticationContainer { ... }

  getAuthenticationApplicationService(): AuthenticationApplicationService {
    return new AuthenticationApplicationService(
      this.getCredentialRepository(),
      this.getSessionRepository(),
      this.getPasswordEncryptor()
    );
  }
}

// API 项目只负责初始化容器
const container = AuthenticationContainer.getInstance();
```

### 4. 不需要额外的中间层（Handler）

```typescript
// ❌ 不需要
class LoginHandler {
  async execute(request: LoginRequest) { ... }
}

// ✅ 直接使用 Application Service
const result = await authenticationService.login(email, password);
```

---

## 预期成果

### 代码复用性提升

```
Before:
- API: 业务逻辑在 apps/api
- Web: 业务逻辑在 apps/web（不同实现）
- Desktop: 无（需重新开发）

After:
- API: 使用 @dailyuse/application-server
- Web: 使用 @dailyuse/application-server（已完成）
- Desktop: 使用 @dailyuse/application-server
- CLI: 使用 @dailyuse/application-server
```

### API 项目瘦身

```
Before: 267 个 TS 文件
  ├── application/ (66 files)
  ├── infrastructure/ (79 files)
  ├── domain/ (多个)
  ├── interface/http/ (多个 Controllers)
  └── ...

After: ~70 个 TS 文件
  ├── modules/[module]/routes.ts (仅 50-80 行)
  ├── middleware/
  ├── config/
  └── main.ts
```

### 架构一致性

```
Web: Components → Composables → Use Cases → Domain
API: Routes → Use Cases → Domain（直接，无中间层）
Both: 使用完全相同的 Domain + Application + Infrastructure 层
```

---

## 已准备文档

| 文档     | 位置                                                                       | 内容                                  |
| -------- | -------------------------------------------------------------------------- | ------------------------------------- |
| ADR-020  | `/docs/architecture/adr/ADR-020-API-server-unified-extraction-strategy.md` | 完整的架构决策文档（14 页）           |
| 提取计划 | `/_bmad-output/api-extraction-plan.md`                                     | 分模块的提取策略、时间表、风险评估    |
| 映射表   | `/_bmad-output/api-modules-extraction-mapping.md`                          | 所有 12 个模块的文件映射（源 → 目标） |
| 执行指南 | `/_bmad-output/api-extraction-execution-guide.md`                          | Phase 级别的步骤、脚本、常见问题      |
| 本总览   | `/_bmad-output/api-architecture-plan-summary.md`                           | 这个文档，快速概览所有信息            |

---

## 关键数字

| 项目             | 当前           | 目标                 | 改进        |
| ---------------- | -------------- | -------------------- | ----------- |
| API 文件数       | 267            | ~70                  | ↓ 73%       |
| API 业务逻辑行数 | ~15,000        | ~0                   | ↑ 100% 提取 |
| 可复用代码       | ~0             | ~15,000              | ↑ 无限      |
| 架构分层一致性   | Web/API 不对称 | Web/API/Desktop 统一 | ✅ 完全统一 |

---

## 验证清单

### 执行前

- [x] ADR-020 已创建
- [x] API 代码已恢复（145 文件）
- [x] 详细计划已制定
- [ ] 等待批准

### 执行中

- [ ] P0 阶段完成（Authentication + Account）
- [ ] P1 阶段完成（AI + Goal）
- [ ] P2 阶段完成（Task/Reminder/Schedule）
- [ ] P3 阶段完成（Dashboard/Repository/Setting/Notification）

### 执行后

- [ ] TypeScript 编译零错误
- [ ] 所有测试通过
- [ ] API 服务器正常启动
- [ ] API 项目中无 application/ 和 infrastructure/ 目录

---

## Q&A

**Q: 为什么不在 API 中引入 Handler？**
A: Web 的 Composables 是 Vue 框架需求，API 不需要框架适配。引入无谓的中间层增加复杂度，违反了 YAGNI（You Aren't Gonna Need It）原则。

**Q: DI Container 怎么初始化？**
A: 在 `packages/infrastructure-server` 中定义，API 主文件直接调用 `Container.getInstance()` 获取。

**Q: API routes 文件会有多长？**
A: 50-80 行。仅包含 HTTP 路由定义和参数解析，所有业务逻辑都在 Application Service 中。

**Q: 如何保证代码正确迁移？**
A: 逐个模块迁移，每次迁移后运行 TypeScript 编译和测试，确保没有错误。

**Q: 新应用（Desktop）如何使用？**
A: 直接导入 `@dailyuse/application-server` 和其他 packages，完全复用 API 的业务逻辑。

---

## 下一步

### 立即行动（如同意）

1. **批准**: 确认方案 B 方向
2. **分配**: 指派执行负责人
3. **排期**: 安排执行时间（50 小时）
4. **启动**: 从 P0 阶段开始

### 信息获取

- 完整决策：参考 ADR-020
- 具体步骤：参考执行指南
- 文件映射：参考提取映射表
- 快速查询：本总览文档

---

**准备状态**: ✅ 完成  
**状态**: 待批准和执行  
**创建日期**: 2026-01-19
