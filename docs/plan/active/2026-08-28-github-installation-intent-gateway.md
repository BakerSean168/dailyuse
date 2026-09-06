---
tags:
  - plan
  - active
  - github
  - repository
  - installation
  - desktop
  - staging
description: MemoFlow GitHub App durable installation intent、环境路由与 Web/Desktop 安装完成闭环实施方案
created: 2026-08-28T12:00:00+08:00
updated: 2026-09-06T16:44:18+08:00
status: active # implementation complete; one Windows Desktop live acceptance remains
---

# GitHub App Durable Installation Intent + Setup Gateway

> **Truth audit 2026-09-06:** implementation and automated contract coverage are complete. Production Web install/connect/webhook acceptance is complete. A real Published Windows Desktop attempt reached GitHub installation + Setup Gateway callback and exposed a packaged preload allowlist defect; #331 fixed `STATUS`/`FINALIZE`, and #332 fixed the cross-platform ESM CLI entrypoint bug found while recovering the same immutable v0.14.0 Draft. `v0.14.0` is now Published with all four Desktop lanes green. The plan remains Active for exactly one release-level acceptance: install Published v0.14.0 on Windows and complete authenticated polling/finalize → repository inventory/connect, then archive if it passes.

## 0. Executive decision

MemoFlow 保留 ADR-034 已确定的产品边界：

- GitHub 登录只负责 MemoFlow 身份认证；
- GitHub App installation 独立负责用户明确选择的 private knowledge repository；
- Desktop Local Vault 是本地可写事实源；GitHub private repository 是开启同步后的跨设备共享提交历史；
- Web/Mobile 使用 GitHub 派生 projection/RAG，并只执行受限、可审计的 Git 写入；
- 浏览器、Desktop 永远不持有 GitHub App private key，长期 installation token 不持久化。

本计划只重构 **GitHub App installation orchestration**，不改变上述产品事实边界。

### 决策摘要

1. 将进程内 `InMemoryKnowledgeRepositoryInstallationStateStore` 升级为 Prisma-backed durable `KnowledgeRepositoryInstallationIntent`。
2. GitHub `state` 使用 `mfi1.<routeKey>.<nonce>`，数据库只保存 SHA-256 hash，不保存原始 state。
3. 新增公开但 fail-closed 的 Setup Gateway endpoint。它只接收 GitHub redirect、验证 installation inventory、记录 `CallbackReceived`；它 **不能** 创建 repository connection、不能签发 installation token。
4. `finalize` 必须由创建 intent 的已认证 MemoFlow identity 调用；finalize 后才获得短期 repository-selection claim。
5. `connect` 只接受该 identity 的、未过期、已 finalize 的 installation intent；成功后 intent 进入 `Consumed`。
6. Web 使用浏览器 redirect 回原环境并 finalize；Desktop 使用外部浏览器 + API polling/finalize，不要求外部浏览器持有 MemoFlow Web session，也不要求 Electron deep link。
7. dev + staging 可共用 `MemoFlow Dev Test` GitHub App，但通过 route key 定向到各自独立 API/DB；prod 使用独立 GitHub App/private key，同时复用同一代码与协议。
8. Setup Gateway 只允许 server-configured route targets 和 relative return paths，禁止客户端任意 origin/open redirect。

## 1. Current system map

### 1.1 Knowledge product path

```text
Desktop Local Vault
  -> local Git commit queue
  -> GitHub private repository
  -> verified GitHub webhook / reconciliation
  -> server projection + RAG
  -> Web / Mobile / AI
```

Desktop 未开启 GitHub 同步时，本地 Vault 完整可用；Web 没有远端知识副本时展示未连接状态。

### 1.2 Existing installation path

当前实现：

```text
Authenticated Web/Desktop
  -> POST installations/start
  -> InMemory stateStore.issue(identityId, returnUrl)
  -> github.com/apps/<slug>/installations/new?state=<opaque>
  -> GitHub Setup URL
  -> Web query state + installation_id
  -> authenticated POST installations/complete
  -> stateStore.consume(state)
  -> GitHub inventory validation
  -> in-memory installation claim
  -> POST knowledge-connections
```

