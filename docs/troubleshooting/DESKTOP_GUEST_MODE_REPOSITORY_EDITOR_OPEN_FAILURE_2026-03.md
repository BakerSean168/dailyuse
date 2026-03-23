# Desktop 访客模式仓库笔记创建后无法打开问题复盘

## 现象

在 `desktop` 端进入访客模式后，仓库工作区存在一组连续问题：

- 点击“添加笔记”后，笔记实际已经创建成功，但前端仍然弹出失败提示。
- 双击左侧笔记，右侧编辑区无法打开。
- 中途一度出现更严重的副作用，`goal:create`、`repository:resource:create` 等写操作一起超时。
- 修复部分问题后，日志里又出现了伪装成 `AUTH_REQUIRED` 的 editor IPC 失败。
- 最后即使笔记已经能打开，前端仍会报 `text.match is not a function`。

这不是单点故障，而是一条跨前端 store、Electron IPC、Editor 模块、PowerSync 本地库的故障链。

## 影响范围

- `desktop` 访客模式下的仓库笔记创建与打开
- 仓库树双击打开笔记
- editor session/tab 恢复
- 一度影响到其它依赖同一 PowerSync 数据库写事务的模块

## 根因链总览

这次问题最终拆成了 6 个根因，前后叠加：

1. 前端把 `repositoryId` 直接当成 `editor workspace id` 使用。
2. Editor PowerSync 仓储在事务内错误使用外层 `db`，导致写锁卡死。
3. PowerSync schema 与 Prisma schema 漂移，tab 表字段不一致。
4. Editor IPC 包装把内部异常统一伪装成 `AUTH_REQUIRED`，误导排查方向。
5. Session 从 PowerSync 恢复时，`layout` 没有恢复成值对象。
6. 前端场景层把 `ref/computed` 当成字符串直接调用 `match()`。

只有把这几层都修掉，功能才真正恢复稳定。

## 第一层根因：`repositoryId` 与 `editor workspace id` 混用

### 症状

日志里最早的关键特征是：

```text
setWorkspace:create-default-session-failed
openResource:no-session-or-group
handleCreateNote:open-failed
```

笔记创建成功，但打开失败。

### 原因

前端在仓库场景里一直把：

- `repositoryId`

直接传给 editor store，当成：

- `editor workspace id`

使用。

但 Electron 侧 editor 模块里真正持久化的工作区 id 是另一套 `IEditorWorkspaceId_*`。  
仓库 id 只是“定位 workspace 的业务 key”，并不是 editor 模块内部聚合根 id。

于是打开链路变成了：

1. 仓库创建资源成功。
2. 前端请求 editor 打开资源。
3. editor store 用错误的 workspace id 去查 session。
4. 查不到 session/group，返回 `null`。
5. 前端误判成“打开失败”，弹错误提示。

### 修复

核心修复思路是：

- 前端先用 `repositoryId` 通过 `projectPath` 去解析真实的 editor workspace。
- 后续所有 session/tab 操作统一使用解析后的 `IEditorWorkspaceId_*`。

涉及文件：

- `packages/app-vue/src/modules/editor/services/editorDesktop.service.ts`
- `packages/app-vue/src/modules/editor/stores/editorWorkspaceStore.ts`
- `packages/contracts/src/electron/ipc-channels.ts`
- `packages/editor/src/electron-entry/index.ts`

同时补了双击打开事件：

- `packages/app-vue/src/modules/repository/components/TypedFileTree.vue`

## 第二层根因：Editor 仓储事务写法错误，导致数据库写锁卡死

### 症状

修完 workspace 映射后，出现新的回归：

- `repository:resource:create` 超时
- `goal:create` 超时
- 笔记文件夹看起来像“空了”

### 原因

Editor 的几个 PowerSync 仓储在 `saveBatch()` 里使用了：

- `db.writeTransaction(async () => { ... })`

但内部实际调用的还是外层 `this.db`，没有使用事务传进来的 `tx`。  
这会导致事务上下文和外层连接混用，在 SQLite / PowerSync 场景下把写锁挂住。

结果不是只影响 editor：

- editor session/group/tab 写入被卡住
- repository 写入被卡住
- goal 写入也被卡住

因为它们共用同一个本地 PowerSync 数据库。

### 修复

把以下仓储统一改成：

