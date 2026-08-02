# ADR-005: UI 包多框架支持架构

**状态**: ✅ 已采纳

**日期**: 2025-12-03

**修订**: 2026-08-01（Vue primitive 单一实现）

**决策者**: BMAD Agent

## 背景

工作区同时存在 Web、Desktop 以及不同 UI 宿主。通用交互逻辑如果直接写死在单一框架组件里，会让跨端复用、演进和测试都变得昂贵。

## 决策

采用“核心无框架 + 框架适配层”的 UI 包分层：

- `ui-core` 承载无框架的 headless 逻辑与共享抽象
- Vue 侧通过专门适配层消费 `ui-core`
- React Native 等其他前端宿主按需提供各自适配层
- 业务规则仍留在领域包或应用层，不进入 UI 共享包

Vue primitive 的唯一 **Module** 是 `@memoflow/ui-vue-shadcn`：

- `reka-ui@2.10.1` 是当前唯一 **Implementation**；业务源码不得直接依赖 vendor。
- wrapper 的 **Interface** 统一 `modelValue`、open、disabled、portal、事件与焦点恢复语义。
- 真实挂载 contract tests 覆盖 Select、Dialog、Dropdown、Popover、Tabs 的键盘、动态卸载和焦点行为。
- governance 要求 `radix-vue` 零依赖/零 import，且 primitive 包外 `reka-ui` 零直接 import。
- 桌面分栏统一通过几何函数与 token 计算：AI 硬下限 320px，业务硬下限 520px，业务默认占可用区 64%；无法同时满足时进入 focus/overlay。
- 业务入口收敛为 BusinessPanel Tab 与统一 launcher，不再维护常驻胶囊和 Tab 两套导航。

## 结果

- UI 复用边界更清晰
- 多前端宿主可以共享核心交互逻辑
- 共享 UI 包不会反向携带领域业务规则

## 相关 ADR

- ADR-001: 使用 Nx Monorepo
- ADR-004: Electron 桌面应用架构与包提取策略
