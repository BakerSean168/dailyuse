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
updated: 2026-07-21T00:00:00
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
- 阶段 6 残留：API legacy route builders 已删；客户端 legacy CRUD 硬失败；MSW/E2E knowledge-only；
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
  完成定义审计见 §13.2；prod-like `docker:local:up` 已在残留二十七轮通过（六服务 healthy）；残留三十二轮补三入口/Agent journey 证据；残留三十三至五十轮删除 Desktop DI/PowerSync/lazy-module/contracts、AI conversation/provider 双轨命名与无传输层 conversation add/status/getDefault 用例、conversation/provider-config/auth-identity/account phone 仓储死方法与 DEVICE_TRUST/2FA/API-Key/device 管理/诊断会话 IPC 空 stub、Desktop auth shell 本地 Ch 与 contracts AuthChannels 双轨、governance mapper-helpers 兼容 re-export、generateStrongPassword/updateCurrentValueByAggregation 兼容别名、Desktop auth stub/TokenData/LoginCredentials/AutoLoginResult 双轨别名与 app-vue LegacyWorkflowMode 双轨类型残留，并增强三入口/ADR-035 multi-turn journey 证据；真实 GitHub fixture E2E 仍为外部阻塞，全量 PR 门禁套件仍未宣称通过。

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

> 审计时间 2026-07-21（残留五十轮刷新证据指针）。状态标记：已证明 / 部分实现 / 外部阻塞 / 仍未实现。只有证据充分才改 checkbox。

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
  仍缺：真实跨端 Playwright/Electron 一揽子 E2E（含真实 OAuth/GitHub fixture）。
- [x] GitHub 登录与仓库授权在 UI、contract 和 token 上完全解耦。 **（已证明）**
- [x] 访客和未绑定用户不上传 Vault 内容。 **（已证明）**
- [x] Desktop 本地 Vault 在云端故障时仍可用。 **（已证明）**
- [x] GitHub App 只访问用户明确授权的 knowledge repository。 **（已证明）**
- [x] private repo 可创建/连接，连接两个非空仓库不会自动覆盖。 **（已证明）**
- [x] Desktop Git 同步具备离线恢复且不 force push。 **（已证明）**
- [x] 冲突明确暂停并保留双方内容。 **（已证明）**
- [x] Web 新建笔记产生唯一 Git commit，重复请求不重复创建。 **（已证明）**
- [x] 已有笔记编辑在首期仍关闭。 **（已证明）**
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
  仍缺：多 Turn Engine 完整 E2E、跨端对抗 Playwright E2E 与真实 fixture。
  残留四十轮：`adr-035-capability-turn-isolation.journey.spec.ts` 增加 multi-turn 二次 confirm 不重复落盘，以及 Web surface 无法满足 Desktop `local_vault` knowledge-write 要求；仍缺完整 multi-engine Turn Engine E2E 与跨端对抗性 Playwright/Electron E2E。
- [x] webhook、read model、附件和 RAG 可从 GitHub default branch 重建。 **（已证明）**
- [x] Web Markdown 安全测试通过，不泄露本机路径或 GitHub token。 **（已证明）**
- [ ] 相关 lint、typecheck、test、Web/Desktop E2E、governance 和 prod-like 验收通过。 **（部分验证 + 外部阻塞）**
  证据：本分支多轮 focused lint/typecheck/test 与 `daily-use:governance-check` 通过；Web 核心
  Playwright 集合含 knowledge note boundary 与 AI goal-workflow。残留二十七轮：prod-like
  `docker:local:up` 在当前宿主机已成功（六服务 healthy；Web 200 / API health 200），历史 Docker
  磁盘耗尽不再是阻塞。仍缺：全量 lint/typecheck/test/E2E/governance 作为 PR 门禁一揽子证据；
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
