# 🎯 快速参考 - DailyUse 001-Daily-Productivity 规划

**规划状态**: ✅ 完成 (Phase 0 & Phase 1)  
**核心问题**: Express + RPC Protocol DTO 分离  
**用户框架**: Express.js (非 NestJS)  

---

## 📖 文档导航

| 文档 | 用途 | 读者 |
|------|------|------|
| **[COMPLETION-REPORT.md](./COMPLETION-REPORT.md)** | 📊 完成报告 + 执行摘要 | 所有人 ⭐ 先读这个 |
| **[research.md](./research.md)** | 🔍 Phase 0 研究决策 | 架构师、PM |
| **[data-model.md](./data-model.md)** | 📋 数据模型设计 | 后端开发 |
| **[api-contracts.md](./api-contracts.md)** | 📡 API 端点定义 | 前后端开发 |
| **[quickstart.md](./quickstart.md)** | 🚀 快速开始 | 所有开发人员 |
| **[IMPL_PLAN.md](./IMPL_PLAN.md)** | 📅 10周实现计划 | PM、开发主管 |
| **[constitution-check.md](./constitution-check.md)** | ✅ 宪法符合性 | 架构师、QA |

---

## 🎯 关键决策（解决用户需求）

### 用户问题
> protocol 中的 rpc map 中的参数都应是 api 中定义好的返回的类型。复杂类型在 dto 中定义并给 api 使用。现在的代码规范不对，直接使用了自定义对象。

### 解决方案
参考 [research.md](./research.md) **Principle VI** 或 [COMPLETION-REPORT.md](./COMPLETION-REPORT.md) **关键决策第 1 部分**

**简短版**:
```typescript
// ❌ 错误（现状）
export type GoalRpcMap = {
  'goal:create': [CreateGoalReq, GoalEntity];  // 不行！
};

// ✅ 正确（新规范）
export type GoalRpcMap = {
  'goal:create': [CreateGoalReq, GoalClientDTO];  // 这样对！
};

// 转换流程：
GoalEntity → mapGoalToDTO() → GoalClientDTO → RPC Response
```

---

## 📊 规划成果

### 已完成
- ✅ 10 个核心实体设计（完整的字段、关系、验证）
- ✅ 50+ API 端点定义（所有 CRUD + 复杂操作）
- ✅ RPC 协议优化规范（DTO 分离，entity-free responses）
- ✅ 代码规范文档（naming, structure, validation）
- ✅ 10 周分阶段实现计划（160+ 小时工作量）
- ✅ 宪法 100% 符合性验证

### 关键文件统计
- 📝 7 份核心文档
- 📊 50+ API 端点
- 🏗️ 10 个实体
- ✅ Zod schemas for all types
- 📋 Phase 2-4 详细检查清单

---

## 🚀 立即开始

### 如果你是...

**👨‍💼 项目经理**:
1. 读 [COMPLETION-REPORT.md](./COMPLETION-REPORT.md) (10 分钟)
2. 读 [IMPL_PLAN.md](./IMPL_PLAN.md) Week 1-4 部分 (20 分钟)
3. 检查 "Success Criteria" 每周的验收标准

**👨‍💻 后端开发**:
1. 读 [research.md](./research.md) 的 Principle VI (RPC 协议)
2. 读 [data-model.md](./data-model.md) (实体设计)
3. 读 [api-contracts.md](./api-contracts.md) (端点)
4. 按 [IMPL_PLAN.md](./IMPL_PLAN.md) Week 1-4 实现

**👩‍💻 前端开发**:
1. 读 [quickstart.md](./quickstart.md) (5 个工作流)
2. 读 [api-contracts.md](./api-contracts.md) 的响应部分
3. 准备好在 Week 5 开始 RPC 客户端和 UI

**🧪 QA/测试**:
1. 读 [quickstart.md](./quickstart.md) 的测试部分
2. 准备 [IMPL_PLAN.md](./IMPL_PLAN.md) Phase 4 的 E2E 测试计划

---

## 📁 目录结构

```
specs/001-daily-productivity/
│
├── 📊 COMPLETION-REPORT.md        ← 总结报告
├── 📅 IMPL_PLAN.md                ← 10周计划
├── 🔍 research.md                 ← RPC协议决策
├── 📋 data-model.md               ← 数据模型
├── 📡 api-contracts.md            ← API定义
├── 🚀 quickstart.md               ← 快速开始
├── ✅ constitution-check.md       ← 合规性检查
└── 📄 spec.md                     ← 原始规范
```

---

## 🎯 Express + RPC 规范总结

### 三层架构

```
┌─────────────────────────────────────┐
│   RPC Protocol Layer               │
│   'goal:create': [Req, ResDTO]     │ ← 只用 DTO！
└─────────────────────────────────────┘
           ↑ imports from
┌─────────────────────────────────────┐
│   API Layer                         │
│   CreateGoalReq, GoalClientDTO      │ ← Zod schemas
│   (requests.ts, responses.ts)       │
└─────────────────────────────────────┘
           ↑ imports from
┌─────────────────────────────────────┐
│   Aggregates Layer                  │
│   GoalClientDTO, GoalServerDTO      │ ← Type definitions
│   (*-client.ts, *-server.ts)        │
└─────────────────────────────────────┘
           ↑ imports from
┌─────────────────────────────────────┐
│   DTOs Layer (Optional)             │
│   ComplexGoalDTO (compositions)     │ ← For complex responses
└─────────────────────────────────────┘
```

