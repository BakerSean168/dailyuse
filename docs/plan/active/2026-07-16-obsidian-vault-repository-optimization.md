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

> 审计时间 2026-07-22（残留二百四十三轮刷新证据指针）。状态标记：已证明 / 部分实现 / 外部阻塞 / 仍未实现。只有证据充分才改 checkbox。
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
  仍缺完整 multi-engine Turn Engine E2E 与跨端对抗 Playwright/Electron。
- [x] webhook、read model、附件和 RAG 可从 GitHub default branch 重建。 **（已证明）**
- [x] Web Markdown 安全测试通过，不泄露本机路径或 GitHub token。 **（已证明）**
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
