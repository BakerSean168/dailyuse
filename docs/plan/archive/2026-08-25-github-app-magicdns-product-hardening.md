---
tags:
  - plan
  - active
  - github
  - auth
  - repository
  - magicdns
description: MemoFlow GCP Dev MagicDNS GitHub App 身份认证、知识仓库连接与产品复审问题收敛计划
created: 2026-08-25T09:49:00+08:00
updated: 2026-08-25T10:08:00+08:00
status: superseded
---

# GitHub App + MagicDNS 产品闭环与复审问题收敛

> **Archived 2026-08-29:** the durable installation orchestration and remaining Desktop live acceptance are owned by `../archive/2026-08-28-github-installation-intent-gateway.md`. Production Web install/connect/webhook acceptance is already recorded there.

## Outcome

在 GCP Dev 的真实 MagicDNS 访问环境中，用同一个 **MemoFlow Dev Test GitHub App** 完成两条彼此隔离的能力链：

1. **身份认证**：GitHub App user authorization / OAuth 仅用于登录身份，scope 保持 `read:user user:email`，不借此获取 repository Contents 权限；
2. **知识仓库**：GitHub App installation + 短期 installation token 仅访问用户明确安装的 private repository，并为 webhook/read model/RAG 提供最小权限链。

最终要求 MagicDNS 下 GitHub 登录、App installation、private repo 选择/连接、首次对账、Desktop token/sync 和可选 webhook projection 都有真实证据，同时收敛本轮 PM 审查发现的运行时与测试资产问题。

## Current evidence — 2026-08-25

- canonical `main@c175f5bb5`；GCP local Docker Web/API/Migrator OCI revision 与 main 一致。
- MagicDNS Web：`http://gcp-dev-01.taile92a8e.ts.net:20200`；API：`http://gcp-dev-01.taile92a8e.ts.net:20201`。
- canonical MagicDNS prod-like E2E：Auth + Phase A–E **15/15**；PR #271 required CI / Web Flow 4 shards / Oracles 全绿。
- GitHub identity provider 已注册；运行时 `GITHUB_OAUTH_CLIENT_ID` 与 GitHub App `MemoFlow Dev Test` Client ID 一致，secret 已配置。
- Better Auth 当前公开 `AUTH_BASE_URL=http://gcp-dev-01.taile92a8e.ts.net:20201/api/auth`，因此实际发出的 user-authorization callback 为：
  `http://gcp-dev-01.taile92a8e.ts.net:20201/api/auth/callback/github`。
- GitHub App UI 当前登记的 Redirect URI 为：
  `http://gcp-dev-01.taile92a8e.ts.net:20200/api/auth/callback/github`。
  端口不一致，真实点击 GitHub 登录会被 GitHub 拒绝为 `redirect_uri is not associated with this application`。
- GitHub App runtime installation 四件套已从 Oracle2 同一 App 的受保护凭据安全迁移至 GCP gitignored `.env.production.local`；补齐 local/prod Compose passthrough 后 API runtime 已能读取 App ID/slug/private key/webhook secret。
- GitHub App Setup URL 仍为历史 localhost：`http://localhost:5173/settings?tab=account`；ADR-065 已决定将其迁到 durable Installation Setup Gateway，而不是直接回 Web settings 页面。
- GitHub App Homepage URL 仍指向旧 Oracle2；Webhook URL 仍为 placeholder 且 Webhook inactive。

## Progress — 2026-08-25 10:08 +08:00

- **GH-02 resolved in GCP runtime**：GitHub App ID `4385206` / slug `memoflow-dev-test` 与当前 Client ID 属于同一 App；private key + webhook secret 已安全迁移，未进入 git/log。
- **GH-13 implemented**：`docker-compose.local.yml` 与 `docker-compose.prod.yml` 统一透传 GitHub identity + installation 六项 server-only env；contract test **17/17**。
- **GitHub live App JWT verified**：`GET /app` 与 `GET /app/installations` 均为 HTTP 200；现存 installation `148867606`、selected repositories、Contents write、未 suspended。
- **Repository 503 removed**：MagicDNS authenticated `GET /api/v1/repositories/knowledge-connections` = 200；installation start = 200，生成 `/apps/memoflow-dev-test/installations/new?state=...`。
- **Installation completion verified**：使用 identity-bound 一次性 state + 现存 installation 完成 inventory = 200；返回 1 个 private/active repository。
- **GH-14 implemented**：真实 GitHub inventory 为 `admin=false / push=true / pull=true`，Web `canConnect()` 已从 `admin` 改为 `push`；canonical Nx component spec **13/13**。
- **Still external/manual**：GH-03 的最终 GitHub App Setup URL 必须等 ADR-065 gateway 代码、Docker 与 staging 验证完成后再切换；OAuth callback/Homepage 已迁到 canonical 20200/20201/20251 HTTPS 配置。

