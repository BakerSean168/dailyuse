---
tags:
  - plan
  - archive
  - docker
  - product-review
  - ux
description: 最新 main 的本机 Docker 部署与核心业务、AI 桌面交互复审
created: 2026-07-31T00:00:00
updated: 2026-07-31T20:38:00
status: completed
---

# 最新 main 本机 Docker 产品复审

## 完成结果

- prod-like 本机 Docker 六个服务均 healthy。
- 修复了机器隔离端口未同步 API/AI CORS 的部署问题。
- 修复了 migration-less schema push 跳过 goal-record source correlation 的启动问题。
- 完成注册、目标、任务、提醒、日程和 AI 工作区真实浏览器复审。
- 定向 P0 自动化通过；手工补充路径发现后补 KR 的目标绑定会触发面板崩溃。
- 分级 findings、截图与产品建议见
  [`docs/audit/2026-07-31-local-docker-product-review.md`](../../audit/2026-07-31-local-docker-product-review.md)。
- `pm-review-` 与 `pm-phase-` 临时账号及其级联业务数据已清理。

## 原目标

基于 `main` 最新提交构建 prod-like 本机 Docker 环境，以产品经理视角验证
MemoFlow 是否能让普通用户不依赖 AI 完成目标、任务、提醒与日程的核心工作，
并单独检查 AI 工作区是否形成接近 ChatGPT/Codex 桌面端的清晰面板交互。

本轮不是 PR readiness 验证，不以“测试通过”代替产品可用性结论。

## 环境与证据

- 基线：`main` / `origin/main`
- 部署入口：`pnpm runtime:preflight:local-docker`、`pnpm docker:local:up`
- Web：`http://localhost:12137`
- API：`http://localhost:12136`
- 浏览器：真实页面交互、截图与可访问性树
- Docker：容器健康、端口、镜像 revision 和当前 Web 请求命中

## 审查范围

1. 首次使用、注册与登录后的导航理解成本。
2. 目标创建、关键结果、进度反馈和后续行动可发现性。
3. 任务创建、计划、完成、关联目标与状态反馈。
4. 提醒创建、触发条件、重复规则和用户预期。
5. 日程创建、浏览、编辑以及任务/提醒之间的边界。
6. 页面层级、信息密度、文案、空状态、错误恢复、键盘与小视口。
7. AI 工作区的标签栏、面板切换、间距、输入区、会话层级和桌面感；
   以用户提供的 ChatGPT/Codex 截图作为视觉与交互参考，不审查模型质量。

## 判定标准

- **业务满足度**：用户是否能完成真实目的，而非仅成功写入数据。
- **可发现性**：下一步是否明确，核心动作是否无需猜测。
- **一致性**：跨首页、列表、详情和编辑后的状态是否一致。
- **优雅性**：布局是否克制、层级是否清楚、操作是否保持上下文。
- **可恢复性**：错误、空数据和中断后是否能继续而不丢失输入。

## 执行状态

- [x] 确认工作区为同步的最新 `main`。
- [x] 完成本机 Docker 构建与健康验证。
- [x] 完成非 AI 核心业务旅程复审。
- [x] 完成 AI 工作区桌面交互复审。
- [x] 输出分级 findings、证据和产品建议。
