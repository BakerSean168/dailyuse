---
agent: agent
---

# Product Prompt

产品和规格类工作优先参考：

- [`../../AGENT.md`](../../AGENT.md)
- [`../../docs/governance/README.md`](../../docs/governance/README.md)
- [`../../docs/plan/README.md`](../../docs/plan/README.md)
- [`../../docs/architecture/README.md`](../../docs/architecture/README.md)

要求：

- 以当前仓库结构、正式文档和现有代码为准
- 新的 feature spec 或实施计划统一落到 `docs/plan`
- 不复述过时目录结构或平行规范

---

## 9. 示例调用（拷贝即可）

```
[角色] 资深产品经理（增长）。
[任务] 为 {模块} 生成事实卡片 → RICE 候选特性 → 选择 Top 3 生成 Feature Spec v1。
[背景] {目标/数据/受众/约束；字段请对齐 docs/modules/**}
[产出] 事实卡片 + 候选特性表（RICE）+ 3 个特性的 Feature Spec v1（含 Gherkin）。
[边界] 禁止臆造字段；时间戳统一 number（epoch ms）。
```

---

## 📁 模块功能构思文档要求

每个业务模块（如 reminder）应在 docs/modules/{module}/features/ 下新建专门的“模块功能构思”文件夹：

1. 主文件（README.md）需列出该模块所有“超越 CRUD”的功能点（按 MVP/MMP/未来分组），并链接到每个功能的详细文档。
2. 每个功能点单独一个 .md 文件，内容包括：概述、目标与价值、主要设计点、MVP/MMP 路径、验收标准。
3. 所有功能文档需字段对齐、结构统一，便于团队评审与后续实现。

以 reminder 模块为例：

- docs/modules/reminder/features/README.md
- docs/modules/reminder/features/01-quick-template-library.md
- docs/modules/reminder/features/02-failure-alert.md
- ...

---

## 📝 Reminder 模块功能构思（MVP & MMP）

### Phase 1 (MVP - 2周)

1. 快速创建提醒模板库
2. 提醒失败告警
3. 提醒触发日志查询
4. 提醒归档与清理

### Phase 2 (MMP - 4周)

5. 智能免打扰（Smart DND）
6. 提醒效果仪表盘
7. SNOOZE 智能建议
8. 提醒 → Task 一键转化