### 1.3 Verified gaps

| Gap                          | Observed                                            | Desired                                        | Impact                                       |
| ---------------------------- | --------------------------------------------------- | ---------------------------------------------- | -------------------------------------------- |
| Process-local state          | state / claims 存 `Map`                             | restart/multi-instance durable                 | API restart 或实例切换会丢 installation flow |
| Desktop browser coupling     | Desktop `returnUrl=undefined`，完成逻辑在 Vue query | Desktop 外部浏览器无需 MemoFlow Web session    | Desktop install completion 不完整            |
| One Setup URL vs dev/staging | Dev Test App 只能有一个 Setup URL                   | callback gateway 按 state route key 路由       | staging 不能可靠完成 installation            |
| Arbitrary return URL         | start contract 接受 absolute `returnUrl`            | same-origin relative path / server allowlist   | open redirect / trust boundary 不够清晰      |
| Callback = authorization     | complete 同时 consume state + claim                 | callback record 与 authenticated finalize 分离 | 公开 redirect 入口承担过多授权语义           |
| Raw state persistence        | memory 存 raw state                                 | DB 只存 state hash                             | durable 后避免 DB 泄露直接重放 state         |

## 2. Protected contracts

本重构必须保持：

1. GitHub login OAuth 与 repository installation 权限链严格分离。
2. `Contents: write` + private + active repository 才可连接。
3. GitHub `installation_id` 永远重新通过 GitHub App API 验证，不能信任 query/body。
4. Browser/Desktop 不获得 GitHub App private key；installation access token 仍只短期签发给 Desktop Git runtime。
5. Existing `KnowledgeRepositoryConnection`、projection、RAG、first reconciliation、Desktop sync contract 不改变。
6. Existing start/complete routes 在迁移期保持兼容；新客户端优先使用 intent/status/finalize。
7. Web return target 只能落到 runtime configured `MEMOFLOW_WEB_URL` 下的允许路径。
8. dev/staging/prod database、credentials、GitHub App trust boundary 不合并。
9. guest/offline-only profile 仍不可扩大 cloud repository authorization。
10. GitHub App update/webhook 路径不得因为本重构获得额外权限。

## 3. North-star architecture

### 3.1 Runtime topology

```text
                         GitHub
                           |
                   GitHub App install
                           |
                 configured Setup URL
                           |
                           v
               Installation Setup Gateway
                           |
              parse mfi1.<routeKey>.<nonce>
                           |
              +------------+-------------+
              |                          |
       routeKey=current             routeKey=other
              |                          |
              v                          v
     target environment API       allowlisted 302/307
              |                          |
              +------------+-------------+
                           |
                  verify installation
                           |
                 CallbackReceived only
                           |
          +----------------+----------------+
          |                                 |
         Web                              Desktop
          |                                 |
 safe redirect with intentId         external browser done
          |                           Desktop polls API
          +----------------+----------------+
                           |
                 authenticated finalize
                           |
                 server revalidates GitHub
                           |
                 Finalized selection claim
                           |
                      choose repo
                           |
                           v
                  KnowledgeRepositoryConnection
```

### 3.2 Non-production vs production

```text
shared implementation
  GitHubInstallationIntent + SetupGateway
        |
        +-- non-production runtime
        |     GitHub App: MemoFlow Dev Test
        |     routeKey dev     -> dev API / DB
        |     routeKey staging -> staging API / DB
        |
        +-- production runtime
              GitHub App: MemoFlow Production
              routeKey prod -> prod API / DB
```

Prod 不依赖 GCP Dev gateway，不共享 App private key。

## 4. Installation intent model

### 4.1 Durable record

`KnowledgeRepositoryInstallationIntent`：

