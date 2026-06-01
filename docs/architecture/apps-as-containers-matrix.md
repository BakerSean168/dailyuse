# Apps-as-Containers Matrix

每个 `apps/*` 是一个 **runtime container**，负责 wiring、transport 和 runtime-specific integration。
业务逻辑属于 `packages/*`，app 只负责组装和启动。

## 职责矩阵

| App | 角色 | 允许承载 | 不允许承载 |
|-----|------|----------|------------|
| `web` | Web thin shell | Vue DI、路由、startup hook、theme sync | domain/application 实现、业务 service |
| `mobile` | Mobile thin shell | React DI、路由、startup hook | domain/application 实现、业务 service |
| `api` | Server runtime container | HTTP 路由注册、cron 调度、DI 装配、PowerSync adapter edge | domain 实现、application use-case 实现 |
| `desktop` | Desktop runtime container | IPC 注册、window 管理、auth lifecycle、startup hook、DI 装配 | domain/application 实现、业务 service |
| `ai-service` | AI service container | FastAPI 路由、eval runner、model adapter | prompt 模板业务逻辑、plan synthesis |

## 边界规则

1. **app 不持有 domain 实现** — domain entities、value objects、aggregates 属于 `packages/*/src/domain-*`
2. **app 不持有 application use-case** — use-case 实现属于 `packages/*/src/application-server`
3. **app 只做 wiring** — 创建 service 实例、注册 IPC/HTTP handlers、启动 lifecycle hooks
4. **app 可持有 runtime adapter** — 仅当 adapter 与特定 runtime 绑定时（如 `window.electronAPI`、`expo-router`）
5. **app 可持有 integration seam** — 如 PowerSync auth token seam、cron scheduler seam，但必须标记为 `runtime integration module`

## 审计命令

```bash
# 检查 app 中是否有 domain/application 实现泄漏
rg "class.*implements|export.*function.*Service|export.*class.*Repository" apps/ --type ts

# 检查 app 中是否有厚业务逻辑
rg "async.*create|async.*update|async.*delete" apps/api/src/modules/ --type ts -l
```

## 迁移中的例外

以下位置是已知的"暂时留在 app 的厚逻辑"，已列入迁移计划：

- `apps/api/src/shared/infrastructure/http/middlewares/performance.middleware.ts` — `metricsStore` 模块级单例，待改为工厂注入
- `apps/ai-service/src/ai_service/services/goal_planning_service.py`（~1200 行）— goal planning，待拆分
- `apps/ai-service/src/ai_service/evals/runner.py`（~1200 行）— eval runner，待拆分

### 已完成的迁移

- `apps/api/src/modules/powersync/module.ts` — 已拆分为 token-issuer / crud-executor / snapshot-*
- `apps/api/src/shared/infrastructure/cron/` — 已改为工厂模式（`createCronScheduler()`），调用方持有生命周期