- `save()` 走 `saveWithExecutor(this.db, ...)`
- `saveBatch()` 走 `writeTransaction(async (tx) => saveWithExecutor(tx, ...))`

涉及文件：

- `packages/editor/src/infrastructure-server/adapters/powersync/editor-workspace-powersync.repository.ts`
- `packages/editor/src/infrastructure-server/adapters/powersync/editor-session-powersync.repository.ts`
- `packages/editor/src/infrastructure-server/adapters/powersync/editor-group-powersync.repository.ts`
- `packages/editor/src/infrastructure-server/adapters/powersync/editor-tab-powersync.repository.ts`

## 第三层根因：PowerSync schema 漂移，tab 表定义落后于 Prisma

### 症状

事务修好后，`createResource` 已恢复成功，但 editor 仍然出现：

- `create-tab-failed`
- `list-sessions` 恢复异常

### 原因

检查后发现：

- Prisma 中 editor tab 表字段是 `resource_id`
- 但 `packages/database/src/powersync-schema.ts` 里仍写着旧字段 `document_id`

并且还缺了：

- `updated_at`
- `deleted_at`

这意味着：

- 仓储代码按新版表结构在读写
- 本地 PowerSync schema 仍按旧版列定义初始化

两者不一致后，session 恢复和 tab 写入都会出问题。

### 修复

修正 `packages/database/src/powersync-schema.ts`：

- `document_id -> resource_id`
- 补齐 `updated_at`
- 补齐 `deleted_at`

但这里还有一个现实问题：

- 代码改了，不会自动修复用户机器上已经存在的旧 SQLite 表结构

因此在实际排障中，还需要执行本地数据库重置：

- `pnpm nx run desktop:db:reset`

删除旧的 `dailyuse-sync.sqlite` 后重新启动，让新的 schema 生效。

## 第四层根因：Editor IPC 把真实异常伪装成 `AUTH_REQUIRED`

### 症状

数据库重置后，`list-sessions` 和 `create-tab` 仍然失败，但日志变成：

```text
code: 'AUTH_REQUIRED'
message: 'Authentication required'
```

看起来像是 guest 模式没有认证上下文。

### 原因

真实原因不是鉴权失败，而是 editor 自己内部抛了异常。  
只是 `withAuthenticatedValue()` 的默认包装策略把“非鉴权异常”也降级成了 `AUTH_REQUIRED`，导致日志误导。

也就是说当时这层语义实际上变成了：

- 真正的鉴权失败 -> `AUTH_REQUIRED`
- editor 内部任何异常 -> 也可能被包装成 `AUTH_REQUIRED`

### 修复

在 editor 模块里单独覆盖 IPC 包装策略：

- 非鉴权异常统一返回 `INTERNAL_ERROR`
- 并在主进程打印原始 `exception` 内容

涉及文件：

- `packages/editor/src/electron-entry/authenticated-ipc.ts`
- `packages/editor/src/electron-entry/index.ts`
- `packages/app-vue/src/modules/editor/services/editorDesktop.service.ts`

这样后续日志终于能看到真实异常，而不是继续被假 `AUTH_REQUIRED` 干扰。

## 第五层根因：Session `layout` 从 PowerSync 恢复时丢失值对象语义

### 症状

在去掉错误包装后，主进程终于给出真实错误：

```text
this._props.layout.toServerDTO is not a function
```

### 原因

`PowerSyncEditorSessionRepository` 读取 `editor_workspace_sessions.layout` 时，直接：

- `JSON.parse(layout)`

得到的是普通对象，而不是领域里的 `SessionLayout` 值对象。

但 `EditorSession.toServerDTO()` 又假设 `layout` 一定有：

- `toServerDTO()`

于是：

1. `listSessions()` 在恢复 session 时崩溃
2. `createTab()` 在持久化 session 时再次崩溃

### 修复

把 session layout 恢复逻辑改成：

- `SessionLayout.fromDTO(parsedLayout)`

同时同步恢复：

- `activeGroupIndex`

涉及文件：

- `packages/editor/src/infrastructure-server/adapters/powersync/editor-session-powersync.repository.ts`

这是让 `create-tab` 真正恢复正常的最后一个后端根因。

## 第六层根因：前端把 `ref/computed` 当成字符串使用

### 症状

当笔记终于能成功打开后，前端又报：