```text
id                 random UUID/cuid-like id
identityId         MemoFlow identity owner
stateHash          SHA-256(full GitHub state), unique
routeKey           dev | staging | prod | configured value
clientKind         Web | Desktop
returnPath         app-relative path only
status             Pending | CallbackReceived | Finalized | Consumed
installationId     nullable
providerAccountId  nullable
setupAction         nullable install|update
expiresAt          hard TTL boundary
callbackReceivedAt nullable
finalizedAt         nullable
consumedAt          nullable
createdAt / updatedAt
```

No OAuth token, installation token, private key or raw `state` is persisted.

### 4.2 State format

```text
mfi1.<routeKey>.<base64url(32 random bytes)>
```

- version prefix permits future migration;
- routeKey is routing metadata, not authorization;
- nonce is unguessable CSRF/correlation secret;
- target environment stores only SHA-256(state).

### 4.3 State machine

```text
Pending
  | GitHub callback + inventory verified
  v
CallbackReceived
  | authenticated same-identity finalize + inventory revalidated
  v
Finalized
  | authenticated connect succeeds
  v
Consumed

Any non-terminal state + expiresAt <= now => unusable/expired
```

Idempotency:

- duplicate GitHub callback with same state + installation id is accepted without widening authority;
- callback with same state + different installation id is rejected;
- repeat finalize by same identity is safe while TTL valid;
- finalize by another identity is forbidden;
- consumed intent cannot authorize a second connection.

## 5. API contract

### 5.1 Start

Keep route:

`POST /api/v1/repositories/knowledge-connections/installations/start`

Request extends compatibly:

```json
{
  "clientKind": "web | desktop",
  "returnUrl": "optional legacy absolute URL"
}
```

Server behavior:

- default clientKind = `web` for backward compatibility;
- `returnUrl` is accepted only when its origin equals configured `MEMOFLOW_WEB_URL`; server stores only pathname/search/hash;
- missing returnUrl uses `/settings?tab=repository`;
- Desktop uses a fixed safe completion path and polling, not arbitrary returnUrl.

Response extends compatibly:

```json
{
  "intentId": "...",
  "installationUrl": "https://github.com/apps/.../installations/new?state=...",
  "expiresAt": 123
}
```

### 5.2 GitHub Setup callback

New unauthenticated endpoint:

`GET /api/v1/repositories/knowledge-connections/installations/setup`

Inputs from GitHub:

- `state`
- `installation_id`
- `setup_action` optional

Behavior:

1. Validate state envelope/version/route key.
2. If route key is not local, redirect only to configured target API base URL.
3. On target environment, lookup state hash and require Pending/compatible idempotent status + TTL.
4. Revalidate installation with GitHub App API; require not suspended + Contents write.
5. Persist CallbackReceived + installation/account metadata.
6. Web: 302 to configured Web origin + stored relative returnPath + public `installation_intent=<intentId>`.
7. Desktop: return a minimal safe HTML success page; Desktop itself polls/finalizes.

No connection claim is created here.

### 5.3 Status

New authenticated endpoint:

`GET /api/v1/repositories/knowledge-connections/installations/intents/:intentId`

Returns only owner-visible status:

```text
Pending | CallbackReceived | Finalized | Consumed | Expired
```

It may expose `installationId` only after callback, never tokens.

### 5.4 Finalize

New authenticated endpoint:

`POST /api/v1/repositories/knowledge-connections/installations/intents/:intentId/finalize`

- require intent.identityId == ctx.identityId;
- require CallbackReceived/Finalized and TTL valid;
- re-run GitHub installation inventory validation;
- persist Finalized;
- return current verified repositories for selection.

Existing `POST .../installations/complete` remains temporarily supported and delegates to the same intent/finalize semantics for older Web clients.

### 5.5 Connect

Existing `POST /knowledge-connections` remains unchanged externally.

Internally it must require a Finalized, unexpired intent for `(identityId, installationId)`. On successful connection save, consume that claim.

## 6. Web behavior

### Start

```text
Settings -> Connect GitHub repository
  -> start({ clientKind: web, returnUrl: current repository settings URL })
  -> browser navigates to installationUrl
```

### Return

Setup gateway redirects without raw state:

