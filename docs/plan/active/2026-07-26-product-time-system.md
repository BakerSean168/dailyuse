---
tags:
  - plan
  - active
  - time
  - architecture
  - contracts
description: 产品时间体系实施计划（ADR-037）——@dailyuse/time、Transfer≡Instant、DomainDate 退役
created: 2026-07-26T00:00:00
updated: 2026-07-26T12:00:00
---

# 产品时间体系实施计划

## 1. 文档地位

| 角色 | 文档 |
|------|------|
| **宪法（已采纳）** | [`../../architecture/adr/ADR-037-product-time-system.md`](../../architecture/adr/ADR-037-product-time-system.md) |
| **详设** | [`../../architecture/product-time-system.md`](../../architecture/product-time-system.md) |
| **本文件** | 实施波次、完成定义、与 elegance 边界 |
| **Goal 提示词** | [`./2026-07-26-product-time-system-goal-prompt.md`](./2026-07-26-product-time-system-goal-prompt.md) |
| 并行 | elegance foundation（dual 税）；**不**用 dual 刷数代替本 plan |

真值：代码/配置/测试 > ADR-037 > 本 plan。

## 2. 目标

按 ADR-037 **高质量、长期**落地产品时间体系：

1. `@dailyuse/time` 成为唯一产品时间入口  
2. `TransferDate` ≡ 品牌 `Instant`；`Ymd`/`Hm` 一等  
3. `DomainDate = Date` 退役路径可执行；新字段禁止  
4. 展示/表单走 Style；领域走 Clock/Calendar/Codec  
5. lint 断供 date-fns 直连与组件私有 format  

## 3. 非目标

- 第一版多用户业务时区  
- 恢复 PersistenceDate  
- force-merge 真异语义  
- 宣称 agent-host §20  
- micro dual 狂欢  

## 4. 波次与完成定义

与详设 §9 对齐：

| 波次 | 完成定义 | 状态 |
|------|----------|------|
| W0 | 包骨架 + 最小 Facade/Style/Clock/Codec/format.hm + 引擎；样例测试 | 待办 |
| W1 | primitives brand Instant≡TransferDate；Codec 文档化 | 待办 |
| W2 | app-vue format sole 上提；主路径改 import | 待办 |
| W3 | ESLint 断供 date-fns（error + legacy） | 待办 |
| W4 | 组件/React 私有 format 清零 | 待办 |
| W5 | 高优先级 Ymd 字段（生日/全天） | 待办 |
| W6 | 核心 VO DomainDate getter → Instant | 待办 |
| W7 | 删 legacy / utils date 旧 API | 待办 |
| W8 | Style ↔ presentation preference | 待办 |

## 5. 质量门禁（每波）

- 最近 `pnpm nx` test（time + 触及包）  
- 相关 surface  
- 触及治理/docs 时 `daily-use:governance-check`  
- 不提交密钥与 Playwright 产物  
- residual 记本 plan §7  

## 6. 决策摘要（不可在实施中弱化）

1. 质量优先于「少改几行」  
2. Transfer ≡ Instant；DomainDate 长期删除  
3. 日历日用 Ymd，不用午夜 Date  
4. 真门面 + Style，禁止假 re-export  
5. 双 shape 仅语义差，不换皮  

## 7. Residual

| ID | 日期 | 说明 | 结果 |
|----|------|------|------|
| T0 | 2026-07-26 | ADR-037 + 详设 + 本 plan 入库 | 文档 |
| T0b | 2026-07-26 | Goal 完整/简易提示词入库（新会话实施入口） | 文档 |

## 8. 开跑提示

- **完整 Goal（新会话整段）：** [`2026-07-26-product-time-system-goal-prompt.md`](./2026-07-26-product-time-system-goal-prompt.md) § 完整 Goal 提示词  
- **简易：** 同文件 § 简易提示词 A/B/C  

```text
按 docs/plan/active/2026-07-26-product-time-system-goal-prompt.md 实施 ADR-037；从 W0 起写代码。
```
