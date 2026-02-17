# Module Architecture Gap Summary (2026-02-17)

## 标记说明

- ✅ 已基本对齐（contracts → domain → application(usecase) → infrastructure）
- ⚠️ 存在架构不一致或残留兼容层
- ❌ 存在占位实现（`Not implemented` / placeholder）
- 📝 说明该模块有特殊约束（例如当前不提供 api/electron）

## 模块检查结果

| 模块 | 对齐状态 | 差异标记 | 主要问题 |
|---|---|---|---|
| account | ✅ |  | 结构完整，分层基本一致 |
| ai | ⚠️ | 📝 | 缺少 `src/api` 注册层 |
| authentication | ⚠️ |  | 缺少 `domain-client`，`electron-entry` 为空壳实现 |
| editor | ⚠️ | 📝 | 缺少 `application-client`、`infrastructure-client`、`api` |
| goal | ✅ |  | 主体结构完整 |
| governance | ⚠️ | 📝 | 使用本地 `src/contracts`，与多数模块路径风格不同；缺少 `electron-entry` |
| notification | ❌ |  | prisma/sqlite 多个仓储为 `Not implemented` |
| reminder | ⚠️ |  | 缺少 `src/api`，application-client 仍有占位风格 |
| repository | ❌ |  | 多个 prisma 仓储为 `Not implemented`；存在旧容器与兼容导出 |
| schedule | ❌ |  | sqlite 仓储为 placeholder；存在旧别名/兼容导出 |
| setting | ❌ |  | prisma/sqlite 多个仓储为 `Not implemented`；client 侧仍有兼容别名 |
| task | ⚠️ |  | 已移除旧模板应用服务；仍需继续补齐部分类型/契约不一致 |

## 本轮已落地优化

1. `task` 模块：移除旧兼容应用服务 `task-template-application-service.ts`，改为 usecase 直连。
2. `task` 模块：`electron-entry` 改为使用新的用例对象（不再调用旧服务方法名）。
3. `task` 模块：`infrastructure-server/index.ts` 清理注释兼容导出，改为真实导出。
4. `task` 模块：修复 `task-reminder-schedule.handler.ts` 的日期范围参数类型错误（`Date -> number`）。

## 下一步优先顺序（建议）

1. **P0**：`setting` / `notification` / `repository` 三个模块的 `Not implemented` 仓储先补齐（至少先补 Prisma 路径）。
2. **P1**：清理 application-client 中兼容别名与 singleton placeholder（改为显式模块初始化注入）。
3. **P1**：统一缺失层（`api` / `electron-entry`）的策略：要么补齐实现，要么在模块元数据明确声明“非目标平台”。

## 风险说明

- 当前多个模块的构建虽可能通过，但运行时会在调用仓储方法时抛错。
- 在移除兼容层时，需先替换下游调用方，避免 desktop/web 侧运行时空引用。
