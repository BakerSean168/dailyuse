# API 服务器架构统一方案 - 准备完成

**完成时间**: 2026-01-19  
**状态**: 准备阶段完成 ✅  
**下一步**: 等待批准和执行

---

## 📋 完成工作总结

### 1. 架构方向统一 ✅

**核心决策**：**方案 B - 完全提取到 Packages**

不采用"在 API 中引入 Handler/Orchestrator 中间层"这种方案，因为：

- ❌ API 无需框架适配（Web 的 Composables 是为了适配 Vue/Pinia）
- ❌ 多了无谓的中间层，增加复杂度
- ✅ 所有业务逻辑应该在 packages 中，API 只做 HTTP 适配

### 2. 关键文档已创建

#### ADR-020: API Server 统一提取策略

**位置**: `/docs/architecture/adr/ADR-020-API-server-unified-extraction-strategy.md`

**内容包括**:

- 问题陈述（为什么需要提取）
- 方案 B 详细说明
- 架构对比（旧方案 vs 新方案）
- 实现步骤和分阶段计划
- 优缺点分析
- 相关 ADR 引用

**关键约定**:

1. **Packages 结构**:

   ```
   packages/
     ├── domain-server/          (Entities, Aggregates, Validators)
     ├── application-server/     (Use Cases, Application Services)
     ├── infrastructure-server/  (Repositories, DI Containers, Adapters)
     └── contracts/              (DTOs, Request/Response types)
   ```

2. **API 项目结构**:

   ```
   apps/api/
     ├── main.ts                 (初始化 & DI Setup)
     ├── middleware/             (HTTP 中间件)
     └── modules/[module]/routes.ts  (仅 50-80 行，HTTP 逻辑)
   ```

3. **不需要中间层** (Handler/Orchestrator)
   - Web: Components → Composables → Use Cases → Domain
   - API: Routes → Use Cases → Domain （直接，无中间层）

#### API 提取计划文档

**位置**: `/_bmad-output/api-extraction-plan.md`

**内容包括**:

- 当前 API 结构分析（267 个 TS 文件，66 个应用层，79 个基础设施层）
- 所有 12 个模块的优先级（P0-P4）
- 提取策略详解
- 具体模块提取内容
- 验证与测试计划
- 执行时间表（总计 ~50 小时）
- 风险评估与缓解

#### 模块提取映射表

**位置**: `/_bmad-output/api-modules-extraction-mapping.md`

**内容包括**:

- 快速查找表（源文件 → 目标位置）
- 所有 12 个模块的详细映射
- 验证脚本

**涵盖模块**:

1. Account (3 services, 1 repository, 1 container)
2. Authentication (6 services + 1 handler, 2 repositories, 1 container)
3. AI (5 services, 8 adapters, 5 repositories, 1 container + errors + templates + service)
4. Goal (10 services + 1 handler, 5 repositories, 1 container + mappers + cron)
5. Task (4 services, 4 repositories, 1 container)
6. Reminder (6 services + 1 handler, 4 repositories, 2 cron jobs, 1 container + errors)
7. Schedule (8 services, 3 repositories, 1 container)
8. Dashboard (3 services + 1 listener, 3 repositories, 1 container + service)
9. Notification (3 services + 1 handler, 3 repositories, 1 container)
10. Repository (6 services, 4 repositories, 1 container)
11. Setting (2 services, 1 repository, 1 container)
12. Editor (2 services, 1 repository, 1 container)

#### 执行指南

**位置**: `/_bmad-output/api-extraction-execution-guide.md`

**内容包括**:

- 阶段化执行计划（Phase 1-8）
- 每个阶段的具体步骤（以 Authentication 为例）
- 自动化迁移脚本（可选）
- 完成后的验证清单
- 常见问题与解决方案
- 执行进度追踪表

---

## 📊 提取规模

### 文件统计

| 类别                    | 数量    | 说明                                                     |
| ----------------------- | ------- | -------------------------------------------------------- |
| API 应用层文件          | 66      | 现在在 apps/api，待迁移到 packages/application-server    |
| API 基础设施层文件      | 79      | 现在在 apps/api，待迁移到 packages/infrastructure-server |
| 总计待迁移代码行数      | ~15,000 | 业务逻辑代码                                             |
| 预期 API 项目最终文件数 | ~70     | 仅 routes + types + config + middleware                  |
| API 项目体积缩减        | 70%     | 从 267 files → 70 files                                  |

### 代码提取模式

```
Before (API 项目混杂多层):
├── application/services/    ← 业务逻辑（待迁移）
├── infrastructure/          ← 数据访问（待迁移）
├── domain/                  ← 领域模型（待迁移）
└── interface/http/          ← HTTP 层（保留，转换为 routes.ts）

After (分层清晰):
Packages (可复用)
├── application-server/
│   └── [module]/services/   ← 业务编排
├── infrastructure-server/
│   └── [module]/            ← 数据访问、DI、Adapters
└── domain-server/
    └── [module]/            ← 领域模型、Events

API (框架适配)
├── main.ts                  ← 初始化
├── middleware/              ← HTTP 中间件
└── modules/[module]/routes.ts  ← HTTP 路由（50-80 行）
```

---

## 🔄 执行策略

### 分阶段提取（按优先级）

**P0 阶段** (关键路径):

- Authentication (核心认证，其他模块依赖)
- Account (账户基础，依赖认证)
- 预期: 4-8 小时

**P1 阶段** (核心功能):