### 关键规则
1. ✅ RPC Map 响应类型 = DTO，不能是实体
2. ✅ 所有请求必须有 Zod Schema
3. ✅ entity → DTO 转换通过 mapper 函数
4. ✅ API 层导出所有 RPC 需要的类型
5. ✅ 单向依赖：Protocol → API → Aggregates → DTOs

### 文件命名
```
Module Structure:
  modules/goal/
  ├── api/
  │   ├── requests.ts      # CreateGoalReq, UpdateGoalReq
  │   ├── responses.ts     # GoalClientDTO, ListGoalRes
  │   └── index.ts         # Export all types
  ├── aggregates/
  │   ├── goal-client.ts   # GoalClientDTO
  │   ├── goal-server.ts   # GoalServerDTO
  │   └── index.ts
  ├── protocol/
  │   └── goal-rpc-map.ts  # export type GoalRpcMap
  ├── dtos/
  │   └── index.ts         # ComplexGoalDTO if needed
  └── index.ts
```

---

## ✅ 宪法符合性（简版）

| Principle | Status | Key Point |
|-----------|--------|-----------|
| I. DDD | ✅ | 清晰的分层 (Domain/App/Infra/Presentation) |
| II. Type-Safe TypeScript | ✅ | Zod schemas everywhere |
| III. Multi-Platform | ✅ | 共享业务逻辑 |
| IV. Code Consistency | ✅ | kebab-case 文件命名 |
| V. Test-Driven | ✅ | >80% coverage target |
| **VI. RPC 协议** | **✅** | **DTO-only responses** ⭐ |
| VII. Example Modules | ✅ | `modules/example/` 参考实现 |

---

## 🔧 技术栈确认

- **Backend**: Express.js (不是 NestJS)
- **Database**: Prisma + PostgreSQL
- **Validation**: Zod
- **Language**: TypeScript (strict mode)
- **Testing**: Vitest
- **Frontend**: Vue 3 (web) + React (desktop)

---

## 📞 快速问答

**Q: 为什么要用 DTO 而不是直接返回实体？**  
A: ① 安全 - 不暴露敏感字段; ② 契约 - API 边界清晰; ③ 演化 - 业务逻辑改变不影响 API; ④ 验证 - Zod 在边界验证

**Q: RPC Map 如何与 REST 不同？**  
A: RPC 是强类型的调用语义（`'goal:create'`），REST 是资源+HTTP方法。RPC 更适合内部服务通信。

**Q: entity → DTO 映射在哪里做？**  
A: 在 Express 路由 handler/RPC handler 中，使用 `mapGoalToDTO()` 函数。不要在查询层做。

**Q: 如果 API 改了怎么版本控制？**  
A: 保持向后兼容。需要重大改动时，创建 `v2` 的 RPC map，并在 API 中保留旧版本。

---

## 📚 学习路径

### 新手 (不熟悉这个项目)
1. [COMPLETION-REPORT.md](./COMPLETION-REPORT.md) - 了解全貌 (15 min)
2. [quickstart.md](./quickstart.md) - 5 个工作流 (20 min)
3. [data-model.md](./data-model.md) - 理解实体 (20 min)

### 架构师/Tech Lead
1. [research.md](./research.md) - 所有决策 (30 min)
2. [constitution-check.md](./constitution-check.md) - 符合性 (15 min)
3. [IMPL_PLAN.md](./IMPL_PLAN.md) - 实现策略 (30 min)

### 实现者 (准备动手)
1. [quickstart.md](./quickstart.md) Week 1 checklist
2. [data-model.md](./data-model.md) 对应模块
3. [api-contracts.md](./api-contracts.md) 对应端点
4. [research.md](./research.md) Principle VI (RPC)

---

## 🎬 后续行动

### 今天
- [ ] 阅读本快速参考 (5 min)
- [ ] 阅读 COMPLETION-REPORT.md (10 min)
- [ ] 团队讨论是否同意计划

### 本周
- [ ] 创建特性分支 `001-daily-productivity-impl`
- [ ] 复述全新阅读 research.md + data-model.md
- [ ] 设计 Prisma schema

### 下周开始
- [ ] Phase 2 Week 1: Auth + RPC Router (Week 1 checklist)

---

## 📊 一页纸总结

**特性**: 个人生产力管理平台 (OKR + Task + Reminder + Repository)

**核心改进**: Express + RPC 协议的 DTO 分离规范（解决用户的直接对象问题）

**交付**: 10 周计划，160+ 小时，160 个检查点，>80% 测试覆盖

**起点**: Phase 2 Week 1 Prisma schema + Auth module

**团队**: 2-3 人后端，2-3 人前端，2 周内上线 MVP

---

**Last Updated**: 2026-02-03  
**Branch**: `001-daily-productivity`  
**Status**: ✅ 规划完成，准备实现