```text
/settings?tab=repository&installation_intent=<public intent id>
```

Vue:

1. reads intent id;
2. authenticated GET status;
3. when CallbackReceived, POST finalize;
4. displays verified repository choices;
5. removes transient query parameter after success/failure handling.

Legacy `state + installation_id` query completion stays supported during migration.

## 7. Desktop behavior

Desktop does not depend on the external browser holding a MemoFlow session.

```text
Desktop renderer
  -> start({ clientKind: desktop })
  -> Electron opens GitHub in external browser
  -> remember intentId in renderer state
  -> poll authenticated status endpoint

External browser
  -> GitHub install
  -> Setup gateway target environment
  -> CallbackReceived
  -> static "Installation recorded, return to MemoFlow Desktop" page

Desktop polling
  -> sees CallbackReceived
  -> authenticated finalize
  -> verified repository choices
  -> first reconciliation / sync unchanged
```

Polling policy:

- 1.5–2 s interval with bounded TTL;
- stop on unmount, finalized, consumed, expired or terminal error;
- no background infinite timer;
- a manual refresh/retry action remains available.

## 8. Environment routing configuration

New server-only config:

```text
GITHUB_INSTALLATION_ROUTE_KEY=dev|staging|prod
GITHUB_INSTALLATION_ROUTE_TARGETS=dev=https://...:20201,staging=https://...:20251
```

Rules:

- route key regex: lowercase alphanumeric + hyphen, bounded length;
- targets must be HTTPS outside explicit local validation;
- current route key may omit itself from map because it handles locally;
- unknown route key => fail closed, no arbitrary redirect;
- state route metadata never overrides server allowlist.

For current GCP Dev:

```text
dev runtime:
  GITHUB_INSTALLATION_ROUTE_KEY=dev
  GITHUB_INSTALLATION_ROUTE_TARGETS=staging=https://gcp-dev-01.taile92a8e.ts.net:20251

staging runtime:
  GITHUB_INSTALLATION_ROUTE_KEY=staging
  GITHUB_INSTALLATION_ROUTE_TARGETS=dev=https://gcp-dev-01.taile92a8e.ts.net:20201
```

The Dev Test GitHub App Setup URL points to the dev gateway. A staging state is routed to staging API and completed against staging DB.

Production uses a separate GitHub App and prod Setup URL, so no production route target points at GCP Dev.

## 9. Persistence and migration

### Schema

Add `KnowledgeRepositoryInstallationIntent` to repository Prisma schema and account relation.

### Migration

Add idempotent additive SQL migration file for existing deployments:

- create table;
- unique state hash;
- owner/status and expiry indexes;
- account FK with cascade;
- no destructive migration.

### Rollback

Old in-memory store remains available only as a test/dev adapter while migration lands; production Prisma composition defaults to durable adapter. Rolling back application code leaves the additive table inert and safe.

## 10. Implementation tickets

### GHINT-01 — Durable installation intent contract + Prisma adapter

**Goal:** restart/multi-instance-safe one-time installation state.

**Implementation:**

1. Add intent DTO/internal types and state machine.
2. Add application port for issue/find/callback/finalize/consume.
3. Add Prisma schema + additive migration SQL.
4. Implement Prisma repository with state hash and conditional transitions.
5. Keep a memory adapter for focused unit tests with identical semantics.

**Tests:** state hashing, identity isolation, TTL, duplicate callback, conflicting installation id, finalize/consume idempotency.

### GHINT-02 — Setup gateway + environment routing

**Goal:** one GitHub App Setup URL serves dev/staging safely.

**Implementation:**

1. Add route key/state codec.
2. Add route target parser/config validation.
3. Add public Setup endpoint before auth-only routes.
4. Route cross-environment state only to allowlisted API origins.
5. Local callback validates GitHub installation inventory and records callback only.
6. Web redirect removes raw state; Desktop returns safe static completion page.

**Tests:** local callback, cross-env redirect, unknown route, forged installation, suspended/no-write installation, duplicate callback, open-redirect rejection.