## Findings / priority

| ID    | Priority | Finding                                                                                          | Current impact                                           | Target                                                                                           |
| ----- | -------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| GH-01 | P0       | GitHub App OAuth Redirect URI 登记 `:20200`，Better Auth 实际发送 `:20201`                       | GitHub 登录在 GitHub 页面直接拒绝                        | callback 与 `AUTH_BASE_URL` exact match；关闭不必要 wildcard                                     |
| GH-02 | P1       | GitHub App runtime 四件套未配置                                                                  | Knowledge Repository API 503，无法开始 installation      | 配置 App ID / slug / private key / webhook secret，启动后能力可用                                |
| GH-03 | P1       | Setup URL 仍为 `localhost:5173/settings?tab=account`                                             | dev/staging/Desktop 不能共享稳定 installation completion | 按 ADR-065 改为 API Setup Gateway；callback 只记录 intent，authenticated finalize 后才可 connect |
| GH-04 | P1       | Homepage URL 指向已退役 Oracle2                                                                  | App metadata / 用户信任边界错误                          | 改为 GCP MagicDNS Web origin（dev App）                                                          |
| GH-05 | P1       | Webhook URL placeholder；MagicDNS 对 GitHub server 不可达                                        | push-driven projection 无法接收 GitHub webhook           | dev 阶段保持 inactive；需要真实 webhook 时用 Funnel/Tunnel/public HTTPS                          |
| GH-06 | P1       | Better Auth 无法解析 trusted client IP                                                           | rate-limit 退化为 shared per-path bucket                 | 配置可信代理/IP header，并有回归测试                                                             |
| GH-07 | P2       | `ScheduleLease.lease_key` 并发 unique conflict 持续产生日志                                      | 非致命但污染运行态并隐藏真实异常                         | 将正常 lease race 变成显式幂等竞争语义                                                           |
| GH-08 | P2       | 长期 MagicDNS 验证库累积 E2E Goal/Task fixture                                                   | 手工 PM 验收被测试数据污染                               | disposable DB 或 suite teardown cleanup                                                          |
| GH-09 | P2       | 历史 Web audit 用例依赖固定账号/旧路由与旧选择器                                                 | 非 canonical audit 产生误报                              | 自举 fixture + 对齐当前 Shell/Settings contract 或归档旧用例                                     |
| GH-10 | P2       | Repository 未配置态直接暴露英文 503 infrastructure message                                       | 产品降级体验差                                           | 转为中文、可行动的 capability/empty state                                                        |
| GH-11 | P3       | Web build 仍有 >500 KiB chunks；Nx Vite executor deprecated                                      | 性能/升级债，不阻塞本轮                                  | lazy split + Nx inferred target 迁移                                                             |
| GH-12 | P2       | `docs/plan/active/README.md` 曾把已归档 Release Lifecycle V2 继续标 active                       | active-plan 真值失真                                     | 本轮同步修正 active index                                                                        |
| GH-13 | P1       | local/prod Compose 未透传 GitHub App 四件套，prod 连 OAuth 两项也未透传                          | host secret 存在但 API runtime 永远不可用                | local/prod 同步补齐 6 项 server-only passthrough + contract test                                 |
| GH-14 | P1       | Web repository selection 仍要求 `permissions.admin`，与 server `Contents: write / push` 契约漂移 | 正常 GitHub App installation 可能无法点击 Connect        | UI 改为 `permissions.push` 并用 admin=false/push=true 回归测试锁定                               |

## Protected contracts

- 同一个 GitHub App 可以同时提供 Client ID/Secret 与 App ID/Private Key，但**身份 OAuth 与仓库 installation 是两条权限链**；不得把登录 token 当 repository token。
- Identity OAuth 只证明 GitHub identity；不得请求宽泛 `repo` scope。
- Repository 长期访问只使用 GitHub App installation token；浏览器永不获得 installation token/private key。
- Repository 仅接受用户明确安装范围中的 private、active repository；要求 installation `Contents: write`。
- OAuth callback 与 Setup URL 是浏览器跳转，可使用用户可达的 private MagicDNS；GitHub webhook 是 GitHub server → MemoFlow server 的入站请求，private MagicDNS 不构成公网 webhook endpoint。
- Secret/private key 只进入 gitignored runtime env / secret store，不写进 plan、git history、日志或浏览器 bundle。

