# API 架构统一方案 - 完整文档索引

**创建日期**: 2026-01-19  
**状态**: 准备阶段完成 ✅  
**下一步**: 等待批准和执行

---

## 📚 文档导航

### 1️⃣ 快速入门（5 分钟）

**📄 [API 架构统一快速概览](./API-ARCHITECTURE-QUICK-OVERVIEW.md)**

- 核心决策：方案 B 解释
- 架构对比（Before/After）
- 提取规模和工作量
- 关键约定
- Q&A 快速答疑

✨ **推荐首先阅读** - 快速了解整个方案

---

### 2️⃣ 架构决策文档

**📋 [ADR-020: API Server 统一提取策略](../docs/architecture/adr/ADR-020-API-server-unified-extraction-strategy.md)**

**内容**:

- 问题陈述（为什么需要提取）
- 核心思想和原理
- 解决方案详细设计
- 优缺点分析
- 实现步骤
- 对比分析（旧方案 vs 新方案）
- 代码示例
- 相关 ADR 引用

**页数**: 14 页  
**读时**: 15-20 分钟

✨ **完整的架构设计文档**

---

### 3️⃣ 执行计划文档

**📊 [API 模块提取计划](./api-extraction-plan.md)**

**章节**:

1. 当前 API 结构分析
   - 文件统计（267 个 TS 文件）
   - 模块清单与优先级表
   - 应用层和基础设施层细分

2. 提取策略：模块级别映射
   - 应用层提取目标
   - 基础设施层提取目标
   - Domain 层处理

3. API 项目最终结构设计
   - 目标结构树状图
   - Routes 文件规范
   - 主文件结构示例

4. 具体模块提取计划
   - Authentication 详细步骤
   - Account 提取计划
   - ... 等 12 个模块

5. 验证与测试计划
6. 执行时间表（总计 ~50 小时）
7. 风险评估与缓解
8. 成功指标

**页数**: 15 页  
**读时**: 20-30 分钟

✨ **详细的分模块执行策略**

---

### 4️⃣ 快速参考表

**📍 [API 模块提取映射表](./api-modules-extraction-mapping.md)**

**内容**:

- 快速查找表（源文件 → 目标位置）
- 12 个模块的详细映射
  - Account
  - Authentication
  - AI
  - Goal
  - Task
  - Reminder
  - Schedule
  - Dashboard
  - Notification
  - Repository
  - Setting
  - Editor
- 每个模块的应用层、基础设施层、API 保留部分详细列表
- 验证脚本

**格式**: 表格 + 目录树

✨ **项目执行时的必备参考**

---

### 5️⃣ 执行指南

**🚀 [API 提取执行指南](./api-extraction-execution-guide.md)**

**章节**:

1. 当前状态检查清单
2. 执行阶段详解
   - Phase 1: Authentication（P0）- 详细步骤示例
   - Phase 2: Account（P0）
   - Phase 3-8: 其他模块
3. 批量迁移脚本（可选自动化）
   - 自动化迁移脚本（bash）
   - 导入修复脚本
4. 完成后的验证清单
   - 编译验证
   - 文件结构验证
   - 导入验证
   - 测试验证
5. 常见问题与解决
   - Q: 文件名怎么改？
   - Q: imports 怎么修复？
   - Q: DI Container 怎么导出？
   - Q: 如何处理循环依赖？
6. 执行进度追踪表
7. 下一步行动清单

**页数**: 12 页  
**读时**: 15-20 分钟

✨ **执行时的详细步骤指导**

---

### 6️⃣ 完成总结

**✅ [API 架构方案准备完成总结](./api-architecture-plan-summary.md)**

**内容**:

- 完成工作总结（6 个文档已创建）
- 关键决策回顾
- 文件统计
- 提取规模
- 执行策略
- 预期收益
- 关键文件清单
- 验证清单
- 下一步行动

**页数**: 8 页  
**读时**: 10-15 分钟

✨ **管理层总览，了解整体进展**

---

## 📑 文档使用指南

### 根据角色选择阅读

**👨‍💼 决策者/经理**

1. 先读：[快速概览](./API-ARCHITECTURE-QUICK-OVERVIEW.md)（5 分钟）
2. 再读：[方案总结](./api-architecture-plan-summary.md)（10 分钟）
3. 了解：下一步行动
   → **总耗时**: 15 分钟

**🏗️ 架构师/技术主管**

1. 先读：[ADR-020](../docs/architecture/adr/ADR-020-API-server-unified-extraction-strategy.md)（20 分钟）
2. 再读：[提取计划](./api-extraction-plan.md)（25 分钟）
3. 参考：[映射表](./api-modules-extraction-mapping.md)（5 分钟）
4. 审批：所有文档完整性
   → **总耗时**: 50 分钟

