---
tags:
  - standards
  - guides
  - documentation
  - architecture
description: standards 和 guides/development 目录的整合说明与导航指南
created: 2025-01-22T00:00:00
updated: 2025-01-22T00:00:00
---

# 📐 规范与指南整合说明

本文档说明 `docs/standards/` 和 `docs/guides/development/` 两个目录的关系、各自的职责，以及如何使用它们。

## 🎯 核心概念

```
┌─────────────────────────────────────┐
│  standards/  "系统规则库"            │
│  ────────────────────────────      │
│  项目的基础规则与约束条件           │
│  ✅ DO: 遵循这些规则                 │
│  ❌ DON'T: 打破这些原则              │
│                                      │
│  包含: 架构原则、命名约定、         │
│       设计模式、技术栈约束          │
└─────────────────────────────────────┘
             ▲
             │ 实现规则
             │
┌─────────────────────────────────────┐
│ guides/development/ "操作指南"      │
│ ────────────────────────────────    │
│ 如何在实践中遵循规范                 │
│ ✅ HOW: 具体的操作步骤               │
│ 💡 TIPS: 最佳实践与技巧             │
│                                      │
│ 包含: 编码规范、工作流程、          │
│      测试方法、调试技巧              │
└─────────────────────────────────────┘
```

## 📋 目录结构与职责

### `docs/standards/` - 系统规则库

**职责**: 定义项目的基本规则和约束

| 文件                       | 内容             | 用途                          |
| -------------------------- | ---------------- | ----------------------------- |
| **index.md**               | 📋 规范导航      | 快速查找                      |
| **architecture.md**        | 🏛 架构规范      | 理解分层、依赖关系、DDD原则   |
| **naming.md**              | 🏷️ 命名规范      | 对标 - 类、变量、文件、文件夹 |
| **structure.md**           | 📂 目录结构      | 了解包组织和层级关系          |
| **patterns.md**            | 🔄 代码模式      | 学习推荐模式和反模式          |
| **contracts-structure.md** | 📦 Contracts组织 | 类型契约层的结构              |
| **tech-stack.md**          | 🛠️ 技术栈约束    | 允许/禁止的库和版本           |

**特点**:

- ✅ 规则性强 - 项目必须遵守
- ✅ 相对稳定 - 不经常变化
- ✅ 概念性 - 强调"是什么"和"为什么"

### `docs/guides/development/` - 操作指南

**职责**: 指导开发者如何遵循规范的具体步骤

| 文件                    | 内容         | 用途                                |
| ----------------------- | ------------ | ----------------------------------- |
| **setup.md**            | 🛠 开发环境  | 配置IDE和开发工具                   |
| **coding-standards.md** | 📝 编码规范  | TypeScript、Vue 3、Express 代码示例 |
| **git-workflow.md**     | 🌿 Git工作流 | 分支策略、提交规范、PR流程          |
| **testing.md**          | 🧪 测试指南  | 如何编写单元测试、集成测试、E2E测试 |
| **debugging.md**        | 🐛 调试指南  | 调试技巧、工具使用、常见问题排查    |

**特点**:

- ✅ 可操作性强 - 包含具体的操作步骤
- ✅ 代码示例丰富 - 有实际的代码片段
- ✅ 技能导向 - 强调"怎么做"

## 🔗 两者的关系

### 架构为基础，工作流为落地

```
规范层面 (standards/)
    ↓
    基础架构原则
    ↙     ↓     ↖
  命名   模式   结构
    ↓
工作流程层面 (guides/development/)
    ↓
    具体实施步骤
    ↙     ↓     ↖
  编码  Git  测试
```

### 示例：命名规范的两个层面

**📐 规范层面** (`standards/naming.md`):

```
✅ 类名: PascalCase (TaskManager)
✅ 方法名: camelCase (createTask)
✅ 常量: UPPER_SNAKE_CASE (MAX_RETRY)
❌ 混合风格
```

**📖 实践层面** (`guides/development/coding-standards.md`):

```typescript
// ✅ 好的例子
export class TaskManager {
  private readonly MAX_RETRY = 3;

  public createTask(name: string): void {
    // ...
  }
}

// ❌ 避免
export class task_manager {
  private readonly maxRetry = 3;

  public create_task(name: string): void {
    // ...
  }
}
```

## 👥 角色导航

### 我是新开发者

**学习路径**:

1. 先读 `standards/` 理解项目的"规则" - **15分钟**
2. 再读 `guides/development/` 学习"怎么做" - **30分钟**
3. 查看代码示例对照学习 - **自我练习**

**推荐顺序**:

