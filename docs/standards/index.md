---
tags:
  - standards
  - index
  - reference
description: DailyUse项目规范索引 - 项目的系统规则库
created: 2025-01-22T00:00:00
updated: 2025-01-22T00:00:00
---

# Project Standards & Context

> **CRITICAL INSTRUCTION FOR AGENTS:**
> You are working on the **DailyUse** project. These documents are your **Source of Truth**.
> You MUST align all your code generation, refactoring, and analysis with the rules defined below.

## 📚 Standards Library (系统规则库)

项目的基础规则与约束条件。所有开发者**必须**遵循这些规范。

### 🎯 核心规范

1. [**🏛 Architecture & Layers**](./architecture.md)
   - Clean Architecture分层规则、依赖关系图、DDD原则
2. [**📂 Directory Structure**](./structure.md)
   - 代码放在哪里？单体结构、包组织、层级关系
3. [**🏷️ Naming Conventions**](./naming.md)
   - 文件、类、变量、文件夹的命名规则
4. [**🔄 Patterns & Anti-Patterns**](./patterns.md)
   - 推荐做法与禁止事项、代码示例
5. [**🛠️ Tech Stack**](./tech-stack.md)
   - 允许/禁止的库、版本约束、使用限制
6. [**📦 Contracts Structure**](./contracts-structure.md)
   - 类型契约层 (`@dailyuse/contracts`) 的组织方式

### 🔗 整合与导航

- [**📐 整合说明**](./INTEGRATION_GUIDE.md) - `standards/` 和 `guides/development/` 的关系与使用指南
- [**🔍 快速查询表**](./INTEGRATION_GUIDE.md#-快速查询表) - 知道想要什么但不知道在哪个文件

## 🚀 Quick Rules Summary (快速规则总结)

- **Types**: Always in `packages/contracts`.
- **API**: Always `ok: boolean`.
- **Layers**: Domain never imports Infra.
- **Naming**: PascalCase for classes, camelCase for methods
- **Structure**: Follow the monorepo pattern in `structure.md`

## 📖 相关文档

### Governance 活文档

governance 模块作为项目的**代码活文档**，展示了全部 DDD 最佳实践。

- [🏛 Governance 活文档入口](../governance/README.md) — 模块入口与学习路径
- [⚡ Governance 快速参考卡](../governance/QUICK_REFERENCE.md) — 一页式分层与改动入口
- [🛠 Governance 变更手册](../governance/CHANGE_PLAYBOOK.md) — 常见改动的最短路径
- [🧭 Governance 决策记录](../governance/DECISIONS.md) — 关键设计选择与边界说明

### 实践指南 (How-to Guides)

遵循规范的具体操作步骤 - 查看 [📖 guides/development/](../guides/development/)

- [📝 Coding Standards](../guides/development/coding-standards.md) - TypeScript、Vue 3、Express 编码示例
- [🌿 Git Workflow](../guides/development/git-workflow.md) - 分支策略、提交规范
- [🧪 Testing Guide](../guides/development/testing.md) - 测试方法与实践
- [🐛 Debugging Guide](../guides/development/debugging.md) - 调试技巧

### 架构决策记录

- [📝 ADR Index](../architecture/adr/README.md) - 重要的架构决策记录
