---
tags:
  - reference
  - quick-guide
  - standards
description: 快速参考 - standards 和 guides/development 的对比与导航
created: 2025-01-22T00:00:00
updated: 2025-01-22T00:00:00
---

# 📊 规范指南快速参考卡

## 一页纸对比

| 维度         | `docs/standards/`       | `docs/guides/development/` |
| ------------ | ----------------------- | -------------------------- |
| **定位**     | 系统规则库              | 操作指南                   |
| **强调**     | **是什么** / **为什么** | **怎么做** / **技巧**      |
| **特点**     | 规则性强、相对稳定      | 可操作性强、示例丰富       |
| **目标读者** | 所有开发者              | 实施开发者                 |
| **更新频率** | 低（主要决策变化）      | 中（工具/工作流更新）      |
| **审查方向** | ←架构师验证←            | →开发者参考→               |

## 文件对应关系

```
📐 规范层 (standards/)          📖 实践层 (guides/development/)
├── architecture.md      ←→    ├── coding-standards.md
├── naming.md           ←→    ├── coding-standards.md
├── patterns.md         ←→    ├── coding-standards.md
├── structure.md        ←→    ├── setup.md
├── tech-stack.md       ←→    ├── setup.md
└── contracts-structure.md      └── coding-standards.md
```

## 常见问题速查

### 我需要...

| 需求             | 访问                                                               |
| ---------------- | ------------------------------------------------------------------ |
| 学习项目架构原则 | `standards/architecture.md`                                        |
| 看架构代码示例   | `guides/development/coding-standards.md`                           |
| 知道怎么命名变量 | `standards/naming.md` + `guides/development/coding-standards.md`   |
| 学习设计模式     | `standards/patterns.md` + `guides/development/coding-standards.md` |
| 配置开发环境     | `guides/development/setup.md`                                      |
| 了解Git工作流    | `guides/development/git-workflow.md`                               |
| 写单元测试       | `guides/development/testing.md`                                    |
| 调试代码         | `guides/development/debugging.md`                                  |
| 理解技术栈约束   | `standards/tech-stack.md` + `guides/development/setup.md`          |
| 看代码审查要点   | `standards/` 所有文件 + `guides/development/coding-standards.md`   |

## 学习路径

### 👨‍💻 新手开发者 (30分钟)

```
Day 1:
  1. standards/index.md (5分钟，了解全景)
  2. standards/architecture.md (10分钟，理解分层)
  3. standards/naming.md (5分钟，学会命名)
  4. guides/development/setup.md (10分钟，配置环境)

Day 2:
  5. guides/development/coding-standards.md (20分钟，看代码示例)
  6. guides/development/git-workflow.md (10分钟，学Git规范)
```

### 🏗️ 架构师 (20分钟)

```
  1. standards/index.md (5分钟)
  2. standards/architecture.md (10分钟)
  3. standards/patterns.md (5分钟)
```

### 💻 高级开发者 (15分钟)

```
  1. standards/naming.md (5分钟)
  2. standards/patterns.md (5分钟)
  3. guides/development/coding-standards.md (5分钟)
```

## 修改检查清单

**我想修改某个规范**

- [ ] 更新 `standards/` 中对应的文件
- [ ] 更新 `guides/development/` 中对应的代码示例
- [ ] 如果涉及架构，通知架构师审核
- [ ] 更新本快速参考卡
- [ ] 通知全体开发者

## 关键链接

- 📋 [完整整合指南](./INTEGRATION_GUIDE.md)
- 📚 [规范索引](./index.md)
- 🛠️ [开发指南目录](../guides/development/)

---

**版本**: v1.0  
**最后更新**: 2025-01-22