```text
text.match is not a function
```

但这时资源已经真的被打开，只是渲染过程中触发了运行时异常。

### 原因

`useRepositoryWorkspaceScene.ts` 中的字数统计逻辑写成了：

- 直接对 `editorScene.document.content` 调 `match()`

而 `content` 实际上是一个 `ref/computed`，不是裸字符串。

### 修复

改成：

- `unref(editorScene.document.content)`
- 再做 `typeof === 'string'` 兜底

涉及文件：

- `packages/app-vue/src/modules/editor/composables/useRepositoryWorkspaceScene.ts`

## 最终修复清单

这次最终落地的修复可以概括为：

1. 仓库 id 与 editor workspace id 解耦，先解析真实 workspace，再操作 session/tab。
2. 修复 editor PowerSync 批量保存事务实现，避免写锁卡死。
3. 修复 PowerSync schema 漂移，并通过重置本地数据库清除旧表结构残留。
4. 让 editor IPC 暴露真实内部异常，不再统一伪装成 `AUTH_REQUIRED`。
5. 修复 session layout 的值对象反序列化。
6. 修复前端 `content` 的 `ref`/字符串混用。
7. 补充 store 回归测试，覆盖“repositoryId 只是 lookup key，真实打开必须使用 resolved editor workspace id”的场景。

## 为什么问题会看起来反复“变形”

这次排查最容易让人误判的点是：每修完一层，表现都会变化。

表现变化顺序大致是：

1. 笔记创建成功但打开失败
2. 全局写操作超时
3. create-tab 失败
4. 假 `AUTH_REQUIRED`
5. 真实 `layout.toServerDTO is not a function`
6. 前端 `text.match is not a function`

这不是“修坏了别的地方”，而是前一个阻塞层被移除后，后一个真实问题才暴露出来。

换句话说，最开始只有最外层故障能看见，越往里修，日志才越接近真正的核心异常。

## 如何判断这次问题已经彻底修复

可以用下面这组回归动作验证：

1. 进入 `desktop` 访客模式。
2. 新建一个空仓库或打开现有仓库。
3. 点击“添加笔记”。
4. 确认左侧树中出现新笔记。
5. 确认右侧编辑区自动打开该笔记。
6. 双击任意已有笔记。
7. 确认也能在右侧打开。
8. 再新建一个 `goal`，确认不会出现联动超时。

如果上述动作都正常，说明：

- workspace 解析正常
- session/tab 链路正常
- PowerSync schema 正常
- 本地事务未锁死
- 前端场景层渲染正常

## 经验总结

### 1. 仓库业务 id 不应直接复用为 editor 聚合根 id

如果一个 id 只是“业务定位 key”，就不要默认它等于目标模块内部持久化主键。  
这次就是典型的“lookup key”和“aggregate id”混用。

### 2. PowerSync / SQLite 事务里必须严格使用事务 executor

在事务回调里再回到外层 `db` 是很危险的。  
这类错误不一定马上报错，但很容易以锁等待、超时、跨模块写失败的形式出现。

### 3. Schema 改动后要考虑已有本地数据库

PowerSync 客户端 schema 改了，不等于用户机器上旧表会自动补列。  
如果本地库会长期保留，就必须考虑：

- 自动迁移
- 或明确重置策略

### 4. 鉴权包装不要吞掉真实业务异常

如果“任何异常都长得像未登录”，排查效率会急剧下降。  
鉴权错误和内部错误必须分开。

### 5. 领域值对象从持久化恢复时不能偷懒

一旦把值对象恢复成普通 JSON，对象表面上“看着像对”，但行为方法会全部丢失。  
这种问题往往在 `toDTO()`、业务方法调用时才爆出来。

### 6. 前端场景层要明确区分 `ref/computed` 与裸值

Vue 组合式 API 下，这类错误很常见。  
凡是进入字符串、数组、数字原生方法之前，都要确认当前拿到的是不是已经 `unref()` 过的值。

## 一句话结论

这次 `desktop` 访客模式下“仓库笔记创建成功但打不开”的根本原因，不是单一 bug，而是一次跨 workspace id 映射、PowerSync 事务、schema 漂移、异常包装、值对象反序列化和前端响应式取值的串联故障；最终通过逐层拆解和逐层修正，才把整条打开链路恢复正常。
