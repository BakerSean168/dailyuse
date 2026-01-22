---
tags:
  - guide
  - development
  - index
  - standards-alignment
description: 开发工作流程指南索引 - 与standards规范完全对齐
created: 2025-01-22T00:00:00
updated: 2025-01-22T00:00:00
---

# 📖 开发工作流程指南 (Development Guides)

> 遵循项目规范的具体操作指南
>
> **这里的所有内容都基于 [../../standards](../../standards/) 中定义的规范**

## 🎯 指南总览

本目录包含开发者日常工作的完整操作指南，与 `docs/standards/` 中的规范完全对齐。

### 📋 快速导航

| 指南                                             | 目的                   | 关联规范                                |
| ------------------------------------------------ | ---------------------- | --------------------------------------- |
| **[coding-standards.md](./coding-standards.md)** | 代码编写规范与最佳实践 | 🏷️ naming, 🏛 architecture, 🔄 patterns |
| **[git-workflow.md](./git-workflow.md)**         | Git工作流与提交规范    | 🏷️ naming                               |
| **[setup.md](./setup.md)**                       | 开发环境配置           | 🏷️ naming, 🛠️ tech-stack                |
| **[testing.md](./testing.md)**                   | 测试策略与实践         | 🏛 architecture, 🔄 patterns            |
| **[debugging.md](./debugging.md)**               | 调试技巧与工具         | 🏛 architecture                         |

---

## 🚨 核心要点速查

### 代码规范 → [coding-standards.md](./coding-standards.md)

必读的**3个核心规则**:

1. **类型集中化** - 所有共享类型放在 `@dailyuse/contracts`
2. **API格式** - 永远使用 `ok: boolean`，不用 `success: boolean`
3. **层隔离** - Domain永不导入Infrastructure，使用依赖注入

### 命名规范 → [coding-standards.md#命名约定](./coding-standards.md#命名约定)

快速参考表:

| 实体   | 风格                   | 例子              |
| ------ | ---------------------- | ----------------- |
| 类名   | PascalCase             | `UserService`     |
| 接口名 | PascalCase **无I前缀** | `TaskRepository`  |
| 方法名 | camelCase              | `createUser()`    |
| 常量   | UPPER_SNAKE            | `MAX_RETRY_COUNT` |
| 文件   | kebab-case             | `user-service.ts` |
| 文件夹 | kebab-case             | `user-profile/`   |

### Git规范 → [git-workflow.md](./git-workflow.md)

分支和提交:

```
分支: feature/xxx, bugfix/xxx, hotfix/xxx
提交: feat(goal): 添加功能描述
```

---

## 🔗 standards ↔ guides 对应关系

### 三个层面的理解

```
📐 规范层 (standards/)
  ↓ 定义项目的规则
  什么是DO/DON'T？

📖 实践层 (guides/)
  ↓ 说明如何执行
  怎样才是正确的做法？
  包含代码示例和工具

💻 代码层 (src/)
  ↓ 真实的项目代码
  遵循规范的代码
```

### 完整的对应映射

#### standards/naming.md ↔ guides/coding-standards.md

- 命名约定表 → 快速参考表 + 详细示例
- 规范说明 → 代码示例和对比

#### standards/architecture.md ↔ guides/coding-standards.md

- 分层原则 → 架构图 + 依赖表
- 规则说明 → 完整代码示例（Domain/Application/Infrastructure）

#### standards/patterns.md ↔ guides/coding-standards.md

- 核心规则 → "🚨 核心规则"章节
- 代码示例 → 完整工作示例

#### standards/tech-stack.md ↔ guides/setup.md

- 技术栈 → 工具配置说明

---

## 📚 使用场景

### 场景1：我是新开发者

**学习路径** (30分钟):

1. 阅读 [coding-standards.md#核心规则](./coding-standards.md#核心规则) (5分钟)
   - 理解3个必须遵守的规则

2. 学习 [coding-standards.md#命名约定](./coding-standards.md#命名约定) (5分钟)
   - 记住命名规则表

3. 查看 [coding-standards.md#架构与分层](./coding-standards.md#架构与分层) (10分钟)
   - 理解层隔离和依赖规则
   - 看完整的代码示例

4. 配置 [setup.md](./setup.md) (5分钟)
   - 配置IDE和工具

5. 学习 [git-workflow.md](./git-workflow.md) (5分钟)
   - 了解分支和提交规范

### 场景2：我要审查代码

**检查清单**:

- [ ] 命名是否符合 [命名约定表](./coding-standards.md#快速参考表)？
- [ ] 是否遵循了 [3个核心规则](./coding-standards.md#核心规则)？
- [ ] 是否违反了 [分层规则](./coding-standards.md#依赖规则)？
- [ ] 是否按 [架构实践](./coding-standards.md#正确的架构实践) 来写的？

参考：

- 需要具体案例 → 查看 [coding-standards.md](./coding-standards.md)
- 需要规范依据 → 查看 [../../standards](../../standards/)

### 场景3：规范更新

**更新流程**:

1. 规范在 `standards/` 中改变
   - 更新 `standards/*.md`

2. 在 `guides/` 中更新对应内容
   - 查找关联的指南文件
   - 更新代码示例
   - 确保链接有效

3. 确保代码项目也更新
   - 在代码审查时强制执行新规范

---

## 📊 文档统计

- 📝 总文档数: 6 (包括本文件)
- 📄 总行数: ~4,000 行
- 🔗 与standards的交叉引用: 20+
- 💻 代码示例: 50+

---

## 🤝 参与和反馈

### 发现问题或不一致?

1. 检查是否有对应的 [../../standards](../../standards/) 文件
2. 如果指南与规范不一致，提交Issue
3. 标签: `documentation`, `standards-alignment`

### 改进建议?

1. 提交PR或Issue
2. 确保更新既有 `guides/` 又有 `standards/`
3. 更新 [STANDARDS_ALIGNMENT_LOG.md](./STANDARDS_ALIGNMENT_LOG.md)

---

## 🔄 更新日志

**最后更新**: 2025-01-22 - 完全对齐standards规范 ✅

- ✅ 所有指南都有standards引用
- ✅ 所有核心规则都有代码示例
- ✅ 所有命名规则都有快速参考表
- ✅ 所有架构原则都有图示和示例

详见: [STANDARDS_ALIGNMENT_LOG.md](./STANDARDS_ALIGNMENT_LOG.md)

---

**相关文档**:

- 📐 [规范索引](../../standards/index.md)
- 📖 [规范与指南整合说明](../../standards/INTEGRATION_GUIDE.md)
- 📊 [规范快速参考](../../standards/QUICK_REFERENCE.md)
