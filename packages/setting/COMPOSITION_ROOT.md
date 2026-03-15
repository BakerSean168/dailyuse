# Setting Composition Root

`@dailyuse/setting` 是 governance 之后迁移的第二个模块参考实现。

## 关键代码位置

- 组合根：`packages/setting/src/infrastructure-server/setting.module.ts`
- API 装配：`packages/setting/src/api/module.ts`
- runtime 贡献：`packages/setting/src/api/runtime.ts`
- transport 映射：`packages/setting/src/api/transport-handlers.ts`
- Electron 装配：`packages/setting/src/electron-entry/index.ts`

## 迁移要点

- 用 `createSettingModule(deps)` 替代 `SettingContainer`
- 把旧 initialization 改成 `start()` / `dispose()` 生命周期
- transport 只消费 `module.api`
- Prisma / PowerSync 适配器都在外层选择

## 和 governance 的对应关系

- `createSettingModule` 对应 `createGovernanceModule`
- `createSettingRuntimeContribution` 对应 `createGovernanceRuntimeContribution`
- `createSettingTransportHandlers` 对应 `createGovernanceTransportHandlers`

如果要继续迁移下一个模块，优先对照 governance 的 `REFACTOR_PLAYBOOK.md`，然后看 setting 的最小实践版本。