### GHINT-03 — Authenticated status/finalize + compatibility route

**Goal:** public callback cannot grant repository connection authority.

**Implementation:**

1. Add owner-scoped status endpoint.
2. Add owner-scoped finalize endpoint.
3. Revalidate GitHub inventory on finalize.
4. Make existing complete route delegate compatibly.
5. Require Finalized intent before connect; consume after success.

**Tests:** wrong identity, expired intent, callback-only connect rejection, finalized connect success, consume-on-success only.

### GHINT-04 — Web return flow

**Goal:** Web installation returns to the originating environment and selects verified repo.

**Implementation:**

1. Start with `clientKind=web`.
2. Consume `installation_intent` query.
3. status -> finalize -> repository list.
4. clean transient query params.
5. preserve legacy state+installation_id completion fallback.

**Tests:** query return, finalization failure, stale intent, successful repository choice.

### GHINT-05 — Desktop polling flow

**Goal:** Desktop GitHub install works without Web browser MemoFlow session or custom protocol.

**Implementation:**

1. Start with `clientKind=desktop` and retain `intentId`.
2. Open installation URL externally.
3. Poll status until CallbackReceived/terminal.
4. Finalize over authenticated Desktop remote gateway.
5. Stop timer on unmount/expiry/success; surface retry.

**Tests:** callback detected, polling cancellation, expiry, service error, verified repo selection.

### GHINT-06 — Runtime config, Docker, dev/staging acceptance

**Goal:** same code supports dev/staging shared Dev App and production isolated App.

**Implementation:**

1. Add env schema + compose passthrough for route key/targets.
2. Configure dev/staging runtime values without changing GitHub App registration yet.
3. Generate Prisma client and update schema boot.
4. Build/test packages.
5. Run prod-like Docker migration/startup smoke.
6. Deploy exact SHA to staging and verify setup gateway/status routes.
7. Only after code is ready, ask user to change GitHub App Setup URL.

## 11. Verification matrix

| Layer         | Verification                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------- |
| Contracts     | repository contracts typecheck + route schema tests                                               |
| Intent domain | focused state machine/store unit tests                                                            |
| Prisma        | generated client, adapter tests, real PostgreSQL integration/schema boot                          |
| API           | start/setup/status/finalize/connect route tests                                                   |
| Web           | `KnowledgeRepositorySettings` component tests                                                     |
| Desktop       | remote gateway + renderer install polling tests                                                   |
| Package       | `repository:test/typecheck/lint/build`, affected contracts/app-vue/desktop/api checks             |
| Integration   | local prod-like Docker from exact SHA; migrator exit 0; API/Web healthy                           |
| Staging       | exact SHA deploy; dev/staging setup route smoke; no secret leakage                                |
| GitHub live   | after user changes App: real Web install + Desktop install + selected repo + first reconciliation |

## 12. Security / failure matrix

| Failure                                    | Required behavior                                                |
| ------------------------------------------ | ---------------------------------------------------------------- |
| API restarts after start                   | intent survives in DB                                            |
| callback hits wrong environment gateway    | allowlisted route by routeKey only                               |
| unknown route key                          | reject; never use client URL                                     |
| forged installation_id                     | GitHub inventory validation fails or remains untrusted           |
| stolen/guessed intentId                    | status/finalize require owner auth; intentId is not state secret |
| leaked DB                                  | raw GitHub state unavailable because only hash stored            |
| duplicate callback                         | idempotent for same installation; reject conflicting id          |
| callback received but user never finalizes | expires, no connection authority                                 |
| callback only then attacker calls connect  | rejected; no Finalized claim                                     |
| wrong identity finalizes                   | forbidden                                                        |
| connect save fails                         | intent remains Finalized for retry until TTL                     |
| connect succeeds twice                     | Consumed intent cannot authorize second use                      |
| Desktop browser has no MemoFlow session    | still succeeds via Desktop polling                               |
| open redirect attempt                      | return URL normalized to configured Web origin + relative path   |
| staging compromise                         | cannot use production GitHub App private key                     |