**👨‍💻 开发者/执行人**

1. 快速了解：[快速概览](./API-ARCHITECTURE-QUICK-OVERVIEW.md)（5 分钟）
2. 详细学习：[执行指南](./api-extraction-execution-guide.md)（15 分钟）
3. 快速参考：[映射表](./api-modules-extraction-mapping.md)（需要时查阅）
4. 执行：按 Phase 进行（逐个模块完成）
   → **总耗时**: 初次 20 分钟，执行中持续参考

---

## 🎯 关键概念速查

### 方案 B 核心原理

```
所有框架无关的代码都应该在 packages
所有框架特定的代码都应该在 apps
```

### 提取架构

```
packages/
├── domain-server/           (DDD 模型)
├── application-server/      (业务编排)
├── infrastructure-server/   (数据访问)
└── contracts/               (类型定义)

apps/api/
├── main.ts                  (初始化)
├── middleware/              (HTTP 中间件)
└── modules/[module]/routes.ts (HTTP 路由)
```

### 提取规模

- **当前**: 267 个 TS 文件，15,000+ 行业务逻辑在 API 项目
- **目标**: ~70 个 TS 文件，API 项目 70% 体积缩减
- **复用**: 15,000+ 行业务逻辑可被 Desktop/CLI 复用

### 执行周期

- **工作量**: ~50 小时
- **分阶段**: P0(8h) → P1(12h) → P2(10h) → P3(8h) → P4(2h)
- **验证**: 12 个模块，逐个验证

---

## 📈 预期成果

| 维度         | 改进    | 收益                                  |
| ------------ | ------- | ------------------------------------- |
| **代码复用** | ↑ 30%   | Desktop/CLI 可直接使用 API 的业务逻辑 |
| **项目体积** | ↓ 70%   | API 文件数从 267 → 70                 |
| **架构一致** | ✅ 统一 | Web/API/Desktop 使用相同分层          |
| **可维护性** | ↑ 显著  | 业务逻辑集中，框架适配分离            |
| **可测试性** | ↑ 显著  | Application Services 框架无关         |

---

## ✅ 准备状态

### 已完成

- [x] ADR-020 创建
- [x] API 代码恢复（145 文件）
- [x] 详细提取计划制定
- [x] 执行指南编写
- [x] 映射表生成
- [x] 文档索引创建

### 待处理

- [ ] 架构师/决策者批准
- [ ] 分配执行负责人
- [ ] 安排执行时间
- [ ] 从 P0 阶段启动

---

## 🔗 相关 ADR

- **[ADR-018: Smart Container + Application Service Pattern](../docs/architecture/adr/ADR-018-smart-container-application-service-pattern.md)**
  - Application Service 模式的详细说明
- **[ADR-009: Standard Clean Architecture Layers](../docs/architecture/adr/ADR-009-standard-clean-architecture-layers.md)**
  - Domain/Application/Infrastructure 分层标准

- **[ADR-016: Apps as Containers](../docs/architecture/adr/ADR-016-apps-as-containers.md)**
  - 应用项目作为容器的设计

- **[ADR-001: Application Service Framework Decoupling](../docs/adr/ADR-001-ApplicationService-Framework-Decoupling.md)**
  - Web 应用框架解耦的总结

---

## 📞 快速导航

| 需要               | 查看                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------- |
| 快速了解（5 分钟） | [快速概览](./API-ARCHITECTURE-QUICK-OVERVIEW.md)                                      |
| 完整架构设计       | [ADR-020](../docs/architecture/adr/ADR-020-API-server-unified-extraction-strategy.md) |
| 执行步骤           | [执行指南](./api-extraction-execution-guide.md)                                       |
| 文件映射           | [映射表](./api-modules-extraction-mapping.md)                                         |
| 项目进度总结       | [方案总结](./api-architecture-plan-summary.md)                                        |
| 详细提取计划       | [提取计划](./api-extraction-plan.md)                                                  |

---

## 💡 关键提示

1. **不要** 在 API 中引入 Handler/Orchestrator 中间层
   - Web 用 Composables 是框架需求
   - API 无此需求

2. **必须** 确保所有导入都指向 packages
   - 避免 API 项目内的相对路径导入

3. **逐个** 模块完成迁移
   - 每次迁移后运行 TypeScript 编译验证
   - 不要大批量操作

4. **保留** 初始化相关代码
   - 某些模块的 initialization/\*.ts 可能需要保留
   - 需要具体评估

---

**文档创建日期**: 2026-01-19  
**准备状态**: ✅ 完成  
**下一步**: 等待批准