## Phase A — GitHub App registration 修正

1. User authorization callback 改为当前 Better Auth canonical callback：
   `http://gcp-dev-01.taile92a8e.ts.net:20201/api/auth/callback/github`。
2. 禁用该 callback 的 wildcard matching；当前不需要子域/子路径泛匹配。
3. **代码/Docker/staging gate 完成后**，Setup URL 一次性改为：
   `https://gcp-dev-01.taile92a8e.ts.net:20201/api/v1/repositories/knowledge-connections/installations/setup`。
   Dev gateway 根据 versioned state 中的 route key 只向 server allowlist 内的 staging API 路由；公开 callback 本身不授予 repository connection 权限。
4. 保留 `Redirect on update`，使 repository selection 变化后回到 MemoFlow 重新验证 installation inventory。
5. Homepage URL 改为：
   `http://gcp-dev-01.taile92a8e.ts.net:20200/`。
6. `Request user authorization (OAuth) during installation` 保持关闭；登录入口已经独立发起 user authorization，安装仓库不应隐式扩大身份流程。
7. Device Flow 保持关闭；当前 Desktop 有独立 Better Auth device authorization，不依赖 GitHub Device Flow。
8. Webhook 在纯 MagicDNS dev 环境保持 inactive；需要 push webhook E2E 时再配置公网 HTTPS tunnel endpoint。

## Phase B — GitHub App runtime 四件套

在 GCP gitignored `.env.production.local` 配置且必须成组出现：

```text
GITHUB_APP_ID=4385206
GITHUB_APP_SLUG=memoflow-dev-test
GITHUB_APP_PRIVATE_KEY=<PEM private key; server only>
GITHUB_APP_WEBHOOK_SECRET=<strong random secret; server only>
```

身份侧继续使用同一个 GitHub App 的 user authorization credentials：

```text
GITHUB_OAUTH_CLIENT_ID=<GitHub App Client ID>
GITHUB_OAUTH_CLIENT_SECRET=<GitHub App Client secret>
```

`GITHUB_APP_PRIVATE_KEY` 与 `GITHUB_APP_WEBHOOK_SECRET` 不得输出到日志或提交到 git。

## Phase C — GitHub App permissions / installation

- Repository permissions：`Contents: Read and write`（核心必需）；Metadata 使用 GitHub App 隐式/只读能力，不额外扩大权限。
- Webhook 若启用：只订阅产品实际消费的 `push` event。
- App 安装范围选择 `Only select repositories`，只勾目标 private knowledge repository；不要 `All repositories`。
- installation 完成后，MemoFlow 必须重新从 GitHub App API 验证 installation、Contents write、repository private/active 和 repository membership，不信任浏览器传入的 `installation_id`。

## Phase D — MagicDNS acceptance

1. GitHub 登录：signin → GitHub authorize → callback → MemoFlow cloud session，且 callback host/port exact match。
2. Knowledge Repository：Settings / repository → durable intent → GitHub installation → Setup Gateway 记录 `CallbackReceived` → Web return 或 Desktop polling → authenticated finalize → 列出 verified private repo；legacy `state + installation_id` 仅作为迁移兼容路径。
3. Connect → initial reconciliation preview/execute → connection Active。
4. Desktop 获取短期 repository-scoped installation token；真实 pull/commit/push smoke 通过。
5. 若启用公网 webhook tunnel：真实 GitHub push → HMAC verified webhook → projection/RAG 更新；duplicate delivery 幂等。
6. 重新跑 canonical MagicDNS 15/15 + repository focused/live-github + required CI。

## Completion criteria

- [ ] GH-01 callback mismatch 修复并真实完成一次 GitHub 登录回跳
- [x] GH-02 GitHub App runtime 四件套配置并消除 knowledge-connections 503
- [ ] GH-03/04 Setup/Homepage URL 对齐 GCP MagicDNS
- [x] GitHub App Contents write + selected-private-repository installation 成功
- [x] Web installation callback 能完成 inventory + repository selection
- [ ] Repository connection / reconciliation / Desktop installation-token 路径真实通过
- [ ] Webhook 策略明确：dev inactive，或公网 HTTPS tunnel 下 push E2E 通过
- [ ] GH-06/07/08/09/10 后续问题均有实现或明确归档决策
- [ ] canonical MagicDNS 验证与 required CI 全绿
- [ ] 完成后移入 `docs/plan/archive`