```
standards/index.md
    ↓
standards/architecture.md (理解分层)
    ↓
standards/naming.md (学会命名)
    ↓
guides/development/setup.md (配置环境)
    ↓
guides/development/coding-standards.md (编码规范)
    ↓
guides/development/git-workflow.md (Git工作流)
```

### 我是架构师

**关注重点**:

- 📐 `standards/architecture.md` - 深入了解架构决策
- 🏛️ `standards/patterns.md` - 设计模式和最佳实践
- 📂 `standards/structure.md` - 代码组织

### 我是高级开发者

**关注重点**:

- 🏷️ `standards/naming.md` - 命名标准
- 📝 `guides/development/coding-standards.md` - 编码细节
- 🌿 `guides/development/git-workflow.md` - Git工作流

### 我是贡献者

**必读清单**:

- ✅ `standards/` 所有文件 - 理解项目规则
- ✅ `guides/development/git-workflow.md` - 贡献流程
- ✅ `guides/development/coding-standards.md` - 代码质量

## 🎯 常见问题

### Q: 我应该读哪个文件？

**A**: 依赖你的目标:

| 我想...          | 查看这个                                 |
| ---------------- | ---------------------------------------- |
| 快速了解项目规则 | `standards/index.md`                     |
| 学习架构原则     | `standards/architecture.md`              |
| 知道如何命名     | `standards/naming.md`                    |
| 看代码示例       | `guides/development/coding-standards.md` |
| 学习测试方法     | `guides/development/testing.md`          |
| 了解Git流程      | `guides/development/git-workflow.md`     |

### Q: 两个目录有重复吗？

**A**: 有一些概念上的重复是正常的（如命名规范），这是为了让每个文件自成体系。

- `standards/naming.md` - 规则本身 (**\*是什么**)
- `guides/development/coding-standards.md` - 实践示例 (**怎么用**)

### Q: 修改规范时要改两个文件吗？

**A**: 是的。修改流程:

1. **先更新规范** (`standards/`)
2. **再更新实践指南** (`guides/development/`)
3. **更新相关的代码** (src/)

## 📚 使用场景

### 场景 1: 审查新加入团队成员的代码

```
我需要检查代码是否符合规范:

1. 引用 standards/naming.md ← 检查命名
2. 引用 standards/architecture.md ← 检查分层
3. 引用 standards/patterns.md ← 检查设计模式
4. 给出改进建议，参考 guides/development/coding-standards.md
```

### 场景 2: 解决代码审查意见

```
评审意见: "违反了依赖倒转原则"

开发者的做法:
1. 查阅 standards/architecture.md (理解原则)
2. 参考 guides/development/coding-standards.md (学习示例)
3. 修改代码
4. 参考 guides/development/git-workflow.md (提交代码)
```

### 场景 3: 新功能开发

```
开发新功能的规范检查清单:

□ 阅读 standards/naming.md (命名)
□ 阅读 standards/architecture.md (分层)
□ 参考 guides/development/coding-standards.md (编码)
□ 参考 guides/development/testing.md (测试)
□ 参考 guides/development/git-workflow.md (提交)
```

## 🔍 快速查询表

当你知道"想要什么"但不知道"在哪个文件"时，使用此表:

| 我想知道...  | standards/      | guides/development/ |
| ------------ | --------------- | ------------------- |
| **命名规则** | naming.md       | coding-standards.md |
| **架构原则** | architecture.md | -                   |
| **代码示例** | -               | coding-standards.md |
| **设计模式** | patterns.md     | coding-standards.md |
| **Git规范**  | -               | git-workflow.md     |
| **测试方法** | -               | testing.md          |
| **技术栈**   | tech-stack.md   | setup.md            |
| **依赖关系** | architecture.md | -                   |
| **目录结构** | structure.md    | -                   |

## 📝 维护指南

### 什么时候应该修改规范？

**修改 `standards/`**:

- 架构原则有重大变化
- 技术栈升级
- 命名规范调整
- 新的设计模式被采纳

**修改 `guides/development/`**:

- 新工具加入
- 工作流程优化
- 代码示例需要更新
- 最佳实践调整

### 修改检查清单

修改规范时:

- [ ] 更新受影响的所有相关文件
- [ ] 确保两个层面保持一致
- [ ] 更新本文档的"快速查询表"
- [ ] 通知所有开发者
- [ ] 更新 `standards/index.md` 的版本信息

---

**相关文档**:

- [📋 规范索引](./index.md)
- [📝 代码规范](../guides/development/coding-standards.md)
- [🏛 架构规范](./architecture.md)
- [🌿 Git工作流](../guides/development/git-workflow.md)
