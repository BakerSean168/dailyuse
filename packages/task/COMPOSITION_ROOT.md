# Task Composition Root

`@dailyuse/task` now converges server-side dependency injection into one main line:
`@dailyuse/task` 现在把 server 端依赖注入模式收敛为一条主线：

```text
outer app / transport
  -> choose concrete adapters (Prisma or PowerSync)
  -> createTaskModule(deps)
  -> consume module.api from controller/router/IPC
  -> expose routes / IPC handlers
```

## Target Pattern / 目标模式

- Each business module has exactly one factory-style composition root
  每个业务模块只有一个工厂式组合根
- The composition root only accepts explicit dependency objects `deps`
  组合根只接收显式依赖对象 `deps`
- Controllers and routes never directly `new` repositories
  controller / route 不直接 new repository
- No singleton container is needed for normal runtime usage
  不依赖 singleton container 获取业务依赖
- Resource cleanup goes through `dispose()`
  需要释放资源时，统一走 `dispose()`

## Task Module Practice / Task 模块实践

| Concern              | File                                                              |
| -------------------- | ----------------------------------------------------------------- |
| API entry            | `packages/task/src/api/module.ts`                                 |
| Composition root     | `packages/task/src/infrastructure-server/task.module.ts`          |
| Transport handlers   | `packages/task/src/api/transport-handlers.ts`                     |
| Runtime contribution | `packages/task/src/api/runtime.ts`                                |
| HTTP controllers     | `packages/task/src/api/controllers/task-template.controller.ts`   |
|                      | `packages/task/src/api/controllers/task-instance.controller.ts`   |
|                      | `packages/task/src/api/controllers/task-dependency.controller.ts` |
| PowerSync entry      | `packages/task/src/infrastructure-server/powersync.ts`            |
| Electron entry       | `packages/task/src/electron-entry/index.ts`                       |

## Key Difference From Governance / 与 Governance 的主要差异

Task has **3 controller classes** (Template, Instance, Dependency) instead of one. The
transport handlers file groups the flat module API into 3 sub-objects that each controller
expects:

```ts
interface TaskTransportHandlers {
  readonly template: TaskTemplateUseCases;
  readonly instance: TaskInstanceUseCases;
  readonly dependency: TaskDependencyUseCases;
}
```

## Why This Is Better Than the Legacy Approach / 为什么比旧方案更好

- Dependencies are explicit: look at `TaskModuleDependencies` to know what the module needs
  依赖是显式的：看 `TaskModuleDependencies` 就知道模块需要什么
- Transports are thinner: they only do protocol mapping, no implicit injection
  transport 更薄：只做协议映射，不再承担隐式注入职责
- Testing is simpler: pass mock repositories directly to `createTaskModule()`
  测试更简单：直接传 mock repository 给 `createTaskModule()` 即可
- Lifecycle is clear: event subscriptions are managed via runtime contributions
  生命周期更清楚：事件订阅等副作用通过 runtime contribution 管理

## Deprecated Legacy Code / 已弃用的遗留代码

- `TaskContainer` singleton (`infrastructure-server/di/task-container.ts`) — kept for backward compatibility only
  `TaskContainer` 单例 — 仅为兼容旧调用方保留
- `registerTaskInitializationTasks()` (`api/initialization.ts`) — replaced by `createTaskRuntimeContribution()`
  `registerTaskInitializationTasks()` — 已被 `createTaskRuntimeContribution()` 取代
