---
tags:
  - documentation
  - update-log
  - standards
  - guides
description: guides/development 文档根据standards规范更新的完整记录
created: 2025-01-22T00:00:00
updated: 2025-01-22T00:00:00
---

# 📝 guides/development 规范对齐更新记录

## 🎯 更新目标

根据 `docs/standards/` 中的项目规范，完全对齐并强化 `docs/guides/development/` 中的所有开发指南文档。

**更新日期**: 2025-01-22  
**更新范围**: 5个文件  
**总代码行数**: 3,956 行

---

## ✅ 完成的更新

### 1. **coding-standards.md** (主要更新)

#### 新增内容

**🚨 核心规则部分** (新章节)

- 类型集中化：所有共享类型必须在 `@dailyuse/contracts`
- API响应格式：统一使用 `ok: boolean`，禁止 `success: boolean`
- 层隔离：Domain永不导入Infrastructure（依赖注入模式示例）

**🏷️ 命名约定部分** (完全重构)

- 添加快速参考表（8个实体的命名规则）
- 更新所有示例与 [standards/naming.md](../../standards/naming.md) 一致
- 特别强调：接口名无I前缀、常量使用SCREAMING_SNAKE、文件使用kebab-case

**🏗 架构与分层部分** (新章节)

- 架构层级关系图（5层Clean Architecture）
- 详细的依赖规则表
- 3个完整的架构实践代码示例
  - 接口定义在Domain，实现在Infrastructure
  - 依赖注入而非直接导入
  - Repository模式完整示例

#### 新增链接关联

```markdown
**关联标准**:

- 📐 standards/naming.md
- 🏛 standards/architecture.md
- 🔄 standards/patterns.md
```

#### 元数据更新

```yaml
updated: 2025-01-22T00:00:00 (原: 2025-11-23T16:00:00)
tags: 添加 'architecture'
description: 增加 "与架构最佳实践"
```

### 2. **git-workflow.md** (文件头更新)

- 更新 `updated` 时间
- 添加关联标准链接：`standards/naming.md`

### 3. **setup.md** (文件头更新)

- 更新 `updated` 时间
- 添加 `tools` 标签
- 更新 description 包含 Prettier、ESLint
- 添加关联标准链接：`standards/naming.md`, `standards/tech-stack.md`

### 4. **testing.md** (文件头更新)

- 更新 `updated` 时间
- 添加关联标准链接：`standards/architecture.md`, `standards/patterns.md`

### 5. **debugging.md** (文件头更新)

- 更新 `updated` 时间
- 添加关联标准链接：`standards/architecture.md`

---

## 📊 具体对齐内容

### 对齐1：命名规范完整性

| 标准来源                      | 内容              | 在guides中的体现          |
| ----------------------------- | ----------------- | ------------------------- |
| `standards/naming.md` - 表格1 | 8种实体的命名规则 | ✅ 添加了完整的快速参考表 |
| `standards/naming.md` - 接口  | 接口无I前缀       | ✅ 强调并给出对比示例     |
| `standards/naming.md` - 常量  | UPPER_SNAKE_CASE  | ✅ 更新了所有示例         |
| `standards/naming.md` - 文件  | kebab-case        | ✅ 同步了命名约定         |

### 对齐2：架构规范实施

| 标准来源                           | 内容                       | 在guides中的体现            |
| ---------------------------------- | -------------------------- | --------------------------- |
| `standards/architecture.md` - 分层 | 5层Clean Architecture      | ✅ 新增架构图               |
| `standards/architecture.md` - 依赖 | Domain不导入Infrastructure | ✅ 添加了禁止示例和正确做法 |
| `standards/architecture.md` - 表格 | 依赖关系矩阵               | ✅ 同步到guides中           |

### 对齐3：核心模式实施