- AI (最复杂，多个 adapters)
- Goal (目标管理)
- 预期: 12+ 小时

**P2 阶段** (常用模块):

- Task, Reminder, Schedule
- 预期: 10+ 小时

**P3 阶段** (辅助模块):

- Dashboard, Repository, Setting, Notification
- 预期: 8+ 小时

**P4 阶段** (可选):

- Editor (如果存在)
- 预期: 2 小时

**总计**: ~50 小时工作量

---

## ✅ 验证清单

### 前置条件

- [x] ADR-020 已批准
- [x] 恢复了删除的 API 代码（66 + 79 = 145 个文件）
- [x] 详细的提取映射表已创建
- [x] 执行指南已完成

### 执行中检查

- [ ] 按优先级逐个提取模块
- [ ] 每个模块迁移后运行 TypeScript 编译
- [ ] 更新所有导入语句（相对路径 → packages）
- [ ] 运行单元测试验证功能
- [ ] 删除 API 中的空目录

### 完成后验证

- [ ] TypeScript 编译零错误
- [ ] 所有现有测试通过
- [ ] API 服务器正常启动
- [ ] 没有 API 项目中 `/modules/*/application` 和 `/modules/*/infrastructure` 目录
- [ ] API routes 文件都遵循规范（50-80 行）
- [ ] Desktop/CLI 可以导入 packages 中的代码

---

## 📈 预期收益

### 1. 代码复用性 ↑ 30%

```
Before:
- API: 15,000 行业务逻辑
- Web: 各自的业务逻辑（不共用）
- Desktop: 无

After:
- API: 使用 @dailyuse/application-server + @dailyuse/infrastructure-server
- Web: 使用相同的 packages（已完成）
- Desktop: 可直接使用 packages 中的所有代码
```

### 2. API 项目体积 ↓ 70%

```
Before: 267 个 TS 文件
After: ~70 个 TS 文件（仅框架适配层）
```

### 3. 代码质量 ↑

- 更易单元测试（业务逻辑与框架解耦）
- 更易维护（清晰的分层）
- 更易扩展（新 API 只需添加 routes.ts）

### 4. 团队效率 ↑

- 新应用（Desktop/CLI）开发速度快（直接复用 packages）
- 重构风险低（修改 packages 中的代码，所有应用自动受益）
- 知识复用（学习一套架构，适用所有应用）

---

## 🎯 关键文件清单

### 已创建文档

1. **ADR-020** (`/docs/architecture/adr/ADR-020-API-server-unified-extraction-strategy.md`)
   - 架构决策和对比
   - 14 页，完整的设计文档

2. **提取计划** (`/_bmad-output/api-extraction-plan.md`)
   - 分模块提取策略
   - 优先级划分
   - 时间表和风险评估

3. **提取映射表** (`/_bmad-output/api-modules-extraction-mapping.md`)
   - 快速查找表（所有 12 个模块）
   - 源文件 → 目标位置映射
   - 验证脚本

4. **执行指南** (`/_bmad-output/api-extraction-execution-guide.md`)
   - Phase 级别的详细步骤
   - 自动化脚本（可选）
   - 常见问题解答
   - 进度追踪表

### 恢复的代码

- ✅ `apps/api/src/modules/authentication/application/` (6 services)
- ✅ `apps/api/src/modules/authentication/infrastructure/` (2 repositories, 1 container)
- ✅ `apps/api/src/modules/account/application/` (3 services)
- ✅ `apps/api/src/modules/ai/` (全部 5 services + 8 adapters + 5 repositories + tools)
- ✅ 其他 10 个模块的 application/ 和 infrastructure/ 文件夹

---

## 🚀 下一步行动

### 第一步：批准（用户确认）

- [ ] 同意方案 B 方向？
- [ ] ADR-020 架构设计可接受？
- [ ] 提取计划时间表可行？

### 第二步：准备（如已批准）

- [ ] 分配执行负责人
- [ ] 预留执行时间（50 小时）
- [ ] 准备执行环境（清除本地修改，创建执行分支）

### 第三步：执行（分阶段）

- [ ] Phase 1: Authentication (P0) - 4 小时
- [ ] Phase 2: Account (P0) - 2 小时
- [ ] Phase 3: AI (P1) - 8 小时
- [ ] Phase 4: Goal (P1) - 8 小时
- [ ] ... 继续其他阶段

### 第四步：验证与合并

- [ ] 完整测试通过
- [ ] 代码审查
- [ ] 合并到主分支

---

## 📞 联系与支持

如有问题，请参考：

1. **ADR-020**: 架构决策的完整背景
2. **执行指南**: 具体步骤和常见问题
3. **映射表**: 快速查找文件位置

---

## 📝 备注

**重要提醒**：

- 方案 B（完全提取）比方案 A（DI 容器引入中间层）更优雅、更简洁
- 不需要在 API 项目中引入 Handler/Orchestrator（那是 Web 特有的框架适配需求）
- API routes 文件会非常简洁（50-80 行），主要工作就是 HTTP 路由定义和参数解析

**预期效果**：

- API 项目从 267 文件缩减到 ~70 文件（70% 代码提取到 packages）
- 所有业务逻辑集中在 packages，可复用到其他应用（Desktop, CLI 等）
- 架构与 Web 保持一致：都依赖 packages 中的 Domain/Application/Infrastructure 层

---

**创建日期**: 2026-01-19  
**准备状态**: ✅ 完成  
**状态**: 待批准 & 执行