## 13. Non-goals

- Do not merge dev/staging/prod databases.
- Do not make GitHub login mandatory for knowledge repository users.
- Do not request broad OAuth `repo` scope.
- Do not redesign Git sync/rebase/conflict behavior.
- Do not add Electron custom protocol solely for GitHub installation.
- Do not make GitHub webhook public through Tailscale; webhook exposure remains a separate deployment decision.
- Do not create the production GitHub App until the production hostname/callback is ready.

## 14. Definition of Done

- [x] Plan and ADR record the final ownership/state model.
- [x] Production composition no longer defaults to process-local installation state.
- [x] Raw GitHub installation state is never persisted.
- [x] Setup callback cannot directly authorize `connect`.
- [x] Web installation works through intent redirect/finalize.
- [ ] Desktop installation works through external browser + polling/finalize.
- [x] dev/staging can share Dev Test App with route-key isolation and independent DBs.
- [x] prod path is code-identical but credential/runtime-isolated.
- [x] focused + package + integration tests green.
- [x] exact SHA passes prod-like Docker migration/startup smoke.
- [x] exact SHA deployed to staging and setup gateway smoke passes.
- [x] Only then update GitHub App registration and run live GitHub acceptance.

## 15. Live acceptance evidence — 2026-08-29

### 15.1 Runtime / release identity

- Production runtime content revision: `670aaea48a0644d3bdef792a18367d79b43d02a9`.
- Deployment contract / dual-registry revision validated before promotion: `bc1a5566720ad3bd1f63a87b4ab038bfbc4d1ddf`.
- Final contract CI run: `33234315202` — Unit, Build, Typecheck, Static Analysis, Verification, Governance, Performance, Coverage, Integration, Delivery Observation and Web Flow 1–4 all succeeded.
- China production application and runtime images are pinned by ACR `@sha256` refs; `docker-compose.prod.yml` on the host is byte-identical to the reviewed repository compose.
- Public Web, API `/healthz`, and PowerSync liveness returned `200` after promotion.

### 15.2 Dev / staging shared-App acceptance

- Dev Test App installation inventory was verified with the real GitHub App API.
- Dev completed authenticated start → callback → finalize → connect, ending with `Active` connection and `Consumed` intent.
- Staging used the single Dev Setup URL, routed `mfi1.staging.*` through the dev gateway to staging, then completed callback → finalize → connect against the staging DB.
- Cross-route fake probes remained fail-closed and did not create installation-intent rows.

### 15.3 Production isolated-App acceptance

- Production App: `MemoFlow Production`, App ID `4752078`, slug `memoflow-production`; Contents=`write`, Metadata=`read`, production webhook URL, JSON content type, SSL verification enabled.
- A real installation was created for account `BakerSean168` with `selected` repository mode and exactly one private fixture repo: `BakerSean168/memoflow-github-app-e2e-fixture`.
- Production intent `knowledge-install-intent-e96723f7-241d-4fc5-add2-d16b0912455c` completed `Pending → CallbackReceived → Finalized → Consumed`.
- Production connection `knowledge-connection-cfde834a-4dea-443a-8f9d-b18730f9d03a` became `Active`.
- The first real push exposed a production-only configuration drift: GitHub webhook deliveries returned HTTP `401` because the GitHub App webhook secret did not match the production runtime secret.
- Focused runtime repair synchronized the GitHub App hook secret to the existing production secret without exposing either value. A second real App-authored push (`45b9c6dc734d2c2b06b4ba57f154615202f4d9e7`) returned webhook HTTP `202`, delivery status `Processed`, advanced `lastProjectedCommitSha` to the same commit, and projected `README.md`.
- A GitHub redelivery request returned `202`; the durable delivery table remained at one row, proving delivery-id deduplication on the live path.

### 15.4 Residual boundaries