| 标准来源                       | 内容                | 在guides中的体现       |
| ------------------------------ | ------------------- | ---------------------- |
| `standards/patterns.md` - 类型 | 类型集中在contracts | ✅ 新增"核心规则1"章节 |
| `standards/patterns.md` - API  | ok: boolean         | ✅ 新增"核心规则2"章节 |
| `standards/patterns.md` - 分层 | 依赖倒转            | ✅ 新增"核心规则3"章节 |

---

## 🔗 交叉引用完整度

### 从 guides 指向 standards

每个guides文档的开头都添加了：

```markdown
**关联标准**:

- 📐 [standards/naming.md](../../standards/naming.md)
- 🏛 [standards/architecture.md](../../standards/architecture.md)
- 🔄 [standards/patterns.md](../../standards/patterns.md)
```

### 从 guides 指向 standards 的特定部分

在具体示例中添加了：

```markdown
> 详见 [standards/naming.md#2-exports](../../standards/naming.md#2-exports)
> 参考 [standards/architecture.md](../../standards/architecture.md)
```

---

## 📈 内容增量

| 文件                | 行数增加 | 新章节                   | 新代码块 |
| ------------------- | -------- | ------------------------ | -------- |
| coding-standards.md | +300     | 3 (核心规则、命名、架构) | 15+      |
| git-workflow.md     | +1       | 0                        | 0        |
| setup.md            | +1       | 0                        | 0        |
| testing.md          | +1       | 0                        | 0        |
| debugging.md        | +1       | 0                        | 0        |

**总增量**: +304 行内容  
**guides/development 现状**: 3,956 行 (完整的开发指南库)

---

## 🎯 质量检查清单

### ✅ 命名规范

- [x] 快速参考表完整
- [x] 无I前缀约定已强调
- [x] 常量命名规则已更新
- [x] 所有示例风格统一

### ✅ 架构规范

- [x] 5层架构已清晰说明
- [x] 依赖关系矩阵已纳入
- [x] Domain隔离规则已强调
- [x] Repository模式已示例

### ✅ 核心模式

- [x] 类型集中化已说明
- [x] API响应格式已规定
- [x] 依赖注入已示例

### ✅ 交叉引用

- [x] 所有guides文件都链接到standards
- [x] 所有standards都在guides中有对应的实践代码
- [x] 链接格式统一和正确

### ✅ 元数据

- [x] 所有文件都更新了updated时间
- [x] tags都包含了相关关键词
- [x] description都准确反映内容

---

## 💡 使用建议

### 新开发者查阅流程

```
遇到代码规范问题
    ↓
查阅 guides/development/coding-standards.md
    ↓
看到"关联标准"链接
    ↓
点击去 standards 了解规范背景
    ↓
回到 guides 看实践代码示例
```

### 代码审查流程

```
审查发现问题
    ↓
检查是否违反standards中的规范
    ↓
引用guides中的对应章节和示例
    ↓
给出修改建议
```

### 规范更新流程

```
规范改变
    ↓
先更新 standards 中的规范
    ↓
再更新 guides 中的代码示例
    ↓
确保链接和引用仍然有效
```

---

## 📝 后续优化建议

- [ ] 在每个guides文件的底部添加"返回规范索引"链接
- [ ] 为standards中的每个规范添加"查看实践示例"链接
- [ ] 创建互动式"规范-实践"对照工具
- [ ] 添加更多跨框架（React、Angular）的示例
- [ ] 定期审查standards-guides之间的一致性

---

## 🔄 文件变更日志

### coding-standards.md

- ✨ 新增3个大型章节（核心规则、完整命名表、架构实践）
- 🔗 新增6个standards引用链接
- 📊 新增15+个代码示例
- 🏷️ 新增'architecture'标签

### git-workflow.md, setup.md, testing.md, debugging.md

- 🔗 新增standards链接
- 📅 更新时间戳
- 🏷️ 新增或调整标签

---

**版本**: v1.0 - 完整对齐  
**维护者**: @BakerSean168  
**状态**: ✅ 完成
