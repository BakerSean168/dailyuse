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
updated: 2026-07-16T00:00:00
---

# Obsidian Vault 与 GitHub 知识仓库后续优化方案

## 1. 文档地位

本文执行 [ADR-034](../../architecture/adr/ADR-034-obsidian-vault-repository.md)，合并 UI 重构分析、Web 产品审查、Obsidian 官方能力、GitHub App 权限模型以及 2026-07-16 的最新产品调整。

状态：**待实施**。

当前代码仍是迁移前状态：

- 认证主流程以邮箱密码为主，OAuth binding 基础设施存在但 GitHub UI/回调尚未完成。
- Desktop 支持在线、离线和访客 profile，但 Repository 仍使用应用私有存储目录。
- `SyncRepositoryUseCase` 仍是占位，尚无 Vault Git runtime。
- Web 仍通过数据库 Repository 创建和编辑笔记。
- Markdown 预览允许原始 HTML，未建立适合真实 Vault/GitHub 内容的 sanitizer 边界。

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

用户确认后创建：

```json
{
  "name": "memory-flow-notes",
  "private": true,
  "auto_init": true,
  "has_issues": false,
  "has_projects": false,
  "has_wiki": false
}
```

仓库名已存在时不能覆盖。允许：

- 连接经验证的现有仓库。
- 使用带短后缀的新仓库名。
- 返回取消，不影响本地 Vault。

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
- token 使用 safeStorage 或仅内存缓存，过期后重新获取。
- 不把 token 写入 `.git/config`、remote URL、命令行参数或日志。
- 如果采用系统 Git，使用受控 credential helper/stdin；如果采用嵌入式 Git library，使用 credential callback。
- 具体 Git 实现先做 spike，对比系统 Git、libgit2 和 isomorphic-git 的打包、性能、凭据和冲突能力后再定。

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

附件进入受认证对象存储或由 GitHub blob 按需缓存；Web 永不获得 installation token。

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

### 9.2 暂不固化项

本方案不预先规定 Agent 上下文来自文件、设置、MCP、数据库还是当前对话，也不规定固定文件名、目录继承、提示词模板或专用的指令版本字段。具体机制应在分析 OpenDesign、pi agent 和当前代码中的 workflow、checkpoint、tool executor 与上下文组装方式后单独形成 Agent ADR/实施方案。

专项调研至少需要回答：

- Agent runtime 如何区分系统安全边界、产品规则、用户偏好和当前任务上下文。
- Desktop 本地上下文与 Web 服务端上下文如何表达、版本化和保持可解释的一致性。
- 路径提案由模型、确定性规则还是混合策略生成，冲突时如何降级。
- 用户确认作用于哪一个不可变提案，以及确认后上下文变化时是否必须重新确认。
- Agent 如何读取知识库结构而不把整个 Vault 注入上下文，并避免提示注入扩大工具权限。

## 10. Markdown 与附件

- 统一兼容 CommonMark、GFM、properties、wiki link、heading/block、embed、callout、highlight 和 comments。
- 不执行 Dataview、Tasks 查询、Excalidraw、Canvas、社区插件、Vault CSS 或脚本。
- Web 渲染默认不执行任意 HTML，并经过严格 sanitizer。
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

- GitHub 登录 OAuth flow 和 Daily Use session。
- 独立 GitHub App installation flow。
- 创建/连接 private repository、首次对账和连接状态。
- 访客升级且不移动 Vault。

### 阶段 3：Desktop Git 同步

- Git implementation spike 与选型。
- 文件去抖、批量 commit、凭据、pull/rebase/push 和离线恢复。
- Git lock、冲突和仓库生命周期 UI。
- profile 激活/销毁、网络恢复和系统唤醒接线。

### 阶段 4：服务端投影与 RAG

- webhook 验签、后台 ingestion、commit/blob 幂等。
- read model、附件、link graph、RAG 和删除传播。
- default branch 定期 reconciliation。

### 阶段 5：Web 快捷创建

- Agent 写入提案与确认 UI。
- repository 串行 commit 队列、request ID 和 HEAD 冲突重试。
- AI Web 草稿确认入库。
- Desktop pull 后可在 Obsidian 看到 Web 新建文件。

### 阶段 6：遗留收缩

- 删除数据库笔记的通用跨端编辑路径、旧同步占位和固定目录设置。
- 保留安全 Markdown 预览、关系、搜索和 RAG。
- 更新 E2E、隐私说明、数据导出和断开仓库流程。
- 不保留长期双写兼容。

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

- [ ] 账密、GitHub 和访客入口均可用。
- [ ] GitHub 登录与仓库授权在 UI、contract 和 token 上完全解耦。
- [ ] 访客和未绑定用户不上传 Vault 内容。
- [ ] Desktop 本地 Vault 在云端故障时仍可用。
- [ ] GitHub App 只访问用户明确授权的 knowledge repository。
- [ ] private repo 可创建/连接，连接两个非空仓库不会自动覆盖。
- [ ] Desktop Git 同步具备离线恢复且不 force push。
- [ ] 冲突明确暂停并保留双方内容。
- [ ] Web 新建笔记产生唯一 Git commit，重复请求不重复创建。
- [ ] 已有笔记编辑在首期仍关闭。
- [ ] AI 无固定默认目录设置，完整写入提案必须获得用户确认。
- [ ] Agent 上下文不能逃逸 Vault、执行代码、扩大授权或绕过用户确认。
- [ ] webhook、read model、附件和 RAG 可从 GitHub default branch 重建。
- [ ] Web Markdown 安全测试通过，不泄露本机路径或 GitHub token。
- [ ] 相关 lint、typecheck、test、Web/Desktop E2E、governance 和 prod-like 验收通过。

## 14. 相关资料

- [ADR-034: 本地 Obsidian Vault 与可选 GitHub 知识仓库](../../architecture/adr/ADR-034-obsidian-vault-repository.md)
- [资源库模块说明](../../product/modules/repository.md)
- [编辑器模块说明](../../product/modules/editor.md)
- [认证模块说明](../../product/modules/authentication.md)
- [GitHub App 与 OAuth App 的区别](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps)
- [Create a repository for the authenticated user](https://docs.github.com/en/rest/repos/repos#create-a-repository-for-the-authenticated-user)
- [Obsidian URI](https://obsidian.md/help/uri)
- [How Obsidian stores data](https://obsidian.md/help/data-storage)