- Production Desktop live installation was not rerun in this closure pass; Desktop polling/finalize remains covered by implementation and automated contract tests. This is why the Desktop live DoD item above remains unchecked.
- Resolved 2026-08-29: production email/password auth keeps `requireEmailVerification=true` and now uses the restored Brevo SMTP configuration. The deployment contract passes the transactional-email env into API, production SMTP verification succeeds, and a real Better Auth `sign-up/email` request returned `200`; the temporary E2E identity was removed afterward. No SMTP credential is recorded in Git.
- The Production GitHub App installation is intentionally left installed only on the private fixture repository so later production E2E does not require another broad repository authorization.
- The temporary production MemoFlow E2E identity was deleted after acceptance; cascading cleanup returned users/sessions/accounts/intents/connections/projections/webhook-deliveries to zero while leaving the GitHub App installation scoped only to the fixture repository.

## 16. Windows live acceptance continuation — 2026-09-06

### 16.1 Real v0.13.3 Desktop attempt

- The Published Windows v0.13.3 package was installed on a real Windows machine and connected to the production MemoFlow account path.
- Desktop `START` created a real `clientKind=desktop` durable installation intent in production and opened the external GitHub App installation flow.
- The user expanded the existing `MemoFlow Production` installation to include `BakerSean168/thought-forest` while retaining `BakerSean168/memoflow-github-app-e2e-fixture`; GitHub App inventory confirmed both selected repositories and the expected `metadata:read` / `contents:write` permissions.
- Setup Gateway received the real callback and advanced the durable intent from `Pending` to `CallbackReceived`.
- The Desktop renderer then failed with `IPC 调用异常`. Direct packaged-runtime inspection proved `START` and `system:openExternalUrl` were allowed, but preload omitted `RepositoryChannels.KNOWLEDGE_CONNECTION_INSTALLATION_STATUS` and `...FINALIZE`. The v0.13.3 package therefore could not finish the Desktop DoD even though GitHub authorization and callback were successful.

### 16.2 Corrective Desktop release

- PR #331 added `STATUS` + `FINALIZE` to the preload allowlist and added a regression lock that derives every Repository IPC channel used by `RepositoryIpcAdapter` and requires preload support. PR CI passed; merged main `5a9342363385...` passed full main CI and Coverage.
- Release PR #322 produced immutable release commit `460649320dc8d5fcf003204700a690363c860d2a` for v0.14.0. Its first Draft release attempt proved the Windows packaged Electron runtime itself passed, but the Windows release receipt failed because `macos-signing-policy.mjs` silently did not execute its CLI body on Windows.
- The root cause was the platform-unsafe ESM main guard `import.meta.url === `file://${process.argv[1]}``. It affected 22 CI/CD CLI entrypoints, including `release-contract.mjs`; on Windows, backslash argv paths made those scripts silently skip their CLI body while exiting 0.
- PR #332 replaced all 22 executable guards with self-contained `pathToFileURL(process.argv[1]).href` checks, added a repository-wide regression audit, added a real Windows signing-policy CLI output test, and made release signing-policy output fail fast in the workflow. CI/CD governance passed 126/126 and global governance passed.
- Control-plane main `1739d230179e60c47d9b937bb0648b27e785c58d` passed full main CI + Coverage. The same immutable `v0.14.0 -> 460649320dc8d5fcf003204700a690363c860d2a` Draft was resumed rather than rewritten. Windows then proved `release-contract` executed, packaged smoke passed, and the platform receipt received explicit `signing-state=unsigned`. Linux x64, Windows x64, macOS x64 and macOS arm64 all passed; Release Postflight published v0.14.0 at `2026-09-06T08:39:29Z` with 23 canonical assets.

### 16.3 Remaining acceptance gate

The only unchecked DoD remains unchanged in meaning but is now narrower:

```text
Published v0.14.0 Windows Desktop
→ reuse the already-authorized MemoFlow Production installation
→ START / external browser if needed
→ STATUS observes CallbackReceived
→ authenticated FINALIZE
→ repository inventory includes thought-forest
→ connect selected repository
```

Do **not** mark the Desktop DoD complete from CI or server-side inventory alone. It closes only after the Published v0.14.0 Windows package completes this live journey.
