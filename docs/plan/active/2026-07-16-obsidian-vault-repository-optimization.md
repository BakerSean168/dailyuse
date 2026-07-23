---
tags:
  - plan
  - active
  - repository
  - editor
  - authentication
  - obsidian
  - github
  - desktop
  - web
  - security
description: 本地 Obsidian Vault、可选 GitHub 私有仓库同步、Web 快捷创建与 Agent 知识写入边界的实施方案
created: 2026-07-16T00:00:00
updated: 2026-07-22T00:00:00
---

# Obsidian Vault 与 GitHub 知识仓库后续优化方案

## 1. 文档地位

本文执行 [ADR-034](../../architecture/adr/ADR-034-obsidian-vault-repository.md)，合并 UI 重构分析、Web 产品审查、Obsidian 官方能力、GitHub App 权限模型以及 2026-07-16 的最新产品调整。

状态：**实施中**。

当前实施状态：

- GitHub 登录与 GitHub App 仓库授权已按独立 contract、token 和 UI 边界接线；认证与仓库授权的后续验收由各自 active plan 继续收口。
- Desktop 已具备 profile-owned 本地 Vault 选择、扫描、搜索、预览、Obsidian 打开和确认后写入，不依赖云端即可工作。
- GitHub-hosted private repository 创建入口、GitHub App installation、private/admin/active 仓库连接、首次对账、
  手动持续同步以及 profile-scoped 自动同步已贯通。
- 服务端 Markdown read model、GitHub webhook 投影、删除传播、RAG 自动索引/状态回写与 default branch
  定期 reconciliation 已贯通；Link Graph 已按 Markdown projection 派生并提供后端与 Web 关系视图；附件元数据投影、
  identity-scoped 列表和 GitHub blob 按需受认证读取已贯通；delivery、reconciliation 和 write 的多实例 claim/lease
  已接通。
- Web 已支持只读投影列表、搜索、安全预览和 repository-backed 新建笔记；确认快照、request ledger 与 Git
  commit 幂等已接通；单 runtime 与多实例 repository-scoped 串行写协调均已实现。Desktop pull 已通过真实 Git
  的服务边界验收，真实 GitHub E2E 仍待补齐。
- Web Markdown 已关闭原始 HTML 并建立 sanitizer/危险 URL 测试边界；共享安全渲染器已补齐 comments、highlights、
  inert embeds、callouts、task lists 以及 heading/block navigation metadata；附件读取只允许安全媒体类型并限制为
  10 MiB；附件 blob 已按 `connectionId + blobSha` 建立短期共享 PostgreSQL cache，并保留每次读取的授权、投影
  版本和完整性校验；真实 GitHub E2E 仍需继续补齐。
- 阶段 6 残留：API legacy route builders 已删；客户端 legacy CRUD 方法已删除（无 hard-fail stub 双轨）；MSW/E2E knowledge-only（无 legacy 404 stub）；
  app-vue editor 模块与 `useRepository`/dead workspace components 已删除；宿主侧 `@dailyuse/editor` 依赖与
  path/vite alias 已摘除；壳层不再映射退役 `/note` 前缀；**`packages/editor` 运行时包已删除**；
  **`@dailyuse/contracts/editor` 与 `EditorChannels` 亦已删除**；repository 运行时组合根/
  客户端面仅 knowledge + Local Vault；**legacy application/adapters/domain-client 与 contracts
  CRUD request 面已删除**；AI 确认创建返回 `KnowledgeNotePersistedRef`（`note`）；
  **`ResourceClientDTO`/`RepositoryClientDTO` 与相关 value objects / mock factories 已删除**；
  Web E2E 不再 mock 退役 editor/resource API；客户端 adapter 删除无调用的
  legacy hard-fail stub；app-vue repository locale 收缩为 projection/localVault 面；
  退役顶层 `editor` locale 与无 UI 的 `setting.tabs`/`setting.editor` 文案已删；
  contracts 空 entities/dtos/value-objects 桶已移除；无调用的
  `createRepositoryPowerSyncModule` 已删；知识笔记 path resolver 应用层路径穿越 hardening；
  Agent resume 仅 confirm 可执行 side-effect；首期 Agent 工具面不含 note update/reindex；AI index diagnostics 去掉 legacy-resource-metadata；访客/离线 token 不能扩 GitHub/PowerSync 云端授权；
  三入口 surface contract 单测（Desktop 账密+访客 / Web 账密+GitHub）与 goal↔knowledge 反向能力隔离；
  Web 未认证硬跳转 AuthApp；主壳 `/auth` 为 AuthPlatformEntry；死 LoginForm/RegisterForm/AuthView/useSmsCodeCountdown 已删；Agent identity 归属 fail-closed + resolveRunPlan surface 隔离；
  过时 UI redesign 知识 DTO 声明已 supersede；knowledge event 保留。
  Prisma/PowerSync `editor_*`/`resources` 表 schema 与 data-portability 可再导入备份仍保留。
  完成定义审计见 §13.2；prod-like `docker:local:up` 已在残留二十七轮通过（六服务 healthy）；残留三十二轮补三入口/Agent journey 证据；残留三十三至五十四轮删除 Desktop DI/PowerSync/lazy-module/contracts、AI conversation/provider 双轨命名与无传输层 conversation add/status/getDefault 用例、conversation/provider-config/auth-identity/account phone 仓储死方法与 DEVICE_TRUST/2FA/API-Key/device 管理/诊断会话 IPC 空 stub、Desktop auth shell 本地 Ch 与 contracts AuthChannels 双轨、governance mapper-helpers 兼容 re-export、generateStrongPassword/updateCurrentValueByAggregation/E2E TEST_USER 兼容别名、utils 根 uuid 与 shared/uuid 双文件、ipc-client ElectronAPI 兼容别名与 API `/health` 双轨探针、API AuthenticatedRequest.identityId 双轨、Desktop auth stub/TokenData/LoginCredentials/AutoLoginResult 双轨别名与 app-vue LegacyWorkflowMode 双轨类型残留，并增强三入口/ADR-035 multi-turn journey 证据；真实 GitHub fixture E2E 仍为外部阻塞，全量 PR 门禁套件仍未宣称通过。

## 2. 已确认产品边界

1. 登录保留账密、GitHub 和访客（桌面端）三种方式。
2. GitHub 登录只用于身份认证；GitHub 仓库同步是独立授权。
3. 本地 Obsidian Vault 是 Desktop 的工作副本和本地事实源。
4. 未绑定 GitHub 时笔记完全本地，Web/Mobile 不访问笔记。
5. 用户需要同步时，可以创建或连接一个 private GitHub repository。
6. 绑定后 GitHub commit history 是跨设备共享日志，服务端从 webhook 构建只读投影与 RAG。
7. Web 首期支持阅读、搜索、RAG 和快捷创建新笔记，不开放已有笔记全文编辑。
8. AI 不再使用固定默认路径设置；Agent 根据运行时可用上下文、知识库结构和用户当前指令提出写入方案，用户确认后写入。

## 3. 用户与身份模型

### 3.1 账密账号

- 保留注册、登录、密码修改与找回。
- 可在任何时候连接 GitHub 知识仓库。
- GitHub 仓库连接不自动改变主登录方式。

### 3.2 GitHub 登录

- 使用 GitHub App user authorization 获取稳定 GitHub user ID。
- 服务端映射或创建 Daily Use Identity，并签发 Daily Use session。
- 登录授权只请求身份所需的最小信息，不自动申请仓库 Contents 权限。
- 登录后可以跳过仓库连接，仅本地使用 Desktop。

### 3.3 访客

- 建立独立 Desktop 本地 profile，可以选择 Vault、预览和在 Obsidian 打开。
- 不创建服务端账号，不允许 GitHub 同步、Web 笔记和云端 RAG。
- 点击“启用同步”时先升级为账密账号或 GitHub 登录。
- 升级只重新绑定 identity/profile ownership，不移动、不复制或重写 Vault。

### 3.4 身份与同步连接分离

数据模型至少区分：

```text
AuthIdentity
  password credential / GitHub OAuth binding

KnowledgeRepositoryConnection
  accountId
  githubUserId
  githubRepositoryId
  installationId
  defaultBranch
  status
```

同一个 GitHub binding 可同时服务登录和仓库授权，但两个用户动作、权限提示、撤销状态和错误码必须独立。

## 4. 本地 Vault 与 GitHub 仓库

### 4.1 未绑定状态

```text
Local Obsidian Vault
  -> Desktop scan/watch
  -> local preview/search/link graph
  -> Obsidian external edit
```

- 不需要账号在线。
- 不创建 Git commit 或云端投影。
- AI 可以生成草稿，但写入前仍需路径和内容确认。

### 4.2 绑定状态

```text
Local Obsidian Vault / Git working tree
  <-> Desktop Git runtime
  <-> GitHub private repository
       -> GitHub App webhook
       -> server read model + RAG
       -> Web/Mobile
```

- GitHub 不是本地文件系统的替代品；Desktop 始终直接读取 Vault。
- GitHub 是共享提交日志、备份和跨端传输层。
- 服务端投影可以从 default branch 重建，不反向成为第三个编辑源。

## 5. GitHub 仓库连接

### 5.1 授权方式

采用 GitHub App：

- 身份：最小用户信息。
- 仓库：用户明确安装到指定 private repository。
- 长期操作：短期 installation access token。
- Webhook：验证 GitHub signature 和 delivery ID。

不采用普通 OAuth App 的广泛 `repo` scope。

### 5.2 创建新仓库

首期采用 GitHub-hosted repository creation，不扩展身份 OAuth scope，也不保留 user access token：

1. 用户点击“创建 private repository”。
2. Memoflow 打开 GitHub 官方新建仓库页，预填 `memory-flow-notes` 和 `private` visibility。
3. 仓库名确认、同名冲突和最终创建操作均由用户在 GitHub 完成。
4. 创建后通过独立 GitHub App installation flow 明确选择该仓库，Memoflow 才获得 repository-scoped Contents 权限。

GitHub 页面预填参数为：

```json
{
  "name": "memory-flow-notes",
  "visibility": "private"
}
```

不依赖 GitHub 页面初始化 README；空仓库由首次对账安全写入 Memoflow scaffold 和首个 commit。

仓库名已存在时不能覆盖。允许：

- 连接经验证的现有仓库。
- 使用带短后缀的新仓库名。
- 返回取消，不影响本地 Vault。

Memoflow 不复用 GitHub 登录 token 调用 user-owned repository creation API；若未来需要应用内一键创建，必须新增独立、
一次性的 repository-creation authorization，并重新评审 scope、token 生命周期和撤销边界。

### 5.3 连接已有仓库

必须验证：

- 当前用户拥有或具备管理员权限。
- 仓库是 private；public 仓库必须先明确确认风险或拒绝连接。
- GitHub App 已安装且 Contents 权限满足要求。
- 不处于 archived/disabled 状态。
- default branch 存在或可以初始化。

### 5.4 首次对账

| 本地 Vault | GitHub 仓库 | 行为                                               |
| ---------- | ----------- | -------------------------------------------------- |
| 有内容     | 空          | 初始化 Git 并首次 push                             |
| 空         | 有内容      | clone/pull 到用户确认的空目录                      |
| 空         | 空          | 初始化仓库结构                                     |
| 有内容     | 有内容      | 禁止自动覆盖；先预览差异并选择导入、另建仓库或取消 |

首期不做两个非空知识库的自动双向合并。

### 5.5 初始化文件

```text
README.md
.gitignore
.memory-flow/repository.json
```

`.memory-flow/repository.json` 只保存 schema version、repository ID 和非敏感能力标记；不得保存 token、绝对路径或账号隐私。

## 6. Desktop Git Runtime

### 6.1 文件变化

- 监听 Vault 中已纳入同步范围的 Markdown 和附件。
- 事件去抖并等待文件大小/mtime 稳定，避免提交半写入文件。
- 忽略 `.git/`、Git lock、`.obsidian/workspace*`、回收站和临时文件。
- 把一段时间内的变化合并为一次 commit，不按每次按键提交。

### 6.2 同步状态机

```text
LOCAL_ONLY
  -> CONNECTING
  -> READY
  -> DIRTY
  -> COMMITTING
  -> PULLING
  -> PUSHING
  -> UP_TO_DATE

任何在线状态
  -> OFFLINE / AUTH_REQUIRED / CONFLICT / ERROR
```

触发同步：

- 文件稳定后的空闲窗口。
- 用户点击“立即同步”。
- 应用启动和 profile 激活。
- 网络恢复与系统唤醒。
- 退出前的尽力提交，不阻塞强制退出。

### 6.3 Git 操作顺序

1. 检查 working tree 和 Git lock。
2. 暂存允许的变化。
3. 创建本地批量 commit。
4. fetch remote HEAD。
5. 没有远端变化时直接 push。
6. 有远端变化时 pull/rebase。
7. 无冲突则 push；冲突则停止并进入 `CONFLICT`。

本地 commit 是断网待上传队列，不再额外维护正文 Outbox。只需持久化连接、最后同步 SHA、重试时间和错误摘要。

### 6.4 Git 凭据

- Desktop 从 Daily Use 服务端按需获取短期、指定 repository 的 installation token。
- token 仅在首次对账或同步操作期间保留于内存，过期后重新获取。
- 不把 token 写入 `.git/config`、remote URL、命令行参数或日志。
- spike 选定受控系统 Git 子进程：`shell: false`、参数数组调用，并通过子进程环境中的 Git config
  `http.https://github.com/.extraheader` 注入 Basic authorization header；禁用交互式凭据提示和外部
  credential helper。
- runtime 接受可注入 Git binary，后续发行版可在不改变同步端口的前提下切换到随应用分发的 portable Git。
- 暂不采用 libgit2/native addon，避免 Electron ABI 与跨平台打包复杂度；暂不采用 isomorphic-git，
  因后续持续同步需要成熟的 rebase、冲突和 lock 行为。

### 6.5 冲突

- 不使用 `git push --force`。
- 自动 rebase/merge 失败时保留 Git 状态和双方文件。
- Desktop 显示冲突文件、local/remote commit 和“在文件管理器/Obsidian 打开”。
- 首期允许用户在外部工具解决后点击“重新检查”。
- 如果检测到 Obsidian Git 插件或其他进程持有 lock，Daily Use 退让而非抢锁。

## 7. 服务端 GitHub 投影

### 7.1 Webhook ingestion

```text
push webhook
  -> verify signature/repository/installation
  -> deduplicate delivery ID
  -> enqueue ingestion(before SHA, after SHA)
  -> fetch changed tree/blobs
  -> update read model
  -> publish link/RAG jobs
```

- HTTP webhook 快速确认，正文处理进入后台任务。
- commit SHA 和 blob SHA 作为幂等键。
- 定期比较服务端 cursor 与 GitHub default branch HEAD，修复漏 webhook。
- force push 默认暂停 ingestion 并要求重新全量对账。

### 7.2 Read Model

至少记录：

```text
repositoryId
noteId
relativePath
commitSha
blobSha
contentHash
frontmatter
markdownContent
deletedAt
indexStatus
```

附件只保存相对路径、commit/blob SHA、大小和安全媒体类型；内容由服务端按 blob SHA 受认证按需读取，单个附件限制
10 MiB，Web 永不获得 installation token。未知、可执行和仓库控制目录中的文件不进入附件投影。

### 7.3 仓库生命周期

- rename：按 repository ID 更新 display name/URL。
- archived/disabled：暂停写入，保留最后可读投影并告警。
- App uninstall/permission reduction：进入 `AUTH_REQUIRED`。
- delete：read model 标记来源丢失，提供删除云端投影选项，不删除 Desktop 本地 Vault。
- public：立即高优先级告警并暂停新的 RAG ingestion，不未经确认自动改回 private。

## 8. Web 快捷创建

### 8.1 首期能力

绑定仓库后，Web 可以：

- 创建新的 Markdown 文件。
- 确认 AI 草稿并创建文件。
- 查看 commit/同步状态。

暂不支持已有笔记全文编辑、移动、重命名、删除和冲突解决。

### 8.2 创建协议

```text
POST /knowledge-notes
  requestId
  repositoryId
  proposedPath
  title
  frontmatter
  content
  reason
```

服务端：

1. 验证用户、installation 和 repository ownership。
2. 验证用户已确认的完整写入提案和目标路径。
3. 对路径规范化、扩展名、frontmatter 和大小做安全检查。
4. 按 repository ID 进入串行 GitHub commit 队列。
5. 获取最新 default branch HEAD。
6. 创建 blob/tree/commit，并以预期 HEAD 更新 ref。
7. HEAD 变化时安全重试；路径已存在时返回冲突而非覆盖。
8. `requestId` 已成功时返回原 commit，不重复创建文件。

使用唯一文件名降低 Web 与 Desktop 同名创建风险，但不能用随机路径绕过用户的组织规则。

### 8.3 反馈

- `proposing`：AI/规则正在生成路径。
- `awaiting_confirmation`：用户确认路径与正文。
- `committing`：正在写 GitHub。
- `committed`：显示 commit 和待 Desktop 拉取状态。
- `conflict`：路径或 HEAD 冲突，允许重新提案。
- `auth_required`：GitHub App 授权失效。

## 9. Agent 知识写入边界

### 9.1 当前确定项

- 删除“AI 笔记默认目录”“AI 收件箱路径”等 UI 设置。
- Agent 根据未来 Agent runtime 提供的上下文、当前知识库结构和用户当前指令，生成 `path/title/frontmatter/content/reason` 写入提案。
- Desktop 与 Web 都必须展示完整提案；用户确认后才允许 Desktop 写文件或 Web 创建 Git commit。
- 所有路径必须规范化并保持在 Vault 根目录内，禁止绝对路径、`..` 穿越和 symlink 逃逸。
- Agent 上下文不能关闭确认、修改授权、执行任意命令、访问 Vault 外路径或把内容上传到未授权服务。
- 上下文不足或规则冲突时，要求用户选择或补充信息，不使用隐藏固定收件箱兜底。

### 9.2 已固化的 Agent 机制

Open Design、Pi 和当前 LangGraph/TS runtime 专项调研已经完成。通用机制由 [ADR-035](../../architecture/adr/ADR-035-unified-assistant-agent-host.md) 和 [统一助手与可插拔 Agent Host 实施方案](./2026-07-17-unified-assistant-agent-host.md) 规定：

- Daily Use Agent Host 拥有 Run、Capability、Context、Tool Policy、Proposal、审批和执行边界。
- LangGraph 是可恢复 Workflow Engine；Pi、远程 Agent 和本地 CLI 是候选 Turn Engine；自定义 AI API 接入 Model Gateway。
- Context 区分系统安全、产品规则、用户偏好、当前任务和不可信检索内容，不要求固定 `AGENT.md`。
- Engine 只能访问当前 Run 授权的 Query/Proposal 工具；Vault/GitHub Mutation 只由确认后的 TypeScript Executor 执行。
- 用户确认绑定不可变 `proposalId + revision`；仓库 HEAD、路径和 Capability 等关键前置条件变化时必须重新验证。
- Desktop 与 Web 使用相同 Context/Proposal contract，但由不同 Context Source 和 CapabilitySnapshot 提供本地 Vault 或 GitHub 投影能力。

### 9.3 仍延后的细节

- 不预先规定用户偏好必须存放在文件、设置、MCP 或数据库，也不规定固定文件名和目录继承语法。
- 具体路径建议采用模型、确定性规则还是混合排序，在知识写入实现阶段用真实 Vault 样本评测后决定。
- Server LangGraph 是否通过 Activity Lease 等待 Desktop 本地 CLI，只有出现真实跨端需求后再实现。

## 10. Markdown 与附件

- 统一兼容 CommonMark、GFM、properties、wiki link、heading/block、embed、callout、highlight 和 comments。
- 不执行 Dataview、Tasks 查询、Excalidraw、Canvas、社区插件、Vault CSS 或脚本。
- Web 渲染默认不执行任意 HTML，并经过严格 sanitizer。
- Web shared Markdown renderer 通过 MarkdownIt token rules 表示 Obsidian comments、highlights、wiki links、inert
  embeds、allowlisted callouts、disabled task-list controls 与 heading/block metadata；code span/fence 不经过这些
  转换，用户文本和属性继续由 MarkdownIt 负责 escaping。
- 附件路径解析必须保持在仓库根目录，禁止 symlink/`..` 逃逸。
- 大附件和仓库体积设置明确上限；Git LFS 不进入首期，超过上限时提示外部存储或排除。
- GitHub private 不等于 E2E；连接前说明 GitHub 和 Daily Use 服务端会处理明文内容。

## 11. 设置页收敛

### 11.1 账户

- 登录方式与已绑定身份。
- 添加/移除 GitHub 登录 binding。
- GitHub-only 账号移除 binding 前必须先增加账密凭据或确认账号处置。
- 不把仓库权限混入登录方式列表。

### 11.2 知识仓库

- 本地 Vault 路径与“在文件管理器中显示”。
- GitHub 状态：未连接、连接中、已连接、需授权、冲突、暂停。
- repository 名称、private 状态、default branch 和最后 commit。
- 立即同步、断开远端、重新授权和冲突诊断。
- 不显示 AI 固定目录设置。

## 12. 实施阶段

### 阶段 0：决策与安全基线

- 更新认证、Repository、Editor 和 AI contracts。
- 分离 GitHub 登录 binding 与 KnowledgeRepositoryConnection。
- 修复 Markdown `v-html + html: true` 安全阻断项。
- 建立 GitHub App 开发/测试配置和 fixture repository。

### 阶段 1：本地 Vault 纵向闭环

- Vault 选择、扫描、预览、链接和 Obsidian URI。
- 访客/账密/GitHub 用户均可本地使用。
- Agent 基于本地可用上下文生成完整提案并确认写入。
- 移除固定 AI 路径设置。

### 阶段 2：GitHub 认证与仓库连接

- GitHub 登录 OAuth flow 和 Daily Use session。**（服务端骨架已实现）**
- 独立 GitHub App installation flow。
- GitHub-hosted private repository 创建、GitHub App 连接、首次对账和连接状态。**（已实现）**
- 访客升级且不移动 Vault。

> 进展 2026-07-17：已落地可插拔认证架构。服务端抽象登录接口
> `AuthenticationProvider` + `AuthenticationProviderRegistry` + `AuthenticateUseCase`
> 就位；账密（`PasswordAuthenticationProvider`）与 GitHub
> （`GithubAuthenticationProvider` + `IGithubOAuthClient` 端口 + `GithubOAuthClient`
> 适配器）均以插件形式注册。GitHub 登录经 `POST /api/v1/auth/oauth/callback`
> 暴露，仅在 `GITHUB_OAUTH_CLIENT_ID` 与 `GITHUB_OAUTH_CLIENT_SECRET` 配置齐全时
> 注册，只做身份认证、不申请仓库权限。当前端点仍是服务端骨架，授权发起、
> state/PKCE 校验、Web/Desktop UI 与 deep link 尚未接线。认证包 291 个单测、
> 受影响项目 lint/typecheck/test、governance-check 与本地 Docker build/健康检查均
> 通过。待办：完整 OAuth 流程、GitHub App installation、仓库连接与访客升级。

> 进展 2026-07-18：本地 Vault 纵向闭环与 GitHub 仓库连接第一批已落入工作树。
> Desktop 已支持 Vault 选择、扫描、搜索、安全 Markdown 预览、Obsidian 打开与确认后写入；
> 访客升级保持原 profile/Vault 目录。GitHub 登录与仓库授权继续使用独立 contract、路由和 UI：
> Repository 新增 identity-bound 一次性 installation state、private/admin/active repository 校验、
> `KnowledgeRepositoryConnection` 持久化、Desktop-only 仓库级短期 token，以及 RS256 GitHub App
> JWT / `repository_ids` 限权测试。统一 client seam 已接通 HTTP 与 IPC；设置页新增“知识仓库”分组，
> Web 可消费 installation callback 并选择仓库，Desktop 通过受控 HTTP(S) 外跳发起授权并经在线代理
> 获取连接状态与凭据。Repository 88、Desktop 244、App Vue 292 个测试通过，相关类型检查通过。
> 续进展 2026-07-18：首次对账预检已经贯通 Desktop、IPC、HTTP、服务端与 GitHub App。
> Desktop 主进程从当前 profile 的真实 Vault 计算 `Empty / NonEmpty`，忽略 `.git`、Obsidian
> workspace、回收站、临时文件和 Memoflow scaffold；服务端重新验证 identity-owned active
> connection、installation、Contents write、private/admin/active repository，并使用单仓库
> installation token 读取 GitHub GraphQL default-branch snapshot。四类组合被确定性映射为
> `InitializeRemoteFromLocal`、`CloneRemoteIntoLocal`、`InitializeBoth` 或
> `ManualResolutionRequired`，两个非空时 UI 明确阻止自动覆盖。该预检只读且只允许 Desktop
> context，Web adapter 不伪造本地状态。Repository 98、Desktop 245、App Vue 293 个测试通过，
> 相关 typecheck 与 lint 通过。待办：真实 GitHub App fixture/e2e、创建 private repository、
> 首次对账执行器、Desktop Git runtime 与 webhook 投影。
> 续进展 2026-07-18：首次对账执行器与 Desktop Git runtime 已贯通。用户确认绑定不可变的
> `connectionId + action + defaultBranch + remoteHeadSha`，Desktop 在执行前重新读取当前 Vault、
> connection 与 GitHub preview，只对三个安全动作签发短期单仓库 token；Git 完成后服务端再次读取
> live GitHub HEAD，匹配后才推进 `lastSyncedCommitSha`，确认响应丢失时可依据 app-owned manifest
> 修复游标而不重复 mutation。Git runtime 使用受控系统 Git 子进程完成本地初始化、scaffold-only
> remote 继承、空 Vault checkout、提交与非 force push；凭据只进入子进程环境，不进入 URL、config、
> 参数或日志。`.git` 内的本地 ownership marker 支持失败重试，foreign `.git`、Git lock、stale HEAD、
> checkout collision 与 symlink 风险均会停止执行。Repository 102、Desktop 257 个测试以及 App Vue
> 全量测试通过，相关 lint/typecheck 通过。待办：真实 GitHub App fixture/e2e、private repository
> 创建与 webhook 投影。
> 续进展 2026-07-19：连接后的手动持续同步已经贯通 contracts、Desktop IPC/client、主进程编排、
> Git runtime 与设置页。同步首先在完全离线的本地阶段筛选允许路径并创建 commit，随后才申请短期
> repository token；GitHub 不可用时，本地 commit 作为待上传队列保留，UI 明确显示 pending 状态。
> 在线阶段执行 fetch，并根据 history graph 确定 up-to-date、push、fast-forward pull 或 rebase + push，
> 始终禁止 force push。rebase 冲突会保留 Git 状态、双方文件、local/remote HEAD 和冲突路径，用户可在
> 外部 Git/Obsidian 工具完成或中止后点击“重新检查同步”；检测到 default branch force-push/history
> rewrite 时自动同步暂停而不尝试覆盖。runtime 同时屏蔽 repository hooks、system/global Git config、
> credential helper 和非同步路径的预暂存内容。服务端 HEAD confirmation 已从首次对账专用语义提升为
> 通用同步游标确认。Repository 103、Desktop 269 个测试及 App Vue 全量测试通过，相关 lint/typecheck
> 通过。待办：真实 GitHub fixture/e2e、private repository 创建和 webhook 投影。
> 续进展 2026-07-19：profile-scoped 自动同步调度器已经接入 Repository Electron module 生命周期。
> Chokidar 使用 `awaitWriteFinish` 等待文件稳定，并在空闲窗口合并 Markdown 与附件变化；`.git`、
> `.memory-flow`、Obsidian 运行态目录、回收站、`node_modules` 和临时文件不会触发同步。调度器在 profile
> 激活、稳定文件变化、网络恢复和延迟后的系统唤醒时运行，profile 销毁/应用退出前则在有界时间内只做
> 本地 commit，不等待在线上传。连接与 `lastSyncedCommitSha` 的 token-free 快照持久化在 profile storage，
> 因而应用离线重启后仍可继续监听并把变化提交到本地 Git 队列；在线时 repository token endpoint 继续
> 独立重验 ownership 和授权。rebase 冲突与远端 history rewrite 会暂停自动重试，短暂 Git lock 则退让并
> 等待下一次触发。Vault 选择/解绑、仓库连接/断开、首次对账和成功的手动同步都会刷新 watcher；module
> destroy 会移除 watcher、网络与 power 监听器。设置页冲突卡会显示 local/remote HEAD 和冲突路径，并可
> 直接在 Obsidian 中打开第一个冲突文件；history rewrite 无具体文件时打开 Vault 根目录。Repository 104、
> Desktop 279 个测试以及知识仓库设置页 6 个组件测试通过，相关 lint、typecheck 与 14 项真实 Git runtime
> 测试通过。仓库生命周期诊断已接入设置页；待办：真实 GitHub fixture/e2e、private repository 创建和 webhook 投影。
> 续进展 2026-07-19：private repository 创建采用 GitHub-hosted flow。设置页打开预填名称与 private visibility 的
> GitHub 官方创建页，创建后仍必须经独立 GitHub App installation/selection 才能连接；认证 OAuth scope、登录 token
> 与仓库授权均未扩大或复用。同名冲突、取消和最终确认由 GitHub 承担，应用内不保存 user access token。

### 阶段 3：Desktop Git 同步

- Git implementation spike 与选型。**（已选系统 Git 子进程；首次对账执行已实现）**
- 文件去抖、批量 commit、凭据、pull/rebase/push 和离线恢复。**（手动同步、批量 commit、凭据、
  rebase/push、稳定文件监听/去抖、profile-local 连接游标与离线 commit 队列已实现）**
- Git lock、冲突和仓库生命周期 UI。**（lock、rebase conflict、force-push pause、双方 HEAD/冲突路径展示、
  Obsidian 打开入口与 repository lifecycle diagnosis 均已实现）**
- profile 激活/销毁、网络恢复和系统唤醒接线。**（已实现；退出前执行有界的 local-only commit）**

### 阶段 4：服务端投影与 RAG

- webhook 验签、后台 ingestion、commit/blob 幂等。**（HMAC、delivery 去重、pending 恢复和单实例
  connection queue 已实现；持久化 delivery/connection claim lease 与续租已实现）**
- read model、附件、link graph、RAG 和删除传播。**（Markdown read model、全量/增量删除、Link Graph、RAG 自动索引、
  content-hash 状态回写、附件元数据投影和 identity-scoped blob 读取已实现；投影/附件工作共用 connection lease）**
- default branch 定期 reconciliation。**（启动恢复后与每 15 分钟定时检查已实现；HEAD 不变不拉全量，
  HEAD 变化重建投影，force-push 成功后恢复 Active；reconciliation 使用持久化 connection lease，并以
  `(updatedAt, id)` cursor 分批、耗尽后回绕，避免不变连接长期占用批次）**

> 进展 2026-07-19：服务端阶段 4 的 Markdown 主链已贯通。push webhook 先校验 HMAC、installation、
> repository 与 default branch，再以 delivery ID 持久化去重并按 connection 串行处理；compare 截断、
> 初次投影或 diverged history 会回退到 full snapshot，删除同时传播到 AI 索引。AI 自动索引完成后使用
> `identityId + projectionId + contentHash` 回写 `indexed / failed`，晚到旧任务不能覆盖新版投影。定时
> reconciliation 与 webhook 共用连接队列，相同 HEAD 不下载 tree，变化 HEAD 重建 Markdown snapshot，
> force-push 暂停状态可在成功重建后恢复；重复 start、stop 后延迟启动及重叠 timer 已建立规格边界。
> Repository 21 files / 136 tests、AI 37 files / 313 tests、API 14 files / 33 tests 及三者 typecheck 通过。
> 续进展 2026-07-19：Link Graph 从 Markdown projection 按需派生，支持出链、反链、alias、heading、embed、歧义/断链、
> 双向 BFS、深度与节点/边上限，并通过 identity-scoped API 暴露；Web 投影工作区已加入 Preview / Relations tabs，
> 关系节点可切换到已加载笔记，也可按 identity-scoped 单笔 API 补载。Repository link graph、projection、HTTP、client
> 聚焦测试及 App Vue Relations/Workspace 测试、App Vue 全量测试、lint 与 typecheck 均通过。
> repository-scoped 写队列已保证单 runtime 内同仓库请求串行、相同 request/hash 复用在途 Promise、request 冲突拒绝；
> 多实例 delivery/reconciliation/write claim lease 已补齐：新增 `knowledge_repository_leases` 持久化表，按
> delivery 与 connection key 条件抢占、续租和释放，随机 owner token 在关键持久化写前重新确认，过期 owner 不能覆盖
> 新实例结果；启动与定时恢复会重新入队 Received/Processing delivery。Web commit、webhook projection 与定时
> reconciliation 共用 connection lease，Pending write ledger 在前 owner 失效后可由新 owner 接续。
> reconciliation 批处理新增 `(updatedAt, id)` cursor 与耗尽回绕，未变化的连接不会长期占用首批；Repository 25 files /
> 161 tests、lint 与 typecheck 通过；API 与 App Vue typecheck 通过。待办收缩为真实 GitHub fixture/e2e。
> 续进展 2026-07-19：附件投影从 default branch tree/compare 记录相对路径、blob SHA、大小和安全媒体类型，按路径变化
> 做增量/全量删除传播；Web 通过 identity-scoped `/knowledge-attachments/:projectionId/content` 获取服务端 base64 内容，
> 服务端重新验证 installation/repository ownership、private/active 状态、blob SHA 和大小，10 MiB 以上拒绝读取，
> 不向浏览器返回 installation token。Repository 23 files / 153 tests、lint 与 typecheck 通过；App Vue typecheck
> 通过，`KnowledgeProjectionWorkspaceView.spec.ts` 的 wrapper 类型断言已同步修正。
> 续进展 2026-07-19：Web shared Markdown renderer 已改为 token-based Obsidian compatibility boundary，覆盖 inline/block
> comments、escaped highlights、heading/block target metadata、inert non-recursive embeds、allowlisted callouts、
> disabled task-list semantics 和 protocol-relative external-link hardening；新增 15 个 focused security/compatibility
> tests。App Vue 89 files / 318 tests、typecheck、lint（7 个既有 warning）与 governance check 通过；真实 GitHub E2E
> 仍是外部/后续缺口。
> 续进展 2026-07-19：附件内容读取增加 `connectionId + blobSha` 复合键的短期 PostgreSQL cache；每次请求仍先验证
> identity、private/active installation、当前 projection 和 10 MiB 上限，缓存命中还会校验 byte size，GitHub 返回的
> blob SHA/size 不匹配则拒绝并不写入缓存。服务内并发 cold miss 合并，缓存故障回退 GitHub，不影响读取正确性。
> 新增 Repository projection/cache 26 files / 169 tests、API 14 files / 33 tests，Repository/API typecheck、Repository
> lint 与 focused cache tests 通过；live GitHub E2E remains externally gated。
> 续进展 2026-07-19：新增独立、关闭 Nx cache 的 `desktop:test:live-github` acceptance target。它要求受控 fixture
> 的 `GITHUB_APP_ID`、`GITHUB_APP_PRIVATE_KEY`、`GITHUB_TEST_REPOSITORY` 和 `GITHUB_TEST_INSTALLATION_ID`，
> 通过真实 GitHub App installation inventory、confirmed Web note commit、GitHub readback、Desktop Git pull 与
> 最终 scoped cleanup commit；缺少凭据时会 fail fast，默认 test target 不会执行该 live 文件。

### 阶段 5：Web 快捷创建

- Agent 写入提案与确认 UI。**（知识投影工作区的两阶段草稿/不可变确认已实现；统一 Agent Host 提案
  协议仍由对应 active plan 承接）**
- repository 串行 commit 队列、request ID 和 HEAD 冲突重试。**（持久化 request ledger、失败原请求重试、
  已提交复用和 GitHub ref 冲突重试已实现；单 runtime 与持久化 connection lease 协调均已实现）**
- AI Web 草稿确认入库。**（确认后的 Repository adapter 写入已接通，内容变化会提升 revision 并更换
  request ID）**
- Desktop pull 后可在 Obsidian 看到 Web 新建文件。**（真实 Git 服务边界验收已通过；真实 GitHub E2E 待验收）**

> 续进展 2026-07-19：Desktop pull 验收已覆盖完整服务边界。测试使用真实系统 Git 与本地 bare remote 初始化
> app-owned Vault，由第二工作树模拟 Web/GitHub 新提交，再经 Desktop 同步服务完成 connection 解析、短期 token
> 获取、fast-forward pull、文件落盘和服务端 HEAD confirmation。Desktop 35 files / 282 tests、lint、typecheck 与
> governance-check 通过；真实 GitHub fixture/e2e 仍需在受控 GitHub App 环境中执行。

### 阶段 6：遗留收缩

- 删除数据库笔记的通用跨端编辑路径、旧同步占位和固定目录设置。
- 保留安全 Markdown 预览、关系、搜索和 RAG。
- 更新 E2E、隐私说明、数据导出和断开仓库流程。
- 不保留长期双写兼容。

> 续进展 2026-07-19：固定 AI 路径设置已从 setting schema、设置页和最后残留的 locale 文案中移除；路径解析器
> 在提案未指定子路径时只生成仓库根目录相对文件名，不再隐式回退到 `notes/`，并新增回归测试。阶段 6 的数据生命周期
> 仍未收口：现有 data-portability `repository` 数据是可重新导入的旧 Repository/Resource 快照，不能混入不可移植的
> GitHub App 授权或可重建投影；当前断开仓库是可恢复的软删除，也不会同步清理独立 AI 索引。后续必须先明确“可重新导入
> 的用户数据”与“服务端持有数据披露”的导出边界，以及断开时保留/立即清除云端投影的用户选项，再统一删除投影、附件缓存、
> write ledger 和 AI 索引，不能仅依赖 connection cascade 造成半清理。
> 续进展 2026-07-19：Prisma 服务端 AI 索引已删除 `Resource.metadata.aiKnowledgeIndex` 的长期兼容回退；索引读写、
> 失败状态和删除状态现在只使用 `AiKnowledgeIndexEntry`，专用表不可用时会显式失败而不会静默双写旧资源。pgvector
> 仍是可选的检索优化，缺失时只回退到专用索引表上的 lexical/JSON 检索。新增专用表故障回归测试，AI 索引与 API
> Repository bridge focused suites 通过；Desktop PowerSync metadata adapter 是独立本地实现，不与 Prisma 服务端双写。
> 续进展 2026-07-20：断开仓库已增加明确的保留/清理选择。默认维持可恢复软断开并保留服务端派生数据；用户勾选清理时，
> host composition edge 在单个 Prisma transaction 中按 `identityId + connectionId` 重新校验 ownership，先删除无外键的
> `AiKnowledgeIndexEntry`，再 hard-delete connection，由 cascade 清理 Markdown/attachment projection、attachment cache、
> webhook delivery 和 write ledger。HTTP query、Desktop gateway/IPC 和设置页双语 dialog 已贯通；本地 Vault、本地 Git
> 与 GitHub repository 在两种模式下均保留。现有 data-portability 文件正式定义为可重新导入的业务数据备份，设置页不再称为
> “Export All Data”，并明确排除 Vault 文件、GitHub authorization、派生 projection/cache 和 RAG；独立、不可导入的服务端
> 持有数据披露 artifact 仍是阶段 6 后续项。
> 续进展 2026-07-20：独立服务端持有数据披露已实现。受认证 Web endpoint 生成
> `memoflow.server-held-data-disclosure` v1，按 identity 通过显式 Prisma select allowlist 披露 retained repository
> connection metadata（含不可重放 installation identifier）、Markdown/attachment projection、base64 attachment cache、
> webhook delivery、write ledger 与全部 identity-scoped AI knowledge index；不读取或导出 OAuth/installation token、GitHub App
> private key 等 Memoflow 管理的可重放授权，也排除本地 Vault/Git history、GitHub repository history、worker lease 和
> 数据库内部 retrieval vector；用户仓库中的 Markdown/frontmatter/cache bytes 按原样披露。artifact kind 与普通 import
> parser 不兼容，Desktop IPC 明确返回不支持，Web 设置页提供单独下载动作与双语范围说明。
> Contracts 94、Data Portability 50 和 App Vue focused 3 个测试通过；Contracts/Data Portability/API/App Vue/Desktop typecheck
> 通过。App Vue 依赖 build 仍打印既有 `ui-vue-shadcn` TS2883 与 source-root declaration 噪声，但 Nx target 成功；真实 GitHub
> fixture E2E 仍受外部凭据限制。
> 续验证 2026-07-20：仓库标准 local-deploy 验证中的全量 affected lint、typecheck 与 test 均通过；随后
> `pnpm docker:local:up` 连续三次在 API 镜像导出后的 containerd layer 解包阶段因宿主机 Docker 存储耗尽而失败，
> 报错为 `no space left on device`。经确认清理未被运行容器使用的 build cache 与 image 后仍无法在当前容量下完成
> prod-like 重建；既有 API、Web、AI service、PowerSync、Postgres 与 Redis 服务始终保持 healthy。最新标准验证报告因此
> 仍为 `fail` / `readyForPr: no`，当前阻断属于宿主机 Docker 存储容量，不是 lint、类型或测试失败；阶段状态继续保持实施中。
> 续进展 2026-07-20：旧数据库笔记的可达跨端编辑路径已收缩。API host 只挂载 GitHub knowledge connection、投影、
> 附件与 confirmed-create 路由，不再挂载 Repository/Folder/Resource CRUD，也不再注册 Editor API module；Desktop
> Repository IPC 只保留 Local Vault 与 GitHub connection/reconciliation/sync，Editor Electron runtime 不再注册；Vue
> `/note/:id`、Mobile Repository/folder/note-editor 路由与 React mobile 旧客户端依赖均已移除。旧 Repository/Folder/Resource
> 与 Editor workspace 数据只继续服务已明确标注的可重新导入备份，不构成运行时 Markdown 编辑源。旧 Web E2E 已替换为
> projection-only 空连接边界与 legacy mutation endpoint 404 规格。Repository focused 2 files / 11 tests、App Vue router
> 1 test、Repository/API/App Vue/App React/Mobile typecheck、相关文件 lint 与 Playwright test discovery 通过；Desktop 独立
> `tsc` 仍受既有 source/dist 重复类型噪声影响，标准 affected typecheck 在本轮变更前已通过，但 pnpm store SQLite 故障使
> 当前标准依赖链无法重新执行。

> 续进展 2026-07-21：完成定义 §13.2 证据审计（代码/规格为主，不凭感觉勾选）与阶段 6 残留收口。
> **§13.2 审计结果**：
> 1. 账密/GitHub/访客入口 — **部分实现**：三入口代码与 Desktop profile 在位；完整三端 E2E 未齐。
> 2. GitHub 登录与仓库授权解耦 — **已证明**：独立 contract/token/UI/routes；登录不申请 Contents。
> 3. 访客/未绑定不上传 Vault — **已证明**：访客无 knowledge connection；未绑定仅 Local Vault。
> 4. Desktop Vault 云端故障仍可用 — **已证明**：Local Vault 不依赖云端；同步离线本地 commit 队列。
> 5. GitHub App 仅访问明确授权仓库 — **已证明**：installation + repository_ids / private-admin-active 校验。
> 6. private 创建/连接且双非空不覆盖 — **已证明**：reconciliation 映射 `ManualResolutionRequired`。
> 7. Desktop Git 离线恢复且禁 force push — **已证明**：sync runtime 规格与实现。
> 8. 冲突暂停并保留双方 — **已证明**：rebase 冲突保留路径与双方 HEAD。
> 9. Web 新建唯一 commit / 幂等 — **已证明**：confirmed create + request ledger。
> 10. 已有笔记编辑首期关闭 — **已证明**（已勾选）：无 `/note/:id` 全文编辑入口。
> 11. AI 无固定目录 + 确认写入 — **已证明**：固定路径设置移除；confirmed proposal/write。
> 12. Agent 上下文隔离/不绕过确认 — **部分实现**：提案确认与 path 边界在位；完整 Agent Host 安全面仍由 ADR-035 plan 收口。
> 13. webhook/read model/附件/RAG 可重建 — **已证明**：projection + reconciliation + AI index 专用表。
> 14. Web Markdown 安全 — **已证明**：sanitizer/危险 URL 测试边界。
> 15. lint/typecheck/test/E2E/governance/prod-like — **部分验证 + 外部阻塞**：prod-like `docker:local:up` 残留二十七轮已绿（六服务 healthy）；真实 GitHub fixture 缺凭据；全量 PR 门禁套件未宣称通过。
> **阶段 6 本轮代码收口**：删除未挂载的 legacy `folder/repository/resource` API route builders；壳层/AI 最近笔记改为
> Web projection + Desktop Local Vault，不再调用已退役 Resource CRUD；`/repository?note=` 深链选中；Note capsule /
> AI open 跳转 projection/local workspace。旧 `RepositoryWorkspaceView` 与 `packages/editor` 仍残留为非路由死代码，
> 下轮继续删除。计划状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留二轮）：客户端 HTTP/IPC adapter 对已退役 Repository/Folder/Resource/Bookmark
> 方法硬失败 `NOT_SUPPORTED`，不再请求未挂载端点或未注册 IPC channel；Web MSW 仅保留 knowledge connection/
> projection 与 legacy 404 边界；删除未引用的 `RepositoryWorkspaceView`；E2E 补 `GET /repositories/current`
> 与 folders 404。旧 editor 模块与 useRepository 死代码仍在，但运行时入口已切断。状态保持实施中。

> 续进展 2026-07-21（阶段 6 残留三轮）：删除 `packages/app-vue` 整包 editor 模块与遗留 `useRepository`/
> repository-store/dead components；public exports 与 Desktop PowerSync invalidation 不再引用旧 Resource
> 表；AI/Note capsule 仅依赖 projection/local-vault 路径。`packages/editor` 服务端/包骨架仍在仓库中但
> 不再作为 app-vue 运行时入口。状态保持实施中。

> 续进展 2026-07-21（阶段 6 残留四轮）：摘除宿主 `@dailyuse/editor` 死接线——`apps/api`、`apps/desktop`、
> `packages/data-portability` 的 package 依赖，以及 api/desktop/web 的 tsconfig path 与 vite/vitest alias；
> data-portability 仍通过 Prisma/PowerSync 导出导入 editor workspace 作为可再导入备份，不依赖 `@dailyuse/editor` 包。
> 壳层 `MODULE_PREFIXES` 移除退役 `/note`；`sanitizeLegacyTabs` 清理持久化的 `/note*` Tab；删除未使用
> `createMockEditorStore`。验证：app-vue focused 3 files / 21 tests、`daily-use:governance-check` 通过。
> `packages/editor` 包本身与 Prisma `editor_*` 表仍保留。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留五轮）：删除整个 `packages/editor` 运行时包；同步清理根 tsconfig path、
> root vitest project、eslint scope:editor 边界、target-baseline / server-feature-shape / scope-constraint /
> package-export（app-vue `./modules/editor`）与 nx graph。产品文档 `modules/editor.md` 与
> `module-index/editor-files.md`、`feature-map` 改为指向 repository 工作区 + `safe-markdown`；可再导入
> `editor_*` 备份表与 contracts/editor DTO 保留。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留六轮）：从 `contracts` 共享 `AppEventRegistry` / `AppRpcRegistry` 拆除
> 已退役 `EditorEventMap` / `EditorRpcMap`；Desktop IPC 前缀 `editor:` 仍为空集合。`domain-shared` tsup
> 仅构建现存入口。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留七轮）：删除 `@dailyuse/contracts/editor` 整模块与 `EditorChannels` IPC 常量、
> Editor* branded IDs；package export/tsup/package-export-audit/README 同步。portable editor 契约仅保留在
> `@dailyuse/contracts/data-portability`。产品 `editor-files` 索引已对齐。验证：`contracts:typecheck`、
> desktop ipc-contracts 30、`governance-check` 通过。§13.2 未打勾项仍为：三入口完整 E2E（Web 账密/GitHub E2E
> + Desktop guest 单测已有，跨端一揽子 E2E 未齐）、Agent Host 全量隔离（ADR-035）、以及外部阻塞验收。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留八轮）：收缩 `RepositoryChannels` 为 knowledge connection + Local Vault；
> 删除 resource/folder/bookmark/current/search 遗留 IPC 常量；`RepositoryRpcMap` 清空为无 runtime RPC。
> Desktop IPC 与 Electron module 回归：repository electron 1、ipc-contracts 30、contracts typecheck 通过。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留九轮）：`RepositoryApplicationPort` / `createRepositoryModule` /
> Prisma 组合根收缩为 knowledge connection、projection、confirmed create、webhook 仅有面；
> 删除 `RepositoryController` 与 module 级 resource-mutations 集成测试；客户端 port/service/HTTP/IPC
> adapter 去掉 legacy CRUD 方法。残留 domain use-case 文件与 memory/PowerSync resource 适配器仍在仓库中
> 但不再挂入运行时组合根。验证：repository focused module/client/knowledge suites 通过。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留十轮）：删除未挂载的 legacy application 层 Folder/Resource/Bookmark/
> create-repository/upload/stats use-cases 与 `ResourceMutationService` /
> `StoredResourceHydrationService` / `RepositoryResolutionService` 及对应单测；保留 knowledge 服务与
> `publishRepositoryResourceMutation`。收紧 client/infrastructure-client 桶导出（去掉已删 CRUD request 类型）；
> testing helper 收缩为 knowledge-only 模块壳。验证：`repository:test` 18 files / 129 tests、
> `repository:typecheck`、`daily-use:governance-check` 通过。domain/PowerSync/Prisma resource 适配器与
> portable 边界仍保留。§13.2 未完成项不变。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留十一轮）：删除未引用的 legacy 基础设施适配层——Prisma/PowerSync/memory
> Folder/Resource/Repository/Bookmark repositories 与 mappers、`RepositoryRepositoryFactory`；
> 去掉空的 `createRepositoryUseCases` / `RepositoryModuleUseCases` 袋；`createRepositoryPowerSyncModule`
> 仅返回 knowledge-only 模块壳。data-portability 仍直接写 Prisma 表，schema 与 portable 边界未动。
> 验证：`repository:test` 129、`repository:typecheck`、`governance-check` 通过。domain 实体/值对象与
> domain-client 仍保留（AI ResourceClientDTO 兼容视图与 FolderHierarchy 单测）。§13.2 未完成项不变。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留十二轮）：删除 `packages/repository` 遗留 `server/domain` 聚合/实体/
> 仓储接口与 `domain-client`；保留空 `server/domain` 桶以满足 server-feature-shape 治理。收缩
> `@dailyuse/contracts/repository`：去掉 Folder/Resource/Bookmark CRUD Zod/DTO、bookmark 实体、
> tree/search、legacy lifecycle events；`RepositoryEventMap` 仅保留 `repository:resource:mutated`；
> 保留 `ResourceClientDTO`/`RepositoryClientDTO` 与 AI/mock 依赖的 value objects。验证：
> `repository:test` 17/119、`contracts:test` 11/94、两边 typecheck、`governance-check` 通过。
> portable schema 与 data-portability 边界未动。§13.2 未完成项不变。状态保持 **实施中**；
> PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留十三轮）：重写过时的 `docs/product/module-index/repository-files.md`，
> 对齐 knowledge + Local Vault 真值（删除已不存在的 CRUD 视图/route/use-case 路径）；更新
> `feature-map` 资源库状态与 `repository.md` 日期。验证：`daily-use:governance-check`。
> 代码边界无变更；§13.2 未完成项不变。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留十四轮）：AI 知识笔记确认创建路径去掉 `ResourceClientDTO` 兼容面，
> 改为 contracts `KnowledgeNotePersistedRef` + `CreateKnowledgeNoteRes.note`；同步 persistence port、
> API/Desktop adapter、ai-runtime executedActions、app-vue NoteSummary/workflow/panel 与相关单测/E2E 载荷。
> 验证：`contracts`/`ai` 知识笔记相关 test 与 api/desktop adapter specs（见提交说明）。§13.2 未完成项不变。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留十五轮）：删除已无运行时消费者的 `ResourceClientDTO` /
> `RepositoryClientDTO`、配套 value objects 与 `createMockRepository`/`createMockResource`；
> Web `goal-workflow` E2E 去掉退役 editor/session/tab/resource/current-repository 路由 mock，
> citation open 仅依赖 `/repository` 导航。更新 `repository-files` 索引。验证：`contracts:test`、
> `daily-use:governance-check`（见提交说明）。§13.2 未完成项不变。状态保持 **实施中**；
> PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留十六轮）：删除 HTTP/IPC adapter 中已无调用的
> `legacyDatabaseRepositoryUnavailable` hard-fail stub；Web repository handlers 单测改为断言
> 退役 CRUD 方法不存在于客户端面；app-vue `repository` locale 删除 createResource/folder/editor
> tabs/bookmarks 等死文案，仅保留 route/segments/projection/localVault。验证：repository adapter
> specs、web handlers spec、governance-check。§13.2 未完成项不变。状态保持 **实施中**；
> PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留十七轮）：删除 app-vue 顶层退役 `editor` 模块 locale（无
> `editor.*` 运行时引用）；删除无 UI 挂载的 `setting.tabs` / `setting.editor` 文案；移除
> contracts repository 空 `entities`/`dtos`/`value-objects` 桶导出。EditorSchema 与 portable
> preferences.editor 字段仍保留（备份兼容）。验证：contracts test/typecheck、app-vue setting
> focused specs、governance-check。§13.2 未完成项不变。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留十八轮）：删除无运行时调用的 `createRepositoryPowerSyncModule`
> 兼容壳；知识笔记 `AIKnowledgeNotePathResolver` 增加 vault-escaping 路径拒绝（绝对路径/`.`/`..`）
> 作为应用层 defense-in-depth，并补回归测试；§13.2 三项未勾选项补充当前证据指针（仍为部分/
> 外部阻塞）。验证：ai path-resolver + knowledge-note service specs、repository module tests、
> governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留十九轮）：Agent 隔离 hardening——`resumeRun` 仅在
> `userDecision=confirm` 时解析 `execution.required` 并执行 side-effect（cancel/clarify 即使上游
> 仍返回 interrupt 也不写入）；补 runtime 对抗用例（cancel 不落盘、vault-escaping path 失败、
> 不支持的 `update_knowledge_note` 工具失败）；过时 UI redesign 文档对 `ResourceClientDTO`/`/note/:id` 加
> supersede 横幅。§13.2 Agent 项证据增强但仍为部分（缺完整 Capability/Turn E2E 与真实 fixture）。
> 验证：`remote-ai-service.runtime` focused specs、governance-check。状态保持 **实施中**；
> PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留二十轮）：首期 Agent 能力面收缩——从 TS/Python
> `AgentToolName` 移除 `update_knowledge_note` / `reindex_resource`（与“已有笔记编辑关闭”一致，
> create-only）；同步 locale/formatters；contracts 拒绝退役工具；runtime 对抗改为
> knowledge.generate 跨能力 `create_goal` 失败 + goal.create cancel 不执行 automation。
> §13.2 Agent 证据再增强，仍为部分。验证：contracts agent dto specs、ai runtime specs、
> governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留二十一轮）：删除 AI knowledge index diagnostics 中已无返回值的
> `legacy-resource-metadata` backend 枚举（服务端只报 `prisma-index-table`，Desktop 仍报
> `powersync-resource-metadata`）。与“专用索引表、无旧 Resource.metadata 回退”边界对齐。
> 验证：contracts/ai capabilities & knowledge-index focused specs、governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留二十二轮）：访客/离线占位 token 不得扩大云端授权——
> `toCloudAccessToken` 过滤 `guest-local-token`/`local-token`；Desktop knowledge remote gateway、
> Auth online getAccessToken、PowerSync credentials/upload 均拒绝；设置页仅 `ONLINE_USER` 显示
> GitHub 连接控件，访客/离线文案明确。§13.2 访客不上传与 Agent 授权扩大证据增强（仍缺完整
> 三入口 E2E 与 ADR-035 full E2E）。验证：desktop knowledge gateway specs、KnowledgeRepositorySettings
> specs、governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留二十三轮）：补三入口 surface contract 单测证据——
> Desktop `DesktopAuthView` 暴露账密 + 访客、无 GitHub OAuth 入口；Web `WebAuthView` 暴露账密 +
> 条件 GitHub OAuth、无访客入口（OAuth 未配置时隐藏 GitHub）；Agent 反向能力隔离——`goal.create`
> executor 对 `create_knowledge_note` fail-closed 且不调用 goal automation / knowledge persistence。
> §13.2 三入口与 Agent 项证据增强，仍为部分（缺完整三端 fixture E2E 与 ADR-035 Capability/Turn E2E）。
> 验证：app-vue DesktopAuthView specs、web WebAuthView specs、ai runtime cross-capability specs、
> governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留二十四轮）：Web 未认证访问硬跳转平台 AuthApp——
> `createAuthGuard` 在非 Desktop 环境对需登录路由执行 `window.location.replace(/auth?redirect=…)`，
> 避免 SPA 落入 in-shell 遗留 `AuthView`（曾暴露访客入口）。遗留 `AuthView` 访客按钮仅 Desktop 显示，
> 作为 defense-in-depth。§13.2 三入口边界证据增强（仍缺同一 fixture 端到端串联）。
> 验证：app-vue guards/AuthView specs、governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留二十五轮）：删除无运行时入口的旧 `LoginForm`/`RegisterForm`
> （及 stories/specs）；Web 主壳 `/auth` 默认组件从遗留 `AuthView` 改为 `AuthPlatformEntry`
> （full-page reload 进入 AuthApp/WebAuthView，杜绝 in-shell 访客 UI）；Desktop 仍注入
> `DesktopAuthView`。§13.2 三入口边界再收口。验证：app-vue AuthPlatformEntry/router/guards specs、
> governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留二十六轮）：删除无消费者的 `useSmsCodeCountdown`；Agent runtime
> 对 get/start/resume/list 增加 identity 归属 fail-closed（返回 `FORBIDDEN` / 过滤外 identity）；
> contracts agent-host 增加纯函数 `resolveRunPlan`/`knowledgeWriteRequirements`（surface 隔离、
> 缺能力 fail-closed、writable mutation 不可由 readonly 满足）。§13.2 Agent 项证据增强，仍为部分
> （缺完整 ADR-035 Capability/Turn E2E）。验证：contracts capabilities specs、ai runtime identity
> isolation specs、governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留二十七轮）：本地 prod-like 验证链路解阻塞。package `project.json`
> build 命令从 `pnpm exec tsup/tsc` 改为直接 `node ../../node_modules/...`，`.npmrc` 增加
> `pm-on-fail=ignore`，避免 host Corepack/pnpm minor 不一致导致 package build 失败；
> `tools/docker/local-compose.mjs` 优先 `corepack pnpm` 做 build-prep，并为缺失的
> `REDIS_PASSWORD`/`JWT_SECRET`/`DB_PASSWORD` 注入本地校验默认值（非真实密钥）。
> 删除无消费者的 `ai.diagnostics` locale 块（en-US/zh-CN）。
> 验证：`nx build api`、`nx build web --configuration=production` 成功；
> `node ./tools/docker/local-compose.mjs up` 成功；
> `postgres/redis/ai-service/api/web/powersync` 六个服务均为 healthy；
> Web `http://localhost:58080/` → 200，API `/health` → 200 `{"status":"ok"}`。
> §13.2 第 15 项 prod-like 磁盘/启动阻塞解除，但仍缺全量 lint/typecheck/test/E2E/governance 与
> 真实 GitHub fixture E2E。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留二十八轮）：文档/证据收口——纠正 `docs/product/modules/authentication.md`
> 中过时的“OAuth 仅服务端骨架 / 缺少 Web GitHub 登录 UI”表述，对齐已实现的 providers/url/callback/
> bind/unbind、Web AuthApp GitHub 入口、Desktop 首屏无 GitHub、账户页 bind 与知识仓库 GitHub App 分离。
> 补 `three-login-surface.matrix.spec.ts` 固化 ADR-034 三入口面矩阵；扩展 contracts
> `resolveRunPlan` 隔离规格（Web knowledge-write 需 cloud_rag、跨 surface fail-closed、goal offer 不能顶替
> knowledge mutation）。§13.2 三入口与 Agent 项证据增强，仍为部分（缺同一 fixture 端到端与完整
> Capability/Turn E2E）。验证：contracts capabilities specs、app-vue matrix spec、governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留二十九轮）：Agent start 门禁接线——`createAgentRuntimeService.startRun`
> 在调用 Python/runtime 前对 `knowledge.generate` 用 `resolveRunPlan` +
> `knowledgeWriteRequirements('web')` fail-closed（缺 knowledge note / cloud_rag 则
> `SERVICE_UNAVAILABLE`）；`goal.create` 仍可在 start 阶段规划，mutation 在 execution.required
> 解析时强制。导出 `buildAgentRuntimeCapabilityOffers` / `assertAgentStartCapabilityPlan`。
> contracts 增加 `goalAutomationRequirements` 纯函数。app-vue 删除无 UI 的 phone/SMS
> composable 入口（`loginByPhone`/`registerByPhone`/`sendSmsCode`）。§13.2 Agent 项证据增强，
> 仍为部分（缺完整 Capability/Turn E2E）。验证：contracts capabilities specs、ai-runtime-capabilities
> specs、remote-ai-service runtime agent specs。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-21（阶段 6 残留三十轮）：删除无真实实现的手机/SMS 登录注册运行时面——contracts
> `LoginByPhone`/`RegisterByPhone`/`SendSmsCode` DTO 与 `auth:send-sms-code` RPC/IPC channel；
> authentication API 路由 `/login/phone` `/register/phone` `/sms/send`、controller/port/module stub、
> HTTP/IPC client 方法、Desktop `SEND_SMS_CODE` handler、Web MSW phone/SMS mock。保留
> `PhoneIdentifier` 领域模型。§13.2 三入口边界进一步收口为账密 + GitHub + Desktop 访客。
> 验证：authentication routes/controller 相关 specs、contracts typecheck、desktop ipc-contracts。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留三十一轮）：删除认证双轨兼容残留——`IPasswordResetCodeStore` /
> `InMemoryPasswordResetCodeStore`（已由 `IVerificationChallengeStore` + PasswordReset purpose 取代）
> 以及 reset-password 未使用的 throw 型错误类。Web Auth 页面契约（e2e + WebAuthView 单测）明确
> 无 phone/SMS/guest 入口。§13.2 三入口边界再收口。验证：authentication forgot/reset specs、
> WebAuthView spec、auth routes specs。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留三十二轮）：删除无消费者的 `@deprecated` `DesktopAIRuntime`
> （`packages/ai/src/electron/services/desktop-ai-runtime.ts`；组合根已是 `createAIPowerSyncModule`）。
> 补 ADR-035 Capability/Turn 同一 fixture journey 规格（surface plan / start gate / confirm-only mutation /
> cancel / cross-capability / identity isolation / vault path+tool surface）。
> 补三入口同一 fixture journey（Web hard-redirect + AuthApp/Desktop 面 + 访客升级 vault 边界）与
> Desktop `toCloudAccessToken` 单测 + guest-upgrade vault journey。
> §13.2 三入口与 Agent 项证据再增强，仍为部分（缺真实跨端 Playwright/Electron 与多 Turn Engine E2E、
> 真实 GitHub fixture）。验证：ai journey specs、app-vue three-login matrix/journey、desktop
> toCloudAccessToken + guest-upgrade journey、governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留三十三轮）：继续删除无消费者双轨兼容面——Desktop
> `configureMainProcessDependencies` / `resetAllContainers` / `isDIConfigured` no-op；
> 删除无调用的 `connectPowerSync` / `promotePowerSyncToSync` / `disconnectPowerSync`，
> 公开入口收敛为 `openPowerSyncLocalOnly` + `ensurePowerSyncSyncMode` + `shutdownPowerSync`；
> 删除 app-vue `clampPanelWidthToViewport` 弃用别名；删除 contracts `ResponseCode` /
> `ResponseBuilder` / `ApiResponse` 等 Result 旧别名并修正 contracts README。
> 补 `powersync-public-surface.spec.ts` 防回归。§13.2 未打勾项仍为部分/外部阻塞（真实跨端 E2E、
> 全量 PR 门禁、GitHub fixture）。验证：desktop powersync surface + profile specs、app-vue shell store
> specs、contracts typecheck（或 result 相关）、governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留三十四轮）：删除已无注册方的懒加载模块双轨——
> `apps/desktop/src/main/di/`（`lazy-module-loader` + 空 DI barrel）、
> `SystemChannels.GET_LAZY_MODULE_STATS` / `system:getLazyModuleStats` handler，以及
> shared containers 对 main/di 的过时指引。GoalProgressChart 去掉 `startTime`/`endTime`
> 遗留字段双轨回退，只使用 `startDate`/`targetDate` 契约；删除已无源码的 `@dailyuse/contracts/response` 导出与 API vitest 别名。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：desktop system-handlers + ipc-contracts specs、app-vue goal 相关 specs（如有）、
> contracts typecheck、governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留三十五轮）：收口 AI conversation 双轨——删除无传输层消费者的
> `CreateConversationUseCase` / `DeleteConversationUseCase` / `GetConversationUseCase` /
> `ListConversationsUseCase` 与 `createAIUseCases` / `AIModuleUseCases` / `module.useCases`；
> 运行时仅保留 conversation V2 服务（HTTP/IPC 已接线）。同步删除无引用的
> `infrastructure/errors/a-i-errors.ts` 兼容 re-export。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：ai typecheck + focused runtime/module tests、governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留三十六轮）：AI conversation 命名收口——`*ConversationV2UseCase` 与
> `conversationServices.*V2` 字段统一为无版本后缀的规范名（v1 已在三十五轮删除）；补
> `conversation-services.surface.spec.ts` 防回归。删除 Desktop 认证无消费者 stub 服务层
> `application/services/{login,logout,change-password,get-status}`（真实入口在
> credential coordinator / AuthDesktopApplicationService）。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：ai conversation surface + runtime focused specs、desktop 相关 specs（如有）、governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留三十七轮）：删除无传输层 / `AIApplicationPort` 接线的 conversation
> 死用例 `AddConversationMessageUseCase`、`GetConversationsByStatusUseCase`、
> `UpdateConversationStatusUseCase` 及其 runtime 装配字段；消息写入仅走 chat send/stream，
> conversation host 表面只保留 create/get/list/update/delete。同步收口 Desktop
> `TokenData`→`TokenStorageData` 双轨类型别名与若干 “backward compatibility” 注释（
> `LoginCredentials`/`getBootstrapper`/`setMenuLocale` 仍有真实消费者，保留）。§13.2 未打勾项
> 仍为部分/外部阻塞（缺真实 OAuth/GitHub fixture 跨端 E2E、Agent multi-turn E2E、全量 PR 门禁）。
> 验证：ai conversation surface + runtime focused specs、governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留三十八轮）：删除无传输层 / `AIApplicationPort` 接线的
> `GetDefaultAIProviderUseCase`（默认提供方经 `setDefault` + list/`isDefault` 与
> `findDefaultByIdentityId` 解析，客户端不再需要 getDefault 装配）；补
> `provider-services.surface.spec.ts`。Desktop 登录凭证类型去掉 `LoginCredentials`
> 双轨别名，统一使用 contracts `EmailLoginCredentials`。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：ai provider/conversation surface + runtime focused specs、governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留三十九轮）：Desktop auth 生命周期 `AutoLoginResult` 不再重复定义，
> 复用 infrastructure `session-types`；`SessionRestoreResult` 仅叠加 `hasValidSession`。
> app-vue AI 去掉 `LegacyWorkflowMode`/`PersistedWorkflowMode` 双轨类型，`normalizeWorkflowMode`
> 对旧持久化短 id（`goal`/`knowledge-note`）做单向映射。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：desktop lifecycle/auth specs、app-vue AI focused specs、governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留四十轮）：增强 §13.2 部分项证据（仍不打勾）——ADR-035 journey 增加
> multi-turn 二次 confirm 不重复落盘、Web surface 不能顶替 Desktop local_vault write requirements；
> 三入口 matrix journey 增加 GitHub 登录≠仓库 App 授权边界断言。无外部凭据，不宣称跨端 E2E 完成。
> 验证：adr-035 journey、three-login matrix specs、governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留四十一轮）：删除 conversation 仓储死表面
> `findByStatus` / `findRecent` / `exists`（无传输层/use-case 调用；列表分页走
> `findByIdentityId` + 应用层 slice；消息写入仍在 chat send/stream）。同步 memory/prisma/
> powersync 适配与 test stub，补 `ai-conversation-repository.surface.spec.ts`。§13.2 未打勾项
> 仍为部分/外部阻塞。验证：ai conversation/repo surface + focused runtime specs、governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留四十二轮）：删除 provider-config 仓储死表面
> `findByIdentityIdAndName` / `exists`（无 use-case/传输层调用；默认解析走
> `findDefaultByIdentityId`，删除/读写走 id 主键）。同步 memory/prisma/powersync 与 test
> stub，补 `ai-provider-config-repository.surface.spec.ts`。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：ai provider-config repo surface + provider focused specs、governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留四十三轮）：删除认证 identity 仓储 phone 登录查询死表面
> `findByPhone` / `existsByPhone`（phone/SMS 已非三入口运行时登录面；保留
> `PhoneIdentifier` 领域类型与 portable 标识数据）。同步 prisma/powersync 适配与 mock，
> 补 `auth-identity-repository.surface.spec.ts`；三入口 matrix 增加 step 7 无 phone/SMS。
> §13.2 三入口仍为部分（缺真实 OAuth fixture 跨端 E2E）。验证：authentication focused
> specs、three-login matrix、governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留四十四轮）：继续 phone 登录残留收口——删除 account 仓储
> `findByPhone`（availability 仅 email/nickname）；删除 Desktop `DEVICE_TRUST` IPC 空 stub
> （NOT_IMPLEMENTED、无 renderer 消费者）及 contracts channel。§13.2 仍为部分/外部阻塞。
> 验证：account focused specs、desktop auth shell/ipc contracts specs、governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留四十五轮）：删除 Desktop 2FA / API Key 管理双轨死表面——
> `DesktopAuthSecurityAdminService` 与 facade 委托、`desktop-auth-shell` IPC handlers、
> contracts `AuthChannels` TWO_FACTOR_* / API_KEY_* 及 `TwoFactorStatus`/`ApiKeyInfo` 类型
> （均为 NOT_IMPLEMENTED/空返回，无 app-vue/web renderer 消费者）。保留 session/device 与
> guest/status/init 活路径。补 `ipc-channels.auth-surface.spec.ts`。§13.2 仍为部分/外部阻塞。
> 验证：desktop auth security/admin + shell + ipc contracts/auth-surface specs、governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留四十六轮）：删除 Desktop device 管理 IPC 死表面——
> `listDevices`/`getCurrentDevice`/`revokeDevice`/`renameDevice` 服务与 facade、shell handlers、
> contracts `DEVICE_*` channels 与 `DeviceInfoUI` 类型（无 app-vue/web 消费者；`revokeDevice`
> 为 NOT_IMPLEMENTED、`renameDevice` 为 no-op）。保留 session 管理与 guest/status/init。
> 扩展 `ipc-channels.auth-surface.spec.ts`。§13.2 仍为部分/外部阻塞。
> 验证：desktop auth security/admin + shell + ipc contracts/auth-surface specs、governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留四十七轮）：删除无 `AuthIpcAdapter`/renderer 消费者的诊断会话 IPC——
> `VERIFY_TOKEN`/`TOKEN_STATUS`/`SESSION_STATUS`/`CLEANUP_SESSIONS`/`SESSION_GET_CURRENT`/
> `SESSION_REVOKE_ALL` 及对应 facade/lifecycle/security-admin 委托。保留
> `SESSION_LIST`/`SESSION_REVOKE`（AccountProfile 会话 UI + IPC adapter）与 status/init/guest。
> 扩展 auth-surface。§13.2 仍为部分/外部阻塞。验证：desktop auth + ipc contracts/auth-surface、
> governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留四十八轮）：消除 Desktop auth shell 本地 `Ch` 与 contracts
> `AuthChannels` 双轨——handlers 直接使用 `AuthChannels`/`Object.values(AuthChannels)`；
> 补 `desktop-auth-shell.surface.spec.ts`。§13.2 仍为部分/外部阻塞。
> 验证：desktop auth shell + module-handler-contracts + ipc-contracts + auth-surface、
> governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留四十九轮）：删除 governance `mapper-helpers` 兼容 re-export shim，
> prisma/powersync mappers 与 repository 直接 import `@dailyuse/utils/shared`。§13.2 仍为
> 部分/外部阻塞。验证：governance focused specs（如有）+ governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留五十轮）：删除无真实调用的兼容别名——ui-core
> `generateStrongPassword`（= `generatePassword`）与 goal
> `KeyResultProgress.updateCurrentValueByAggregation`（= `recalculateFromHistory`），
> 并收缩 barrel 导出。§13.2 仍为部分/外部阻塞。
> 验证：goal value-objects + ui-core/ui-vue-shadcn 相关 specs（如有）、governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留五十一轮）：删除 Web E2E 双轨测试用户别名
> `TEST_USER`/`TEST_USER_2`/`ADMIN_TEST_USER`，调用方统一 `TEST_USERS`（`e2e/config`）。
> §13.2 仍为部分/外部阻塞。验证：e2e 文件 import 语法自检、governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留五十二轮）：删除 `@dailyuse/utils` 根级 `src/uuid.ts` 与
> `shared/uuid.ts` 双文件——domain `create-id-type` 改为 import `shared/uuid`，uuid 单一
> 真值在 `shared`。§13.2 仍为部分/外部阻塞。验证：utils typecheck + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留五十三轮）：删除无消费者的 `ipc-client` `ElectronAPI` 兼容别名
> （保留 `ElectronBridge`）；删除 API 向后兼容 `/health` 探针（compose/e2e 统一
> `/healthz`，E2E `HEALTH_ENDPOINT` 同步）。§13.2 仍为部分/外部阻塞。
> 验证：ipc-client tests + governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留五十四轮）：删除 API `AuthenticatedRequest.identityId`/
> `sessionId` 双轨字段——认证真值仅 `req.user`；PowerSync 路由与 `requireAuth`/
> `getCurrentAccountId` 统一读 `req.user.identityId`。§13.2 仍为部分/外部阻塞。
> 验证：api powersync/auth middleware specs + governance-check。状态保持 **实施中**；
> PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留五十五轮）：折叠 account 资料读取 IPC 三轨（`account:get` /
> `account:current` / `account:get-me`）为单一活通道 `GET_ME`；删除无 renderer 消费者的
> `account:list`；account electron 注册改为 contracts `AccountChannels`（去掉本地 `Ch` 双轨）。
> 补 `ipc-channels.account-surface.spec.ts` 与 `account-electron.surface.spec.ts`。
> §13.2 仍为部分/外部阻塞。验证：account/contracts focused specs + desktop ipc contracts +
> module-handler-contracts + governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留五十六轮）：setting electron 本地 `Ch` 折叠到 contracts
> `SettingChannels`；`SettingIpcAdapter` 去掉 `setting:` 字符串拼接双轨，统一 invoke
> `SettingChannels.*`；删除 API `requireAuth`/`getCurrentAccountId` 无消费者辅助函数。
> 补 setting electron/adapter surface specs。§13.2 仍为部分/外部阻塞。
> 验证：setting focused specs + desktop ipc/module-handler contracts + api auth middleware
> specs + governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留五十七轮）：reminder electron 本地 `Ch` 与 adapter
> `REMINDER_CHANNELS` 双轨折叠到 contracts `ReminderChannels` 单一真值。补 electron/adapter
> surface specs。§13.2 仍为部分/外部阻塞。验证：reminder focused specs + desktop
> ipc/module-handler contracts + governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留五十八轮）：删除 task electron 不支持的 `task:instance:update`
> 死通道（仅抛错、无 adapter 消费者）；task electron 本地 `Ch` 折叠到 contracts
> `TaskChannels`。补 task electron/contracts surface specs。§13.2 仍为部分/外部阻塞。
> 验证：task/contracts focused specs + desktop ipc/module-handler contracts + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留五十九轮）：contracts `GoalChannels` 补齐活通道
> `ARCHIVE_EXPIRED`（`goal:archiveExpired`）；goal electron 本地 `Ch` 与 goal/folder/focus
> IPC adapters 字符串拼接双轨折叠到 `GoalChannels`。补 goal electron/adapter/contracts surface
> specs。§13.2 仍为部分/外部阻塞。验证：goal/contracts focused specs + desktop
> ipc/module-handler contracts + governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留六十轮）：repository electron 本地 `Ch`（部分已别名
> `RepositoryChannels`、部分字面量）与 `RepositoryIpcAdapter` 字符串拼接双轨折叠到 contracts
> `RepositoryChannels` 单一真值。补 electron/adapter surface specs。§13.2 仍为部分/外部阻塞。
> 验证：repository focused specs + desktop ipc/module-handler contracts + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留六十一轮）：AI electron 本地 `Ch` 折叠到 contracts
> `AIChannels`；stream push 事件保持 `AIStreamChannels`（不再把 chunk/done/error 放进本地
> handler 频道表双轨）。补 ai electron + contracts ai-surface specs。§13.2 仍为部分/外部阻塞。
> 验证：ai/contracts focused specs + desktop ipc/module-handler contracts + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留六十二轮）：notification electron 本地 `Ch`/`RendererCh` 与
> adapter `NOTIFICATION_CHANNELS` 双轨折叠到 contracts `NotificationChannels`；custom 频道仍由
> desktop `custom-notification.manager` 注册，destroy 仍清理完整 NotificationChannels 集合。
> 补 electron/adapter surface specs。§13.2 仍为部分/外部阻塞。验证：notification focused specs +
> desktop ipc/module-handler contracts + governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留六十三轮）：删除 schedule 事件 throw-only 死通道
> `schedule:complete`/`cancel`/`reschedule`；schedule electron `EventCh`/`TaskCh` 与
> event/task adapters 本地 `SCHEDULE_*_CHANNELS` 折叠到 contracts `ScheduleChannels`。
> 补 schedule electron/adapter + contracts schedule-surface specs。§13.2 仍为部分/外部阻塞。
> 验证：schedule/contracts focused specs + desktop ipc/module-handler contracts + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留六十四轮）：desktop `system-handlers` 与 `dashboard-handler`
> 字符串频道双轨折叠到 contracts `SystemChannels`/`DesktopFeatureChannels`/
> `DashboardChannels`。补 system-handlers/dashboard-handler surface specs。§13.2 仍为部分/
> 外部阻塞。验证：desktop system-handlers + surface + ipc contracts + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留六十五轮）：desktop `ipc-cache` 管理 handlers 与列表 TTL 键、
> `memory-monitor` dev handlers 折叠到 contracts `CacheChannels`/`DevChannels` 及
> Goal/Task/Dashboard/Reminder 频道常量。补 surface specs。§13.2 仍为部分/外部阻塞。
> 验证：desktop focused surface/specs + governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留六十六轮）：新增 contracts `AutoUpdateChannels`，desktop
> auto-update IPC handlers 从字符串频道折叠到 contracts 单一真值。补 contracts/desktop
> surface specs。§13.2 仍为部分/外部阻塞。验证：contracts + desktop focused specs +
> governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留六十七轮）：auto-update 与 ipc-cache 管理 handlers 的
> `{ success }` 双轨响应折叠为 contracts Result `ok`/`fail` 信封（与 ResultIpcClient 对齐）。
> 扩展 surface specs。§13.2 仍为部分/外部阻塞。验证：desktop focused surface specs +
> governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留六十八轮）：desktop `window-manager` IPC handlers 的
> `{ success }` 双轨响应折叠为 contracts Result `ok`/`fail`；`useDesktopWindowControls`
> 解包 Result 信封读取控件状态。补 surface specs。§13.2 仍为部分/外部阻塞。
> 验证：desktop + app-vue focused surface specs + governance-check。状态保持 **实施中**；
> PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留六十九轮）：desktop `system-handlers`（system + desktop-feature）
> 原始/非 Result 响应折叠为 contracts Result `ok`/`fail`；OPEN_EXTERNAL 校验改为 `fail`
> （不再 throw）；app-vue 设置页 UserFiles/DataPortability/UserSettings 解包 Result。
> 补 surface specs。§13.2 仍为部分/外部阻塞。验证：desktop system-handlers specs +
> app-vue focused surface specs + governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留七十轮）：折叠 `SessionRestoreResult` 的 `success`/`ok` 双轨
> （contracts 仅 `ok: boolean`；lifecycle 幂等重入路径改 `ok: true`）；dev memory-monitor
> IPC 返回 Result `ok` 信封。补 contracts/desktop surface specs。§13.2 仍为部分/外部阻塞。
> 验证：desktop lifecycle/memory focused specs + contracts surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留七十一轮）：custom-notification IPC handlers 返回 Result
> `ok` 信封；`notification:clicked` 字符串双轨折叠到 contracts `RendererEventChannels.NOTIFICATION_CLICKED`
> （custom + native notification service）。补 surface specs。§13.2 仍为部分/外部阻塞。
> 验证：desktop notification surfaces + contracts surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留七十二轮）：desktop-auth-shell 剩余原始 DTO 响应
> （GET_STATUS / GET_BOOTSTRAP_SNAPSHOT / INITIALIZE / AUTO_LOGIN / REMEMBERED_ACCOUNTS_LIST /
> GET_CURRENT_USER / SESSION_LIST）折叠为 `toIpcResult(ok(...))`；bootstrap 与 auth recovery
> 解包 IpcResult。修复 AUTO_LOGIN 域 `ok` 被误判为 IpcResult 信封的双轨问题。补 surface specs。
> §13.2 仍为部分/外部阻塞。验证：desktop auth shell + app-vue recovery/bootstrap focused specs +
> governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留七十三轮）：contracts 新增严格 `isIpcResultEnvelope`（要求
> `ok` + `data`/`error`），ipc-client / ResultIpcClient 删除 raw 双轨透传并对非信封响应失败；
> authenticated-ipc 共用同一检测。补 contracts/ipc-client surface specs。§13.2 仍为部分/外部阻塞。
> 验证：contracts + ipc-client focused specs + governance-check。状态保持 **实施中**；
> PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留七十四轮）：文档/深链边界对齐——UI redesign 文中仍写为现行
> 契约的 `/note/:id` 深链改为 `/repository?note=`（`/note/:id` 已退役）；补 AI
> `useAIChatView` knowledge deep-link surface；ADR-035 journey 增 step 10（readonly cloud_rag
> 不能顶替 knowledge mutation）。§13.2 未打勾项仍为部分/外部阻塞（真实 OAuth/GitHub fixture
> E2E、完整 multi-engine Turn Engine E2E、全量 PR 门禁）。验证：ai journey + app-vue surface +
> governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留七十五轮）：ADR-035 journey 增 step 11——`engine.direct_turn` /
> `engine.pi_readonly` / `engine.cli_readonly` 引擎 offer 单独不能顶替 knowledge mutation
> requirements（任意 engineId 在缺能力时仍 fail-closed 为 `engineId: 'none'`）；补
> server-held data disclosure Web-only 证据：`use-data-portability.surface.spec.ts` +
> three-login matrix step 8（Desktop 永不暴露 server disclosure；IPC adapter NOT_SUPPORTED
> 不调用 IPC）。§13.2 未打勾项仍为部分/外部阻塞（真实 OAuth/GitHub fixture E2E、完整
> multi-engine Turn Engine E2E、全量 PR 门禁）。验证：ai journey + app-vue matrix/surface +
> data-portability ipc adapter + governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留七十六轮）：Desktop `AuthRemoteGateway` 删除 auth HTTP raw
> dual-track——register/login/refresh/listOAuthProviders/postResult 成功响应必须带 `data`
> 信封，裸业务体 fail-closed；lifecycle `hasValidSession` 去掉可选 `ok` 兜底；ADR-035
> journey 增 step 12（`assertAgentStartCapabilityPlan` 对仅 multi-engine offer 的
> knowledge.generate fail-closed）。§13.2 仍为部分/外部阻塞。验证：desktop auth gateway +
> login/register/refresh focused specs + ai journey + governance-check。状态保持 **实施中**；
> PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留七十七轮）：Desktop 知识仓库远程网关与 profile snapshot 删除
> HTTP raw dual-track——`KnowledgeRepositoryRemoteGateway` 成功响应必须带 `data` 信封（不再
> `payload.data ?? payload`）；`ProfileSnapshotService` manifest 无 data 信封时 fail-closed
> 为 snapshot-unavailable。补 gateway/snapshot focused specs。§13.2 仍为部分/外部阻塞。
> 验证：desktop knowledge-repository-remote.gateway + ProfileSnapshotService specs +
> governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留七十八轮）：`ResultHttpClient` 删除 first-party HTTP raw
> dual-track——非标准信封 / 缺 `data` 的 `ok:true` 体 fail-closed；`app-react`
> session refresh 强制 data 信封（对齐 Desktop AuthRemoteGateway）。补 http-client 与
> app-session surface specs。§13.2 仍为部分/外部阻塞。验证：http-client + app-react
> focused specs + governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留七十九轮）：修复 `GoalIpcAdapter` 错误导入 `AIChannels` 却
> 调用 `GoalChannels` 的双轨错线（导致 `goal:build`/`ai:build` 连锁 typecheck 失败）；
> 统一为 contracts `GoalChannels`，补 IPC channel surface。§13.2 仍为部分/外部阻塞。
> 验证：goal focused surface + goal:build + governance-check。状态保持 **实施中**；
> PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留八十轮）：`AxiosHttpClient` 对齐 `ResultHttpClient`——JSON
> 成功体无 HttpResponse 信封 fail-closed（删除 raw dual-track）；blob/arraybuffer/text
> 下载仍允许非 JSON 透传；信封检测要求 `ok:true` 含 `data` 键。补 http-client specs 与
> surface；修正 web platform 过时 AxiosHttpClient 注释。§13.2 仍为部分/外部阻塞。
> 验证：http-client focused + governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留八十一轮）：删除 throw 风格 `IpcClientImpl` / `IpcClient` /
> `IpcClientError` 双轨（包入口本就只导出 ResultIpcClient；Desktop DI 仅用
> createResultIpcClient）；修正 task/schedule IPC 工厂注释与 http-client 包说明以
> Result 信封为主路径。§13.2 仍为部分/外部阻塞。验证：ipc-client focused +
> governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留八十二轮）：清理残留双轨文档/注释与 AI 传输面——task HTTP
> adapter 头注释 `IHttpClient`→`IResultHttpClient`；contracts `createIpcClient` 示例改为
> `createIpcClientWrapper`；ADR-033 范式 C 改为 `ResultIpcClient`/`ResultHttpClient`；
> AI infrastructure-client 删除未使用的 throw 风格 `IIpcClient` 与 `IHttpClient` 再导出，
> 仅保留 `IResultIpcClient`/`IResultHttpClient`。AxiosHttpClient throw twin 仍有测试/下载
> 面保留。§13.2 仍为部分/外部阻塞（无伪造 GitHub/OAuth fixture）。验证：contracts/ai
> focused + governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留八十三轮）：删除 throw 风格 `AxiosHttpClient` / `IHttpClient` /
> `HttpClientError` / `createHttpClient` 双轨（全仓无生产消费者；模块 adapters 与
> Web/Desktop/Mobile DI 仅用 `ResultHttpClient`/`createResultHttpClient`）；保留
> `AxiosHttpClientConfig` 作为 axios 配置类型名与 `createAxiosInstance`。收紧
> http-client envelope surface（文件删除 + 包入口 Result-only）。§13.2 仍为部分/外部
> 阻塞。验证：http-client focused + governance-check。状态保持 **实施中**；PR readiness
> 仍为 no。


> 续进展 2026-07-21（阶段 6 残留八十四轮）：Result 传输面继续收口——`AxiosHttpClientConfig`
> 重命名为 `HttpClientConfig`；contracts `createIpcClientWrapper` 删除 throw 风格
> `invokeUnsafe`（仅保留 Result `invoke`）；ADR-032 工厂约定改为 `IResultHttpClient` 并
> 移除已删除的 editor 工厂行；repository adapter specs 本地 stub 命名对齐 Result。§13.2
> 仍为部分/外部阻塞。验证：http-client + contracts focused + governance-check。状态保持
> **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留八十五轮）：删除零生产消费者的 `createIpcClientWrapper`
> （Renderer 生产路径仅 `ResultIpcClient`/`createResultIpcClient`；保留 `toIpcResult`/
> `fromIpcResult`/`isIpcResultEnvelope`）；contracts/utils 导出与 migrate 清单同步清理；
> 删除 http-client 未使用的 `HttpRequestOptions`；transport specs 固化 raw dual-track
> IPC `ok` 业务标志拒绝。§13.2 仍为部分/外部阻塞。验证：contracts + http-client +
> governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留八十六轮）：折叠 AI provider list 双轨响应——HTTP/Desktop
> IPC/client 统一 contracts `ListAIProviderConfigsRes`（`{ data: [...] }`）；删除 IPC
> adapter `Array.isArray ? data : data.data` 兼容分支；controller/electron 显式
> `ok({ data })`。补 provider-list envelope surface。§13.2 仍为部分/外部阻塞。验证：
> ai focused + governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留八十七轮）：折叠 AI void 成功双轨——删除
> `ActionSuccessSchema`（`{ success: boolean }`）；delete conversation / delete provider /
> set-default 与其他模块一致使用 OpenAPI `z.null()`，controller 返回 `ok(null)` 以保留
> HttpResponse `data` 键。补 void-success envelope surface + chat routes spec。§13.2
> 仍为部分/外部阻塞。验证：ai focused + governance-check。状态保持 **实施中**；
> PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留八十八轮）：Desktop IPC 对齐 HTTP void 成功信封——
> `PROVIDER_DELETE` / `PROVIDER_SET_DEFAULT` / `CONVERSATION_DELETE` 成功路径显式
> `ok(null)`（不再透传 `Result<void>`/`data:undefined` 双轨）。扩展 void-success
> envelope surface 覆盖 electron。§13.2 仍为部分/外部阻塞。验证：ai focused +
> governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留八十九轮）：折叠 goal void 删除双轨——删除
> `DeleteSuccessResSchema`（`{ success: boolean }`）；review/record delete OpenAPI 改为
> `z.null()`；controller/electron 对 key-result/review/record/folder delete 返回
> `ok(null)`。补 goal void-success envelope surface。§13.2 仍为部分/外部阻塞。验证：
> goal focused + governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留九十轮）：折叠 task/governance void 删除双轨——task template
> delete 去掉 `{ success: true }`；OpenAPI 已有 `z.null()` 的 template/instance/dependency
> delete 在 controller/electron 统一 `ok(null)`；governance `DeleteRuleRes` 改为 `null`，
> 删除 `DeleteRuleResSchema`，OpenAPI/controller/electron 对齐 `z.null()`/`ok(null)`。
> 补 task/governance void-success envelope surfaces。§13.2 仍为部分/外部阻塞。验证：
> task + governance focused + governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留九十一轮）：折叠 reminder void/success 双轨——template/group
> delete 与 frequency-adjustment reject 在 controller/electron 统一 `ok(null)`（对齐 OpenAPI
> `z.null()`）；`FrequencyAdjustmentResultSchema` / use case 去掉冗余 `success: boolean`
> （成功已由 Result 信封表达）。补 reminder void-success envelope surface。§13.2 仍为部分/
> 外部阻塞。验证：reminder focused + contracts + governance-check。状态保持 **实施中**；
> PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留九十二轮）：折叠 notification void/batch 双轨——单条 delete
> controller/electron `ok(null)`；batch delete/cleanup 对齐 contracts
> `BatchOperationResultDTO`/`NotificationBatchResultSchema`（`deletedCount`，去掉
> `{ success, affected }`）；mark-all/batch-read 将裸 `number` 规范为 `{ count }` /
> `{ updatedCount }`；client 去掉嵌套 `ActionResult`/`CountResult`。补 notification
> void-success envelope surface。§13.2 仍为部分/外部阻塞。验证：notification focused +
> governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留九十三轮）：折叠 account/schedule void 删除双轨——账户注销
> close 与 schedule task/event delete 在 controller/electron 统一 `ok(null)`（对齐 OpenAPI
> `z.null()`）；`CloseAccountRes` 改为 `null`；删除零运行时消费者的 account
> Import/Export data-transfer DTO（`success: boolean` 双轨，可移植备份已在
> data-portability）。补 account/schedule void-success envelope surfaces。§13.2 仍为
> 部分/外部阻塞。验证：account + schedule focused + governance-check。状态保持 **实施中**；
> PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留九十四轮）：折叠 authentication void 成功双轨——logout /
> revoke session / change-password / forgot-password / reset-password / send-email-code /
> oauth unbind 在 controller 统一 `ok(null)`；OpenAPI unbind 从 `z.void()` 改为 `z.null()`
> 与其它 void 端点一致。补 auth void-success envelope surface。§13.2 仍为部分/外部阻塞。
> 验证：authentication focused + governance-check。状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留九十五轮）：折叠 knowledge repository disconnect 成功双轨——
> `DisconnectKnowledgeRepositoryConnectionRes` / OpenAPI 改为 `z.null()`；service/
> controller/electron 成功路径 `ok(null)`（去掉 `{ disconnected: true }` 与 Result.ok
> 重复表达）。UI 仅检查 `result.ok`，无 body 依赖。补 disconnect void-success envelope
> surface。§13.2 仍为部分/外部阻塞。验证：repository focused + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留九十六轮）：AI provider-config 客户端 Result 端口迁移——
> `IAIProviderConfigApiClient` / `AIClientPort` provider 方法改为 `Promise<Result<T>>`；
> HTTP/IPC adapters 去掉 `unwrapResultOrThrow` 双轨，list 用 `map` 解 `ListAIProviderConfigsRes`；
> contracts list 条目统一 `AIProviderConfigClientDTO`（去掉 Summary 列表双轨）；UI
> (`useAI`/`useAIWorkspace`) 在 composable 边界 `unwrap`。顺带修复 electron destroy 使用
> 未定义 `channels`（改为 `allChannels`）。补 `ai-provider-config-result-port.surface`。
> 其它 AI ports 仍 throw-unwrap，未整包迁移。§13.2 仍为部分/外部阻塞。
> 验证：ai typecheck + provider result/list envelope surfaces + useAI + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留九十七轮）：AI capabilities + conversation 客户端 Result
> 端口迁移——`IAICapabilitiesApiClient` / `IAIConversationApiClient` 与 `AIClientPort` 对应
> 方法改为 `Promise<Result<T>>`；HTTP/IPC adapters 去掉 `unwrapResultOrThrow`；Vue/React
> (`useAI`/`useAIChatSession`/`chatViewHelpers`/`useAIWorkspace`) 在 composable 边界
> `unwrap`。补 `ai-capabilities-conversation-result-port.surface`。message/agent 等 AI
> ports 仍 throw-unwrap。§13.2 仍为部分/外部阻塞。
> 验证：ai typecheck + focused surfaces + useAI/AIChatView specs + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留九十八轮）：AI goal/evaluation/knowledge/analytics 客户端
> Result 端口迁移——对应 ports + HTTP/IPC adapters 去掉 `unwrapResultOrThrow`；
> `goalAutomationHelpers` / `useAI.expandKnowledge` 在 composable 边界 `unwrap`。补
> `ai-query-result-port.surface`。message/stream/agent 仍 throw-unwrap。§13.2 仍为
> 部分/外部阻塞。验证：ai typecheck + surfaces + useAI/AIChatView + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留九十九轮）：AI message send/list 客户端 Result 端口迁移——
> `sendMessage` / `getMessages`/`listMessages` 改为 `Promise<Result<T>>`；HTTP/IPC 对应
> 方法直接返回 Result；`streamMessage` 仍为 throw-based SSE/IPC 流（IPC 无 bridge 回退
> 对 send Result 做 `unwrapResultOrThrow`）。Vue/React 在 list/send 边界 `unwrap`。补
> `ai-message-result-port.surface`。agent runtime 仍 throw-unwrap。§13.2 仍为部分/外部
> 阻塞。验证：ai typecheck + surfaces + AIChatView/useAI + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留一百轮）：AI agent-runtime 客户端 Result 端口迁移——
> list/start/resume/get/events 改为 `Promise<Result<T>>`；HTTP/IPC adapters 去掉
> `unwrapResultOrThrow`；Vue chat/goal/knowledge workflows 在 composable 边界 `unwrap`。
> 补 `ai-agent-runtime-result-port.surface`。`streamMessage` 仍为 throw-based（SSE 控制流）。
> 基础设施客户端 Result 端口迁移至此基本收口。§13.2 仍为部分/外部阻塞。
> 验证：ai typecheck + agent adapter/surface + AIChatView + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


> 续进展 2026-07-21（阶段 6 残留一百零一轮）：删除无实现/无消费者的 `IAIStreamMessageApiClient`
> 双轨端口（stream 仅保留在 `IAIMessageApiClient`/`AIClientPort` 的 throw-based
> `streamMessage`）；清理 infrastructure-client 过时 `IAIGenerationTaskApiClient` 注释；补
> `ai-client-result-port-surface` 固化 Result 端口完成态与禁止 stream 双接口回归。
> §13.2 仍为部分/外部阻塞。验证：ai focused surfaces + typecheck + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
>
> 续进展 2026-07-21（阶段 6 残留一百零二轮）：Agent 隔离 hardening——`startRun`/`resumeRun` 在
> host side-effect（`resolveRuntimeExecutionInterrupt`）之前强制 `ensureAgentRunOwnedByIdentity`
> fail-closed，防止 foreign-owned run 在 FORBIDDEN 前触发 knowledge/goal 落盘；ADR-035 journey
> 增 step 13（approve 路径 + confirm shortcut 双路径）；MSW governance DELETE 对齐
> `DeleteRuleRes = null`（去掉 `{ success: true }` 双轨）。§13.2 Agent 证据增强，仍为部分
> （缺完整 multi-engine Turn Engine E2E 与跨端对抗 Playwright/Electron；真实 GitHub fixture
> 外部阻塞）。验证：ai journey/runtime focused specs + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-21（阶段 6 残留一百零三轮）：Agent 事件隔离——`getEvents` 在返回事件前经
> `getRun` + `ensureAgentRunOwnedByIdentity` fail-closed，foreign-owned run 不调用底层
> getEvents、不泄露事件；ADR-035 journey 增 step 14；三入口 matrix step 9 固化
> AuthPlatformEntry / DesktopAuthView / WebAuthView / useDataPortability 源码边界。
> §13.2 三入口与 Agent 项证据再增强，仍为部分（缺完整 multi-surface Playwright/Electron
> E2E 与 multi-engine Turn Engine E2E；真实 GitHub fixture 外部阻塞）。验证：ai journey/
> runtime + app-vue three-login matrix + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-21（阶段 6 残留一百零四轮）：补齐 getEvents 正向路径证据——owned identity
> 通过 ownership gate 后正常返回事件；ADR-035 journey 增 step 15；新增
> `ai-agent-events-ownership.surface` 固化 getEvents 必须先 getRun+ownership 再取事件。
> §13.2 Agent 项仍为部分（缺完整 multi-engine Turn Engine E2E 与跨端对抗 E2E）。验证：
> ai journey/runtime/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-21（阶段 6 残留一百零五轮）：Agent checkpoint upsert 身份隔离——禁止
> `run.identityId` 冒充与 foreign `runId` 覆盖（原 bare `where:{runId}` upsert 可改写他人
> checkpoint）；事务内 findUnique + owner gate 后 create/update；补 adapter 单测与
> `agent-checkpoint-ownership.surface`；OpenAPI upsert 文档 403。§13.2 Agent 证据再增强，
> 仍为部分。验证：ai checkpoint adapter/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-21（阶段 6 残留一百零六轮）：服务端持有数据披露不可导入 hardening——
> `parseUserDataExportEnvelope` 对 `memoflow.server-held-data-disclosure` 先于通用 schema
> fail-closed 并给出明确 not-importable 文案；ImportUserData 用例 dryRun/正式导入均拒绝且
> 不进入 importStore.transaction；补 contracts 断言、use-case 单测与 not-importable surface。
> 保持可重新导入业务备份与披露边界分离。§13.2 仍为部分/外部阻塞。验证：contracts +
> data-portability focused + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-21（阶段 6 残留一百零七轮）：Agent checkpoint get/list 元数据身份
> defense-in-depth——`get` 在 row 归属匹配后仍校验 `run.identityId`，不匹配则当 not found；
> `list` 过滤 spoofed metadata。补 adapter 单测与 ownership surface 扩展。§13.2 Agent
> 证据再增强，仍为部分。验证：ai checkpoint adapter/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-21（阶段 6 残留一百零八轮）：HTTP 204 void 信封收口——`expressAdapter` /
> `expressAdapterWithValidation` 对 `successStatus: 204` 发送无 body 的 No Content（不再
> `json(success(...))` 双轨）；AI agent/langgraph checkpoint upsert/delete 路由统一
> `ok(null)`（去掉 `ok(undefined)`）。补 utils express-adapter 单测与
> `ai-checkpoint-void-204.surface`。§13.2 第 15 项证据再增强，仍为部分/外部阻塞。验证：
> utils express-adapter + ai surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-21（阶段 6 残留一百零九轮）：知识笔记 write-request 状态转移身份隔离——
> `retryFailed` / `markCommitted` / `markFailed` 端口与 Prisma 仓储强制 `identityId` 过滤
> （`updateMany where { id, identityId }`，禁止仅靠主键改写他人 ledger）；commit service
> 调用透传 identityId。补 ownership surface 与 memory 单测。§13.2 Web 幂等创建/Agent 边界
> 证据再增强，仍为部分。验证：repository commit specs/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-21（阶段 6 残留一百一十轮）：GitHub webhook delivery 状态转移 connection 隔离——
> `updateStatus` 端口与 Prisma 仓储强制 `connectionId` 过滤（`updateMany where { id, connectionId }`，
> 禁止仅靠 delivery 主键改写他人连接的投递状态）；projection service 调用透传
> `delivery.connectionId`。补 ownership surface 与 memory 单测。§13.2 webhook 重建证据再增强。
> 验证：repository projection specs/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-21（阶段 6 残留一百一十一轮）：知识仓库 connection 状态转移身份隔离——
> `updateStatus` 端口与 Prisma 仓储强制 `identityId` 过滤（`updateMany where { id, identityId }`，
> 禁止仅靠 connection 主键 revoke/改状态）；disconnect 透传 identityId。补 ownership surface
> 与 memory 单测。§13.2 连接/授权边界证据再增强。验证：repository connection specs/surface +
> governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-21（阶段 6 残留一百一十二轮）：知识仓库 connection 读路径身份隔离——新增
> `findByIdForIdentity(identityId, id)`（Prisma `findFirst where { id, identityId }`）；
> connection/commit/attachment 服务身份操作改走该读路径；API cloud purger 删除
> `deleteMany where { id, identityId }`。补 ownership surface 与 memory 单测。§13.2
> GitHub App 授权边界证据再增强。验证：repository + api purger specs + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-21（阶段 6 残留一百一十三轮）：知识仓库 connection `save` 身份不可改写——
> 去掉 bare `upsert` 更新路径上的 `identityId` 写入；既有行必须 `existing.identityId ===
> connection.identityId`，再以 `updateMany where { id, identityId }` 更新；跨 identity 改写
> fail-closed。补 prisma/memory 单测与 ownership surface。§13.2 GitHub App 授权边界证据再
> 增强。验证：repository connection prisma/service/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-21（阶段 6 残留一百一十四轮）：AI conversation get/update/delete 身份隔离——
> 新增 `findByIdForIdentity`；delete 改为 `updateMany where { id, identityId }`；save 拒绝
> 跨 identity 改写；HTTP/Electron 与 use case 透传 identityId；sendMessage 路径 helpers 同步
> 改用 identity 读路径。补 ownership surface + memory 单测。§13.2 Agent 隔离证据再增强，仍为
> 部分。验证：ai conversation ownership specs/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-21（阶段 6 残留一百一十五轮）：AI provider config get/update/delete 身份隔离——
> 新增 `findByIdForIdentity`；delete 改为 `updateMany where { id, identityId }`；save 拒绝
> 跨 identity 改写；HTTP/Electron get/update/delete 透传 identityId；resolution/set-default/
> refresh/test helpers 同步。补 ownership surface + memory 单测。§13.2 Agent 隔离证据再增强，
> 仍为部分。验证：ai provider ownership specs/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-21（阶段 6 残留一百一十六轮）：Goal folder get/update/delete 身份隔离——新增
> `findByIdForIdentity`；delete 改为 `deleteMany where { id, identityId }`；PowerSync update
> 不再改写 `identity_id`；get use case/HTTP/Electron 透传 identityId。补 ownership surface 与
> get use case 单测。§13.2 Agent/边界证据再增强，仍为部分。验证：goal folder specs/surface +
> governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-21（阶段 6 残留一百一十七轮）：Goal get/update/delete 与 progress record
> create/delete 身份隔离——Goal/`GoalRecord` 新增 `findByIdForIdentity`；record delete 改为
> `deleteMany where { id, identityId }`；get/aggregate/update/delete/createRecord use case 经
> owned 读路径；HTTP/Electron get/update/delete/aggregate/recordDelete 透传 identity 上下文。
> 补 ownership surface 与 get/delete-record 单测。§13.2 Agent/边界证据再增强，仍为部分。验证：
> goal ownership specs/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-21（阶段 6 残留一百一十八轮）：Goal status 变更身份隔离——archive/activate/
> complete/permanentlyDelete 经 `findByIdForIdentity`；物理 delete 改为 `deleteMany where
> { id, identityId }`（PowerSync 同步 AND identity_id）；HTTP/Electron archive/activate/
> complete 透传 identity 上下文。补 ownership surface 与 status 单测。§13.2 Agent/边界证据再
> 增强，仍为部分。验证：goal ownership specs/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-21（阶段 6 残留一百一十九轮）：Goal key-result/review 读写身份隔离——add/
> update/progress/delete KR、batch weights、add/list/update/delete review、clone 的 goal 读
> 路径均经 `findByIdForIdentity`；HTTP/Electron 透传 identity 上下文。补 ownership surface
> 与相关单测。§13.2 Agent/边界证据再增强，仍为部分。验证：goal ownership specs/surface +
> governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-21（阶段 6 残留一百二十轮）：Goal 剩余 bare-id 读路径收口——create parent、
> activate-focus focusedGoalIds、list records（identity 过滤 + owned goal）、progress
> breakdown、cross-module task-binding 均经 `findByIdForIdentity`；HTTP/Electron progress/
> record list 透传 identity。补 ownership surface 与单测。§13.2 Agent/边界证据再增强，仍为
> 部分。验证：goal ownership specs/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-21（阶段 6 残留一百二十一轮）：Schedule task get/update/delete/actions 与
> list-by-status/source 身份隔离——新增 `findByIdForIdentity`；deleteById 改为
> `deleteMany where { id, identityId }`；HTTP/Electron task 读写透传 identity 上下文。补
> ownership surface 与 schedule use-case 单测。§13.2 Agent/边界证据再增强，仍为部分。验证：
> schedule ownership specs/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-21（阶段 6 残留一百二十二轮）：Schedule calendar event get/update/delete 与
> conflict get/resolve 身份隔离——`IScheduleRepository.findByIdForIdentity`；deleteById/
> deleteAggregate 改为 `deleteMany where { id, identityId }`；冲突检测/解决链路透传
> identityId；HTTP/Electron 事件读写（含原未认证 GET）透传 identity 上下文。补 ownership
> surface 与 event/conflict 单测。§13.2 Agent/边界证据再增强，仍为部分。验证：schedule event
> ownership specs/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-21（阶段 6 残留一百二十三轮）：Task template get/update/delete/actions 与
> list-instances-by-template 身份隔离——新增 `findByIdForIdentity` /
> `findByIdWithChildrenForIdentity`；delete 改为 `deleteMany where { id, identityId }`；
> parent 校验同 identity；HTTP/Electron（含原未认证 TEMPLATE_GET）透传 identity 上下文。
> 补 ownership surface 与 template 单测。§13.2 Agent/边界证据再增强，仍为部分。验证：task
> template ownership specs/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-21（阶段 6 残留一百二十四轮）：Task instance get/complete/skip/start/delete
> 身份隔离——新增 `findByIdForIdentity`；delete 改为 `deleteMany where { id, identityId }`；
> complete 模板读取同 identity；HTTP/Electron（含原未认证 INSTANCE_GET）透传 identity 上下文。
> 补 ownership surface 与 instance 单测。§13.2 Agent/边界证据再增强，仍为部分。验证：task
> instance ownership specs/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-21（阶段 6 残留一百二十五轮）：Task dependency list/get/update/delete/validate
> 与 dependency-chain 身份隔离——`findByIdForIdentity` / `findAggregateByIdForIdentity`；
> 列表与递归链查询附带 identityId；delete/update 使用 id+identityId。HTTP/Electron 透传
> identity 上下文。补 ownership surface 与 dependency 单测。§13.2 Agent/边界证据再增强，仍
> 为部分。验证：task dependency ownership specs/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-21（阶段 6 残留一百二十六轮）：Notification get/mark-read/update/delete/batch
> 身份隔离——新增 `findByIdForIdentity`；应用层不再用 bare findById 授权；HTTP/Electron
> （含原未认证 GET/MARK_READ/DELETE）透传 identity 上下文。补 ownership surface 与 notification
> 单测。§13.2 Agent/边界证据再增强，仍为部分。验证：notification ownership specs/surface +
> governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-21（阶段 6 残留一百二十七轮）：Reminder template/group get/update/delete/actions
> 身份隔离——新增 `findByIdForIdentity` 到 template/group 仓储；应用层 owned helpers 与
> adjust-frequency 走 identity 过滤，不再 bare findById + 事后比对。补 ownership surface。
> §13.2 Agent/边界证据再增强，仍为部分。验证：reminder ownership specs/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-21（阶段 6 残留一百二十八轮）：Reminder `findByGroupId` 身份隔离——列表/批
> 量分组动作与 domain stats/delete 路径均要求 identityId；不再 bare groupId 后 filter。
> ownership surface 扩展。§13.2 仍部分（缺跨端 E2E / 真实 GitHub fixture）。验证：reminder
> focused specs/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-21（阶段 6 残留一百二十九轮）：Reminder response list/stats/delete 与
> frequency analyze 身份隔离——仓储 `findByTemplateId`/`getResponseStats`/`deleteByTemplateId`
> 要求 identityId；analyze 走 `findByIdForIdentity`。补 ownership surface。§13.2 仍部分。
> 验证：reminder response/analyze specs/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-21（阶段 6 残留一百三十轮）：Goal/Reminder schedule projection+execution
> 身份隔离——有 identity 时用 `findByIdForIdentity`；execution 始终用 task.identityId。
> 无 identity 的系统回退仍保留 bare findById。补 surface/specs。§13.2 仍部分。验证：
> goal/reminder schedule source specs/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-21（阶段 6 残留一百三十一轮）：Schedule runtime sync/execute
> 身份隔离——`ScheduledItem.identityId`；有 identity 时 `findByIdForIdentity`，
> 无 identity 时 bare findById 后再以 task.identityId 复核。补 surface/specs。
> §13.2 仍部分。验证：schedule runtime specs/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-21（阶段 6 残留一百三十二轮）：Task schedule projection+execution
> 身份隔离——有 identity 时 template 用 `findByIdForIdentity`；execution 始终用
> task.identityId 加载 instance/template；instance 列表按 identity 过滤。
> 无 identity 系统回退仍保留 bare findById。补 surface/specs。§13.2 仍部分。
> 验证：task schedule source specs/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-21（阶段 6 残留一百三十三轮）：Task instance `findByTemplateId`
> 身份隔离——仓储签名要求 identityId；Prisma/PowerSync 过滤 templateId+identityId；
> list-by-template / get-template stats / complete siblings / schedule projection
> 透传 identity。补 ownership surface。§13.2 仍部分。
> 验证：task instance list/get/complete/projection/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-21（阶段 6 残留一百三十四轮）：Task instance 其余 template-scoped
> 查询/删除身份隔离——`getTemplateStats` / `deleteByTemplateId` /
> `deleteIncompleteInstancesFrom` / `countFutureInstances` /
> `findByTemplateIdAndDateRange` 均要求 identityId。pause/delete/list/get 透传。
> 补 ownership surface。§13.2 仍部分。
> 验证：task pause/delete/list/get/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-22（阶段 6 残留一百三十五轮）：Reminder domain service / control /
> mapper 身份隔离——`getTemplate`/`getGroup`/`delete*`/`assign`/`updateGroupStats`/
> `toggle`/`syncByGroup` 要求 identityId；control 用 `findByIdForIdentity(task.identityId)`；
> mapper 富化 group 走 owned load。§13.2 仍部分。
> 验证：reminder domain/control/app/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-22（阶段 6 残留一百三十六轮）：Reminder `findByIds` 身份隔离——
> group/template 仓储 `findByIds(identityId, ids)`；Prisma/PowerSync 过滤 id∈ids +
> identityId；control batch 与 mapper list 按 identity 分组 owned 批量加载。
> 补 ownership surface。§13.2 仍部分。
> 验证：reminder control/use-cases/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-22（阶段 6 残留一百三十七轮）：Knowledge projection 系统路径
> connection 身份复核——reconcile/delivery 经 `loadOwnedConnectionById`：bare findById
> 后以 `findByIdForIdentity(connection.identityId)` 再加载。补 ownership surface。
> §13.2 仍部分。验证：projection service/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-22（阶段 6 残留一百三十八轮）：Notification domain service 身份隔离——
> `markAsRead`/`markManyAsRead`/`deleteNotification`/`deleteManyNotifications`/
> `getNotification`/`executeNotificationAction` 要求 identityId，经 `findByIdForIdentity`
> 加载；硬删亦先 owned load。补 ownership surface。§13.2 仍部分。
> 验证：notification domain/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-22（阶段 6 残留一百三十九轮）：Auth session 身份隔离——仓储新增
> `findByIdForIdentity`；`revoke-session` 与 `get-current-user` 不再用 bare findById
> 后 FORBIDDEN 二次判断，owned miss 统一 NOT_FOUND；JWT/refresh 仍可用 bare findById。
> 补 ownership surface + revoke 单测。§13.2 仍部分。
> 验证：auth session ownership/revoke + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-22（阶段 6 残留一百四十轮）：Task template list 按 folder/goal 过滤
> 身份隔离——`findByFolderId`/`findByGoalId` 要求 identityId；Prisma/PowerSync 过滤
> identity + folder/goal；list use case 透传。补 ownership surface。§13.2 仍部分。
> 验证：task template list/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-22（阶段 6 残留一百四十一轮）：Goal record 次级查询身份隔离——
> `findByKeyResultId`/`findByGoalId`/`findByKeyResultIds`/`countByKeyResultId` 要求
> identityId；list/aggregate/create/progress-calculator 透传；goal `findByFolderId`
> 同步 identity-scoped。补 ownership surface。§13.2 仍部分。
> 验证：goal record/list/progress/surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-22（阶段 6 残留一百四十二轮）：Task template 次级查询身份隔离——
> `findByKeyResultId`/`findSubtasks` 要求 identityId；Prisma/PowerSync 过滤 identity。
> 补 ownership surface。§13.2 仍部分。
> 验证：task template surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-22（阶段 6 残留一百四十三轮）：Task folder 身份隔离——仓储新增
> `findByIdForIdentity`；`delete`/`exists` 要求 identityId；Prisma/PowerSync 过滤
> id+identity。补 ownership surface。§13.2 仍部分。
> 验证：task folder surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-22（阶段 6 残留一百四十四轮）：Schedule execution 身份隔离——仓储新增
> `findByIdForIdentity`；`findByTaskId(identityId, taskId)`；Prisma/PowerSync 过滤
> identity。补 ownership surface。§13.2 仍部分。
> 验证：schedule execution surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-22（阶段 6 残留一百四十五轮）：Focus session 身份隔离——仓储新增
> `findByIdForIdentity`；`findByGoalId`/`delete`/`exists` 要求 identityId；Prisma
> 过滤 identity。补 ownership surface。§13.2 仍部分。
> 验证：focus session surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-22（阶段 6 残留一百四十六轮）：Focus mode 身份隔离——仓储新增
> `findByIdForIdentity`；`delete` 要求 identityId；Prisma/PowerSync 过滤 identity。
> 运行时激活路径已用 `findActiveByIdentityId`。补 ownership surface。§13.2 仍部分。
> 验证：focus mode surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-22（阶段 6 残留一百四十七轮）：Notification preference 身份隔离——仓储
> 新增 `findByIdForIdentity`；`delete`/`exists` 要求 identityId；Prisma/PowerSync
> 过滤 identity。运行时 get/update 已用 `findByIdentityId`。补 ownership surface。
> §13.2 仍部分。验证：notification preference surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-22（阶段 6 残留一百四十八轮）：Reminder response 身份隔离——仓储新增
> `findByIdForIdentity`；Prisma/PowerSync 过滤 id+identity。模板级 list/stats/delete
> 此前已 identity-scoped。补 ownership surface。§13.2 仍部分。
> 验证：reminder response surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。


>
> 续进展 2026-07-22（阶段 6 残留一百四十九轮）：Weight snapshot 身份隔离——`findByGoal`/
> `findByKeyResult`/`findByTimeRange`/`findByIdForIdentity`/`delete*` 要求 identityId；
> Prisma 过滤 identity。补 ownership surface。§13.2 仍部分。
> 验证：weight snapshot surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-22（阶段 6 残留一百五十轮）：Notification 身份隔离——`findByRelatedEntity`/
> `delete`/`deleteMany`/`softDelete`/`exists`/`markManyAsRead` 要求 identityId；Prisma/
> PowerSync 过滤 identity。domain/query/maintenance 调用同步。补 ownership surface。§13.2 仍部分。
> 验证：notification ownership surface + domain/query/maintenance tests + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-22（阶段 6 残留一百五十一轮）：Reminder group/template 身份隔离——
> `delete`/`exists` 要求 identityId；Prisma/PowerSync 过滤 identity；domain hard delete
> 传 identityId。补 ownership surface。§13.2 仍部分。
> 验证：reminder template ownership surface + use-cases + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-22（阶段 6 残留一百五十二轮）：Goal folder 身份隔离——`exists` 要求
> identityId；Prisma/PowerSync 过滤 identity。补 ownership surface。§13.2 仍部分。
> 验证：goal folder surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-22（阶段 6 残留一百五十三轮）：Task dependency 身份隔离——
> `deleteByTaskId` 要求 identityId；Prisma/PowerSync 过滤 identity。补 ownership
> surface。§13.2 仍部分。
> 验证：task dependency surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-22（阶段 6 残留一百五十四轮）：Goal record 身份隔离——`deleteMany`
> 要求 identityId；Prisma/PowerSync 过滤 identity。补 ownership surface。§13.2 仍部分。
> 验证：goal ownership surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-22（阶段 6 残留一百五十五轮）：Schedule task 身份隔离——`deleteBatch`
> 要求 identityId；Prisma/PowerSync 过滤 identity；shared projection 按 identity
> 分组批量删除。补 ownership surface。§13.2 仍部分。
> 验证：schedule task surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-22（阶段 6 残留一百五十六轮）：Task template 身份隔离——`deleteBatch`
> 要求 identityId；Prisma/PowerSync 过滤 identity。补 ownership surface。§13.2 仍部分。
> 验证：task template surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-22（阶段 6 残留一百五十七轮）：Task instance 身份隔离——`deleteMany`
> 要求 identityId；Prisma/PowerSync 过滤 identity。补 ownership surface。§13.2 仍部分。
> 验证：task instance surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-22（阶段 6 残留一百五十八轮）：Goal 身份隔离——`exists`/`batchUpdateStatus`
> 要求 identityId；Prisma/PowerSync 过滤 identity。补 ownership surface。§13.2 仍部分。
> 验证：goal ownership surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-22（阶段 6 残留一百五十九轮）：Task template 身份隔离——`softDelete`/
> `restore` 要求 identityId；Prisma/PowerSync 过滤 identity。补 ownership surface。
> §13.2 仍部分。验证：task template surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-22（阶段 6 残留一百六十轮）：Goal 身份隔离——`batchMoveToFolder` 要求
> identityId；Prisma/PowerSync 过滤 identity。补 ownership surface。§13.2 仍部分。
> 验证：goal ownership surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-22（阶段 6 残留一百六十一轮）：Goal 层级查询身份隔离——`isAncestor`/
> `findChildren` 要求 identityId；Prisma/PowerSync 过滤 identity。补 ownership surface。
> §13.2 仍部分。验证：goal ownership surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-22（阶段 6 残留一百六十二轮）：Schedule task 列表身份隔离——
> `findBySourceModule`/`findBySourceEntity`/`findByStatus` 要求 identityId；Prisma/
> PowerSync 始终过滤 identity；shared projection 无 identity 时拒绝。`findEnabled`/
> `findDueTasksForExecution` 保留系统调度路径。补 ownership surface。§13.2 仍部分。
> 验证：schedule task surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-22（阶段 6 残留一百六十三轮）：Task template 身份隔离——合并
> `findByIdWithChildren`/`ForIdentity` 为单一 `findByIdWithChildren(identityId, id)`；
> Prisma/PowerSync 过滤 identity；get use case 同步。补 ownership surface。§13.2 仍部分。
> 验证：task template surface + get-task-template tests + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-22（阶段 6 残留一百六十四轮）：Reminder findActive 身份隔离——template/
> group `findActive` 要求 identityId；Prisma/PowerSync 始终过滤 identity。
> `findByNextTriggerBefore` 保留系统调度可选 identity。补 ownership surface。§13.2 仍部分。
> 验证：reminder template surface + list tests + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-22（阶段 6 残留一百六十五轮）：Schedule task query/count 身份隔离——
> `IScheduleTaskQueryOptions.identityId` 必填；Prisma/PowerSync query/count 始终
> 过滤 identity。`findEnabled`/`findDue` 仍为系统调度路径。补 ownership surface。
> §13.2 仍部分。验证：schedule task surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-22（阶段 6 残留一百六十六轮）：Task dependency 身份隔离——合并
> `findAggregateById`/`ForIdentity` 为单一 `findAggregateById(identityId, id)`；
> Prisma/PowerSync 过滤 identity；delete use case 同步。补 ownership surface。§13.2 仍部分。
> 验证：task dependency surface + dependency tests + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

>
> 续进展 2026-07-22（阶段 6 残留一百六十七轮）：旧 editor/repository 运行时面审计——
> API/Desktop/Vue 源码表面锁定仅 knowledge 路径；无 Editor module 注册；无
> SyncRepositoryUseCase；contracts RepositoryRpcMap 为空；Vue 无 /note/:id。
> 补 ownership/runtime surface。§13.2 仍部分。
> 验证：legacy-editor-repository-runtime surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百六十八轮）：Schedule projection 身份隔离——
> task/goal/reminder projection source 与 orchestration projector 强制 `identityId`；
> 删除 bare `findById` 双轨回退；`ProjectionSelection.identityId` 必填。
> 补 ownership/surface specs。§13.2 仍部分。
> 验证：task/goal/reminder projection + ownership surface + schedule ownership surface +
> governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百六十九轮）：AI conversation/provider 身份隔离——
> 删除 bare `findById` 双轨，唯一读路径为 `findByIdForIdentity`（prisma/powersync/memory）。
> 补 ownership/repository surface。§13.2 仍部分。
> 验证：ai ownership/surface + focused unit/runtime specs + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百七十轮）：Calendar schedule 身份隔离——
> 删除 `IScheduleRepository` bare `findById` 双轨，唯一读路径 `findByIdForIdentity`。
> 补 ownership/surface。§13.2 仍部分。
> 验证：schedule event ownership/surface + application service specs + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百七十一轮）：Goal folder 身份隔离——
> 删除 `IGoalFolderRepository` bare `findById` 双轨，唯一读路径 `findByIdForIdentity`。
> 补 ownership/surface。§13.2 仍部分。
> 验证：goal-folder ownership surface + get-folder focused specs + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百七十二轮）：Focus mode/session 身份隔离——
> 删除 bare `findById` 双轨，唯一读路径 `findByIdForIdentity`（mode 含 powersync；
> session prisma）。`deactivateExpired` 系统路径保留。补 ownership/surface。§13.2 仍部分。
> 验证：focus mode/session ownership surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百七十三轮）：Weight snapshot 身份隔离——
> 删除 bare `findById` 双轨，唯一读路径 `findByIdForIdentity`。补 ownership/surface。
> §13.2 仍部分。验证：weight-snapshot ownership surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百七十四轮）：Reminder group/response 身份隔离——
> 删除 bare `findById` 双轨，唯一读路径 `findByIdForIdentity`。Template bare `findById`
> 暂保留（系统/兼容测试面）。补 ownership/surface。§13.2 仍部分。
> 验证：reminder group/response ownership surfaces + focused specs + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百七十五轮）：Reminder template 身份隔离——
> 删除 bare `findById` 双轨，唯一读路径 `findByIdForIdentity`。`findByNextTriggerBefore`
> 系统调度路径保留。补 ownership/surface。§13.2 仍部分。
> 验证：reminder template ownership surface + focused specs + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百七十六轮）：Task folder/dependency 身份隔离——
> 删除 bare `findById` 双轨，唯一读路径 `findByIdForIdentity`。补 ownership/surface。
> §13.2 仍部分。验证：task folder/dependency ownership surfaces + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百七十七轮）：Task template/instance 身份隔离——
> 删除 bare `findById` 双轨，唯一读路径 `findByIdForIdentity`（`findByIdWithChildren` 仍 identity-scoped）。
> 补 ownership/surface。§13.2 仍部分。验证：task template/instance ownership surfaces + focused specs + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百七十八轮）：Goal + Notification/preference 身份隔离——
> 删除 bare `findById` 双轨，唯一读路径 `findByIdForIdentity`。Notification template 系统全局 bare `findById` 保留。
> 补 ownership/surface。§13.2 仍部分。验证：goal/notification/preference ownership surfaces + focused specs + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百七十九轮）：Schedule execution 身份隔离——
> 删除 bare `findById` 双轨，唯一读路径 `findByIdForIdentity`。Schedule task bare `findById` 仍保留
> 作为 runtime 无 identity 时的 bootstrap + re-own 路径（residual 131）。§13.2 仍部分。
> 验证：schedule-execution ownership surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百八十轮）：双轨收口锁定 + legacy editor 包面锁定——
> Schedule task bare `findById` 仅允许 runtime bootstrap（surface 锁定）；auth use-case 禁止 bare 读。
> `packages/editor` 目录与 `@dailyuse/editor` 依赖保持删除。portable editor_* 备份导入边界未动。
> §13.2 仍部分（三入口/Agent multi-engine/真实 GitHub fixture E2E 仍缺）。验证：schedule-task/runtime
> + legacy-editor surfaces + governance-check。状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百八十一轮）：§13.2 未打勾项诚实证据重审（不改 checkbox）——
> 1) 三入口仍为 **部分**：`three-login-surface.matrix.spec.ts`（14）+ Desktop/Web auth surface 通过；
>    仍缺真实 OAuth/跨端 Playwright-Electron 一揽子。
> 2) Agent 隔离仍为 **部分**：`adr-035-capability-turn-isolation.journey.spec.ts`（13）通过
>   （confirm-only / cancel 无副作用 / cross-capability fail-closed / identity isolation）；
>    仍缺完整 multi-engine Turn Engine E2E 与跨端对抗 E2E。
> 3) 门禁验收仍为 **部分+外部阻塞**：本分支 focused vitest + `daily-use:governance-check` 绿；
>    真实 GitHub App fixture E2E 缺凭据；不伪造。
> 身份隔离 dual-method 波次 169–179 已收口 + 180 锁定；不因此宣称 plan 完成。
> 验证：matrix + adr-035 journey + governance-check。状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百八十二轮）：根脚本清理删除的 editor Nx 工程——
> `package.json` 的 `test:integration` / `test:coverage:domain` 不再包含已删除的 `editor` project。
> portable `editor_*` 表 bootstrap 脚本保留。补 legacy-editor surface。§13.2 仍部分。
> 验证：legacy-editor surface + governance-check。状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百八十三轮）：CI coverage 清理删除的 editor Nx 工程——
> `.github/workflows/coverage.yml` 的 `GOVERNED_DOMAIN_COVERAGE_PROJECTS` 去掉 `editor`。
> 补 legacy-editor surface。§13.2 仍部分。验证：legacy-editor surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百八十四轮）：文档与治理真值对齐——ADR-031 业务 feature 包列表改为
> 12 个（去掉已退役 `editor`），与 `server-feature-shape-audit` `AUDITED_PACKAGES` 一致；ADR-032
> 示例改为 repository 模块。补 legacy-editor surface。§13.2 仍部分。
> 验证：legacy-editor surface + governance-check。状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百八十五轮）：§13.2 核心证据套件复跑（不改 checkbox）——
> `safe-markdown`（15）、knowledge connection/write-request ownership、legacy-editor（13）、
> three-login matrix（14）、adr-035 journey（13）共 66 通过；`daily-use:governance-check` 通过。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百八十六轮）：knowledge connection bootstrap dual lock——
> bare `findById` 仅允许 projection `loadOwnedConnectionById` webhook/reconcile bootstrap + re-own；
> connection service 禁止 bare 读；port 保留 dual method（镜像 residual 180 schedule-task 模式）。
> §13.2 仍部分。验证：knowledge-repository-connection-ownership surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百八十七轮）：GitHub webhook delivery bootstrap dual lock——
> bare `findById(deliveryId)` 仅系统 processDelivery bootstrap；`updateStatus` 始终带 `connectionId` 围栏；
> 连接经 `loadOwnedConnectionById` 复核；delivery port 不设 identity dual-method（系统投递主键设计）。
> §13.2 仍部分。验证：github-webhook-delivery-ownership surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百八十八轮）：auth session trusted-token bootstrap dual lock——
> bare `findById(sessionId)` 仅 JWT/refresh 可信 token 声明路径；revoke/getCurrentUser 必须
> `findByIdForIdentity`，owned miss 统一 NOT_FOUND（不 FORBIDDEN）。§13.2 仍部分。
> 验证：auth-session-ownership surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百八十九轮）：notification template 系统全局 catalog lock——
> bare `findById` 是模板目录主键路径（无 identity dual-method）；create-from-template 先全局加载模板，
> 再按 `identityId` 创建 owned notification。§13.2 仍部分。
> 验证：notification-template-ownership surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百九十轮）：governance rule 全局 catalog lock——
> bare `findById`/`findByCode` 是全局规则目录主键路径；`authorId` 仅修订归因元数据，不是 ownership 围栏；
> HTTP 变更靠 role（TechLead/Architect），非 identity dual-method。§13.2 仍部分。
> 验证：governance-rule-ownership surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百九十一轮）：§13.2 核心证据套件复跑（含 dual/catalog locks，不改 checkbox）——
> `safe-markdown`、connection/write-request/webhook-delivery/legacy-editor、auth-session、
> notification-template、governance-rule ownership、three-login matrix、adr-035 journey 共 87 通过；
> `daily-use:governance-check` 通过。仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、
> GitHub App fixture E2E、全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百九十二轮）：account / auth-identity 自然主键 ownership lock——
> `Account`/`AuthIdentity` 主键即 identity id，bare `findById` 为自然 ownership 路径（无 dual-method）；
> 用户路径以 `cx.identityId` / token `identityId` 加载。§13.2 仍部分。
> 验证：account + auth-identity ownership surfaces + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百九十三轮）：portable editor 备份再导入边界锁定——
> `editor_*` schema + `prepare-editor-workspace-natural-key` + data-portability import/export 保留；
> 运行时 `packages/editor` 保持删除；宿主不 remount Editor API/Electron；importer 全路径
> `identityId: ctx.identityId`；server-held disclosure 仍 not-importable。§13.2 仍部分。
> 验证：portable-editor-backup-boundary + legacy-editor surfaces + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百九十四轮）：notification preference update identityId 必填收口——
> `UpdateNotificationPreferenceUseCase.execute(identityId, input)`；application port
> `updatePreferences(dto, identityId)`；去掉 optional identity dual-track。§13.2 仍部分。
> 验证：preference ownership surface + update-notification-preference tests + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百九十五轮）：§13.2 核心证据套件复跑（含 ownership/portable locks，不改 checkbox）——
> workspace 13 文件 99 + data-portability portable-editor/server-held 8，共 107 通过；
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百九十六轮）：notification preference 传输面接线——
> HTTP `GET/PUT /api/v1/notifications/preferences`（静态路径先于 `/:id`）；Electron
> `notification:preferences:get|update`；controller 仅从 `ctx.identityId` 取身份；
> get 走 `executeOrCreate`；body 无 identity dual-track。§13.2 仍部分。
> 验证：preference ownership/routes/electron surfaces + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百九十七轮）：notification preference 客户端面闭环——
> `INotificationApiClient` / `NotificationClientService` 增加 get/updatePreferences；
> HTTP `/preferences` + IPC PREFERENCES_*；客户端不传 identityId dual-track。§13.2 仍部分。
> 验证：preference ownership + ipc adapter surfaces + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百九十八轮）：§13.2 核心证据套件复跑（含 preference transport/client，不改 checkbox）——
> workspace 15 文件 110 + data-portability 8，共 118 通过；仍为部分/外部阻塞：真实 OAuth 跨端 E2E、
> multi-engine Turn Engine E2E、GitHub App fixture E2E、全量 PR 门禁一揽子。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留一百九十九轮）：Settings 通知偏好 UI 接入——
> `useNotificationPreferences` + `NotificationSettings` 模块渠道（inApp/push）；
> 客户端不传 identityId；保留 Desktop 自定义通知 user-setting 开关。§13.2 仍部分。
> 验证：NotificationSettings/composable/surface specs + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。
>
> 续进展 2026-07-22（阶段 6 残留二百轮）：preference UI 证据补强（不改 checkbox）——
> NotificationSettings/composable/surface + preference ownership/routes focused specs 通过；
> 三入口/Agent/全量门禁仍为部分/外部阻塞。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百零一轮）：confirmed-create-only / 已有笔记编辑关闭边界 surface 锁定——
> 应用/客户端 port 仅 `createConfirmedKnowledgeNote` + Desktop `writeConfirmedLocalVaultNote`；
> HTTP knowledge-notes 仅 GET 列表/详情 + POST 确认创建；Local Vault `wx` 独占创建；
> Vue 无 `/note/:id`/`note-edit`；projection `editDraft` 仅回 draft 阶段；AI `CreateKnowledgeNoteSchema`
> 强制 confirmation；`packages/editor` 仍删除、portable `editor_*` 备份边界保留。§13.2 项 10 证据增强
> （checkbox 已证明，不改）。验证：confirmed-create-only surface + notePanelAdaptation + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百零二轮）：退役 in-app editor 用户偏好双轨——删除 `EditorSchema`/
> `preferences.editor` 与 `SettingCategory.Editor`；无 Settings UI 消费者；旧 stored blob 解析时剥离；
> 对齐 ADR-034 §1 实现状态叙述（不再声称 Web 通用编辑/未实现 GitHub App）。portable `editor_*`
> 备份边界未动。§13.2 未打勾项仍为部分/外部阻塞。验证：retired-editor-preference surface + setting
> focused specs + governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百零三轮）：退役 setting 双轨 const-enum / definition VO——
> 删除 FontSize/ThemeMode/TimeFormat/TaskViewType/GoalViewType/ScheduleViewType/ProfileVisibility/
> SettingCategory/SettingDefinition/SettingScope/SettingValueType/UIInputType/UIConfig/SyncConfig/
> OperatorType/ValidationRule 与 domain 镜像；偏好字段枚举仅保留 Zod preference schemas；
> domain 仅保留 SettingId。§13.2 未打勾项仍为部分/外部阻塞。验证：retired dual-track VO surface +
> setting VO/aggregate focused specs + governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百零四轮）：§13.2 核心证据套件复跑（含 201–203 边界/双轨锁，不改 checkbox）——
> workspace 25 文件 151 + data-portability portable-editor 5 + desktop guest-upgrade 1，共 **27 文件 / 157 测试** 通过
> （app-vue three-login/notePanel 22、ADR-035 13、repository surfaces 40、contracts 29、notification 16、
> auth/account/governance/schedule ownership 31、portable-editor 5、guest journey 1）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百零五轮）：文档/菜单双轨收口——module-index 去掉已失效的
> “legacy CRUD 硬失败 NOT_SUPPORTED”叙述（方法已不存在）；索引补 residual 201 confirmed-create
> surface；菜单 locale 删除 repository bookmark 双轨键，并补 reminder 使用的 pauseTemplate/
> enableTemplate。§13.2 未打勾项仍为部分/外部阻塞。验证：legacy-note-surface-docs surface +
> governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百零六轮）：退役 AI 知识面 Resource 双轨术语——用户可见文案与
> 客户端 helper 统一为 knowledge note / 知识笔记（`requestOpenKnowledgeNote`、
> `loadRecentKnowledgeNotes`、Fetch Note/读取笔记、matched note(s)/篇笔记、indexed knowledge notes）；
> Agent 工具 id `fetch_resource` 协议保持不变（仅展示 label）；菜单 locale 删除无消费者的
> openInNewTab/fileInfo/createSubfolder。补 `ai-knowledge-note-terminology.surface.spec.ts`。
> §13.2 未打勾项仍为部分/外部阻塞。验证：terminology/deeplink/legacy-note surfaces +
> AIGoalWorkflowPanel/AIChatView focused specs + governance-check。状态保持 **实施中**；
> PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百零七轮）：服务端/AI-service 产品文案对齐 knowledge notes——
> 空检索回答、goal recovery 建议、索引失败消息与 goal_planning/search_notes 提示不再使用
> “repository resources”；协议字段 `fetch_resource`/`matchedResourceCount`/`maxResources`/
> `resourceId` 保持稳定。补 packages/ai terminology surface。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：ai-knowledge-note-terminology + query/goal focused specs + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百零八轮）：AI eval/fixture 与 §13.2 证据复跑——eval cases/
> baseline 与 packages/ai 索引测试样本文档去掉 “repository resources” 双轨措辞，对齐
> knowledge notes；contracts setting VO 注释去掉已删 packages/editor 引用。复跑核心证据套件
> **33 文件 / 205 测试**（app-vue 25、ai journey/term/query/index 36、repository 39、
> contracts retired+agent 29、notification 23、ownership auth/account/gov/schedule 47、
> portable-editor 5、desktop guest 1）+ governance-check。§13.2 未打勾项仍为部分/外部阻塞
> （真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、全量 PR 门禁）。
> 状态保持 **实施中**；PR readiness 仍为 no。不改 checkbox。

> 续进展 2026-07-22（阶段 6 残留二百零九轮）：Web MSW knowledge-only 收口——删除 repository
> handlers 中 legacy Resource/Folder/Bookmark/`/repositories/current`/search 的双轨 404 stub
> （未挂载路径走 `onUnhandledRequest: bypass`；真实 API 边界仍由 E2E
> `legacy-note-mutation-boundary` 验证）；goal automation 日志改为 knowledge notes 措辞。
> §13.2 未打勾项仍为部分/外部阻塞。验证：repository.handlers.spec（4）+ goal generation
> focused specs + governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百一十轮）：计划摘要与代码边界对齐——阶段 6 总述去掉过时
> “客户端 legacy CRUD 硬失败”表述（方法已删除，非 hard-fail 双轨），并注明 MSW 无 legacy
> 404 stub。§13.2 未打勾项仍为部分/外部阻塞。验证：governance-check。状态保持 **实施中**；
> PR readiness 仍为 no。不改 checkbox。

> 续进展 2026-07-22（阶段 6 残留二百一十一轮）：文档/E2E 双轨收口——module-index 去掉
> “legacy 硬失败 / MSW legacy 404”过时叙述；goal-workflow e2e 不再 seed
> `ai:debug:legacy-goal-workflow` 调试双轨（仅清理残留 key）；扩展
> `legacy-note-surface-docs.surface.spec.ts` 锁定 MSW knowledge-only 与 e2e 边界。
> §13.2 未打勾项仍为部分/外部阻塞。验证：legacy-note-surface-docs surface（5）+
> governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百一十二轮）：§13.2 核心证据套件复跑（含 residual 211
> MSW/e2e/module-index 锁，不改 checkbox）——**32 文件 / 204 测试**（app-vue 27、ai journey/
> terminology/query/index 36、repository 39、web MSW 4、contracts 22、ownership auth/account/
> notification/gov/schedule 70、portable-editor 5、desktop guest 1）+ governance-check。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百一十三轮）：AI knowledge source port 退役 Resource 双轨命名——
> `KnowledgeSourceResource`→`KnowledgeSourceNote`；`listRelevantNotes`/`listIndexableNotes`/
> `getNoteById`；goal automation TS 字段 `relatedNotes`；wire 仍用 `related_resources`；
> agent start 上下文只认 `related_resources`（去掉 relatedNotes 双轨读入）。补
> `knowledge-source-note.surface.spec.ts`。协议字段 `resourceId`/`resourcePath` 与
> `fetch_resource` 保持稳定。§13.2 未打勾项仍为部分/外部阻塞。验证：surface +
> ai-query/goal/runtime + api/desktop knowledge-source adapter specs + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百一十四轮）：AI knowledge index/sync 层 Resource→Note 命名——
> `KnowledgeIndexedNote`、`SyncKnowledgeNotesUseCase`、`indexNote`/`findByNoteIds`/
> `findRelevantNotes`/`removeByNoteId`、`indexedNotes`、`KnowledgeIngestionInput.note`；
> 文件 `sync-knowledge-notes`/`sync-note-by-id`/`remove-knowledge-index-note`；ai-service
> 入参只认 snake_case `related_resources`（去掉 camelCase 双轨）。Wire 键
> `indexed_resources`/`related_resources` 与协议 `resourceId` 保持稳定。补
> `knowledge-index-note.surface.spec.ts`。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：index/source/terminology surfaces + query/goal/runtime/prisma specs +
> governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百一十五轮）：ai-service agent 入参 snake_case 单一真值——
> 去掉 `providerConfig`/`indexedResources`/`analyticsContext`/`contextErrors` 顶层双轨及
> provider/analytics 嵌套 camelCase 别名归一；TS runtime 只检查/写入
> `analytics_context`/`related_resources`/`context_errors`；内部 `syncNotes` 字段命名；
> e2e-style unit 用例改为 snake_case。`tokenUsage`/`token_usage` 双读暂留（contracts 响应面
> 仍用 camelCase）。补 `ai-service-agent-input-snake-case.surface.spec.ts`。
> §13.2 未打勾项仍为部分/外部阻塞。验证：snake-case/index/source surfaces + query/goal/
> runtime focused specs + governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百一十六轮）：§13.2 核心证据套件复跑（含 residual 213–215
> knowledge source/index Note 命名 + ai-service agent input snake_case 锁，不改 checkbox）——
> **35 文件 / 212 测试**（app-vue 27、ai journey/terminology/source/index/snake/query/index 44、
> repository 39、web MSW 4、contracts 22、ownership auth/account/notification/gov/schedule 70、
> portable-editor 5、desktop guest 1）+ governance-check。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百一十七轮）：ai-service agent 入参剩余 camelCase 双轨收口——
> `token_usage`/`provider_id`/`processing_time_ms`/`matched_resource_count` 单一真值（去掉
> tokenUsage/providerId/processingTimeMs/matchedResourceCount 双读）；TS knowledge.qa 富化与
> goal provider 解析写/读 snake_case；app-vue knowledge.qa/generate/goal 工作流入参对齐；
> 扩展 snake-case surface。artifact/响应面仍用 camelCase（contracts）。§13.2 未打勾项仍为
> 部分/外部阻塞。验证：snake-case surface + remote runtime + ADR-035 journey + AIChatView
> + pytest test_agent_runtime_routes（27）+ governance-check。状态保持 **实施中**；
> PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百一十八轮）：Python ai-service knowledge Resource→Note 命名——
> `KnowledgeResourceDocument`→`KnowledgeNoteDocument`、`IndexedKnowledgeResource`→
> `IndexedKnowledgeNote`、`KnowledgeIndex*Resource*`→`KnowledgeIndex*Note*`；
> `index_note`/`parse_knowledge_note`；TS ingestion 响应类型 `AIServiceIndexedKnowledgeNoteResponse`。
> Wire 键 `resource`/`indexed_resource`/`related_resources`/`indexed_resources` 与协议
> `resource_id`/`resource_path` 保持稳定。补 `knowledge-python-note.surface.spec.ts`。
> §13.2 未打勾项仍为部分/外部阻塞。验证：python knowledge surfaces + pytest knowledge/goal/
> agent routes（47）+ governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百一十九轮）：§13.2 核心证据套件复跑（含 residual 217–218
> agent input snake_case 与 Python knowledge Note 命名锁，不改 checkbox）——
> **36 文件 / 216 测试**（app-vue 27、ai journey/term/source/index/python/snake/query/index 48、
> repository 39、web MSW 4、contracts 22、ownership auth/account/notification/gov/schedule 70、
> portable-editor 5、desktop guest 1）+ governance-check。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百二十轮）：AI evaluation 报告 on-disk 双轨收口——
> `AIEvaluationReportFileAdapter` 只读 Python snake_case 报告字段（`generated_at`/
> `cases_path`/`pass_rate`/`gate_passed` 等），映射到 contracts camelCase；去掉
> camelCase on-disk 双读。测试 fixture 对齐真实报告形状。补
> `ai-evaluation-report-snake-case.surface.spec.ts`。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：adapter + surface + governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百二十一轮）：退役 ai-service checkpoint 遗留 dual-track
> 工厂——删除 `build_file_backed_saver`/`build_file_backed_run_history_store`（checkpoint_factory
> 与 checkpoints 双份定义 + package export）；运行时只保留 settings 真值
> `build_checkpointer`/`build_run_history_store`。补
> `ai-service-checkpoint-factory-surface.spec.ts`。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：surface + pytest checkpoint/agent runtime（38）+ governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百二十二轮）：GoalPlanningService 退役 dual-track 兼容 re-export——
> 删除未使用的 parsers/tools “backward compatibility” 再导出（`strip_code_fence`/
> automation parse/tool builders）；服务仅 import 自用符号；strategies 继续直接从
> parsers/tools 模块导入。补 `ai-service-goal-planning-surface.spec.ts`。
> §13.2 未打勾项仍为部分/外部阻塞。验证：surface + pytest goal planning/clarification/
> automation（19）+ governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百二十三轮）：知识笔记 mutation 事件 Resource→Note 命名——
> 事件 id `repository:resource:mutated`→`repository:note:mutated`；
> `REPOSITORY_NOTE_MUTATED_EVENT` / `RepositoryNoteMutatedEvent` /
> `RepositoryNoteMutationType` / `publishRepositoryNoteMutation`；publisher 文件更名；
> AI auto-index 订阅对齐。协议 payload 字段 `resourceId`/`resourcePath` 保持稳定。
> 补 `repository-note-mutation.surface.spec.ts`。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：surface + ai-query-services + governance-check。状态保持 **实施中**；
> PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百二十四轮）：§13.2 核心证据套件复跑（含 residual 220–223
> eval snake_case / checkpoint factory / goal-planning surface / note mutation 事件锁，不改 checkbox）——
> **41 文件 / 225 测试**（app-vue 27、ai journey/term/source/index/python/snake/checkpoint/goal/
> eval/adapter/query/index 55、repository note-mutation/confirmed-create/legacy-editor/
> ownership/http 41、web MSW 4、contracts 22、ownership auth/account/notification/gov/schedule 70、
> portable-editor 5、desktop guest 1）+ governance-check。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百二十五轮）：goal.create usage/key-result 双轨收口——
> `_normalize_usage` 改为 `AgentUsage.model_validate(...).model_dump(by_alias=True)`（对齐
> knowledge_qa），去掉 promptTokens/prompt_tokens 等 camel/snake dual-get；planner key-result
> 只读 `targetValue`（model_dump by_alias 真值）。补
> `ai-service-goal-create-usage-surface.spec.ts`。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：surface + pytest goal planning/clarification/automation/agent routes（46）+
> governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百二十六轮）：evals/runner 退役 backward-compat re-export barrel——
> 删除未使用的 models/loaders/reporters 再导出与 dead import；`__all__` 仅保留
> `evaluate_cases` / `evaluate_cases_with_mode` / `build_goal_workflow_eval_result`；
> 测试改从 canonical 模块导入。补 `ai-service-eval-runner-surface.spec.ts`。
> §13.2 未打勾项仍为部分/外部阻塞。验证：surface + pytest eval/goal-workflow/agent harness
> （19）+ governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百二十七轮）：menu labels 退役 locale dual-track——
> 删除 `setMenuLocale` / `getMenuLocale` / `currentLocale` 与 shared re-export；
> `menuLabel` 仅走 vue-i18n；`useLocaleSync` 只同步 i18n + `document.documentElement.lang`。
> 补 `menu-labels-single-track.surface.spec.ts`。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：surface + governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百二十八轮）：§13.2 核心证据套件复跑（含 residual 225–227
> goal_create usage / eval runner / menu-labels 锁，不改 checkbox）——
> **44 文件 / 231 测试**（app-vue three-login/note/menu 29、ai journey/term/source/index/
> python/snake/checkpoint/goal/usage/eval/adapter/query 59、repository 41、web MSW 4、
> contracts 22、ownership auth/account/notification/gov/schedule 70、portable-editor 5、
> desktop guest 1）+ governance-check。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百二十九轮）：AI runtime 测试 mock 对齐 knowledge source Note 端口——
> 去掉 `fetchAllResources` 残留 stub；统一 `listRelevantNotes` / `listIndexableNotes` /
> `getNoteById`。补 `knowledge-source-note-test-mocks.surface.spec.ts`。
> §13.2 未打勾项仍为部分/外部阻塞。验证：surface + capabilities + remote knowledge tests
> + governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百三十轮）：阶段 6 dual-track 再收口——
> 1) schedule 路由删除 week/dashboard 兼容 redirect，E2E 落地 `/schedule/calendar`；
> 2) 删除无调用链的 `getBootstrapper` 便利 dual-path（main/runtime/profile manager）；
> 3) remote AI runtime fixture `sourceResource`→`sourceNote`。
> 补 schedule-router / desktop-bootstrapper-access surfaces。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：app-vue/desktop/ai surfaces + governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百三十一轮）：§13.2 核心证据套件复跑（含 residual 229–230
> note mocks / schedule single route / bootstrapper access 锁，不改 checkbox）——
> **47 文件 / 235 测试**（app-vue three-login/note/menu/schedule 31、ai journey/term/source/
> index/python/snake/checkpoint/goal/usage/eval/mocks/adapter/query 60、repository 41、
> web MSW 4、contracts 22、ownership auth/account/notification/gov/schedule 70、
> portable-editor 5、desktop guest+bootstrapper 2）+ governance-check。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百三十二轮）：schedule 单入口文档/E2E 对齐（接 residual 230）——
> 删除 dual `schedule-week-view` E2E；`schedule-files.md` 去掉已不存在的
> ScheduleDashboardView/ScheduleWeekView；UI redesign 文档去掉 week/dashboard redirect
> 先例表述。扩展 schedule-router surface 锁 docs+e2e。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：surface + governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百三十三轮）：schedule 文档残留 + reminder DTO 双轨收口——
> Brief/V2/PAGE redesign 当前态改写为 `ScheduleCalendarView` 单入口（去掉
> ScheduleDashboardView / week/dashboard 兼容 redirect 现状描述）；
> `UpcomingReminderDTO` 仅从 `@dailyuse/contracts/reminder` 再导出，删除 domain
> calculation service 的 dual re-export。补 surfaces。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：schedule/reminder surfaces + calculation tests + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百三十四轮）：§13.2 核心证据套件复跑（含 residual 232–233
> schedule docs/E2E + reminder DTO 锁，不改 checkbox）——
> **48 文件 / 238 测试**（app-vue three-login/note/menu/schedule 32、ai journey/term/source/
> index/python/snake/checkpoint/goal/usage/eval/mocks/adapter/query 60、repository 41、
> web MSW 4、contracts 22、ownership auth/account/notification/gov/schedule 70、
> portable-editor 5、desktop guest+bootstrapper 2、reminder dto surface 2）+ governance-check。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百三十五轮）：Desktop auth token/network 类型 dual-track 收口——
> 删除 `TokenData` 别名路径，统一 `TokenStorageData`；token-manager /
> network-state-manager 不再 re-export contracts 类型；infrastructure index 仅从
> `@dailyuse/contracts/authentication` 导出 token/network 类型。删除 AI domain 根级
> `ai-provider-config.ts` dual barrel。补 surfaces。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：desktop auth surfaces + SessionManager/lifecycle/auth service specs +
> governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百三十六轮）：Desktop auth application/session 类型 dual re-export 收口——
> `auth-desktop-application-service` 不再 convenience re-export contracts/result 与 lifecycle 类型；
> `session-manager` 不再 re-export `session-types`；infrastructure index 从 `./session-types`
> 导出 `SessionRestoreResult`/`AutoLoginResult`/`SessionStatus`/`OfflineLoginResponse`。
> 补 export surfaces。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：export surfaces + SessionManager/lifecycle/auth service specs + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百三十七轮）：§13.2 核心证据套件复跑（含 residual 235–236
> desktop auth token/session/application export + AI provider barrel 锁，不改 checkbox）——
> **52 文件 / 249 测试**（app-vue three-login/note/menu/schedule 32、ai journey/term/source/
> index/python/snake/checkpoint/goal/usage/eval/mocks/adapter/query/provider-barrel 61、
> repository 41、web MSW 4、contracts 22、ownership auth/account/notification/gov/schedule 70、
> portable-editor 5、desktop guest+bootstrapper+auth export 12、reminder dto surface 2）+
> governance-check。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百三十八轮）：authentication PowerSync dual barrel 收口——
> 删除 `server/infrastructure/powersync/` 目录 convenience barrel（与 `powersync.ts` 双轨）；
> 统一 `createAuthenticationPowerSyncModule` 文件轨 + infrastructure index 导出。补 surface。
> §13.2 未打勾项仍为部分/外部阻塞。验证：auth-powersync-barrel surface + ownership surfaces +
> governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百三十九轮）：goal priority 类型 dual-track 收口——
> 删除 `GoalPriorityLevel` 别名与 calculator convenience type re-export；domain index 从
> `./priority` 单轨导出 `PriorityLevel`/`PriorityCalculationResult`/`DailyPriorityCalculator`。
> 补 surface。§13.2 未打勾项仍为部分/外部阻塞。验证：goal-priority surfaces + calculator specs +
> governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百四十轮）：authentication runtime contribution 类型 dual-track 收口——
> 删除 `AuthenticationRuntimeContribution` 对 `AuthenticationModuleRuntimeContribution` 的别名；
> factory 直接返回 composition-root 类型；index 不再 dual re-export 别名。补 surface。
> §13.2 未打勾项仍为部分/外部阻塞。验证：auth runtime contribution surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百四十一轮）：§13.2 核心证据套件复跑（含 residual 238–240
> auth PowerSync barrel / runtime contribution / goal priority 锁，不改 checkbox）——
> **55 文件 / 258 测试**（app-vue three-login/note/menu/schedule 32、ai journey/term/source/
> index/python/snake/checkpoint/goal/usage/eval/mocks/adapter/query/provider-barrel 61、
> repository 41、web MSW 4、contracts 22、ownership auth/account/notification/gov/schedule 70、
> portable-editor 5、desktop guest+bootstrapper+auth export 12、reminder dto 2、
> authentication powersync+runtime 6、goal priority export 3）+ governance-check。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百四十二轮）：Desktop electron contracts dual re-export 收口——
> 删除无消费者的 `main/shared/contracts` convenience barrel；`IElectronModule*` 仅从
> `@dailyuse/contracts/electron` 导入。补 surface。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：desktop electron contracts path surface + bootstrapper surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百四十三轮）：跨模块 runtime contribution 类型 dual-track 收口——
> 删除 account/notification/data-portability/repository/goal/task/schedule/reminder/setting
> 的 `*RuntimeContribution = *ModuleRuntimeContribution` 别名；factory 直接返回 Module 类型；
> schedule 去掉 runtime 侧未使用的 ContributionsInput dual 定义。补 cross-module surface。
> §13.2 未打勾项仍为部分/外部阻塞。验证：runtime contribution surfaces + task/schedule/repository
> runtime specs + governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百四十四轮）：dashboard contracts dual re-export 收口——
> `@dailyuse/dashboard` 不再 convenience re-export `DashboardData` 等 contracts DTO；API/Desktop
> 从 `@dailyuse/contracts/dashboard` 导入 DTO，从 dashboard 导入 projection/port 类型。补 surface。
> §13.2 未打勾项仍为部分/外部阻塞。验证：dashboard surface + projection tests + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百四十五轮）：§13.2 核心证据套件复跑（含 residual 242–244
> desktop electron path / cross-module runtime contribution / dashboard contracts 锁，不改 checkbox）——
> **58 文件 / 262 测试**（app-vue 32、ai 61、repository 41、web 4、contracts 22、
> ownership 70、portable 5、desktop 13、reminder 2、authentication 8、goal 3、dashboard 1）+
> governance-check。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百四十六轮）：transport application-port dual alias 收口——
> 删除 `NotificationUseCases`/`ReminderUseCases`/`AITransportHandlers` 对 ApplicationPort 的别名；
> app-vue i18n 去掉 `useI18n` convenience re-export（调用方直接 `vue-i18n`）。补 surfaces。
> §13.2 未打勾项仍为部分/外部阻塞。验证：notification/reminder/ai/app-vue surfaces +
> notification routes.spec + governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百四十七轮）：task DAG ViewModel / goal application types dual 收口——
> 删除未使用的 `TaskForDAGViewModel` 等 identity 别名；删除 goal `application/types.ts`
> 对 `ExecutionContext` 的 contracts re-export dual barrel。补 surfaces。
> §13.2 未打勾项仍为部分/外部阻塞。验证：app-vue/goal surfaces + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百四十八轮）：AI composable 未使用 dual type alias 收口——
> 删除 `GoalAgentArtifact`/`GoalAgentExecutedAction`/`KnowledgeNoteAgentArtifact` identity 别名
> 与 composables index re-export；调用方继续使用 contracts `AgentArtifact`/`AgentExecutedAction`。
> 补 surface。§13.2 未打勾项仍为部分/外部阻塞。验证：app-vue AI surfaces + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百四十九轮）：§13.2 核心证据套件复跑（含 residual 246–248
> transport UseCases / task DAG / goal types / AI composable dual 锁，不改 checkbox）——
> **65 文件 / 270 测试**（app-vue 36、ai 62、repository 41、web 4、contracts 22、
> ownership 70、portable 5、desktop 13、reminder 3、notification 1、authentication 8、
> goal 4、dashboard 1）+ governance-check。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百五十轮）：AI transport identity factory + governance types dual 收口——
> 删除无映射逻辑的 `createAITransportHandlers`（控制器直接接 `aiModule.api`）；删除
> app-vue governance `types.ts` contracts re-export barrel，内部与 index 均从
> `@dailyuse/contracts/governance` 导入。补 surfaces。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：ai/app-vue surfaces + governanceStore.spec + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百五十一轮）：app-vue dashboard types dual re-export 收口——
> `modules/dashboard/types.ts` 仅保留 `IDashboardApiClient` port；`DashboardData` 等 DTO
> 从 `@dailyuse/contracts/dashboard` 导入。补 surface。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：dashboard types surface + governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百五十二轮）：AI composable agent dual type alias 继续收口——
> 删除 `StreamDoneResult`/`AgentRunSummary`/`GoalAgentRunResult`/`Knowledge*AgentRunResult`/
> `GoalAgentAction` identity 别名；调用方改用 contracts `SendMessageRes`/`AgentRun`/
> `AgentRunResult`/`AgentAction`。扩展 surface。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：AI composable surfaces + governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百五十三轮）：§13.2 聚焦证据套件复跑（含 residual 250–252
> AI transport/governance/dashboard/AI agent dual 锁，不改 checkbox）——
> **27 文件 / 100 测试**（app-vue three-login/note/menu/schedule/i18n/task/gov/dashboard/AI 46、
> ai journey/provider/transport/source/eval 21、repository note/legacy 22、dashboard 1、
> authentication 5、desktop electron/bootstrapper/auth 5）+ governance-check。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百五十四轮）：AI composable GoalDraft/GoalClarification dual alias 收口——
> 删除 `GoalDraft`/`GoalClarification` identity 别名；调用方改用 contracts
> `GoalWorkflowDraftResultDTO`/`GoalClarificationDTO`（不经 composables barrel 再导出）。
> 保留 UI 标识 `createEmptyGoalDraft`/`GoalDraftState`/`applyGoalDraft`/`showGoalDraftEditor` 等非 dual。
> 扩展 `ai-composable-type-duals.surface.spec.ts`。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：AI composable dual surface + AIGoalWorkflowPanel.spec + residual dual surfaces + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百五十五轮）：§13.2 聚焦证据套件复跑（含 residual 250–254
> AI transport/governance/dashboard/AI agent/GoalDraft dual 锁，不改 checkbox）——
> **30 文件 / 115 测试**（app-vue three-login/note/menu/schedule/i18n/task/gov/dashboard/AI 43、
> ai journey/provider/transport/source/eval 22、repository note/legacy 33、dashboard 1、
> authentication 11、desktop electron/bootstrapper/auth 5）+ governance-check（GOV_EXIT:0）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百五十六轮）：desktop shared/types ipc-channels dual barrel 收口——
> 删除 `apps/desktop/src/shared/types/ipc-channels.ts` 及空 types/shared index 再导出；
> preload `allowed-channels` 与 `CustomNotificationView` 改从 `@dailyuse/contracts/electron`
>（GovernanceChannels 从 `@dailyuse/contracts/governance`）导入。补 surface。
> §13.2 未打勾项仍为部分/外部阻塞。验证：desktop dual surfaces + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百五十七轮）：task domain events dual barrel 收口——
> 删除无消费者的 `packages/task/src/server/domain/events/` contracts re-export；
> 聚合已直接使用 `@dailyuse/contracts/task` 的 `TaskEventMap`。补 surface。
> §13.2 未打勾项仍为部分/外部阻塞。验证：task domain/events surfaces + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百五十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–257
> dual 锁，含 desktop ipc-channels + task domain events，不改 checkbox）——
> **32 文件 / 119 测试**（app-vue 43、ai 22、repository 33、dashboard 1、authentication 11、
> desktop 7、task 2）+ governance-check（GOV_EXIT:0）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百五十九轮）：AI contracts StreamMessageDonePayload dual alias 收口——
> 删除 `StreamMessageDonePayload = SendMessageRes`；protocol event/rpc map 的 stream done/start
> 载荷统一使用 `SendMessageRes`。补 surface。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：contracts dual surface + ai-knowledge-note dto + app-vue AI dual surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百六十轮）：schedule contracts Schedule*DTO dual alias 收口——
> 删除无消费者的 `ScheduleTaskDTO = ScheduleTaskClientDTO` 与
> `ScheduleExecutionDTO = ScheduleExecutionClientDTO`；调用方已用 ClientDTO。补 surface。
> §13.2 未打勾项仍为部分/外部阻塞。验证：contracts dual surfaces + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百六十一轮）：§13.2 聚焦证据套件复跑（含 residual 250–260
> dual 锁，含 StreamMessageDonePayload + Schedule*DTO，不改 checkbox）——
> **34 文件 / 123 测试**（app-vue 43、ai 22、repository 33、contracts 4、dashboard 1、
> authentication 11、desktop 7、task 2）+ governance-check（GOV_EXIT:0）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百六十二轮）：task contracts dual alias 收口——
> 删除无消费者的 `TaskDomainEvent`（= `TaskCreatedEvent`）以及
> `CompleteTaskInstanceRes`/`SkipTaskInstanceRes`（= `TaskInstanceOperationRes`）；
> rpc map complete/skip 载荷统一 `TaskInstanceOperationRes`。补 surface。
> §13.2 未打勾项仍为部分/外部阻塞。验证：contracts dual surfaces + task domain surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百六十三轮）：contracts 无消费者 `*Res` identity dual 收口——
> 删除 19 个仅定义未引用的 `*Res = *DTO` 别名（goal review/record/focus/folder/key-result、
> AI provider refresh、knowledge connection create、account settings、task toggle completion、
> OAuth authorize、setting sync、rule revision get）。protocol 已用别名的 `*Res` 保留。补 surface。
> §13.2 未打勾项仍为部分/外部阻塞。验证：contracts dual surfaces + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百六十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–263
> dual 锁，含 task instance Res + dead *Res duals，不改 checkbox）——
> **36 文件 / 127 测试**（app-vue 43、ai 22、repository 33、contracts 8、dashboard 1、
> authentication 11、desktop 7、task 2）+ governance-check（GOV_EXIT:0）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百六十五轮）：contracts notification AssetImageKey dual 收口——
> 删除 `AssetImageKey = string` identity 别名；desktop dispatch `icon` 字段直接 `string | null`。
> 品牌化 `AssetImageKey` 仅保留在 `@dailyuse/assets`。补 surface。
> §13.2 未打勾项仍为部分/外部阻塞。验证：contracts dual surfaces + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百六十六轮）：collapse 模块 `IResultIpcClient` dual 到 `@dailyuse/ipc-client`——
> 规范接口含 `invoke` + 可选 `getBridge`；11 个模块 adapters 改为 type re-export；`ResultIpcClient implements IResultIpcClient`。
> 补 surface。§13.2 未打勾项仍为部分/外部阻塞。验证：ipc-client/ai surfaces + 邻近 adapter 测试 + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百六十七轮）：§13.2 聚焦证据套件复跑（含 residual 250–266
> dual 锁，含 AssetImageKey + IResultIpcClient，不改 checkbox）——
> **40 文件 / 136 测试**（app-vue 43、ai 24、repository 33、contracts 10、ipc-client 5、
> dashboard 1、authentication 11、desktop 7、task 2）+ governance-check（GOV_EXIT:0）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百六十八轮）：app-vue dashboard adapters transport dual 收口——
> HTTP/IPC 适配器删除本地 `IResultHttpClient`/`IResultIpcClient` 接口 dual，改用
> `@dailyuse/http-client` / `@dailyuse/ipc-client` 规范类型。补 surface。
> §13.2 未打勾项仍为部分/外部阻塞。验证：app-vue dashboard surfaces + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百六十九轮）：§13.2 聚焦证据套件复跑（含 residual 250–268
> dual 锁，含 dashboard transport dual，不改 checkbox）——
> **41 文件 / 138 测试**（app-vue 45、ai 24、repository 33、contracts 10、ipc-client 5、
> dashboard 1、authentication 11、desktop 7、task 2）+ governance-check（GOV_EXIT:0）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百七十轮）：DesktopBridge / ElectronAPI dual 收口到
> `@dailyuse/ipc-client` `ElectronBridge`——app-vue DI / window controls 与 desktop
> `window.electronAPI` / preload 类型统一；删除本地接口 dual。补 surfaces。
> §13.2 未打勾项仍为部分/外部阻塞。验证：app-vue/desktop surfaces + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百七十一轮）：§13.2 聚焦证据套件复跑（含 residual 250–270
> dual 锁，含 ElectronBridge，不改 checkbox）——
> **44 文件 / 144 测试**（app-vue 49、ai 24、repository 33、contracts 10、ipc-client 5、
> dashboard 1、authentication 11、desktop 9、task 2）+ governance-check（GOV_EXIT:0）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百七十二轮）：governance client drop `GovernanceIpcTransport` dual——
> `createGovernanceIpcClient` / IPC client 改用 `@dailyuse/ipc-client` `IResultIpcClient`。
> 补 surface。§13.2 未打勾项仍为部分/外部阻塞。验证：governance surface + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百七十三轮）：§13.2 聚焦证据套件复跑（含 residual 250–272
> dual 锁，含 GovernanceIpcTransport，不改 checkbox）——
> **45 文件 / 146 测试**（app-vue 49、ai 24、repository 33、contracts 10、ipc-client 5、
> governance 2、dashboard 1、authentication 11、desktop 9、task 2）+ governance-check（GOV_EXIT:0）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百七十四轮）：`ResultHttpClient implements IResultHttpClient`——
> 与 `ResultIpcClient implements IResultIpcClient` 对称；补 surface。
> §13.2 未打勾项仍为部分/外部阻塞。验证：http-client tests/typecheck + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百七十五轮）：§13.2 聚焦证据套件复跑（含 residual 250–274
> dual 锁，含 ResultHttpClient implements，不改 checkbox）——
> **47 文件 / 151 测试**（app-vue 49、ai 24、repository 33、contracts 10、ipc-client 5、
> http-client 5、governance 2、dashboard 1、authentication 11、desktop 9、task 2）+
> governance-check（GOV_EXIT:0）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百七十六轮）：setting / data-portability API port 位置 dual 收口——
> `ISettingApiClient` / `IDataPortabilityApiClient` 移入 `application-client/ports`；
> infrastructure adapters/types 仅 re-export（对齐 goal/task 等模块）。补 surfaces。
> §13.2 未打勾项仍为部分/外部阻塞。验证：setting/data-portability surfaces + adapter tests + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百七十七轮）：§13.2 聚焦证据套件复跑（含 residual 250–276
> dual 锁，含 setting/data-portability ports，不改 checkbox）——
> **49 文件 / 157 测试**（app-vue 49、ai 24、repository 33、contracts 10、ipc-client 5、
> http-client 5、governance 2、setting 3、data-portability 3、dashboard 1、authentication 11、
> desktop 9、task 2）+ governance-check（GOV_EXIT:0）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百七十八轮）：data-portability `DataPortabilityClientPort` dual 收口——
> 与 `IDataPortabilityApiClient` 完全同形，改为 type alias；service 直接 implements API client。
> 补 surface。§13.2 未打勾项仍为部分/外部阻塞。验证：data-portability surfaces/adapters + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百七十九轮）：§13.2 聚焦证据套件复跑（含 residual 250–278
> dual 锁，含 DataPortabilityClientPort，不改 checkbox）——
> **50 文件 / 159 测试**（app-vue 49、ai 24、repository 33、contracts 10、ipc-client 5、
> http-client 5、governance 2、setting 3、data-portability 5、dashboard 1、authentication 11、
> desktop 9、task 2）+ governance-check（GOV_EXIT:0）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百八十轮）：setting `SettingClientPort` dual 收口——
> 与 `ISettingApiClient` 对齐（`importSettings` 透传 `options`），改为 type alias；
> service 直接 implements API client。补 surface。
> §13.2 未打勾项仍为部分/外部阻塞。验证：setting surfaces + useUserSetting + governance-check。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百八十一轮）：§13.2 聚焦证据套件复跑（含 residual 250–280
> dual 锁，含 SettingClientPort，不改 checkbox）——
> **51 文件 / 161 测试**（app-vue 49、ai 24、repository 33、contracts 10、ipc-client 5、
> http-client 5、governance 2、setting 5、data-portability 5、dashboard 1、authentication 11、
> desktop 9、task 2）+ governance-check（GOV_EXIT:0）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百八十二轮）：authentication `AuthenticationClientPort` dual 收口——
> 与 `IAuthApiClient` 完全同形（pure Result pass-through），改为 type alias；service implements
> API client。补 surface。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：authentication surfaces + governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百八十三轮）：§13.2 聚焦证据套件复跑（含 residual 250–282
> dual 锁，含 AuthenticationClientPort，不改 checkbox）——
> **52 文件 / 163 测试**（app-vue 49、ai 24、repository 33、contracts 10、ipc-client 5、
> http-client 5、governance 2、setting 5、data-portability 5、authentication 13、dashboard 1、
> desktop 9、task 2）+ governance-check（GOV_EXIT:0）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百八十四轮）：repository `RepositoryClientPort` dual 收口——
> 与 `IRepositoryApiClient` 完全同形（pure Result pass-through），改为 type alias；service implements
> API client。补 surface。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：repository surfaces + governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百八十五轮）：§13.2 聚焦证据套件复跑（含 residual 250–284
> dual 锁，含 RepositoryClientPort，不改 checkbox）——
> **53 文件 / 165 测试**（app-vue 49、ai 24、repository 35、contracts 10、ipc-client 5、
> http-client 5、governance 2、setting 5、data-portability 5、authentication 13、dashboard 1、
> desktop 9、task 2）+ governance-check（GOV_EXIT:0）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百八十六轮）：reminder `ReminderClientPort` dual 收口——
> 与 `IReminderApiClient` 完全同形（pure Result pass-through，仅格式差异），改为 type alias；
> service implements API client。补 surface。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：reminder surfaces + governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百八十七轮）：§13.2 聚焦证据套件复跑（含 residual 250–286
> dual 锁，含 ReminderClientPort，不改 checkbox）——
> **54 文件 / 167 测试**（app-vue 49、ai 24、repository 35、contracts 10、ipc-client 5、
> http-client 5、governance 2、setting 5、data-portability 5、authentication 13、reminder 2、
> dashboard 1、desktop 9、task 2）+ governance-check（GOV_EXIT:0）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百八十八轮）：notification `NotificationClientPort` dual 收口——
> 删除 `dismissAll` → `batchDeleteNotifications` 双轨别名；port 改为 `INotificationApiClient`
> type alias；service implements API client。UI composable 保留本地 `dismissAll` 命名。
> 补 surface。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：notification surfaces + useNotification + governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百八十九轮）：§13.2 聚焦证据套件复跑（含 residual 250–288
> dual 锁，含 NotificationClientPort，不改 checkbox）——
> **55 文件 / 169 测试**（app-vue 49、ai 24、repository 35、contracts 10、ipc-client 5、
> http-client 5、governance 2、setting 5、data-portability 5、authentication 13、reminder 2、
> notification 2、dashboard 1、desktop 9、task 2）+ governance-check（GOV_EXIT:0）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百九十轮）：contracts 死 `*Res` identity dual 再清 6 项——
> `BatchUpdate/Move/DeleteGoalsRes`、`SelectLocalVaultRes`、`UnbindOAuthRes`、`LogoutRes`
> （无 protocol/call-site 消费者）。扩展 dead-res surface。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：contracts dead-res surface + governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百九十一轮）：§13.2 聚焦证据套件复跑（含 residual 250–290
> dual 锁，含 NotificationClientPort + dead *Res 扩展，不改 checkbox）——
> **55 文件 / 169 测试**（app-vue 49、ai 24、repository 35、contracts 10、ipc-client 5、
> http-client 5、governance 2、setting 5、data-portability 5、authentication 13、reminder 2、
> notification 2、dashboard 1、desktop 9、task 2）+ governance-check（GOV_EXIT:0）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百九十二轮）：account `AccountClientPort` 有意 mapping dual 锁定——
> API 返回 `AccountClientDTO`，application port 返回 domain `Account`（`mapAccountResult` /
> `accountFromDTO`）；**不**收成 type alias。补 surface。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：account mapping dual surface + governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百九十三轮）：§13.2 聚焦证据套件复跑（含 residual 250–292
> dual 锁，含 AccountClientPort mapping dual，不改 checkbox）——
> **56 文件 / 171 测试**（app-vue 49、ai 24、repository 35、contracts 10、ipc-client 5、
> http-client 5、governance 2、setting 5、data-portability 5、authentication 13、reminder 2、
> notification 2、account 2、dashboard 1、desktop 9、task 2）+ governance-check（GOV_EXIT:0）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百九十四轮）：goal `GoalClientPort` 有意 multi-API mapping facade dual 锁定——
> 聚合 `IGoalApiClient`/`IGoalFolderApiClient`/`IGoalFocusApiClient`，DTO→domain mapper，
> 命名双轨（`getGoal`/`getGoalById`、`createKeyResult`/`addKeyResultForGoal`）；**不**收成
> 单一 type alias。补 surface。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：goal facade dual surface + governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百九十五轮）：§13.2 聚焦证据套件复跑（含 residual 250–294
> dual 锁，含 GoalClientPort facade dual，不改 checkbox）——
> **57 文件 / 173 测试**（app-vue 49、ai 24、repository 35、contracts 10、ipc-client 5、
> http-client 5、governance 2、setting 5、data-portability 5、authentication 13、reminder 2、
> notification 2、account 2、goal 2、dashboard 1、desktop 9、task 2）+ governance-check（GOV_EXIT:0）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百九十六轮）：task `TaskClientPort` 有意 multi-API mapping facade dual 锁定——
> 聚合 template/instance/dependency API clients，DTO→domain mapper，命名双轨
> （`createTemplate`/`createTaskTemplate`、`getTemplate`/`getTaskTemplateById`）；**不**收成
> 单一 type alias。补 surface。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：task facade dual surface + governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百九十七轮）：§13.2 聚焦证据套件复跑（含 residual 250–296
> dual 锁，含 TaskClientPort facade dual，不改 checkbox）——
> **58 文件 / 175 测试**（app-vue 49、ai 24、repository 35、contracts 10、ipc-client 5、
> http-client 5、governance 2、setting 5、data-portability 5、authentication 13、reminder 2、
> notification 2、account 2、goal 2、dashboard 1、desktop 9、task 4）+ governance-check（GOV_EXIT:0）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百九十八轮）：schedule `ScheduleClientPort` 有意 multi-API mapping facade dual 锁定——
> 聚合 event/task API clients，DTO→domain mapper（`scheduleTaskFromDTO`）；**不**收成单一
> type alias。补 surface。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：schedule facade dual surface + governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留二百九十九轮）：ai `AIClientPort` 有意 multi-API thin facade dual 锁定——
> 聚合 capabilities/provider/conversation/message/knowledge/agent 等多 API ports，Result
> pass-through（无 domain FromDTO），但**不等于**任一单一 `I*ApiClient`；**不**收成 type alias。
> 补 surface。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：ai facade dual surface + governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百轮）：§13.2 聚焦证据套件复跑（含 residual 250–299
> dual 锁，含 ScheduleClientPort + AIClientPort facade dual，不改 checkbox）——
> **60 文件 / 179 测试**（app-vue 49、ai 26、repository 35、contracts 10、ipc-client 5、
> http-client 5、governance 2、setting 5、data-portability 5、authentication 13、reminder 2、
> notification 2、account 2、goal 2、schedule 2、dashboard 1、desktop 9、task 4）+
> governance-check（GOV_EXIT:0）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百零一轮）：§13.2 证据指针刷新 + UI redesign 文档与运行时边界对齐——
> 澄清 Brief supersede（`REPOSITORY_SERVICE_KEY` 仍绑定 knowledge `RepositoryClientPort`；
> 旧 CRUD/`RepositoryWorkspaceView`/`/note/:id` 为历史）；Page redesign §9 标历史方案。
> 扩展 legacy-note docs surface。§13.2 **未打勾**三项仍为部分/外部阻塞（三入口跨端 E2E、
> multi-engine Agent、全量 PR 门禁/GitHub fixture）。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百零二轮）：§13.2 聚焦证据套件复跑（含 residual 250–301
> dual/docs 锁，含 redesign supersede surface，不改 checkbox）——
> **60 文件 / 180 测试**（app-vue 50、ai 26、repository 35、contracts 10、ipc-client 5、
> http-client 5、governance 2、setting 5、data-portability 5、authentication 13、reminder 2、
> notification 2、account 2、goal 2、schedule 2、dashboard 1、desktop 9、task 4）+
> governance-check（GOV_EXIT:0）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百零三轮）：portable editor 备份 vs server-held disclosure 边界再锁——
> 扩展 portable-editor-backup surface：无 disclosure IPC channel；Desktop electron 仅 export/import；
> IPC adapter `NOT_SUPPORTED`；HTTP 专用非导入路由；product editor 文档明确 Web 可下 / Desktop 不支持 /
> 不可导入，与 `memoflow.user-data-export` 分离。§13.2 未打勾项仍为部分/外部阻塞。
> 验证：data-portability + setting disclosure surfaces + governance-check。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百零四轮）：§13.2 聚焦证据套件复跑（含 residual 250–303
> dual/docs/disclosure 锁，含 portable-editor-backup + server-held not-importable + Web disclosure UI，
> 不改 checkbox）——
> **63 文件 / 193 测试**（app-vue 53、ai 26、repository 35、contracts 10、ipc-client 5、
> http-client 5、governance 2、setting 5、data-portability 15、authentication 13、reminder 2、
> notification 2、account 2、goal 2、schedule 2、dashboard 1、desktop 9、task 4）+
> governance-check（GOV_EXIT:0）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine E2E、GitHub App fixture E2E、
> 全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百零五轮）：ADR-035 Agent 隔离证据增强（仍不打勾）——
> journey step 16：`engine.langgraph_workflow`/`direct_turn`/`pi|cli_readonly` 永不替代
> `tool.proposal`/`tool.mutation`/surface context；readonly mutation + engine 标签仍 fail-closed；
> 完整 knowledge-write offers 可在 engine 标签下 resolve 但计划仍携带 host mutation offers。
> contracts stage-0 surface：`ITurnEnginePort` 形状冻结、生产侧尚无 multi-engine adapter 实现。
> §13.2 Agent 项仍为 **部分实现**（缺完整 multi-engine Turn Engine conformance E2E）。
> 验证：ai journey 14 + contracts agent-host surface + governance-check。状态保持 **实施中**；
> PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百零六轮）：§13.2 聚焦证据套件复跑（含 residual 250–305
> dual/docs/disclosure/ADR-035 锁，含 journey step 16 + stage-0 ports surface，不改 checkbox）——
> **64 文件 / 197 测试**（app-vue 53、ai 27、repository 35、contracts 13、ipc-client 5、
> http-client 5、governance 2、setting 5、data-portability 15、authentication 13、reminder 2、
> notification 2、account 2、goal 2、schedule 2、dashboard 1、desktop 9、task 4）+
> governance-check（GOV_EXIT:0）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine conformance E2E、
> GitHub App fixture E2E、全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百零七轮）：三入口 §13.2 证据增强（仍不打勾）——
> `three-login-surface.matrix.spec.ts` journey **step 10**：GitHub OAuth identity 永不授予
> knowledge-repo App installation/token。源码锁：`AuthChannels` oauth vs `RepositoryChannels`
> knowledge-connection 命名空间分离；`get-oauth-url` identity-only scopes（`read:user`/`user:email`，
> 无 repo Contents）；HTTP `/oauth/*` vs `/knowledge-connections/*` 路径分离；product
> `authentication.md` 与 AuthPlatformEntry/DesktopAuthView/WebAuthView 入口矩阵对齐。
> **不**伪造 OAuth 凭据或 Playwright/Electron 跨端 E2E。验证：app-vue three-login matrix 15 +
> DesktopAuthView/AuthPlatformEntry + contracts auth-surface + governance-check（GOV_EXIT:0）。
> §13.2 三入口仍为 **部分实现**（缺真实 OAuth 跨端 E2E / GitHub fixture）。状态保持 **实施中**；
> PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百零八轮）：§13.2 聚焦证据套件复跑（含 residual 250–307
> dual/docs/disclosure/ADR-035/three-login step 10 锁，不改 checkbox）——
> **64 文件 / 198 测试**（app-vue 54、ai 27、repository 35、contracts 13、ipc-client 5、
> http-client 5、governance 2、setting 5、data-portability 15、authentication 13、reminder 2、
> notification 2、account 2、goal 2、schedule 2、dashboard 1、desktop 9、task 4）+
> governance-check（GOV_EXIT:0）。相对 residual 306：app-vue +1 test（three-login step 10）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、multi-engine Turn Engine conformance E2E、
> GitHub App fixture E2E、全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百零九轮）：ADR-035 Agent multi-engine 证据增强（仍不打勾）——
> 新增 `adr-035-multi-engine-turn-conformance.harness.spec.ts`：同一 suite 对
> `engine.direct_turn` 与 `engine.langgraph_workflow` 跑相同 isolation 不变量（engine 标签
> 永不替代 tool.proposal/mutation/context；readonly mutation fail-closed；完整 knowledge-write
> offers 保留 engineId；startTurn ownership fail-closed；abort 不授予能力；双引擎 run 状态隔离；
> pi/cli_readonly 同样 fail-closed）。**仅** in-suite `ITurnEnginePort` test doubles，生产侧仍无
> multi-engine adapter（stage-0 freeze 仍有效）。验证：harness 14 + ADR-035 journey + stage-0
> surface + governance-check（GOV_EXIT:0）。§13.2 Agent 仍为 **部分实现**（缺生产 multi-engine
> 接线与完整 runtime E2E）。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百一十轮）：§13.2 聚焦证据套件复跑（含 residual 250–309
> dual/docs/disclosure/ADR-035/three-login step 10/multi-engine harness 锁，不改 checkbox）——
> **65 文件 / 212 测试**（app-vue 54、ai 41、repository 35、contracts 13、ipc-client 5、
> http-client 5、governance 2、setting 5、data-portability 15、authentication 13、reminder 2、
> notification 2、account 2、goal 2、schedule 2、dashboard 1、desktop 9、task 4）+
> governance-check（GOV_EXIT:0）。相对 residual 308：ai +1 file / +14 tests（conformance harness）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、生产 multi-engine Turn Engine 接线 E2E、
> GitHub App fixture E2E、全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百一十一轮）：ADR-035 Agent Host stage-0 组合根再锁（仍不打勾）——
> contracts stage-0 surface：生产侧无 `ITurnEnginePort`/`IWorkflowAdapterPort`/
> `ICapabilityResolverPort`/`IProposalKernelPort` 实现；指向 residual 309 multi-engine harness
> （in-suite doubles only）。ai composition surface：`buildAgentRuntimeCapabilityOffers` 永不
> 静默 emit `engine.*`；`ai.module` 不 import/注册 Turn Engine ports。验证：contracts stage-0 4 +
> ai composition 3 + harness 14 + governance-check（GOV_EXIT:0）。§13.2 Agent 仍为 **部分实现**。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百一十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–311
> dual/docs/disclosure/ADR-035/three-login/harness/composition 锁，不改 checkbox）——
> **66 文件 / 216 测试**（app-vue 54、ai 44、repository 35、contracts 14、ipc-client 5、
> http-client 5、governance 2、setting 5、data-portability 15、authentication 13、reminder 2、
> notification 2、account 2、goal 2、schedule 2、dashboard 1、desktop 9、task 4）+
> governance-check（GOV_EXIT:0）。相对 residual 310：ai +1 file / +3 tests（composition surface）；
> contracts stage-0 +1 test（harness pointer）。仍为部分/外部阻塞：真实 OAuth 跨端 E2E、生产
> multi-engine 接线 E2E、GitHub App fixture E2E、全量 PR 门禁一揽子。状态保持 **实施中**；
> PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百一十三轮）：跨 active plan 对齐——将 vault residual 305/309/311
> 的 ADR-035 stage-0 Port 冻结、multi-engine harness（doubles only）与 composition freeze 证据指针
> 写入 `2026-07-17-unified-assistant-agent-host.md`；该 plan 状态由 **待实施** 调整为 **实施中**
> （仅阶段 0 部分；完成定义不打勾）。验证：governance-check（GOV_EXIT:0）。vault §13.2 未打勾项
> 仍为部分/外部阻塞。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百一十四轮）：ADR-035 首个生产 Turn Engine（仍不打勾 Agent）——
> 新增 `DirectTurnEngine`（`engine.direct_turn`）实现 `ITurnEnginePort`，经 `IAIChatExecutionPort`
> + provider/conversation 解析完成开放式 chat/analysis；ownership fail-closed、abort、无
> waiting_approval/mutation。`createAIModule` 暴露 `turnEngine`；**不**静默 emit `engine.*`
> capability offers；仍无 Workflow/Capability/Proposal 生产实现与第二引擎。验证：direct-turn 7 +
> composition/harness/journey + stage-0 freeze + governance-check（GOV_EXIT:0）。§13.2 Agent 仍为
> **部分实现**。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百一十五轮）：§13.2 聚焦证据套件复跑（含 residual 250–314
> dual/docs/disclosure/ADR-035/three-login/harness/composition/DirectTurnEngine 锁，不改 checkbox）——
> **67 文件 / 223 测试**（app-vue 54、ai 51、repository 35、contracts 14、ipc-client 5、
> http-client 5、governance 2、setting 5、data-portability 15、authentication 13、reminder 2、
> notification 2、account 2、goal 2、schedule 2、dashboard 1、desktop 9、task 4）+
> governance-check（GOV_EXIT:0）。相对 residual 312：ai +1 file / +7 tests（DirectTurnEngine）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、第二生产 Turn Engine / multi-engine 接线 E2E、
> GitHub App fixture E2E、全量 PR 门禁一揽子。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百一十六轮）：开放式 Chat 经 DirectTurnEngine（仍不打勾 Agent）——
> 新增 `IOpenChatTurnPort`；`SendAIMessageUseCase`/`StreamAIMessageUseCase` 改为依赖 open-chat
> turn 而非 raw `IAIChatExecutionPort`；direct/remote runtime 均以同一 `DirectTurnEngine` 实例驱动
> chat + `module.turnEngine`。execution log 记录 `engineId`。验证：chat/application + direct-turn +
> composition + journey/harness + governance-check（GOV_EXIT:0）。§13.2 Agent 仍为 **部分实现**
> （缺第二生产引擎 / 统一助手 UI）。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百一十七轮）：§13.2 聚焦证据套件复跑（含 residual 250–316
> dual/docs/disclosure/ADR-035/three-login/harness/composition/DirectTurnEngine/open-chat 锁，
> 不改 checkbox）——**68 文件 / 226 测试**（app-vue 54、ai 54、repository 35、contracts 14、
> ipc-client 5、http-client 5、governance 2、setting 5、data-portability 15、authentication 13、
> reminder 2、notification 2、account 2、goal 2、schedule 2、dashboard 1、desktop 9、task 4）+
> governance-check（GOV_EXIT:0）。相对 residual 315：ai +1 file / +3 tests（open-chat application）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、第二生产 Turn Engine、GitHub App fixture E2E、全量 PR 门禁。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百一十八轮）：ADR-035 Workflow Adapter 首实现（仍不打勾 Agent）——
> 新增 `LangGraphWorkflowAdapter`（`workflow.langgraph`）实现 `IWorkflowAdapterPort` 并委托
> `IAgentRuntimePort`；`offeredKinds` 仅 workflow/engine 标签，永不含 tool.mutation/proposal；
> remote runtime 在 agentRuntimePort 存在时包装；direct runtime `workflowAdapter: null`；
> `module.workflowAdapter` 暴露。stage-0 freeze 允许 DirectTurnEngine + 本 adapter。验证：
> workflow adapter 4 + composition + stage-0 + journey/harness + governance-check（GOV_EXIT:0）。
> §13.2 Agent 仍为 **部分实现**（第二 Turn Engine / Proposal Kernel / 统一助手 UI 未齐）。状态保持
> **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百一十九轮）：§13.2 聚焦证据套件复跑（含 residual 250–318
> dual/docs/disclosure/ADR-035/three-login/harness/composition/DirectTurnEngine/open-chat/
> LangGraphWorkflowAdapter 锁，不改 checkbox）——**69 文件 / 231 测试**（app-vue 54、ai 58、
> repository 35、contracts 14、ipc-client 5、http-client 5、governance 2、setting 5、
> data-portability 15、authentication 13、reminder 2、notification 2、account 2、goal 2、
> schedule 2、dashboard 1、desktop 9、task 4）+ governance-check（GOV_EXIT:0）。相对 residual 317：
> ai +1 file / +5 tests（workflow adapter）。仍为部分/外部阻塞：真实 OAuth 跨端 E2E、第二生产
> Turn Engine、GitHub App fixture E2E、全量 PR 门禁。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百二十轮）：ADR-035 Proposal Kernel 首实现（仍不打勾 Agent）——
> 新增 `ProposalKernel`（`proposal-kernel`）实现 `IProposalKernelPort`：create/revise/markStale/
> approve/reject/executeApproved 乐观并发与 requestId 幂等；**仅** lifecycle `ExecutionReceipt`，
> 不执行业务 mutation。`toCapabilityOffer` 只发 `tool.proposal`；direct/remote 均构造同一 Host
> kernel；`module.proposalKernel` 暴露。`buildAgentRuntimeCapabilityOffers` providerId 对齐
> `proposal-kernel`。stage-0 freeze 允许 DirectTurnEngine + LangGraphWorkflowAdapter +
> ProposalKernel；**仍禁止** `ICapabilityResolverPort`。验证：proposal.kernel 7 + composition +
> stage-0 + journey/harness + governance-check（GOV_EXIT:0）。§13.2 Agent 仍为 **部分实现**
> （第二 Turn Engine / Capability Resolver / 统一助手 UI / 完整 multi-engine E2E 未齐）。状态保持
> **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百二十一轮）：§13.2 聚焦证据套件复跑（含 residual 250–320
> dual/docs/disclosure/ADR-035/three-login/harness/composition/DirectTurnEngine/open-chat/
> LangGraphWorkflowAdapter/ProposalKernel 锁，不改 checkbox）——**70 文件 / 239 测试**（app-vue 54、
> ai 67、repository 35、contracts 14、ipc-client 5、http-client 5、governance 2、setting 5、
> data-portability 15、authentication 13、reminder 2、notification 2、account 2、goal 2、
> schedule 2、dashboard 1、desktop 9、task 4）+ governance-check（GOV_EXIT:0）。相对 residual 319：
> ai +1 file / +8 tests（ProposalKernel + composition 锁）。仍为部分/外部阻塞：真实 OAuth 跨端 E2E、
> 第二生产 Turn Engine、Capability Resolver、GitHub App fixture E2E、全量 PR 门禁。状态保持
> **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百二十二轮）：ADR-035 Capability Resolver 首实现（仍不打勾 Agent）——
> 新增 `CapabilityResolver`（`capability-resolver`）实现 `ICapabilityResolverPort`：`listOffers` 按 surface
> 过滤；`resolve`/`resolveFor` 经 `resolveRunPlan` fail-closed，**永不**静默 expand `engine.*`。
> direct/remote 均以 `buildAgentRuntimeCapabilityOffers` 构造（remote 另显式并入 workflow adapter offers）；
> `module.capabilityResolver` 暴露。stage-0 freeze 允许 DirectTurn + LangGraph + ProposalKernel +
> CapabilityResolver。验证：capability.resolver 6 + composition + stage-0 + journey/harness +
> typecheck + governance-check（GOV_EXIT:0）。§13.2 Agent 仍为 **部分实现**（第二 Turn Engine /
> 统一助手 UI / multi-engine runtime E2E 未齐）。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百二十三轮）：§13.2 聚焦证据套件复跑（含 residual 250–322
> dual/docs/disclosure/ADR-035/three-login/harness/composition/DirectTurnEngine/open-chat/
> LangGraphWorkflowAdapter/ProposalKernel/CapabilityResolver 锁，不改 checkbox）——**71 文件 /
> 246 测试**（app-vue 54、ai 74、repository 35、contracts 14、ipc-client 5、http-client 5、
> governance 2、setting 5、data-portability 15、authentication 13、reminder 2、notification 2、
> account 2、goal 2、schedule 2、dashboard 1、desktop 9、task 4）+ governance-check（GOV_EXIT:0）。
> 相对 residual 321：ai +1 file / +7 tests（CapabilityResolver）。仍为部分/外部阻塞：真实 OAuth
> 跨端 E2E、第二生产 Turn Engine、统一助手 UI、GitHub App fixture E2E、全量 PR 门禁。状态保持
> **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百二十四轮）：ADR-035 CapabilityResolver 热路径接线（仍不打勾 Agent）——
> `createAgentRuntimeService` 接收共享 `CapabilityResolver`；`startRun` 的 knowledge.generate
> fail-closed 门禁优先 `resolver.resolveFor`（不再仅 rebuild offers）。direct/remote 均在组装
> agent service 前构造同一 resolver 实例并注入。composition surface 锁 residual 324。验证：
> composition + capability.resolver + journey + typecheck + governance-check（GOV_EXIT:0）。
> §13.2 Agent 仍为 **部分实现**。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百二十五轮）：§13.2 聚焦证据套件复跑（含 residual 250–324
> dual/docs/disclosure/ADR-035/three-login/harness/composition/DirectTurnEngine/open-chat/
> LangGraphWorkflowAdapter/ProposalKernel/CapabilityResolver/start-gate 热路径锁，不改 checkbox）——
> **71 文件 / 247 测试**（app-vue 54、ai 75、repository 35、contracts 14、ipc-client 5、http-client 5、
> governance 2、setting 5、data-portability 15、authentication 13、reminder 2、notification 2、
> account 2、goal 2、schedule 2、dashboard 1、desktop 9、task 4）+ governance-check（GOV_EXIT:0）。
> 相对 residual 323：ai +1 test（residual 324 start-gate composition 锁）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、第二生产 Turn Engine、统一助手 UI、GitHub App fixture E2E、全量 PR 门禁。
> 状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百二十六轮）：§13.2 证据指针刷新（仍不打勾）——将 residual
> 305–325 ADR-035 Host 部分落地（DirectTurnEngine / LangGraphWorkflowAdapter /
> ProposalKernel / CapabilityResolver + start-gate 热路径 + multi-engine harness doubles +
> tip 71/247 focused suite）写入 §13.2 Agent 与全量门禁证据段；**不**把 Agent 或全量门禁改标
> 为已证明。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百二十七轮）：产品文档/runtime 边界对齐（仍不打勾）——
> 修正 `docs/product/modules/ai.md`：删除“写数据库 Repository / Host adapters 尚未实现”过时叙述；
> 记录 ADR-035 Host 部分落地（DirectTurn/LangGraph/ProposalKernel/CapabilityResolver + start-gate
> fail-closed）。修正 `docs/product/modules/setting.md`：设置 category 不再列退役 `editor`。
> 新增 `adr-035-product-docs-boundary.surface.spec.ts` + 扩展 retired-editor preference surface。
> 验证：ai product-docs 2 + contracts retired-editor 4 + governance-check。§13.2 未打勾项仍为
> 部分/外部阻塞。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百二十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–327
> dual/docs/disclosure/ADR-035/three-login/harness/composition/Host adapters/start-gate/
> product-docs 边界锁，不改 checkbox）——**73 文件 / 253 测试**（app-vue 54、ai 77、repository 35、
> contracts 18、ipc-client 5、http-client 5、governance 2、setting 5、data-portability 15、
> authentication 13、reminder 2、notification 2、account 2、goal 2、schedule 2、dashboard 1、
> desktop 9、task 4）+ governance-check（GOV_EXIT:0）。相对 residual 325：ai +1 file / +2 tests
> （product-docs boundary）；contracts +1 file / +4 tests（retired-editor product setting 锁）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、第二生产 Turn Engine、统一助手 UI、GitHub App fixture
> E2E、全量 PR 门禁。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百二十九轮）：AI 模块文件索引路径对齐（仍不打勾）——
> `docs/product/module-index/ai-files.md` 将过时 `domain-server`/`application-server`/
> `infrastructure-server`/`controllers` 路径改到当前 `packages/ai/src/server/*`；新增 ADR-035
> Host 生产适配表（DirectTurn/LangGraph/ProposalKernel/CapabilityResolver + journey/product-docs
> 锁）。扩展 `adr-035-product-docs-boundary.surface.spec.ts`。验证：product-docs surface 3 +
> governance-check。§13.2 仍为部分/外部阻塞。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百三十轮）：§13.2 聚焦证据套件复跑（含 residual 250–329
> dual/docs/disclosure/ADR-035/Host adapters/product-docs/ai-files 索引锁，不改 checkbox）——
> **73 文件 / 254 测试**（app-vue 54、ai 78、repository 35、contracts 18、ipc-client 5、
> http-client 5、governance 2、setting 5、data-portability 15、authentication 13、reminder 2、
> notification 2、account 2、goal 2、schedule 2、dashboard 1、desktop 9、task 4）+
> governance-check（GOV_EXIT:0）。相对 residual 328：ai +1 test（product-docs surface 扩至 3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、第二生产 Turn Engine、统一助手 UI、GitHub App fixture
> E2E、全量 PR 门禁。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百三十一轮）：product module-index 路径全量对齐（仍不打勾）——
> 批量修正 `docs/product/module-index/*-files.md` 过时 `domain-server`/`application-server`/
> `infrastructure-server`/`controllers` 路径（141+22 处）到 `packages/*/src/server/*` 与现行 UI/
> e2e 入口；删除 2 条已无文件的 dashboard e2e 行。新增 `product-module-index-paths.surface.spec.ts`
> 锁：索引链接必须落盘且禁止 legacy server 段名。验证：contracts surface 1 + governance-check。
> §13.2 仍为部分/外部阻塞。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百三十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–331
> dual/docs/disclosure/ADR-035/Host/product-docs/module-index integrity 锁，不改 checkbox）——
> **74 文件 / 255 测试**（app-vue 54、ai 78、repository 35、contracts 19、ipc-client 5、
> http-client 5、governance 2、setting 5、data-portability 15、authentication 13、reminder 2、
> notification 2、account 2、goal 2、schedule 2、dashboard 1、desktop 9、task 4）+
> governance-check（GOV_EXIT:0）。相对 residual 330：contracts +1 file / +1 test
> （product-module-index-paths）。仍为部分/外部阻塞：真实 OAuth 跨端 E2E、第二生产 Turn Engine、
> 统一助手 UI、GitHub App fixture E2E、全量 PR 门禁。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百三十三轮）：three-login step 10 product-doc identity≠knowledge-repo
> 显式锁（仍不打勾）——`docs/product/modules/authentication.md` 写明登录 authorize 仅
> identity-only scopes（`read:user` / `user:email`）、永不申请 repo Contents、不签发知识仓库
> GitHub App installation/token；`three-login-surface.matrix.spec.ts` step 10 将上述产品文档
> 不变量与既有源码锁（scopes/IPC/routes）一并锁定。验证：app-vue three-login 15 +
> governance-check。§13.2 仍为部分/外部阻塞（真实 OAuth 跨端 E2E）。状态保持 **实施中**；
> PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百三十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–333
> dual/docs/disclosure/ADR-035/Host/product-docs/module-index/auth identity≠repo 锁，不改
> checkbox）——**74 文件 / 255 测试**（app-vue 54、ai 78、repository 35、contracts 19、
> ipc-client 5、http-client 5、governance 2、setting 5、data-portability 15、authentication 13、
> reminder 2、notification 2、account 2、goal 2、schedule 2、dashboard 1、desktop 9、task 4）+
> governance-check（GOV_EXIT:0）。相对 residual 332：test 计数持平（step 10 断言加厚，无新文件）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、第二生产 Turn Engine、统一助手 UI、GitHub App fixture
> E2E、全量 PR 门禁。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百三十五轮）：authentication module-index OAuth 产品真值收口
> （仍不打勾）——`docs/product/module-index/authentication-files.md` 删除“仅 callback 骨架/
> 仍未接线”过时叙述；补 ADR-034 登录 OAuth 生产路径表（get-oauth-url identity-only scopes、
> GitHub provider/client、WebAuthView、three-login step 10、knowledge-connection 分离）并修正
> AuthPlatformEntry/Desktop 入口说明。`product-module-index-paths.surface.spec.ts` 增 residual
> 335 内容锁。验证：contracts surface 2 + three-login 15 + governance-check。§13.2 仍为部分/
> 外部阻塞。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百三十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–335
> dual/docs/disclosure/ADR-035/Host/product-docs/module-index/auth OAuth 真值锁，不改 checkbox）——
> **74 文件 / 256 测试**（app-vue 54、ai 78、repository 35、contracts 20、ipc-client 5、
> http-client 5、governance 2、setting 5、data-portability 15、authentication 13、reminder 2、
> notification 2、account 2、goal 2、schedule 2、dashboard 1、desktop 9、task 4）+
> governance-check（GOV_EXIT:0）。相对 residual 334：contracts +1 test（authentication-files
> residual 335 内容锁）。仍为部分/外部阻塞：真实 OAuth 跨端 E2E、第二生产 Turn Engine、统一助手
> UI、GitHub App fixture E2E、全量 PR 门禁。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百三十七轮）：ADR-035 生产 CustomModelGateway + 死 editor-test
> 清理（仍不打勾）——contracts 冻结 `IModelGatewayPort`；`CustomModelGateway` 包装
> OpenAICompatible complete/catalog，结果仅回 `modelBindingId`（不回 apiKey）；direct-provider
> chat/goal/knowledge adapters 与 module.modelGateway 接线；composition/stage-0/product-docs
> surface 锁。删除 `apps/web/public/editor-test.html` 退役编辑器试页。验证：ai focused 24 +
> contracts 6 + governance-check。§13.2 Agent 仍为部分（第二 Turn Engine/统一助手/multi-engine
> E2E 未齐）。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百三十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–337
> dual/docs/disclosure/ADR-035/Host/CustomModelGateway 锁，不改 checkbox）——**75 文件 /
> 260 测试**（app-vue 54、ai 82、repository 35、contracts 20、ipc-client 5、http-client 5、
> governance 2、setting 5、data-portability 15、authentication 13、reminder 2、notification 2、
> account 2、goal 2、schedule 2、dashboard 1、desktop 9、task 4）+ governance-check（GOV_EXIT:0）。
> 相对 residual 336：ai +1 file / +4 tests（CustomModelGateway）。仍为部分/外部阻塞：真实 OAuth
> 跨端 E2E、第二生产 Turn Engine、统一助手 UI、GitHub App fixture E2E、全量 PR 门禁。状态保持
> **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百三十九轮）：feature-map 产品真值 + 死 public debug 页清理
> （仍不打勾）——`docs/product/feature-map.md` 认证行去掉“GitHub 服务端骨架已落地”，改为三入口
> 主路径已贯通 + identity-only scopes 与知识仓库 App 分离；AI 行对齐 ADR-035 Host 部分落地。
> 删除 `apps/web/public/{schedule-test,sse-test}.html` 与 `debug-events.js`。新增
> `product-feature-map-public.surface.spec.ts`。验证：contracts surface 5 + governance-check。
> §13.2 仍为部分/外部阻塞。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百四十轮）：§13.2 聚焦证据套件复跑（含 residual 250–339
> dual/docs/disclosure/ADR-035/Host/feature-map/public debug 锁，不改 checkbox）——**76 文件 /
> 263 测试**（app-vue 54、ai 82、repository 35、contracts 23、ipc-client 5、http-client 5、
> governance 2、setting 5、data-portability 15、authentication 13、reminder 2、notification 2、
> account 2、goal 2、schedule 2、dashboard 1、desktop 9、task 4）+ governance-check（GOV_EXIT:0）。
> 相对 residual 338：contracts +1 file / +3 tests（feature-map/public surface）。仍为部分/外部
> 阻塞：真实 OAuth 跨端 E2E、第二生产 Turn Engine、统一助手 UI、GitHub App fixture E2E、全量
> PR 门禁。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百四十一轮）：第二生产 Turn Engine（仍不打勾）——生产
> `ReadonlyAnalysisTurnEngine`（`engine.pi_readonly`）经共享 `CustomModelGateway` 只读分析；
> `module.readonlyTurnEngine` 接线；open chat 仍仅 DirectTurnEngine。更新 stage-0/composition/
> harness/product-docs。真实 Pi SDK/CLI 进程 adapter 与完整 multi-engine runtime E2E 仍缺。
> 验证：ai focused 38 + contracts 7 + governance-check。§13.2 Agent 仍为部分。状态保持
> **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百四十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–341
> dual/docs/disclosure/ADR-035/Host/ReadonlyAnalysisTurnEngine 锁，不改 checkbox）——**77 文件 /
> 268 测试**（app-vue 54、ai 87、repository 35、contracts 23、ipc-client 5、http-client 5、
> governance 2、setting 5、data-portability 15、authentication 13、reminder 2、notification 2、
> account 2、goal 2、schedule 2、dashboard 1、desktop 9、task 4）+ governance-check（GOV_EXIT:0）。
> 相对 residual 340：ai +1 file / +5 tests（ReadonlyAnalysisTurnEngine）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整 multi-engine runtime E2E、统一助手 UI、真实 Pi SDK/CLI、GitHub App
> fixture E2E、全量 PR 门禁。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百四十三轮）：生产 AssistantFacade（仍不打勾）——实现
> `IAssistantFacadePort.dispatch`：message 默认 DirectTurnEngine open chat，`pi_readonly` 走
> ReadonlyAnalysisTurnEngine；approve/reject 仅 ProposalKernel 生命周期（永不 `executeApproved`）；
> cancel 中止 primary + readonly + openChat。`module.assistantFacade` 接线；更新 stage-0/
> composition/product-docs。统一助手 UI 工作台与完整 multi-engine runtime E2E 仍缺。验证：
> ai focused facade/composition/product-docs + contracts stage-0 + governance-check。§13.2 Agent
> 仍为部分。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百四十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–343
> dual/docs/disclosure/ADR-035/Host/AssistantFacade 锁，不改 checkbox）——**78 文件 /
> 273 测试**（app-vue 54、ai 92、repository 35、contracts 23、ipc-client 5、http-client 5、
> governance 2、setting 5、data-portability 15、authentication 13、reminder 2、notification 2、
> account 2、goal 2、schedule 2、dashboard 1、desktop 9、task 4）+ governance-check（GOV_EXIT:0）。
> 相对 residual 342：ai +1 file / +5 tests（AssistantFacade）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整 multi-engine runtime E2E、统一助手 UI 工作台、真实 Pi SDK/CLI、
> GitHub App fixture E2E、全量 PR 门禁。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百四十五轮）：AssistantFacade 传输面（仍不打勾）——
> `AIApplicationPort.dispatchAssistant` + `AIAssistantFacadeController` + HTTP
> `POST /api/v1/ai/assistant/dispatch/sse`；`identityId` 仅 auth ExecutionContext；
> approve 仍不 `executeApproved`。统一助手 UI 工作台未切换。验证：controller/composition/
> transport/product-docs focused + governance-check。§13.2 Agent 仍为部分。状态保持
> **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百四十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–345
> dual/docs/disclosure/ADR-035/Host/AssistantFacade transport 锁，不改 checkbox）——**79 文件 /
> 277 测试**（app-vue 54、ai 96、repository 35、contracts 23、ipc-client 5、http-client 5、
> governance 2、setting 5、data-portability 15、authentication 13、reminder 2、notification 2、
> account 2、goal 2、schedule 2、dashboard 1、desktop 9、task 4）+ governance-check（GOV_EXIT:0）。
> 相对 residual 344：ai +1 file / +4 tests（AssistantFacade controller）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整 multi-engine runtime E2E、统一助手 UI 工作台、真实 Pi SDK/CLI、
> GitHub App fixture E2E、全量 PR 门禁。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百四十七轮）：AssistantFacade 客户端面（仍不打勾）——
> `AIClientPort.dispatchAssistant` + Web `AIAssistantHttpAdapter`（`/ai/assistant/dispatch/sse`）；
> Desktop IPC fail-closed `NOT_SUPPORTED`；body 永不带 `identityId`；contracts
> `AssistantClientCommand`。统一助手 UI 工作台仍未切换。验证：http/ipc adapter + dual +
> stage-0 + product-docs + module-index + governance-check。§13.2 Agent 仍为部分。状态保持
> **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百四十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–347
> dual/docs/disclosure/ADR-035/Host/AssistantFacade client 锁，不改 checkbox）——**81 文件 /
> 281 测试**（app-vue 54、ai 100、repository 35、contracts 23、ipc-client 5、http-client 5、
> governance 2、setting 5、data-portability 15、authentication 13、reminder 2、notification 2、
> account 2、goal 2、schedule 2、dashboard 1、desktop 9、task 4）+ governance-check（GOV_EXIT:0）。
> 相对 residual 346：ai +2 files / +4 tests（HTTP+IPC assistant adapters）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整 multi-engine runtime E2E、统一助手 UI 工作台、Desktop IPC stream、
> 真实 Pi SDK/CLI、GitHub App fixture E2E、全量 PR 门禁。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百四十九轮）：Vue AssistantFacade 薄入口（仍不打勾）——
> `useAssistantDispatch`（message/approve/reject/cancel）经 `dispatchAssistant`；body 永不带
> `identityId`；open chat 默认路径仍为既有 chat session。验证：app-vue composable/surface +
> product-docs + module-index + governance-check。§13.2 Agent 仍为部分。状态保持 **实施中**；
> PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百五十轮）：§13.2 聚焦证据套件复跑（含 residual 250–349
> dual/docs/disclosure/ADR-035/Host/useAssistantDispatch 锁，不改 checkbox）——**83 文件 /
> 284 测试**（app-vue 57、ai 100、repository 35、contracts 23、ipc-client 5、http-client 5、
> governance 2、setting 5、data-portability 15、authentication 13、reminder 2、notification 2、
> account 2、goal 2、schedule 2、dashboard 1、desktop 9、task 4）+ governance-check（GOV_EXIT:0）。
> 相对 residual 348：app-vue +2 files / +3 tests（useAssistantDispatch）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整 multi-engine runtime E2E、统一助手 UI 工作台切换、Desktop IPC stream、
> 真实 Pi SDK/CLI、GitHub App fixture E2E、全量 PR 门禁。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百五十一轮）：open chat 默认 Host 路径（仍不打勾）——
> `useAIChatSession.handleSendChat` 经 `dispatchAssistant`/`AssistantFacade`；live `message.delta`；
> model selection 透传；Facade 完成事件可回写 message id。仍无完整右侧工作台/Proposal UI。验证：
> facade/controller/session surface + AIChatView + product-docs + governance-check。§13.2 Agent
> 仍为部分。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百五十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–351
> dual/docs/disclosure/ADR-035/Host/open-chat dispatch 锁，不改 checkbox）——**84 文件 /
> 285 测试**（app-vue 58、ai 100、repository 35、contracts 23、ipc-client 5、http-client 5、
> governance 2、setting 5、data-portability 15、authentication 13、reminder 2、notification 2、
> account 2、goal 2、schedule 2、dashboard 1、desktop 9、task 4）+ governance-check（GOV_EXIT:0）。
> 相对 residual 350：app-vue +1 file / +1 test（host-dispatch surface）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整 multi-engine runtime E2E、统一助手右侧工作台/Proposal UI、Desktop
> IPC stream、真实 Pi SDK/CLI、GitHub App fixture E2E、全量 PR 门禁。状态保持 **实施中**；
> PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百五十三轮）：Desktop AssistantFacade IPC stream（仍不打勾）——
> contracts `ASSISTANT_DISPATCH_*` 通道；electron 主进程经 `api.dispatchAssistant` 推送 event/done/
> error；`AIAssistantIpcAdapter` 实现 stream（无 bridge 仍 NOT_SUPPORTED）。open chat Desktop 可走
> Host 路径。仍无完整右侧工作台/Proposal UI/Pi·CLI。验证：channels/ipc/electron/product-docs +
> governance-check。§13.2 Agent 仍为部分。状态保持 **实施中**；PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百五十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–353
> dual/docs/disclosure/ADR-035/Host/Desktop Assistant IPC 锁，不改 checkbox）——**86 文件 /
> 290 测试**（app-vue 58、ai 103、repository 35、contracts 25、ipc-client 5、http-client 5、
> governance 2、setting 5、data-portability 15、authentication 13、reminder 2、notification 2、
> account 2、goal 2、schedule 2、dashboard 1、desktop 9、task 4）+ governance-check（GOV_EXIT:0）。
> 相对 residual 352：ai +1 file / +3 tests、contracts +1 file / +2 tests（Desktop Assistant IPC）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整 multi-engine runtime E2E、统一助手右侧工作台/
> Proposal UI、真实 Pi SDK/CLI、GitHub App fixture E2E、全量 PR 门禁。状态保持 **实施中**；
> PR readiness 仍为 no。

> 续进展 2026-07-22（阶段 6 残留三百五十五轮）：Host Proposal approve/reject UI 路径（仍不打勾）——
> 新增 agent-run Host bridge（`agent-run:{runId}:{kind}`）与 `dispatchHostProposalDecision`；
> goal confirm/cancel 与 knowledge note 确认先经 `AssistantFacade`/`ProposalKernel` 生命周期
> （`approve_proposal`/`reject_proposal`），再由 `resumeAgentRun` 作为独立 mutation executor；
> Facade 首次 approve/reject 时 materialize ready bridge proposal；**永不** `executeApproved`。
> 验证：proposal-bridge 3 + hostProposalLifecycle 2 + surface 1 + facade bridge 2 + AIChatView 29。
> 仍无完整右侧工作台/真实 multi-engine E2E/Pi·CLI。状态保持 **实施中**；不改 §13.2 checkbox。
>
> 续进展 2026-07-22（阶段 6 残留三百五十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–355
> Host proposal UI 锁，不改 checkbox）——**89 文件 / 298 测试**（app-vue 21/61、ai 23/105、
> repository 6/35、contracts 11/28、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 354：app-vue +2 files / +3 tests（Host proposal lifecycle）；ai +0 file / +2 tests
> （facade bridge）；contracts +1 file / +3 tests（proposal-bridge）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整 multi-engine runtime E2E、统一助手右侧工作台/Pi·CLI、
> GitHub App fixture E2E、全量 PR 门禁。状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留三百五十七轮）：薄 Host Proposal 工作台面板（仍不打勾）——
> `buildPendingHostProposalItems` 仅从 `waiting_approval` goal/knowledge AgentRun 派生 bridge 提案；
> `AIHostProposalPanel` 挂在 AI 上下文栏，approve/reject 复用 Host lifecycle handlers；
> `waiting_execution` 排除以免 continue/retry 重走 approve；knowledge 增加 Host reject + resume cancel。
> 面板永不 Host mutation execution。验证：hostProposalLifecycle + surface + AIChatView 29。
> 仍无完整右侧工作台切换/真实 multi-engine E2E/Pi·CLI。状态保持 **实施中**；不改 checkbox。
>
> 续进展 2026-07-22（阶段 6 残留三百五十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–357
> Host proposal panel 锁，不改 checkbox）——**89 文件 / 301 测试**（app-vue 21/64、ai 23/105、
> repository 6/35、contracts 11/28、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 356：app-vue +0 file / +3 tests（panel builder + surface）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整 multi-engine runtime E2E、统一助手完整右侧工作台/Pi·CLI、
> GitHub App fixture E2E、全量 PR 门禁。状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留三百五十九轮）：Host Proposal revise-before-approve（仍不打勾）——
> 新增 `revise_proposal` AssistantCommand/Event；Facade + ProposalKernel 乐观并发合并 patch；
> Host 面板可编辑标题、保存修订，approve 前自动 revise；revision 记忆对齐 action-bar。
> 仍仅 lifecycle，永不 Host mutation execution。验证：bridge/kernel/facade/controller +
> hostProposalLifecycle + surface + AIChatView。仍无完整右侧工作台切换/multi-engine E2E/Pi·CLI。
> 状态保持 **实施中**；不改 §13.2 checkbox。
>
> 续进展 2026-07-22（阶段 6 残留三百六十轮）：§13.2 聚焦证据套件复跑（含 residual 250–359
> Host proposal revise 锁，不改 checkbox）——**89 文件 / 306 测试**（app-vue 21/65、ai 23/108、
> repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 358：app-vue +1 test、ai +3 tests、contracts +1 test。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整 multi-engine runtime E2E、统一助手完整右侧工作台/Pi·CLI、
> GitHub App fixture E2E、全量 PR 门禁。状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留三百六十一轮）：knowledge Host Proposal 路径/正文修订（仍不打勾）——
> `buildPendingHostProposalItems` 从 knowledge draft 派生 `targetPath`/`contentMarkdown`；
> 面板为 knowledge.write 提供路径与 Markdown 编辑；`buildHostProposalPatchFromDraft` 按 kind 生成
> revise patch；approve 前可 auto-revise。仍仅 Host lifecycle。验证：hostProposalLifecycle +
> surface + AIChatView。仍无完整右侧工作台切换/multi-engine E2E/Pi·CLI。状态保持 **实施中**；
> 不改 §13.2 checkbox。
>
> 续进展 2026-07-22（阶段 6 残留三百六十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–361
> knowledge Host patch 锁，不改 checkbox）——**89 文件 / 307 测试**（app-vue 21/66、ai 23/108、
> repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 360：app-vue +1 test（knowledge patch dirty）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整 multi-engine runtime E2E、统一助手完整右侧工作台/Pi·CLI、
> GitHub App fixture E2E、全量 PR 门禁。状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留三百六十三轮）：Host knowledge patch → note executor（仍不打勾）——
> `applyHostKnowledgePatchToAgentActions` 将 Host 修订的 `targetPath`/`contentMarkdown` 映射到
> `create_knowledge_note` approvedActions；`createKnowledgeNoteFromConversation` 在 confirm resume
> 前应用 patch；面板 approve 透传路径/正文。Host lifecycle 与 mutation executor 仍分离。
> 验证：hostProposalLifecycle + surface + AIChatView。仍无完整右侧工作台切换/multi-engine E2E/
> Pi·CLI。状态保持 **实施中**；不改 §13.2 checkbox。
>
> 续进展 2026-07-22（阶段 6 残留三百六十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–363
> Host knowledge executor patch 锁，不改 checkbox）——**89 文件 / 308 测试**（app-vue 21/67、
> ai 23/108、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 362：app-vue +1 test（executor patch mapper）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整 multi-engine runtime E2E、统一助手完整右侧工作台/Pi·CLI、
> GitHub App fixture E2E、全量 PR 门禁。状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留三百六十五轮）：Host goal title patch → create_goal executor（仍不打勾）——
> `applyHostGoalPatchToAgentActions` 将 Host 修订的 `title`/`description` 映射到
> `create_goal` approvedActions；`confirmGoalAgentRun`/`buildGoalAgentApprovalPayload` 在 confirm resume
> 前应用 patch；面板 goal approve 透传标题/描述；goal_draft artifacts 与 create_goal payload 对齐。
> Host lifecycle 与 mutation executor 仍分离。验证：hostProposalLifecycle + surface + AIChatView。
> 仍无完整右侧工作台切换/multi-engine E2E/Pi·CLI。状态保持 **实施中**；不改 §13.2 checkbox。
>
> 续进展 2026-07-22（阶段 6 残留三百六十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–365
> Host goal executor patch 锁，不改 checkbox）——**89 文件 / 310 测试**（app-vue 21/69、
> ai 23/108、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 364：app-vue +2 tests（goal executor patch mapper）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整 multi-engine runtime E2E、统一助手完整右侧工作台/Pi·CLI、
> GitHub App fixture E2E、全量 PR 门禁。状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留三百六十七轮）：goal Host Proposal 描述修订 UI（仍不打勾）——
> 面板为 `goal.create` 增加 description 编辑；`goalDraftDescription` 从 artifact/payload 派生；
> dirty 检测覆盖 title+description；revise/approve 经 Host lifecycle 透传 description 到 residual 365
> create_goal executor patch。仍无完整右侧工作台切换/multi-engine E2E/Pi·CLI。
> 状态保持 **实施中**；不改 §13.2 checkbox。
>
> 续进展 2026-07-22（阶段 6 残留三百六十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–367
> goal Host description 锁，不改 checkbox）——**89 文件 / 311 测试**（app-vue 21/70、
> ai 23/108、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 366：app-vue +1 test（goal description dirty）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整 multi-engine runtime E2E、统一助手完整右侧工作台/Pi·CLI、
> GitHub App fixture E2E、全量 PR 门禁。状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留三百六十九轮）：open-chat Host 引擎 profile 选择（仍不打勾）——
> 会话层 `executionProfileId`（`direct_turn` | `pi_readonly`）经 `handleSendChat` →
> `dispatchAssistant` 传给 Facade；composer 增加 Host 引擎选择器，默认 DirectTurn，可选
> ReadonlyAnalysis。多引擎 Host 产品面加深，仍无真实 Pi SDK/CLI 进程适配与完整 runtime E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。
>
> 续进展 2026-07-22（阶段 6 残留三百七十轮）：§13.2 聚焦证据套件复跑（含 residual 250–369
> Host engine profile 锁，不改 checkbox）——**89 文件 / 312 测试**（app-vue 21/71、
> ai 23/108、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 368：app-vue +1 test（profile surface）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整 multi-engine runtime E2E、统一助手完整右侧工作台/Pi·CLI、
> GitHub App fixture E2E、全量 PR 门禁。状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留三百七十一轮）：Host Proposal 右侧工作台激活（仍不打勾）——
> `hasPendingHostProposals` 纳入 `hasWorkflowContext`；waiting_approval 时自动打开
> AIContextPanel 右栏；header 显示 Host 提案工作台标题与待审批计数。Host 审批面成为
> 结构化工作台内容，仍非完整统一助手右侧工作台切换（Artifact/执行报告全量）。
> 状态保持 **实施中**；不改 §13.2 checkbox。
>
> 续进展 2026-07-22（阶段 6 残留三百七十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–371
> Host workbench activation 锁，不改 checkbox）——**89 文件 / 312 测试**（app-vue 21/71、
> ai 23/108、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 370：surface 锁加深（无新增 test case）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整 multi-engine runtime E2E、统一助手完整右侧工作台/Pi·CLI、
> GitHub App fixture E2E、全量 PR 门禁。状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留三百七十三轮）：Pi/CLI process adapter fail-closed spike（仍不打勾）——
> 新增 `IExternalProcessTurnAdapterPort` + `PiReadonlyProcessAdapter`：probe-only 二进制检查、
> env 密钥清洗、禁止 vault cwd、**永不 spawn**、`productDefault:false`、不接入 Facade/module
> 生产 Turn Engine。真实 Pi SDK/CLI 进程与 multi-engine runtime E2E 仍开。
> 状态保持 **实施中**；不改 §13.2 checkbox。
>
> 续进展 2026-07-22（阶段 6 残留三百七十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–373
> Pi process adapter spike 锁，不改 checkbox）——**91 文件 / 322 测试**（app-vue 21/71、
> ai 25/118、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 372：ai +2 files / +10 tests（process adapter unit+surface）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整 multi-engine runtime E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁。状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留三百七十五轮）：生产 multi-engine Host journey（仍不打勾）——
> 同 fixture 经 `AssistantFacade` 路由生产 `DirectTurnEngine`（open chat）与
> `ReadonlyAnalysisTurnEngine`（pi_readonly）；校验 profile 隔离、双引擎 cancel、
> proposal 生命周期不调用 `executeApproved`、process spike 不进产品路径。
> 仍非跨端 Playwright/Electron 全量 multi-engine E2E / 真实 Pi spawn。
> 状态保持 **实施中**；不改 §13.2 checkbox。
>
> 续进展 2026-07-22（阶段 6 残留三百七十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–375
> production multi-engine Host journey 锁，不改 checkbox）——**92 文件 / 327 测试**（app-vue 21/71、
> ai 26/123、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 374：ai +1 file / +5 tests（production multi-engine journey）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁。状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留三百七十七轮）：multi-profile Host transport journey（仍不打勾）——
> `executionProfileId: pi_readonly` 经 Facade controller + HTTP SSE + Desktop IPC 全路径转发；
> 仅 context identity 注入、客户端 body 永不带 `identityId`；未知 profile fail-closed
> （`VALIDATION_ERROR`，不调用 facade）。仍非跨端 Playwright/Electron 全量 multi-engine E2E /
> 真实 Pi spawn。状态保持 **实施中**；不改 §13.2 checkbox。
>
> 续进展 2026-07-22（阶段 6 残留三百七十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–377
> multi-profile Host transport 锁，不改 checkbox）——**92 文件 / 331 测试**（app-vue 21/71、
> ai 26/127、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 376：ai +0 file / +4 tests（controller +2、http +1、ipc +1）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> Host Artifact/execution-report 完整工作台、GitHub App fixture E2E、全量 PR 门禁。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留三百七十九轮）：Host 执行报告工作台（仍不打勾）——
> 从 completed/failed/cancelled Goal/Knowledge AgentRun 派生 Host 形 execution receipt 行；
> 右侧工作台挂载 `AIHostExecutionReceiptPanel`，header 计数与 auto-open；
> 仅展示，不走 Host kernel mutation 执行。仍非跨端 Playwright/Electron 全量 multi-engine E2E /
> 真实 Pi spawn / Conversation 时间线回放完整 Artifact。
> 状态保持 **实施中**；不改 §13.2 checkbox。
>
> 续进展 2026-07-22（阶段 6 残留三百八十轮）：§13.2 聚焦证据套件复跑（含 residual 250–379
> Host execution receipt 锁，不改 checkbox）——**92 文件 / 335 测试**（app-vue 21/75、
> ai 26/127、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 378：app-vue +0 file / +4 tests（receipt unit +3、surface +1）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> Conversation 时间线 Artifact 回放深度、GitHub App fixture E2E、全量 PR 门禁。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留三百八十一轮）：Host 工作台从 AgentRun 历史重开（仍不打勾）——
> Conversation 侧栏选择 goal/knowledge AgentRun 后，按 restored snapshot 判定
> proposal / receipt 并 `contextPanelOpen`；`selectAgentRun` 返回快照给纯函数决策。
> 仍非消息时间线内嵌 Artifact 卡片、真实 Pi spawn 或跨端 multi-engine E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。
>
> 续进展 2026-07-22（阶段 6 残留三百八十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–381
> Host workbench reopen 锁，不改 checkbox）——**92 文件 / 339 测试**（app-vue 21/79、
> ai 26/127、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 380：app-vue +0 file / +4 tests（reopen unit +3、surface +1）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> 消息时间线 Artifact 回放深度、GitHub App fixture E2E、全量 PR 门禁。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留三百八十三轮）：Host 时间线 Artifact 卡片（仍不打勾）——
> Conversation 消息区 workflow surface 挂载 `AIHostTimelineArtifactStrip`，
> 展示 Host proposal/receipt 紧凑卡片，点击重开右侧工作台；纯展示。
> 仍非完整 Artifact 富编辑/真实 Pi spawn/跨端 multi-engine E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。
>
> 续进展 2026-07-22（阶段 6 残留三百八十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–383
> Host timeline Artifact 锁，不改 checkbox）——**92 文件 / 342 测试**（app-vue 21/82、
> ai 26/127、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 382：app-vue +0 file / +3 tests（timeline unit +2、surface +1）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> Artifact 富内容编辑回放、GitHub App fixture E2E、全量 PR 门禁。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留三百八十五轮）：Host 执行报告富回放（仍不打勾）——
> receipt 增加 description/path/body preview、actionLines、primaryEntityId 深链
> （目标 /goals/:id、知识 openRecentKnowledgeNote）；纯展示审计回放。
> 仍非真实 Pi spawn / 跨端 multi-engine E2E / 完整 Artifact 编辑器。
> 状态保持 **实施中**；不改 §13.2 checkbox。
>
> 续进展 2026-07-22（阶段 6 残留三百八十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–385
> Host receipt rich replay 锁，不改 checkbox）——**92 文件 / 345 测试**（app-vue 21/85、
> ai 26/127、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 384：app-vue +0 file / +3 tests（rich replay unit +2、surface +1）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留三百八十七轮）：Host 时间线聚焦工作台行（仍不打勾）——
> timeline Artifact 卡点击后 resolve focus target，右侧 proposal/receipt 行
> ring highlight + scrollIntoView；行消失时清除 focus。
> 仍非真实 Pi spawn / 跨端 multi-engine E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。
>
> 续进展 2026-07-22（阶段 6 残留三百八十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–387
> Host timeline focus 锁，不改 checkbox）——**92 文件 / 348 测试**（app-vue 21/88、
> ai 26/127、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 386：app-vue +0 file / +3 tests（focus unit +2、surface +1）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留三百八十九轮）：Host 工作台文档对齐 + composition journey（仍不打勾）——
> product `ai.md` / `ai-files` / ADR-035 active plan 与 residual 355–387 Host Proposal/
> receipt/timeline/focus 对齐；补 Host 纯函数 composition journey 与 docs surface 锁。
> 仍非真实 Pi spawn / 跨端 multi-engine E2E。状态保持 **实施中**；不改 §13.2 checkbox。
>
> 续进展 2026-07-22（阶段 6 残留三百九十轮）：§13.2 聚焦证据套件复跑（含 residual 250–389
> Host workbench docs/composition 锁，不改 checkbox）——**92 文件 / 351 测试**（app-vue 21/90、
> ai 26/128、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 388：app-vue +0 file / +2 tests、ai +0 file / +1 test。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留三百九十一轮）：Pi process spike dry-run plan + 产品路由隔离（仍不打勾）——
> `PiReadonlyProcessAdapter.buildDryRunSpawnPlan` 产出 argv/scrubbed env/非 vault cwd，
> `spawnAllowed:false` 且 `startTurn` 仍 `PI_SPIKE_SPAWN_BLOCKED`；surface 锁生产 Facade/
> controller/HTTP/IPC 永不路由 `process.pi_readonly_spike`。仍非真实 Pi spawn 产品路径。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留三百九十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–391
> Pi process dry-run plan 锁，不改 checkbox）——**92 文件 / 353 测试**（app-vue 21/90、
> ai 26/130、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 390：ai +0 file / +2 tests（dry-run unit +1、transport surface +1）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留三百九十三轮）：Host open-chat stop → cancel_run（仍不打勾）——
> open chat 发送前分配 client-owned `runId`；`stopGenerating` 在 abort 客户端流的同时
> 经 `dispatchAssistant({ type:'cancel_run' })` 中止 DirectTurn/ReadonlyAnalysis；
> 纯函数 helper 保证无 identity 走私。仍非跨端 Playwright/Electron multi-engine E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留三百九十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–393
> Host open-chat cancel_run 锁，不改 checkbox）——**93 文件 / 357 测试**（app-vue 22/94、
> ai 26/130、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 392：app-vue +1 file / +4 tests（cancel helper unit +3、surface +1）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留三百九十五轮）：Host mid-turn cancel_run 生产 journey（仍不打勾）——
> 同 fixture 经 `AssistantFacade`：in-flight DirectTurn stream 与 ReadonlyAnalysis gateway
> complete 在 client-owned `runId` 上 `cancel_run` 后均 `message.completed.status=aborted`，
> 并 emit `run.cancelled`；凭证不进事件。仍非跨端 Playwright/Electron multi-engine E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留三百九十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–395
> Host mid-turn cancel_run 锁，不改 checkbox）——**93 文件 / 358 测试**（app-vue 22/94、
> ai 26/131、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 394：ai +0 file / +1 test（mid-turn cancel journey）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留三百九十七轮）：Host Proposal 自由拒绝原因（仍不打勾）——
> `AIHostProposalPanel` 可选 reject reason 文本；`normalizeHostProposalRejectReason` 清洗/
> 截断并 fallback `user_cancel`；`handleHostProposalReject` 经 lifecycle 传给
> `reject_proposal`（仍无 mutation executor）。仍非跨端 multi-engine E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留三百九十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–397
> Host freeform reject reason 锁，不改 checkbox）——**93 文件 / 361 测试**（app-vue 22/97、
> ai 26/131、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 396：app-vue +0 file / +3 tests（reject reason unit +2、surface +1）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留三百九十九轮）：Host 时间线 multi-engine badge（仍不打勾）——
> `resolveHostTimelineEngineKey` 区分 AgentRun 车道与 open-chat Turn Engine profile；
> timeline Artifact 卡片展示 engine badge（presentation only）。仍非跨端 multi-engine E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百轮）：§13.2 聚焦证据套件复跑（含 residual 250–399
> Host timeline multi-engine badge 锁，不改 checkbox）——**93 文件 / 365 测试**（app-vue 22/101、
> ai 26/131、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 398：app-vue +0 file / +4 tests（engine key unit +3、surface +1）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百零一轮）：open-chat Host 时间线 Artifact（仍不打勾）——
> session 追踪 openChatHostTurns；`buildHostOpenChatTimelineArtifactItems` 产出
> surface=open_chat 卡片，engine badge 反映 live executionProfileId（DirectTurn/
> ReadonlyAnalysis）；不聚焦 proposal/receipt 工作台。仍非跨端 multi-engine E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百零二轮）：§13.2 聚焦证据套件复跑（含 residual 250–401
> open-chat Host timeline Artifact 锁，不改 checkbox）——**93 文件 / 368 测试**（app-vue 22/104、
> ai 26/131、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 400：app-vue +0 file / +3 tests（open-chat unit +2、surface +1）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百零三轮）：open-chat Host 回合徽章会话记忆（仍不打勾）——
> per-conversation in-memory map 在切换/新建会话时 stash/restore multi-engine
> open-chat timeline badges；删除会话 forget；不写浏览器存储。仍非跨端 multi-engine E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百零四轮）：§13.2 聚焦证据套件复跑（含 residual 250–403
> open-chat Host turn session memory 锁，不改 checkbox）——**94 文件 / 372 测试**（app-vue 23/108、
> ai 26/131、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 402：app-vue +1 file / +4 tests（turn memory unit +3、surface +1）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百零五轮）：跨端 multi-engine Host 产品 E2E **scaffold**（仍不打勾）——
> 冻结 Web HTTP SSE + Desktop IPC + Vue selectors 的 13 步产品 journey（10 `implemented_unit` +
> 3 `external_blocked`：Playwright web / Electron desktop / real Pi spawn）；surface 锁
> `executionProfileId` 多引擎、`cancel_run`、open-chat badges/session memory，并排除
> `process.pi_readonly_spike`。**不**宣称 Playwright/Electron 全量 product E2E 或真实 Pi spawn。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百零六轮）：§13.2 聚焦证据套件复跑（含 residual 250–405
> 跨端 multi-engine product E2E scaffold 锁，不改 checkbox）——**95 文件 / 378 测试**（app-vue 23/108、
> ai 27/137、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 404：ai +1 file / +6 tests（cross-end product E2E scaffold）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百零七轮）：跨端 multi-engine Host 产品 **unit driver**（仍不打勾）——
> 消费 residual 405 scaffold journey，对 10 个 `implemented_unit` 步做源码契约校验（HTTP SSE /
> Desktop IPC / Vue selectors / cancel_run / session memory），3 个 `external_blocked` 显式 skip；
> `claimsFullProductE2E`/`claimsRealPiSpawn` 恒为 false。**不**宣称 Playwright/Electron 全量 product E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百零八轮）：§13.2 聚焦证据套件复跑（含 residual 250–407
> 跨端 multi-engine product unit driver 锁，不改 checkbox）——**96 文件 / 383 测试**（app-vue 23/108、
> ai 28/142、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 406：ai +1 file / +5 tests（cross-end product unit driver）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百零九轮）：Host 时间线 open_chat vs AgentRun **surface isolation**
> （仍不打勾）——`partitionHostTimelineArtifactsBySurface` + fail-closed
> `collectHostTimelineSurfaceIsolationViolations`；open_chat 不得走私 agent_run engine，
> proposal/receipt 不得走私 open_chat.turn / turn-engine badge。产品文档对齐 residual 393–407/409。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百一十轮）：§13.2 聚焦证据套件复跑（含 residual 250–409
> Host timeline surface isolation 锁，不改 checkbox）——**96 文件 / 387 测试**（app-vue 23/112、
> ai 28/142、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 408：app-vue +0 file / +4 tests（surface isolation unit）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百一十一轮）：Host 工作台时间线 **composition**（仍不打勾）——
> `composeHostWorkbenchTimelineArtifacts` 统一装配 open-chat + AgentRun proposal/receipt，
> 分区 + fail-closed isolation 审计，`AIChatView` 实时路径改走 composition（不再 ad-hoc 拼接 builders）。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百一十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–411
> Host workbench timeline composition 锁，不改 checkbox）——**96 文件 / 390 测试**（app-vue 23/115、
> ai 28/142、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 410：app-vue +0 file / +3 tests（composition unit +2、surface +1）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百一十三轮）：Host 工作台 **LangGraph UI 泄漏边界**（仍不打勾）——
> product event allowlist（run/message/proposal）vs node/checkpoint vendor diagnostic 分类；
> Host Proposal/receipt/timeline/open-chat 源码面 fail-closed 审计；Goal workflow 面板
> node.* 仍为 residual diagnostic 泄漏（非 Host 契约）。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百一十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–413
> Host LangGraph UI leakage boundary 锁，不改 checkbox）——**98 文件 / 397 测试**（app-vue 25/122、
> ai 28/142、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 412：app-vue +2 files / +7 tests（LangGraph boundary unit + surface）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百一十五轮）：Goal/Knowledge workflow **诊断事件展示脱敏**（仍不打勾）——
> `formatLangGraphVendorDiagnosticEventLabel` 将 node.*/tool.* 映射为 workflow step / tool 诊断文案；
> `AIGoalWorkflowPanel` 不再把 raw `node.started`/`node.completed` 直出到 UI。状态保持 **实施中**；
> 不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百一十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–415
> Goal workflow diagnostic sanitization 锁，不改 checkbox）——**99 文件 / 409 测试**（app-vue 26/134、
> ai 28/142、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 414：app-vue +1 file / +12 tests（Goal panel +9、boundary unit +2、surface +1）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百一十七轮）：跨端 multi-engine product scaffold/driver **扩展**（仍不打勾）——
> journey 13→16 步，新增 timeline surface isolation / workbench composition / LangGraph diagnostic
> sanitization unit 契约；external_blocked 仍为 3（Playwright/Electron/Pi spawn）。状态保持 **实施中**；
> 不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百一十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–417
> cross-end scaffold/driver 16-step 锁，不改 checkbox）——**99 文件 / 410 测试**（app-vue 26/134、
> ai 28/143、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 416：ai +0 file / +1 test（driver residual 417 step coverage）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百一十九轮）：Host **task.create** 提案/回执 lane 基础（仍不打勾）——
> `buildPendingHostProposalItems`/`buildHostExecutionReceiptItems` 支持 `taskAgentRun`；面板
> title+goalId 编辑；receipt 深链 `/tasks/:id`；approve 仅 Host lifecycle（域 Task executor 未接线）。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百二十轮）：§13.2 聚焦证据套件复跑（含 residual 250–419
> Host task.create lane 锁，不改 checkbox）——**99 文件 / 414 测试**（app-vue 26/138、
> ai 28/143、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 418：app-vue +0 file / +4 tests（task lane unit +3、surface +1）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁、Task 域 executor。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百二十一轮）：Goal 可观测性 i18n 去 LangGraph「node」产品语 + 跨端
> task.create unit 步（仍不打勾）——`nodeTiming` → `diagnosticWorkflowStepTiming`；scaffold/driver
> 增 `ui.task_create_proposal_receipt_lane`（16→17 步，implemented_unit 13→14）；surface 锁 residual 421。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百二十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–421
> diagnosticWorkflowStepTiming + task.create unit 步锁，不改 checkbox）——**99 文件 / 415 测试**（app-vue 26/138、
> ai 28/144、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 420：ai +0 file / +1 test（cross-end driver residual 421 覆盖）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁、Task 域 executor。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百二十三轮）：Host **task.create** 实时 lane 接线 + 域 executor 基础（仍不打勾）——
> `resolveLiveHostWorkbenchAgentRuns` 排他接入 AIChatView；primary task 经 goal session confirm 或
> `buildHostTaskCreateTemplateRequest`+`createTemplate` fallback；`applyHostTaskPatchToAgentActions`。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百二十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–423
> Host task.create live lane + domain executor 锁，不改 checkbox）——**99 文件 / 418 测试**（app-vue 26/141、
> ai 28/144、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 422：app-vue +0 file / +3 tests（task live unit +2、surface +1）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁、Task AgentType/完整 Task 工作台。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百二十五轮）：Host **task.create** 客户端 settle + 执行回执（仍不打勾）——
> `createTemplate` fallback 后 `buildHostTaskClientExecutionReceipt` + `settledProposalIds` 隐藏 pending；
> receipt `primaryEntityId` 深链 template id；session-only 不写 localStorage。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百二十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–425
> Host task.create client settle/receipt 锁，不改 checkbox）——**99 文件 / 421 测试**（app-vue 26/144、
> ai 28/144、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 424：app-vue +0 file / +3 tests（client settle unit +2、surface +1）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁、Task AgentType/完整 Task 工作台。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百二十七轮）：Host **AgentType task.create** 基础 + 专用会话字段（仍不打勾）——
> `AgentTypeSchema` 增 `task.create`；`taskAgentRun` 会话字段 + `isPrimaryTaskHostAgentRun` 识别；
> start 能力门禁不阻塞；完整 Task Agent 工作流/LangGraph 仍未齐。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百二十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–427
> Host AgentType task.create + taskAgentRun 锁，不改 checkbox）——**99 文件 / 423 测试**（app-vue 26/146、
> ai 28/144、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 426：app-vue +0 file / +2 tests（task.create AgentType/session 路径）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁、完整 Task Agent 工作流/工作台。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百二十九轮）：Host **task.create** 产品 toolMode 入口（仍不打勾）——
> `WorkflowMode` 增 `task-create`；Welcome shortcut + Footer 工具菜单；AgentType `task.create` 同步 toolMode；
> 完整 Task Agent start/runtime/LangGraph 仍未齐。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百三十轮）：§13.2 聚焦证据套件复跑（含 residual 250–429
> Host task.create 产品 toolMode 入口锁，不改 checkbox）——**99 文件 / 424 测试**（app-vue 26/147、
> ai 28/144、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 428：app-vue +0 file / +1 test（task-create product entry surface）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁、完整 Task Agent 工作流/工作台。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百三十一轮）：Host **task.create** 产品 start 基础（仍不打勾）——
> TS `buildHostTaskCreateStartResult`（waiting_approval + create_task_template）；客户端 `startTaskAgentRun` +
> ActionBar 入口；完整 LangGraph Task Agent 仍未齐。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百三十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–431
> Host task.create 产品 start 基础锁，不改 checkbox）——**99 文件 / 425 测试**（app-vue 26/148、
> ai 28/144、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 430：app-vue +0 file / +1 test（task.create product start surface）。仍为部分/外部阻塞：
> 真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn 产品路径、
> GitHub App fixture E2E、全量 PR 门禁、完整 Task LangGraph 工作流。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百三十三轮）：Host **task.create** 会话 restore/refresh + 启动关联目标（仍不打勾）——
> 恢复会话时刷新/保留 `taskAgentRun`；ActionBar 可选 `linkedGoalId` 写入 start payload；完整 LangGraph 仍未齐。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百三十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–433
> Host task.create restore/linked goal 锁，不改 checkbox）——**99 文件 / 426 测试**（app-vue 26/149、
> ai 28/144、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`（首跑 nx
> SIGSEGV 后复跑 governance-check 通过）。相对 residual 432：app-vue +0 file / +1 test（restore/linked goal surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、完整 Task LangGraph 工作流。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百三十五轮）：Host **task.create** 进程内 run store 基础（仍不打勾）——
> `taskCreateRunStore` 在 start 后登记；`getRun`/`listRuns`/`getEvents` 可再水合；非跨进程 durable DB；
> 完整 LangGraph 仍未齐。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百三十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–435
> Host task.create process-local store 锁，不改 checkbox）——**102 文件 / 433 测试**（app-vue 26/150、
> ai 31/150、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 434：ai +3 files / +6 tests（task.create start/store/runtime-store）；app-vue +0 file / +1 test（store surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百三十七轮）：Host **task.create** 进程内 cancel/complete resume（仍不打勾）——
> `buildHostTaskCreateResumeResult` + runtime `resumeRun` 更新 `taskCreateRunStore`；
> 客户端 `cancelTaskAgentRun` / `completeTaskAgentRun` 接 Host reject/approve createTemplate settle；
> selectAgentRun/getRun 可再水合 terminal 状态；非跨进程 durable / 无完整 LangGraph。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百三十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–437
> Host task.create process-local cancel/complete resume 锁，不改 checkbox）——**104 文件 / 439 测试**（app-vue 26/151、
> ai 33/155、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 436：ai +2 files / +5 tests（resume unit + runtime-resume）；app-vue +0 file / +1 test（resume surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百三十九轮）：Host **task.create** 进程内 edit revise + 幂等 terminal（仍不打勾）——
> `userDecision: 'edit'` 修订 pending create_task_template 并保持 waiting_approval；
> cancel/confirm 对已 terminal 幂等；客户端 `reviseTaskAgentRun` 接 Host revise；
> selectAgentRun/getRun 可再水合修订草稿；非跨进程 durable / 无完整 LangGraph。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百四十轮）：§13.2 聚焦证据套件复跑（含 residual 250–439
> Host task.create process-local edit revise 锁，不改 checkbox）——**104 文件 / 443 测试**（app-vue 26/152、
> ai 33/158、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 438：ai +0 file / +3 tests（edit unit + idempotent + runtime edit）；app-vue +0 file / +1 test（edit surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百四十一轮）：Host **AgentRun 历史 reopen 聚焦**（仍不打勾）——
> `resolveHostWorkbenchFocusFromAgentRun` 从 history restore 映射 proposal/receipt focus；
> `selectAgentRun` 打开右侧工作台并高亮对应行；process-local terminal task.create 标题从
> executedActions/events/messages 回收；非跨端 Playwright/Electron E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百四十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–441
> Host AgentRun history reopen focus 锁，不改 checkbox）——**104 文件 / 446 测试**（app-vue 26/155、
> ai 33/158、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 440：app-vue +0 file / +3 tests（focus unit +2、surface +1）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百四十三轮）：Host **会话 restore 工作台聚焦**（仍不打勾）——
> `resolveHostWorkbenchFocusFromSessionRuns` 优先 task.create 再 goal/knowledge；
> `selectConversation` 恢复后打开并高亮 Host 行；pending/receipt 自动默认 focus 首行；
> 非跨端 Playwright/Electron multi-engine E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百四十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–443
> Host conversation restore workbench focus 锁，不改 checkbox）——**104 文件 / 449 测试**（app-vue 26/158、
> ai 33/158、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 442：app-vue +0 file / +3 tests（session focus unit +2、surface +1）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百四十五轮）：Host **task.create linked goal restore + 会话隔离**（仍不打勾）——
> `resolveLinkedGoalIdFromTaskAgentRun` / `syncLinkedGoalFromTaskAgentRun` 在 restore/getRun 后重对齐
> ActionBar linkedGoalId；`selectConversation`/`startNewConversation` 清空 client settlement/receipts
> 防跨会话泄漏；非跨端 Playwright/Electron multi-engine E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百四十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–445
> Host task.create linked goal restore + settlement isolation 锁，不改 checkbox）——**104 文件 / 452 测试**（app-vue 26/161、
> ai 33/158、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 444：app-vue +0 file / +3 tests（linked goal unit +2、surface +1）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百四十七轮）：§13.2 证据指针刷新 + process-local store 容量边界（仍不打勾）——
> 复核 1/12/15 仍为部分/外部阻塞；Agent 项补充 residual 427–446 Host task.create 进程内路径证据
> （start/store/resume/edit/focus/restore/linked-goal/session isolation，永不 `executeApproved`）；
> `HOST_TASK_CREATE_RUN_STORE_MAX_ENTRIES` + 按 `updatedAt` 淘汰最旧条目；非跨进程 durable /
> 非全量 PR 门禁 / 非跨端 multi-engine E2E。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百四十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–447
> Host task.create process-local store bound + §13.2 指针刷新锁，不改 checkbox）——**104 文件 / 455 测试**（app-vue 26/162、
> ai 33/160、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 446：ai +0 file / +2 tests（store bound unit）；app-vue +0 file / +1 test（store bound surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百四十九轮）：Host **task.create process-local product journey**（仍不打勾）——
> 同进程 fixture：start → edit → cancel；start → confirm settle → get/list/events 再水合；
> identity fail-closed；空 title 拒绝且不写 store；永不 Python port / 永不 Host lifecycle 域执行接线；
> surface + scaffold/driver 锁；非跨端 Playwright/Electron multi-engine E2E / 非跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百五十轮）：§13.2 聚焦证据套件复跑（含 residual 250–449
> Host task.create process-local product journey 锁，不改 checkbox）——**105 文件 / 460 测试**（app-vue 26/163、
> ai 34/164、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 448：ai +1 file / +4 tests（product journey）；app-vue +0 file / +1 test（journey surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百五十一轮）：Host **task.create process-local runId 身份绑定**（仍不打勾）——
> 进程内 store upsert 对已有 runId 拒绝异身份接管；runtime start 映射 `FORBIDDEN`；同身份 resume 仍可更新；
> surface/scaffold/driver + store/journey 锁；非跨进程 durable / 非跨端 multi-engine E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百五十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–451
> Host task.create process-local runId 身份绑定锁，不改 checkbox）——**105 文件 / 464 测试**（app-vue 26/164、
> ai 34/167、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 450：ai +0 file / +3 tests（store binding +2、journey +1）；app-vue +0 file / +1 test（binding surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百五十三轮）：Host **task.create confirm 要求 client settlement**（仍不打勾）——
> 移除 Host `defaultExecutedFromApproved` 伪造 execution receipt；confirm 必须带非空
> `executedActions`（tool=`create_task_template`、status=`executed`）；缺省/错 tool/非 executed 均 fail-closed；
> 跨 terminal cancel↔confirm 拒绝；surface/scaffold/driver 锁；非跨端 multi-engine E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百五十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–453
> Host task.create confirm client settlement 锁，不改 checkbox）——**105 文件 / 468 测试**（app-vue 26/165、
> ai 34/170、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 452：ai +0 file / +3 tests（resume settlement +2、journey +1）；app-vue +0 file / +1 test（settlement surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百五十五轮）：Host **task.create edit 要求非空标题**（仍不打勾）——
> edit revise 必须 `create_task_template` + 非空 trim title（与 start 同不变量）；空白 revise fail-closed 且不写 store；
> 规范化 title/goalId trim 入 pending；client `reviseTaskAgentRun` 拒空白 title；surface/scaffold/driver 锁；
> 非跨端 multi-engine E2E。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百五十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–455
> Host task.create edit non-empty title 锁，不改 checkbox）——**105 文件 / 472 测试**（app-vue 26/166、
> ai 34/173、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 454：ai +0 file / +3 tests（resume title +2、journey +1）；app-vue +0 file / +1 test（edit title surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百五十七轮）：Host **task.create process-local conversation/thread 绑定**（仍不打勾）——
> 同一 runId 禁止跨 conversation/thread 重绑（同身份亦 fail-closed）；start 映射 `VALIDATION_ERROR`；
> 同会话 resume upsert 仍可；`activeOnly` 排除 terminal；list 会话隔离；surface/scaffold/driver 锁；
> 非跨端 multi-engine E2E。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百五十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–457
> Host task.create conversation/thread runId 绑定锁，不改 checkbox）——**105 文件 / 478 测试**（app-vue 26/167、
> ai 34/178、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 456：ai +0 file / +5 tests（store binding +4、journey +1）；app-vue +0 file / +1 test（session binding surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百五十九轮）：Host **task.create dirty approve 先 process-local revise**（仍不打勾）——
> dirty approve 在 domain `createTemplate` 前调用 `reviseTaskAgentRun`，避免 mutation 中途失败后 getRun/reopen
> 回放旧 title；`shouldReviseProcessLocalTaskDraftBeforeDomainSettle` 决策 helper + surface/scaffold/driver 锁；
> 永不 `executeApproved`；非跨端 multi-engine E2E。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百六十轮）：§13.2 聚焦证据套件复跑（含 residual 250–459
> Host task.create dirty approve revise-before-settle 锁，不改 checkbox）——**105 文件 / 481 测试**（app-vue 26/170、
> ai 34/178、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 458：app-vue +0 file / +3 tests（lifecycle helper unit +2、surface +1）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百六十一轮）：Host **task.create start 要求 conversationId**（仍不打勾）——
> 进程内 start 缺非空 conversationId 返回 `VALIDATION_ERROR` 且不写 store；client `canRunTaskAgent`/
> `startTaskAgentRun` 双门禁；`resolveTaskCreateConversationId` + surface/scaffold/driver 锁；
> 会话绑定强化 restore/history reopen；非跨端 multi-engine E2E。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百六十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–461
> Host task.create start conversationId 锁，不改 checkbox）——**105 文件 / 484 测试**（app-vue 26/171、
> ai 34/180、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 460：ai +0 file / +2 tests（start unit +1、journey +1）；app-vue +0 file / +1 test（conversation surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百六十三轮）：Host **task.create confirm 要求可回收 settlement title**（仍不打勾）——
> confirm 从 executed data / approved pending 解析非空 title（`title`/`name`），写入 executedActions.data 与
> `run.completed` 事件 title；不可回收则 fail-closed；resume unit +2、journey +1、surface/scaffold/driver 锁；
> 强化 history reopen/receipt 标题可回收；非跨端 multi-engine E2E。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百六十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–463
> Host task.create confirm settlement title 锁，不改 checkbox）——**105 文件 / 488 测试**（app-vue 26/172、
> ai 34/183、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 462：ai +0 file / +3 tests（resume unit +2、journey +1）；app-vue +0 file / +1 test（settlement title surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百六十五轮）：Host **task.create confirm 要求可回收 settlement template id**（仍不打勾）——
> confirm 从 executed.entityId 或 data.templateId/entityId/taskId 解析非空模板实体 id，规范化写入 entityId、
> executed data 与 `run.completed` 事件 templateId；不可回收则 fail-closed；client complete 缺 templateId 不 resume；
> resume unit +2、journey +1、surface/scaffold/driver 锁；强化 receipt deep-link；非跨端 multi-engine E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百六十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–465
> Host task.create confirm settlement template id 锁，不改 checkbox）——**105 文件 / 492 测试**（app-vue 26/173、
> ai 34/186、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 464：ai +0 file / +3 tests（resume unit +2、journey +1）；app-vue +0 file / +1 test（template id surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百六十七轮）：Host **task.create confirm 禁止 settlement goalId 重绑**（仍不打勾）——
> confirm 以 approved create_task_template draft goalId 为真值：缺失则从 draft 规范化写入 executed data 与
> `run.completed`；executed 与 approved 非空 goalId 不一致则 fail-closed；resume unit +2、journey +1、
> surface/scaffold/driver 锁；非跨端 multi-engine E2E。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百六十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–467
> Host task.create confirm goalId no-rebind 锁，不改 checkbox）——**105 文件 / 496 测试**（app-vue 26/174、
> ai 34/189、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 466：ai +0 file / +3 tests（resume unit +2、journey +1）；app-vue +0 file / +1 test（goal rebind surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百六十九轮）：Host **task.create confirm 禁止 settlement title 重绑**（仍不打勾）——
> confirm 以 approved create_task_template draft title 为真值（与 residual 463 可回收 + residual 467 goal 对称）：
> 缺失则从 draft 规范化写入；executed 与 approved 非空 title 不一致则 fail-closed；resume unit +2、journey +1、
> surface/scaffold/driver 锁；非跨端 multi-engine E2E。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百七十轮）：§13.2 聚焦证据套件复跑（含 residual 250–469
> Host task.create confirm title no-rebind 锁，不改 checkbox）——**105 文件 / 500 测试**（app-vue 26/175、
> ai 34/192、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 468：ai +0 file / +3 tests（resume unit +2、journey +1）；app-vue +0 file / +1 test（title rebind surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百七十一轮）：Host **task.create confirm 仅信 process-local draft**（仍不打勾）——
> confirm 忽略 client `payload.approvedActions`（draft 真值只读 store pending/approved；edit 才是 revise 路径），
> 且要求恰好一条 `create_task_template` executedAction；client complete 不再附带 approvedActions；
> resume unit +3、journey 调整、surface/scaffold/driver 锁；堵住 draft 重绑旁路。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百七十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–471
> Host task.create confirm process-local draft only 锁，不改 checkbox）——**105 文件 / 505 测试**（app-vue 26/176、
> ai 34/196、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 470：ai +0 file / +4 tests（resume unit +3、journey net +1）；app-vue +0 file / +1 test（store-draft surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百七十三轮）：Host **task.create edit 要求单条 approvedAction**（仍不打勾）——
> edit 与 start/confirm 对称：恰好一条 `create_task_template` approvedAction，规范化 index=0 的单 pending draft；
> 多 action revise fail-closed；resume unit +2、journey +1、surface/scaffold/driver 锁；非跨端 multi-engine E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百七十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–473
> Host task.create edit single approvedAction 锁，不改 checkbox）——**105 文件 / 509 测试**（app-vue 26/177、
> ai 34/199、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 472：ai +0 file / +3 tests（resume unit +2、journey +1）；app-vue +0 file / +1 test（edit single surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百七十五轮）：Host **task.create confirm 仅 waiting_approval**（仍不打勾）——
> confirm 收紧为产品态 `waiting_approval` only（禁 waiting_execution 结算旁路）；client revise 只提交单条
> `create_task_template`；resume unit +2、journey +1、surface/scaffold/driver 锁；非跨端 multi-engine E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百七十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–475
> Host task.create confirm waiting_approval-only 锁，不改 checkbox）——**105 文件 / 513 测试**（app-vue 26/178、
> ai 34/202、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 474：ai +0 file / +3 tests（resume unit +2、journey +1）；app-vue +0 file / +1 test（waiting_approval surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百七十七轮）：Host **task.create cancel 仅 waiting_approval**（仍不打勾）——
> cancel 与 confirm/edit 对称：仅产品态 `waiting_approval` 可取消（禁 waiting_execution/running/pending 旁路）；
> client cancel 同步门禁；resume unit +2、journey +1、surface/scaffold/driver 锁；非跨端 multi-engine E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百七十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–477
> Host task.create cancel waiting_approval-only 锁，不改 checkbox）——**105 文件 / 517 测试**（app-vue 26/179、
> ai 34/205、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 476：ai +0 file / +3 tests（resume unit +2、journey +1）；app-vue +0 file / +1 test（cancel status surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百七十九轮）：Host **task.create start 非空 title fail-closed**（仍不打勾）——
> `buildHostTaskCreateStartResult` 去掉 `'New task'` 静默默认；无 title/idea/message/conversationTitle 即抛；
> runtime 共用 `HOST_TASK_CREATE_START_REQUIRES_TITLE_MESSAGE`；start unit + journey + surface/scaffold/driver 锁；非跨端 multi-engine E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百八十轮）：§13.2 聚焦证据套件复跑（含 residual 250–479
> Host task.create start non-empty title 锁，不改 checkbox）——**105 文件 / 520 测试**（app-vue 26/180、
> ai 34/207、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 478：ai +0 file / +2 tests（start unit +2）；app-vue +0 file / +1 test（start title surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百八十一轮）：Host **task.create edit 仅 waiting_approval**（仍不打勾）——
> 命名常量 `HOST_TASK_CREATE_EDIT_REQUIRES_WAITING_APPROVAL_MESSAGE` 对称 confirm/cancel；去掉 terminal edit ad-hoc status 字符串；
> resume unit +2、journey +1、client gate Residual 481、surface/scaffold/driver 锁；非跨端 multi-engine E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百八十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–481
> Host task.create edit waiting_approval-only 锁，不改 checkbox）——**105 文件 / 524 测试**（app-vue 26/181、
> ai 34/210、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 480：ai +0 file / +3 tests（resume unit +2、journey +1）；app-vue +0 file / +1 test（edit status surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百八十三轮）：Host **task.create start conversationId builder fail-closed**（仍不打勾）——
> `buildHostTaskCreateStartResult` 禁 silent `null` conversationId；与 residual 461 runtime 门禁对称；
> start unit +1、journey blank conv、surface/scaffold/driver Residual 483 锁；非跨端 multi-engine E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百八十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–483
> Host task.create start conversationId builder 锁，不改 checkbox）——**105 文件 / 526 测试**（app-vue 26/182、
> ai 34/211、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 482：ai +0 file / +1 test（start unit +1）；app-vue +0 file / +1 test（conversation builder surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百八十五轮）：Host **task.create start threadId builder fail-closed**（仍不打勾）——
> `buildHostTaskCreateStartResult` 要求 trim 后非空 `threadId`（禁空白透传）；runtime 共用
> `HOST_TASK_CREATE_START_REQUIRES_THREAD_MESSAGE`；start unit + journey + surface/scaffold/driver 锁；非跨端 multi-engine E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百八十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–485
> Host task.create start threadId builder 锁，不改 checkbox）——**105 文件 / 530 测试**（app-vue 26/183、
> ai 34/214、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 484：ai +0 file / +3 tests（start unit +2、journey +1）；app-vue +0 file / +1 test（thread builder surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百八十七轮）：阶段 6 **task DAG *ViewModel 双轨收口**（仍不打勾）——
> 删除消费者侧 `TaskForDAGViewModel`/`TaskGraph*ViewModel` 幻影类型引用，统一 `TaskForDAG`/
> `TaskGraphData`/`TaskGraphEdge`（`task-dag.types` / `@dailyuse/task/client`）；surface 锁扩展到全 module 扫描；非跨端 E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百八十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–487
> task DAG *ViewModel 双轨收口锁，不改 checkbox）——**105 文件 / 532 测试**（app-vue 26/185、
> ai 34/214、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 486：app-vue +0 file / +2 tests（DAG dual-track surface）；ai 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百八十九轮）：Host **task.create client complete 仅 waiting_approval**（仍不打勾）——
> `completeTaskAgentRun` 与 cancel/edit 对称门禁；Host residual 475 已 fail-closed，client 补 defense-in-depth；
> surface/scaffold/driver Residual 489 锁；非跨端 multi-engine E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百九十轮）：§13.2 聚焦证据套件复跑（含 residual 250–489
> Host task.create client complete waiting_approval-only 锁，不改 checkbox）——**105 文件 / 533 测试**（app-vue 26/186、
> ai 34/214、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 488：app-vue +0 file / +1 test（complete waiting_approval surface）；ai 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百九十一轮）：Host **task.create edit/confirm tool+empty-action 命名常量**（仍不打勾）——
> empty approvedActions / create_task_template tool / executed status 一律命名常量 fail-closed；
> resume unit +2、surface/scaffold/driver Residual 491 锁；非跨端 multi-engine E2E。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百九十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–491
> Host task.create edit/confirm tool named-constant 锁，不改 checkbox）——**105 文件 / 536 测试**（app-vue 26/187、
> ai 34/216、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 490：ai +0 file / +2 tests（resume unit +2）；app-vue +0 file / +1 test（tool constants surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百九十三轮）：Host **task.create start identityId fail-closed**（仍不打勾）——
> ExecutionContext identity 非空 trim 绑定；builder/runtime 禁静默空 identity；unit + journey + surface/scaffold/driver Residual 493 锁；
> 客户端 body identity 仍不得接管；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百九十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–493
> Host task.create start identityId fail-closed 锁，不改 checkbox）——**105 文件 / 540 测试**（app-vue 26/188、
> ai 34/219、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 492：ai +0 file / +3 tests（start identity unit +2、journey +1）；app-vue +0 file / +1 test（identity surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百九十五轮）：Host **task.create resume agentType + unsupported userDecision 命名常量** + process-local store 拒绝非 task.create（仍不打勾）——
> resume agent 隔离与决策面 fail-closed；store 不再静默 ignore 外源 agentType；unit + surface/scaffold/driver Residual 495 锁；
> 非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百九十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–495
> Host task.create resume/store agentType fail-closed 锁，不改 checkbox）——**105 文件 / 543 测试**（app-vue 26/189、
> ai 34/221、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 494：ai +0 file / +2 tests（resume agentType + store agentType）；app-vue +0 file / +1 test（agentType surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百九十七轮）：Host **task.create start runId fail-closed**（仍不打勾）——
> process-local runId map key 非空 trim 绑定；builder/runtime 禁静默空 runId；unit + journey + surface/scaffold/driver Residual 497 锁；
> 非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留四百九十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–497
> Host task.create start runId fail-closed 锁，不改 checkbox）——**105 文件 / 547 测试**（app-vue 26/190、
> ai 34/224、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 496：ai +0 file / +3 tests（start runId unit +2、journey +1）；app-vue +0 file / +1 test（runId surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留四百九十九轮）：Host **task.create start agentType fail-closed**（仍不打勾）——
> request.agentType 必须 task.create；builder 禁静默 retype；与 residual 495 resume/store agent 隔离对称；
> unit + journey + surface/scaffold/driver Residual 499 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百轮）：§13.2 聚焦证据套件复跑（含 residual 250–499
> Host task.create start agentType fail-closed 锁，不改 checkbox）——**105 文件 / 550 测试**（app-vue 26/191、
> ai 34/226、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 498：ai +0 file / +2 tests（start agentType unit +1、journey +1）；app-vue +0 file / +1 test（agentType surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百零一轮）：Client **task.create complete settlement draft 仅 create_task_template**（仍不打勾）——
> completeTaskAgentRun 禁 blind pending[0]；find tool create_task_template 双源（pending/approved）；与 Host 471/491 单工具对称；
> surface/scaffold/driver Residual 501 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百零二轮）：§13.2 聚焦证据套件复跑（含 residual 250–501
> Client task.create complete settlement draft create_task_template-only 锁，不改 checkbox）——**105 文件 / 551 测试**（app-vue 26/192、
> ai 34/226、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 500：app-vue +0 file / +1 test（complete draft tool surface）；ai 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百零三轮）：Host **task.create process-local store identity trim match**（仍不打勾）——
> get/list/getEvents/upsert 身份比较用 resolveTaskCreateIdentityId；空白查询 fail-closed；与 start residual 493 对称；
> unit + journey + surface/scaffold/driver Residual 503 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百零四轮）：§13.2 聚焦证据套件复跑（含 residual 250–503
> Host task.create process-local store identity trim match 锁，不改 checkbox）——**105 文件 / 556 测试**（app-vue 26/193、
> ai 34/230、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 502：ai +0 file / +4 tests（store identity unit +3、journey +1）；app-vue +0 file / +1 test（identity surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百零五轮）：Host **task.create process-local store runId trim lookup**（仍不打勾）——
> get/getEvents/upsert map key 用 resolveTaskCreateRunId；空白 runId fail-closed；与 start residual 497 对称；
> unit + journey + surface/scaffold/driver Residual 505 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百零六轮）：§13.2 聚焦证据套件复跑（含 residual 250–505
> Host task.create process-local store runId trim lookup 锁，不改 checkbox）——**105 文件 / 561 测试**（app-vue 26/194、
> ai 34/234、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 504：ai +0 file / +4 tests（store runId unit +3、journey +1）；app-vue +0 file / +1 test（runId surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百零七轮）：Client **task.create revise draft 仅 create_task_template**（仍不打勾）——
> reviseTaskAgentRun 移除 blind `source[0]` fallback（与 residual 501 complete 对称）；
> surface/scaffold/driver Residual 507 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百零八轮）：§13.2 聚焦证据套件复跑（含 residual 250–507
> Client task.create revise draft create_task_template-only 锁，不改 checkbox）——**105 文件 / 562 测试**（app-vue 26/195、
> ai 34/234、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 506：app-vue +0 file / +1 test（revise draft tool surface）；ai 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百零九轮）：Host **task.create process-local store conversationId trim match**（仍不打勾）——
> list filter + conversation binding 用 resolveTaskCreateConversationId；空白 conversation 过滤 fail-closed；
> unit + journey + surface/scaffold/driver Residual 509 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百一十轮）：§13.2 聚焦证据套件复跑（含 residual 250–509
> Host task.create process-local store conversationId trim match 锁，不改 checkbox）——**105 文件 / 567 测试**（app-vue 26/196、
> ai 34/238、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 508：ai +0 file / +4 tests（store conversation unit +3、journey +1）；app-vue +0 file / +1 test（conversation surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百一十一轮）：Host **task.create process-local store threadId trim match**（仍不打勾）——
> upsert thread binding 用 resolveTaskCreateThreadId / matchesHostTaskCreateThread；空白 threadId fail-closed；
> unit + journey + surface/scaffold/driver Residual 511 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百一十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–511
> Host task.create process-local store threadId trim match 锁，不改 checkbox）——**105 文件 / 572 测试**（app-vue 26/197、
> ai 34/242、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 510：ai +0 file / +4 tests（store thread unit +3、journey +1）；app-vue +0 file / +1 test（thread surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百一十三轮）：Host **task.create process-local store conversationId upsert normalize**（仍不打勾）——
> upsert 用 resolveTaskCreateConversationId 规范化并空白 fail-closed（与 thread residual 511 对称）；
> unit + journey + surface/scaffold/driver Residual 513 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百一十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–513
> Host task.create process-local store conversationId upsert normalize 锁，不改 checkbox）——**105 文件 / 577 测试**（app-vue 26/198、
> ai 34/246、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 512：ai +0 file / +4 tests（store conversation upsert unit +3、journey +1）；app-vue +0 file / +1 test（conversation upsert surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百一十五轮）：Host **task.create process-local store identityId upsert normalize**（仍不打勾）——
> upsert 用 resolveTaskCreateIdentityId 规范化并空白 fail-closed（与 conversation/thread residual 513/511 对称）；
> unit + journey + surface/scaffold/driver Residual 515 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百一十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–515
> Host task.create process-local store identityId upsert normalize 锁，不改 checkbox）——**105 文件 / 581 测试**（app-vue 26/199、
> ai 34/249、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 514：ai +0 file / +3 tests（store identity upsert unit +2、journey +1）；app-vue +0 file / +1 test（identity upsert surface）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百一十七轮）：Host **task.create listRuns remote ownership trim match**（仍不打勾）——
> remote merge 用 matchesHostTaskCreateIdentity；ensureAgentRunOwnedByIdentity 共享同一 trim matcher；
> journey + surface/scaffold/driver Residual 517 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百一十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–517
> Host task.create listRuns remote ownership trim match 锁，不改 checkbox）——**105 文件 / 583 测试**（app-vue 26/200、
> ai 34/250、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 516：ai +0 file / +1 test（list remote ownership journey）；app-vue +0 file / +1 test（list ownership surface；503 ownership surface 对齐 matcher）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百一十九轮）：Client **task.create draft title/goalId 仅 create_task_template**（仍不打勾）——
> taskDraftTitle/taskDraftGoalId 经 firstCreateTaskTemplateAction，禁 blind pending[0]（与 residual 501/507 对称）；
> unit + surface/scaffold/driver Residual 519 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百二十轮）：§13.2 聚焦证据套件复跑（含 residual 250–519
> Client task.create draft title/goalId create_task_template-only 锁，不改 checkbox）——**105 文件 / 586 测试**（app-vue 26/203、
> ai 34/250、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 518：app-vue +0 file / +3 tests（draft tool unit +2、surface +1）；ai 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百二十一轮）：Client **knowledge.write draft path/markdown 仅 create_knowledge_note**（仍不打勾）——
> knowledgeDraftTargetPath/Markdown 经 firstCreateKnowledgeNoteAction，禁 blind pending[0]（与 residual 519 对称）；
> unit + surface/scaffold/driver Residual 521 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百二十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–521
> Client knowledge.write draft path/markdown create_knowledge_note-only 锁，不改 checkbox）——**105 文件 / 589 测试**（app-vue 26/206、
> ai 34/250、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 520：app-vue +0 file / +3 tests（knowledge draft unit +2、surface +1）；ai 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百二十三轮）：Client **goal.create draft title/description 仅 create_goal**（仍不打勾）——
> goalDraftTitle/Description 经 firstCreateGoalAction，禁 blind pending[0]（与 residual 519/521 对称）；
> unit + surface/scaffold/driver Residual 523 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百二十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–523
> Client goal.create draft title/description create_goal-only 锁，不改 checkbox）——**105 文件 / 592 测试**（app-vue 26/209、
> ai 34/250、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 522：app-vue +0 file / +3 tests（goal draft unit +2、surface +1）；ai 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百二十五轮）：Client **workbench summary rationale 仅 product-lane tool**（仍不打勾）——
> firstPendingRationale(run, productTool) 禁 blind pending[0]（goal→create_goal / knowledge→create_knowledge_note / task→create_task_template）；
> unit + surface/scaffold/driver Residual 525 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百二十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–525
> Client workbench summary product-lane rationale 锁，不改 checkbox）——**105 文件 / 597 测试**（app-vue 26/214、
> ai 34/250、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 524：app-vue +0 file / +5 tests（summary rationale unit +4、surface +1）；ai 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百二十七轮）：Client **workbench pendingActionCount 仅 product-lane tool**（仍不打勾）——
> pendingActionCount(run, productTool) 禁 foreign tools 膨胀（goal→create_goal / knowledge→create_knowledge_note / task→create_task_template）；
> unit + surface/scaffold/driver Residual 527 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百二十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–527
> Client workbench pendingActionCount product-lane 锁，不改 checkbox）——**105 文件 / 602 测试**（app-vue 26/219、
> ai 34/250、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 526：app-vue +0 file / +5 tests（pendingActionCount unit +4、surface +1）；ai 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百二十九轮）：Client **receipt primaryEntityId 仅 product-lane executed tool**（仍不打勾）——
> summarizeExecutedActions(run, productTool) 禁 foreign entityIds[0] 深链（goal→create_goal / knowledge→create_knowledge_note / task→create_task_template）；
> unit + surface/scaffold/driver Residual 529 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百三十轮）：§13.2 聚焦证据套件复跑（含 residual 250–529
> Client receipt primaryEntityId product-lane 锁，不改 checkbox）——**105 文件 / 607 测试**（app-vue 26/224、
> ai 34/250、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 528：app-vue +0 file / +5 tests（primaryEntityId unit +4、surface +1）；ai 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百三十一轮）：Client **knowledge.write draft title 仅 create_knowledge_note**（仍不打勾）——
> knowledgeDraftTitle 经 firstCreateKnowledgeNoteAction payload fallback，禁 blind pending[0]（与 residual 521 path/markdown 对称）；
> unit + surface/scaffold/driver Residual 531 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百三十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–531
> Client knowledge draft title create_knowledge_note-only 锁，不改 checkbox）——**105 文件 / 611 测试**（app-vue 26/228、
> ai 34/250、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 530：app-vue +0 file / +4 tests（knowledge title unit +3、surface +1）；ai 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百三十三轮）：Client **receipt summary 排除 cross-lane foreign tools**（仍不打勾）——
> isCrossLaneForeignTool + summarizeExecutedActions 禁 foreign 膨胀 counts/actionLines/entityIds（goal 保留 create_key_result 同车道 companion）；
> unit + surface/scaffold/driver Residual 533 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百三十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–533
> Client receipt cross-lane foreign tool exclusion 锁，不改 checkbox）——**105 文件 / 615 测试**（app-vue 26/232、
> ai 34/250、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 532：app-vue +0 file / +4 tests（cross-lane receipt unit +3、surface +1）；ai 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百三十五轮）：Client **receipt summary error 仅 same-lane failed action**（仍不打勾）——
> summarizeExecutedActions firstFailedMessage 禁 blind run.state.errors[0]（与 residual 533 cross-lane filter 对称）；
> unit + surface/scaffold/driver Residual 535 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百三十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–535
> Client receipt summary same-lane failed message 锁，不改 checkbox）——**105 文件 / 619 测试**（app-vue 26/236、
> ai 34/250、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 534：app-vue +0 file / +4 tests（summary failed-message unit +3、surface +1）；ai 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百三十七轮）：Client **receipt ok 要求 product-lane executed**（仍不打勾）——
> summarizeExecutedActions productLaneExecuted：completed 且 failedCount=0 且 product tool executed（companion-only 不记成功）；
> unit + surface/scaffold/driver Residual 537 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百三十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–537
> Client receipt ok product-lane executed 锁，不改 checkbox）——**105 文件 / 624 测试**（app-vue 26/241、
> ai 34/250、repository 6/35、contracts 11/29、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 536：app-vue +0 file / +5 tests（productLaneExecuted unit +4、surface +1）；ai 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百三十九轮）：阶段 6 **editor dual-track / portable boundary 再锁**（仍不打勾）——
> PowerSync editor_* 仅 portable backup continuity；repository routes knowledge-only（无 Folder/Resource CRUD）；Vue shell 剥离 /note 旧路由；
> portable-editor surface Residual 539 锁；非跨端 multi-engine E2E / 全量 PR 门禁。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百四十轮）：§13.2 聚焦证据套件复跑（含 residual 250–539
> stage-6 editor dual-track / portable boundary 锁，不改 checkbox）——**105 文件 / 627 测试**（app-vue 26/241、
> ai 34/250、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 538：data-portability +0 file / +3 tests（portable boundary unit/surface +3）；app-vue/ai 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百四十一轮）：§13.2 **证据审计刷新** + Host edit **draftAction 单工具 fail-closed**（仍不打勾）——
> host-task-create-resume edit 经 single-action + create_task_template 后唯一 draftAction 读 payload（禁 multi-index invent）；
> 证据指针：Client product-lane 隔离 501/507/519–537 + stage-6 portable boundary 539 + tip suite 627；
> unit + scaffold/driver Residual 541 锁；非跨端 multi-engine E2E / 全量 PR 门禁 / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百四十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–541
> Host edit draftAction + §13.2 证据审计指针锁，不改 checkbox）——**105 文件 / 628 测试**（app-vue 26/241、
> ai 34/251、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 540：ai +0 file / +1 test（edit draftAction unit +1）；app-vue/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百四十三轮）：Host task.create **confirm settlementAction 单工具 fail-closed**（仍不打勾）——
> host-task-create-resume confirm 经 single-executed + create_task_template + executed 后唯一 settlementAction 规范化 title/templateId/goalId（与 residual 541 draftAction 对称）；
> unit + scaffold/driver Residual 543 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百四十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–543
> Host confirm settlementAction 锁，不改 checkbox）——**105 文件 / 629 测试**（app-vue 26/241、
> ai 34/252、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 542：ai +0 file / +1 test（confirm settlementAction unit +1）；app-vue/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百四十五轮）：Host task.create **confirm store draftAction 单工具 fail-closed**（仍不打勾）——
> host-task-create-resume confirm 经 single-store-draft + create_task_template 后唯一 draftAction 做 title/goalId 防重绑（禁 multi-index invent；541/543 对称）；
> unit + scaffold/driver Residual 545 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百四十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–545
> Host confirm store draftAction 锁，不改 checkbox）——**105 文件 / 632 测试**（app-vue 26/241、
> ai 34/255、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 544：ai +0 file / +3 tests（confirm store draftAction source+multi+foreign）；app-vue/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百四十七轮）：Client task.create **complete/revise sole draftAction 单工具 fail-closed**（仍不打勾）——
> useAITaskWorkflow complete/revise 经 productDrafts.length===1 + create_task_template 后唯一 draftAction（禁 multi-find invent；Host 541/545 对称）；
> surface + scaffold/driver Residual 547 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百四十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–547
> Client complete/revise sole draftAction 锁，不改 checkbox）——**105 文件 / 633 测试**（app-vue 26/242、
> ai 34/255、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 546：app-vue +0 file / +1 test（sole draftAction surface +1）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百四十九轮）：Client workbench **soleProductDraftAction 单工具 fail-closed**（仍不打勾）——
> hostProposalLifecycle 经 productDrafts.length===1 后唯一 draftAction 读 task/knowledge/goal draft 与 rationale（禁 multi-find invent；547 对称）；
> unit + surface + scaffold/driver Residual 549 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百五十轮）：§13.2 聚焦证据套件复跑（含 residual 250–549
> Client workbench soleProductDraftAction 锁，不改 checkbox）——**105 文件 / 637 测试**（app-vue 26/246、
> ai 34/255、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 548：app-vue +0 file / +4 tests（soleProductDraftAction unit 3 + surface 1）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百五十一轮）：Client applyHost*Patch **sole product draftAction fail-closed**（仍不打勾）——
> applyHostTask/Knowledge/GoalPatch 仅在 productDraftCount===1 时覆盖 Host 修订字段（禁 multi-index invent；547/549 对称）；
> unit + surface + scaffold/driver Residual 551 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百五十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–551
> Client applyHost*Patch sole product draftAction 锁，不改 checkbox）——**105 文件 / 642 测试**（app-vue 26/251、
> ai 34/255、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 550：app-vue +0 file / +5 tests（applyHost*Patch multi fail-closed unit 4 + surface 1）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百五十三轮）：Host task.create **confirm store draft resolve sole create_task_template**（仍不打勾）——
> resolveConfirmStoreDraftActions 过滤 foreign companions、仅返回唯一 create_task_template（multi product fail-closed；545 对称）；
> unit + scaffold/driver Residual 553 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百五十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–553
> Host confirm store draft resolve sole create_task_template 锁，不改 checkbox）——**105 文件 / 644 测试**（app-vue 26/251、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 552：ai +0 file / +2 tests（multi product store fail + resolve source lock）；app-vue/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百五十五轮）：Client knowledge.write **confirm sole create_knowledge_note draftAction fail-closed**（仍不打勾）——
> useAIKnowledgeNoteWorkflow confirm 经 productDraftCount===1 后才 applyHostKnowledgePatch + resume（禁 multi product invent；547/553 对称）；
> surface + scaffold/driver Residual 555 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百五十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–555
> knowledge.write confirm sole create_knowledge_note 锁，不改 checkbox）——**105 文件 / 645 测试**（app-vue 26/252、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 554：app-vue +0 file / +1 test（knowledge confirm sole create_knowledge_note）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百五十七轮）：Client goal.create **confirm sole create_goal draftAction fail-closed**（仍不打勾）——
> resumeGoalAgentRun confirm 经 productDraftCount===1 后才 Host lifecycle + approval payload（禁 multi product invent；555/547 对称）；
> surface + scaffold/driver Residual 557 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百五十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–557
> goal.create confirm sole create_goal 锁，不改 checkbox）——**105 文件 / 646 测试**（app-vue 26/253、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 556：app-vue +0 file / +1 test（goal confirm sole create_goal）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百五十九轮）：Client **goal.create confirm/cancel + knowledge.write confirm waiting_approval-only**（仍不打勾）——
> resumeGoalAgentRun confirm/cancel 与 createKnowledgeNoteFromConversation 仅 waiting_approval（task 489/477 + knowledge cancel 对称）；
> surface + scaffold/driver Residual 559 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百六十轮）：§13.2 聚焦证据套件复跑（含 residual 250–559
> goal/knowledge waiting_approval-only 锁，不改 checkbox）——**105 文件 / 647 测试**（app-vue 26/254、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 558：app-vue +0 file / +1 test（goal/knowledge waiting_approval confirm 锁）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百六十一轮）：Host panel **goal/knowledge approve pre-lifecycle sole product + waiting_approval gate**（仍不打勾）——
> canHostApproveProductAgentRun 在 dispatchHostProposalDecision 前 fail-closed（防 approve-then-silent-noop；555/557/559 对称）；
> unit + surface + scaffold/driver Residual 561 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百六十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–561
> Host panel approve pre-lifecycle product gate 锁，不改 checkbox）——**105 文件 / 651 测试**（app-vue 26/258、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 560：app-vue +0 file / +4 tests（Host approve pre-lifecycle gate unit+surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百六十三轮）：Host panel **task.create approve pre-lifecycle sole create_task_template gate**（仍不打勾）——
> session-owned task.create 经 canHostApproveProductAgentRun 后才 Host lifecycle（纯 domain createTemplate fallback 仍放行；561 对称）；
> unit + surface + scaffold/driver Residual 563 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百六十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–563
> Host panel task approve pre-lifecycle product gate 锁，不改 checkbox）——**105 文件 / 653 测试**（app-vue 26/260、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 562：app-vue +0 file / +2 tests（task Host approve pre-lifecycle unit+surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百六十五轮）：Host panel **product reject pre-lifecycle waiting_approval gate**（仍不打勾）——
> canHostRejectProductAgentRun 在 dispatchHostProposalDecision(reject) 前 fail-closed（防 reject-then-silent-noop；477/559/561 对称）；
> orphan task client-settle 仍放行；unit + surface + scaffold/driver Residual 565 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百六十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–565
> Host panel product reject pre-lifecycle waiting_approval 锁，不改 checkbox）——**105 文件 / 655 测试**（app-vue 26/262、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 564：app-vue +0 file / +2 tests（Host reject pre-lifecycle unit+surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百六十七轮）：Host panel **product revise pre-lifecycle waiting_approval gate**（仍不打勾）——
> canHostReviseProductAgentRun 在 dispatchHostProposalRevise 前 fail-closed（防 revise-then-silent-noop；481/565/561 对称）；
> dirty-only + task process-local edit 保留；unit + surface + scaffold/driver Residual 567 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百六十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–567
> Host panel product revise pre-lifecycle waiting_approval 锁，不改 checkbox）——**105 文件 / 657 测试**（app-vue 26/264、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 566：app-vue +0 file / +2 tests（Host revise pre-lifecycle unit+surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百六十九轮）：Host panel **shared product ownership resolver**（仍不打勾）——
> `resolveHostPanelOwnedProductRun` 统一 approve/reject/revise 的 session-owned AgentRun + productTool 解析
> （goal→create_goal / knowledge→create_knowledge_note / task→create_task_template 或 goal 同 runId；
> orphan task → null 仍 client-settle）；防双路径 ownership 漂移；unit + surface + scaffold/driver Residual 569 锁；
> 非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百七十轮）：§13.2 聚焦证据套件复跑（含 residual 250–569
> Host panel shared product ownership resolver 锁，不改 checkbox）——**105 文件 / 660 测试**（app-vue 26/267、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 568：app-vue +0 file / +3 tests（Host ownership resolver unit+surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百七十一轮）：Host panel **settlement reuses shared ownership resolver**（仍不打勾）——
> approve/reject/revise 将 `resolveHostPanelOwnedProductRun` 结果 hoist 到 gate + settlement；
> task 确认/取消/complete/process-local revise 按 `owned.productTool` 分支（禁 dual isTaskAgentType/liveHost 再解析）；
> unit + surface + scaffold/driver Residual 571 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百七十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–571
> Host panel settlement reuses shared ownership resolver 锁，不改 checkbox）——**105 文件 / 661 测试**（app-vue 26/268、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 570：app-vue +0 file / +1 test（Host settlement ownership surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百七十三轮）：Host panel **revise sole product draftAction gate**（仍不打勾）——
> `canHostReviseProductAgentRun` 要求 waiting_approval + sole product（approve residual 561/563 对称；
> 防 Host revise-then-process-local silent-noop；reject 仍仅 WA）；unit + surface + scaffold/driver Residual 573 锁；
> 非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百七十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–573
> Host panel revise sole product draftAction 锁，不改 checkbox）——**105 文件 / 663 测试**（app-vue 26/270、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 572：app-vue +0 file / +2 tests（Host revise sole product unit+surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百七十五轮）：goal session **primary-task confirm sole create_task_template**（仍不打勾）——
> `resumeGoalAgentRun` 在 isPrimaryTaskHostAgentRun 路径要求 sole create_task_template（task residual 547 /
> Host residual 563 对称；非 primary 仍 sole create_goal residual 557）；surface + scaffold/driver Residual 575 锁；
> 非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百七十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–575
> goal session primary-task confirm sole create_task_template 锁，不改 checkbox）——**105 文件 / 664 测试**（app-vue 26/271、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 574：app-vue +0 file / +1 test（primary-task sole product surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百七十七轮）：Host panel **primary-task-shaped ownership → create_task_template**（仍不打勾）——
> `resolveHostPanelOwnedProductRun` 将 isPrimaryTaskHostAgentRun 映射为 create_task_template（禁误标 create_goal）；
> Host 面板 gate/settlement 使用 liveHostWorkbenchAgentRuns 独占 lane；unit + surface + scaffold/driver Residual 577 锁；
> 非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百七十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–577
> Host panel primary-task-shaped ownership → create_task_template 锁，不改 checkbox）——**105 文件 / 666 测试**（app-vue 26/273、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 576：app-vue +0 file / +2 tests（primary-task ownership unit+surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百七十九轮）：Host panel **primary-task-shaped settlement via goal session**（仍不打勾）——
> create_task_template ownership 但 agentType≠task.create 时 approve/reject 走 confirmGoal/cancelGoal
> （禁 process-local task store silent-noop）；AgentType task.create 仍 process-local complete/cancel/revise；
> surface + scaffold/driver Residual 579 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百八十轮）：§13.2 聚焦证据套件复跑（含 residual 250–579
> Host panel primary-task-shaped settlement via goal session 锁，不改 checkbox）——**105 文件 / 667 测试**（app-vue 26/274、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 578：app-vue +0 file / +1 test（primary-task settlement surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百八十一轮）：Host panel **settlement ownership classifiers**（仍不打勾）——
> `isHostPanelProcessLocalTaskCreateOwned` / `isHostPanelGoalSessionProductOwned` 统一 approve/reject/revise
> 结算分支（防 dual agentType 再分支漂移；residual 579 规则进共享谓词）；unit + surface + scaffold/driver Residual 581 锁；
> 非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百八十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–581
> Host panel settlement ownership classifiers 锁，不改 checkbox）——**105 文件 / 669 测试**（app-vue 26/276、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 580：app-vue +0 file / +2 tests（settlement classifiers unit+surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百八十三轮）：goal session **primary-task confirm 转发 Host-revised goalId**（仍不打勾）——
> `resumeGoalAgentRun` → `buildGoalAgentApprovalPayload` 传入 `goalId: hostOptions?.goalId`（防 residual 579 结算路径静默丢弃
> linked goalId；title/description residual 365 对称）；Host panel approve goal-source / goal-session task 路径注释锁；
> surface + scaffold/driver Residual 583 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百八十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–583
> goal session primary-task goalId forward 锁，不改 checkbox）——**105 文件 / 670 测试**（app-vue 26/277、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 582：app-vue +0 file / +1 test（primary-task goalId forward surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百八十五轮）：Host workbench **primary-task exclusive kind routing**（仍不打勾）——
> focus/reopen 用 `isPrimaryTaskHostAgentRun`（禁 bare `isTaskShaped` 把 normal goal+companion 误标 task.create proposalId）；
> proposal/receipt builders 内化 exclusive lane（防 dual row / create_goal 误标 primary-task）；unit + surface + scaffold/driver Residual 585 锁；
> 非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百八十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–585
> Host workbench primary-task exclusive kind routing 锁，不改 checkbox）——**105 文件 / 674 测试**（app-vue 26/281、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 584：app-vue +0 file / +4 tests（primary-task exclusive kind unit×3 + surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百八十七轮）：goal session **Host lifecycle kind primary-task → task.create**（仍不打勾）——
> `resumeGoalAgentRun` ActionBar confirm/cancel 与 residual 585 exclusive workbench proposalId 对齐（`hostProposalKind`；禁
> 始终 goal.create 导致 bridge 分叉）；surface + scaffold/driver Residual 587 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百八十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–587
> goal session Host lifecycle kind primary-task 锁，不改 checkbox）——**105 文件 / 675 测试**（app-vue 26/282、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 586：app-vue +0 file / +1 test（Host lifecycle kind surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百八十九轮）：exclusive task lane **dual-mirror primary-task goal session settle**（仍不打勾）——
> `nextDualMirroredTaskAgentRun` / goalAgentRun watch 在 confirm/cancel 后刷新 taskAgentRun（防 exclusive 仍挂 stale
> waiting_approval proposal）；unit + surface + scaffold/driver Residual 589 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百九十轮）：§13.2 聚焦证据套件复跑（含 residual 250–589
> dual-mirror primary-task goal session settle 锁，不改 checkbox）——**105 文件 / 679 测试**（app-vue 26/286、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 588：app-vue +0 file / +4 tests（dual-mirror unit×3 + surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百九十一轮）：exclusive task lane dual-mirror **process-local task.create 优先**（仍不打勾）——
> `nextDualMirroredTaskAgentRun` 先保留 `agentType === 'task.create'` 独占车道，再 dual-mirror primary-task goal；
> 避免 goal session settle 覆盖活跃 process-local task.create；unit + surface + scaffold/driver Residual 591 锁；
> 非跨端 multi-engine E2E / 跨进程 durable。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百九十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–591
> dual-mirror process-local task.create 优先锁，不改 checkbox）——**105 文件 / 681 测试**（app-vue 26/288、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 590：app-vue +0 file / +2 tests（process-local-first unit + surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百九十三轮）：session restore **dual-mirror exclusive task before focus**（仍不打勾）——
> `restoreWorkflowState` 在 storage + refresh 后重跑 `nextDualMirroredTaskAgentRun`（防 goal 赋值后 task 覆盖 stale dual-mirror）；
> `resolveHostWorkbenchFocusFromSessionRuns` dual-mirror + exclusive-promote 再 focus（surface 对齐 receipt/proposal）；
> unit + surface + scaffold/driver Residual 593 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百九十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–593
> session restore dual-mirror focus 锁，不改 checkbox）——**105 文件 / 683 测试**（app-vue 26/290、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 592：app-vue +0 file / +2 tests（session dual-mirror focus unit + surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百九十五轮）：live exclusive **dual-mirror before builders**（仍不打勾）——
> `resolveLiveHostWorkbenchAgentRuns` 先 `nextDualMirroredTaskAgentRun`（`dropStaleWhenGoalLeaves: false`，防 task-only builder 误清）再 exclusive-promote；
> pending/receipt 不再对 settled goal 保留 stale waiting_approval dual-mirror；unit + surface + scaffold/driver Residual 595 锁；
> 非跨端 multi-engine E2E / 跨进程 durable。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百九十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–595
> live exclusive dual-mirror builders 锁，不改 checkbox）——**105 文件 / 685 测试**（app-vue 26/292、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 594：app-vue +0 file / +2 tests（live dual-mirror builders unit + surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百九十七轮）：Host panel ownership **dual-mirror exclusive before match**（仍不打勾）——
> `resolveHostPanelOwnedProductRun` 先 `resolveLiveHostWorkbenchAgentRuns` 再匹配 source/runId；stale dual-mirror waiting 不再对 settled goal approve；
> goal-source primary-task 在 exclusive promote 后仍可达；unit + surface + scaffold/driver Residual 597 锁；
> 非跨端 multi-engine E2E / 跨进程 durable。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留五百九十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–597
> Host panel ownership dual-mirror exclusive 锁，不改 checkbox）——**105 文件 / 688 测试**（app-vue 26/295、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 596：app-vue +0 file / +3 tests（ownership dual-mirror unit×2 + surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留五百九十九轮）：exclusive **drop dual-mirror primary-task ghost beside normal goal**（仍不打勾）——
> `nextDualMirroredTaskAgentRun` 在 builders（dropStale=false）下，当非 primary-task goal session 存在时仍丢弃 dual-mirror ghost；
> 防 normal goal.create + stale task.create 双行；process-local task.create 保留；unit + surface + scaffold/driver Residual 599 锁；
> 非跨端 multi-engine E2E / 跨进程 durable。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百轮）：§13.2 聚焦证据套件复跑（含 residual 250–599
> dual-mirror primary-task ghost drop 锁，不改 checkbox）——**105 文件 / 690 测试**（app-vue 26/297、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 598：app-vue +0 file / +2 tests（ghost drop unit + surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留六百零一轮）：exclusive **knowledge ghost drop + focus exclusive-only**（仍不打勾）——
> `nextDualMirroredTaskAgentRun` 接收 `noteAgentRun`，knowledge session 旁丢弃 dual-mirror ghost；
> `resolveHostWorkbenchFocusFromSessionRuns` 仅走 exclusive（避免 default dropStale 清掉 task-only dual-mirror）；
> restore 传 note；unit + surface + scaffold/driver Residual 601 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百零二轮）：§13.2 聚焦证据套件复跑（含 residual 250–601
> knowledge ghost drop + focus exclusive-only 锁，不改 checkbox）——**105 文件 / 692 测试**（app-vue 26/299、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 600：app-vue +0 file / +2 tests（knowledge ghost unit + surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留六百零三轮）：Host **knowledge classifier + AgentRun history session focus**（仍不打勾）——
> `isHostPanelKnowledgeSessionProductOwned`；approve/reject knowledge settle 经 classifier；goal watch 传 note；
> `selectAgentRun` 优先 session exclusive focus；unit + surface + scaffold/driver Residual 603 锁；
> 非跨端 multi-engine E2E / 跨进程 durable。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百零四轮）：§13.2 聚焦证据套件复跑（含 residual 250–603
> knowledge classifier + history session focus 锁，不改 checkbox）——**105 文件 / 694 测试**（app-vue 26/301、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 602：app-vue +0 file / +2 tests（knowledge classifier unit + surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留六百零五轮）：Host **knowledge process-local edit revise**（仍不打勾）——
> `reviseKnowledgeNoteAgentRun`（sole create_knowledge_note + waiting_approval + knowledge.generate）；
> Host revise 经 `isHostPanelKnowledgeSessionProductOwned` 后 process-local edit resume；
> unit/surface 锁 + scaffold/driver Residual 605；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百零六轮）：§13.2 聚焦证据套件复跑（含 residual 250–605
> knowledge process-local edit revise 锁，不改 checkbox）——**105 文件 / 695 测试**（app-vue 26/302、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 604：app-vue +0 file / +1 test（knowledge process-local revise surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留六百零七轮）：Host **goal-session process-local edit revise**（仍不打勾）——
> `reviseGoalAgentRun`（sole create_goal / primary-task create_task_template + waiting_approval）；
> Host revise 经 `isHostPanelGoalSessionProductOwned` 后 process-local edit resume；
> `buildGoalAgentApprovalPayload` 支持 edit；surface + scaffold/driver Residual 607 锁；
> 非跨端 multi-engine E2E / 跨进程 durable。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百零八轮）：§13.2 聚焦证据套件复跑（含 residual 250–607
> goal-session process-local edit revise 锁，不改 checkbox）——**105 文件 / 696 测试**（app-vue 26/303、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 606：app-vue +0 file / +1 test（goal-session process-local revise surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留六百零九轮）：Host **dirty approve process-local revise before confirm**（仍不打勾）——
> `shouldReviseKnowledgeSessionDraftBeforeConfirm` / `shouldReviseGoalSessionDraftBeforeConfirm`；
> dirty Host approve 在 product confirm 前经 classifier 调用 reviseGoal/Knowledge；
> unit + surface + scaffold/driver Residual 609 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百一十轮）：§13.2 聚焦证据套件复跑（含 residual 250–609
> dirty approve process-local revise before confirm 锁，不改 checkbox）——**105 文件 / 699 测试**（app-vue 26/306、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 608：app-vue +0 file / +3 tests（residual 609 unit×2 + surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留六百一十一轮）：Host **default workbench focus exclusive session**（仍不打勾）——
> `resolveDefaultHostWorkbenchFocusProposalId`（session exclusive task>goal>knowledge 优先，builder row 回退）；
> residual 443 auto-open watch 经 helper；ADR-035 scaffold residual 443 token 收口；
> unit + surface + scaffold/driver Residual 611 锁；非跨端 multi-engine E2E / 跨进程 durable。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百一十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–611
> exclusive default Host workbench focus 锁，不改 checkbox）——**105 文件 / 702 测试**（app-vue 26/309、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 610：app-vue +0 file / +3 tests（residual 611 unit×2 + surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留六百一十三轮）：Host **proposal/receipt exclusive session order**（仍不打勾）——
> `buildPendingHostProposalItems` / `buildHostExecutionReceiptItems` 输出 task > goal > knowledge；
> 对齐 residual 611 default focus / residual 603 selectAgentRun 优先级；unit + surface + scaffold Residual 613 锁；
> 非跨端 multi-engine E2E / 跨进程 durable。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百一十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–613
> exclusive Host proposal/receipt order 锁，不改 checkbox）——**105 文件 / 705 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 11/29、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 612：app-vue +0 file / +3 tests（residual 613 unit×2 + surface）；ai/data-portability 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留六百一十五轮）：删除 contracts `ActionResult` **双轨死表面**（仍不打勾）——
> 移除 `packages/contracts/src/result/action.ts` 与 `actionOk`/`actionFail`/`isActionOk` 等 re-export；
> 传输真值仅 `Result` / `IpcResult` / `HttpResponse`；surface Residual 615 锁；无运行时消费者。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百一十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–615
> ActionResult dual-track retired 锁，不改 checkbox）——**106 文件 / 708 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 12/32、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 614：contracts +1 file / +3 tests（residual 615 surface）；app-vue/ai 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留六百一十七轮）：对齐 Result ADR **文档双轨收口**（仍不打勾）——
> ADR-008/010/012/030 不再处方 `ActionResult`/`CountResult` 双轨；传输真值 `Result`/`IpcResult`/`HttpResponse`；
> contracts `result-adr-alignment.surface.spec.ts` Residual 617 锁；承接 residual 615 代码删除。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百一十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–617
> Result ADR alignment 锁，不改 checkbox）——**107 文件 / 710 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 13/34、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 616：contracts +1 file / +2 tests（residual 617 surface）；app-vue/ai 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留六百一十九轮）：对齐 route ADR **response 包死引用**（仍不打勾）——
> ADR-021/022 样例改为 `createHttpResponseBuilder`（`@dailyuse/contracts/result`）；
> 不再 import 已删除的 `@dailyuse/contracts/response`；surface Residual 619 锁；承接 residual 615/617。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百二十轮）：§13.2 聚焦证据套件复跑（含 residual 250–619
> ADR route response package retirement 锁，不改 checkbox）——**107 文件 / 711 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 13/35、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 618：contracts +0 file / +1 test（residual 619 surface）；app-vue/ai 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留六百二十一轮）：API `POST /logs` **Result 信封收口**（仍不打勾）——
> `logs.controller` 去掉 `{ success: boolean }` 双轨，改用 `createApiResponseBuilder`/`HttpResponse`；
> unit + surface Residual 621 锁；运维探针 `/healthz` 形状不变。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百二十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–621
> POST /logs Result envelope 锁，不改 checkbox）——**109 文件 / 716 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 13/35、api 2/5、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 620：api +2 files / +5 tests（residual 621 unit×3 + surface×2）；app-vue/contracts 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留六百二十三轮）：API `GET /metrics/json` **Result 信封收口**（仍不打勾）——
> `metrics.controller.getJson` 使用 `createApiResponseBuilder`/`HttpResponse`；Prometheus `/metrics` 保持 text/plain；
> unit + surface Residual 623 锁；承接 residual 621 logs 信封一致性。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百二十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–623
> /metrics/json Result envelope 锁，不改 checkbox）——**111 文件 / 720 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 13/35、api 4/9、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 622：api +2 files / +4 tests（residual 623 unit×2 + surface×2）；app-vue/contracts 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留六百二十五轮）：API `GET /info` **Result 信封收口**（仍不打勾）——
> `info.controller` 使用 `createApiResponseBuilder`/`HttpResponse`；payload 在 `data`；
> K8s `/healthz`/`/readyz` 保持非 Result 探针形状；unit + surface Residual 625 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百二十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–625
> GET /info Result envelope 锁，不改 checkbox）——**113 文件 / 724 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 13/35、api 6/13、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 624：api +2 files / +4 tests（residual 625 unit×1 + surface×3）；app-vue/contracts 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留六百二十七轮）：API 全局错误中间件 **Result 信封收口**（仍不打勾）——
> `applyErrorHandlers` 404 + 全局 error 使用 `createApiResponseBuilder`/`HttpResponse`；
> 与 `expressAdapter` 对齐；K8s 探针仍非 Result；unit + surface Residual 627 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百二十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–627
> error middleware Result envelope 锁，不改 checkbox）——**115 文件 / 730 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 13/35、api 8/19、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 626：api +2 files / +6 tests（residual 627 unit×4 + surface×2）；app-vue/contracts 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留六百二十九轮）：API PowerSync `GET /schema` **Result 信封收口**（仍不打勾）——
> 使用 `createApiResponseBuilder`/`HttpResponse`；payload 在 `data`（`powersync_url`/`configured`）；
> 去掉部分 `{ ok, data }` 双轨；unit + surface Residual 629 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百三十轮）：§13.2 聚焦证据套件复跑（含 residual 250–629
> PowerSync /schema Result envelope 锁，不改 checkbox）——**117 文件 / 735 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 13/35、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 628：api +2 files / +5 tests（residual 629 module unit×3 + surface×2）；app-vue/contracts 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留六百三十一轮）：contracts schedule **操作响应双轨收口**（仍不打勾）——
> 删除 `ScheduleOperationSuccessResponseDTO`/`ScheduleErrorResponseDTO`；
> `schedule:delete` / `schedule-task:delete` RPC 成功体为 `null`（与 governance/reminder void delete 一致）；
> surface Residual 631 锁。非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百三十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–631
> schedule operation dual DTO retired 锁，不改 checkbox）——**117 文件 / 737 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 13/37、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 630：contracts +0 files / +2 tests（residual 631 surface×2）；api 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留六百三十三轮）：contracts setting **SettingOperationRes 双轨收口**（仍不打勾）——
> 删除 `{ ok, message? }` 死表面；setting 变更成功体仍为 `UserSettingClientDTO` / Result 信封；
> surface Residual 633 锁。非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百三十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–633
> SettingOperationRes dual retired 锁，不改 checkbox）——**118 文件 / 739 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 14/39、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 632：contracts +1 file / +2 tests（residual 633 surface×2）；api 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留六百三十五轮）：contracts reminder **操作响应双轨收口**（仍不打勾）——
> 删除 `ReminderOperationRes`/`ReminderTriggerRes` `{ ok }` 死表面与未使用 `TemplateScheduleStatusRes`；
> control 成功体仍为 DTO/`void`/Result；surface Residual 635 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百三十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–635
> reminder operation dual retired 锁，不改 checkbox）——**119 文件 / 741 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 15/41、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 634：contracts +1 file / +2 tests（residual 635 surface×2）；api 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留六百三十七轮）：contracts auth **AuthOperationResult 双轨收口**（仍不打勾）——
> 删除通用 `{ ok, error? }` 死表面与 protocol/desktop 再导出；具体桌面流保留 typed `*Result` DTO；
> surface Residual 637 锁。非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百三十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–637
> AuthOperationResult dual retired 锁，不改 checkbox）——**120 文件 / 745 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 16/45、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 636：contracts +1 file / +4 tests（desktop-auth.types.surface 含 residual 70+637）；api 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留六百三十九轮）：contracts **BatchOperationResponseDTO 双名收口**（仍不打勾）——
> 删除 shared 死表面 `BatchOperationResponseDTO`；schedule 重命名为 `ScheduleBatchOperationResponseDTO` +
> `ScheduleBatchOperationResponseSchema`；surface Residual 639 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百四十轮）：§13.2 聚焦证据套件复跑（含 residual 250–639
> BatchOperationResponseDTO dual name retired 锁，不改 checkbox）——**120 文件 / 747 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 16/47、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 638：contracts +0 files / +2 tests（residual 639 surface×2）；api 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留六百四十一轮）：contracts shared/dtos **死表面清零**（仍不打勾）——
> 删除零消费者 `ChartDataDTO`；`shared/dtos` 仅保留空 barrel + surface Residual 641 锁；
> 承接 residual 639 batch dual 删除。非跨端 multi-engine E2E / 全量 PR 门禁。
> 状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百四十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–641
> shared/dtos dead dual retired 锁，不改 checkbox）——**121 文件 / 749 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 17/49、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 640：contracts +1 file / +2 tests（residual 641 surface×2）；api 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留六百四十三轮）：contracts shared **UI 死双轨收口**（仍不打勾）——
> 删除零消费者 `SimpleEditorTab`（遗留笔记编辑器 UI）与 `ContextMenuItem`；移除 `ui-components` barrel；
> surface Residual 643 锁。非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百四十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–643
> shared UI editor dual retired 锁，不改 checkbox）——**122 文件 / 751 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 18/51、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 642：contracts +1 file / +2 tests（residual 643 surface×2）；api 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留六百四十五轮）：contracts shared **配置 VO / 错误 schema 双轨收口**（仍不打勾）——
> 删除零消费者 shared Reminder/Notification/Schedule config + NotifyChannel 双 VO；
> 删除 `ZodErrorResponse`/`PaginationQuery`/`Paginated` 死表面；保留 Importance/Urgency/Priority + ClientInfo/UserAgreement；
> surface Residual 645 锁。非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百四十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–645
> shared dual config/error schema retired 锁，不改 checkbox）——**123 文件 / 754 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 19/54、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 644：contracts +1 file / +3 tests（residual 645 surface×3）；api 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留六百四十七轮）：contracts **Summary 双轨死表面收口**（仍不打勾）——
> 删除零消费者 `AIProviderConfigSummary`/`AIProviderConfigSummarySchema`（list 仅 ClientDTO）；
> 删除 `ReminderTemplateSummaryDTO`/`ReminderDashboardDTO`、`GoalTimeRangeSummary` 死 dual；
> surface Residual 647 锁。非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百四十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–647
> provider/reminder/goal Summary dual retired 锁，不改 checkbox）——**124 文件 / 758 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 20/58、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 646：contracts +1 file / +4 tests（residual 647 surface×4）；api 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-22（阶段 6 残留六百四十九轮）：contracts task **依赖/子任务 Server 双轨收口**（仍不打勾）——
> 删除零消费者 `TaskTemplateWithDependencies*DTO` 双轨、`DependencyChainServerDTO`、`SubtaskServerDTO`；
> 保留 `TaskDependencyServerDTO`/`CircularDependencyValidationResult`/`DependencyChainClientDTO`/`SubtaskClientDTO`；
> surface Residual 649 锁。非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-22（阶段 6 残留六百五十轮）：§13.2 聚焦证据套件复跑（含 residual 250–649
> task dependency/subtask server dual retired 锁，不改 checkbox）——**125 文件 / 760 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 21/60、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 648：contracts +1 file / +2 tests（residual 649 surface×2）；api 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留六百五十一轮）：contracts governance **RuleServerDTO 双轨收口**（仍不打勾）——
> 删除零消费者 `RuleServerDTO`/`rule-server.ts`；API/domain 仅 `RuleClientDTO`；
> seed liveReference + module-index 对齐 rule-client；surface Residual 651 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留六百五十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–651
> governance RuleServerDTO dual retired 锁，不改 checkbox）——**126 文件 / 762 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 22/62、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 650：contracts +1 file / +2 tests（residual 651 surface×2）；api 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留六百五十三轮）：contracts schedule **Static/Dashboard 双轨收口**（仍不打勾）——
> 删除零消费者 `ScheduleTaskServerStatic`/`ScheduleExecutionServerStatic` 工厂 dual；
> 删除 `ScheduleDashboardDTO` 死表面（dtos 空 barrel）；surface Residual 653 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留六百五十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–653
> schedule Static/Dashboard dual retired 锁，不改 checkbox）——**127 文件 / 765 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 23/65、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 652：contracts +1 file / +3 tests（residual 653 surface×3）；api 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留六百五十五轮）：contracts **entities 双轨 re-export 收口**（仍不打勾）——
> 删除 account `entities/` 对 aggregates AccountClient/ServerDTO 的 dual re-export；
> 删除 goal `entities/` 对 `GoalRecordClientDTO` aggregates dual re-export；
> surface Residual 655 锁。非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留六百五十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–655
> entities dual re-export retired 锁，不改 checkbox）——**128 文件 / 767 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 24/67、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 654：contracts +1 file / +2 tests（residual 655 surface×2）；api 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留六百五十七轮）：contracts setting **SettingOverviewDTO 双轨收口**（仍不打勾）——
> 删除零消费者 `SettingOverviewDTO`/`setting-overview.dto.ts`；setting/dtos 空 barrel；
> 保留 `UserSettingClientDTO`/preference API；surface Residual 657 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留六百五十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–657
> SettingOverviewDTO dual retired 锁，不改 checkbox）——**129 文件 / 769 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 25/69、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 656：contracts +1 file / +2 tests（residual 657 surface×2）；api 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留六百五十九轮）：contracts notification **模板 VO 双轨收口**（仍不打勾）——
> 删除零消费者 `NotificationTemplateDTO`/`SnoozeSessionDTO` 死 dual；
> 保留 `NotificationTemplateConfigServerDTO` + aggregate Client/Server DTO；surface Residual 659 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留六百六十轮）：§13.2 聚焦证据套件复跑（含 residual 250–659
> notification template VO dual retired 锁，不改 checkbox）——**130 文件 / 771 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 26/71、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 658：contracts +1 file / +2 tests（residual 659 surface×2）；api 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留六百六十一轮）：contracts **空 dual barrel re-export 收口**（仍不打勾）——
> account/schedule/setting 模块根不再 re-export 空 entities/dtos dual barrel；
> 保留 residual note 空 barrel 文件；surface Residual 661 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留六百六十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–661
> empty dual barrel re-export retired 锁，不改 checkbox）——**131 文件 / 774 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 27/74、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 660：contracts +1 file / +3 tests（residual 661 surface×3）；api 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留六百六十三轮）：contracts schedule **死 list/stats ResponseDTO + detect-conflicts 包装双轨收口**（仍不打勾）——
> 删除零消费者 Schedule 任务/执行 list 与 history-stats ResponseDTO 双轨；detect-conflicts 不再提供 `{ result }` 包装 DTO/Schema，
> OpenAPI/RPC/client 统一 `ConflictDetectionResult`；surface Residual 663 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留六百六十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–663
> schedule list/stats + detect-conflicts dual retired 锁，不改 checkbox）——**131 文件 / 776 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 27/76、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 662：contracts 同文件数 / +2 tests（residual 663 surface×2）；api 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留六百六十五轮）：contracts/schedule **batch-delete OpenAPI schema 双轨收口**（仍不打勾）——
> 删除与 `ScheduleBatchOperationResponseSchema` 同形的 batch-delete schema 双轨；`/tasks/batch` 与 `/tasks/batch/delete`
> 共用单 schema；surface Residual 665 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留六百六十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–665
> schedule batch-delete OpenAPI schema dual retired 锁，不改 checkbox）——**131 文件 / 778 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 27/78、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 664：contracts 同文件数 / +2 tests（residual 665 surface×2）；api 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留六百六十七轮）：contracts task **bind-to-goal 请求 schema 双轨收口**（仍不打勾）——
> 删除与 `TaskGoalBindingSchema` 同形的 `BindToGoalSchema` 双轨 body；bind-goal OpenAPI/controller 仅用
> `TaskGoalBindingSchema`；保留 `BindToGoalReq` 语义类型；surface Residual 667 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留六百六十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–667
> task bind-to-goal request schema dual retired 锁，不改 checkbox）——**132 文件 / 780 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 28/80、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 666：contracts +1 file / +2 tests（residual 667 surface×2）；api 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留六百六十九轮）：contracts repository **sync 请求 params schema 双轨收口**（仍不打勾）——
> 删除与 `KnowledgeRepositoryConnectionParamsSchema` 同形的 `SyncKnowledgeRepositorySchema` 双轨 body；
> `SyncKnowledgeRepositoryReq` 与 Desktop sync parse 共用 connection params；surface Residual 669 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留六百七十轮）：§13.2 聚焦证据套件复跑（含 residual 250–669
> knowledge sync params dual retired 锁，不改 checkbox）——**133 文件 / 783 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 29/83、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 668：contracts +1 file / +3 tests（residual 669 surface×3）；api 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留六百七十一轮）：contracts notification **id-batch 请求 schema 双轨收口**（仍不打勾）——
> 删除同形 mark-read / batch-delete 请求 schema 双轨 body；统一 `NotificationIdsBatchSchema`；
> 保留 `MarkAsReadBatchReq` / `DeleteNotificationsBatchReq` 语义类型；surface Residual 671 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留六百七十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–671
> notification id-batch dual retired 锁，不改 checkbox）——**134 文件 / 785 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 30/85、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 670：contracts +1 file / +2 tests（residual 671 surface×2）；api 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留六百七十三轮）：contracts ai **conversation name 请求 schema 双轨收口**（仍不打勾）——
> 删除同形 create/update conversation name body 双轨；统一 `ConversationNameSchema`；
> 保留 `CreateConversationReq` / `UpdateConversationReq` 语义类型；surface Residual 673 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留六百七十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–673
> AI conversation name dual retired 锁，不改 checkbox）——**135 文件 / 787 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 31/87、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 672：contracts +1 file / +2 tests（residual 673 surface×2）；api 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留六百七十五轮）：contracts repository **list projection filter schema 双轨收口**（仍不打勾）——
> 删除 note/attachment 同形 list filter 双轨 body；统一 `ListKnowledgeProjectionsSchema`；
> 保留 note/attachment Req 语义类型；surface Residual 675 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留六百七十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–675
> knowledge list projection filter dual retired 锁，不改 checkbox）——**136 文件 / 789 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 32/89、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 674：contracts +1 file / +2 tests（residual 675 surface×2）；api 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留六百七十七轮）：contracts goal **goalId list params schema 双轨收口**（仍不打勾）——
> 删除 reviews/key-results 同形 `{ goalId }` list 请求双轨 body；统一 `GoalIdParamsSchema`；
> 保留 `GetGoalReviewsReq` / `GetKeyResultsReq` 语义类型；surface Residual 677 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留六百七十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–677
> goal list params dual retired 锁，不改 checkbox）——**137 文件 / 791 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 33/91、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 676：contracts +1 file / +2 tests（residual 677 surface×2）；api 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留六百七十九轮）：contracts/schedule **detect-conflicts response schema 名称双轨收口**（仍不打勾）——
> 删除 `DetectConflictsResponseSchema` 别名；detect/get-conflicts OpenAPI 直接使用 `ConflictDetectionResultSchema`；
> surface Residual 679 锁（并更新 residual 663 不再锁别名形式）。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留六百八十轮）：§13.2 聚焦证据套件复跑（含 residual 250–679
> detect-conflicts response schema name dual retired 锁，不改 checkbox）——**137 文件 / 793 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 33/93、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 678：contracts +0 file / +2 tests（residual 679 surface×2）；api 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留六百八十一轮）：governance **OpenAPI response schema 名称双轨收口**（仍不打勾）——
> 删除 `governance-route-shared` 本地 `RuleResponseSchema` / list/search/revisions 别名；
> 路由直接使用 contracts `RuleClientDTOSchema` / `ListRulesResSchema` / `SearchRulesResSchema` / `GetRuleRevisionsResSchema`；
> surface Residual 681 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留六百八十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–681
> governance OpenAPI response schema name dual retired 锁，不改 checkbox）——**138 文件 / 795 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 33/93、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 680：governance +1 file / +2 tests（residual 681 surface×2）；contracts 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留六百八十三轮）：contracts ai **provider create schema 名称双轨收口**（仍不打勾）——
> 删除私有 base schema 别名；`CreateAIProviderConfigSchema` 直接持有 create body；
> 保留 `CreateAIProviderConfigReq`；surface Residual 683 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留六百八十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–683
> AI provider create schema name dual retired 锁，不改 checkbox）——**139 文件 / 797 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 34/95、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 682：contracts +1 file / +2 tests（residual 683 surface×2）；governance 不变。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留六百八十五轮）：contracts authentication **credential server 双轨收口**（仍不打勾）——
> 删除 `AuthCredentialServer` dual 文件/导出；`AuthIdentityServerDTO.credentials` 与 Prisma/PowerSync mappers
> 统一 `PasswordCredentialServerDTO`；surface Residual 685 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留六百八十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–685
> auth credential server dual retired 锁，不改 checkbox）——**140 文件 / 799 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 35/97、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 684：contracts +1 file / +2 tests（residual 685 surface×2）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留六百八十七轮）：contracts authentication **base credential server 双轨收口**（仍不打勾）——
> 删除 base credential dual 文件；`PasswordCredentialServerDTO` 直接持有完整 server 凭证字段；
> surface Residual 687 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留六百八十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–687
> auth base credential server dual retired 锁，不改 checkbox）——**141 文件 / 800 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 36/98、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 686：contracts +1 file / +1 test（residual 687 surface×1）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留六百八十九轮）：contracts goal **list response schema 双轨收口**（仍不打勾）——
> 删除 key-result/record/review list `Get*Res` 接口 dual body；统一 `z.infer` of `*ListResSchema`
> （ClientDTO 列表；复盘不再误用 server review DTO）；surface Residual 689 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留六百九十轮）：§13.2 聚焦证据套件复跑（含 residual 250–689
> goal list response dual retired 锁，不改 checkbox）——**142 文件 / 802 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 37/100、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 688：contracts +1 file / +2 tests（residual 689 surface×2）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留六百九十一轮）：contracts ai **chat list response schema 双轨收口**（仍不打勾）——
> 删除 ConversationListRes / MessageListRes 接口 dual body；统一 `z.infer` of `*ListResSchema`
> （ClientDTO 列表）；surface Residual 691 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留六百九十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–691
> ai chat list response dual retired 锁，不改 checkbox）——**143 文件 / 805 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 38/103、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 690：contracts +1 file / +3 tests（residual 691 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留六百九十三轮）：contracts reminder **list response schema 双轨收口**（仍不打勾）——
> 删除 ReminderTemplateListRes / ReminderGroupListRes 接口 dual body；统一 `z.infer` of `*ListResponseSchema`；
> surface Residual 693 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留六百九十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–693
> reminder list response dual retired 锁，不改 checkbox）——**144 文件 / 808 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 39/106、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 692：contracts +1 file / +3 tests（residual 693 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留六百九十五轮）：contracts ai **response Res schema 双轨收口**（仍不打勾）——
> 删除 SendMessage / ListAIProviderConfigs / QueryAnalytics / QueryKnowledge / ExpandKnowledge /
> CreateKnowledgeNote `*Res` 接口 dual body；统一 `z.infer` of `*ResSchema`；surface Residual 695 锁；
> 同步 residual 647 list 断言至 z.infer alias。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留六百九十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–695
> ai response Res dual retired 锁，不改 checkbox）——**145 文件 / 811 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 40/109、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 694：contracts +1 file / +3 tests（residual 695 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留六百九十七轮）：contracts task **check-expired instances response schema 双轨收口**（仍不打勾）——
> 删除 CheckExpiredTaskInstancesRes 接口 dual body；统一 `z.infer` of `CheckExpiredTaskInstancesResponseSchema`；
> surface Residual 697 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留六百九十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–697
> task check-expired Res dual retired 锁，不改 checkbox）——**146 文件 / 814 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 41/112、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 696：contracts +1 file / +3 tests（residual 697 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留六百九十九轮）：contracts repository **installation response schema 双轨收口**（仍不打勾）——
> 删除 Start/Complete KnowledgeRepositoryInstallationRes 接口 dual body；统一 `z.infer` of `*ResponseSchema`；
> surface Residual 699 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百轮）：§13.2 聚焦证据套件复跑（含 residual 250–699
> knowledge installation Res dual retired 锁，不改 checkbox）——**147 文件 / 817 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 42/115、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 698：contracts +1 file / +3 tests（residual 699 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百零一轮）：contracts repository **installation repository DTO schema 双轨收口**（仍不打勾）——
> 删除 GitHubInstallationRepositoryDTO 接口 dual body；统一 `z.infer` of `GitHubInstallationRepositorySchema`；
> surface Residual 701 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百零二轮）：§13.2 聚焦证据套件复跑（含 residual 250–701
> installation repository DTO dual retired 锁，不改 checkbox）——**148 文件 / 820 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 43/118、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 700：contracts +1 file / +3 tests（residual 701 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百零三轮）：contracts schedule **query params schema 双轨收口**（仍不打勾）——
> 删除 ScheduleTask/Execution QueryParamsDTO 接口 dual body；统一 `z.infer` of `*QueryParamsSchema`；
> surface Residual 703 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百零四轮）：§13.2 聚焦证据套件复跑（含 residual 250–703
> schedule query params dual retired 锁，不改 checkbox）——**149 文件 / 823 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 44/121、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 702：contracts +1 file / +3 tests（residual 703 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百零五轮）：contracts ai **goal automation plan/preview schema 双轨收口**（仍不打勾）——
> 删除 GoalAutomationPlanDTO / TaskTemplatePreview / ReminderPreview 接口 dual body；统一 `z.infer` of `*Schema`；
> surface Residual 705 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百零六轮）：§13.2 聚焦证据套件复跑（含 residual 250–705
> goal automation plan dual retired 锁，不改 checkbox）——**150 文件 / 826 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 45/124、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 704：contracts +1 file / +3 tests（residual 705 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百零七轮）：contracts schedule **request schema 双轨收口**（仍不打勾）——
> 删除 Create/Update/DetectConflicts/GetByTimeRange/ResolveConflict Request 接口 dual body；
> 统一 `z.infer` of `*RequestSchema`；保留 internal identity query 接口；surface Residual 707 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百零八轮）：§13.2 聚焦证据套件复跑（含 residual 250–707
> schedule request dual retired 锁，不改 checkbox）——**151 文件 / 830 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 46/128、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 706：contracts +1 file / +4 tests（residual 707 surface×4）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百零九轮）：contracts schedule-task **request schema 双轨收口**（仍不打勾）——
> 删除 Create/Update/Config/Metadata/Batch ScheduleTask Request 接口 dual body；统一 `z.infer` of `*RequestSchema`；
> 保留 ScheduleBatchOperationResponseDTO（residual 639）；surface Residual 709 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百一十轮）：§13.2 聚焦证据套件复跑（含 residual 250–709
> schedule-task request dual retired 锁，不改 checkbox）——**152 文件 / 834 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 47/132、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 708：contracts +1 file / +4 tests（residual 709 surface×4）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百一十一轮）：contracts task **dependency transport schema 双轨收口**（仍不打勾）——
> 删除 Create/Update/Validate Body + ValidateDependencyResponse 接口 dual body；统一 `z.infer` of `*Schema`；
> 保留 internal identity use-case Request 接口；surface Residual 711 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百一十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–711
> task dependency transport dual retired 锁，不改 checkbox）——**153 文件 / 838 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 48/136、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 710：contracts +1 file / +4 tests（residual 711 surface×4）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百一十三轮）：contracts authentication **session response schema 双轨收口**（仍不打勾）——
> 删除 CurrentUserDTO / ListSessionsRes 接口 dual body；统一 `z.infer` of `CurrentUserResponseSchema` /
> `SessionListResponseSchema`；surface Residual 713 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百一十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–713
> auth session response dual retired 锁，不改 checkbox）——**154 文件 / 841 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 49/139、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 712：contracts +1 file / +3 tests（residual 713 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百一十五轮）：contracts schedule **create/resolve response schema 双轨收口**（仍不打勾）——
> 删除 CreateScheduleResponseDTO / ResolveConflictResponseDTO / AppliedResolution 接口 dual body；
> 统一 `z.infer` of `*ResponseSchema`（导出 AppliedResolutionSchema）；surface Residual 715 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百一十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–715
> schedule response dual retired 锁，不改 checkbox）——**155 文件 / 844 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 50/142、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 714：contracts +1 file / +3 tests（residual 715 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百一十七轮）：contracts schedule **batch response schema 双轨收口**（仍不打勾）——
> 删除 ScheduleBatchOperationResponseDTO 接口 dual body；统一 `z.infer` of `ScheduleBatchOperationResponseSchema`；
> 同步 residual 639/709 surface 断言；surface Residual 717 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百一十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–717
> schedule batch response dual retired 锁，不改 checkbox）——**156 文件 / 847 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 51/145、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 716：contracts +1 file / +3 tests（residual 717 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百一十九轮）：contracts ai **goal generation draft/preview/result schema 双轨收口**（仍不打勾）——
> 删除 GeneratedGoalDraft / KeyResultPreview / GenerateGoalResultDTO / GenerateKeyResultsResultDTO 接口 dual body；
> 统一 `z.infer` of 共有 `*Schema`（schemas 归属 goal-generation-result.dto；automation/response-schemas 复用）；
> surface Residual 719 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百二十轮）：§13.2 聚焦证据套件复跑（含 residual 250–719
> goal generation draft dual retired 锁，不改 checkbox）——**157 文件 / 850 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 52/148、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 718：contracts +1 file / +3 tests（residual 719 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百二十一轮）：contracts ai **provider test result schema 双轨收口**（仍不打勾）——
> 删除 TestAIProviderResultDTO 接口 dual body；统一 `z.infer` of `TestAIProviderResultDTOSchema`
> （schema 归属 provider-test-result.dto；response-schemas 复用）；surface Residual 721 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百二十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–721
> provider test result dual retired 锁，不改 checkbox）——**158 文件 / 853 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 53/151、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 720：contracts +1 file / +3 tests（residual 721 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百二十三轮）：contracts ai **knowledge note persisted-ref schema 双轨收口**（仍不打勾）——
> 删除 KnowledgeNotePersistedRef 接口 dual body；统一 `z.infer` of `KnowledgeNotePersistedRefSchema`；
> surface Residual 723 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百二十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–723
> knowledge note persisted-ref dual retired 锁，不改 checkbox）——**159 文件 / 856 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 54/154、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 722：contracts +1 file / +3 tests（residual 723 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百二十五轮）：contracts schedule **conflict detection result schema 双轨收口**（仍不打勾）——
> 删除 ConflictDetectionResult / ConflictDetail / ConflictSuggestion 接口 dual body；
> 统一 `z.infer` of 共有 `*Schema`（schemas 归属 conflict-detection-result VO；response-schemas 复用）；
> soft residual 679 surface re-export 锁；surface Residual 725 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百二十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–725
> schedule conflict result dual retired 锁，不改 checkbox）——**160 文件 / 859 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 55/157、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 724：contracts +1 file / +3 tests（residual 725 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百二十七轮）：contracts ai **token usage schema 双轨收口**（仍不打勾）——
> 删除 TokenUsageDTO 接口 dual body；统一 `z.infer` of `TokenUsageSchema`
> （schema 归属 token-usage VO；response-schemas / goal-generation-result 复用）；surface Residual 727 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百二十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–727
> token usage dual retired 锁，不改 checkbox）——**161 文件 / 862 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 56/160、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 726：contracts +1 file / +3 tests（residual 727 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百二十九轮）：contracts ai **goal workflow result schema 双轨收口**（仍不打勾）——
> 删除 GoalClarification* / GoalWorkflow*Result 接口 dual body；统一 `z.infer` of 共有 `*Schema`
> （schemas 归属 goal-workflow-result.dto；response-schemas 复用；plan 字段复用 GoalAutomationPlanSchema）；
> surface Residual 729 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百三十轮）：§13.2 聚焦证据套件复跑（含 residual 250–729
> goal workflow result dual retired 锁，不改 checkbox）——**162 文件 / 865 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 57/163、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 728：contracts +1 file / +3 tests（residual 729 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百三十一轮）：contracts governance **code snippet / rule tag schema 双轨收口**（仍不打勾）——
> 删除 CodeSnippetDTO / RuleTagDTO 接口 dual body；统一 `z.infer` of `*DTOSchema`
> （schemas 归属 value-objects；response-schemas 复用）；surface Residual 731 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百三十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–731
> governance snippet/tag dual retired 锁，不改 checkbox）——**163 文件 / 868 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 58/166、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 730：contracts +1 file / +3 tests（residual 731 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百三十三轮）：contracts reminder **active hours / group stats schema 双轨收口**（仍不打勾）——
> 删除 ActiveHoursConfigDTO / GroupStatsDTO 接口 dual body；统一 `z.infer` of `*Schema`
> （schemas 归属 value-objects；response-schemas 复用；不碰 ActiveTimeConfig 形状不一致 dual）；
> surface Residual 733 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百三十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–733
> reminder hours/stats dual retired 锁，不改 checkbox）——**164 文件 / 871 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 59/169、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 732：contracts +1 file / +3 tests（residual 733 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百三十五轮）：contracts reminder **trigger / notification config schema 双轨收口**（仍不打勾）——
> 删除 TriggerConfigDTO / NotificationConfigDTO 及嵌套 FixedTime/Interval/Sound/Vibration/Action 接口 dual body；
> 统一 `z.infer` of `*Schema`（schemas 归属 value-objects；response-schemas 复用）；surface Residual 735 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百三十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–735
> reminder trigger/notification dual retired 锁，不改 checkbox）——**165 文件 / 874 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 60/172、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 734：contracts +1 file / +3 tests（residual 735 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百三十七轮）：contracts goal **key-result progress / snapshot schema 双轨收口**（仍不打勾）——
> 删除 KeyResultProgressDTO / KeyResultSnapshotDTO 接口 dual body；
> 统一 `z.infer` of `*DTOSchema`（schemas 归属 value-objects；response-schemas 复用）；surface Residual 737 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百三十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–737
> key-result progress/snapshot dual retired 锁，不改 checkbox）——**166 文件 / 877 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 61/175、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 736：contracts +1 file / +3 tests（residual 737 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百三十九轮）：contracts task **goal-binding / reminder-config schema 双轨收口**（仍不打勾）——
> 删除 TaskGoalBindingDTO / TaskReminderConfigDTO 接口 dual body；
> 统一 `z.infer` of `*Schema`（schemas 归属 value-objects；task-template.dto 复用）；surface Residual 739 锁；
> 同步 soft 更新 residual 667 surface 以接受 VO re-export；**跳过 TaskTimeConfig**（DomainDate vs TransferDate 形状不一致）。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百四十轮）：§13.2 聚焦证据套件复跑（含 residual 250–739
> task goal-binding/reminder dual retired 锁，不改 checkbox）——**167 文件 / 880 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 62/178、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 738：contracts +1 file / +3 tests（residual 739 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百四十一轮）：contracts goal **reminder-config schema 双轨收口**（仍不打勾）——
> 删除 GoalReminderConfigDTO / ReminderTrigger 接口 dual body；
> 统一 `z.infer` of `*Schema`（schemas 归属 value-objects；response-schemas 复用）；surface Residual 741 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百四十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–741
> goal reminder-config dual retired 锁，不改 checkbox）——**168 文件 / 883 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 63/181、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 740：contracts +1 file / +3 tests（residual 741 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百四十三轮）：contracts task **recurrence-rule schema 双轨收口**（仍不打勾）——
> 删除 RecurrenceRuleDTO 接口 dual body；统一 `z.infer` of `RecurrenceConfigSchema`
> （schema 归属 value-objects；task-template.dto 复用）；保留 domain `RecurrenceRule`（DomainDate endDate）；surface Residual 743 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百四十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–743
> task recurrence-rule dual retired 锁，不改 checkbox）——**169 文件 / 886 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 64/184、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 742：contracts +1 file / +3 tests（residual 743 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百四十五轮）：contracts goal **focus-mode schema 双轨收口**（仍不打勾）——
> 删除 FocusModeDTO 接口 dual body；统一 `z.infer` of `FocusModeClientDTOSchema`（schema 归属 value-objects；
> response-schemas 复用）；Activate/Extend request 接口改为 schema `*Req` 别名；保留 domain `FocusMode`（DomainDate）；surface Residual 745 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百四十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–745
> goal focus-mode dual retired 锁，不改 checkbox）——**170 文件 / 889 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 65/187、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 744：contracts +1 file / +3 tests（residual 745 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百四十七轮）：contracts task **time-config schema 双轨收口**（仍不打勾）——
> 删除 TaskTimeConfigDTO 接口 dual body；统一 `z.infer` of `TaskTimeConfigSchema`
> （schema 归属 value-objects；task-template.dto 复用）；保留 domain `TaskTimeConfig`（DomainDate startDate，与 transfer 形状有意区分）；surface Residual 747 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百四十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–747
> task time-config dual retired 锁，不改 checkbox）——**171 文件 / 892 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 66/190、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 746：contracts +1 file / +3 tests（residual 747 surface×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百四十九轮）：contracts schedule **nested VO response schema 双轨收口**（仍不打勾）——
> 删除 ScheduleConfigDTO / ExecutionInfoDTO / RetryPolicyDTO / TaskMetadataDTO 接口 dual body；
> 统一 `z.infer` of response `*Schema`（schemas 归属 value-objects；response-schemas 复用）；
> request 模块保留局部 partial schema（字段类型/校验与 response 有意不同）；domain I* 保留 number 时间戳；surface Residual 749 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百五十轮）：§13.2 聚焦证据套件复跑（含 residual 250–749
> schedule nested VO dual retired 锁，不改 checkbox）——**172 文件 / 896 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 67/194、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 748：contracts +1 file / +4 tests（residual 749 surface×4）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百五十一轮）：contracts reminder/ai **TimeSlot + AIModelInfo schema 双轨收口**（仍不打勾）——
> 删除 TimeSlotDTO / AIModelInfo 接口 dual body；统一 `z.infer` of `TimeSlotSchema` / `AIModelInfoSchema`
> （schemas 归属 value-objects / aggregates；response-schemas 复用）；surface Residual 751 锁（×2 文件）。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百五十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–751
> TimeSlot + AIModelInfo dual retired 锁，不改 checkbox）——**174 文件 / 902 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 69/200、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 750：contracts +2 files / +6 tests（residual 751 surface×2×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百五十三轮）：contracts goal **create/update reminder-config request dual 收口**（仍不打勾）——
> goal-crud 删除局部 ReminderTrigger/GoalReminderConfig schema dual body；
> 复用 residual 741 VO `ReminderTriggerSchema` / `GoalReminderConfigDTOSchema`，仅叠加 request 校验（value.min(0)、triggers.max(10)）；surface Residual 753 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百五十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–753
> goal reminder-config request dual retired 锁，不改 checkbox）——**175 文件 / 905 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 70/203、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 752：contracts +1 file / +3 tests（residual 753 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百五十五轮）：contracts ai **KnowledgeCitation schema 双轨收口**（仍不打勾）——
> response-schemas 删除私有 `KnowledgeCitationResSchema` dual body，导出唯一 `KnowledgeCitationSchema`（含 min(1)）；
> Query/Expand knowledge res 嵌套共用 schema；dto 仅保留 `KnowledgeCitation` z.infer 别名；surface Residual 755 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百五十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–755
> KnowledgeCitation dual retired 锁，不改 checkbox）——**176 文件 / 908 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 71/206、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 754：contracts +1 file / +3 tests（residual 755 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百五十七轮）：contracts ai **AgentCitation schema 双轨收口**（仍不打勾）——
> `AgentCitationSchema = KnowledgeCitationSchema`（复用 residual 755 唯一 citation 对象体）；删除 agent 局部 dual body；
> 语义 `AgentCitation` 仍为 z.infer 别名；surface Residual 757 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百五十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–757
> AgentCitation dual retired 锁，不改 checkbox）——**177 文件 / 911 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 72/209、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 756：contracts +1 file / +3 tests（residual 757 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百五十九轮）：contracts authentication **OAuth callback/bind payload dual 收口**（仍不打勾）——
> `BindOAuthSchema = OAuthCallbackSchema`；统一 code/state `.min(1)`；删除 bind 局部 dual body；surface Residual 759 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁 / 真实 OAuth 跨端 E2E。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百六十轮）：§13.2 聚焦证据套件复跑（含 residual 250–759
> OAuth callback/bind dual retired 锁，不改 checkbox）——**178 文件 / 914 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 73/212、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 758：contracts +1 file / +3 tests（residual 759 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百六十一轮）：contracts ai **ReindexKnowledgeRes dual 收口**（仍不打勾）——
> 删除 `export interface ReindexKnowledgeRes`；新增 `ReindexKnowledgeResSchema` 为唯一响应体；
> OpenAPI `/reindex` 去掉 inline `z.object` dual body；Res 为 z.infer 别名；surface Residual 761 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百六十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–761
> ReindexKnowledgeRes dual retired 锁，不改 checkbox）——**179 文件 / 917 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 74/215、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 760：contracts +1 file / +3 tests（residual 761 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百六十三轮）：contracts authentication **OAuth provider enum dual 收口**（仍不打勾）——
> 导出唯一 `OAuthProviderSchema` / `OAuthProvider`；Get/Callback/Authorize/Unbind 复用；
> availability DTO 使用 `OAuthProvider` 类型；surface Residual 763 锁。
> 非跨端 multi-engine E2E / 真实 OAuth 跨端 E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百六十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–763
> OAuth provider enum dual retired 锁，不改 checkbox）——**180 文件 / 920 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 75/218、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 762：contracts +1 file / +3 tests（residual 763 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百六十五轮）：contracts authentication **OAuth response dual 收口**（仍不打勾）——
> `GetOAuthUrlResSchema` / `BindOAuthResSchema` / `OAuthProvidersResSchema`（含 availability）为唯一响应体；
> OpenAPI 去掉 inline `z.object` dual；Res 为 z.infer；soft residual 763 provider 复用计数；surface Residual 765 锁。
> 非跨端 multi-engine E2E / 真实 OAuth 跨端 E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百六十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–765
> OAuth response dual retired 锁，不改 checkbox）——**181 文件 / 923 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 76/221、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 764：contracts +1 file / +3 tests（residual 765 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百六十七轮）：contracts account **CheckAvailabilityRes dual 收口**（仍不打勾）——
> 删除 `export interface CheckAvailabilityRes`；复用 `AvailabilityResponseSchema` 为唯一响应体；
> Res 为 z.infer 别名；OpenAPI 已引用同一 schema；surface Residual 767 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百六十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–767
> CheckAvailabilityRes dual retired 锁，不改 checkbox）——**182 文件 / 926 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 77/224、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 766：contracts +1 file / +3 tests（residual 767 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百六十九轮）：contracts authentication **session ValidateToken/GuestMode Res dual 收口**（仍不打勾）——
> 删除 interface dual body；新增 `ValidateTokenResSchema` / `GuestModeResSchema` 为唯一形状；
> Res 为 z.infer 别名；surface Residual 769 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百七十轮）：§13.2 聚焦证据套件复跑（含 residual 250–769
> session ValidateToken/GuestMode Res dual retired 锁，不改 checkbox）——**183 文件 / 929 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 78/227、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 768：contracts +1 file / +3 tests（residual 769 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百七十一轮）：contracts setting **export/import settings Res dual 收口**（仍不打勾）——
> 删除 `ExportSettingsRes` / `ImportSettingsRes` 对象 dual body；复用 `ExportSettingsResponseSchema` /
> `ImportSettingsResponseSchema`；Res 为 z.infer；OpenAPI 已引用同一 schema；surface Residual 771 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百七十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–771
> settings export/import Res dual retired 锁，不改 checkbox）——**184 文件 / 932 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 79/230、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 770：contracts +1 file / +3 tests（residual 771 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百七十三轮）：contracts repository **ListKnowledgeRepositoryConnectionsRes dual 收口**（仍不打勾）——
> 删除对象 dual body；`ListKnowledgeRepositoryConnectionsRes` 为 `ResSchema` z.infer；
> 嵌套 connection 使用 `KnowledgeRepositoryConnectionClientSchema`；surface Residual 773 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百七十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–773
> list knowledge connections Res dual retired 锁，不改 checkbox）——**185 文件 / 935 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 80/233、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 772：contracts +1 file / +3 tests（residual 773 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百七十五轮）：contracts reminder **upcoming/today schedule list Res dual 收口**（仍不打勾）——
> 共享 `ReminderScheduleListResSchema`；`GetUpcomingRemindersResSchema` / `GetReminderTodayScheduleResSchema` 复用；
> OpenAPI 去掉 inline `z.object` dual；Res 为 z.infer；surface Residual 775 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百七十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–775
> reminder schedule list Res dual retired 锁，不改 checkbox）——**186 文件 / 938 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 81/236、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 774：contracts +1 file / +3 tests（residual 775 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百七十七轮）：contracts goal **focus statistics/pomodoro Res dual 收口**（仍不打勾）——
> 删除 interface dual body；新增 `GetFocusStatisticsResSchema` / `GetPomodoroConfigResSchema`；
> Res 为 z.infer 别名；surface Residual 777 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百七十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–777
> focus statistics/pomodoro Res dual retired 锁，不改 checkbox）——**187 文件 / 941 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 82/239、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 776：contracts +1 file / +3 tests（residual 777 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百七十九轮）：contracts goal **QueryGoalFoldersRes dual 收口**（仍不打勾）——
> 删除 interface dual body；新增 `QueryGoalFoldersResSchema`（嵌套 `GoalFolderClientDTOSchema`）；
> OpenAPI list 去掉 inline `z.object` dual；Res 为 z.infer；surface Residual 779 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百八十轮）：§13.2 聚焦证据套件复跑（含 residual 250–779
> QueryGoalFoldersRes dual retired 锁，不改 checkbox）——**188 文件 / 944 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 83/242、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 778：contracts +1 file / +3 tests（residual 779 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百八十一轮）：contracts reminder **BatchGroupTemplatesRes dual 收口**（仍不打勾）——
> 删除 interface dual（含未使用 errors 字段）；`BatchGroupTemplatesResSchema = ReminderBatchResultSchema`；
> Res 为 z.infer；OpenAPI 已引用 `ReminderBatchResultSchema`；surface Residual 781 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百八十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–781
> BatchGroupTemplatesRes dual retired 锁，不改 checkbox）——**189 文件 / 947 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 84/245、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 780：contracts +1 file / +3 tests（residual 781 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百八十三轮）：contracts governance **list/search/revisions Res dual 收口**（仍不打勾）——
> 删除 `ListRulesRes`/`SearchRulesRes`/`GetRuleRevisionsRes` type object dual；
> `*ResSchema` 去掉 `z.ZodType<>` 注解；Res 为 z.infer；surface Residual 783 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百八十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–783
> list/search/revisions Res dual retired 锁，不改 checkbox）——**190 文件 / 950 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 85/248、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 782：contracts +1 file / +3 tests（residual 783 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百八十五轮）：contracts goal **focus status/history Res dual 收口**（仍不打勾）——
> 删除 `GetFocusStatusRes`/`GetFocusHistoryRes` interface dual；新增 `*ResSchema`
> （嵌套 `FocusSessionClientDTOSchema`）；Res 为 z.infer；surface Residual 785 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百八十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–785
> focus status/history Res dual retired 锁，不改 checkbox）——**191 文件 / 952 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 86/250、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 784：contracts +1 file / +2 tests（residual 785 surface×1×2）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百八十七轮）：contracts ai **GenerateGoalAutomationRes dual 收口**（仍不打勾）——
> 删除 interface dual；新增 `GenerateGoalAutomationResSchema`（嵌套 plan/action/`TokenUsageSchema`）；
> Res 为 z.infer；surface Residual 787 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百八十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–787
> GenerateGoalAutomationRes dual retired 锁，不改 checkbox）——**192 文件 / 954 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 87/252、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 786：contracts +1 file / +2 tests（residual 787 surface×1×2）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百八十九轮）：contracts task **instance range/op Res dual 收口**（仍不打勾）——
> 删除 `GetTaskInstancesByRangeRes`/`TaskInstanceOperationRes` interface dual；
> 新增 `*ResSchema`（嵌套 `TaskInstanceResponseSchema`）；Res 为 z.infer；surface Residual 789 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百九十轮）：§13.2 聚焦证据套件复跑（含 residual 250–789
> task instance range/op Res dual retired 锁，不改 checkbox）——**193 文件 / 956 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 88/254、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 788：contracts +1 file / +2 tests（residual 789 surface×1×2）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百九十一轮）：contracts goal **export/import goals Res dual 收口**（仍不打勾）——
> 删除 `ExportGoalsRes`/`ImportGoalsRes` interface dual；新增 `*ResSchema`
> （export data `string|Uint8Array` union）；Res 为 z.infer；surface Residual 791 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百九十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–791
> export/import goals Res dual retired 锁，不改 checkbox）——**194 文件 / 958 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 89/256、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 790：contracts +1 file / +2 tests（residual 791 surface×1×2）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百九十三轮）：contracts repository **local vault Res dual 收口**（仍不打勾）——
> 删除 Scan/Search/ConfirmedWrite Res 与 nested DTO interface dual；新增 `*Schema` + z.infer；
> surface Residual 793 锁。非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百九十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–793
> local vault Res dual retired 锁，不改 checkbox）——**195 文件 / 961 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 90/259、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 792：contracts +1 file / +3 tests（residual 793 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百九十五轮）：contracts repository **local vault Req dual 收口**（仍不打勾）——
> 删除 Select/Read/Search/Open/ConfirmedWrite Req interface dual；新增 `*ReqSchema` + z.infer；
> surface Residual 795 锁。非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百九十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–795
> local vault Req dual retired 锁，不改 checkbox）——**196 文件 / 964 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 91/262、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 794：contracts +1 file / +3 tests（residual 795 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百九十七轮）：contracts task **TaskGraphDependencyDTO dual 收口**（仍不打勾）——
> 删除 graph edge interface dual；`TaskGraphDependencyDTO = z.infer<typeof TaskDependencyResponseSchema>`
> （optional title 字段为 schema 超集）；`task-template.dto` re-export；保留 `QueryTaskTemplateGraphRes`
> interface（ClientDTO vs ResponseSchema 形状不匹配，不强并）；surface Residual 797 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留七百九十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–797
> TaskGraphDependencyDTO dual retired 锁，不改 checkbox）——**197 文件 / 967 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 92/265、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 796：contracts +1 file / +3 tests（residual 797 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留七百九十九轮）：contracts notification **BatchOperationResultDTO dual 收口**（仍不打勾）——
> 删除 batch result interface dual；`BatchOperationResultDTO = z.infer<typeof NotificationBatchResultSchema>`；
> Mark/Delete/Cleanup *Res 继续语义别名；surface Residual 799 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百轮）：§13.2 聚焦证据套件复跑（含 residual 250–799
> BatchOperationResultDTO dual retired 锁，不改 checkbox）——**198 文件 / 970 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 93/268、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 798：contracts +1 file / +3 tests（residual 799 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百零一轮）：contracts notification **UnreadCountResponse dual 收口**（仍不打勾）——
> 删除 notification package port local interface dual；contracts 持有
> `UnreadCountResponse = z.infer<typeof UnreadCountResponseSchema>`；port re-export；surface Residual 801 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百零二轮）：§13.2 聚焦证据套件复跑（含 residual 250–801
> UnreadCountResponse dual retired 锁，不改 checkbox）——**199 文件 / 973 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 94/271、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 800：contracts +1 file / +3 tests（residual 801 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百零三轮）：contracts repository **KnowledgeRepositoryConnectionClientDTO dual 收口**（仍不打勾）——
> 删除 aggregate ClientDTO interface dual；`ClientDTO = z.infer<typeof KnowledgeRepositoryConnectionClientSchema>`；
> ServerDTO 保留（lastErrorMessage/version/deletedAt）；surface Residual 803 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百零四轮）：§13.2 聚焦证据套件复跑（含 residual 250–803
> KnowledgeRepositoryConnectionClientDTO dual retired 锁，不改 checkbox）——**200 文件 / 976 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 95/274、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 802：contracts +1 file / +3 tests（residual 803 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百零五轮）：contracts goal **ProgressBreakdown dual 收口**（仍不打勾）——
> 删除 ProgressBreakdown interface dual；`ProgressBreakdown = z.infer<typeof ProgressBreakdownResSchema>`；
> 保留 ProgressCalculationMode 与嵌套 ProgressBreakdownResponse 包装；surface Residual 805 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百零六轮）：§13.2 聚焦证据套件复跑（含 residual 250–805
> ProgressBreakdown dual retired 锁，不改 checkbox）——**201 文件 / 979 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 96/277、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 804：contracts +1 file / +3 tests（residual 805 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百零七轮）：contracts ai **MessageClientDTO dual 收口**（仍不打勾）——
> 删除 entity interface dual；`MessageClientDTO = z.infer<typeof MessageClientDTOSchema>`；
> 含 UI 计算字段（isUser/isAssistant/isSystem/formattedTime）；surface Residual 807 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百零八轮）：§13.2 聚焦证据套件复跑（含 residual 250–807
> MessageClientDTO dual retired 锁，不改 checkbox）——**202 文件 / 982 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 97/280、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 806：contracts +1 file / +3 tests（residual 807 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百零九轮）：contracts ai **AIConversationClientDTO dual 收口**（仍不打勾）——
> 删除 aggregate interface dual；`AIConversationClientDTO = z.infer<typeof AIConversationClientDTOSchema>`；
> `identityId` 收紧为 `brandedId<IdentityId>()`；nest MessageClientDTOSchema；surface Residual 809 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百一十轮）：§13.2 聚焦证据套件复跑（含 residual 250–809
> AIConversationClientDTO dual retired 锁，不改 checkbox）——**203 文件 / 985 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 98/283、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 808：contracts +1 file / +3 tests（residual 809 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百一十一轮）：contracts ai **AIProviderConfigClientDTO dual 收口**（仍不打勾）——
> 删除 interface dual；schema 归属 aggregates + z.infer；`identityId` branded；response-schemas re-export；
> surface Residual 811 锁（soft residual 647/751）。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百一十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–811
> AIProviderConfigClientDTO dual retired 锁，不改 checkbox）——**204 文件 / 988 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 99/286、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 810：contracts +1 file / +3 tests（residual 811 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百一十三轮）：contracts goal **FocusSessionClientDTO dual 收口**（仍不打勾）——
> 删除 aggregate interface dual；`FocusSessionClientDTO = z.infer<typeof FocusSessionClientDTOSchema>`；
> nest 于 GetFocusStatus/History Res；surface Residual 813 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百一十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–813
> FocusSessionClientDTO dual retired 锁，不改 checkbox）——**205 文件 / 991 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 100/289、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 812：contracts +1 file / +3 tests（residual 813 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百一十五轮）：contracts goal **GoalRecordClientDTO dual 收口**（仍不打勾）——
> 删除 aggregate interface dual；`GoalRecordClientDTO = z.infer<typeof GoalRecordClientDTOSchema>`；
> surface Residual 815 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百一十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–815
> GoalRecordClientDTO dual retired 锁，不改 checkbox）——**206 文件 / 994 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 101/292、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 814：contracts +1 file / +3 tests（residual 815 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百一十七轮）：contracts goal **KeyResultClientDTO / GoalReviewClientDTO dual 收口**（仍不打勾）——
> 删除 entity interface duals；`*ClientDTO = z.infer<typeof *ClientDTOSchema>`；去掉 `z.ZodType<Interface>` 注解；
> surface Residual 817 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百一十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–817
> KeyResult/GoalReview ClientDTO dual retired 锁，不改 checkbox）——**207 文件 / 997 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 102/295、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 816：contracts +1 file / +3 tests（residual 817 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百一十九轮）：contracts goal **GoalClientDTO / GoalFolderClientDTO dual 收口**（仍不打勾）——
> 删除 aggregate interface duals；`*ClientDTO = z.infer<typeof *ClientDTOSchema>`；去掉 `z.ZodType<Interface>` 注解；
> surface Residual 819 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百二十轮）：§13.2 聚焦证据套件复跑（含 residual 250–819
> Goal/GoalFolder ClientDTO dual retired 锁，不改 checkbox）——**208 文件 / 1000 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 103/298、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 818：contracts +1 file / +3 tests（residual 819 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百二十一轮）：contracts governance **RuleClientDTO / RuleRevisionClientDTO dual 收口**（仍不打勾）——
> 删除 aggregate/entity interface duals；`*ClientDTO = z.infer<typeof *ClientDTOSchema>`；去掉 `z.ZodType<Interface>` 注解；
> surface Residual 821 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百二十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–821
> Rule/RuleRevision ClientDTO dual retired 锁，不改 checkbox）——**209 文件 / 1003 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 104/301、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 820：contracts +1 file / +3 tests（residual 821 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百二十三轮）：contracts setting **UserSettingClientDTO dual 收口**（仍不打勾）——
> 删除 aggregate interface dual；`UserSettingClientDTO = z.infer<typeof UserSettingResponseSchema>`；
> surface Residual 823 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百二十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–823
> UserSettingClientDTO dual retired 锁，不改 checkbox）——**210 文件 / 1006 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 105/304、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 822：contracts +1 file / +3 tests（residual 823 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百二十五轮）：contracts account **AccountClientDTO dual 收口**（仍不打勾）——
> 删除 aggregate interface dual；`AccountClientDTO = z.infer<typeof AccountResponseSchema>`；
> surface Residual 825 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百二十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–825
> AccountClientDTO dual retired 锁，不改 checkbox）——**211 文件 / 1009 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 106/307、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 824：contracts +1 file / +3 tests（residual 825 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百二十七轮）：contracts reminder **ReminderGroupClientDTO / ReminderHistoryClientDTO dual 收口**（仍不打勾）——
> 删除 aggregate/entity interface duals；`*ClientDTO = z.infer<typeof *ResponseSchema>`；
> surface Residual 827 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百二十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–827
> ReminderGroup/History ClientDTO dual retired 锁，不改 checkbox）——**212 文件 / 1012 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 107/310、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 826：contracts +1 file / +3 tests（residual 827 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百二十九轮）：contracts **NotificationPreference / CalendarEntry / UserReminderPreferences ClientDTO dual 收口**（仍不打勾）——
> 删除 interface duals；`*ClientDTO = z.infer<typeof *ResponseSchema>`（ServerDTO 保留）；
> surface Residual 829 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百三十轮）：§13.2 聚焦证据套件复跑（含 residual 250–829
> Preference/Calendar ClientDTO dual retired 锁，不改 checkbox）——**213 文件 / 1015 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 108/313、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 828：contracts +1 file / +3 tests（residual 829 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百三十一轮）：contracts **TaskDependency / TaskInstance / ScheduleTask ClientDTO dual 收口**（仍不打勾）——
> 删除 interface duals；`*ClientDTO = z.infer<typeof *ResponseSchema>`；DependencyChain 因 shape 差异保留 interface；
> surface Residual 831 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百三十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–831
> Task/Schedule ClientDTO dual retired 锁，不改 checkbox）——**214 文件 / 1018 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 109/316、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 830：contracts +1 file / +3 tests（residual 831 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百三十三轮）：contracts **ActiveTime/ReminderTemplate/ScheduleExecution dual 收口**（仍不打勾）——
> ActiveTimeConfigSchema 对齐 `activatedAt`（去掉 response 影子 startDate/endDate）；
> ReminderTemplateClientDTO / ScheduleExecutionClientDTO = z.infer；surface Residual 833 锁。
> 请求体 CreateReminderTemplate 仍可使用 startDate 映射（request≠response）。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百三十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–833
> ActiveTime/Template/Execution dual retired 锁，不改 checkbox）——**215 文件 / 1021 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 110/319、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 832：contracts +1 file / +3 tests（residual 833 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百三十五轮）：contracts/reminder **request ActiveTime dual 收口**（仍不打勾）——
> Create/Update ReminderTemplate `activeTime` 复用 `ActiveTimeConfigSchema`（`activatedAt`）；
> 去掉 startDate→activatedAt 映射与 TemplateDialog request dual；surface Residual 835 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百三十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–835
> request ActiveTime dual retired 锁，不改 checkbox）——**216 文件 / 1024 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 111/322、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 834：contracts +1 file / +3 tests（residual 835 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百三十七轮）：contracts/task **TaskFolder/TaskTemplateHistory ClientDTO dual 收口**（仍不打勾）——
> TaskFolderClientDTO / TaskTemplateHistoryClientDTO = z.infer of *ResponseSchema；
> Server DTO 保留 interface（同形）；surface Residual 837 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百三十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–837
> TaskFolder/History ClientDTO dual retired 锁，不改 checkbox）——**217 文件 / 1027 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 112/325、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 836：contracts +1 file / +3 tests（residual 837 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百三十九轮）：contracts/notification **NotificationTemplate ClientDTO dual 收口**（仍不打勾）——
> NotificationTemplateClientDTO = z.infer of NotificationTemplateResponseSchema；
> Server DTO 保留 interface（同形 TransferDate）；surface Residual 839 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百四十轮）：§13.2 聚焦证据套件复跑（含 residual 250–839
> NotificationTemplate ClientDTO dual retired 锁，不改 checkbox）——**218 文件 / 1030 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 113/328、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 838：contracts +1 file / +3 tests（residual 839 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百四十一轮）：contracts/task **SubtaskClientDTO dual 收口**（仍不打勾）——
> SubtaskClientDTO = z.infer of SubtaskResponseSchema；SubtaskServer 仍退役（residual 649）；
> surface Residual 841 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百四十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–841
> SubtaskClientDTO dual retired 锁，不改 checkbox）——**219 文件 / 1033 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 114/331、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 840：contracts +1 file / +3 tests（residual 841 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百四十三轮）：contracts/task **TaskFolder/History ServerDTO dual 收口**（仍不打勾）——
> TaskFolderServerDTO / TaskTemplateHistoryServerDTO = z.infer of 同 Client *ResponseSchema；
> client+server 单轨；surface Residual 843 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百四十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–843
> TaskFolder/History ServerDTO dual retired 锁，不改 checkbox）——**220 文件 / 1036 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 115/334、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 842：contracts +1 file / +3 tests（residual 843 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百四十五轮）：contracts/notification **NotificationTemplate ServerDTO dual 收口**（仍不打勾）——
> NotificationTemplateServerDTO = z.infer of 同 Client NotificationTemplateResponseSchema；
> client+server 单轨；surface Residual 845 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百四十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–845
> NotificationTemplate ServerDTO dual retired 锁，不改 checkbox）——**221 文件 / 1039 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 116/337、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 844：contracts +1 file / +3 tests（residual 845 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百四十七轮）：contracts/authentication **DeviceInfoDTO dual 收口**（仍不打勾）——
> DeviceInfoDTO = DeviceInfo（sole interface body）；slim OpenAPI DeviceInfoSchema 保持独立子集；
> surface Residual 847 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百四十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–847
> DeviceInfoDTO dual retired 锁，不改 checkbox）——**222 文件 / 1042 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 117/340、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 846：contracts +1 file / +3 tests（residual 847 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百四十九轮）：contracts/notification **channel VO DTO dual 收口**（仍不打勾）——
> ChannelResponseDTO / ChannelErrorDTO / RateLimitDTO = VO type alias（sole interface body）；
> surface Residual 849 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百五十轮）：§13.2 聚焦证据套件复跑（含 residual 250–849
> channel VO DTO dual retired 锁，不改 checkbox）——**223 文件 / 1045 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 118/343、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 848：contracts +1 file / +3 tests（residual 849 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百五十一轮）：contracts/notification **preference VO DTO dual 收口**（仍不打勾）——
> CategoryPreferenceDTO / NotificationActionDTO / DoNotDisturbConfigDTO / NotificationMetadataDTO = VO type alias；
> surface Residual 851 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百五十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–851
> preference VO DTO dual retired 锁，不改 checkbox）——**224 文件 / 1048 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 119/346、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 850：contracts +1 file / +3 tests（residual 851 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百五十三轮）：contracts **exact VO DTO dual 收口**（仍不打勾）——
> GoalMetadataDTO / AccountSettingsDTO / ChecklistItemDefinitionDTO = VO type alias；
> DomainDate≠TransferDate duals（GoalTimeRange 等）保持 interface；surface Residual 853 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百五十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–853
> exact VO DTO dual retired 锁，不改 checkbox）——**225 文件 / 1051 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 120/349、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 852：contracts +1 file / +3 tests（residual 853 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百五十五轮）：contracts/authentication **secret/identifier VO DTO dual 收口**（仍不打勾）——
> HashedPasswordDTO / EmailAddressDTO / PhoneNumberDTO / PlainPasswordDTO = VO type alias；
> surface Residual 855 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百五十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–855
> auth secret VO DTO dual retired 锁，不改 checkbox）——**226 文件 / 1054 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 121/352、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 854：contracts +1 file / +3 tests（residual 855 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百五十七轮）：contracts/reminder **metrics VO DTO dual 收口**（仍不打勾）——
> FrequencyAdjustmentDTO / ResponseMetricsDTO = VO type alias；
> surface Residual 857 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百五十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–857
> reminder metrics VO DTO dual retired 锁，不改 checkbox）——**227 文件 / 1057 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 122/355、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 856：contracts +1 file / +3 tests（residual 857 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百五十九轮）：contracts **DomainDate≠TransferDate dual keep-boundary**
> surface 锁（仍不打勾）——GoalTimeRange / KeyResultWeightSnapshot / Contact* / AccountProfile /
> CompletionRecord 保持双 interface；AuthStatus≠AuthStatusDTO；residual 857 exact metrics duals 仍为 type alias；
> surface Residual 859 锁。非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百六十轮）：§13.2 聚焦证据套件复跑（含 residual 250–859
> DomainDate dual keep-boundary 锁，不改 checkbox）——**228 文件 / 1060 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 123/358、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 858：contracts +1 file / +3 tests（residual 859 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百六十一轮）：contracts **subset Client/Server dual 收口**（仍不打勾）——
> ReminderResponseClientDTO = Omit<Server, identityId>；
> NotificationChannelServerDTO = Omit<Client, version|updatedAt|deletedAt>；
> surface Residual 861 锁。非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百六十二轮）：§13.2 聚焦证据套件复跑（含 residual 250–861
> subset Client/Server dual retired 锁，不改 checkbox）——**229 文件 / 1063 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 124/361、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 860：contracts +1 file / +3 tests（residual 861 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百六十三轮）：contracts/notification **NotificationClientDTO dual 收口**（仍不打勾）——
> NotificationClientDTO = Omit<Server, notificationChannels> & client channel list；
> surface Residual 863 锁。非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百六十四轮）：§13.2 聚焦证据套件复跑（含 residual 250–863
> NotificationClientDTO dual retired 锁，不改 checkbox）——**230 文件 / 1066 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 125/364、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 862：contracts +1 file / +3 tests（residual 863 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百六十五轮）：contracts/authentication **AuthStatusDTO 死 dual 收口**（仍不打勾）——
> 删除无消费者的 AuthStatusDTO simplified dual；sole AuthStatus（getStatus / bootstrap）；
> surface Residual 865 锁（desktop-auth.types.surface + residual 859 keep-boundary 同步）。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百六十六轮）：§13.2 聚焦证据套件复跑（含 residual 250–865
> AuthStatusDTO dual retired 锁，不改 checkbox）——**230 文件 / 1069 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 125/367、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 864：contracts +0 file / +3 tests（residual 865 surface×3 on existing desktop-auth file）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百六十七轮）：contracts/authentication **LoginResponse 死 dual 收口**（仍不打勾）——
> 删除无消费者的 LoginResponse；sole OfflineLoginResponse（desktop）/ AuthResponseDTO（online）；
> SessionStatus 去掉 bogus Omit device；surface Residual 867 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百六十八轮）：§13.2 聚焦证据套件复跑（含 residual 250–867
> LoginResponse dual retired 锁，不改 checkbox）——**230 文件 / 1072 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 125/370、governance 2/4、api 10/24、data-portability 4/18、… desktop 5/9、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 866：contracts +0 file / +3 tests（residual 867 surface×3 on existing desktop-auth file）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。

> 续进展 2026-07-23（阶段 6 残留八百六十九轮）：desktop/authentication **DesktopLoginRequest dual 收口**（仍不打勾）——
> DesktopLoginRequest = EmailLoginCredentials type alias；surface Residual 869 锁。
> 非跨端 multi-engine E2E / 全量 PR 门禁。状态保持 **实施中**；不改 §13.2 checkbox。

> 续进展 2026-07-23（阶段 6 残留八百七十轮）：§13.2 聚焦证据套件复跑（含 residual 250–869
> DesktopLoginRequest dual retired 锁，不改 checkbox）——**231 文件 / 1075 测试**（app-vue 26/312、
> ai 34/257、repository 6/35、contracts 125/370、governance 2/4、api 10/24、data-portability 4/18、… desktop 6/12、task 2/4）+ `GOV_EXIT:0`。
> 相对 residual 868：desktop +1 file / +3 tests（residual 869 surface×1×3）。
> 仍为部分/外部阻塞：真实 OAuth 跨端 E2E、完整跨端 multi-engine product E2E、真实 Pi spawn、
> GitHub App fixture E2E、全量 PR 门禁、跨进程 durable task runtime / 完整 LangGraph。
> 状态保持 **实施中**；PR 就绪仍为否。




















































































































































## 13. 测试与完成定义

### 13.1 必测场景

- 三种登录/profile 建立与访客升级。
- GitHub 登录不自动获得仓库权限。
- 账密用户独立绑定 GitHub 仓库。
- private repo 创建、已有仓库连接、同名冲突和安装撤销。
- 本地/远端空或非空四类首次对账。
- 离线 commit、恢复 push、远端领先、rebase 和冲突暂停。
- webhook 重放、漏 webhook、force push、repo rename/delete/public。
- Web 幂等创建、并发创建、路径冲突和 Desktop pull。
- Agent 上下文缺失、变化、恶意内容、路径穿越和用户取消。
- Markdown XSS、危险 URL、递归 embed 和超大附件。
- RAG 只索引当前 commit，删除后不再召回。

### 13.2 完成定义

> 审计时间 2026-07-22（残留六百二十六轮刷新：三入口/Agent/门禁仍为部分或外部阻塞；不改 checkbox）。
> 状态标记：已证明 / 部分实现 / 外部阻塞 / 仍未实现。只有证据充分才改 checkbox。
> focused evidence suite tip（残留六百二十六轮）：**113 文件 / 724 测试** + governance-check GOV_EXIT:0。
> 不因此把三入口完整 E2E、Agent multi-engine 全量、全量 PR 门禁未完成项打勾。
> 阶段 6 dual 收口（残留 250–300；四百八十七轮补 task DAG *ViewModel 消费者收口；五百三十九轮 portable editor_* / knowledge routes / /note strip 再锁）与身份隔离 dual-method 收口（残留 169–192）指针仍有效。
> Host task.create 进程内产品路径（残留 427–491 + 501–589）：AgentType + toolMode + start/store/resume(cancel/confirm/edit)
> + history/session focus + linked goal restore + client settlement 会话隔离 + store 容量边界 + process-local product journey + runId 身份/会话/thread 绑定 + confirm 必须 client executedActions + edit 非空 title + dirty approve 先 process-local revise + start 必须 conversationId（runtime+builder fail-closed，无 silent null）+ start 必须 threadId（trim 非空 fail-closed）+ start 非空 title（builder fail-closed，无静默默认）+ confirm settlement title/templateId 可回收 + confirm goalId/title 禁重绑 + confirm 仅 process-local draft + 单 executed + edit 单 approvedAction + edit/confirm tool+empty-action 命名常量 fail-closed + cancel/confirm/edit 仅 waiting_approval（Host+client complete 双门禁）+ edit draftAction 单 create_task_template（541）+ confirm settlementAction 单 create_task_template（543）+ confirm store draftAction 单 create_task_template（545）+ client complete/revise sole draftAction（547）+ workbench soleProductDraftAction（549）+ applyHost*Patch sole product draftAction（551）+ confirm store draft resolve sole create_task_template（553）+ knowledge.write confirm sole create_knowledge_note（555）+ goal.create confirm sole create_goal（557）+ goal confirm/cancel + knowledge confirm waiting_approval-only（559）+ Host panel goal/knowledge approve pre-lifecycle product gate（561）+ Host panel task.create approve pre-lifecycle sole create_task_template（563）+ Host panel product reject pre-lifecycle waiting_approval（565）+ Host panel product revise pre-lifecycle waiting_approval（567）+ Host panel shared product ownership resolver（569）+ Host panel settlement reuses shared ownership（571）+ Host panel revise sole product draftAction（573）+ goal session primary-task confirm sole create_task_template（575）+ Host panel primary-task-shaped ownership → create_task_template（577）+ Host panel primary-task-shaped settlement via goal session（579）+ Host panel settlement ownership classifiers（581）+ goal session primary-task confirm forwards Host-revised goalId（583）+ Host workbench primary-task exclusive kind routing（585）+ goal session Host lifecycle kind primary-task → task.create（587）+ dual-mirror primary-task goal session settle into exclusive task lane（589）；永不 `executeApproved`。
> Client product-lane isolation（残留 501/507/519–537/547/549/551/555/557/559/561/563/565/567/569/571/573/575/577/579/581/583/585/587/589）：complete/revise/draft title·path·markdown·summary·pendingCount·primaryEntityId·receipt cross-lane·failed message·ok 均 product-tool 门禁。
> 仍非跨进程 durable / 完整 Task LangGraph / 跨端 Playwright-Electron multi-engine E2E。
> 身份隔离 dual-method 收口（残留 169–179）：业务聚合 bare `findById` 双轨已基本拆除；intentional
> dual/bootstrap 与自然主键路径均已 surface 锁定：schedule-task（180）、knowledge connection（186）、
> webhook delivery（187）、auth session token（188）、notification template catalog（189）、
> governance rule catalog（190）、account/auth-identity 自然主键（192）。
> 不因此把三入口/Agent/E2E 未完成项打勾。

- [ ] 账密、GitHub 和访客入口均可用。 **（部分实现）**
  证据：Web/Desktop 认证路由与 E2E auth-flow 覆盖账密/GitHub 登录；Desktop 访客 profile 代码存在；
  残留二十三轮补 surface contract 单测：`packages/app-vue/src/views/DesktopAuthView.spec.ts`
  （账密 + guest-mode-button，无 login-github-button）；`apps/web/src/auth/WebAuthView.spec.ts`
  （账密 + 条件 login-github-button，无 guest-mode-button；OAuth 不可用时隐藏 GitHub）。
  残留二十四轮：Web auth guard 硬跳转 AuthApp（`createAuthGuard` + hard redirect specs）。
  残留二十五轮：删除死 `LoginForm`/`RegisterForm`；Web 主壳 `/auth` 默认改为
  `AuthPlatformEntry` full-page 进入 AuthApp（删除遗留 in-shell `AuthView`）。
  残留二十八轮：`three-login-surface.matrix.spec.ts` 固化 Web shell 硬跳转 / AuthApp 账密+GitHub /
  Desktop 账密+访客矩阵；`authentication.md` 与实现边界对齐（不再声称 OAuth UI 缺失）。
  残留三十轮：删除 phone/SMS 空壳登录注册运行时面，三入口仅账密 / GitHub / Desktop 访客。
  残留三十一轮：删除 password-reset 双轨 store shim；Web auth page contract 明确无 phone/SMS/guest。
  残留三十二轮：`three-login-surface.matrix.spec.ts` 增加同一 fixture 串联 journey（Web 硬跳转 AuthApp →
  AuthApp 账密+GitHub → Desktop 账密+访客 → 访客升级 profileId/vaultDir 不变 → guest/offline 禁云端知识库）；
  Desktop `guest-upgrade-vault-boundary.journey.spec.ts` + `toCloudAccessToken.spec.ts` 补访客升级与云端 token 门禁。
  残留四十轮：`three-login-surface.matrix.spec.ts` 增加 step 6（GitHub 登录仅身份、不蕴含 knowledge-repo App 授权）；
  残留四十三轮：三入口 matrix step 7 固化无 phone/SMS；auth identity 仓储删除 findByPhone/existsByPhone；
  残留七十五轮：matrix step 8 固化 server-held data disclosure 为 Web-only（Desktop 不暴露）；
  残留一百零三轮：matrix step 9 固化 AuthPlatformEntry/DesktopAuthView/WebAuthView/
  useDataPortability 源码边界与矩阵一致。
  残留三百零七轮：matrix step 10 固化 GitHub OAuth identity 永不授予 knowledge-repo App installation/token
  （IPC auth:oauth* vs repository:knowledge-connection*、get-oauth-url identity-only scopes、
  HTTP /oauth/* vs /knowledge-connections/*、product authentication.md 与三入口 UI 源码对齐；15 通过）。
  残留一百零六轮：server-held disclosure import fail-closed（parse + ImportUserData 用例）。
  残留一百八十一轮：复跑 `three-login-surface.matrix.spec.ts`（14 通过）证据仍在；不因 dual-method 收口改写为已证明。
  残留二百零四轮：复跑 three-login matrix + repository/router notePanelAdaptation 等共 22 通过；仍为部分（缺真实 OAuth 跨端 E2E）。
  残留二百零八轮：复跑 three-login matrix + notePanel + terminology/deeplink surfaces 共 25 通过；仍为部分（缺真实 OAuth 跨端 E2E）。
  残留二百一十二轮：复跑 three-login + notePanel + terminology/deeplink + legacy-note surface 共 27 通过；仍为部分（缺真实 OAuth 跨端 E2E）。
  残留二百一十六轮：复跑 three-login + notePanel + terminology/deeplink + legacy-note surface 共 27 通过；仍为部分（缺真实 OAuth 跨端 E2E）。
  残留二百一十九轮：复跑 three-login + notePanel + terminology/deeplink + legacy-note surface 共 27 通过；仍为部分（缺真实 OAuth 跨端 E2E）。
  残留二百二十四轮：复跑 three-login + notePanel + terminology/deeplink + legacy-note surface 共 27 通过；仍为部分（缺真实 OAuth 跨端 E2E）。
  残留二百二十八轮：复跑 three-login + notePanel + terminology/deeplink + legacy-note + menu-labels surface 共 29 通过；仍为部分（缺真实 OAuth 跨端 E2E）。
  残留二百三十一轮：复跑 three-login + notePanel + terminology/deeplink + legacy-note + menu-labels + schedule-router surface 共 31 通过；仍为部分（缺真实 OAuth 跨端 E2E）。
  残留二百三十四轮：复跑 three-login + notePanel + terminology/deeplink + legacy-note + menu-labels + schedule-router surface 共 32 通过；仍为部分（缺真实 OAuth 跨端 E2E）。
  仍缺：真实跨端 Playwright/Electron 一揽子 E2E（含真实 OAuth/GitHub fixture）。
  残留五百四十一轮：§13.2 证据审计刷新（tip suite 627 + product-lane/stage-6 指针）；仍为部分（缺真实 OAuth 跨端 E2E）。
  残留八百五十九轮：DomainDate dual keep-boundary surface 锁 + exact VO duals 已尽；仍为部分（缺真实 OAuth 跨端 E2E）。
- [x] GitHub 登录与仓库授权在 UI、contract 和 token 上完全解耦。 **（已证明）**
- [x] 访客和未绑定用户不上传 Vault 内容。 **（已证明）**
- [x] Desktop 本地 Vault 在云端故障时仍可用。 **（已证明）**
- [x] GitHub App 只访问用户明确授权的 knowledge repository。 **（已证明）**
  残留一百一十一轮：connection status 转移 identity-scoped（disconnect updateStatus id+identityId）。
  残留一百一十二轮：connection 读路径 findByIdForIdentity + purger deleteMany id+identityId。
  残留一百一十三轮：connection save 拒绝跨 identity 改写（updateMany id+identityId，无 identity 字段）。
- [x] private repo 可创建/连接，连接两个非空仓库不会自动覆盖。 **（已证明）**
- [x] Desktop Git 同步具备离线恢复且不 force push。 **（已证明）**
- [x] 冲突明确暂停并保留双方内容。 **（已证明）**
- [x] Web 新建笔记产生唯一 Git commit，重复请求不重复创建。 **（已证明）**
  残留一百零九轮：write-request status 转移 identity-scoped（retry/markCommitted/markFailed）。
- [x] 已有笔记编辑在首期仍关闭。 **（已证明）**
  残留二百零一轮：`confirmed-create-only-note-boundary.surface.spec.ts` +
  `notePanelAdaptation.spec.ts` 锁定 confirmed-create-only 写面、无现有笔记 update API、
  projection `editDraft` 仅 draft 回退、Local Vault 独占创建与 Obsidian 外链编辑。
- [x] AI 无固定默认目录设置，完整写入提案必须获得用户确认。 **（已证明）**
- [ ] Agent 上下文不能逃逸 Vault、执行代码、扩大授权或绕过用户确认。 **（部分实现）**
  证据：知识笔记 `CreateKnowledgeNoteSchema` 强制 confirmation；targetSubpath 拒绝绝对路径与
  `.`/`..`（contracts dto specs）；`AIKnowledgeNotePathResolver` 应用层同样拒绝 vault-escaping
  路径；runtime 仅在 `userDecision=confirm` 时解析 `execution.required` 并执行 side-effect
  （knowledge cancel 与 goal cancel 即使 interrupt 残留也不落盘/不跑 automation）；
  `AgentToolName` 首期不含 `update_knowledge_note`/`reindex_resource`；knowledge executor 对
  跨能力工具（如 `create_goal`）失败关闭；goal executor 对称地对 `create_knowledge_note`
  fail-closed（不调用 goal automation / knowledge persistence）；Agent runtime get/start/resume
  对非本 identity 的 run 返回 `FORBIDDEN`，list 过滤外 identity；contracts `resolveRunPlan`
  按 surface fail-closed（Desktop 需 local_vault，Web 需 cloud_rag；readonly 不能顶替 mutation）；
  Desktop `toCloudAccessToken` 阻止 guest/offline 占位 token 调用 GitHub knowledge App /
  PowerSync 云端 API，设置页仅 online 账户可发起连接。
  残留二十八轮：contracts `resolveRunPlan` 增补 Web knowledge-write / 跨 surface / goal-offer 不能
  顶替 knowledge mutation 的规格。
  残留二十九轮：AI runtime `startRun` 对 knowledge.generate 接线 capability plan fail-closed；
  `goalAutomationRequirements` 纯函数；goal mutation 仍在 execution 阶段强制。
  残留三十二轮：新增 host-boundary journey
  `packages/ai/src/server/infrastructure/runtime/__tests__/adr-035-capability-turn-isolation.journey.spec.ts`
  （同一 fixture 串联：surface-scoped plan → start gate → confirm-only mutation → cancel 无副作用 →
  cross-capability fail-closed → identity get/list 隔离 → vault path/confirmation/tool surface）。
  残留一百八十一轮：复跑 `adr-035-capability-turn-isolation.journey.spec.ts`（13 通过）；证据强化但仍为部分实现。
  残留二百零四轮：复跑 `adr-035-capability-turn-isolation.journey.spec.ts`（13 通过）；仍为部分（缺 multi-engine Turn Engine E2E）。
  残留二百零八轮：复跑 ADR-035 journey（13 通过）+ knowledge terminology surfaces；仍为部分（缺 multi-engine Turn Engine E2E）。
  残留二百一十二轮：复跑 ADR-035 journey（13 通过）+ knowledge terminology surface；仍为部分（缺 multi-engine Turn Engine E2E）。
  残留二百一十六轮：复跑 ADR-035 journey（13 通过）+ knowledge terminology/source/index/snake surfaces；仍为部分（缺 multi-engine Turn Engine E2E）。
  残留二百一十九轮：复跑 ADR-035 journey（13 通过）+ knowledge terminology/source/index/python/snake surfaces；仍为部分（缺 multi-engine Turn Engine E2E）。
  残留二百二十四轮：复跑 ADR-035 journey（13 通过）+ knowledge term/source/index/python/snake/checkpoint/goal/eval surfaces；仍为部分（缺 multi-engine Turn Engine E2E）。
  残留二百二十五轮：goal.create usage/key-result dual-get 收口 + surface；仍为部分（缺 multi-engine Turn Engine E2E）。
  残留二百二十八轮：复跑 ADR-035 journey（13 通过）+ knowledge/goal/eval/usage/runner surfaces；仍为部分（缺 multi-engine Turn Engine E2E）。
  残留二百三十一轮：复跑 ADR-035 journey（13 通过）+ knowledge/goal/eval/usage/runner/mocks surfaces；仍为部分（缺 multi-engine Turn Engine E2E）。
  残留二百三十四轮：复跑 ADR-035 journey（13 通过）+ knowledge/goal/eval/usage/runner/mocks surfaces；仍为部分（缺 multi-engine Turn Engine E2E）。
  仍缺：多 Turn Engine 完整 E2E、跨端对抗 Playwright E2E 与真实 fixture。
  残留四十轮：`adr-035-capability-turn-isolation.journey.spec.ts` 增加 multi-turn 二次 confirm 不重复落盘，以及 Web surface 无法满足 Desktop `local_vault` knowledge-write 要求；仍缺完整 multi-engine Turn Engine E2E 与跨端对抗性 Playwright/Electron E2E。
  残留七十四轮：journey step 10 固化 readonly cloud_rag/proposal 不能满足 knowledge mutation；
  AI deep-link surface 固化 `openRecentKnowledgeNote` → `/repository?note=`（无 `/note/:id`）。
  残留七十五轮：journey step 11 固化 multi-engine（direct_turn / pi_readonly / cli_readonly）
  offer 单独不能满足 knowledgeWriteRequirements，错误 engineId 在缺能力时仍为 `none`；
  server-held disclosure Web-only：`useDataPortability` + IPC adapter NOT_SUPPORTED +
  three-login matrix step 8。
  残留七十六轮：journey step 12 固化 start gate 对仅 multi-engine offer 的 knowledge.generate
  fail-closed；Desktop AuthRemoteGateway 成功响应强制 data 信封（无 raw dual-track）。
  仍缺完整 multi-engine Turn Engine E2E 与跨端对抗 Playwright/Electron。
  残留一百/一百零一轮：AI 客户端 agent/list/start/resume 等 Result 端口与 dead stream 双接口清理
  已完成（transport 边界不再 throw-unwrap）；仍不替代完整 multi-engine Turn Engine E2E。
  残留一百零二轮：journey step 13 + runtime 在 side-effect 前 ownership fail-closed；MSW
  governance void delete 对齐 data:null。
  残留一百零三轮：journey step 14 getEvents ownership；三入口 matrix step 9 源码边界锁定。
  残留一百零四轮：journey step 15 owned getEvents passthrough + ownership surface。
  残留一百零五轮：checkpoint upsert 拒绝 foreign runId 覆盖与 run.identityId 冒充。
  残留一百零七轮：checkpoint get/list 过滤 spoofed run.identityId metadata。
  残留一百一十四轮：conversation get/update/delete identity-scoped（findByIdForIdentity）。
  残留一百一十五轮：provider config get/update/delete identity-scoped（findByIdForIdentity）。
  残留一百一十六轮：goal folder get/update/delete identity-scoped（findByIdForIdentity）。
  残留一百一十七轮：goal get/update/delete + record create/delete identity-scoped（findByIdForIdentity）。
  残留一百一十八轮：goal archive/activate/complete/permanent-delete identity-scoped（findByIdForIdentity）。
  残留一百一十九轮：goal key-result/review mutations + listReviews/clone identity-scoped（findByIdForIdentity）。
  残留一百二十轮：goal create-parent/focus/list-records/progress/cross-module identity-scoped（findByIdForIdentity）。
  残留一百二十一轮：schedule task get/update/delete/actions + list identity-scoped（findByIdForIdentity）。
  残留一百二十二轮：schedule calendar event get/update/delete + conflict identity-scoped（findByIdForIdentity）。
  残留一百二十三轮：task template get/update/delete/actions + list-instances identity-scoped（findByIdForIdentity）。
  残留一百二十四轮：task instance get/complete/skip/start/delete identity-scoped（findByIdForIdentity）。
  残留一百二十五轮：task dependency list/update/delete/validate/chain identity-scoped（findByIdForIdentity）。
  残留一百二十六轮：notification get/mark-read/update/delete/batch identity-scoped（findByIdForIdentity）。
  残留一百二十七轮：reminder template/group get/update/delete/actions identity-scoped（findByIdForIdentity）。
  残留一百二十八轮：reminder findByGroupId identity-scoped（list/batch/domain stats）。
  残留一百二十九轮：reminder response stats/list/delete + frequency analyze identity-scoped。
  残留一百三十轮：goal/reminder schedule projection+execution identity-scoped load。
  残留一百三十一轮：schedule runtime sync/execute identity-scoped load。
  残留一百三十二轮：task schedule projection+execution identity-scoped load。
  残留一百三十三轮：task findByTemplateId identity-scoped。
  残留一百三十四轮：task template-scoped instance queries identity-scoped。
  残留一百三十五轮：reminder domain/control/mapper identity-scoped loads。
  残留一百三十六轮：reminder findByIds identity-scoped。
  残留一百三十七轮：knowledge projection system connection ownership re-verify。
  残留一百三十八轮：notification domain service identity-scoped loads。
  残留一百三十九轮：auth session findByIdForIdentity（revoke/getCurrentUser）。
  残留一百四十轮：task template findByFolderId/findByGoalId identity-scoped。
  残留一百四十一轮：goal record secondary queries + findByFolderId identity-scoped。
  残留一百四十二轮：task template findByKeyResultId/findSubtasks identity-scoped。
  残留一百四十三轮：task folder findByIdForIdentity/delete/exists identity-scoped。
  残留一百四十四轮：schedule execution findByIdForIdentity/findByTaskId identity-scoped。
  残留一百四十五轮：focus session findByIdForIdentity/findByGoalId/delete/exists identity-scoped。
  残留一百四十六轮：focus mode findByIdForIdentity/delete identity-scoped。
  残留一百四十七轮：notification preference findByIdForIdentity/delete/exists identity-scoped。
  残留一百四十八轮：reminder response findByIdForIdentity identity-scoped。
  残留一百四十九轮：weight snapshot query/delete identity-scoped。
  残留一百五十轮：notification related/delete/markMany identity-scoped。
  残留一百五十一轮：reminder group/template delete/exists identity-scoped。
  残留一百五十二轮：goal folder exists identity-scoped。
  残留一百五十三轮：task dependency deleteByTaskId identity-scoped。
  残留一百五十四轮：goal record deleteMany identity-scoped。
  残留一百五十五轮：schedule task deleteBatch identity-scoped。
  残留一百五十六轮：task template deleteBatch identity-scoped。
  残留一百五十七轮：task instance deleteMany identity-scoped。
  残留一百五十八轮：goal exists/batchUpdateStatus identity-scoped。
  残留一百五十九轮：task template softDelete/restore identity-scoped。
  残留一百六十轮：goal batchMoveToFolder identity-scoped。
  残留一百六十一轮：goal isAncestor/findChildren identity-scoped。
  残留一百六十二轮：schedule task list methods identity-required。
  残留一百六十三轮：task template findByIdWithChildren identity-scoped。
  残留一百六十四轮：reminder findActive identity-required。
  残留一百六十五轮：schedule task query/count identity-required。
  残留一百六十六轮：task dependency findAggregateById identity-scoped。
  残留一百六十七轮：legacy editor/repository runtime surface audit。
  残留一百六十八轮：schedule projection source identity-required (no bare findById)。
  残留一百六十九轮：AI conversation/provider findById dual-method collapse。
  残留一百七十轮：calendar schedule findById dual-method collapse。
  残留一百七十一轮：goal folder findById dual-method collapse。
  残留一百七十二轮：focus mode/session findById dual-method collapse。
  残留一百七十三轮：weight snapshot findById dual-method collapse。
  残留一百七十四轮：reminder group/response findById dual-method collapse。
  残留一百七十五轮：reminder template findById dual-method collapse。
  残留一百七十六轮：task folder/dependency findById dual-method collapse。
  残留一百七十七轮：task template/instance findById dual-method collapse。
  残留一百七十八轮：goal/notification/preference findById dual-method collapse。
  残留一百七十九轮：schedule execution findById dual-method collapse。
  残留一百八十轮：schedule-task bootstrap dual lock + packages/editor absence lock。
  残留一百八十一轮：§13.2 partial-item evidence re-audit (no checkbox changes)。
  残留一百八十二轮：root package.json drop deleted editor Nx project from scripts。
  残留一百八十三轮：CI coverage.yml drop deleted editor Nx project。
  残留一百八十四轮：ADR-031/032 + surface lock exclude retired editor package。
  残留一百八十五轮：§13.2 core evidence suite re-run (66 tests, no checkbox changes)。
  残留一百八十六轮：knowledge connection bootstrap dual lock (mirror residual 180)。
  残留一百八十七轮：GitHub webhook delivery bootstrap dual lock (connectionId write fence)。
  残留一百八十八轮：auth session trusted-token bootstrap dual lock (JWT/refresh bare only)。
  残留一百八十九轮：notification template system-global catalog surface lock。
  残留一百九十轮：governance rule global catalog surface lock (authorId metadata only)。
  残留一百九十一轮：§13.2 core evidence suite re-run (87 tests, dual/catalog locks, no checkbox changes)。
  残留一百九十二轮：account/auth-identity natural primary-key ownership surface lock。
  残留一百九十三轮：portable editor backup re-import boundary surface lock。
  残留一百九十四轮：notification preference update identityId required at call boundary。
  残留一百九十五轮：§13.2 core evidence suite re-run (107 tests, ownership/portable locks, no checkbox changes)。
  残留一百九十六轮：notification preference HTTP/Electron transport wired (ctx.identityId only)。
  残留一百九十七轮：notification preference client port + HTTP/IPC adapters。
  残留一百九十八轮：§13.2 core evidence suite re-run (118 tests, preference transport/client, no checkbox changes)。
  残留一百九十九轮：Settings UI wires notification module channel preferences (no identity dual-track)。
  残留二百轮：preference UI focused evidence re-run (no checkbox changes)。
  残留二百零一轮：confirmed-create-only / existing-note-edit-closed surface lock。
  残留二百零二轮：retire in-app editor preference dual-track + ADR-034 status align。
  残留二百零三轮：retire dual-track setting enum/definition value objects。
  残留二百零四轮：§13.2 core evidence suite re-run (157 tests, residuals 201–203 locks, no checkbox changes)。
  残留二百零五轮：align module-index + drop bookmark menu dual-track (no hard-fail stub claim)。
  残留二百零六轮：retire AI Resource dual-track knowledge terminology (note wording + surface lock)。
  残留二百零七轮：server/ai-service knowledge note terminology (no repository resources product copy)。
  残留二百零八轮：eval/fixture note terminology + §13.2 core evidence suite re-run (205 tests, no checkbox changes)。
  残留二百零九轮：drop MSW legacy Resource/Folder dual-track 404 stubs (knowledge-only handlers)。
  残留二百一十轮：align plan stage-6 summary (no hard-fail CRUD dual-track claim; MSW knowledge-only)。
  残留二百一十一轮：module-index + goal-workflow e2e drop legacy hard-fail/debug dual-track claims。
  残留二百一十二轮：§13.2 core evidence suite re-run (204 tests, residual 211 locks, no checkbox changes)。
  残留二百一十三轮：AI knowledge source port Resource→Note naming (wire related_resources stable)。
  残留二百一十四轮：AI knowledge index/sync Resource→Note naming (wire indexed_resources stable)。
  残留二百一十五轮：ai-service agent input snake_case only (drop camelCase dual-track keys)。
  残留二百一十六轮：§13.2 core evidence suite re-run (212 tests, residuals 213–215 locks, no checkbox changes)。
  残留二百一十七轮：ai-service agent input residual duals → snake_case only (token/provider/processing/matched)。
  残留二百一十八轮：Python knowledge Resource→Note naming (wire resource/indexed_resource stable)。
  残留二百一十九轮：§13.2 core evidence suite re-run (216 tests, residuals 217–218 locks, no checkbox changes)。
  残留二百二十轮：AI evaluation report on-disk snake_case single track (drop camelCase dual read)。
  残留二百二十一轮：drop legacy build_file_backed_* checkpoint factory dual-track (settings-based only)。
  残留二百二十二轮：GoalPlanningService drop unused backward-compat re-exports (parsers/tools stay direct)。
  残留二百二十三轮：repository note mutation event Resource→Note naming (wire resourceId/path stable)。
  残留二百二十四轮：§13.2 core evidence suite re-run (225 tests, residuals 220–223 locks, no checkbox changes)。
  残留二百二十五轮：goal.create usage/key-result single-track (AgentUsage + targetValue only)。
  残留二百二十六轮：evals/runner drop backward-compat re-export barrel (canonical module imports)。
  残留二百二十七轮：menu labels drop set/getMenuLocale dual-track (vue-i18n only)。
  残留二百二十八轮：§13.2 core evidence suite re-run (231 tests, residuals 225–227 locks, no checkbox changes)。
  残留二百二十九轮：AI runtime test mocks note port methods only (drop fetchAllResources stubs)。
  残留二百三十轮：schedule single calendar route + drop dead getBootstrapper dual-path + sourceNote fixture。
  残留二百三十一轮：§13.2 core evidence suite re-run (235 tests, residuals 229–230 locks, no checkbox changes)。
  残留二百三十二轮：schedule docs/E2E align single calendar entry (drop dual week e2e + stale indexes)。
  残留二百三十三轮：schedule redesign docs current-state + UpcomingReminderDTO contracts-only re-export。
  残留二百三十四轮：§13.2 core evidence suite re-run (238 tests, residuals 232–233 locks, no checkbox changes)。
  残留二百三十五轮：desktop auth TokenStorageData/contracts-only types + drop AI domain ai-provider-config dual barrel。
  残留二百三十六轮：desktop auth application/session drop convenience dual re-exports (canonical imports only)。
  残留二百三十七轮：§13.2 core evidence suite re-run (249 tests, residuals 235–236 locks, no checkbox changes)。
  残留二百三十八轮：authentication drop PowerSync powersync/ dual barrel (powersync.ts single-track)。
  残留二百三十九轮：goal priority drop GoalPriorityLevel dual + calculator type re-export; domain/priority canonical。
  残留二百四十轮：authentication drop AuthenticationRuntimeContribution dual alias (Module type only)。
  残留二百四十一轮：§13.2 core evidence suite re-run (258 tests, residuals 238–240 locks, no checkbox changes)。
  残留二百四十二轮：desktop drop dead shared/contracts electron dual re-export barrel。
  残留二百四十三轮：cross-module drop *RuntimeContribution dual aliases (Module type only)。
  残留二百四十四轮：dashboard drop contracts DTO convenience re-export (contracts-only DTO path)。
  残留二百四十五轮：§13.2 core evidence suite re-run (262 tests, residuals 242–244 locks, no checkbox changes)。
  残留二百四十六轮：drop NotificationUseCases/ReminderUseCases/AITransportHandlers dual aliases + app-vue useI18n re-export。
  残留二百四十七轮：drop unused Task DAG ViewModel duals + goal application/types ExecutionContext dual barrel。
  残留二百四十八轮：drop unused AI composable Goal/KnowledgeNote AgentArtifact dual aliases。
  残留二百四十九轮：§13.2 core evidence suite re-run (270 tests, residuals 246–248 locks, no checkbox changes)。
  残留二百五十轮：drop AI createAITransportHandlers identity dual + app-vue governance types.ts contracts dual barrel。
  残留二百五十一轮：app-vue dashboard types keep port only (contracts DTO path for DashboardData)。
  残留二百五十二轮：collapse AI composable agent dual aliases to contracts AgentRun/AgentAction/SendMessageRes。
  残留二百五十三轮：§13.2 focused evidence suite re-run (100 tests, residuals 250–252 locks, no checkbox changes)。
  残留二百五十四轮：collapse GoalDraft/GoalClarification dual aliases to contracts GoalWorkflowDraftResultDTO/GoalClarificationDTO。
  残留二百五十五轮：§13.2 focused evidence suite re-run (115 tests, residuals 250–254 locks, no checkbox changes)。
  残留二百五十六轮：desktop drop shared/types ipc-channels dual re-export barrel (contracts electron/governance only)。
  残留二百五十七轮：task drop domain/events contracts re-export dual barrel (TaskEventMap from contracts only)。
  残留二百五十八轮：§13.2 focused evidence suite re-run (119 tests, residuals 250–257 locks, no checkbox changes)。
  残留二百五十九轮：collapse StreamMessageDonePayload dual alias to SendMessageRes in contracts protocol maps。
  残留二百六十轮：drop unused ScheduleTaskDTO/ScheduleExecutionDTO dual aliases (ClientDTO only)。
  残留二百六十一轮：§13.2 focused evidence suite re-run (123 tests, residuals 250–260 locks, no checkbox changes)。
  残留二百六十二轮：drop TaskDomainEvent + Complete/SkipTaskInstanceRes dual aliases (TaskInstanceOperationRes only)。
  残留二百六十三轮：drop 19 dead unused contracts *Res identity dual aliases (no protocol/call-site consumers)。
  残留二百六十四轮：§13.2 focused evidence suite re-run (127 tests, residuals 250–263 locks, no checkbox changes)。
  残留二百六十五轮：drop contracts AssetImageKey = string dual (assets package owns branded key)。
  残留二百六十六轮：collapse module IResultIpcClient duals to @dailyuse/ipc-client canonical interface。
  残留二百六十七轮：§13.2 focused evidence suite re-run (136 tests, residuals 250–266 locks, no checkbox changes)。
  残留二百六十八轮：dashboard adapters collapse local IResultHttpClient/IResultIpcClient duals to canonical packages。
  残留二百六十九轮：§13.2 focused evidence suite re-run (138 tests, residuals 250–268 locks, no checkbox changes)。
  残留二百七十轮：collapse DesktopBridge/ElectronAPI duals to ipc-client ElectronBridge。
  残留二百七十一轮：§13.2 focused evidence suite re-run (144 tests, residuals 250–270 locks, no checkbox changes)。
  残留二百七十二轮：governance drop GovernanceIpcTransport dual; use IResultIpcClient。
  残留二百七十三轮：§13.2 focused evidence suite re-run (146 tests, residuals 250–272 locks, no checkbox changes)。
  残留二百七十四轮：ResultHttpClient implements IResultHttpClient (symmetry with ipc-client)。
  残留二百七十五轮：§13.2 focused evidence suite re-run (151 tests, residuals 250–274 locks, no checkbox changes)。
  残留二百七十六轮：move ISettingApiClient/IDataPortabilityApiClient into application-client ports。
  残留二百七十七轮：§13.2 focused evidence suite re-run (157 tests, residuals 250–276 locks, no checkbox changes)。
  残留二百七十八轮：collapse DataPortabilityClientPort to IDataPortabilityApiClient type alias。
  残留二百七十九轮：§13.2 focused evidence suite re-run (159 tests, residuals 250–278 locks, no checkbox changes)。
  残留二百八十轮：collapse SettingClientPort to ISettingApiClient type alias (importSettings options pass-through)。
  残留二百八十一轮：§13.2 focused evidence suite re-run (161 tests, residuals 250–280 locks, no checkbox changes)。
  残留二百八十二轮：collapse AuthenticationClientPort to IAuthApiClient type alias。
  残留二百八十三轮：§13.2 focused evidence suite re-run (163 tests, residuals 250–282 locks, no checkbox changes)。
  残留二百八十四轮：collapse RepositoryClientPort to IRepositoryApiClient type alias。
  残留二百八十五轮：§13.2 focused evidence suite re-run (165 tests, residuals 250–284 locks, no checkbox changes)。
  残留二百八十六轮：collapse ReminderClientPort to IReminderApiClient type alias。
  残留二百八十七轮：§13.2 focused evidence suite re-run (167 tests, residuals 250–286 locks, no checkbox changes)。
  残留二百八十八轮：collapse NotificationClientPort to INotificationApiClient (drop dismissAll dual)。
  残留二百八十九轮：§13.2 focused evidence suite re-run (169 tests, residuals 250–288 locks, no checkbox changes)。
  残留二百九十轮：drop 6 more dead unused contracts *Res dual aliases (extend residual 263 surface)。
  残留二百九十一轮：§13.2 focused evidence suite re-run (169 tests, residuals 250–290 locks, no checkbox changes)。
  残留二百九十二轮：lock AccountClientPort intentional DTO→domain mapping dual (do not type-alias collapse)。
  残留二百九十三轮：§13.2 focused evidence suite re-run (171 tests, residuals 250–292 locks, no checkbox changes)。
  残留二百九十四轮：lock GoalClientPort intentional multi-API mapping facade dual (do not type-alias collapse)。
  残留二百九十五轮：§13.2 focused evidence suite re-run (173 tests, residuals 250–294 locks, no checkbox changes)。
  残留二百九十六轮：lock TaskClientPort intentional multi-API mapping facade dual (do not type-alias collapse)。
  残留二百九十七轮：§13.2 focused evidence suite re-run (175 tests, residuals 250–296 locks, no checkbox changes)。
  残留二百九十八轮：lock ScheduleClientPort intentional multi-API mapping facade dual (do not type-alias collapse)。
  残留二百九十九轮：lock AIClientPort intentional multi-API thin facade dual (do not type-alias collapse)。
  残留三百轮：§13.2 focused evidence suite re-run (179 tests, residuals 250–299 locks, no checkbox changes)。
  残留三百零一轮：§13.2 evidence-pointer refresh + UI redesign docs/runtime boundary alignment (no checkbox changes)。
  残留三百零二轮：§13.2 focused evidence suite re-run (180 tests, residuals 250–301 locks, no checkbox changes)。
  残留三百零三轮：lock portable editor backup vs Web-only server-held disclosure split (IPC channels/adapters/docs)。
  残留三百零四轮：§13.2 focused evidence suite re-run (193 tests, residuals 250–303 locks, no checkbox changes)。
  残留三百零五轮：ADR-035 journey step 16 multi-engine label isolation + stage-0 ITurnEnginePort freeze surface (Agent still partial)。
  残留三百零九轮：`adr-035-multi-engine-turn-conformance.harness.spec.ts` 双引擎同 suite isolation harness（14 通过；in-suite doubles only）。
  残留三百一十一轮：Agent Host stage-0 composition freeze（runtime offers 无 engine.*；module 未注册 Turn Engine ports；生产 port 实现仍为空）。
  残留三百一十四轮：生产 `DirectTurnEngine`（engine.direct_turn）实现 ITurnEnginePort 并挂到 `createAIModule().turnEngine`；仍无第二引擎/Workflow adapter。
  残留三百一十六轮：Send/Stream open chat use cases 经同一 DirectTurnEngine（IOpenChatTurnPort）；不再直连 chatExecution ctor 旁路。
  残留三百一十八轮：LangGraphWorkflowAdapter 包装 IAgentRuntimePort；workflow offers 不含 mutation；remote 接线、direct null。
  残留三百二十轮：生产 `ProposalKernel`（IProposalKernelPort）生命周期 + `module.proposalKernel`；不执行 mutation；仍无 Capability Resolver。
  残留三百二十一轮：§13.2 focused evidence suite re-run（239 tests，residuals 250–320 锁；不改 checkbox）。
  残留三百二十二轮：生产 `CapabilityResolver`（ICapabilityResolverPort）fail-closed + `module.capabilityResolver`；无静默 engine.*。
  残留三百二十三轮：§13.2 focused evidence suite re-run（246 tests，residuals 250–322 锁；不改 checkbox）。
  残留三百二十四轮：`startRun` knowledge.generate 门禁经共享 CapabilityResolver.resolveFor（热路径）。
  残留三百二十五轮：§13.2 focused evidence suite re-run（247 tests，residuals 250–324 锁；不改 checkbox）。
  残留三百二十六轮：§13.2 证据指针刷新（Host residual 305–325；不改 checkbox）。
  残留三百二十七轮：产品 ai/setting 文档对齐 ADR-034/035 runtime + surface 锁。
  残留三百二十八轮：§13.2 focused evidence suite re-run（253 tests，residuals 250–327 锁；不改 checkbox）。
  残留三百二十九轮：ai-files 索引对齐 server/* Host adapters + surface 锁。
  残留三百三十轮：§13.2 focused evidence suite re-run（254 tests，residuals 250–329 锁；不改 checkbox）。
  残留三百三十一轮：module-index 全量路径对齐 server/* + integrity surface。
  残留三百三十二轮：§13.2 focused evidence suite re-run（255 tests，residuals 250–331 锁；不改 checkbox）。
  残留三百三十三轮：three-login step 10 product-doc 显式 identity-only scopes（read:user/user:email）+ 无 repo Contents + 知识仓库 GitHub App installation/token 分离锁。
  残留三百三十四轮：§13.2 focused evidence suite re-run（255 tests，residuals 250–333 锁；不改 checkbox）。
  残留三百三十五轮：authentication-files 索引 OAuth 生产真值 + module-index surface 锁。
  残留三百三十六轮：§13.2 focused evidence suite re-run（256 tests，residuals 250–335 锁；不改 checkbox）。
  残留三百三十七轮：生产 CustomModelGateway（IModelGatewayPort）+ direct adapters 接线 + 删除 editor-test.html。
  残留三百三十八轮：§13.2 focused evidence suite re-run（260 tests，residuals 250–337 锁；不改 checkbox）。
  残留三百三十九轮：feature-map 认证/AI 真值 + 删除 web public debug 试页 + surface 锁。
  残留三百四十轮：§13.2 focused evidence suite re-run（263 tests，residuals 250–339 锁；不改 checkbox）。
  残留三百四十一轮：生产 ReadonlyAnalysisTurnEngine（engine.pi_readonly）第二 Turn Engine + module.readonlyTurnEngine。
  残留三百四十二轮：§13.2 focused evidence suite re-run（268 tests，residuals 250–341 锁；不改 checkbox）。
  残留三百四十三轮：生产 AssistantFacade（IAssistantFacadePort）统一 Host dispatch + module.assistantFacade。
  残留三百四十四轮：§13.2 focused evidence suite re-run（273 tests，residuals 250–343 锁；不改 checkbox）。
  残留三百四十五轮：AssistantFacade transport（dispatchAssistant + controller + /ai/assistant/dispatch/sse）。
  残留三百四十六轮：§13.2 focused evidence suite re-run（277 tests，residuals 250–345 锁；不改 checkbox）。
  残留三百四十七轮：AssistantFacade 客户端 dispatchAssistant（HTTP SSE + IPC NOT_SUPPORTED）。
  残留三百四十八轮：§13.2 focused evidence suite re-run（281 tests，residuals 250–347 锁；不改 checkbox）。
  残留三百四十九轮：Vue useAssistantDispatch 薄入口（仍不切换完整 open chat 默认路径）。
  残留三百五十轮：§13.2 focused evidence suite re-run（284 tests，residuals 250–349 锁；不改 checkbox）。
  残留三百五十一轮：open chat 默认经 dispatchAssistant/AssistantFacade（live delta + model）。
  残留三百五十二轮：§13.2 focused evidence suite re-run（285 tests，residuals 250–351 锁；不改 checkbox）。
  残留三百五十三轮：Desktop AssistantFacade IPC stream（ASSISTANT_DISPATCH_* + electron handler）。
  残留三百五十四轮：§13.2 focused evidence suite re-run（290 tests，residuals 250–353 锁；不改 checkbox）。
  残留三百五十五轮：Host Proposal approve/reject UI（agent-run bridge + Facade lifecycle 先于 resume executor）。
  残留三百五十六轮：§13.2 focused evidence suite re-run（298 tests，residuals 250–355 锁；不改 checkbox）。
  残留三百五十七轮：薄 Host Proposal 工作台面板（waiting_approval only + approve/reject Host lifecycle）。
  残留三百五十八轮：§13.2 focused evidence suite re-run（301 tests，residuals 250–357 锁；不改 checkbox）。
  残留三百五十九轮：Host Proposal revise-before-approve（revise_proposal + 面板修订 + 乐观并发）。
  残留三百六十轮：§13.2 focused evidence suite re-run（306 tests，residuals 250–359 锁；不改 checkbox）。
  残留三百六十一轮：knowledge Host Proposal 路径/正文修订（targetPath + contentMarkdown patch）。
  残留三百六十二轮：§13.2 focused evidence suite re-run（307 tests，residuals 250–361 锁；不改 checkbox）。
  残留三百六十三轮：Host knowledge patch 映射到 note executor approvedActions。
  残留三百六十四轮：§13.2 focused evidence suite re-run（308 tests，residuals 250–363 锁；不改 checkbox）。
  残留三百六十五轮：Host goal title/description patch 映射到 create_goal executor approvedActions。
  残留三百六十六轮：§13.2 focused evidence suite re-run（310 tests，residuals 250–365 锁；不改 checkbox）。
  残留三百六十七轮：goal Host Proposal 描述修订 UI（description 编辑 + dirty + 透传 residual 365）。
  残留三百六十八轮：§13.2 focused evidence suite re-run（311 tests，residuals 250–367 锁；不改 checkbox）。
  残留三百六十九轮：open-chat Host 引擎 profile 选择（direct_turn / pi_readonly）。
  残留三百七十轮：§13.2 focused evidence suite re-run（312 tests，residuals 250–369 锁；不改 checkbox）。
  残留三百七十一轮：Host Proposal 右侧工作台激活（auto-open + header count + hasWorkflowContext）。
  残留三百七十二轮：§13.2 focused evidence suite re-run（312 tests，residuals 250–371 锁；不改 checkbox）。
  残留三百七十三轮：Pi/CLI process adapter fail-closed spike（probe-only，不 spawn，非产品默认）。
  残留三百七十四轮：§13.2 focused evidence suite re-run（322 tests，residuals 250–373 锁；不改 checkbox）。
  残留三百七十五轮：生产 multi-engine Host journey（DirectTurn + ReadonlyAnalysis 经 Facade）。
  残留三百七十六轮：§13.2 focused evidence suite re-run（327 tests，residuals 250–375 锁；不改 checkbox）。
  残留三百七十七轮：multi-profile Host transport journey（pi_readonly 经 controller/HTTP/IPC；无 identityId）。
  残留三百七十八轮：§13.2 focused evidence suite re-run（331 tests，residuals 250–377 锁；不改 checkbox）。
  残留三百七十九轮：Host execution receipt 工作台（completed/failed/cancelled 报告面板 + auto-open）。
  残留三百八十轮：§13.2 focused evidence suite re-run（335 tests，residuals 250–379 锁；不改 checkbox）。
  残留三百八十一轮：Host 工作台从 Conversation AgentRun 历史重开（proposal/receipt 判定）。
  残留三百八十二轮：§13.2 focused evidence suite re-run（339 tests，residuals 250–381 锁；不改 checkbox）。
  残留三百八十三轮：Host 时间线 Artifact 卡片（proposal/receipt 紧凑卡 + 重开工作台）。
  残留三百八十四轮：§13.2 focused evidence suite re-run（342 tests，residuals 250–383 锁；不改 checkbox）。
  残留三百八十五轮：Host 执行报告富回放（path/preview/actionLines/entity deep-link）。
  残留三百八十六轮：§13.2 focused evidence suite re-run（345 tests，residuals 250–385 锁；不改 checkbox）。
  残留三百八十七轮：Host 时间线聚焦工作台行（highlight + scrollIntoView）。
  残留三百八十八轮：§13.2 focused evidence suite re-run（348 tests，residuals 250–387 锁；不改 checkbox）。
  残留三百八十九轮：Host 工作台文档对齐 + composition journey（product docs + plan + surface）。
  残留三百九十轮：§13.2 focused evidence suite re-run（351 tests，residuals 250–389 锁；不改 checkbox）。
  残留三百九十一轮：Pi process spike dry-run plan（argv/env/cwd）+ 生产路由永不引用 process.pi_readonly_spike。
  残留三百九十二轮：§13.2 focused evidence suite re-run（353 tests，residuals 250–391 锁；不改 checkbox）。
  残留三百九十三轮：Host open-chat stop → cancel_run（client-owned runId + dispatchAssistant）。
  残留三百九十四轮：§13.2 focused evidence suite re-run（357 tests，residuals 250–393 锁；不改 checkbox）。
  残留三百九十五轮：Host mid-turn cancel_run 生产 journey（DirectTurn stream + ReadonlyAnalysis 中止）。
  残留三百九十六轮：§13.2 focused evidence suite re-run（358 tests，residuals 250–395 锁；不改 checkbox）。
  残留三百九十七轮：Host Proposal 自由拒绝原因（normalize + panel + reject_proposal lifecycle）。
  残留三百九十八轮：§13.2 focused evidence suite re-run（361 tests，residuals 250–397 锁；不改 checkbox）。
  残留三百九十九轮：Host 时间线 multi-engine badge（AgentRun vs open-chat engineKey）。
  残留四百轮：§13.2 focused evidence suite re-run（365 tests，residuals 250–399 锁；不改 checkbox）。
  残留四百零一轮：open-chat Host 时间线 Artifact（live engine profile badge）。
  残留四百零二轮：§13.2 focused evidence suite re-run（368 tests，residuals 250–401 锁；不改 checkbox）。
  残留四百零三轮：open-chat Host 回合徽章会话记忆（per-conversation stash/restore）。
  残留四百零四轮：§13.2 focused evidence suite re-run（372 tests，residuals 250–403 锁；不改 checkbox）。
  残留四百零五轮：跨端 multi-engine Host 产品 E2E scaffold（13-step journey；非 Playwright/Electron 全绿）。
  残留四百零六轮：§13.2 focused evidence suite re-run（378 tests，residuals 250–405 锁；不改 checkbox）。
  残留四百零七轮：跨端 multi-engine Host 产品 unit driver（10 implemented_unit 源码契约；external skip）。
  残留四百零八轮：§13.2 focused evidence suite re-run（383 tests，residuals 250–407 锁；不改 checkbox）。
  残留四百零九轮：Host 时间线 open_chat vs AgentRun surface isolation（partition + fail-closed 审计）。
  残留四百一十轮：§13.2 focused evidence suite re-run（387 tests，residuals 250–409 锁；不改 checkbox）。
  残留四百一十一轮：Host 工作台时间线 composition（compose + isolationOk；AIChatView 接线）。
  残留四百一十二轮：§13.2 focused evidence suite re-run（390 tests，residuals 250–411 锁；不改 checkbox）。
  残留四百一十三轮：Host 工作台 LangGraph UI 泄漏边界（allowlist + vendor diagnostic 审计）。
  残留四百一十四轮：§13.2 focused evidence suite re-run（397 tests，residuals 250–413 锁；不改 checkbox）。
  残留四百一十五轮：Goal/Knowledge workflow 诊断事件展示脱敏（formatLangGraphVendorDiagnosticEventLabel）。
  残留四百一十六轮：§13.2 focused evidence suite re-run（409 tests，residuals 250–415 锁；不改 checkbox）。
  残留四百一十七轮：跨端 multi-engine scaffold/driver 扩至 16 步（+isolation/composition/LangGraph 脱敏）。
  残留四百一十八轮：§13.2 focused evidence suite re-run（410 tests，residuals 250–417 锁；不改 checkbox）。
  残留四百一十九轮：Host task.create 提案/回执 lane 基础（title+goalId；lifecycle only）。
  残留四百二十轮：§13.2 focused evidence suite re-run（414 tests，residuals 250–419 锁；不改 checkbox）。
  残留四百二十一轮：Goal 可观测性 i18n 去 node 产品语 + scaffold/driver task.create unit 步（16→17）。
  残留四百二十二轮：§13.2 focused evidence suite re-run（415 tests，residuals 250–421 锁；不改 checkbox）。
  残留四百二十三轮：Host task.create 实时 lane + 域 executor 基础（live resolve + goal resume/createTemplate）。
  残留四百二十四轮：§13.2 focused evidence suite re-run（418 tests，residuals 250–423 锁；不改 checkbox）。
  残留四百二十五轮：Host task.create 客户端 settle + createTemplate receipt（primaryEntityId 深链）。
  残留四百二十六轮：§13.2 focused evidence suite re-run（421 tests，residuals 250–425 锁；不改 checkbox）。
  残留四百二十七轮：Host AgentType task.create 基础 + 专用会话字段 taskAgentRun。
  残留四百二十八轮：§13.2 focused evidence suite re-run（423 tests，residuals 250–427 锁；不改 checkbox）。
  残留四百二十九轮：Host task.create 产品 toolMode task-create + Welcome/Footer 入口。
  残留四百三十轮：§13.2 focused evidence suite re-run（424 tests，residuals 250–429 锁；不改 checkbox）。
  残留四百三十一轮：Host task.create 产品 start 基础（TS Host start + startTaskAgentRun）。
  残留四百三十二轮：§13.2 focused evidence suite re-run（425 tests，residuals 250–431 锁；不改 checkbox）。
  残留四百三十三轮：Host task.create 会话 restore/refresh + 启动时可选关联 goalId。
  残留四百三十四轮：§13.2 focused evidence suite re-run（426 tests，residuals 250–433 锁；不改 checkbox）。
  残留四百三十五轮：Host task.create 进程内 run store 基础（get/list/events 再水合）。
  残留四百三十六轮：§13.2 focused evidence suite re-run（433 tests，residuals 250–435 锁；不改 checkbox）。
  残留四百三十七轮：Host task.create 进程内 cancel/complete resume（store 更新 + cancelTaskAgentRun/completeTaskAgentRun）。
  残留四百三十八轮：§13.2 focused evidence suite re-run（439 tests，residuals 250–437 锁；不改 checkbox）。
  残留四百三十九轮：Host task.create 进程内 edit revise + 幂等 terminal（reviseTaskAgentRun）。
  残留四百四十轮：§13.2 focused evidence suite re-run（443 tests，residuals 250–439 锁；不改 checkbox）。
  残留四百四十一轮：Host AgentRun 历史 reopen 聚焦（resolveHostWorkbenchFocusFromAgentRun + task 标题回收）。
  残留四百四十二轮：§13.2 focused evidence suite re-run（446 tests，residuals 250–441 锁；不改 checkbox）。
  残留四百四十三轮：Host 会话 restore 工作台聚焦（resolveHostWorkbenchFocusFromSessionRuns + selectConversation）。
  残留四百四十四轮：§13.2 focused evidence suite re-run（449 tests，residuals 250–443 锁；不改 checkbox）。
  残留四百四十五轮：Host task.create linked goal restore + 会话 client settlement 隔离。
  残留四百四十六轮：§13.2 focused evidence suite re-run（452 tests，residuals 250–445 锁；不改 checkbox）。
  残留四百四十七轮：§13.2 证据指针刷新 + task.create process-local store 容量边界（maxEntries 淘汰）。
  残留四百四十八轮：§13.2 focused evidence suite re-run（455 tests，residuals 250–447 锁；不改 checkbox）。
  残留四百四十九轮：Host task.create process-local product journey（start/edit/cancel/confirm + identity）。
  残留四百五十轮：§13.2 focused evidence suite re-run（460 tests，residuals 250–449 锁；不改 checkbox）。
  残留四百五十一轮：Host task.create process-local runId 身份绑定（异身份接管 fail-closed）。
  残留四百五十二轮：§13.2 focused evidence suite re-run（464 tests，residuals 250–451 锁；不改 checkbox）。
  残留四百五十三轮：Host task.create confirm 要求 client executedActions settlement（禁 Host 伪造）。
  残留四百五十四轮：§13.2 focused evidence suite re-run（468 tests，residuals 250–453 锁；不改 checkbox）。
  残留四百五十五轮：Host task.create edit 要求非空 revised title（禁空白 revise）。
  残留四百五十六轮：§13.2 focused evidence suite re-run（472 tests，residuals 250–455 锁；不改 checkbox）。
  残留四百五十七轮：Host task.create process-local conversation/thread runId 绑定（禁会话重绑）。
  残留四百五十八轮：§13.2 focused evidence suite re-run（478 tests，residuals 250–457 锁；不改 checkbox）。
  残留四百五十九轮：Host task.create dirty approve 先 process-local revise 再 domain settle。
  残留四百六十轮：§13.2 focused evidence suite re-run（481 tests，residuals 250–459 锁；不改 checkbox）。
  残留四百六十一轮：Host task.create start 要求非空 conversationId（会话绑定）。
  残留四百六十二轮：§13.2 focused evidence suite re-run（484 tests，residuals 250–461 锁；不改 checkbox）。
  残留四百六十三轮：Host task.create confirm 要求可回收非空 settlement title（history reopen/receipt）。
  残留四百六十四轮：§13.2 focused evidence suite re-run（488 tests，residuals 250–463 锁；不改 checkbox）。
  残留四百六十五轮：Host task.create confirm 要求可回收非空 settlement template entity id（receipt deep-link）。
  残留四百六十六轮：§13.2 focused evidence suite re-run（492 tests，residuals 250–465 锁；不改 checkbox）。
  残留四百六十七轮：Host task.create confirm 禁止 settlement goalId 相对 approved draft 重绑。
  残留四百六十八轮：§13.2 focused evidence suite re-run（496 tests，residuals 250–467 锁；不改 checkbox）。
  残留四百六十九轮：Host task.create confirm 禁止 settlement title 相对 approved draft 重绑。
  残留四百七十轮：§13.2 focused evidence suite re-run（500 tests，residuals 250–469 锁；不改 checkbox）。
  残留四百七十一轮：Host task.create confirm 仅信 process-local draft（忽略 client approvedActions）+ 单 executed。
  残留四百七十二轮：§13.2 focused evidence suite re-run（505 tests，residuals 250–471 锁；不改 checkbox）。
  残留四百七十三轮：Host task.create edit 要求恰好一条 create_task_template approvedAction（单 draft）。
  残留四百七十四轮：§13.2 focused evidence suite re-run（509 tests，residuals 250–473 锁；不改 checkbox）。
  残留四百七十五轮：Host task.create confirm 仅 waiting_approval（禁 waiting_execution 结算）。
  残留四百七十六轮：§13.2 focused evidence suite re-run（513 tests，residuals 250–475 锁；不改 checkbox）。
  残留四百七十七轮：Host task.create cancel 仅 waiting_approval（对称 confirm/edit 产品态）。
  残留四百七十八轮：§13.2 focused evidence suite re-run（517 tests，residuals 250–477 锁；不改 checkbox）。
  残留四百七十九轮：Host task.create start 非空 title fail-closed（builder 禁静默默认 title）。
  残留四百八十轮：§13.2 focused evidence suite re-run（520 tests，residuals 250–479 锁；不改 checkbox）。
  残留四百八十一轮：Host task.create edit 仅 waiting_approval（对称 confirm/cancel 命名常量）。
  残留四百八十二轮：§13.2 focused evidence suite re-run（524 tests，residuals 250–481 锁；不改 checkbox）。
  残留四百八十三轮：Host task.create start conversationId builder fail-closed（禁 silent null）。
  残留四百八十四轮：§13.2 focused evidence suite re-run（526 tests，residuals 250–483 锁；不改 checkbox）。
  残留四百八十五轮：Host task.create start threadId builder fail-closed（trim 非空）。
  残留四百八十六轮：§13.2 focused evidence suite re-run（530 tests，residuals 250–485 锁；不改 checkbox）。
  残留四百八十七轮：阶段 6 task DAG *ViewModel 双轨收口（canonical TaskForDAG/TaskGraph*）。
  残留四百八十八轮：§13.2 focused evidence suite re-run（532 tests，residuals 250–487 锁；不改 checkbox）。
  残留四百八十九轮：Host task.create client complete 仅 waiting_approval（对称 cancel/edit + Host 475）。
  残留四百九十轮：§13.2 focused evidence suite re-run（533 tests，residuals 250–489 锁；不改 checkbox）。
  残留四百九十一轮：Host task.create edit/confirm tool+empty-action 命名常量 fail-closed。
  残留四百九十二轮：§13.2 focused evidence suite re-run（536 tests，residuals 250–491 锁；不改 checkbox）。
  残留四百九十三轮：Host task.create start identityId builder fail-closed（ExecutionContext 非空 trim）。
  残留四百九十四轮：§13.2 focused evidence suite re-run（540 tests，residuals 250–493 锁；不改 checkbox）。
  残留四百九十五轮：Host task.create resume agentType/unsupported-decision 命名常量 + store 非 task.create fail-closed。
  残留四百九十六轮：§13.2 focused evidence suite re-run（543 tests，residuals 250–495 锁；不改 checkbox）。
  残留四百九十七轮：Host task.create start runId builder fail-closed（trim 非空 process-local 键）。
  残留四百九十八轮：§13.2 focused evidence suite re-run（547 tests，residuals 250–497 锁；不改 checkbox）。
  残留四百九十九轮：Host task.create start agentType builder fail-closed（必须 task.create，禁 retype）。
  残留五百轮：§13.2 focused evidence suite re-run（550 tests，residuals 250–499 锁；不改 checkbox）。
  残留五百零一轮：Client task.create complete settlement draft 仅 create_task_template（禁 blind pending[0]）。
  残留五百零二轮：§13.2 focused evidence suite re-run（551 tests，residuals 250–501 锁；不改 checkbox）。
  残留五百零三轮：Host task.create process-local store identity trim match（空白查询 fail-closed）。
  残留五百零四轮：§13.2 focused evidence suite re-run（556 tests，residuals 250–503 锁；不改 checkbox）。
  残留五百零五轮：Host task.create process-local store runId trim lookup（空白 runId fail-closed）。
  残留五百零六轮：§13.2 focused evidence suite re-run（561 tests，residuals 250–505 锁；不改 checkbox）。
  残留五百零七轮：Client task.create revise draft 仅 create_task_template（禁 blind source[0]）。
  残留五百零八轮：§13.2 focused evidence suite re-run（562 tests，residuals 250–507 锁；不改 checkbox）。
  残留五百零九轮：Host task.create process-local store conversationId trim match（空白过滤 fail-closed）。
  残留五百一十轮：§13.2 focused evidence suite re-run（567 tests，residuals 250–509 锁；不改 checkbox）。
  残留五百一十一轮：Host task.create process-local store threadId trim match（空白 threadId fail-closed）。
  残留五百一十二轮：§13.2 focused evidence suite re-run（572 tests，residuals 250–511 锁；不改 checkbox）。
  残留五百一十三轮：Host task.create process-local store conversationId upsert normalize（空白 fail-closed）。
  残留五百一十四轮：§13.2 focused evidence suite re-run（577 tests，residuals 250–513 锁；不改 checkbox）。
  残留五百一十五轮：Host task.create process-local store identityId upsert normalize（空白 fail-closed）。
  残留五百一十六轮：§13.2 focused evidence suite re-run（581 tests，residuals 250–515 锁；不改 checkbox）。
  残留五百一十七轮：Host task.create listRuns remote ownership trim match（空白 fail-closed）。
  残留五百一十八轮：§13.2 focused evidence suite re-run（583 tests，residuals 250–517 锁；不改 checkbox）。
  残留五百一十九轮：Client task.create draft title/goalId 仅 create_task_template（禁 blind pending[0]）。
  残留五百二十轮：§13.2 focused evidence suite re-run（586 tests，residuals 250–519 锁；不改 checkbox）。
  残留五百二十一轮：Client knowledge.write draft path/markdown 仅 create_knowledge_note（禁 blind pending[0]）。
  残留五百二十二轮：§13.2 focused evidence suite re-run（589 tests，residuals 250–521 锁；不改 checkbox）。
  残留五百二十三轮：Client goal.create draft title/description 仅 create_goal（禁 blind pending[0]）。
  残留五百二十四轮：§13.2 focused evidence suite re-run（592 tests，residuals 250–523 锁；不改 checkbox）。
  残留五百二十五轮：Client workbench summary rationale 仅 product-lane tool（禁 blind pending[0]）。
  残留五百二十六轮：§13.2 focused evidence suite re-run（597 tests，residuals 250–525 锁；不改 checkbox）。
  残留五百二十七轮：Client workbench pendingActionCount 仅 product-lane tool（禁 foreign tools）。
  残留五百二十八轮：§13.2 focused evidence suite re-run（602 tests，residuals 250–527 锁；不改 checkbox）。
  残留五百二十九轮：Client receipt primaryEntityId 仅 product-lane executed tool（禁 foreign entityIds[0]）。
  残留五百三十轮：§13.2 focused evidence suite re-run（607 tests，residuals 250–529 锁；不改 checkbox）。
  残留五百三十一轮：Client knowledge.write draft title 仅 create_knowledge_note（禁 blind pending[0]）。
  残留五百三十二轮：§13.2 focused evidence suite re-run（611 tests，residuals 250–531 锁；不改 checkbox）。
  残留五百三十三轮：Client receipt summary 排除 cross-lane foreign tools（禁 counts/actionLines/entityIds 膨胀）。
  残留五百三十四轮：§13.2 focused evidence suite re-run（615 tests，residuals 250–533 锁；不改 checkbox）。
  残留五百三十五轮：Client receipt summary error 仅 same-lane failed action（禁 blind errors[0]）。
  残留五百三十六轮：§13.2 focused evidence suite re-run（619 tests，residuals 250–535 锁；不改 checkbox）。
  残留五百三十七轮：Client receipt ok 要求 product-lane executed（companion-only 不记成功）。
  残留五百三十八轮：§13.2 focused evidence suite re-run（624 tests，residuals 250–537 锁；不改 checkbox）。
  残留五百三十九轮：阶段 6 editor dual-track / portable boundary 再锁（PowerSync editor_* backup-only + knowledge routes + /note strip）。
  残留五百四十轮：§13.2 focused evidence suite re-run（627 tests，residuals 250–539 锁；不改 checkbox）。
  残留五百四十一轮：§13.2 证据审计刷新 + Host edit draftAction 单 create_task_template（禁 multi-index invent）。
  残留五百四十二轮：§13.2 focused evidence suite re-run（628 tests，residuals 250–541 锁；不改 checkbox）。
  残留五百四十三轮：Host task.create confirm settlementAction 单 create_task_template（禁 multi-index invent）。
  残留五百四十四轮：§13.2 focused evidence suite re-run（629 tests，residuals 250–543 锁；不改 checkbox）。
  残留五百四十五轮：Host task.create confirm store draftAction 单 create_task_template（禁 multi-index invent）。
  残留五百四十六轮：§13.2 focused evidence suite re-run（632 tests，residuals 250–545 锁；不改 checkbox）。
  残留五百四十七轮：Client task.create complete/revise sole draftAction 单 create_task_template（禁 multi-find invent）。
  残留五百四十八轮：§13.2 focused evidence suite re-run（633 tests，residuals 250–547 锁；不改 checkbox）。
  残留五百四十九轮：Client workbench soleProductDraftAction 单 product-lane draft（禁 multi-find invent）。
  残留五百五十轮：§13.2 focused evidence suite re-run（637 tests，residuals 250–549 锁；不改 checkbox）。
  残留五百五十一轮：Client applyHost*Patch sole product draftAction（禁 multi-index invent）。
  残留五百五十二轮：§13.2 focused evidence suite re-run（642 tests，residuals 250–551 锁；不改 checkbox）。
  残留五百五十三轮：Host confirm store draft resolve sole create_task_template（foreign companions ignored）。
  残留五百五十四轮：§13.2 focused evidence suite re-run（644 tests，residuals 250–553 锁；不改 checkbox）。
  残留五百五十五轮：Client knowledge.write confirm sole create_knowledge_note draftAction（禁 multi product invent）。
  残留五百五十六轮：§13.2 focused evidence suite re-run（645 tests，residuals 250–555 锁；不改 checkbox）。
  残留五百五十七轮：Client goal.create confirm sole create_goal draftAction（禁 multi product invent）。
  残留五百五十八轮：§13.2 focused evidence suite re-run（646 tests，residuals 250–557 锁；不改 checkbox）。
  残留五百五十九轮：Client goal.create confirm/cancel + knowledge.write confirm waiting_approval-only。
  残留五百六十轮：§13.2 focused evidence suite re-run (647 tests, residuals 250–559 locks, no checkbox changes)。
  残留五百六十一轮：Host panel goal/knowledge approve pre-lifecycle sole product + waiting_approval gate。
  残留五百六十二轮：§13.2 focused evidence suite re-run (651 tests, residuals 250–561 locks, no checkbox changes)。
  残留五百六十三轮：Host panel task.create approve pre-lifecycle sole create_task_template gate。
  残留五百六十四轮：§13.2 focused evidence suite re-run (653 tests, residuals 250–563 locks, no checkbox changes)。
  残留五百六十五轮：Host panel product reject pre-lifecycle waiting_approval gate。
  残留五百六十六轮：§13.2 focused evidence suite re-run (655 tests, residuals 250–565 locks, no checkbox changes)。
  残留五百六十七轮：Host panel product revise pre-lifecycle waiting_approval gate。
  残留五百六十八轮：§13.2 focused evidence suite re-run (657 tests, residuals 250–567 locks, no checkbox changes)。
  残留五百六十九轮：Host panel shared product ownership resolver (resolveHostPanelOwnedProductRun).
  残留五百七十轮：§13.2 focused evidence suite re-run (660 tests, residuals 250–569 locks, no checkbox changes)。
  残留五百七十一轮：Host panel settlement reuses shared product ownership resolver.
  残留五百七十二轮：§13.2 focused evidence suite re-run (661 tests, residuals 250–571 locks, no checkbox changes)。
  残留五百七十三轮：Host panel revise sole product draftAction gate (approve symmetry).
  残留五百七十四轮：§13.2 focused evidence suite re-run (663 tests, residuals 250–573 locks, no checkbox changes)。
  残留五百七十五轮：goal session primary-task confirm sole create_task_template.
  残留五百七十六轮：§13.2 focused evidence suite re-run (664 tests, residuals 250–575 locks, no checkbox changes)。
  残留五百七十七轮：Host panel primary-task-shaped ownership maps to create_task_template.
  残留五百七十八轮：§13.2 focused evidence suite re-run (666 tests, residuals 250–577 locks, no checkbox changes)。
  残留五百七十九轮：Host panel primary-task-shaped settlement via goal session confirm/cancel.
  残留五百八十轮：§13.2 focused evidence suite re-run (667 tests, residuals 250–579 locks, no checkbox changes)。
  残留五百八十一轮：Host panel settlement ownership classifiers (process-local vs goal-session).
  残留五百八十二轮：§13.2 focused evidence suite re-run (669 tests, residuals 250–581 locks, no checkbox changes)。
  残留五百八十三轮：goal session primary-task confirm forwards Host-revised goalId.
  残留五百八十四轮：§13.2 focused evidence suite re-run (670 tests, residuals 250–583 locks, no checkbox changes)。
  残留五百八十五轮：Host workbench primary-task exclusive kind routing (focus/reopen/builders).
  残留五百八十六轮：§13.2 focused evidence suite re-run (674 tests, residuals 250–585 locks, no checkbox changes)。
  残留五百八十七轮：goal session Host lifecycle kind primary-task → task.create.
  残留五百八十八轮：§13.2 focused evidence suite re-run (675 tests, residuals 250–587 locks, no checkbox changes)。
  残留五百八十九轮：dual-mirror primary-task goal session settle into exclusive task lane.
  残留五百九十轮：§13.2 focused evidence suite re-run (679 tests, residuals 250–589 locks, no checkbox changes)。
  残留五百九十一轮：dual-mirror process-local task.create precedes goal overwrite.
  残留五百九十二轮：§13.2 focused evidence suite re-run (681 tests, residuals 250–591 locks, no checkbox changes)。
  残留五百九十三轮：session restore dual-mirror exclusive task before focus.
  残留五百九十四轮：§13.2 focused evidence suite re-run (683 tests, residuals 250–593 locks, no checkbox changes)。
  残留五百九十五轮：live exclusive dual-mirror before builders (dropStale opt).
  残留五百九十六轮：§13.2 focused evidence suite re-run (685 tests, residuals 250–595 locks, no checkbox changes)。
  残留五百九十七轮：Host panel ownership dual-mirror exclusive before match.
  残留五百九十八轮：§13.2 focused evidence suite re-run (688 tests, residuals 250–597 locks, no checkbox changes)。
  残留五百九十九轮：drop dual-mirror primary-task ghost beside normal goal.
  残留六百轮：§13.2 focused evidence suite re-run (690 tests, residuals 250–599 locks, no checkbox changes)。
  残留六百零一轮：knowledge ghost drop + focus exclusive-only.
  残留六百零二轮：§13.2 focused evidence suite re-run (692 tests, residuals 250–601 locks, no checkbox changes)。
  残留六百零三轮：knowledge classifier + AgentRun history session focus.
  残留六百零四轮：§13.2 focused evidence suite re-run (694 tests, residuals 250–603 locks, no checkbox changes)。
  残留六百零五轮：knowledge process-local edit revise via classifier.
  残留六百零六轮：§13.2 focused evidence suite re-run (695 tests, residuals 250–605 locks, no checkbox changes)。
  残留六百零七轮：goal-session process-local edit revise via classifier.
  残留六百零八轮：§13.2 focused evidence suite re-run (696 tests, residuals 250–607 locks, no checkbox changes)。
  残留六百零九轮：dirty approve process-local revise before goal/knowledge confirm.
  残留六百一十轮：§13.2 focused evidence suite re-run (699 tests, residuals 250–609 locks, no checkbox changes)。
  残留六百一十一轮：default Host workbench focus prefers exclusive session.
  残留六百一十二轮：§13.2 focused evidence suite re-run (702 tests, residuals 250–611 locks, no checkbox changes)。
  残留六百一十三轮：Host proposal/receipt exclusive session order (task > goal > knowledge).
  残留六百一十四轮：§13.2 focused evidence suite re-run (705 tests, residuals 250–613 locks, no checkbox changes)。
  残留六百一十五轮：delete contracts ActionResult dual-track dead surface (Result envelope only).
  残留六百一十六轮：§13.2 focused evidence suite re-run (708 tests, residuals 250–615 locks, no checkbox changes)。
  残留六百一十七轮：align Result ADRs after ActionResult dual-track retirement.
  残留六百一十八轮：§13.2 focused evidence suite re-run (710 tests, residuals 250–617 locks, no checkbox changes)。
  残留六百一十九轮：align ADR-021/022 route samples off removed contracts/response.
  残留六百二十轮：§13.2 focused evidence suite re-run (711 tests, residuals 250–619 locks, no checkbox changes)。
  残留六百二十一轮：API POST /logs Result/HttpResponse envelope (no success boolean dual-track).
  残留六百二十二轮：§13.2 focused evidence suite re-run (716 tests, residuals 250–621 locks, no checkbox changes)。
  残留六百二十三轮：API GET /metrics/json Result/HttpResponse envelope (Prometheus text unchanged).
  残留六百二十四轮：§13.2 focused evidence suite re-run (720 tests, residuals 250–623 locks, no checkbox changes)。
  残留六百二十五轮：API GET /info Result/HttpResponse envelope (health probes non-Result).
  残留六百二十六轮：§13.2 focused evidence suite re-run (724 tests, residuals 250–625 locks, no checkbox changes)。
  残留六百二十七轮：API global error middleware Result/HttpResponse envelope (404 + handlers).
  残留六百二十八轮：§13.2 focused evidence suite re-run (730 tests, residuals 250–627 locks, no checkbox changes)。
  残留六百二十九轮：API PowerSync GET /schema Result/HttpResponse envelope (no partial ok/data dual-track).
  残留六百三十轮：§13.2 focused evidence suite re-run (735 tests, residuals 250–629 locks, no checkbox changes)。
  残留六百三十一轮：retire schedule operation success/error dual response DTOs (delete success = null).
  残留六百三十二轮：§13.2 focused evidence suite re-run (737 tests, residuals 250–631 locks, no checkbox changes)。
  残留六百三十三轮：retire SettingOperationRes dual envelope (setting DTO/Result only).
  残留六百三十四轮：§13.2 focused evidence suite re-run (739 tests, residuals 250–633 locks, no checkbox changes)。
  残留六百三十五轮：retire ReminderOperationRes/ReminderTriggerRes dual envelopes (DTO/void/Result only).
  残留六百三十六轮：§13.2 focused evidence suite re-run (741 tests, residuals 250–635 locks, no checkbox changes)。
  残留六百三十七轮：retire AuthOperationResult dual envelope (typed desktop *Result DTOs remain).
  残留六百三十八轮：§13.2 focused evidence suite re-run (745 tests, residuals 250–637 locks, no checkbox changes)。
  残留六百三十九轮：retire shared BatchOperationResponseDTO dual; schedule ScheduleBatchOperationResponseDTO only.
  残留六百四十轮：§13.2 focused evidence suite re-run (747 tests, residuals 250–639 locks, no checkbox changes)。
  残留六百四十一轮：retire shared ChartDataDTO dead dual; shared/dtos empty barrel only.
  残留六百四十二轮：§13.2 focused evidence suite re-run (749 tests, residuals 250–641 locks, no checkbox changes)。
  残留六百四十三轮：retire shared SimpleEditorTab/ContextMenuItem dead UI duals (editor UI leftover).
  残留六百四十四轮：§13.2 focused evidence suite re-run (751 tests, residuals 250–643 locks, no checkbox changes)。
  残留六百四十五轮：retire shared dual config VOs + ZodErrorResponse/Pagination dead schemas.
  残留六百四十六轮：§13.2 focused evidence suite re-run (754 tests, residuals 250–645 locks, no checkbox changes)。
  残留六百四十七轮：retire AIProviderConfigSummary + Reminder/Goal dead Summary duals (ClientDTO only).
  残留六百四十八轮：§13.2 focused evidence suite re-run (758 tests, residuals 250–647 locks, no checkbox changes)。
  残留六百四十九轮：retire task dependency/subtask Server duals (Client chain + SubtaskClientDTO only).
  残留六百五十轮：§13.2 focused evidence suite re-run (760 tests, residuals 250–649 locks, no checkbox changes)。
  残留六百五十一轮：retire governance RuleServerDTO dead dual (RuleClientDTO only).
  残留六百五十二轮：§13.2 focused evidence suite re-run (762 tests, residuals 250–651 locks, no checkbox changes)。
  残留六百五十三轮：retire schedule ServerStatic factory duals + ScheduleDashboardDTO dead dual.
  残留六百五十四轮：§13.2 focused evidence suite re-run (765 tests, residuals 250–653 locks, no checkbox changes)。
  残留六百五十五轮：retire account/goal entities dual re-export barrels (aggregates only).
  残留六百五十六轮：§13.2 focused evidence suite re-run (767 tests, residuals 250–655 locks, no checkbox changes)。
  残留六百五十七轮：retire SettingOverviewDTO dead dual (UserSettingClientDTO only).
  残留六百五十八轮：§13.2 focused evidence suite re-run (769 tests, residuals 250–657 locks, no checkbox changes)。
  残留六百五十九轮：retire notification template VO dual + SnoozeSessionDTO dead dual.
  残留六百六十轮：§13.2 focused evidence suite re-run (771 tests, residuals 250–659 locks, no checkbox changes)。
  残留六百六十一轮：retire empty dual barrel re-exports from account/schedule/setting module roots.
  残留六百六十二轮：§13.2 focused evidence suite re-run (774 tests, residuals 250–661 locks, no checkbox changes)。
  残留六百六十三轮：retire schedule dead list/stats ResponseDTO duals + detect-conflicts wrapper dual.
  残留六百六十四轮：§13.2 focused evidence suite re-run (776 tests, residuals 250–663 locks, no checkbox changes)。
  残留六百六十五轮：retire schedule batch-delete OpenAPI schema dual (ScheduleBatchOperationResponseSchema only).
  残留六百六十六轮：§13.2 focused evidence suite re-run (778 tests, residuals 250–665 locks, no checkbox changes)。
  残留六百六十七轮：retire task bind-to-goal request schema dual (TaskGoalBindingSchema only).
  残留六百六十八轮：§13.2 focused evidence suite re-run (780 tests, residuals 250–667 locks, no checkbox changes)。
  残留六百六十九轮：retire knowledge sync request schema dual (connection params only).
  残留六百七十轮：§13.2 focused evidence suite re-run (783 tests, residuals 250–669 locks, no checkbox changes)。
  残留六百七十一轮：retire notification mark-read/batch-delete request schema dual (NotificationIdsBatchSchema only).
  残留六百七十二轮：§13.2 focused evidence suite re-run (785 tests, residuals 250–671 locks, no checkbox changes)。
  残留六百七十三轮：retire AI conversation create/update name schema dual (ConversationNameSchema only).
  残留六百七十四轮：§13.2 focused evidence suite re-run (787 tests, residuals 250–673 locks, no checkbox changes)。
  残留六百七十五轮：retire knowledge note/attachment list filter schema dual (ListKnowledgeProjectionsSchema only).
  残留六百七十六轮：§13.2 focused evidence suite re-run (789 tests, residuals 250–675 locks, no checkbox changes)。
  残留六百七十七轮：retire goal reviews/key-results list params dual (GoalIdParamsSchema only).
  残留六百七十八轮：§13.2 focused evidence suite re-run (791 tests, residuals 250–677 locks, no checkbox changes)。
  残留六百七十九轮：retire schedule detect-conflicts response schema name dual (ConflictDetectionResultSchema only).
  残留六百八十轮：§13.2 focused evidence suite re-run (793 tests, residuals 250–679 locks, no checkbox changes)。
  残留六百八十一轮：retire governance OpenAPI response schema name duals (contracts schemas only).
  残留六百八十二轮：§13.2 focused evidence suite re-run (795 tests, residuals 250–681 locks, no checkbox changes)。
  残留六百八十三轮：retire AI provider create schema name dual (CreateAIProviderConfigSchema owns body).
  残留六百八十四轮：§13.2 focused evidence suite re-run (797 tests, residuals 250–683 locks, no checkbox changes)。
  残留六百八十五轮：retire auth credential server dual (PasswordCredentialServerDTO only).
  残留六百八十六轮：§13.2 focused evidence suite re-run (799 tests, residuals 250–685 locks, no checkbox changes)。
  残留六百八十七轮：retire auth base credential server dual (PasswordCredentialServerDTO owns full shape).
  残留六百八十八轮：§13.2 focused evidence suite re-run (800 tests, residuals 250–687 locks, no checkbox changes)。
  残留六百八十九轮：retire goal list response duals (KeyResult/Record/Review ListResSchema only).
  残留六百九十轮：§13.2 focused evidence suite re-run (802 tests, residuals 250–689 locks, no checkbox changes)。
  残留六百九十一轮：retire AI chat list response duals (Conversation/Message ListResSchema only).
  残留六百九十二轮：§13.2 focused evidence suite re-run (805 tests, residuals 250–691 locks, no checkbox changes)。
  残留六百九十三轮：retire reminder list response duals (Template/Group ListResponseSchema only).
  残留六百九十四轮：§13.2 focused evidence suite re-run (808 tests, residuals 250–693 locks, no checkbox changes)。
  残留六百九十五轮：retire AI response Res duals (SendMessage/ListProvider/QueryAnalytics/Knowledge/Expand/CreateNote ResSchema only).
  残留六百九十六轮：§13.2 focused evidence suite re-run (811 tests, residuals 250–695 locks, no checkbox changes)。
  残留六百九十七轮：retire task check-expired instances response dual (CheckExpiredTaskInstancesResponseSchema only).
  残留六百九十八轮：§13.2 focused evidence suite re-run (814 tests, residuals 250–697 locks, no checkbox changes)。
  残留六百九十九轮：retire knowledge installation response duals (Start/Complete ResponseSchema only).
  残留七百轮：§13.2 focused evidence suite re-run (817 tests, residuals 250–699 locks, no checkbox changes)。
  残留七百零一轮：retire GitHub installation repository DTO dual (GitHubInstallationRepositorySchema only).
  残留七百零二轮：§13.2 focused evidence suite re-run (820 tests, residuals 250–701 locks, no checkbox changes)。
  残留七百零三轮：retire schedule query params duals (Task/Execution QueryParamsSchema only).
  残留七百零四轮：§13.2 focused evidence suite re-run (823 tests, residuals 250–703 locks, no checkbox changes)。
  残留七百零五轮：retire goal automation plan/preview duals (Plan/TaskTemplate/Reminder Schema only).
  残留七百零六轮：§13.2 focused evidence suite re-run (826 tests, residuals 250–705 locks, no checkbox changes)。
  残留七百零七轮：retire schedule request duals (Create/Update/Detect/GetRange/Resolve RequestSchema only).
  残留七百零八轮：§13.2 focused evidence suite re-run (830 tests, residuals 250–707 locks, no checkbox changes)。
  残留七百零九轮：retire schedule-task request duals (Create/Update/Config/Metadata/Batch RequestSchema only).
  残留七百一十轮：§13.2 focused evidence suite re-run (834 tests, residuals 250–709 locks, no checkbox changes)。
  残留七百一十一轮：retire task dependency transport duals (Body + ValidateResponse Schema only).
  残留七百一十二轮：§13.2 focused evidence suite re-run (838 tests, residuals 250–711 locks, no checkbox changes)。
  残留七百一十三轮：retire auth session response duals (CurrentUser/SessionList ResponseSchema only).
  残留七百一十四轮：§13.2 focused evidence suite re-run (841 tests, residuals 250–713 locks, no checkbox changes)。
  残留七百一十五轮：retire schedule create/resolve response duals (ResponseSchema only).
  残留七百一十六轮：§13.2 focused evidence suite re-run (844 tests, residuals 250–715 locks, no checkbox changes)。
  残留七百一十七轮：retire schedule batch response dual (ScheduleBatchOperationResponseSchema only).
  残留七百一十八轮：§13.2 focused evidence suite re-run (847 tests, residuals 250–717 locks, no checkbox changes)。
  残留七百一十九轮：retire goal generation draft duals (GeneratedGoalDraft/KeyResultPreview/Generate*Result Schema only).
  残留七百二十轮：§13.2 focused evidence suite re-run (850 tests, residuals 250–719 locks, no checkbox changes)。
  残留七百二十一轮：retire provider test result dual (TestAIProviderResultDTOSchema only).
  残留七百二十二轮：§13.2 focused evidence suite re-run (853 tests, residuals 250–721 locks, no checkbox changes)。
  残留七百二十三轮：retire knowledge note persisted-ref dual (KnowledgeNotePersistedRefSchema only).
  残留七百二十四轮：§13.2 focused evidence suite re-run (856 tests, residuals 250–723 locks, no checkbox changes)。
  残留七百二十五轮：retire schedule conflict detection duals (ConflictDetectionResult/Detail/Suggestion Schema only).
  残留七百二十六轮：§13.2 focused evidence suite re-run (859 tests, residuals 250–725 locks, no checkbox changes)。
  残留七百二十七轮：retire token usage dual (TokenUsageSchema only).
  残留七百二十八轮：§13.2 focused evidence suite re-run (862 tests, residuals 250–727 locks, no checkbox changes)。
  残留七百二十九轮：retire goal workflow result duals (GoalClarification/GoalWorkflow*Result Schema only).
  残留七百三十轮：§13.2 focused evidence suite re-run (865 tests, residuals 250–729 locks, no checkbox changes)。
  残留七百三十一轮：retire governance snippet/tag duals (CodeSnippetDTOSchema/RuleTagDTOSchema only).
  残留七百三十二轮：§13.2 focused evidence suite re-run (868 tests, residuals 250–731 locks, no checkbox changes)。
  残留七百三十三轮：retire reminder hours/stats duals (ActiveHoursConfigSchema/GroupStatsSchema only).
  残留七百三十四轮：§13.2 focused evidence suite re-run (871 tests, residuals 250–733 locks, no checkbox changes)。
  残留七百三十五轮：retire reminder trigger/notification duals (TriggerConfigSchema/NotificationConfigSchema only).
  残留七百三十六轮：§13.2 focused evidence suite re-run (874 tests, residuals 250–735 locks, no checkbox changes)。
  残留七百三十七轮：retire goal key-result progress/snapshot duals (KeyResultProgressDTOSchema/KeyResultSnapshotDTOSchema only).
  残留七百三十八轮：§13.2 focused evidence suite re-run (877 tests, residuals 250–737 locks, no checkbox changes)。
  残留七百三十九轮：retire task goal-binding/reminder duals (TaskGoalBindingSchema/TaskReminderConfigSchema only; skip TaskTimeConfig shape mismatch).
  残留七百四十轮：§13.2 focused evidence suite re-run (880 tests, residuals 250–739 locks, no checkbox changes)。
  残留七百四十一轮：retire goal reminder-config duals (GoalReminderConfigDTOSchema/ReminderTriggerSchema only).
  残留七百四十二轮：§13.2 focused evidence suite re-run (883 tests, residuals 250–741 locks, no checkbox changes)。
  残留七百四十三轮：retire task recurrence-rule dual (RecurrenceConfigSchema only; domain RecurrenceRule kept).
  残留七百四十四轮：§13.2 focused evidence suite re-run (886 tests, residuals 250–743 locks, no checkbox changes)。
  残留七百四十五轮：retire goal focus-mode duals (FocusModeClientDTOSchema only; request interfaces alias *Req).
  残留七百四十六轮：§13.2 focused evidence suite re-run (889 tests, residuals 250–745 locks, no checkbox changes)。
  残留七百四十七轮：retire task time-config dual (TaskTimeConfigSchema only; domain TaskTimeConfig DomainDate kept).
  残留七百四十八轮：§13.2 focused evidence suite re-run (892 tests, residuals 250–747 locks, no checkbox changes)。
  残留七百四十九轮：retire schedule nested VO duals (ScheduleConfig/ExecutionInfo/RetryPolicy/TaskMetadata Schema only; request partials kept).
  残留七百五十轮：§13.2 focused evidence suite re-run (896 tests, residuals 250–749 locks, no checkbox changes)。
  残留七百五十一轮：retire TimeSlot + AIModelInfo duals (TimeSlotSchema/AIModelInfoSchema only).
  残留七百五十二轮：§13.2 focused evidence suite re-run (902 tests, residuals 250–751 locks, no checkbox changes)。
  残留七百五十三轮：retire goal create/update reminder-config request dual (reuse VO schemas + request-only min/max).
  残留七百五十四轮：§13.2 focused evidence suite re-run (905 tests, residuals 250–753 locks, no checkbox changes)。
  残留七百五十五轮：retire KnowledgeCitation dual (response-schemas owns KnowledgeCitationSchema; dto z.infer only).
  残留七百五十六轮：§13.2 focused evidence suite re-run (908 tests, residuals 250–755 locks, no checkbox changes)。
  残留七百五十七轮：retire AgentCitation dual (AgentCitationSchema = KnowledgeCitationSchema).
  残留七百五十八轮：§13.2 focused evidence suite re-run (911 tests, residuals 250–757 locks, no checkbox changes)。
  残留七百五十九轮：retire OAuth callback/bind dual (BindOAuthSchema = OAuthCallbackSchema; min(1) unified).
  残留七百六十轮：§13.2 focused evidence suite re-run (914 tests, residuals 250–759 locks, no checkbox changes)。
  残留七百六十一轮：retire ReindexKnowledgeRes dual (ResSchema + z.infer; OpenAPI drops inline body).
  残留七百六十二轮：§13.2 focused evidence suite re-run (917 tests, residuals 250–761 locks, no checkbox changes)。
  残留七百六十三轮：retire OAuth provider enum dual (OAuthProviderSchema sole body).
  残留七百六十四轮：§13.2 focused evidence suite re-run (920 tests, residuals 250–763 locks, no checkbox changes)。
  残留七百六十五轮：retire OAuth response duals (GetOAuthUrl/Bind/Providers ResSchema + z.infer).
  残留七百六十六轮：§13.2 focused evidence suite re-run (923 tests, residuals 250–765 locks, no checkbox changes)。
  残留七百六十七轮：retire CheckAvailabilityRes dual (AvailabilityResponseSchema + z.infer).
  残留七百六十八轮：§13.2 focused evidence suite re-run (926 tests, residuals 250–767 locks, no checkbox changes)。
  残留七百六十九轮：retire session ValidateTokenRes/GuestModeRes duals (ResSchema + z.infer).
  残留七百七十轮：§13.2 focused evidence suite re-run (929 tests, residuals 250–769 locks, no checkbox changes)。
  残留七百七十一轮：retire export/import settings Res duals (ResponseSchema + z.infer).
  残留七百七十二轮：§13.2 focused evidence suite re-run (932 tests, residuals 250–771 locks, no checkbox changes)。
  残留七百七十三轮：retire ListKnowledgeRepositoryConnectionsRes dual (ResSchema + z.infer).
  残留七百七十四轮：§13.2 focused evidence suite re-run (935 tests, residuals 250–773 locks, no checkbox changes)。
  残留七百七十五轮：retire upcoming/today schedule list Res duals (shared ReminderScheduleListResSchema).
  残留七百七十六轮：§13.2 focused evidence suite re-run (938 tests, residuals 250–775 locks, no checkbox changes)。
  残留七百七十七轮：retire focus statistics/pomodoro Res duals (ResSchema + z.infer).
  残留七百七十八轮：§13.2 focused evidence suite re-run (941 tests, residuals 250–777 locks, no checkbox changes)。
  残留七百七十九轮：retire QueryGoalFoldersRes dual (ResSchema + z.infer; OpenAPI drops inline body).
  残留七百八十轮：§13.2 focused evidence suite re-run (944 tests, residuals 250–779 locks, no checkbox changes)。
  残留七百八十一轮：retire BatchGroupTemplatesRes dual (ReminderBatchResultSchema; drop unused errors).
  残留七百八十二轮：§13.2 focused evidence suite re-run (947 tests, residuals 250–781 locks, no checkbox changes)。
  残留七百八十三轮：retire ListRulesRes/SearchRulesRes/GetRuleRevisionsRes duals (ResSchema + z.infer; drop ZodType annotation).
  残留七百八十四轮：§13.2 focused evidence suite re-run (950 tests, residuals 250–783 locks, no checkbox changes)。
  残留七百八十五轮：retire GetFocusStatusRes/GetFocusHistoryRes duals (ResSchema + z.infer; nest FocusSessionClientDTOSchema).
  残留七百八十六轮：§13.2 focused evidence suite re-run (952 tests, residuals 250–785 locks, no checkbox changes)。
  残留七百八十七轮：retire GenerateGoalAutomationRes dual (ResSchema + z.infer; nest plan/action/TokenUsage).
  残留七百八十八轮：§13.2 focused evidence suite re-run (954 tests, residuals 250–787 locks, no checkbox changes)。
  残留七百八十九轮：retire GetTaskInstancesByRangeRes/TaskInstanceOperationRes duals (ResSchema + z.infer; nest TaskInstanceResponseSchema).
  残留七百九十轮：§13.2 focused evidence suite re-run (956 tests, residuals 250–789 locks, no checkbox changes)。
  残留七百九十一轮：retire ExportGoalsRes/ImportGoalsRes duals (ResSchema + z.infer; export data string|Uint8Array).
  残留七百九十二轮：§13.2 focused evidence suite re-run (958 tests, residuals 250–791 locks, no checkbox changes)。
  残留七百九十三轮：retire Scan/Search/ConfirmedLocalVaultWrite Res duals (nested DTO *Schema + z.infer).
  残留七百九十四轮：§13.2 focused evidence suite re-run (961 tests, residuals 250–793 locks, no checkbox changes)。
  残留七百九十五轮：retire local vault Req duals (Select/Read/Search/Open/ConfirmedWrite ReqSchema + z.infer).
  残留七百九十六轮：§13.2 focused evidence suite re-run (964 tests, residuals 250–795 locks, no checkbox changes)。
  残留七百九十七轮：retire TaskGraphDependencyDTO dual (TaskDependencyResponseSchema + z.infer; keep QueryTaskTemplateGraphRes interface).
  残留七百九十八轮：§13.2 focused evidence suite re-run (967 tests, residuals 250–797 locks, no checkbox changes)。
  残留七百九十九轮：retire BatchOperationResultDTO dual (NotificationBatchResultSchema + z.infer; Mark/Delete/Cleanup Res aliases).
  残留八百轮：§13.2 focused evidence suite re-run (970 tests, residuals 250–799 locks, no checkbox changes)。
  残留八百零一轮：retire UnreadCountResponse dual (contracts UnreadCountResponseSchema + z.infer; port re-export).
  残留八百零二轮：§13.2 focused evidence suite re-run (973 tests, residuals 250–801 locks, no checkbox changes)。
  残留八百零三轮：retire KnowledgeRepositoryConnectionClientDTO dual (ClientSchema + z.infer; keep ServerDTO).
  残留八百零四轮：§13.2 focused evidence suite re-run (976 tests, residuals 250–803 locks, no checkbox changes)。
  残留八百零五轮：retire ProgressBreakdown dual (ProgressBreakdownResSchema + z.infer; keep ProgressCalculationMode).
  残留八百零六轮：§13.2 focused evidence suite re-run (979 tests, residuals 250–805 locks, no checkbox changes)。
  残留八百零七轮：retire MessageClientDTO dual (MessageClientDTOSchema + z.infer; UI computed fields).
  残留八百零八轮：§13.2 focused evidence suite re-run (982 tests, residuals 250–807 locks, no checkbox changes)。
  残留八百零九轮：retire AIConversationClientDTO dual (ClientDTOSchema + z.infer; brand identityId).
  残留八百一十轮：§13.2 focused evidence suite re-run (985 tests, residuals 250–809 locks, no checkbox changes)。
  残留八百一十一轮：retire AIProviderConfigClientDTO dual (aggregate ClientDTOSchema + z.infer; brand identityId).
  残留八百一十二轮：§13.2 focused evidence suite re-run (988 tests, residuals 250–811 locks, no checkbox changes)。
  残留八百一十三轮：retire FocusSessionClientDTO dual (FocusSessionClientDTOSchema + z.infer).
  残留八百一十四轮：§13.2 focused evidence suite re-run (991 tests, residuals 250–813 locks, no checkbox changes)。
  残留八百一十五轮：retire GoalRecordClientDTO dual (GoalRecordClientDTOSchema + z.infer).
  残留八百一十六轮：§13.2 focused evidence suite re-run (994 tests, residuals 250–815 locks, no checkbox changes)。
  残留八百一十七轮：retire KeyResultClientDTO/GoalReviewClientDTO duals (*ClientDTOSchema + z.infer; drop ZodType annotations).
  残留八百一十八轮：§13.2 focused evidence suite re-run (997 tests, residuals 250–817 locks, no checkbox changes)。
  残留八百一十九轮：retire GoalClientDTO/GoalFolderClientDTO duals (*ClientDTOSchema + z.infer; drop ZodType annotations).
  残留八百二十轮：§13.2 focused evidence suite re-run (1000 tests, residuals 250–819 locks, no checkbox changes)。
  残留八百二十一轮：retire RuleClientDTO/RuleRevisionClientDTO duals (*ClientDTOSchema + z.infer; drop ZodType annotations).
  残留八百二十二轮：§13.2 focused evidence suite re-run (1003 tests, residuals 250–821 locks, no checkbox changes)。
  残留八百二十三轮：retire UserSettingClientDTO dual (UserSettingResponseSchema + z.infer).
  残留八百二十四轮：§13.2 focused evidence suite re-run (1006 tests, residuals 250–823 locks, no checkbox changes)。
  残留八百二十五轮：retire AccountClientDTO dual (AccountResponseSchema + z.infer).
  残留八百二十六轮：§13.2 focused evidence suite re-run (1009 tests, residuals 250–825 locks, no checkbox changes)。
  残留八百二十七轮：retire ReminderGroupClientDTO/ReminderHistoryClientDTO duals (*ResponseSchema + z.infer).
  残留八百二十八轮：§13.2 focused evidence suite re-run (1012 tests, residuals 250–827 locks, no checkbox changes)。
  残留八百二十九轮：retire NotificationPreference/CalendarEntry/UserReminderPreferences ClientDTO duals (*ResponseSchema + z.infer).
  残留八百三十轮：§13.2 focused evidence suite re-run (1015 tests, residuals 250–829 locks, no checkbox changes)。
  残留八百三十一轮：retire TaskDependency/TaskInstance/ScheduleTask ClientDTO duals (*ResponseSchema + z.infer; keep DependencyChain interface).
  残留八百三十二轮：§13.2 focused evidence suite re-run (1018 tests, residuals 250–831 locks, no checkbox changes)。
  残留八百三十三轮：retire ActiveTimeConfig/ReminderTemplate/ScheduleExecution duals (activatedAt VO schema; *ResponseSchema + z.infer).
  残留八百三十四轮：§13.2 focused evidence suite re-run (1021 tests, residuals 250–833 locks, no checkbox changes)。
  残留八百三十五轮：retire Create/Update ReminderTemplate request ActiveTime dual (ActiveTimeConfigSchema activatedAt; drop startDate mapping).
  残留八百三十六轮：§13.2 focused evidence suite re-run (1024 tests, residuals 250–835 locks, no checkbox changes)。
  残留八百三十七轮：retire TaskFolderClientDTO/TaskTemplateHistoryClientDTO duals (*ResponseSchema + z.infer; keep Server interfaces).
  残留八百三十八轮：§13.2 focused evidence suite re-run (1027 tests, residuals 250–837 locks, no checkbox changes)。
  残留八百三十九轮：retire NotificationTemplateClientDTO dual (NotificationTemplateResponseSchema + z.infer; keep Server interface).
  残留八百四十轮：§13.2 focused evidence suite re-run (1030 tests, residuals 250–839 locks, no checkbox changes)。
  残留八百四十一轮：retire SubtaskClientDTO dual (SubtaskResponseSchema + z.infer; SubtaskServer stays retired).
  残留八百四十二轮：§13.2 focused evidence suite re-run (1033 tests, residuals 250–841 locks, no checkbox changes)。
  残留八百四十三轮：retire TaskFolderServerDTO/TaskTemplateHistoryServerDTO duals (same *ResponseSchema + z.infer as Client).
  残留八百四十四轮：§13.2 focused evidence suite re-run (1036 tests, residuals 250–843 locks, no checkbox changes)。
  残留八百四十五轮：retire NotificationTemplateServerDTO dual (same NotificationTemplateResponseSchema + z.infer as Client).
  残留八百四十六轮：§13.2 focused evidence suite re-run (1039 tests, residuals 250–845 locks, no checkbox changes)。
  残留八百四十七轮：retire DeviceInfoDTO dual (DeviceInfo sole interface + type alias; slim OpenAPI schema stays separate).
  残留八百四十八轮：§13.2 focused evidence suite re-run (1042 tests, residuals 250–847 locks, no checkbox changes)。
  残留八百四十九轮：retire ChannelResponseDTO/ChannelErrorDTO/RateLimitDTO duals (VO sole interface + type alias).
  残留八百五十轮：§13.2 focused evidence suite re-run (1045 tests, residuals 250–849 locks, no checkbox changes)。
  残留八百五十一轮：retire CategoryPreference/NotificationAction/DoNotDisturb/NotificationMetadata DTO duals (VO type alias).
  残留八百五十二轮：§13.2 focused evidence suite re-run (1048 tests, residuals 250–851 locks, no checkbox changes)。
  残留八百五十三轮：retire GoalMetadata/AccountSettings/ChecklistItemDefinition DTO duals (exact VO type alias; keep DomainDate duals).
  残留八百五十四轮：§13.2 focused evidence suite re-run (1051 tests, residuals 250–853 locks, no checkbox changes)。
  残留八百五十五轮：retire HashedPassword/EmailAddress/PhoneNumber/PlainPassword DTO duals (VO type alias).
  残留八百五十六轮：§13.2 focused evidence suite re-run (1054 tests, residuals 250–855 locks, no checkbox changes)。
  残留八百五十七轮：retire FrequencyAdjustment/ResponseMetrics DTO duals (VO type alias).
  残留八百五十八轮：§13.2 focused evidence suite re-run (1057 tests, residuals 250–857 locks, no checkbox changes)。
  残留八百五十九轮：DomainDate≠TransferDate dual keep-boundary surface lock (exact VO duals exhausted; no checkbox changes).
  残留八百六十轮：§13.2 focused evidence suite re-run (1060 tests, residuals 250–859 locks, no checkbox changes)。
  残留八百六十一轮：retire ReminderResponse/NotificationChannel subset duals (Client/Server via Omit).
  残留八百六十二轮：§13.2 focused evidence suite re-run (1063 tests, residuals 250–861 locks, no checkbox changes)。
  残留八百六十三轮：retire NotificationClientDTO dual (Omit Server + client channel list).
  残留八百六十四轮：§13.2 focused evidence suite re-run (1066 tests, residuals 250–863 locks, no checkbox changes)。
  残留八百六十五轮：retire dead AuthStatusDTO dual (AuthStatus sole desktop status shape).
  残留八百六十六轮：§13.2 focused evidence suite re-run (1069 tests, residuals 250–865 locks, no checkbox changes)。
  残留八百六十七轮：retire dead LoginResponse dual (OfflineLoginResponse/AuthResponseDTO sole paths).
  残留八百六十八轮：§13.2 focused evidence suite re-run (1072 tests, residuals 250–867 locks, no checkbox changes)。
  残留八百六十九轮：retire DesktopLoginRequest dual (EmailLoginCredentials type alias).
  残留八百七十轮：§13.2 focused evidence suite re-run (1075 tests, residuals 250–869 locks, no checkbox changes)。
  残留五百六十八轮：§13.2 focused evidence suite re-run（657 tests，residuals 250–567 锁；不改 checkbox）。
  残留五百六十九轮：Host panel shared product ownership resolver（resolveHostPanelOwnedProductRun）。
  残留五百七十轮：§13.2 focused evidence suite re-run（660 tests，residuals 250–569 锁；不改 checkbox）。
  残留五百七十一轮：Host panel settlement reuses shared product ownership resolver。
  残留五百七十二轮：§13.2 focused evidence suite re-run（661 tests，residuals 250–571 锁；不改 checkbox）。
  残留五百七十三轮：Host panel revise sole product draftAction gate（approve 对称）。
  残留五百七十四轮：§13.2 focused evidence suite re-run（663 tests，residuals 250–573 锁；不改 checkbox）。
  残留五百七十五轮：goal session primary-task confirm sole create_task_template。
  残留五百七十六轮：§13.2 focused evidence suite re-run（664 tests，residuals 250–575 锁；不改 checkbox）。
  残留五百七十七轮：Host panel primary-task-shaped ownership → create_task_template。
  残留五百七十八轮：§13.2 focused evidence suite re-run（666 tests，residuals 250–577 锁；不改 checkbox）。
  残留五百七十九轮：Host panel primary-task-shaped settlement via goal session confirm/cancel。
  残留五百八十轮：§13.2 focused evidence suite re-run（667 tests，residuals 250–579 锁；不改 checkbox）。
  残留五百八十一轮：Host panel settlement ownership classifiers（process-local vs goal-session）。
  残留五百八十二轮：§13.2 focused evidence suite re-run（669 tests，residuals 250–581 锁；不改 checkbox）。
  残留五百八十三轮：goal session primary-task confirm 转发 Host-revised goalId。
  残留五百八十四轮：§13.2 focused evidence suite re-run（670 tests，residuals 250–583 锁；不改 checkbox）。
  残留五百八十五轮：Host workbench primary-task exclusive kind routing（focus/reopen/builders）。
  残留五百八十六轮：§13.2 focused evidence suite re-run（674 tests，residuals 250–585 锁；不改 checkbox）。
  残留五百八十七轮：goal session Host lifecycle kind primary-task → task.create。
  残留五百八十八轮：§13.2 focused evidence suite re-run（675 tests，residuals 250–587 锁；不改 checkbox）。
  残留五百八十九轮：dual-mirror primary-task goal session settle into exclusive task lane。
  残留五百九十轮：§13.2 focused evidence suite re-run（679 tests，residuals 250–589 锁；不改 checkbox）。
  残留五百九十一轮：dual-mirror process-local task.create 优先于 goal overwrite。
  残留五百九十二轮：§13.2 focused evidence suite re-run（681 tests，residuals 250–591 锁；不改 checkbox）。
  残留五百九十三轮：session restore dual-mirror exclusive task before focus。
  残留五百九十四轮：§13.2 focused evidence suite re-run（683 tests，residuals 250–593 锁；不改 checkbox）。
  残留五百九十五轮：live exclusive dual-mirror before builders（dropStale opt）。
  残留五百九十六轮：§13.2 focused evidence suite re-run（685 tests，residuals 250–595 锁；不改 checkbox）。
  残留五百九十七轮：Host panel ownership dual-mirror exclusive before match。
  残留五百九十八轮：§13.2 focused evidence suite re-run（688 tests，residuals 250–597 锁；不改 checkbox）。
  残留五百九十九轮：drop dual-mirror primary-task ghost beside normal goal。
  残留六百轮：§13.2 focused evidence suite re-run（690 tests，residuals 250–599 锁；不改 checkbox）。
  残留六百零一轮：knowledge ghost drop + focus exclusive-only。
  残留六百零二轮：§13.2 focused evidence suite re-run（692 tests，residuals 250–601 锁；不改 checkbox）。
  残留六百零三轮：knowledge classifier + AgentRun history session focus。
  残留六百零四轮：§13.2 focused evidence suite re-run（694 tests，residuals 250–603 锁；不改 checkbox）。
  残留六百零五轮：knowledge process-local edit revise via classifier。
  残留六百零六轮：§13.2 focused evidence suite re-run（695 tests，residuals 250–605 锁；不改 checkbox）。
  残留六百零七轮：goal-session process-local edit revise via classifier。
  残留六百零八轮：§13.2 focused evidence suite re-run（696 tests，residuals 250–607 锁；不改 checkbox）。
  残留六百零九轮：dirty approve process-local revise before goal/knowledge confirm。
  残留六百一十轮：§13.2 focused evidence suite re-run（699 tests，residuals 250–609 锁；不改 checkbox）。
  残留六百一十一轮：default Host workbench focus prefers exclusive session。
  残留六百一十二轮：§13.2 focused evidence suite re-run（702 tests，residuals 250–611 锁；不改 checkbox）。
  残留六百一十三轮：Host proposal/receipt exclusive session order (task > goal > knowledge)。
  残留六百一十四轮：§13.2 focused evidence suite re-run（705 tests，residuals 250–613 锁；不改 checkbox）。
  残留六百一十五轮：删除 contracts ActionResult 双轨死表面（Result 信封唯一真值）。
  残留六百一十六轮：§13.2 focused evidence suite re-run（708 tests，residuals 250–615 锁；不改 checkbox）。
  残留六百一十七轮：对齐 Result ADR（ADR-008/010/012/030）删除 ActionResult 双轨处方。
  残留六百一十八轮：§13.2 focused evidence suite re-run（710 tests，residuals 250–617 锁；不改 checkbox）。
  残留六百一十九轮：ADR-021/022 路由样例去掉已删除 contracts/response。
  残留六百二十轮：§13.2 focused evidence suite re-run（711 tests，residuals 250–619 锁；不改 checkbox）。
  残留六百二十一轮：API POST /logs Result/HttpResponse 信封收口（去掉 success 双轨）。
  残留六百二十二轮：§13.2 focused evidence suite re-run（716 tests，residuals 250–621 锁；不改 checkbox）。
  残留六百二十三轮：API GET /metrics/json Result/HttpResponse 信封收口（Prometheus text 不变）。
  残留六百二十四轮：§13.2 focused evidence suite re-run（720 tests，residuals 250–623 锁；不改 checkbox）。
  残留六百二十五轮：API GET /info Result/HttpResponse 信封收口（探针非 Result）。
  残留六百二十六轮：§13.2 focused evidence suite re-run（724 tests，residuals 250–625 锁；不改 checkbox）。
  残留六百二十七轮：API 全局错误中间件 Result/HttpResponse 信封收口（404 + 处理器）。
  残留六百二十八轮：§13.2 focused evidence suite re-run（730 tests，residuals 250–627 锁；不改 checkbox）。
  残留六百二十九轮：API PowerSync GET /schema Result/HttpResponse 信封收口（去掉部分 ok/data 双轨）。
  残留六百三十轮：§13.2 focused evidence suite re-run（735 tests，residuals 250–629 锁；不改 checkbox）。
  残留六百三十一轮：删除 schedule 操作成功/错误双轨响应 DTO（delete 成功体 null）。
  残留六百三十二轮：§13.2 focused evidence suite re-run（737 tests，residuals 250–631 锁；不改 checkbox）。
  残留六百三十三轮：删除 SettingOperationRes 双轨信封（setting 仅 DTO/Result）。
  残留六百三十四轮：§13.2 focused evidence suite re-run（739 tests，residuals 250–633 锁；不改 checkbox）。
  残留六百三十五轮：删除 ReminderOperationRes/ReminderTriggerRes 双轨信封（仅 DTO/void/Result）。
  残留六百三十六轮：§13.2 focused evidence suite re-run（741 tests，residuals 250–635 锁；不改 checkbox）。
  残留六百三十七轮：删除 AuthOperationResult 双轨信封（保留 typed desktop *Result DTO）。
  残留六百三十八轮：§13.2 focused evidence suite re-run（745 tests，residuals 250–637 锁；不改 checkbox）。
  残留六百三十九轮：删除 shared BatchOperationResponseDTO 双名；schedule 仅 ScheduleBatchOperationResponseDTO。
  残留六百四十轮：§13.2 focused evidence suite re-run（747 tests，residuals 250–639 锁；不改 checkbox）。
  残留六百四十一轮：删除 shared ChartDataDTO 死表面；shared/dtos 仅空 barrel。
  残留六百四十二轮：§13.2 focused evidence suite re-run（749 tests，residuals 250–641 锁；不改 checkbox）。
  残留六百四十三轮：删除 shared SimpleEditorTab/ContextMenuItem UI 死双轨（编辑器遗留）。
  残留六百四十四轮：§13.2 focused evidence suite re-run（751 tests，residuals 250–643 锁；不改 checkbox）。
  残留六百四十五轮：删除 shared 配置 VO 双轨 + ZodErrorResponse/Pagination 死 schema。
  残留六百四十六轮：§13.2 focused evidence suite re-run（754 tests，residuals 250–645 锁；不改 checkbox）。
  残留六百四十七轮：删除 AIProviderConfigSummary + Reminder/Goal Summary 死双轨（仅 ClientDTO）。
  残留六百四十八轮：§13.2 focused evidence suite re-run（758 tests，residuals 250–647 锁；不改 checkbox）。
  残留六百四十九轮：删除 task 依赖/子任务 Server 死双轨（保留 Client chain + SubtaskClientDTO）。
  残留六百五十轮：§13.2 focused evidence suite re-run（760 tests，residuals 250–649 锁；不改 checkbox）。
  残留六百五十一轮：删除 governance RuleServerDTO 死双轨（仅 RuleClientDTO）。
  残留六百五十二轮：§13.2 focused evidence suite re-run（762 tests，residuals 250–651 锁；不改 checkbox）。
  残留六百五十三轮：删除 schedule ServerStatic 工厂双轨 + ScheduleDashboardDTO 死表面。
  残留六百五十四轮：§13.2 focused evidence suite re-run（765 tests，residuals 250–653 锁；不改 checkbox）。
  残留六百五十五轮：删除 account/goal entities 对 aggregates 的 dual re-export。
  残留六百五十六轮：§13.2 focused evidence suite re-run（767 tests，residuals 250–655 锁；不改 checkbox）。
  残留六百五十七轮：删除 SettingOverviewDTO 死双轨（仅 UserSettingClientDTO）。
  残留六百五十八轮：§13.2 focused evidence suite re-run（769 tests，residuals 250–657 锁；不改 checkbox）。
  残留六百五十九轮：删除 notification 模板 VO 双轨 + SnoozeSessionDTO 死 dual。
  残留六百六十轮：§13.2 focused evidence suite re-run（771 tests，residuals 250–659 锁；不改 checkbox）。
  残留六百六十一轮：account/schedule/setting 模块根不再 re-export 空 dual barrel。
  残留六百六十二轮：§13.2 focused evidence suite re-run（774 tests，residuals 250–661 锁；不改 checkbox）。
  残留六百六十三轮：schedule 死 list/stats ResponseDTO + detect-conflicts 包装双轨收口。
  残留六百六十四轮：§13.2 focused evidence suite re-run（776 tests，residuals 250–663 锁；不改 checkbox）。
  残留六百六十五轮：schedule batch-delete OpenAPI schema 双轨收口。
  残留六百六十六轮：§13.2 focused evidence suite re-run（778 tests，residuals 250–665 锁；不改 checkbox）。
  残留六百六十七轮：task bind-to-goal 请求 schema 双轨收口。
  残留六百六十八轮：§13.2 focused evidence suite re-run（780 tests，residuals 250–667 锁；不改 checkbox）。
  残留六百六十九轮：knowledge sync 请求 params schema 双轨收口。
  残留六百七十轮：§13.2 focused evidence suite re-run（783 tests，residuals 250–669 锁；不改 checkbox）。
  残留六百七十一轮：notification id-batch 请求 schema 双轨收口。
  残留六百七十二轮：§13.2 focused evidence suite re-run（785 tests，residuals 250–671 锁；不改 checkbox）。
  残留六百七十三轮：AI conversation name 请求 schema 双轨收口。
  残留六百七十四轮：§13.2 focused evidence suite re-run（787 tests，residuals 250–673 锁；不改 checkbox）。
  残留六百七十五轮：knowledge list projection filter schema 双轨收口。
  残留六百七十六轮：§13.2 focused evidence suite re-run（789 tests，residuals 250–675 锁；不改 checkbox）。
  残留六百七十七轮：goal goalId list params schema 双轨收口。
  残留六百七十八轮：§13.2 focused evidence suite re-run（791 tests，residuals 250–677 锁；不改 checkbox）。
  残留六百七十九轮：schedule detect-conflicts response schema 名称双轨收口。
  残留六百八十轮：§13.2 focused evidence suite re-run（793 tests，residuals 250–679 锁；不改 checkbox）。
  残留六百八十一轮：governance OpenAPI response schema 名称双轨收口。
  残留六百八十二轮：§13.2 focused evidence suite re-run（795 tests，residuals 250–681 锁；不改 checkbox）。
  残留六百八十三轮：AI provider create schema 名称双轨收口。
  残留六百八十四轮：§13.2 focused evidence suite re-run（797 tests，residuals 250–683 锁；不改 checkbox）。
  残留六百八十五轮：authentication credential server 双轨收口。
  残留六百八十六轮：§13.2 focused evidence suite re-run（799 tests，residuals 250–685 锁；不改 checkbox）。
  残留六百八十七轮：authentication base credential server 双轨收口。
  残留六百八十八轮：§13.2 focused evidence suite re-run（800 tests，residuals 250–687 锁；不改 checkbox）。
  残留六百八十九轮：goal list response schema 双轨收口。
  残留六百九十轮：§13.2 focused evidence suite re-run（802 tests，residuals 250–689 锁；不改 checkbox）。
  残留六百九十一轮：ai chat list response schema 双轨收口。
  残留六百九十二轮：§13.2 focused evidence suite re-run（805 tests，residuals 250–691 锁；不改 checkbox）。
  残留六百九十三轮：reminder list response schema 双轨收口。
  残留六百九十四轮：§13.2 focused evidence suite re-run（808 tests，residuals 250–693 锁；不改 checkbox）。
  残留六百九十五轮：ai response Res schema 双轨收口。
  残留六百九十六轮：§13.2 focused evidence suite re-run（811 tests，residuals 250–695 锁；不改 checkbox）。
  残留六百九十七轮：task check-expired instances response schema 双轨收口。
  残留六百九十八轮：§13.2 focused evidence suite re-run（814 tests，residuals 250–697 锁；不改 checkbox）。
  残留六百九十九轮：repository installation response schema 双轨收口。
  残留七百轮：§13.2 focused evidence suite re-run（817 tests，residuals 250–699 锁；不改 checkbox）。
  残留七百零一轮：repository installation repository DTO schema 双轨收口。
  残留七百零二轮：§13.2 focused evidence suite re-run（820 tests，residuals 250–701 锁；不改 checkbox）。
  残留七百零三轮：schedule query params schema 双轨收口。
  残留七百零四轮：§13.2 focused evidence suite re-run（823 tests，residuals 250–703 锁；不改 checkbox）。
  残留七百零五轮：ai goal automation plan/preview schema 双轨收口。
  残留七百零六轮：§13.2 focused evidence suite re-run（826 tests，residuals 250–705 锁；不改 checkbox）。
  残留七百零七轮：schedule request schema 双轨收口。
  残留七百零八轮：§13.2 focused evidence suite re-run（830 tests，residuals 250–707 锁；不改 checkbox）。
  残留七百零九轮：schedule-task request schema 双轨收口。
  残留七百一十轮：§13.2 focused evidence suite re-run（834 tests，residuals 250–709 锁；不改 checkbox）。
  残留七百一十一轮：task dependency transport schema 双轨收口。
  残留七百一十二轮：§13.2 focused evidence suite re-run（838 tests，residuals 250–711 锁；不改 checkbox）。
  残留七百一十三轮：authentication session response schema 双轨收口。
  残留七百一十四轮：§13.2 focused evidence suite re-run（841 tests，residuals 250–713 锁；不改 checkbox）。
  残留七百一十五轮：schedule create/resolve response schema 双轨收口。
  残留七百一十六轮：§13.2 focused evidence suite re-run（844 tests，residuals 250–715 锁；不改 checkbox）。
  残留七百一十七轮：schedule batch response schema 双轨收口。
  残留七百一十八轮：§13.2 focused evidence suite re-run（847 tests，residuals 250–717 锁；不改 checkbox）。
  残留七百一十九轮：ai goal generation draft/preview/result schema 双轨收口。
  残留七百二十轮：§13.2 focused evidence suite re-run（850 tests，residuals 250–719 锁；不改 checkbox）。
  残留七百二十一轮：ai provider test result schema 双轨收口。
  残留七百二十二轮：§13.2 focused evidence suite re-run（853 tests，residuals 250–721 锁；不改 checkbox）。
  残留七百二十三轮：ai knowledge note persisted-ref schema 双轨收口。
  残留七百二十四轮：§13.2 focused evidence suite re-run（856 tests，residuals 250–723 锁；不改 checkbox）。
  残留七百二十五轮：schedule conflict detection result schema 双轨收口。
  残留七百二十六轮：§13.2 focused evidence suite re-run（859 tests，residuals 250–725 锁；不改 checkbox）。
  残留七百二十七轮：ai token usage schema 双轨收口。
  残留七百二十八轮：§13.2 focused evidence suite re-run（862 tests，residuals 250–727 锁；不改 checkbox）。
  残留七百二十九轮：ai goal workflow result schema 双轨收口。
  残留七百三十轮：§13.2 focused evidence suite re-run（865 tests，residuals 250–729 锁；不改 checkbox）。
  残留七百三十一轮：governance code snippet / rule tag schema 双轨收口。
  残留七百三十二轮：§13.2 focused evidence suite re-run（868 tests，residuals 250–731 锁；不改 checkbox）。
  残留七百三十三轮：reminder active hours / group stats schema 双轨收口。
  残留七百三十四轮：§13.2 focused evidence suite re-run（871 tests，residuals 250–733 锁；不改 checkbox）。
  残留七百三十五轮：reminder trigger / notification config schema 双轨收口。
  残留七百三十六轮：§13.2 focused evidence suite re-run（874 tests，residuals 250–735 锁；不改 checkbox）。
  残留七百三十七轮：goal key-result progress / snapshot schema 双轨收口。
  残留七百三十八轮：§13.2 focused evidence suite re-run（877 tests，residuals 250–737 锁；不改 checkbox）。
  残留七百三十九轮：task goal-binding / reminder-config schema 双轨收口。
  残留七百四十轮：§13.2 focused evidence suite re-run（880 tests，residuals 250–739 锁；不改 checkbox）。
  残留七百四十一轮：goal reminder-config schema 双轨收口。
  残留七百四十二轮：§13.2 focused evidence suite re-run（883 tests，residuals 250–741 锁；不改 checkbox）。
  残留七百四十三轮：task recurrence-rule schema 双轨收口。
  残留七百四十四轮：§13.2 focused evidence suite re-run（886 tests，residuals 250–743 锁；不改 checkbox）。
  残留七百四十五轮：goal focus-mode schema 双轨收口。
  残留七百四十六轮：§13.2 focused evidence suite re-run（889 tests，residuals 250–745 锁；不改 checkbox）。
  残留七百四十七轮：task time-config schema 双轨收口。
  残留七百四十八轮：§13.2 focused evidence suite re-run（892 tests，residuals 250–747 锁；不改 checkbox）。
  残留七百四十九轮：schedule nested VO response schema 双轨收口。
  残留七百五十轮：§13.2 focused evidence suite re-run（896 tests，residuals 250–749 锁；不改 checkbox）。
  残留七百五十一轮：reminder TimeSlot / ai AIModelInfo schema 双轨收口。
  残留七百五十二轮：§13.2 focused evidence suite re-run（902 tests，residuals 250–751 锁；不改 checkbox）。
  残留七百五十三轮：goal create/update reminder-config request dual 收口。
  残留七百五十四轮：§13.2 focused evidence suite re-run（905 tests，residuals 250–753 锁；不改 checkbox）。
  残留七百五十五轮：KnowledgeCitation schema 双轨收口。
  残留七百五十六轮：§13.2 focused evidence suite re-run（908 tests，residuals 250–755 锁；不改 checkbox）。
  残留七百五十七轮：AgentCitation schema 双轨收口。
  残留七百五十八轮：§13.2 focused evidence suite re-run（911 tests，residuals 250–757 锁；不改 checkbox）。
  残留七百五十九轮：OAuth callback/bind payload dual 收口。
  残留七百六十轮：§13.2 focused evidence suite re-run（914 tests，residuals 250–759 锁；不改 checkbox）。
  残留七百六十一轮：ReindexKnowledgeRes dual 收口。
  残留七百六十二轮：§13.2 focused evidence suite re-run（917 tests，residuals 250–761 锁；不改 checkbox）。
  残留七百六十三轮：OAuth provider enum dual 收口。
  残留七百六十四轮：§13.2 focused evidence suite re-run（920 tests，residuals 250–763 锁；不改 checkbox）。
  残留七百六十五轮：OAuth response dual 收口。
  残留七百六十六轮：§13.2 focused evidence suite re-run（923 tests，residuals 250–765 锁；不改 checkbox）。
  残留七百六十七轮：CheckAvailabilityRes dual 收口。
  残留七百六十八轮：§13.2 focused evidence suite re-run（926 tests，residuals 250–767 锁；不改 checkbox）。
  残留七百六十九轮：session ValidateToken/GuestMode Res dual 收口。
  残留七百七十轮：§13.2 focused evidence suite re-run（929 tests，residuals 250–769 锁；不改 checkbox）。
  残留七百七十一轮：export/import settings Res dual 收口。
  残留七百七十二轮：§13.2 focused evidence suite re-run（932 tests，residuals 250–771 锁；不改 checkbox）。
  残留七百七十三轮：ListKnowledgeRepositoryConnectionsRes dual 收口。
  残留七百七十四轮：§13.2 focused evidence suite re-run（935 tests，residuals 250–773 锁；不改 checkbox）。
  残留七百七十五轮：upcoming/today schedule list Res dual 收口。
  残留七百七十六轮：§13.2 focused evidence suite re-run（938 tests，residuals 250–775 锁；不改 checkbox）。
  残留七百七十七轮：focus statistics/pomodoro Res dual 收口。
  残留七百七十八轮：§13.2 focused evidence suite re-run（941 tests，residuals 250–777 锁；不改 checkbox）。
  残留七百七十九轮：QueryGoalFoldersRes dual 收口。
  残留七百八十轮：§13.2 focused evidence suite re-run（944 tests，residuals 250–779 锁；不改 checkbox）。
  残留七百八十一轮：BatchGroupTemplatesRes dual 收口。
  残留七百八十二轮：§13.2 focused evidence suite re-run（947 tests，residuals 250–781 锁；不改 checkbox）。
  残留七百八十三轮：list/search/revisions Res dual 收口。
  残留七百八十四轮：§13.2 focused evidence suite re-run（950 tests，residuals 250–783 锁；不改 checkbox）。
  残留七百八十五轮：focus status/history Res dual 收口。
  残留七百八十六轮：§13.2 focused evidence suite re-run（952 tests，residuals 250–785 锁；不改 checkbox）。
  残留七百八十七轮：GenerateGoalAutomationRes dual 收口。
  残留七百八十八轮：§13.2 focused evidence suite re-run（954 tests，residuals 250–787 锁；不改 checkbox）。
  残留七百八十九轮：task instance range/op Res dual 收口。
  残留七百九十轮：§13.2 focused evidence suite re-run（956 tests，residuals 250–789 锁；不改 checkbox）。
  残留七百九十一轮：export/import goals Res dual 收口。
  残留七百九十二轮：§13.2 focused evidence suite re-run（958 tests，residuals 250–791 锁；不改 checkbox）。
  残留七百九十三轮：local vault Res dual 收口。
  残留七百九十四轮：§13.2 focused evidence suite re-run（961 tests，residuals 250–793 锁；不改 checkbox）。
  残留七百九十五轮：local vault Req dual 收口。
  残留七百九十六轮：§13.2 focused evidence suite re-run（964 tests，residuals 250–795 锁；不改 checkbox）。
  残留七百九十七轮：TaskGraphDependencyDTO dual 收口。
  残留七百九十八轮：§13.2 focused evidence suite re-run（967 tests，residuals 250–797 锁；不改 checkbox）。
  残留七百九十九轮：BatchOperationResultDTO dual 收口。
  残留八百轮：§13.2 focused evidence suite re-run（970 tests，residuals 250–799 锁；不改 checkbox）。
  残留八百零一轮：UnreadCountResponse dual 收口。
  残留八百零二轮：§13.2 focused evidence suite re-run（973 tests，residuals 250–801 锁；不改 checkbox）。
  残留八百零三轮：KnowledgeRepositoryConnectionClientDTO dual 收口。
  残留八百零四轮：§13.2 focused evidence suite re-run（976 tests，residuals 250–803 锁；不改 checkbox）。
  残留八百零五轮：ProgressBreakdown dual 收口。
  残留八百零六轮：§13.2 focused evidence suite re-run（979 tests，residuals 250–805 锁；不改 checkbox）。
  残留八百零七轮：MessageClientDTO dual 收口。
  残留八百零八轮：§13.2 focused evidence suite re-run（982 tests，residuals 250–807 锁；不改 checkbox）。
  残留八百零九轮：AIConversationClientDTO dual 收口。
  残留八百一十轮：§13.2 focused evidence suite re-run（985 tests，residuals 250–809 锁；不改 checkbox）。
  残留八百一十一轮：AIProviderConfigClientDTO dual 收口。
  残留八百一十二轮：§13.2 focused evidence suite re-run（988 tests，residuals 250–811 锁；不改 checkbox）。
  残留八百一十三轮：FocusSessionClientDTO dual 收口。
  残留八百一十四轮：§13.2 focused evidence suite re-run（991 tests，residuals 250–813 锁；不改 checkbox）。
  残留八百一十五轮：GoalRecordClientDTO dual 收口。
  残留八百一十六轮：§13.2 focused evidence suite re-run（994 tests，residuals 250–815 锁；不改 checkbox）。
  残留八百一十七轮：KeyResult/GoalReview ClientDTO dual 收口。
  残留八百一十八轮：§13.2 focused evidence suite re-run（997 tests，residuals 250–817 锁；不改 checkbox）。
  残留八百一十九轮：Goal/GoalFolder ClientDTO dual 收口。
  残留八百二十轮：§13.2 focused evidence suite re-run（1000 tests，residuals 250–819 锁；不改 checkbox）。
  残留八百二十一轮：Rule/RuleRevision ClientDTO dual 收口。
  残留八百二十二轮：§13.2 focused evidence suite re-run（1003 tests，residuals 250–821 锁；不改 checkbox）。
  残留八百二十三轮：UserSettingClientDTO dual 收口。
  残留八百二十四轮：§13.2 focused evidence suite re-run（1006 tests，residuals 250–823 锁；不改 checkbox）。
  残留八百二十五轮：AccountClientDTO dual 收口。
  残留八百二十六轮：§13.2 focused evidence suite re-run（1009 tests，residuals 250–825 锁；不改 checkbox）。
  残留八百二十七轮：ReminderGroup/History ClientDTO dual 收口。
  残留八百二十八轮：§13.2 focused evidence suite re-run（1012 tests，residuals 250–827 锁；不改 checkbox）。
  残留八百二十九轮：NotificationPreference/CalendarEntry/UserReminderPreferences ClientDTO dual 收口。
  残留八百三十轮：§13.2 focused evidence suite re-run（1015 tests，residuals 250–829 锁；不改 checkbox）。
  残留八百三十一轮：TaskDependency/TaskInstance/ScheduleTask ClientDTO dual 收口（DependencyChain 保留）。
  残留八百三十二轮：§13.2 focused evidence suite re-run（1018 tests，residuals 250–831 锁；不改 checkbox）。
  残留八百三十三轮：ActiveTime/ReminderTemplate/ScheduleExecution dual 收口（activatedAt）。
  残留八百三十四轮：§13.2 focused evidence suite re-run（1021 tests，residuals 250–833 锁；不改 checkbox）。
  残留八百三十五轮：ReminderTemplate request ActiveTime dual 收口（activatedAt）。
  残留八百三十六轮：§13.2 focused evidence suite re-run（1024 tests，residuals 250–835 锁；不改 checkbox）。
  残留八百三十七轮：TaskFolder/TaskTemplateHistory ClientDTO dual 收口（*ResponseSchema）。
  残留八百三十八轮：§13.2 focused evidence suite re-run（1027 tests，residuals 250–837 锁；不改 checkbox）。
  残留八百三十九轮：NotificationTemplate ClientDTO dual 收口（*ResponseSchema）。
  残留八百四十轮：§13.2 focused evidence suite re-run（1030 tests，residuals 250–839 锁；不改 checkbox）。
  残留八百四十一轮：SubtaskClientDTO dual 收口（SubtaskResponseSchema）。
  残留八百四十二轮：§13.2 focused evidence suite re-run（1033 tests，residuals 250–841 锁；不改 checkbox）。
  残留八百四十三轮：TaskFolder/History ServerDTO dual 收口（同 *ResponseSchema）。
  残留八百四十四轮：§13.2 focused evidence suite re-run（1036 tests，residuals 250–843 锁；不改 checkbox）。
  残留八百四十五轮：NotificationTemplate ServerDTO dual 收口（同 *ResponseSchema）。
  残留八百四十六轮：§13.2 focused evidence suite re-run（1039 tests，residuals 250–845 锁；不改 checkbox）。
  残留八百四十七轮：DeviceInfoDTO dual 收口（DeviceInfo type alias）。
  残留八百四十八轮：§13.2 focused evidence suite re-run（1042 tests，residuals 250–847 锁；不改 checkbox）。
  残留八百四十九轮：ChannelResponse/Error/RateLimit DTO dual 收口（VO type alias）。
  残留八百五十轮：§13.2 focused evidence suite re-run（1045 tests，residuals 250–849 锁；不改 checkbox）。
  残留八百五十一轮：CategoryPreference/Action/DND/Metadata DTO dual 收口（VO type alias）。
  残留八百五十二轮：§13.2 focused evidence suite re-run（1048 tests，residuals 250–851 锁；不改 checkbox）。
  残留八百五十三轮：GoalMetadata/AccountSettings/ChecklistItemDefinition DTO dual 收口（exact VO type alias）。
  残留八百五十四轮：§13.2 focused evidence suite re-run（1051 tests，residuals 250–853 锁；不改 checkbox）。
  残留八百五十五轮：HashedPassword/Email/Phone/PlainPassword DTO dual 收口（VO type alias）。
  残留八百五十六轮：§13.2 focused evidence suite re-run（1054 tests，residuals 250–855 锁；不改 checkbox）。
  残留八百五十七轮：FrequencyAdjustment/ResponseMetrics DTO dual 收口（VO type alias）。
  残留八百五十八轮：§13.2 focused evidence suite re-run（1057 tests，residuals 250–857 锁；不改 checkbox）。
  残留八百五十九轮：DomainDate≠TransferDate dual keep-boundary surface 锁（exact dual 已尽；不改 checkbox）。
  残留八百六十轮：§13.2 focused evidence suite re-run（1060 tests，residuals 250–859 锁；不改 checkbox）。
  残留八百六十一轮：ReminderResponse/NotificationChannel subset dual 收口（Omit）。
  残留八百六十二轮：§13.2 focused evidence suite re-run（1063 tests，residuals 250–861 锁；不改 checkbox）。
  残留八百六十三轮：NotificationClientDTO dual 收口（Omit Server + client channel）。
  残留八百六十四轮：§13.2 focused evidence suite re-run（1066 tests，residuals 250–863 锁；不改 checkbox）。
  残留八百六十五轮：AuthStatusDTO 死 dual 收口（sole AuthStatus）。
  残留八百六十六轮：§13.2 focused evidence suite re-run（1069 tests，residuals 250–865 锁；不改 checkbox）。
  残留八百六十七轮：LoginResponse 死 dual 收口（sole OfflineLoginResponse/AuthResponseDTO）。
  残留八百六十八轮：§13.2 focused evidence suite re-run（1072 tests，residuals 250–867 锁；不改 checkbox）。
  残留八百六十九轮：DesktopLoginRequest dual 收口（EmailLoginCredentials type alias）。
  残留八百七十轮：§13.2 focused evidence suite re-run（1075 tests，residuals 250–869 锁；不改 checkbox）。
  残留五百六十六轮：§13.2 focused evidence suite re-run（655 tests，residuals 250–565 锁；不改 checkbox）。
  残留五百六十七轮：Host panel product revise pre-lifecycle waiting_approval gate。
  残留五百六十四轮：§13.2 focused evidence suite re-run（653 tests，residuals 250–563 锁；不改 checkbox）。
  残留五百六十五轮：Host panel product reject pre-lifecycle waiting_approval gate。
  残留五百六十二轮：§13.2 focused evidence suite re-run（651 tests，residuals 250–561 锁；不改 checkbox）。
  残留五百六十三轮：Host panel task.create approve pre-lifecycle sole create_task_template gate。
  残留五百六十轮：§13.2 focused evidence suite re-run（647 tests，residuals 250–559 锁；不改 checkbox）。
  残留五百六十一轮：Host panel goal/knowledge approve pre-lifecycle sole product + waiting_approval gate。
  残留三百零六轮：§13.2 focused evidence suite re-run (197 tests, residuals 250–305 locks, no checkbox changes)。
  残留三百零七轮：three-login matrix journey step 10 — GitHub OAuth identity transport never grants knowledge-repo install/token (IPC/HTTP/scopes/docs/UI source locks; still partial)。
  残留三百零八轮：§13.2 focused evidence suite re-run (198 tests, residuals 250–307 locks, no checkbox changes)。
  残留三百零九轮：ADR-035 multi-engine Turn Engine conformance harness (direct_turn + langgraph_workflow same-suite isolation; in-suite doubles only; Agent still partial)。
  残留三百一十轮：§13.2 focused evidence suite re-run (212 tests, residuals 250–309 locks, no checkbox changes)。
  残留三百一十一轮：ADR-035 Agent Host stage-0 composition freeze (no production port impls; runtime offers never emit engine.*; module does not register Turn Engines; Agent still partial)。
  残留三百一十二轮：§13.2 focused evidence suite re-run (216 tests, residuals 250–311 locks, no checkbox changes)。
  残留三百一十三轮：align Agent Host active plan stage-0 evidence pointers (status 实施中 partial; no DoD checkbox flips)。
  残留三百一十四轮：production DirectTurnEngine (engine.direct_turn) implements ITurnEnginePort; module.turnEngine wired; multi-engine still partial。
  残留三百一十五轮：§13.2 focused evidence suite re-run (223 tests, residuals 250–314 locks, no checkbox changes)。
  残留三百一十六轮：open chat send/stream routes through DirectTurnEngine (IOpenChatTurnPort); multi-engine still partial。
  残留三百一十七轮：§13.2 focused evidence suite re-run (226 tests, residuals 250–316 locks, no checkbox changes)。
  残留三百一十八轮：LangGraphWorkflowAdapter (IWorkflowAdapterPort) wraps IAgentRuntimePort; no mutation offers; Agent still partial。
  残留三百一十九轮：§13.2 focused evidence suite re-run (231 tests, residuals 250–318 locks, no checkbox changes)。
  残留三百二十轮：ProposalKernel (IProposalKernelPort) lifecycle + module.proposalKernel; no mutation execution; Agent still partial。
  残留三百二十一轮：§13.2 focused evidence suite re-run (239 tests, residuals 250–320 locks, no checkbox changes)。
  残留三百二十二轮：CapabilityResolver (ICapabilityResolverPort) fail-closed resolve + module.capabilityResolver; no silent engine.*; Agent still partial。
  残留三百二十三轮：§13.2 focused evidence suite re-run (246 tests, residuals 250–322 locks, no checkbox changes)。
  残留三百二十四轮：agent start gate uses shared CapabilityResolver.resolveFor (hot path); Agent still partial。
  残留三百二十五轮：§13.2 focused evidence suite re-run (247 tests, residuals 250–324 locks, no checkbox changes)。
  残留三百二十六轮：§13.2 evidence-pointer refresh for residual 305–325 Host adapters/start-gate (no checkbox changes)。
  残留三百二十七轮：align product ai/setting docs with ADR-034/035 runtime (Host partial + retired editor category); surface locks。
  残留三百二十八轮：§13.2 focused evidence suite re-run (253 tests, residuals 250–327 locks, no checkbox changes)。
  残留三百二十九轮：ai-files module index path rewrite to server/* + ADR-035 Host adapter table; product-docs surface。
  残留三百三十轮：§13.2 focused evidence suite re-run (254 tests, residuals 250–329 locks, no checkbox changes)。
  残留三百三十一轮：rewrite product module-index paths to server/* + live UI/e2e; path integrity surface。
  残留三百三十二轮：§13.2 focused evidence suite re-run (255 tests, residuals 250–331 locks, no checkbox changes)。
  残留三百三十三轮：three-login step 10 product-doc lock for identity-only scopes (read:user/user:email), no repo Contents, separate knowledge-repo GitHub App installation/token。
  残留三百三十四轮：§13.2 focused evidence suite re-run (255 tests, residuals 250–333 locks, no checkbox changes)。
  残留三百三十五轮：rewrite authentication-files OAuth production paths + residual 335 module-index surface lock。
  残留三百三十六轮：§13.2 focused evidence suite re-run (256 tests, residuals 250–335 locks, no checkbox changes)。
  残留三百三十七轮：production CustomModelGateway (IModelGatewayPort) + direct adapter wiring + remove editor-test.html。
  残留三百三十八轮：§13.2 focused evidence suite re-run (260 tests, residuals 250–337 locks, no checkbox changes)。
  残留三百三十九轮：feature-map auth/AI truth + remove web public debug pages + surface lock。
  残留三百四十轮：§13.2 focused evidence suite re-run (263 tests, residuals 250–339 locks, no checkbox changes)。
  残留三百四十一轮：production ReadonlyAnalysisTurnEngine (engine.pi_readonly) second Turn Engine + module.readonlyTurnEngine。
  残留三百四十二轮：§13.2 focused evidence suite re-run (268 tests, residuals 250–341 locks, no checkbox changes)。
  残留三百四十三轮：production AssistantFacade (IAssistantFacadePort) unified Host dispatch + module.assistantFacade。
  残留三百四十四轮：§13.2 focused evidence suite re-run (273 tests, residuals 250–343 locks, no checkbox changes)。
  残留三百四十五轮：AssistantFacade transport (dispatchAssistant + controller + /ai/assistant/dispatch/sse)。
  残留三百四十六轮：§13.2 focused evidence suite re-run (277 tests, residuals 250–345 locks, no checkbox changes)。
  残留三百四十七轮：AssistantFacade client dispatchAssistant (HTTP SSE + IPC NOT_SUPPORTED)。
  残留三百四十八轮：§13.2 focused evidence suite re-run (281 tests, residuals 250–347 locks, no checkbox changes)。
  残留三百四十九轮：Vue useAssistantDispatch thin entry (open chat default path unchanged)。
  残留三百五十轮：§13.2 focused evidence suite re-run (284 tests, residuals 250–349 locks, no checkbox changes)。
  残留三百五十一轮：open chat default path via dispatchAssistant/AssistantFacade (live delta + model)。
  残留三百五十二轮：§13.2 focused evidence suite re-run (285 tests, residuals 250–351 locks, no checkbox changes)。
  残留三百五十三轮：Desktop AssistantFacade IPC stream (ASSISTANT_DISPATCH_* + electron handler)。
  残留三百五十四轮：§13.2 focused evidence suite re-run (290 tests, residuals 250–353 locks, no checkbox changes)。
  残留三百五十五轮：Host Proposal approve/reject UI path (agent-run bridge + Facade lifecycle before resume executor)。
  残留三百五十六轮：§13.2 focused evidence suite re-run (298 tests, residuals 250–355 locks, no checkbox changes)。
  残留三百五十七轮：thin Host Proposal workbench panel (waiting_approval only + approve/reject Host lifecycle)。
  残留三百五十八轮：§13.2 focused evidence suite re-run (301 tests, residuals 250–357 locks, no checkbox changes)。
  残留三百五十九轮：Host Proposal revise-before-approve (revise_proposal + panel edit + optimistic concurrency)。
  残留三百六十轮：§13.2 focused evidence suite re-run (306 tests, residuals 250–359 locks, no checkbox changes)。
  残留三百六十一轮：knowledge Host Proposal path/content revise (targetPath + contentMarkdown patch)。
  残留三百六十二轮：§13.2 focused evidence suite re-run (307 tests, residuals 250–361 locks, no checkbox changes)。
  残留三百六十三轮：Host knowledge patch mapped into note executor approvedActions。
  残留三百六十四轮：§13.2 focused evidence suite re-run (308 tests, residuals 250–363 locks, no checkbox changes)。
  残留三百六十五轮：Host goal title/description patch mapped into create_goal executor approvedActions。
  残留三百六十六轮：§13.2 focused evidence suite re-run (310 tests, residuals 250–365 locks, no checkbox changes)。
  残留三百六十七轮：goal Host Proposal description revise UI (edit + dirty + residual 365 pass-through)。
  残留三百六十八轮：§13.2 focused evidence suite re-run (311 tests, residuals 250–367 locks, no checkbox changes)。
  残留三百六十九轮：open-chat Host engine profile selection (direct_turn / pi_readonly)。
  残留三百七十轮：§13.2 focused evidence suite re-run (312 tests, residuals 250–369 locks, no checkbox changes)。
  残留三百七十一轮：Host Proposal right-workbench activation (auto-open + header count + hasWorkflowContext)。
  残留三百七十二轮：§13.2 focused evidence suite re-run (312 tests, residuals 250–371 locks, no checkbox changes)。
  残留三百七十三轮：Pi/CLI process adapter fail-closed spike (probe-only, no spawn, not product default)。
  残留三百七十四轮：§13.2 focused evidence suite re-run (322 tests, residuals 250–373 locks, no checkbox changes)。
  残留三百七十五轮：production multi-engine Host journey (DirectTurn + ReadonlyAnalysis via Facade)。
  残留三百七十六轮：§13.2 focused evidence suite re-run (327 tests, residuals 250–375 locks, no checkbox changes)。
  残留三百七十七轮：multi-profile Host transport journey (pi_readonly via controller/HTTP/IPC; never identityId)。
  残留三百七十八轮：§13.2 focused evidence suite re-run (331 tests, residuals 250–377 locks, no checkbox changes)。
  残留三百七十九轮：Host execution receipt workbench (completed/failed/cancelled report panel + auto-open)。
  残留三百八十轮：§13.2 focused evidence suite re-run (335 tests, residuals 250–379 locks, no checkbox changes)。
  残留三百八十一轮：Host workbench reopen from Conversation AgentRun history (proposal/receipt)。
  残留三百八十二轮：§13.2 focused evidence suite re-run (339 tests, residuals 250–381 locks, no checkbox changes)。
  残留三百八十三轮：Host timeline Artifact cards (proposal/receipt compact cards + reopen workbench)。
  残留三百八十四轮：§13.2 focused evidence suite re-run (342 tests, residuals 250–383 locks, no checkbox changes)。
  残留三百八十五轮：Host execution receipt rich replay (path/preview/actionLines/entity deep-link)。
  残留三百八十六轮：§13.2 focused evidence suite re-run (345 tests, residuals 250–385 locks, no checkbox changes)。
  残留三百八十七轮：Host timeline focus into workbench row (highlight + scrollIntoView)。
  残留三百八十八轮：§13.2 focused evidence suite re-run (348 tests, residuals 250–387 locks, no checkbox changes)。
  残留三百八十九轮：Host workbench docs alignment + composition journey (product docs/plan/surface)。
  残留三百九十轮：§13.2 focused evidence suite re-run (351 tests, residuals 250–389 locks, no checkbox changes)。
  残留三百九十一轮：Pi process spike dry-run plan (argv/env/cwd) + production routing never references process.pi_readonly_spike。
  残留三百九十二轮：§13.2 focused evidence suite re-run (353 tests, residuals 250–391 locks, no checkbox changes)。
  残留三百九十三轮：Host open-chat stop → cancel_run (client-owned runId + dispatchAssistant)。
  残留三百九十四轮：§13.2 focused evidence suite re-run (357 tests, residuals 250–393 locks, no checkbox changes)。
  残留三百九十五轮：Host mid-turn cancel_run production journey (DirectTurn stream + ReadonlyAnalysis abort)。
  残留三百九十六轮：§13.2 focused evidence suite re-run (358 tests, residuals 250–395 locks, no checkbox changes)。
  残留三百九十七轮：Host Proposal freeform reject reason (normalize + panel + reject_proposal lifecycle)。
  残留三百九十八轮：§13.2 focused evidence suite re-run (361 tests, residuals 250–397 locks, no checkbox changes)。
  残留三百九十九轮：Host timeline multi-engine badge (AgentRun vs open-chat engineKey)。
  残留四百轮：§13.2 focused evidence suite re-run (365 tests, residuals 250–399 locks, no checkbox changes)。
  残留四百零一轮：open-chat Host timeline Artifact (live engine profile badge)。
  残留四百零二轮：§13.2 focused evidence suite re-run (368 tests, residuals 250–401 locks, no checkbox changes)。
  残留四百零三轮：open-chat Host turn badge session memory (per-conversation stash/restore)。
  残留四百零四轮：§13.2 focused evidence suite re-run (372 tests, residuals 250–403 locks, no checkbox changes)。
  残留四百零五轮：cross-end multi-engine Host product E2E scaffold (13-step journey; not Playwright/Electron green)。
  残留四百零六轮：§13.2 focused evidence suite re-run (378 tests, residuals 250–405 locks, no checkbox changes)。
  残留四百零七轮：cross-end multi-engine Host product unit driver (10 implemented_unit source contracts; external skip)。
  残留四百零八轮：§13.2 focused evidence suite re-run (383 tests, residuals 250–407 locks, no checkbox changes)。
  残留四百零九轮：Host timeline open_chat vs AgentRun surface isolation (partition + fail-closed audit)。
  残留四百一十轮：§13.2 focused evidence suite re-run (387 tests, residuals 250–409 locks, no checkbox changes)。
  残留四百一十一轮：Host workbench timeline composition (compose + isolationOk; AIChatView wiring)。
  残留四百一十二轮：§13.2 focused evidence suite re-run (390 tests, residuals 250–411 locks, no checkbox changes)。
  残留四百一十三轮：Host workbench LangGraph UI leakage boundary (allowlist + vendor diagnostic audit)。
  残留四百一十四轮：§13.2 focused evidence suite re-run (397 tests, residuals 250–413 locks, no checkbox changes)。
  残留四百一十五轮：Goal/Knowledge workflow diagnostic event presentation sanitization (no raw node.* UI)。
  残留四百一十六轮：§13.2 focused evidence suite re-run (409 tests, residuals 250–415 locks, no checkbox changes)。
  残留四百一十七轮：cross-end multi-engine scaffold/driver expanded to 16 steps (+isolation/composition/LangGraph sanitize)。
  残留四百一十八轮：§13.2 focused evidence suite re-run (410 tests, residuals 250–417 locks, no checkbox changes)。
  残留四百一十九轮：Host task.create proposal/receipt lane foundation (title+goalId; lifecycle only)。
  残留四百二十轮：§13.2 focused evidence suite re-run (414 tests, residuals 250–419 locks, no checkbox changes)。
  残留四百二十一轮：Goal observability i18n drops LangGraph node product wording + cross-end task.create unit step (16→17)。
  残留四百二十二轮：§13.2 focused evidence suite re-run (415 tests, residuals 250–421 locks, no checkbox changes)。
  残留四百二十三轮：Host task.create live lane + domain executor foundation (resolveLive + resume/createTemplate)。
  残留四百二十四轮：§13.2 focused evidence suite re-run (418 tests, residuals 250–423 locks, no checkbox changes)。
  残留四百二十五轮：Host task.create client settle + createTemplate receipt (primaryEntityId deep-link)。
  残留四百二十六轮：§13.2 focused evidence suite re-run (421 tests, residuals 250–425 locks, no checkbox changes)。
  残留四百二十七轮：Host AgentType task.create foundation + dedicated taskAgentRun session field。
  残留四百二十八轮：§13.2 focused evidence suite re-run (423 tests, residuals 250–427 locks, no checkbox changes)。
  残留四百二十九轮：Host task.create product toolMode task-create + Welcome/Footer entry。
  残留四百三十轮：§13.2 focused evidence suite re-run (424 tests, residuals 250–429 locks, no checkbox changes)。
  残留四百三十一轮：Host task.create product start foundation (TS Host start + startTaskAgentRun)。
  残留四百三十二轮：§13.2 focused evidence suite re-run (425 tests, residuals 250–431 locks, no checkbox changes)。
  残留四百三十三轮：Host task.create session restore/refresh + optional linked goalId on start。
  残留四百三十四轮：§13.2 focused evidence suite re-run (426 tests, residuals 250–433 locks, no checkbox changes)。
  残留四百三十五轮：Host task.create process-local run store foundation (get/list/events rehydrate)。
  残留四百三十六轮：§13.2 focused evidence suite re-run (433 tests, residuals 250–435 locks, no checkbox changes)。
  残留四百三十七轮：Host task.create process-local cancel/complete resume (store update + cancelTaskAgentRun/completeTaskAgentRun)。
  残留四百三十八轮：§13.2 focused evidence suite re-run (439 tests, residuals 250–437 locks, no checkbox changes)。
  残留四百三十九轮：Host task.create process-local edit revise + idempotent terminal (reviseTaskAgentRun)。
  残留四百四十轮：§13.2 focused evidence suite re-run (443 tests, residuals 250–439 locks, no checkbox changes)。
  残留四百四十一轮：Host AgentRun history reopen focus (resolveHostWorkbenchFocusFromAgentRun + task title recovery)。
  残留四百四十二轮：§13.2 focused evidence suite re-run (446 tests, residuals 250–441 locks, no checkbox changes)。
  残留四百四十三轮：Host conversation restore workbench focus (resolveHostWorkbenchFocusFromSessionRuns + selectConversation)。
  残留四百四十四轮：§13.2 focused evidence suite re-run (449 tests, residuals 250–443 locks, no checkbox changes)。
  残留四百四十五轮：Host task.create linked goal restore + conversation client settlement isolation。
  残留四百四十六轮：§13.2 focused evidence suite re-run (452 tests, residuals 250–445 locks, no checkbox changes)。
  残留四百四十七轮：§13.2 evidence pointer refresh + task.create process-local store size bound (maxEntries eviction)。
  残留四百四十八轮：§13.2 focused evidence suite re-run (455 tests, residuals 250–447 locks, no checkbox changes)。
  残留四百四十九轮：Host task.create process-local product journey (start/edit/cancel/confirm + identity)。
  残留四百五十轮：§13.2 focused evidence suite re-run (460 tests, residuals 250–449 locks, no checkbox changes)。
  残留四百五十一轮：Host task.create process-local runId identity binding (foreign takeover fail-closed)。
  残留四百五十二轮：§13.2 focused evidence suite re-run (464 tests, residuals 250–451 locks, no checkbox changes)。
  残留四百五十三轮：Host task.create confirm requires client executedActions settlement (no Host invent)。
  残留四百五十四轮：§13.2 focused evidence suite re-run (468 tests, residuals 250–453 locks, no checkbox changes)。
  残留四百五十五轮：Host task.create edit requires non-empty revised title (blank revise fail-closed)。
  残留四百五十六轮：§13.2 focused evidence suite re-run (472 tests, residuals 250–455 locks, no checkbox changes)。
  残留四百五十七轮：Host task.create process-local conversation/thread runId binding (no session rebind)。
  残留四百五十八轮：§13.2 focused evidence suite re-run (478 tests, residuals 250–457 locks, no checkbox changes)。
  残留四百五十九轮：Host task.create dirty approve revises process-local draft before domain settle。
  残留四百六十轮：§13.2 focused evidence suite re-run (481 tests, residuals 250–459 locks, no checkbox changes)。
  残留四百六十一轮：Host task.create start requires non-empty conversationId (session binding)。
  残留四百六十二轮：§13.2 focused evidence suite re-run (484 tests, residuals 250–461 locks, no checkbox changes)。
  残留四百六十三轮：Host task.create confirm requires recoverable non-empty settlement title (history reopen/receipt)。
  残留四百六十四轮：§13.2 focused evidence suite re-run (488 tests, residuals 250–463 locks, no checkbox changes)。
  残留四百六十五轮：Host task.create confirm requires recoverable non-empty settlement template entity id (receipt deep-link)。
  残留四百六十六轮：§13.2 focused evidence suite re-run (492 tests, residuals 250–465 locks, no checkbox changes)。
  残留四百六十七轮：Host task.create confirm forbids settlement goalId rebind against approved draft。
  残留四百六十八轮：§13.2 focused evidence suite re-run (496 tests, residuals 250–467 locks, no checkbox changes)。
  残留四百六十九轮：Host task.create confirm forbids settlement title rebind against approved draft。
  残留四百七十轮：§13.2 focused evidence suite re-run (500 tests, residuals 250–469 locks, no checkbox changes)。
  残留四百七十一轮：Host task.create confirm uses process-local draft only (ignore client approvedActions) + single executed。
  残留四百七十二轮：§13.2 focused evidence suite re-run (505 tests, residuals 250–471 locks, no checkbox changes)。
  残留四百七十三轮：Host task.create edit requires exactly one create_task_template approvedAction (single draft)。
  残留四百七十四轮：§13.2 focused evidence suite re-run (509 tests, residuals 250–473 locks, no checkbox changes)。
  残留四百七十五轮：Host task.create confirm only from waiting_approval (no waiting_execution settle)。
  残留四百七十六轮：§13.2 focused evidence suite re-run (513 tests, residuals 250–475 locks, no checkbox changes)。
  残留四百七十七轮：Host task.create cancel only from waiting_approval (symmetric with confirm/edit)。
  残留四百七十八轮：§13.2 focused evidence suite re-run (517 tests, residuals 250–477 locks, no checkbox changes)。
  残留四百七十九轮：Host task.create start requires non-empty title (no silent default invent)。
  残留四百八十轮：§13.2 focused evidence suite re-run (520 tests, residuals 250–479 locks, no checkbox changes)。
  残留四百八十一轮：Host task.create edit only from waiting_approval (symmetric with confirm/cancel)。
  残留四百八十二轮：§13.2 focused evidence suite re-run (524 tests, residuals 250–481 locks, no checkbox changes)。
  残留四百八十三轮：Host task.create start conversationId builder fail-closed (no silent null invent)。
  残留四百八十四轮：§13.2 focused evidence suite re-run (526 tests, residuals 250–483 locks, no checkbox changes)。
  残留四百八十五轮：Host task.create start threadId builder fail-closed (trim non-empty)。
  残留四百八十六轮：§13.2 focused evidence suite re-run (530 tests, residuals 250–485 locks, no checkbox changes)。
  残留四百八十七轮：stage-6 task DAG *ViewModel dual-track retirement (canonical TaskForDAG/TaskGraph*)。
  残留四百八十八轮：§13.2 focused evidence suite re-run (532 tests, residuals 250–487 locks, no checkbox changes)。
  残留四百八十九轮：Host task.create client complete only from waiting_approval (symmetric cancel/edit + Host 475)。
  残留四百九十轮：§13.2 focused evidence suite re-run (533 tests, residuals 250–489 locks, no checkbox changes)。
  残留四百九十一轮：Host task.create edit/confirm tool+empty-action named constants fail-closed。
  残留四百九十二轮：§13.2 focused evidence suite re-run (536 tests, residuals 250–491 locks, no checkbox changes)。
  残留四百九十三轮：Host task.create start identityId builder fail-closed (ExecutionContext non-empty trim)。
  残留四百九十四轮：§13.2 focused evidence suite re-run (540 tests, residuals 250–493 locks, no checkbox changes)。
  残留四百九十五轮：Host task.create resume agentType/unsupported-decision named constants + store non-task.create fail-closed。
  残留四百九十六轮：§13.2 focused evidence suite re-run (543 tests, residuals 250–495 locks, no checkbox changes)。
  残留四百九十七轮：Host task.create start runId builder fail-closed (trim non-empty process-local key)。
  残留四百九十八轮：§13.2 focused evidence suite re-run (547 tests, residuals 250–497 locks, no checkbox changes)。
  残留四百九十九轮：Host task.create start agentType builder fail-closed (must be task.create, no retype)。
  残留五百轮：§13.2 focused evidence suite re-run (550 tests, residuals 250–499 locks, no checkbox changes)。
  残留五百零一轮：Client task.create complete settlement draft create_task_template only (no blind pending[0])。
  残留五百零二轮：§13.2 focused evidence suite re-run (551 tests, residuals 250–501 locks, no checkbox changes)。
  残留五百零三轮：Host task.create process-local store identity trim match (blank query fail-closed)。
  残留五百零四轮：§13.2 focused evidence suite re-run (556 tests, residuals 250–503 locks, no checkbox changes)。
  残留五百零五轮：Host task.create process-local store runId trim lookup (blank runId fail-closed)。
  残留五百零六轮：§13.2 focused evidence suite re-run (561 tests, residuals 250–505 locks, no checkbox changes)。
  残留五百零七轮：Client task.create revise draft create_task_template only (no blind source[0])。
  残留五百零八轮：§13.2 focused evidence suite re-run (562 tests, residuals 250–507 locks, no checkbox changes)。
  残留五百零九轮：Host task.create process-local store conversationId trim match (blank filter fail-closed)。
  残留五百一十轮：§13.2 focused evidence suite re-run (567 tests, residuals 250–509 locks, no checkbox changes)。
  残留五百一十一轮：Host task.create process-local store threadId trim match (blank threadId fail-closed)。
  残留五百一十二轮：§13.2 focused evidence suite re-run (572 tests, residuals 250–511 locks, no checkbox changes)。
  残留五百一十三轮：Host task.create process-local store conversationId upsert normalize (blank fail-closed)。
  残留五百一十四轮：§13.2 focused evidence suite re-run (577 tests, residuals 250–513 locks, no checkbox changes)。
  残留五百一十五轮：Host task.create process-local store identityId upsert normalize (blank fail-closed)。
  残留五百一十六轮：§13.2 focused evidence suite re-run (581 tests, residuals 250–515 locks, no checkbox changes)。
  残留五百一十七轮：Host task.create listRuns remote ownership trim match (blank fail-closed)。
  残留五百一十八轮：§13.2 focused evidence suite re-run (583 tests, residuals 250–517 locks, no checkbox changes)。
  残留五百一十九轮：Client task.create draft title/goalId create_task_template only (no blind pending[0])。
  残留五百二十轮：§13.2 focused evidence suite re-run (586 tests, residuals 250–519 locks, no checkbox changes)。
  残留五百二十一轮：Client knowledge.write draft path/markdown create_knowledge_note only (no blind pending[0])。
  残留五百二十二轮：§13.2 focused evidence suite re-run (589 tests, residuals 250–521 locks, no checkbox changes)。
  残留五百二十三轮：Client goal.create draft title/description create_goal only (no blind pending[0])。
  残留五百二十四轮：§13.2 focused evidence suite re-run (592 tests, residuals 250–523 locks, no checkbox changes)。
  残留五百二十五轮：Client workbench summary rationale product-lane tool only (no blind pending[0])。
  残留五百二十六轮：§13.2 focused evidence suite re-run (597 tests, residuals 250–525 locks, no checkbox changes)。
  残留五百二十七轮：Client workbench pendingActionCount product-lane tool only (no foreign tools)。
  残留五百二十八轮：§13.2 focused evidence suite re-run (602 tests, residuals 250–527 locks, no checkbox changes)。
  残留五百二十九轮：Client receipt primaryEntityId product-lane executed tool only (no foreign entityIds[0])。
  残留五百三十轮：§13.2 focused evidence suite re-run (607 tests, residuals 250–529 locks, no checkbox changes)。
  残留五百三十一轮：Client knowledge.write draft title create_knowledge_note only (no blind pending[0])。
  残留五百三十二轮：§13.2 focused evidence suite re-run (611 tests, residuals 250–531 locks, no checkbox changes)。
  残留五百三十三轮：Client receipt summary excludes cross-lane foreign tools (no counts/actionLines/entityIds inflation)。
  残留五百三十四轮：§13.2 focused evidence suite re-run (615 tests, residuals 250–533 locks, no checkbox changes)。
  残留五百三十五轮：Client receipt summary error same-lane failed action only (no blind errors[0])。
  残留五百三十六轮：§13.2 focused evidence suite re-run (619 tests, residuals 250–535 locks, no checkbox changes)。
  残留五百三十七轮：Client receipt ok requires product-lane executed (companion-only is not success)。
  残留五百三十八轮：§13.2 focused evidence suite re-run (624 tests, residuals 250–537 locks, no checkbox changes)。
  残留五百三十九轮：stage-6 editor dual-track / portable boundary re-lock (PowerSync editor_* backup-only + knowledge routes + /note strip)。
  残留五百四十轮：§13.2 focused evidence suite re-run (627 tests, residuals 250–539 locks, no checkbox changes)。
  残留五百四十一轮：§13.2 evidence-audit refresh + Host edit draftAction sole create_task_template (no multi-index invent)。
  残留五百四十二轮：§13.2 focused evidence suite re-run (628 tests, residuals 250–541 locks, no checkbox changes)。
  残留五百四十三轮：Host task.create confirm settlementAction sole create_task_template (no multi-index invent)。
  残留五百四十四轮：§13.2 focused evidence suite re-run (629 tests, residuals 250–543 locks, no checkbox changes)。
  残留五百四十五轮：Host task.create confirm store draftAction sole create_task_template (no multi-index invent)。
  残留五百四十六轮：§13.2 focused evidence suite re-run (632 tests, residuals 250–545 locks, no checkbox changes)。
  残留五百四十七轮：Client task.create complete/revise sole draftAction create_task_template (no multi-find invent)。
  残留五百四十八轮：§13.2 focused evidence suite re-run (633 tests, residuals 250–547 locks, no checkbox changes)。
  残留五百四十九轮：Client workbench soleProductDraftAction product-lane draft (no multi-find invent)。
  残留五百五十轮：§13.2 focused evidence suite re-run (637 tests, residuals 250–549 locks, no checkbox changes)。
  残留五百五十一轮：Client applyHost*Patch sole product draftAction (no multi-index invent)。
  残留五百五十二轮：§13.2 focused evidence suite re-run (642 tests, residuals 250–551 locks, no checkbox changes)。
  残留五百五十三轮：Host confirm store draft resolve sole create_task_template (foreign companions ignored)。
  残留五百五十四轮：§13.2 focused evidence suite re-run (644 tests, residuals 250–553 locks, no checkbox changes)。
  残留五百五十五轮：Client knowledge.write confirm sole create_knowledge_note draftAction (no multi product invent)。
  残留五百五十六轮：§13.2 focused evidence suite re-run (645 tests, residuals 250–555 locks, no checkbox changes)。
  残留五百五十七轮：Client goal.create confirm sole create_goal draftAction (no multi product invent)。
  残留五百五十八轮：§13.2 focused evidence suite re-run (646 tests, residuals 250–557 locks, no checkbox changes)。
  残留五百五十九轮：Client goal.create confirm/cancel + knowledge.write confirm waiting_approval-only。
  仍缺完整 multi-engine Turn Engine E2E 与跨端对抗 Playwright/Electron。  残留五百四十一轮：Host edit draftAction 单 create_task_template + Client product-lane isolation 501–537 + tip suite 627 证据指针刷新；仍不构成跨端 Playwright/Electron multi-engine E2E / 真实 Pi spawn 证据。
  残留八百五十九轮：DomainDate dual keep-boundary surface 锁（非 Agent multi-engine E2E）；仍为部分。

- [x] webhook、read model、附件和 RAG 可从 GitHub default branch 重建。 **（已证明）**
- [x] Web Markdown 安全测试通过，不泄露本机路径或 GitHub token。 **（已证明）**
  残留三百零五至三百二十五轮（ADR-035 Host 部分落地，仍不打勾）：
  journey steps 1–16 + multi-engine conformance harness（in-suite doubles）；生产
  `DirectTurnEngine`/`LangGraphWorkflowAdapter`/`ProposalKernel`/`CapabilityResolver`；
  open-chat 经 DirectTurnEngine；`startRun` knowledge.generate 经共享 CapabilityResolver
  fail-closed 热路径；stage-0 freeze 仅允许上述生产 adapter。
  tip residual 325 focused suite：**71 文件 / 247 测试** + governance-check GOV_EXIT:0。
  **仍缺**：第二生产 Turn Engine、统一助手 UI、完整 multi-engine runtime E2E、跨端对抗
  Playwright/Electron 与真实 OAuth/GitHub fixture。
- [ ] 相关 lint、typecheck、test、Web/Desktop E2E、governance 和 prod-like 验收通过。 **（部分验证 + 外部阻塞）**
  证据：本分支多轮 focused lint/typecheck/test 与 `daily-use:governance-check` 通过；Web 核心
  Playwright 集合含 knowledge note boundary 与 AI goal-workflow。残留二十七轮：prod-like
  `docker:local:up` 在当前宿主机已成功（六服务 healthy；Web 200 / API health 200），历史 Docker
  磁盘耗尽不再是阻塞。残留一百零八轮：HTTP 204 无 body + checkpoint void `ok(null)` 收口。
  残留一百八十一轮：tip 上 `daily-use:governance-check` + focused ownership/journey specs 通过；仍不构成全量 PR 门禁证据。
  残留一百九十一轮：tip 上 87 项核心 evidence suite + `daily-use:governance-check` 通过；仍不构成全量 PR 门禁证据。
  残留一百九十五轮：tip 上 107 项核心 evidence suite 通过；仍不构成全量 PR 门禁证据。
  残留一百九十八轮：tip 上 118 项核心 evidence suite 通过；仍不构成全量 PR 门禁证据。
  残留二百零四轮：tip 上 157 项核心 evidence suite（含 confirmed-create / editor-pref / dual-track VO 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百零八轮：tip 上 205 项核心 evidence suite（含 206–207 terminology + eval fixture 对齐）通过；仍不构成全量 PR 门禁证据。
  残留二百一十二轮：tip 上 204 项核心 evidence suite（含 residual 211 MSW/e2e/docs 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百一十六轮：tip 上 212 项核心 evidence suite（含 residual 213–215 source/index/snake 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百一十九轮：tip 上 216 项核心 evidence suite（含 residual 217–218 snake/python Note 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百二十四轮：tip 上 225 项核心 evidence suite（含 residual 220–223 eval/checkpoint/goal/note-mutation 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百二十八轮：tip 上 231 项核心 evidence suite（含 residual 225–227 usage/runner/menu-labels 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百三十一轮：tip 上 235 项核心 evidence suite（含 residual 229–230 note mocks/schedule/bootstrapper 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百三十四轮：tip 上 238 项核心 evidence suite（含 residual 232–233 schedule docs/reminder DTO 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百三十七轮：tip 上 249 项核心 evidence suite（含 residual 235–236 auth export/provider barrel 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百四十一轮：tip 上 258 项核心 evidence suite（含 residual 238–240 powersync/runtime/goal priority 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百四十五轮：tip 上 262 项核心 evidence suite（含 residual 242–244 electron/runtime/dashboard 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百四十九轮：tip 上 270 项核心 evidence suite（含 residual 246–248 transport/task/AI dual 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百五十三轮：tip 上 100 项 focused evidence suite（含 residual 250–252 dual 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百五十四轮：GoalDraft/GoalClarification dual 收口 + dual surface 锁 + governance-check；仍不构成全量 PR 门禁证据。
  残留二百五十五轮：tip 上 115 项 focused evidence suite（含 residual 250–254 dual 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百五十六轮：desktop shared ipc-channels dual barrel 收口 + surface 锁 + governance-check；仍不构成全量 PR 门禁证据。
  残留二百五十七轮：task domain events dual barrel 收口 + surface 锁 + governance-check；仍不构成全量 PR 门禁证据。
  残留二百五十八轮：tip 上 119 项 focused evidence suite（含 residual 250–257 dual 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百五十九轮：StreamMessageDonePayload dual 收口 + surface 锁 + governance-check；仍不构成全量 PR 门禁证据。
  残留二百六十轮：ScheduleTaskDTO/ScheduleExecutionDTO dual 收口 + surface 锁 + governance-check；仍不构成全量 PR 门禁证据。
  残留二百六十一轮：tip 上 123 项 focused evidence suite（含 residual 250–260 dual 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百六十二轮：task TaskDomainEvent/Complete·Skip Res dual 收口 + surface 锁 + governance-check；仍不构成全量 PR 门禁证据。
  残留二百六十三轮：19 dead unused *Res dual aliases 收口 + surface 锁 + governance-check；仍不构成全量 PR 门禁证据。
  残留二百六十四轮：tip 上 127 项 focused evidence suite（含 residual 250–263 dual 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百六十五轮：notification AssetImageKey dual 收口 + surface 锁 + governance-check；仍不构成全量 PR 门禁证据。
  残留二百六十六轮：IResultIpcClient dual 收口 + surface 锁 + governance-check；仍不构成全量 PR 门禁证据。
  残留二百六十七轮：tip 上 136 项 focused evidence suite（含 residual 250–266 dual 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百六十八轮：dashboard transport dual 收口 + surface 锁 + governance-check；仍不构成全量 PR 门禁证据。
  残留二百六十九轮：tip 上 138 项 focused evidence suite（含 residual 250–268 dual 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百七十轮：ElectronBridge dual 收口 + surface 锁 + governance-check；仍不构成全量 PR 门禁证据。
  残留二百七十一轮：tip 上 144 项 focused evidence suite（含 residual 250–270 dual 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百七十二轮：GovernanceIpcTransport dual 收口 + surface 锁 + governance-check；仍不构成全量 PR 门禁证据。
  残留二百七十三轮：tip 上 146 项 focused evidence suite（含 residual 250–272 dual 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百七十四轮：ResultHttpClient implements dual 收口 + surface 锁 + typecheck + governance-check；仍不构成全量 PR 门禁证据。
  残留二百七十五轮：tip 上 151 项 focused evidence suite（含 residual 250–274 dual 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百七十六轮：setting/data-portability API port dual 收口 + surface 锁 + governance-check；仍不构成全量 PR 门禁证据。
  残留二百七十七轮：tip 上 157 项 focused evidence suite（含 residual 250–276 dual 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百七十八轮：DataPortabilityClientPort dual 收口 + surface 锁 + governance-check；仍不构成全量 PR 门禁证据。
  残留二百七十九轮：tip 上 159 项 focused evidence suite（含 residual 250–278 dual 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百八十轮：SettingClientPort dual 收口 + surface 锁 + governance-check；仍不构成全量 PR 门禁证据。
  残留二百八十一轮：tip 上 161 项 focused evidence suite（含 residual 250–280 dual 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百八十二轮：AuthenticationClientPort dual 收口 + surface 锁 + governance-check；仍不构成全量 PR 门禁证据。
  残留二百八十三轮：tip 上 163 项 focused evidence suite（含 residual 250–282 dual 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百八十四轮：RepositoryClientPort dual 收口 + surface 锁 + governance-check；仍不构成全量 PR 门禁证据。
  残留二百八十五轮：tip 上 165 项 focused evidence suite（含 residual 250–284 dual 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百八十六轮：ReminderClientPort dual 收口 + surface 锁 + governance-check；仍不构成全量 PR 门禁证据。
  残留二百八十七轮：tip 上 167 项 focused evidence suite（含 residual 250–286 dual 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百八十八轮：NotificationClientPort dual 收口（去 dismissAll）+ surface 锁 + governance-check；仍不构成全量 PR 门禁证据。
  残留二百八十九轮：tip 上 169 项 focused evidence suite（含 residual 250–288 dual 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百九十轮：再删 6 项死 *Res dual + dead-res surface 扩展 + governance-check；仍不构成全量 PR 门禁证据。
  残留二百九十一轮：tip 上 169 项 focused evidence suite（含 residual 250–290 dual 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百九十二轮：AccountClientPort 有意 mapping dual surface 锁 + governance-check；仍不构成全量 PR 门禁证据。
  残留二百九十三轮：tip 上 171 项 focused evidence suite（含 residual 250–292 dual 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百九十四轮：GoalClientPort 有意 facade dual surface 锁 + governance-check；仍不构成全量 PR 门禁证据。
  残留二百九十五轮：tip 上 173 项 focused evidence suite（含 residual 250–294 dual 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百九十六轮：TaskClientPort 有意 facade dual surface 锁 + governance-check；仍不构成全量 PR 门禁证据。
  残留二百九十七轮：tip 上 175 项 focused evidence suite（含 residual 250–296 dual 锁）通过；仍不构成全量 PR 门禁证据。
  残留二百九十八轮：ScheduleClientPort 有意 facade dual surface 锁 + governance-check；仍不构成全量 PR 门禁证据。
  残留二百九十九轮：AIClientPort 有意 multi-API facade dual surface 锁 + governance-check；仍不构成全量 PR 门禁证据。
  残留三百轮：tip 上 179 项 focused evidence suite（含 residual 250–299 dual 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百零一轮：§13.2 证据指针刷新 + redesign docs 边界对齐 + legacy-note surface；仍不构成全量 PR 门禁证据。
  残留三百零二轮：tip 上 180 项 focused evidence suite（含 residual 250–301 dual/docs 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百零三轮：portable backup vs server-held disclosure 边界 surface 扩展 + product 文档对齐 + governance-check；仍不构成全量 PR 门禁证据。
  残留三百零四轮：tip 上 193 项 focused evidence suite（含 residual 250–303 dual/docs/disclosure 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百零五轮：ADR-035 multi-engine 标签隔离 journey/surface 增强（Agent 仍部分；无完整 Turn Engine conformance E2E）；仍不构成全量 PR 门禁证据。
  残留三百零六轮：tip 上 197 项 focused evidence suite（含 residual 250–305 dual/docs/disclosure/ADR-035 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百零七轮：three-login matrix 15 通过（step 10 identity≠knowledge-repo install/token 源码锁）+ nearest auth surfaces + governance-check；仍不构成全量 PR 门禁/跨端 OAuth E2E 证据。
  残留三百零八轮：tip 上 198 项 focused evidence suite（含 residual 250–307 dual/docs/disclosure/ADR-035/three-login step 10 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百零九轮：multi-engine Turn Engine conformance harness 14 通过（双引擎同 suite isolation + ownership；生产 adapter 仍缺）+ journey/stage-0 + governance-check；仍不构成全量 multi-engine runtime E2E 证据。
  残留三百一十轮：tip 上 212 项 focused evidence suite（含 residual 250–309 dual/docs/disclosure/ADR-035/three-login/harness 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百一十一轮：Agent Host stage-0 composition/port freeze surfaces 通过（生产 adapter 仍缺；runtime 不静默 emit engine.*）+ governance-check；仍不构成生产 multi-engine 接线 E2E 证据。
  残留三百一十二轮：tip 上 216 项 focused evidence suite（含 residual 250–311 dual/docs/disclosure/ADR-035/three-login/harness/composition 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百一十三轮：Agent Host plan stage-0 证据指针对齐 + governance-check；仍不构成生产 multi-engine/统一助手完成证据。
  残留三百一十四轮：DirectTurnEngine 生产首引擎 + module.turnEngine + stage-0 仅允许该引擎；仍不构成 multi-engine/统一助手完成证据。
  残留三百一十五轮：tip 上 223 项 focused evidence suite（含 residual 250–314 dual/docs/disclosure/ADR-035/three-login/harness/composition/DirectTurnEngine 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百一十六轮：open chat 经 DirectTurnEngine + IOpenChatTurnPort + composition surface；仍不构成 multi-engine/统一助手完成证据。
  残留三百一十七轮：tip 上 226 项 focused evidence suite（含 residual 250–316 open-chat/DirectTurnEngine 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百一十八轮：LangGraphWorkflowAdapter + stage-0/composition 锁通过；仍不构成 multi-engine/统一助手完成证据。
  残留三百一十九轮：tip 上 231 项 focused evidence suite（含 residual 250–318 workflow adapter 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百二十轮：ProposalKernel + stage-0/composition 锁通过；仍不构成 multi-engine/统一助手完成证据。
  残留三百二十一轮：tip 上 239 项 focused evidence suite（含 residual 250–320 ProposalKernel 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百二十二轮：CapabilityResolver + stage-0/composition 锁通过；仍不构成 multi-engine/统一助手完成证据。
  残留三百二十三轮：tip 上 246 项 focused evidence suite（含 residual 250–322 CapabilityResolver 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百二十四轮：CapabilityResolver start-gate 热路径接线 + composition 锁通过；仍不构成 multi-engine/统一助手完成证据。
  残留三百二十五轮：tip 上 247 项 focused evidence suite（含 residual 250–324 start-gate 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百二十六轮：§13.2 Agent/全量门禁证据指针刷新（305–325 Host 部分）；仍不构成完成证据。
  残留三百二十七轮：product ai/setting 文档与 runtime 边界对齐 + surface 锁；仍不构成全量 PR 门禁证据。
  残留三百二十八轮：tip 上 253 项 focused evidence suite（含 residual 250–327 product-docs 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百二十九轮：ai-files 索引与 Host 生产路径对齐 + surface 锁；仍不构成全量 PR 门禁证据。
  残留三百三十轮：tip 上 254 项 focused evidence suite（含 residual 250–329 ai-files 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百三十一轮：module-index 全量路径对齐 + integrity surface；仍不构成全量 PR 门禁证据。
  残留三百三十二轮：tip 上 255 项 focused evidence suite（含 residual 250–331 module-index 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百三十三轮：authentication product-doc + three-login step 10 identity≠knowledge-repo surface 锁；仍不构成全量 PR 门禁/跨端 OAuth E2E 证据。
  残留三百三十四轮：tip 上 255 项 focused evidence suite（含 residual 250–333 auth identity≠repo 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百三十五轮：authentication-files OAuth 真值收口 + module-index surface；仍不构成全量 PR 门禁/跨端 OAuth E2E 证据。
  残留三百三十六轮：tip 上 256 项 focused evidence suite（含 residual 250–335 auth OAuth 索引锁）通过；仍不构成全量 PR 门禁证据。
  残留三百三十七轮：CustomModelGateway Host 适配 + editor-test 清理；仍不构成第二 Turn Engine/统一助手完成证据。
  残留三百三十八轮：tip 上 260 项 focused evidence suite（含 residual 250–337 CustomModelGateway 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百三十九轮：feature-map/public debug 收口；仍不构成全量 PR 门禁/跨端 OAuth E2E 证据。
  残留三百四十轮：tip 上 263 项 focused evidence suite（含 residual 250–339 feature-map/public 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百四十一轮：第二生产 Turn Engine（ReadonlyAnalysis）落地；仍不构成完整 multi-engine runtime E2E/统一助手完成证据。
  残留三百四十二轮：tip 上 268 项 focused evidence suite（含 residual 250–341 ReadonlyAnalysis 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百四十三轮：生产 AssistantFacade 统一 Host dispatch 落地；仍不构成统一助手 UI 工作台/完整 multi-engine runtime E2E 证据。
  残留三百四十四轮：tip 上 273 项 focused evidence suite（含 residual 250–343 AssistantFacade 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百四十五轮：AssistantFacade HTTP/SSE 传输面落地；仍不构成统一助手 UI 工作台/完整 multi-engine runtime E2E 证据。
  残留三百四十六轮：tip 上 277 项 focused evidence suite（含 residual 250–345 AssistantFacade transport 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百四十七轮：AssistantFacade 客户端 HTTP/SSE 适配落地；仍不构成统一助手 UI 工作台/Desktop IPC stream 证据。
  残留三百四十八轮：tip 上 281 项 focused evidence suite（含 residual 250–347 AssistantFacade client 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百四十九轮：Vue useAssistantDispatch 薄入口落地；仍不构成统一助手 UI 工作台/完整 open chat 切换证据。
  残留三百五十轮：tip 上 284 项 focused evidence suite（含 residual 250–349 useAssistantDispatch 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百五十一轮：open chat 默认 Host dispatch 落地；仍不构成统一助手右侧工作台/完整 multi-engine E2E 证据。
  残留三百五十二轮：tip 上 285 项 focused evidence suite（含 residual 250–351 open-chat Host dispatch 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百五十三轮：Desktop AssistantFacade IPC stream 落地；仍不构成统一助手右侧工作台/完整 multi-engine E2E 证据。
  残留三百五十四轮：tip 上 290 项 focused evidence suite（含 residual 250–353 Desktop Assistant IPC 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百五十五轮：Host Proposal approve/reject UI 路径落地；仍不构成统一助手右侧工作台/完整 multi-engine runtime E2E 证据。
  残留三百五十六轮：tip 上 298 项 focused evidence suite（含 residual 250–355 Host proposal UI 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百五十七轮：薄 Host Proposal 工作台面板落地；仍不构成完整右侧工作台切换/完整 multi-engine runtime E2E 证据。
  残留三百五十八轮：tip 上 301 项 focused evidence suite（含 residual 250–357 Host proposal panel 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百五十九轮：Host Proposal revise-before-approve 落地；仍不构成完整右侧工作台切换/完整 multi-engine runtime E2E 证据。
  残留三百六十轮：tip 上 306 项 focused evidence suite（含 residual 250–359 Host proposal revise 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百六十一轮：knowledge Host Proposal 路径/正文修订落地；仍不构成完整右侧工作台切换/完整 multi-engine runtime E2E 证据。
  残留三百六十二轮：tip 上 307 项 focused evidence suite（含 residual 250–361 knowledge Host patch 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百六十三轮：Host knowledge patch → note executor 映射落地；仍不构成完整右侧工作台切换/完整 multi-engine runtime E2E 证据。
  残留三百六十四轮：tip 上 308 项 focused evidence suite（含 residual 250–363 Host knowledge executor patch 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百六十五轮：Host goal title patch → create_goal executor 映射落地；仍不构成完整右侧工作台切换/完整 multi-engine runtime E2E 证据。
  残留三百六十六轮：tip 上 310 项 focused evidence suite（含 residual 250–365 Host goal executor patch 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百六十七轮：goal Host Proposal description 修订 UI 落地；仍不构成完整右侧工作台切换/完整 multi-engine runtime E2E 证据。
  残留三百六十八轮：tip 上 311 项 focused evidence suite（含 residual 250–367 goal Host description 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百六十九轮：open-chat Host 引擎 profile 选择落地；仍不构成真实 Pi SDK/CLI 进程适配与完整 multi-engine runtime E2E 证据。
  残留三百七十轮：tip 上 312 项 focused evidence suite（含 residual 250–369 Host engine profile 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百七十一轮：Host Proposal 右侧工作台激活落地；仍不构成完整统一助手右侧工作台切换/完整 multi-engine runtime E2E 证据。
  残留三百七十二轮：tip 上 312 项 focused evidence suite（含 residual 250–371 Host workbench activation 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百七十三轮：Pi/CLI process adapter fail-closed spike 落地；仍不构成真实 Pi spawn 产品路径/完整 multi-engine runtime E2E 证据。
  残留三百七十四轮：tip 上 322 项 focused evidence suite（含 residual 250–373 Pi process adapter 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百七十五轮：生产 multi-engine Host journey 落地；仍不构成跨端 Playwright/Electron 全量 multi-engine E2E/真实 Pi spawn 证据。
  残留三百七十六轮：tip 上 327 项 focused evidence suite（含 residual 250–375 production multi-engine journey 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百七十七轮：multi-profile Host transport journey 落地；仍不构成跨端 Playwright/Electron 全量 multi-engine E2E/真实 Pi spawn 证据。
  残留三百七十八轮：tip 上 331 项 focused evidence suite（含 residual 250–377 multi-profile Host transport 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百七十九轮：Host execution receipt 工作台落地；仍不构成 Conversation 时间线 Artifact 回放/完整 multi-engine runtime E2E 证据。
  残留三百八十轮：tip 上 335 项 focused evidence suite（含 residual 250–379 Host execution receipt 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百八十一轮：Host 工作台 AgentRun 历史重开落地；仍不构成消息时间线 Artifact 卡片/完整 multi-engine runtime E2E 证据。
  残留三百八十二轮：tip 上 339 项 focused evidence suite（含 residual 250–381 Host workbench reopen 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百八十三轮：Host 时间线 Artifact 卡片落地；仍不构成 Artifact 富内容编辑回放/完整 multi-engine runtime E2E 证据。
  残留三百八十四轮：tip 上 342 项 focused evidence suite（含 residual 250–383 Host timeline Artifact 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百八十五轮：Host 执行报告富回放落地；仍不构成真实 Pi spawn/完整 multi-engine runtime E2E 证据。
  残留三百八十六轮：tip 上 345 项 focused evidence suite（含 residual 250–385 Host receipt rich replay 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百八十七轮：Host 时间线聚焦工作台行落地；仍不构成真实 Pi spawn/完整 multi-engine runtime E2E 证据。
  残留三百八十八轮：tip 上 348 项 focused evidence suite（含 residual 250–387 Host timeline focus 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百八十九轮：Host 工作台文档对齐与 composition journey 落地；仍不构成真实 Pi spawn/完整 multi-engine runtime E2E 证据。
  残留三百九十轮：tip 上 351 项 focused evidence suite（含 residual 250–389 Host workbench docs/composition 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百九十一轮：Pi process spike dry-run plan 与生产路由隔离落地；仍不构成真实 Pi spawn/完整 multi-engine runtime E2E 证据。
  残留三百九十二轮：tip 上 353 项 focused evidence suite（含 residual 250–391 Pi process dry-run plan 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百九十三轮：Host open-chat stop → cancel_run 落地；仍不构成跨端 Playwright/Electron multi-engine E2E/真实 Pi spawn 证据。
  残留三百九十四轮：tip 上 357 项 focused evidence suite（含 residual 250–393 Host open-chat cancel_run 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百九十五轮：Host mid-turn cancel_run 生产 journey 落地；仍不构成跨端 Playwright/Electron multi-engine E2E/真实 Pi spawn 证据。
  残留三百九十六轮：tip 上 358 项 focused evidence suite（含 residual 250–395 Host mid-turn cancel_run 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百九十七轮：Host Proposal 自由拒绝原因落地；仍不构成跨端 multi-engine E2E/真实 Pi spawn 证据。
  残留三百九十八轮：tip 上 361 项 focused evidence suite（含 residual 250–397 Host freeform reject reason 锁）通过；仍不构成全量 PR 门禁证据。
  残留三百九十九轮：Host 时间线 multi-engine badge 落地；仍不构成跨端 multi-engine E2E/真实 Pi spawn 证据。
  残留四百轮：tip 上 365 项 focused evidence suite（含 residual 250–399 Host timeline multi-engine badge 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百零一轮：open-chat Host 时间线 Artifact 落地；仍不构成跨端 multi-engine E2E/真实 Pi spawn 证据。
  残留四百零二轮：tip 上 368 项 focused evidence suite（含 residual 250–401 open-chat Host timeline Artifact 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百零三轮：open-chat Host 回合徽章会话记忆落地；仍不构成跨端 multi-engine E2E/真实 Pi spawn 证据。
  残留四百零四轮：tip 上 372 项 focused evidence suite（含 residual 250–403 open-chat Host turn session memory 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百零五轮：跨端 multi-engine Host 产品 E2E scaffold 落地；仍不构成 Playwright/Electron 全量 product E2E/真实 Pi spawn 证据。
  残留四百零六轮：tip 上 378 项 focused evidence suite（含 residual 250–405 cross-end multi-engine product E2E scaffold 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百零七轮：跨端 multi-engine Host 产品 unit driver 落地；仍不构成 Playwright/Electron 全量 product E2E/真实 Pi spawn 证据。
  残留四百零八轮：tip 上 383 项 focused evidence suite（含 residual 250–407 cross-end multi-engine product unit driver 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百零九轮：Host 时间线 open_chat vs AgentRun surface isolation 落地；仍不构成跨端 multi-engine E2E/真实 Pi spawn 证据。
  残留四百一十轮：tip 上 387 项 focused evidence suite（含 residual 250–409 Host timeline surface isolation 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百一十一轮：Host 工作台时间线 composition 落地；仍不构成跨端 multi-engine E2E/真实 Pi spawn 证据。
  残留四百一十二轮：tip 上 390 项 focused evidence suite（含 residual 250–411 Host workbench timeline composition 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百一十三轮：Host 工作台 LangGraph UI 泄漏边界落地；仍不构成跨端 multi-engine E2E/真实 Pi spawn 证据。
  残留四百一十四轮：tip 上 397 项 focused evidence suite（含 residual 250–413 Host LangGraph UI leakage boundary 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百一十五轮：Goal/Knowledge workflow 诊断展示脱敏落地；仍不构成跨端 multi-engine E2E/真实 Pi spawn 证据。
  残留四百一十六轮：tip 上 409 项 focused evidence suite（含 residual 250–415 Goal workflow diagnostic sanitization 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百一十七轮：跨端 multi-engine scaffold/driver 16 步扩展落地；仍不构成 Playwright/Electron 全量 product E2E 证据。
  残留四百一十八轮：tip 上 410 项 focused evidence suite（含 residual 250–417 cross-end 16-step scaffold/driver 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百一十九轮：Host task.create lane 基础落地；仍不构成 Task 域 executor/完整 Task 工作台证据。
  残留四百二十轮：tip 上 414 项 focused evidence suite（含 residual 250–419 Host task.create lane 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百二十一轮：Goal diagnosticWorkflowStepTiming i18n + scaffold/driver 17-step（task.create lane unit）落地；仍不构成 Task 域 executor/Playwright 全量 E2E 证据。
  残留四百二十二轮：tip 上 415 项 focused evidence suite（含 residual 250–421 diagnosticWorkflowStepTiming + task.create unit 步锁）通过；仍不构成全量 PR 门禁证据。
  残留四百二十三轮：Host task.create live lane + domain executor 基础落地；仍不构成完整 Task 工作台/AgentType task.create 证据。
  残留四百二十四轮：tip 上 418 项 focused evidence suite（含 residual 250–423 Host task.create live lane 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百二十五轮：Host task.create client settle + createTemplate receipt 落地；仍不构成 AgentType task.create/完整 Task 工作台证据。
  残留四百二十六轮：tip 上 421 项 focused evidence suite（含 residual 250–425 Host task.create client settle/receipt 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百二十七轮：Host AgentType task.create 基础 + taskAgentRun 落地；仍不构成完整 Task Agent 工作流/E2E 证据。
  残留四百二十八轮：tip 上 423 项 focused evidence suite（含 residual 250–427 Host AgentType task.create + taskAgentRun 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百二十九轮：task.create 产品 toolMode/Welcome/Footer 落地；仍不构成完整 Task Agent 工作流/E2E 证据。
  残留四百三十轮：tip 上 424 项 focused evidence suite（含 residual 250–429 Host task.create 产品 toolMode 入口锁）通过；仍不构成全量 PR 门禁证据。
  残留四百三十一轮：task.create 产品 start 基础落地；仍不构成完整 Task LangGraph 工作流/E2E 证据。
  残留四百三十二轮：tip 上 425 项 focused evidence suite（含 residual 250–431 Host task.create 产品 start 基础锁）通过；仍不构成全量 PR 门禁证据。
  残留四百三十三轮：task.create restore/linked goal 落地；仍不构成完整 Task LangGraph 工作流/E2E 证据。
  残留四百三十四轮：tip 上 426 项 focused evidence suite（含 residual 250–433 Host task.create restore/linked goal 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百三十五轮：task.create 进程内 run store 落地；仍不构成跨进程 durable/LangGraph 全量证据。
  残留四百三十六轮：tip 上 433 项 focused evidence suite（含 residual 250–435 Host task.create process-local store 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百三十七轮：task.create 进程内 cancel/complete resume 落地；仍不构成跨进程 durable/LangGraph 全量证据。
  残留四百三十八轮：tip 上 439 项 focused evidence suite（含 residual 250–437 Host task.create process-local cancel/complete resume 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百三十九轮：task.create 进程内 edit revise + 幂等 terminal 落地；仍不构成跨进程 durable/LangGraph 全量证据。
  残留四百四十轮：tip 上 443 项 focused evidence suite（含 residual 250–439 Host task.create process-local edit revise 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百四十一轮：AgentRun 历史 reopen 聚焦 + task 标题回收落地；仍不构成跨端 Playwright/Electron multi-engine E2E 证据。
  残留四百四十二轮：tip 上 446 项 focused evidence suite（含 residual 250–441 Host AgentRun history reopen focus 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百四十三轮：会话 restore Host 工作台聚焦落地；仍不构成跨端 Playwright/Electron multi-engine E2E 证据。
  残留四百四十四轮：tip 上 449 项 focused evidence suite（含 residual 250–443 Host conversation restore workbench focus 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百四十五轮：linked goal restore + client settlement 会话隔离落地；仍不构成跨端 Playwright/Electron multi-engine E2E 证据。
  残留四百四十六轮：tip 上 452 项 focused evidence suite（含 residual 250–445 Host linked goal restore + settlement isolation 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百四十七轮：§13.2 证据指针刷新 + process-local store 容量边界落地；仍不构成全量 PR 门禁/跨端 multi-engine E2E 证据。
  残留四百四十八轮：tip 上 455 项 focused evidence suite（含 residual 250–447 Host store bound + §13.2 指针锁）通过；仍不构成全量 PR 门禁证据。
  残留四百四十九轮：task.create process-local product journey 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留四百五十轮：tip 上 460 项 focused evidence suite（含 residual 250–449 Host process-local product journey 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百五十一轮：process-local runId 身份绑定 fail-closed 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留四百五十二轮：tip 上 464 项 focused evidence suite（含 residual 250–451 Host runId 身份绑定锁）通过；仍不构成全量 PR 门禁证据。
  残留四百五十三轮：confirm client settlement fail-closed 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留四百五十四轮：tip 上 468 项 focused evidence suite（含 residual 250–453 Host confirm client settlement 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百五十五轮：edit non-empty title fail-closed 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留四百五十六轮：tip 上 472 项 focused evidence suite（含 residual 250–455 Host edit non-empty title 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百五十七轮：conversation/thread runId 绑定 + activeOnly 会话隔离落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留四百五十八轮：tip 上 478 项 focused evidence suite（含 residual 250–457 Host conversation/thread runId 绑定锁）通过；仍不构成全量 PR 门禁证据。
  残留四百五十九轮：dirty approve process-local revise-before-settle 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留四百六十轮：tip 上 481 项 focused evidence suite（含 residual 250–459 Host dirty approve revise-before-settle 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百六十一轮：start conversationId 会话绑定 fail-closed 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留四百六十二轮：tip 上 484 项 focused evidence suite（含 residual 250–461 Host start conversationId 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百六十三轮：confirm settlement title 可回收 fail-closed 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留四百六十四轮：tip 上 488 项 focused evidence suite（含 residual 250–463 Host confirm settlement title 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百六十五轮：confirm settlement template entity id 可回收 fail-closed 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留四百六十六轮：tip 上 492 项 focused evidence suite（含 residual 250–465 Host confirm settlement template id 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百六十七轮：confirm settlement goalId 禁重绑 fail-closed 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留四百六十八轮：tip 上 496 项 focused evidence suite（含 residual 250–467 Host confirm goalId no-rebind 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百六十九轮：confirm settlement title 禁重绑 fail-closed 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留四百七十轮：tip 上 500 项 focused evidence suite（含 residual 250–469 Host confirm title no-rebind 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百七十一轮：confirm process-local draft only + single executed fail-closed 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留四百七十二轮：tip 上 505 项 focused evidence suite（含 residual 250–471 Host confirm process-local draft only 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百七十三轮：edit 单 approvedAction fail-closed 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留四百七十四轮：tip 上 509 项 focused evidence suite（含 residual 250–473 Host edit single approvedAction 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百七十五轮：confirm waiting_approval-only fail-closed 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留四百七十六轮：tip 上 513 项 focused evidence suite（含 residual 250–475 Host confirm waiting_approval-only 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百七十七轮：cancel waiting_approval-only fail-closed 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留四百七十八轮：tip 上 517 项 focused evidence suite（含 residual 250–477 Host cancel waiting_approval-only 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百七十九轮：start 非空 title fail-closed（禁静默默认）落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留四百八十轮：tip 上 520 项 focused evidence suite（含 residual 250–479 Host start non-empty title 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百八十一轮：edit waiting_approval-only fail-closed 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留四百八十二轮：tip 上 524 项 focused evidence suite（含 residual 250–481 Host edit waiting_approval-only 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百八十三轮：start conversationId builder fail-closed 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留四百八十四轮：tip 上 526 项 focused evidence suite（含 residual 250–483 Host start conversationId builder 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百八十五轮：start threadId builder fail-closed 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留四百八十六轮：tip 上 530 项 focused evidence suite（含 residual 250–485 Host start threadId builder 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百八十七轮：task DAG *ViewModel 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留四百八十八轮：tip 上 532 项 focused evidence suite（含 residual 250–487 task DAG *ViewModel 双轨收口锁）通过；仍不构成全量 PR 门禁证据。
  残留四百八十九轮：client complete waiting_approval-only fail-closed 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留四百九十轮：tip 上 533 项 focused evidence suite（含 residual 250–489 Host client complete waiting_approval-only 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百九十一轮：edit/confirm tool+empty-action 命名常量 fail-closed 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留四百九十二轮：tip 上 536 项 focused evidence suite（含 residual 250–491 Host edit/confirm tool named-constant 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百九十三轮：start identityId builder fail-closed 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留四百九十四轮：tip 上 540 项 focused evidence suite（含 residual 250–493 Host start identityId fail-closed 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百九十五轮：resume agentType/unsupported-decision + store agentType fail-closed 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留四百九十六轮：tip 上 543 项 focused evidence suite（含 residual 250–495 Host resume/store agentType fail-closed 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百九十七轮：start runId builder fail-closed 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留四百九十八轮：tip 上 547 项 focused evidence suite（含 residual 250–497 Host start runId fail-closed 锁）通过；仍不构成全量 PR 门禁证据。
  残留四百九十九轮：start agentType builder fail-closed 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百轮：tip 上 550 项 focused evidence suite（含 residual 250–499 Host start agentType fail-closed 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百零一轮：client complete settlement draft create_task_template-only 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百零二轮：tip 上 551 项 focused evidence suite（含 residual 250–501 client complete draft tool 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百零三轮：process-local store identity trim match 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百零四轮：tip 上 556 项 focused evidence suite（含 residual 250–503 store identity trim match 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百零五轮：process-local store runId trim lookup 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百零六轮：tip 上 561 项 focused evidence suite（含 residual 250–505 store runId trim lookup 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百零七轮：client revise draft create_task_template-only 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百零八轮：tip 上 562 项 focused evidence suite（含 residual 250–507 client revise draft tool 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百零九轮：process-local store conversationId trim match 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百一十轮：tip 上 567 项 focused evidence suite（含 residual 250–509 store conversationId trim match 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百一十一轮：process-local store threadId trim match 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百一十二轮：tip 上 572 项 focused evidence suite（含 residual 250–511 store threadId trim match 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百一十三轮：process-local store conversationId upsert normalize 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百一十四轮：tip 上 577 项 focused evidence suite（含 residual 250–513 store conversation upsert normalize 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百一十五轮：process-local store identityId upsert normalize 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百一十六轮：tip 上 581 项 focused evidence suite（含 residual 250–515 store identity upsert normalize 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百一十七轮：listRuns remote ownership trim match 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百一十八轮：tip 上 583 项 focused evidence suite（含 residual 250–517 listRuns remote ownership trim 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百一十九轮：client task draft title/goalId create_task_template-only 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百二十轮：tip 上 586 项 focused evidence suite（含 residual 250–519 client draft tool gate 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百二十一轮：client knowledge draft path/markdown create_knowledge_note-only 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百二十二轮：tip 上 589 项 focused evidence suite（含 residual 250–521 knowledge draft tool gate 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百二十三轮：client goal draft title/description create_goal-only 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百二十四轮：tip 上 592 项 focused evidence suite（含 residual 250–523 goal draft tool gate 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百二十五轮：client workbench summary product-lane rationale 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百二十六轮：tip 上 597 项 focused evidence suite（含 residual 250–525 summary product-lane 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百二十七轮：client workbench pendingActionCount product-lane 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百二十八轮：tip 上 602 项 focused evidence suite（含 residual 250–527 pendingActionCount product-lane 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百二十九轮：client receipt primaryEntityId product-lane 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百三十轮：tip 上 607 项 focused evidence suite（含 residual 250–529 primaryEntityId product-lane 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百三十一轮：client knowledge draft title create_knowledge_note-only 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百三十二轮：tip 上 611 项 focused evidence suite（含 residual 250–531 knowledge title tool gate 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百三十三轮：client receipt cross-lane foreign tool exclusion 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百三十四轮：tip 上 615 项 focused evidence suite（含 residual 250–533 receipt cross-lane exclusion 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百三十五轮：client receipt summary same-lane failed message 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百三十六轮：tip 上 619 项 focused evidence suite（含 residual 250–535 receipt same-lane failed message 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百三十七轮：client receipt ok product-lane executed 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百三十八轮：tip 上 624 项 focused evidence suite（含 residual 250–537 receipt ok product-lane 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百三十九轮：stage-6 editor dual-track / portable boundary 再锁落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留五百四十轮：tip 上 627 项 focused evidence suite（含 residual 250–539 stage-6 portable boundary 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百四十一轮：§13.2 证据审计刷新 + Host edit draftAction 锁；tip suite 仍 627（本轮无 suite re-run）；仍不构成全量 PR 门禁证据。
  残留五百四十二轮：tip 上 628 项 focused evidence suite（含 residual 250–541 Host edit draftAction 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百四十三轮：Host confirm settlementAction 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百四十四轮：tip 上 629 项 focused evidence suite（含 residual 250–543 Host confirm settlementAction 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百四十五轮：Host confirm store draftAction 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百四十六轮：tip 上 632 项 focused evidence suite（含 residual 250–545 Host confirm store draftAction 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百四十七轮：Client complete/revise sole draftAction 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百四十八轮：tip 上 633 项 focused evidence suite（含 residual 250–547 Client sole draftAction 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百四十九轮：Client workbench soleProductDraftAction 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百五十轮：tip 上 637 项 focused evidence suite（含 residual 250–549 soleProductDraftAction 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百五十一轮：Client applyHost*Patch sole product draftAction 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百五十二轮：tip 上 642 项 focused evidence suite（含 residual 250–551 applyHost*Patch sole product draft 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百五十三轮：Host confirm store draft resolve sole create_task_template 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百五十四轮：tip 上 644 项 focused evidence suite（含 residual 250–553 store draft resolve sole product 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百五十五轮：Client knowledge.write confirm sole create_knowledge_note 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百五十六轮：tip 上 645 项 focused evidence suite（含 residual 250–555 knowledge confirm sole create_knowledge_note 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百五十七轮：Client goal.create confirm sole create_goal 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百五十八轮：tip 上 646 项 focused evidence suite（含 residual 250–557 goal confirm sole create_goal 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百五十九轮：Client goal confirm/cancel + knowledge confirm waiting_approval-only 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百六十轮：tip 上 647 项 focused evidence suite（含 residual 250–559 waiting_approval-only 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百六十一轮：Host panel goal/knowledge approve pre-lifecycle product gate 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百六十二轮：tip 上 651 项 focused evidence suite（含 residual 250–561 Host approve pre-lifecycle product gate 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百六十三轮：Host panel task.create approve pre-lifecycle sole create_task_template 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百六十四轮：tip 上 653 项 focused evidence suite（含 residual 250–563 task Host approve pre-lifecycle product gate 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百六十五轮：Host panel product reject pre-lifecycle waiting_approval 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百六十六轮：tip 上 655 项 focused evidence suite（含 residual 250–565 Host reject pre-lifecycle waiting_approval 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百六十七轮：Host panel product revise pre-lifecycle waiting_approval 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百六十八轮：tip 上 657 项 focused evidence suite（含 residual 250–567 Host revise pre-lifecycle waiting_approval 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百六十九轮：Host panel shared product ownership resolver 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百七十轮：tip 上 660 项 focused evidence suite（含 residual 250–569 Host ownership resolver 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百七十一轮：Host panel settlement reuses shared ownership resolver 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百七十二轮：tip 上 661 项 focused evidence suite（含 residual 250–571 Host settlement ownership 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百七十三轮：Host panel revise sole product draftAction gate 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百七十四轮：tip 上 663 项 focused evidence suite（含 residual 250–573 Host revise sole product 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百七十五轮：goal session primary-task confirm sole create_task_template 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百七十六轮：tip 上 664 项 focused evidence suite（含 residual 250–575 primary-task sole product 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百七十七轮：Host panel primary-task-shaped ownership → create_task_template 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百七十八轮：tip 上 666 项 focused evidence suite（含 residual 250–577 primary-task ownership 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百七十九轮：Host panel primary-task-shaped settlement via goal session 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百八十轮：tip 上 667 项 focused evidence suite（含 residual 250–579 primary-task settlement 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百八十一轮：Host panel settlement ownership classifiers 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百八十二轮：tip 上 669 项 focused evidence suite（含 residual 250–581 settlement classifiers 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百八十三轮：goal session primary-task confirm 转发 Host-revised goalId 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百八十四轮：tip 上 670 项 focused evidence suite（含 residual 250–583 primary-task goalId forward 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百八十五轮：Host workbench primary-task exclusive kind routing 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百八十六轮：tip 上 674 项 focused evidence suite（含 residual 250–585 primary-task exclusive kind 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百八十七轮：goal session Host lifecycle kind primary-task → task.create 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百八十八轮：tip 上 675 项 focused evidence suite（含 residual 250–587 Host lifecycle kind 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百八十九轮：dual-mirror primary-task goal session settle into exclusive task lane 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百九十轮：tip 上 679 项 focused evidence suite（含 residual 250–589 dual-mirror settle 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百九十一轮：dual-mirror process-local task.create 优先于 goal overwrite 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百九十二轮：tip 上 681 项 focused evidence suite（含 residual 250–591 process-local dual-mirror first 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百九十三轮：session restore dual-mirror exclusive task before focus 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百九十四轮：tip 上 683 项 focused evidence suite（含 residual 250–593 session dual-mirror focus 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百九十五轮：live exclusive dual-mirror before builders 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百九十六轮：tip 上 685 项 focused evidence suite（含 residual 250–595 live dual-mirror builders 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百九十七轮：Host panel ownership dual-mirror exclusive before match 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留五百九十八轮：tip 上 688 项 focused evidence suite（含 residual 250–597 ownership dual-mirror exclusive 锁）通过；仍不构成全量 PR 门禁证据。
  残留五百九十九轮：drop dual-mirror primary-task ghost beside normal goal 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留六百轮：tip 上 690 项 focused evidence suite（含 residual 250–599 dual-mirror ghost drop 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百零一轮：knowledge ghost drop + focus exclusive-only 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留六百零二轮：tip 上 692 项 focused evidence suite（含 residual 250–601 knowledge ghost + focus exclusive 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百零三轮：knowledge classifier + AgentRun history session focus 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留六百零四轮：tip 上 694 项 focused evidence suite（含 residual 250–603 knowledge classifier + history session focus 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百零五轮：knowledge process-local edit revise via classifier 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留六百零六轮：tip 上 695 项 focused evidence suite（含 residual 250–605 knowledge process-local edit revise 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百零七轮：goal-session process-local edit revise via classifier 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留六百零八轮：tip 上 696 项 focused evidence suite（含 residual 250–607 goal-session process-local edit revise 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百零九轮：dirty approve process-local revise before goal/knowledge confirm 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留六百一十轮：tip 上 699 项 focused evidence suite（含 residual 250–609 dirty approve process-local revise before confirm 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百一十一轮：default Host workbench focus prefers exclusive session 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留六百一十二轮：tip 上 702 项 focused evidence suite（含 residual 250–611 exclusive default Host workbench focus 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百一十三轮：Host proposal/receipt exclusive session order 落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 跨进程 durable 证据。
  残留六百一十四轮：tip 上 705 项 focused evidence suite（含 residual 250–613 exclusive Host proposal/receipt order 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百一十五轮：contracts ActionResult 双轨死表面删除落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百一十六轮：tip 上 708 项 focused evidence suite（含 residual 250–615 ActionResult dual-track retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百一十七轮：Result ADR 文档双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百一十八轮：tip 上 710 项 focused evidence suite（含 residual 250–617 Result ADR alignment 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百一十九轮：ADR-021/022 contracts/response 死引用收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百二十轮：tip 上 711 项 focused evidence suite（含 residual 250–619 ADR route response package retirement 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百二十一轮：API POST /logs Result 信封收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百二十二轮：tip 上 716 项 focused evidence suite（含 residual 250–621 POST /logs Result envelope 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百二十三轮：API GET /metrics/json Result 信封收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百二十四轮：tip 上 720 项 focused evidence suite（含 residual 250–623 /metrics/json Result envelope 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百二十五轮：API GET /info Result 信封收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百二十六轮：tip 上 724 项 focused evidence suite（含 residual 250–625 GET /info Result envelope 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百二十七轮：API 全局错误中间件 Result 信封收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百二十八轮：tip 上 730 项 focused evidence suite（含 residual 250–627 error middleware Result envelope 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百二十九轮：API PowerSync GET /schema Result 信封收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百三十轮：tip 上 735 项 focused evidence suite（含 residual 250–629 PowerSync /schema Result envelope 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百三十一轮：schedule 操作响应双轨 DTO 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百三十二轮：tip 上 737 项 focused evidence suite（含 residual 250–631 schedule operation dual DTO retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百三十三轮：SettingOperationRes 双轨信封收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百三十四轮：tip 上 739 项 focused evidence suite（含 residual 250–633 SettingOperationRes dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百三十五轮：reminder 操作响应双轨信封收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百三十六轮：tip 上 741 项 focused evidence suite（含 residual 250–635 reminder operation dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百三十七轮：AuthOperationResult 双轨信封收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百三十八轮：tip 上 745 项 focused evidence suite（含 residual 250–637 AuthOperationResult dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百三十九轮：BatchOperationResponseDTO 双名收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百四十轮：tip 上 747 项 focused evidence suite（含 residual 250–639 BatchOperationResponseDTO dual name retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百四十一轮：shared/dtos 死表面清零落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百四十二轮：tip 上 749 项 focused evidence suite（含 residual 250–641 shared/dtos dead dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百四十三轮：shared UI 死双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百四十四轮：tip 上 751 项 focused evidence suite（含 residual 250–643 shared UI editor dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百四十五轮：shared 配置 VO/错误 schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百四十六轮：tip 上 754 项 focused evidence suite（含 residual 250–645 shared dual config/error schema retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百四十七轮：contracts Summary 双轨死表面收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百四十八轮：tip 上 758 项 focused evidence suite（含 residual 250–647 Summary dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百四十九轮：task 依赖/子任务 Server 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百五十轮：tip 上 760 项 focused evidence suite（含 residual 250–649 task dependency/subtask server dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百五十一轮：governance RuleServerDTO 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百五十二轮：tip 上 762 项 focused evidence suite（含 residual 250–651 RuleServerDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百五十三轮：schedule Static/Dashboard 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百五十四轮：tip 上 765 项 focused evidence suite（含 residual 250–653 schedule Static/Dashboard dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百五十五轮：entities dual re-export 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百五十六轮：tip 上 767 项 focused evidence suite（含 residual 250–655 entities dual re-export retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百五十七轮：SettingOverviewDTO 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百五十八轮：tip 上 769 项 focused evidence suite（含 residual 250–657 SettingOverviewDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百五十九轮：notification 模板 VO 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百六十轮：tip 上 771 项 focused evidence suite（含 residual 250–659 notification template VO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百六十一轮：空 dual barrel re-export 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百六十二轮：tip 上 774 项 focused evidence suite（含 residual 250–661 empty dual barrel re-export retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百六十三轮：schedule list/stats ResponseDTO + detect-conflicts 包装双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百六十四轮：tip 上 776 项 focused evidence suite（含 residual 250–663 schedule list/stats + detect-conflicts dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百六十五轮：schedule batch-delete OpenAPI schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百六十六轮：tip 上 778 项 focused evidence suite（含 residual 250–665 schedule batch-delete OpenAPI schema dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百六十七轮：task bind-to-goal 请求 schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百六十八轮：tip 上 780 项 focused evidence suite（含 residual 250–667 task bind-to-goal request schema dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百六十九轮：knowledge sync 请求 params schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百七十轮：tip 上 783 项 focused evidence suite（含 residual 250–669 knowledge sync params dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百七十一轮：notification id-batch 请求 schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百七十二轮：tip 上 785 项 focused evidence suite（含 residual 250–671 notification id-batch dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百七十三轮：AI conversation name 请求 schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百七十四轮：tip 上 787 项 focused evidence suite（含 residual 250–673 AI conversation name dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百七十五轮：knowledge list projection filter schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百七十六轮：tip 上 789 项 focused evidence suite（含 residual 250–675 knowledge list projection filter dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百七十七轮：goal goalId list params schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百七十八轮：tip 上 791 项 focused evidence suite（含 residual 250–677 goal list params dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百七十九轮：schedule detect-conflicts response schema 名称双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百八十轮：tip 上 793 项 focused evidence suite（含 residual 250–679 detect-conflicts response schema name dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百八十一轮：governance OpenAPI response schema 名称双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百八十二轮：tip 上 795 项 focused evidence suite（含 residual 250–681 governance OpenAPI response schema name dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百八十三轮：AI provider create schema 名称双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百八十四轮：tip 上 797 项 focused evidence suite（含 residual 250–683 AI provider create schema name dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百八十五轮：authentication credential server 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百八十六轮：tip 上 799 项 focused evidence suite（含 residual 250–685 auth credential server dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百八十七轮：authentication base credential server 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百八十八轮：tip 上 800 项 focused evidence suite（含 residual 250–687 auth base credential server dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百八十九轮：goal list response schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百九十轮：tip 上 802 项 focused evidence suite（含 residual 250–689 goal list response dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百九十一轮：ai chat list response schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百九十二轮：tip 上 805 项 focused evidence suite（含 residual 250–691 ai chat list response dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百九十三轮：reminder list response schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百九十四轮：tip 上 808 项 focused evidence suite（含 residual 250–693 reminder list response dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百九十五轮：ai response Res schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百九十六轮：tip 上 811 项 focused evidence suite（含 residual 250–695 ai response Res dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百九十七轮：task check-expired instances response schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留六百九十八轮：tip 上 814 项 focused evidence suite（含 residual 250–697 task check-expired Res dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留六百九十九轮：repository installation response schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百轮：tip 上 817 项 focused evidence suite（含 residual 250–699 knowledge installation Res dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百零一轮：repository installation repository DTO schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百零二轮：tip 上 820 项 focused evidence suite（含 residual 250–701 installation repository DTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百零三轮：schedule query params schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百零四轮：tip 上 823 项 focused evidence suite（含 residual 250–703 schedule query params dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百零五轮：ai goal automation plan/preview schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百零六轮：tip 上 826 项 focused evidence suite（含 residual 250–705 goal automation plan dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百零七轮：schedule request schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百零八轮：tip 上 830 项 focused evidence suite（含 residual 250–707 schedule request dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百零九轮：schedule-task request schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百一十轮：tip 上 834 项 focused evidence suite（含 residual 250–709 schedule-task request dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百一十一轮：task dependency transport schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百一十二轮：tip 上 838 项 focused evidence suite（含 residual 250–711 task dependency transport dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百一十三轮：authentication session response schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百一十四轮：tip 上 841 项 focused evidence suite（含 residual 250–713 auth session response dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百一十五轮：schedule create/resolve response schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百一十六轮：tip 上 844 项 focused evidence suite（含 residual 250–715 schedule response dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百一十七轮：schedule batch response schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百一十八轮：tip 上 847 项 focused evidence suite（含 residual 250–717 schedule batch response dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百一十九轮：ai goal generation draft/preview/result schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百二十轮：tip 上 850 项 focused evidence suite（含 residual 250–719 goal generation draft dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百二十一轮：ai provider test result schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百二十二轮：tip 上 853 项 focused evidence suite（含 residual 250–721 provider test result dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百二十三轮：ai knowledge note persisted-ref schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百二十四轮：tip 上 856 项 focused evidence suite（含 residual 250–723 knowledge note persisted-ref dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百二十五轮：schedule conflict detection result schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百二十六轮：tip 上 859 项 focused evidence suite（含 residual 250–725 schedule conflict result dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百二十七轮：ai token usage schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百二十八轮：tip 上 862 项 focused evidence suite（含 residual 250–727 token usage dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百二十九轮：ai goal workflow result schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百三十轮：tip 上 865 项 focused evidence suite（含 residual 250–729 goal workflow result dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百三十一轮：governance code snippet / rule tag schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百三十二轮：tip 上 868 项 focused evidence suite（含 residual 250–731 governance snippet/tag dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百三十三轮：reminder active hours / group stats schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百三十四轮：tip 上 871 项 focused evidence suite（含 residual 250–733 reminder hours/stats dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百三十五轮：reminder trigger / notification config schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百三十六轮：tip 上 874 项 focused evidence suite（含 residual 250–735 reminder trigger/notification dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百三十七轮：goal key-result progress / snapshot schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百三十八轮：tip 上 877 项 focused evidence suite（含 residual 250–737 key-result progress/snapshot dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百三十九轮：task goal-binding / reminder-config schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百四十轮：tip 上 880 项 focused evidence suite（含 residual 250–739 task goal-binding/reminder dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百四十一轮：goal reminder-config schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百四十二轮：tip 上 883 项 focused evidence suite（含 residual 250–741 goal reminder-config dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百四十三轮：task recurrence-rule schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百四十四轮：tip 上 886 项 focused evidence suite（含 residual 250–743 task recurrence-rule dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百四十五轮：goal focus-mode schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百四十六轮：tip 上 889 项 focused evidence suite（含 residual 250–745 goal focus-mode dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百四十七轮：task time-config schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百四十八轮：tip 上 892 项 focused evidence suite（含 residual 250–747 task time-config dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百四十九轮：schedule nested VO response schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百五十轮：tip 上 896 项 focused evidence suite（含 residual 250–749 schedule nested VO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百五十一轮：TimeSlot + AIModelInfo schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百五十二轮：tip 上 902 项 focused evidence suite（含 residual 250–751 TimeSlot + AIModelInfo dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百五十三轮：goal create/update reminder-config request dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百五十四轮：tip 上 905 项 focused evidence suite（含 residual 250–753 goal reminder-config request dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百五十五轮：KnowledgeCitation schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百五十六轮：tip 上 908 项 focused evidence suite（含 residual 250–755 KnowledgeCitation dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百五十七轮：AgentCitation schema 双轨收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百五十八轮：tip 上 911 项 focused evidence suite（含 residual 250–757 AgentCitation dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百五十九轮：OAuth callback/bind payload dual 收口落地；仍不构成真实 OAuth 跨端 E2E / 全量 PR 门禁证据。
  残留七百六十轮：tip 上 914 项 focused evidence suite（含 residual 250–759 OAuth callback/bind dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百六十一轮：ReindexKnowledgeRes dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百六十二轮：tip 上 917 项 focused evidence suite（含 residual 250–761 ReindexKnowledgeRes dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百六十三轮：OAuth provider enum dual 收口落地；仍不构成真实 OAuth 跨端 E2E / 全量 PR 门禁证据。
  残留七百六十四轮：tip 上 920 项 focused evidence suite（含 residual 250–763 OAuth provider enum dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百六十五轮：OAuth response dual 收口落地；仍不构成真实 OAuth 跨端 E2E / 全量 PR 门禁证据。
  残留七百六十六轮：tip 上 923 项 focused evidence suite（含 residual 250–765 OAuth response dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百六十七轮：CheckAvailabilityRes dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百六十八轮：tip 上 926 项 focused evidence suite（含 residual 250–767 CheckAvailabilityRes dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百六十九轮：session ValidateToken/GuestMode Res dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百七十轮：tip 上 929 项 focused evidence suite（含 residual 250–769 session Res dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百七十一轮：export/import settings Res dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百七十二轮：tip 上 932 项 focused evidence suite（含 residual 250–771 settings export/import Res dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百七十三轮：ListKnowledgeRepositoryConnectionsRes dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百七十四轮：tip 上 935 项 focused evidence suite（含 residual 250–773 list knowledge connections Res dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百七十五轮：upcoming/today schedule list Res dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百七十六轮：tip 上 938 项 focused evidence suite（含 residual 250–775 reminder schedule list Res dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百七十七轮：focus statistics/pomodoro Res dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百七十八轮：tip 上 941 项 focused evidence suite（含 residual 250–777 focus statistics/pomodoro Res dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百七十九轮：QueryGoalFoldersRes dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百八十轮：tip 上 944 项 focused evidence suite（含 residual 250–779 QueryGoalFoldersRes dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百八十一轮：BatchGroupTemplatesRes dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百八十二轮：tip 上 947 项 focused evidence suite（含 residual 250–781 BatchGroupTemplatesRes dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百八十三轮：list/search/revisions Res dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百八十四轮：tip 上 950 项 focused evidence suite（含 residual 250–783 list/search/revisions Res dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百八十五轮：focus status/history Res dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百八十六轮：tip 上 952 项 focused evidence suite（含 residual 250–785 focus status/history Res dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百八十七轮：GenerateGoalAutomationRes dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百八十八轮：tip 上 954 项 focused evidence suite（含 residual 250–787 GenerateGoalAutomationRes dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百八十九轮：task instance range/op Res dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百九十轮：tip 上 956 项 focused evidence suite（含 residual 250–789 task instance range/op Res dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百九十一轮：export/import goals Res dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百九十二轮：tip 上 958 项 focused evidence suite（含 residual 250–791 export/import goals Res dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百九十三轮：local vault Res dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百九十四轮：tip 上 961 项 focused evidence suite（含 residual 250–793 local vault Res dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百九十五轮：local vault Req dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百九十六轮：tip 上 964 项 focused evidence suite（含 residual 250–795 local vault req dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百九十七轮：TaskGraphDependencyDTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留七百九十八轮：tip 上 967 项 focused evidence suite（含 residual 250–797 TaskGraphDependencyDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留七百九十九轮：BatchOperationResultDTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百轮：tip 上 970 项 focused evidence suite（含 residual 250–799 BatchOperationResultDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百零一轮：UnreadCountResponse dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百零二轮：tip 上 973 项 focused evidence suite（含 residual 250–801 UnreadCountResponse dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百零三轮：KnowledgeRepositoryConnectionClientDTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百零四轮：tip 上 976 项 focused evidence suite（含 residual 250–803 KnowledgeRepositoryConnectionClientDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百零五轮：ProgressBreakdown dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百零六轮：tip 上 979 项 focused evidence suite（含 residual 250–805 ProgressBreakdown dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百零七轮：MessageClientDTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百零八轮：tip 上 982 项 focused evidence suite（含 residual 250–807 MessageClientDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百零九轮：AIConversationClientDTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百一十轮：tip 上 985 项 focused evidence suite（含 residual 250–809 AIConversationClientDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百一十一轮：AIProviderConfigClientDTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百一十二轮：tip 上 988 项 focused evidence suite（含 residual 250–811 AIProviderConfigClientDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百一十三轮：FocusSessionClientDTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百一十四轮：tip 上 991 项 focused evidence suite（含 residual 250–813 FocusSessionClientDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百一十五轮：GoalRecordClientDTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百一十六轮：tip 上 994 项 focused evidence suite（含 residual 250–815 GoalRecordClientDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百一十七轮：KeyResult/GoalReview ClientDTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百一十八轮：tip 上 997 项 focused evidence suite（含 residual 250–817 KeyResult/GoalReview ClientDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百一十九轮：Goal/GoalFolder ClientDTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百二十轮：tip 上 1000 项 focused evidence suite（含 residual 250–819 Goal/GoalFolder ClientDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百二十一轮：Rule/RuleRevision ClientDTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百二十二轮：tip 上 1003 项 focused evidence suite（含 residual 250–821 Rule/RuleRevision ClientDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百二十三轮：UserSettingClientDTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百二十四轮：tip 上 1006 项 focused evidence suite（含 residual 250–823 UserSettingClientDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百二十五轮：AccountClientDTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百二十六轮：tip 上 1009 项 focused evidence suite（含 residual 250–825 AccountClientDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百二十七轮：ReminderGroup/History ClientDTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百二十八轮：tip 上 1012 项 focused evidence suite（含 residual 250–827 ReminderGroup/History ClientDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百二十九轮：NotificationPreference/CalendarEntry/UserReminderPreferences ClientDTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百三十轮：tip 上 1015 项 focused evidence suite（含 residual 250–829 Preference/Calendar ClientDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百三十一轮：TaskDependency/TaskInstance/ScheduleTask ClientDTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百三十二轮：tip 上 1018 项 focused evidence suite（含 residual 250–831 Task/Schedule ClientDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百三十三轮：ActiveTime/ReminderTemplate/ScheduleExecution dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百三十四轮：tip 上 1021 项 focused evidence suite（含 residual 250–833 ActiveTime/Template/Execution dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百三十五轮：ReminderTemplate request ActiveTime dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百三十六轮：tip 上 1024 项 focused evidence suite（含 residual 250–835 request ActiveTime dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百三十七轮：TaskFolder/TaskTemplateHistory ClientDTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百三十八轮：tip 上 1027 项 focused evidence suite（含 residual 250–837 TaskFolder/History ClientDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百三十九轮：NotificationTemplate ClientDTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百四十轮：tip 上 1030 项 focused evidence suite（含 residual 250–839 NotificationTemplate ClientDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百四十一轮：SubtaskClientDTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百四十二轮：tip 上 1033 项 focused evidence suite（含 residual 250–841 SubtaskClientDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百四十三轮：TaskFolder/History ServerDTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百四十四轮：tip 上 1036 项 focused evidence suite（含 residual 250–843 TaskFolder/History ServerDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百四十五轮：NotificationTemplate ServerDTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百四十六轮：tip 上 1039 项 focused evidence suite（含 residual 250–845 NotificationTemplate ServerDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百四十七轮：DeviceInfoDTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百四十八轮：tip 上 1042 项 focused evidence suite（含 residual 250–847 DeviceInfoDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百四十九轮：ChannelResponse/Error/RateLimit DTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百五十轮：tip 上 1045 项 focused evidence suite（含 residual 250–849 channel VO DTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百五十一轮：CategoryPreference/Action/DND/Metadata DTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百五十二轮：tip 上 1048 项 focused evidence suite（含 residual 250–851 preference VO DTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百五十三轮：GoalMetadata/AccountSettings/ChecklistItemDefinition DTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百五十四轮：tip 上 1051 项 focused evidence suite（含 residual 250–853 exact VO DTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百五十五轮：HashedPassword/Email/Phone/PlainPassword DTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百五十六轮：tip 上 1054 项 focused evidence suite（含 residual 250–855 auth secret VO DTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百五十七轮：FrequencyAdjustment/ResponseMetrics DTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百五十八轮：tip 上 1057 项 focused evidence suite（含 residual 250–857 reminder metrics VO DTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百五十九轮：DomainDate≠TransferDate dual keep-boundary surface 锁落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百六十轮：tip 上 1060 项 focused evidence suite（含 residual 250–859 DomainDate dual keep-boundary 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百六十一轮：ReminderResponse/NotificationChannel subset dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百六十二轮：tip 上 1063 项 focused evidence suite（含 residual 250–861 subset Client/Server dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百六十三轮：NotificationClientDTO dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百六十四轮：tip 上 1066 项 focused evidence suite（含 residual 250–863 NotificationClientDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百六十五轮：AuthStatusDTO 死 dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百六十六轮：tip 上 1069 项 focused evidence suite（含 residual 250–865 AuthStatusDTO dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百六十七轮：LoginResponse 死 dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百六十八轮：tip 上 1072 项 focused evidence suite（含 residual 250–867 LoginResponse dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  残留八百六十九轮：DesktopLoginRequest dual 收口落地；仍不构成跨端 Playwright/Electron multi-engine E2E / 全量 PR 门禁证据。
  残留八百七十轮：tip 上 1075 项 focused evidence suite（含 residual 250–869 DesktopLoginRequest dual retired 锁）通过；仍不构成全量 PR 门禁证据。
  仍缺：全量 lint/typecheck/test/E2E/governance 作为 PR 门禁一揽子证据；
  真实 GitHub App fixture E2E 缺凭据（外部阻塞）。

## 14. 相关资料

- [ADR-034: 本地 Obsidian Vault 与可选 GitHub 知识仓库](../../architecture/adr/ADR-034-obsidian-vault-repository.md)
- [ADR-035: 统一助手与可插拔 Agent Host](../../architecture/adr/ADR-035-unified-assistant-agent-host.md)
- [统一助手与可插拔 Agent Host 实施方案](./2026-07-17-unified-assistant-agent-host.md)
- [资源库模块说明](../../product/modules/repository.md)
- [编辑器模块说明](../../product/modules/editor.md)
- [认证模块说明](../../product/modules/authentication.md)
- [GitHub App 与 OAuth App 的区别](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps)
- [Create a repository for the authenticated user](https://docs.github.com/en/rest/repos/repos#create-a-repository-for-the-authenticated-user)
- [Obsidian URI](https://obsidian.md/help/uri)
- [How Obsidian stores data](https://obsidian.md/help/data-storage)
