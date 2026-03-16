# Goal Composition Root

`@dailyuse/goal` 现在把 server 端依赖注入模式收敛为一条主线：

```text
outer app / transport
  -> choose concrete adapters
  -> createGoalModule(deps)
  -> consume module.useCases from controller/router/IPC via transport handlers
  -> expose routes / IPC handlers
```

## 目标模式

- 每个业务模块只有一个工厂式组合根
- 组合根只接收显式依赖对象 `deps`
- controller / route 不直接 new repository
- 不依赖 singleton container 获取业务依赖
- 需要释放资源时，统一走 `dispose()`

## Goal 实践

- API 入口：`packages/goal/src/api/module.ts`
- 组合根：`packages/goal/src/infrastructure-server/goal.module.ts`
- HTTP 控制器：`packages/goal/src/controllers/goal.controller.ts`
- 文件夹控制器：`packages/goal/src/controllers/goal-folder.controller.ts`
- PowerSync 入口：`packages/goal/src/infrastructure-server/powersync.ts`
- 传输层映射：`packages/goal/src/api/transport-handlers.ts`
- 运行时贡献：`packages/goal/src/api/runtime.ts`

## 为什么比旧方案更好

- 依赖是显式的：看构造函数就知道模块需要什么
- transport 更薄：只做协议映射，不再承担隐式注入职责
- 测试更简单：直接传 mock repository 即可
- 生命周期更清楚：事件订阅等副作用通过 runtime contribution 管理
- 没有 singleton container：GoalContainer 已被弃用

## 供其他模块复用的蓝图

```ts
export interface XModuleDependencies {
  readonly repoA: RepoAPort;
  readonly repoB: RepoBPort;
  readonly runtimeContributions?: XRuntimeContribution | readonly XRuntimeContribution[];
}

export function createXModule(deps: XModuleDependencies): XModuleInstance {
  const useCases = createXUseCases(deps);
  // ... assemble once, return { useCases, start(), dispose() }
}

export function createXTransportHandlers(useCases: XModuleUseCases): XControllerUseCases {
  return useCases; // thin mapping
}
```

如果某个模块需要切换 Prisma / PowerSync / mock，只在最外层切换适配器，不改应用层对象图。
