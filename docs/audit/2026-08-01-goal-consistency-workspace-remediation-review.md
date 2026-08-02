---
tags:
  - audit
  - goal
  - task
  - workspace
  - docker
description: Goal/KR/Task 一致性与桌面工作区长期重构的最终本地产品复审
created: 2026-08-01T22:05:00+08:00
updated: 2026-08-01T22:05:00+08:00
---

# Goal 一致性与桌面工作区最终复审

## 结论

本轮长期重构的完成门槛已满足。“目标 → KR → 任务 → 进度”组合链路在最新本地 Docker 镜像中通过真实浏览器旅程、崩溃恢复集成测试和人工复审；原审查中的 P0/P1 不再复现。Reka UI 单栈、ID-only Task 绑定、Goal 原子命令/receipt、Task outbox 幂等贡献、AI 默认供应商不变量、单导航与业务主面板均已进入最终镜像。

## 原问题复验

| 原问题                                                   | 最终结果                                                                                              |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 后补 KR 后在 Task 中关联导致 Select focus 崩溃、草稿丢失 | Docker Phase A/B 通过；真实 Reka Select 连续切换绑定无异常，草稿保持                                  |
| 未点内部“添加关键结果”的有效 KR 被丢弃                   | 人工复审直接提交末行 KR，列表立即显示 `0/1 个关键结果`                                                |
| 首次进度记录/Goal 摘要不同步                             | Goal mutation receipt 原子合并；Docker Phase A 与 projection tests 通过                               |
| 多个未配置 AI provider 同时显示默认                      | 未配置 Gemini/OpenRouter/OpenAI 均只显示“尚未接入”；数据库保证每 identity 至多一个已配置默认 provider |
| AI 区过宽、业务区被挤压、双重导航                        | 统一 launcher + 业务 Tab；1280×900 实测约 260/367/653，125%/150% 使用确定性收起/聚焦态                |
| 自定义控件缺少键盘/辅助名称                              | axe、纯键盘产品旅程、primitive contract 与 AST governance 通过                                        |

## 人工复审新增并修复的问题

人工执行“Goal 详情 → Goal 列表 → 新建目标”时发现 DOM 中曾同时存在两份 `GoalDialog`。根因是 AppShell KeepAlive 使用叶子路由名分 key，使旧 `GoalModuleLayout` 留在缓存中继续监听同一 query。

缓存身份现改为“Tab ID + AppShell 后第一个真正渲染 default component 的 matched record”：Goal 的列表/详情复用唯一 ModuleLayout；没有父级 layout 的 Task 列表/详情仍按不同叶子组件分离。专项测试覆盖两种路由形态；最终镜像人工断言为 1 个 dialog/1 个 goal-name 输入，Docker Phase A 的 Task 详情链路通过。

## 验证结果

- app-vue：167 files / 1002 tests；Goal：82 / 428；Task：66 / 771。
- AI：113 / 751；Web：16 / 70；Desktop：67 / 361。
- contracts：66 / 526；database：5 / 13；setting：14 / 81。
- API 宿主重启数据库集成测试：1/1；Task commit 后退出，新宿主恢复贡献且不重复。
- Electron 布局矩阵：1024/1200/1280/1440，以及 125%/150% 缩放通过。
- 本地 Docker 核心产品旅程：最终 7/7；Phase A 额外定点复验 1/1。
- `memoflow:governance-check` 通过；Reka isolation、accessible interaction、package boundary、event flush 等门禁全绿。
- 最新镜像健康检查：Web 200、API `/healthz` 200、PowerSync liveness 200；CORS 204 且允许 `http://127.0.0.1:12137`。

既有非阻断项：UI package lint 保留 56 条历史 warning，database lint 保留 1 条未使用 eslint-disable warning；Vite 保留大 chunk 提示。这些均不是本轮新增错误。

## 截图与机器证据

- [Electron 布局矩阵](../../reports/local-deploy-validation/product-review-2026-08-01/electron-layout-matrix/)
- [1280×900 Task 工作区](../../reports/local-deploy-validation/product-review-2026-08-01/manual-review/task-workspace-1280x900.png)
- [未配置 AI provider 状态](../../reports/local-deploy-validation/product-review-2026-08-01/manual-review/ai-provider-empty-state.png)
- [末行 KR 被原子保存](../../reports/local-deploy-validation/product-review-2026-08-01/manual-review/goal-with-pending-kr-saved.png)
- [Docker Playwright 机器证据](../../reports/local-deploy-validation/local-docker-playwright-evidence.json)

## 数据清理

最终删除 22 个 `pm-phase-*` E2E 身份和 1 个 `pm-manual-review-*` 人工身份及其关联业务数据；清理后两类前缀查询均为 0。未删除非测试账号或既有业务数据。

本轮修改仍在本地工作区，未提交、未推送。
