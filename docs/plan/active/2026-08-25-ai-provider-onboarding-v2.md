---
tags:
  - plan
  - active
  - ai
  - provider
  - mastra
  - byok
description: MemoFlow AI Provider 连接、凭据验证、模型发现与选择的一次性重构计划
created: 2026-08-25T12:20:00+08:00
updated: 2026-08-25T12:29:00+08:00
status: active
---

# AI Provider Onboarding V2 — 连接、发现、选型与原子保存重构

## Outcome

把当前“模板偷偷填默认 model → 先保存 provider → 再刷新模型”的接入方式，重构为用户可理解、协议优先、可验证、可扩展的 BYOK Provider onboarding：

1. 用户先选择内置 Provider 或 Custom OpenAI-compatible；
2. 只填写连接所需凭据（内置 Provider 默认只需 API Key；Custom 需要 Base URL + API Key）；
3. 服务端在**不持久化 provider**的前提下完成凭据验证与模型发现；
4. UI 展示真实可用模型，用户显式选择默认模型；
5. 必要时对所选模型做低成本 capability/test probe；
6. 最后一次性、原子地加密并保存 Provider + Default Model；
7. 已保存 Provider 可独立刷新模型目录、切换默认模型、测试连接，不要求重新输入 Key。

保持 **Mastra-only runtime** 不变：MemoFlow 继续拥有多租户 BYOK connection/domain truth，Mastra 只负责执行；不重新引入第二套 AI runtime 或 provider-specific execution switch。

## Why now / current evidence

- 当前 `CreateAIProviderConfigSchema` 强制 `model` 必填；Quick Provider UI 虽只让用户输入 Key，但实际上静默注入模板 `defaultModel`。
- OpenRouter Quick Connect 当前请求会携带 `model=google/gemini-2.5-flash`，这是 MemoFlow bootstrap contract，而不是“连接 OpenRouter”本身需要。
- 当前流程为 `createProvider → persist encrypted key → refreshProviderModels`：Key/模型发现失败时，provider 可能已经落库，产品语义不是原子接入。
- Custom Provider 同样要求用户在模型发现前手填 model，没有充分利用 OpenAI-compatible `/models`。
- GCP MagicDNS 曾因缺失 `AI_PROVIDER_ENCRYPTION_KEY` 在首次保存 provider 时直接 500；部署 preflight 没有在用户进入设置前暴露这项 server-only misconfiguration。
- 当前 model catalog gateway 已能读取 `/models`，但 Provider onboarding contract 尚未围绕 discovery-first 设计。
- OpenRouter `/models` 返回的 `pricing.prompt/completion` 是 per-token 字符串；当前 DTO 字段为 `inputCostPer1M/outputCostPer1M`，现实现直接赋值，存在 1e6 倍单位语义错误。
- 当前 AI runtime 已完成 AI-vNext：`@mastra/core` 1.60.0 为唯一 runtime，旧 Python AIService / legacy gateway 已退役；本轮只重构 Provider Connection / Model Catalog / UI，不破坏 runtime 单轨。

## External design research

### Mastra

- Mastra Model Router 以 `provider/model` 为模型身份，可动态路由大量 provider/model，并明确支持 user-selectable models、多租户 BYOK、A/B testing 等场景。
- Mastra 的模型目录会动态利用 models.dev / OpenRouter 等来源，说明“模型目录与 runtime 执行解耦、目录可动态更新”是其当前方向。
- MemoFlow 不直接切换到全局 Mastra Model Router 作为 product provider store：用户自定义 Base URL、identity-scoped secret、Provider default/active 状态仍应由 MemoFlow domain 管理；Mastra 继续消费 request-scoped resolved model config。

### Open WebUI

- 采用 protocol-oriented design：核心围绕 OpenAI-compatible 等标准协议，而不是为每个 provider 写一套 runtime。
- 新连接主要输入 URL + API Key；标准 `/models` 用于自动发现模型。
- `/models` 不可用时允许手工 Model IDs fallback，而不是判定整个 provider 不兼容。
- 支持模型 allowlist/filter，避免 OpenRouter 这类超大目录直接淹没用户。

### LibreChat

- Custom endpoint 支持 `models.fetch=true`，模型目录与 endpoint credential 配置分开。
- 支持 `apiKey: user_provided`，适合 BYOK。
- OpenRouter 通过标准 OpenAI-compatible endpoint 接入，不需要单独 execution runtime。

### LobeChat

- Provider catalog 与 model list policy 分离；Provider 可以有独立 key/base URL，同时可对模型做 add/hide/rename 控制。
- 借鉴其“Provider 是稳定入口、Model list 是动态/可筛选资产”的产品结构，而不照搬大量静态模型清单。

### OpenRouter / models.dev

- OpenRouter 提供专门的 `GET /api/v1/key` 认证端点，可验证当前 API Key；不能把公开/半公开模型目录的 200 直接等价成“Key 一定有效”。
- OpenRouter 模型 slug 使用 `provider/model`，目录动态变化，应 live discover + cache，而不是模板硬编码成为接入前提。
- models.dev 是开源模型 metadata registry，价格统一为 USD / 1M tokens，并提供 context / reasoning / modalities / lifecycle 等元数据；适合作为 best-effort enrichment，不应取代真实 provider inventory。

## Product principles

1. **Connection != Model**：Provider 连接凭据与默认模型是两个阶段，最终一起提交，但不能让 model 成为“验证连接”之前的隐藏先决条件。
2. **Validation != Discovery**：凭据验证、模型发现、所选模型可执行性是三个不同事实，API/UX 必须分别表达。
3. **Protocol-first**：绝大多数 BYOK 继续统一为 OpenAI-compatible protocol；Provider-specific 代码仅用于 credential probe / catalog enrichment / endpoint quirks，不进入核心执行分支。
4. **Explicit user choice**：内置模板可给“推荐模型”，但不得在首次接入时静默替用户决定 default model。
5. **Atomic persistence**：第一次 onboarding 在验证与选择完成前不创建持久 Provider 记录；最终一次 transaction 写入 encrypted secret + selection + default invariant。
6. **Discovery fail-open, auth fail-closed**：`/models` 不支持时允许手工 model fallback；401/403 等明确 credential failure 不允许保存成“已连接”。
7. **Provider inventory is authority; registry is enrichment**：真实 `/models` / provider catalog 决定“当前 Key 能看到什么”；models.dev 只补充显示信息。
8. **Secret sent once**：首次 onboarding 的 raw API Key 只在 credential probe 时从浏览器上传一次；验证成功后换成 identity-bound、短 TTL、one-time credential handle，模型选择与最终 commit 不再重复传 raw Key。
9. **Secret never becomes model/catalog state**：Key 不进入 client DTO、日志、workflow snapshot、Mastra RequestContext、model metadata cache。
10. **TLS, not home-grown browser crypto**：公网/生产依赖 HTTPS/TLS 保护传输，不在 Vue 中自造 RSA/AES“二次加密”；浏览器侧自定义加密无法防 XSS，反而增加 key rotation/协议复杂度。
11. **Custom endpoint is an SSRF boundary**：用户可控 Base URL 必须经过 server-side egress policy；默认拒绝 loopback/link-local/private/cloud-metadata 等目标与 redirect/DNS-rebinding 绕过，受控 self-hosted 地址只能由部署管理员显式 allowlist。
12. **No hidden global registry coupling**：identity-scoped Provider ID 与 Mastra framework registration key 继续分离。

## Target domain split

### 1. ProviderCatalogEntry（产品内置元数据，不是用户连接）

建议字段：

- `id`: `openrouter | openai | gemini | deepseek | ... | custom`
- `name / description / logo`
- `protocol`: initially `openai_compatible`
- `defaultBaseUrl`
- `baseUrlEditable`
- `authKind`: initially `bearer_api_key`
- `credentialProbeStrategy`
- `modelDiscoveryStrategy`
- `docsUrl / apiKeyUrl`
- `recommendedModelIds[]`（仅推荐/置顶，不自动选择）
- `capabilities`（supports model list / manual fallback 等）

Catalog 只负责 onboarding metadata；不保存用户 secret，不成为 Mastra execution registry。

### 2. ProviderConnection（持久化聚合）

保留核心真值：

- identity-scoped provider id
- catalog/template id（custom 可空或 `custom`）
- display name
- protocol
- base URL
- encrypted API credential
- default model id
- active/default/priority/version
- last successful validation timestamp / optional health summary

建议**不再把完整 `availableModels` 大 JSON 当 Provider 聚合长期真值**。OpenRouter 数百模型会不断漂移，也不应通过 PowerSync/Provider row 重复同步。

### 3. ProviderModelCatalog（动态读模型 / cache）

- live provider inventory 为 source of truth；
- server-side TTL cache（例如 10–60 min）减少反复打 `/models`；
- 可选 models.dev enrichment cache（例如 24h）；
- 返回 normalized model view：id/name/context/cost/capabilities/source；
- 只持久化用户需要的 preference（默认模型、可选 favorites/allowlist），不持久化整个世界模型目录。

## Target API

### A. Catalog

`GET /api/v1/ai/provider-catalog`

返回内置 Provider onboarding metadata。Web/Desktop 共用同一 contract，不在 Vue 内硬编码一份、server 又硬编码一份。

### B. Probe / Discover（不创建 Provider；raw Key 只上传一次）

`POST /api/v1/ai/provider-connections/probe`

Request：

```json
{
  "catalogId": "openrouter",
  "baseUrl": "https://openrouter.ai/api/v1",
  "apiKey": "<secret>"
}
```

服务端先做 endpoint/SSRF policy，再验证 credential 与发现 models。验证可继续进入 onboarding 时，将 credential 放入**短时 onboarding credential store**（优先复用 Redis；payload 仍用 AEAD 加密），生成 identity-bound、约 10 分钟 TTL、one-time handle。raw Key 不写 Provider 表，也不返回客户端。

Response：

```json
{
  "onboardingId": "opaque-short-lived-id",
  "credential": { "status": "valid" },
  "discovery": { "status": "available", "source": "provider_api" },
  "models": ["...normalized model views..."],
  "warnings": []
}
```

浏览器收到成功 response 后立即清空 API Key 输入与内存状态，后续只保留 `onboardingId`。

Custom 同一 endpoint，只是 `catalogId=custom` 且 baseUrl 必填；它必须经过与 LibreChat 等成熟项目同类的 SSRF/egress guard，而不是对任意用户 URL 做 unrestricted server-side `fetch()`。

错误分类至少区分：

- invalid_credentials (401/403)
- rate_limited
- provider_unreachable / timeout
- model_discovery_unsupported (404/405/shape unsupported; 可 manual fallback)
- provider_error

OpenRouter credential probe 优先使用 `/api/v1/key`；generic OpenAI-compatible 默认可用受认证 `/models` 作为 credential+discovery probe，但协议上不要假设所有 `/models` 都能证明 credential，需要 strategy 明确表达 certainty。

### C. Optional selected-model probe

`POST /api/v1/ai/provider-connections/test-model`

仅在需要时对**用户已经选择的 model**做小成本 chat completion，确认 selected model / account entitlement / request shape 能实际工作。UI 应明确这一步可能产生极少量模型调用费用；不应偷偷消费。

### D. Atomic commit（不再重传 raw Key）

`POST /api/v1/ai/providers`

最终创建只提交已验证 onboarding handle + 用户显式选择的模型：

```json
{
  "onboardingId": "opaque-short-lived-id",
  "name": "OpenRouter",
  "defaultModelId": "google/gemini-2.5-flash",
  "isDefault": true
}
```

服务端必须：

1. 验证 handle 属于当前 identity、未过期、未消费；
2. 读取其 catalog/baseUrl/validated credential；
3. 可选确认 `defaultModelId` 属于 probe inventory 或已通过 manual-model test；
4. 在 transaction 中写 Provider + encrypted secret + default invariant；
5. 成功后原子消费/删除 onboarding handle。

这样 raw Key 在浏览器→MemoFlow 方向只出现一次。API 命名统一 `defaultModelId`，不再让 create body 的 `model` 同时承担 onboarding input 与 persisted default semantics。

### E. Saved provider operations

- `POST /providers/:id/discover-models`：使用 server-held secret 刷新/读取目录；无需用户再次输入 Key。
- `POST /providers/:id/test-model`：测试指定 model。
- `PATCH /providers/:id`：name/base URL/key/active 等配置更新；Key 不提供则保留原值。
- `PATCH /providers/:id/default-model` 或 typed update contract：显式切换默认模型。

## UX target

### Entry screen

不再用“卡片 + Key + 连接后偷偷填 model”的 Quick Provider，也**不在 Settings 首页直接平铺一批尚未连接的默认 Provider**。

首页只承担已配置状态管理：

- 顶部：当前默认 Provider / Model 状态摘要；
- `添加 Provider` 主 CTA；
- 已连接 Provider cards/list：状态、Base URL、默认模型、上次验证、模型数（动态）、是否默认；
- 空状态只解释“添加一个模型服务”，不塞多个品牌卡片和 Key 输入框。

### Add Provider picker（参考 CC Switch / LobeChat 类目录交互）

点击 `添加 Provider` 后进入独立 drawer/dialog/full-page picker，而不是直接展开一个万能表单：

- 顶部搜索；
- searchable catalog grid/list，Provider logo + name + 简短类型（Official / Gateway / Compatible）；
- `Custom OpenAI-compatible` 固定可见且足够突出；
- Provider 数量较多时在 picker 内分类/搜索，不污染 Settings 首页；
- 选中预设后再进入 Connection step；预设只提供 metadata/default endpoint，不携带隐藏模型选择。

UI/资产优先复用成熟开源生态而不是自画品牌标识：可评估 MIT 的 `@lobehub/icons-static-svg` 作为 Vue 可直接消费的静态 AI Provider SVG 资产；交互结构参考 CC Switch/Open WebUI/LobeChat，但不复制其框架绑定 UI 代码。

### Onboarding drawer/dialog

**Step 1 — Connection**

- 内置 Provider：Base URL 默认隐藏或 Advanced 可编辑；用户主要只填 API Key。
- Custom：Name + Base URL + API Key。
- CTA：`验证并加载模型`，不是“保存/连接”。

**Step 2 — Choose model**

- 验证成功后才进入；
- 搜索 + 虚拟列表；
- 推荐模型置顶但无默认勾选；
- 可显示：free / reasoning / vision / context / input-output cost；
- OpenRouter 等超大目录可提供 provider/family/free 等 filters；
- 用户显式点一个 `设为默认模型`。

**Fallback：provider 无 `/models`**

- 明确提示“连接可达，但该服务不支持自动模型发现”；
- 展示 `手动输入 Model ID`；
- 可执行 selected-model probe 后再保存。

**Step 3 — Review & Save**

- Provider、endpoint、default model、是否设为 MemoFlow 默认 Provider；
- 可选“测试所选模型”；
- `保存并完成` 才真正落库。

## Provider catalog recommendation

Provider catalog 放在 `添加 Provider` picker 内，不放 Settings 首屏。Catalog 本身也不追求“越多越好”，第一批建议：

1. OpenRouter — aggregator / 多模型；
2. OpenAI — 官方；
3. Google Gemini — 官方 OpenAI-compatible；
4. DeepSeek — 官方 OpenAI-compatible；
5. Custom OpenAI-compatible — 永远可见。

Groq / Mistral / SiliconFlow / LiteLLM 等放 `更多 Provider`，都以 catalog metadata 形式加入，不新增 execution runtime。

## Model metadata strategy

### Provider inventory

- `/models` 决定模型是否在此 connection 下可见；
- OpenRouter 等 provider-specific response 可通过 normalization adapter读取 context/pricing；
- 修复 OpenRouter pricing：per-token → `USD / 1M` 时乘 `1_000_000`。

### models.dev enrichment

可增加 best-effort `ModelsDevCatalogGateway`：

- cache 24h；
- 通过 provider/model identity 补 context、reasoning、tool_call、structured_output、modalities、cost、status；
- enrichment 失败不能阻塞 Provider onboarding；
- provider API 数据与 models.dev 冲突时：实时 availability 以 provider inventory 为准，provider-specific serving metadata 优先于 generic metadata。

## Runtime boundary

不建议本轮把 persisted BYOK connections 全改成 Mastra global Model Router：

- MemoFlow 有 identity-scoped secret / custom Base URL / active/default / cloud+desktop contract；
- 当前 `MastraModelResolver` 已能 request-scoped 生成 `OpenAICompatibleConfig`，且避免 arbitrary user Provider ID 进入 framework registration keys；
- 替换它会把本轮 onboarding 重构扩大成 execution runtime 二次迁移，收益不足且增加风险。

建议只借鉴 Mastra Model Router 的：

- provider/model identity 思想；
- 动态 model metadata / models.dev；
- user-selectable / multi-tenant BYOK 方向。

Mastra 仍是唯一 Agent/Workflow/Memory runtime。

## Implementation decision — 2026-08-25: Secret Vault V3 + Tailscale Serve TLS

本轮不再把 Secret Vault / GCP HTTPS 留作后续债务，直接纳入 Provider V2 基线：

- **Secret Vault V3**：保留 AES-256-GCM，但密文升级为带 `key id` 的 `enc_v3:<kid>:<payload>`；active key + previous keyring 支持平滑轮换。现有 `enc_v2` 继续可读，下一次 Provider 保存/更新时自然 rewrap 到 active `enc_v3`。
- **Port abstraction**：Provider repositories 依赖最小 `ProviderSecretVault` port，而不是直接依赖某个 env cipher；默认实现仍是 env-backed AES-GCM，未来可替换 GCP/Aliyun KMS，而不改 domain/application。
- **GCP canonical TLS**：local-Docker 的 API/Web/PowerSync host publish 默认只绑定 loopback；Tailnet 远程入口由 Tailscale Serve 做 TLS termination。保持既有端口语义：API `https://gcp-dev-01.taile92a8e.ts.net:20201`、Web `https://gcp-dev-01.taile92a8e.ts.net:20200`、PowerSync `https://gcp-dev-01.taile92a8e.ts.net:20202`。
- **不占用 443 根入口**：当前 `https://gcp-dev-01.taile92a8e.ts.net/` 已由 `model-control-plane` 使用；MemoFlow 继续使用独立端口，避免破坏 ChatGPT/GCP Dev 控制面。
- **No plaintext bypass**：GCP Docker host ports 绑定 `127.0.0.1` 后，Tailnet 无法再绕过 Serve 直接命中明文 HTTP；远程验证只走 Serve HTTPS。
- GitHub App user-authorization callback 同步升级为 `https://gcp-dev-01.taile92a8e.ts.net:20201/api/auth/callback/github`；这是 GitHub App registration 的外部配置项，需与 `AUTH_BASE_URL` exact match。

## Deployment / security hardening

### Transport and browser

- **标准做法是 raw API Key 通过 HTTPS request body 传到受信任后端**；不在浏览器再造一层应用级 RSA/AES。TLS 已提供机密性/完整性/服务端身份认证；自定义前端加密无法防止页面 XSS 在加密前窃取 Key。
- 当前 GCP MagicDNS `http://...:20200` 的网络流量虽处于 Tailscale/WireGuard 私网加密隧道内，可用于 dev validation，但浏览器层仍是 HTTP；正式 production 必须 HTTPS，后续也建议把 canonical GCP validation 迁到 Tailscale Serve/HTTPS 以与生产安全语义一致。
- API Key input 使用 password/reveal pattern，禁用 spellcheck/autocorrect，避免写入 localStorage/sessionStorage/URL/query；probe 成功、cancel、dialog unmount 时主动清空 raw value。

### In-flight secret handling

- raw Key 首次只出现在 `provider-connections/probe` body 一次；成功后变成短 TTL、identity-bound、one-time `onboardingId`。
- onboarding credential store 优先复用 Redis 以支持 multi-instance；即使是 TTL 临时数据也不得以 plaintext 存 Redis，应使用 AEAD-encrypted payload，并在 commit/cancel/expiry 时删除。
- 更新已有 Provider 的 Key 也走“probe replacement credential → one-time handle → atomic swap”，而不是先 PATCH 明文再测试。
- request logger / tracing / analytics / error reporting 一律不捕获 body/header secret。当前 MemoFlow terminal request observation 已只记录 method/route/status/duration/identity，不记录 body；需要新增 `apiKey` 专项 regression lock。Nginx access log 当前也只记录 request line/status/referer/UA，不记录 body。

### At-rest secret handling

- 当前 `AISecretCipher` 的 AES-256-GCM + random IV + auth tag 方向正确，而且比仅“编码/掩码”强；Client DTO 继续只返回 masked key。
- `AI_PROVIDER_ENCRYPTION_KEY` 在 production / local-docker 的“启用 Provider 设置”路径必须进入 preflight contract；不能等用户第一次保存 key 才 500。
- 密钥必须 >=32 chars，生产随机生成；不允许 public fallback。
- 下一层可借鉴 Dify 的 tenant-aware key-provider abstraction：把当前 env-backed cipher 抽成 `ProviderSecretVaultPort`，默认 local AES-GCM，生产可接 cloud KMS/secret manager；本轮不要求先引入云 KMS。
- 需要设计 key rotation/kid，而不是永远只有一个不可轮换 `AI_PROVIDER_ENCRYPTION_KEY`；至少允许 active key + previous decrypt keys 后平滑重加密。

### Custom endpoint egress / SSRF

- Custom Provider 会导致服务端对用户 URL 发 `/models`/chat 请求，因此它是明确 SSRF boundary。
- 默认只允许 `https:` public destinations；拒绝 loopback、link-local、RFC1918/private、Unix/socket、cloud metadata IP/hostname 与非 HTTP(S) scheme。
- DNS resolve 后校验实际 IP；禁止或逐跳重新验证 redirects，防 DNS rebinding/redirect-to-private。
- 如果 self-hosted MemoFlow 的管理员确实要连内网 LiteLLM/Ollama，使用**部署级 allowlist**显式放行 host:port，不能由普通用户自己绕过。LibreChat 当前也对 user-provided baseURL 采用同类 SSRF allowlist 模型。
- discovery 设置严格 timeout、response size/model count 上限与 schema normalization，避免恶意/错误 endpoint 用超大 `/models` 响应拖垮 API。

### Output/error boundary

- model discovery cache 永不缓存 raw credential。
- Provider errors 对客户端返回 typed category，不透传原始 body/headers/key。

## Migration strategy

### Phase 0 — Contract inventory + tests first

- 锁定 current create/update/refresh/test behavior 与 Web/Desktop consumers；
- 新增 onboarding acceptance tests，不先删除旧路径。

### Phase 1 — Provider catalog SSOT

- 现有 `AI_PROVIDER_TEMPLATES` 已位于 shared contracts；本轮把它从“模板 + bootstrap defaultModel”升级为真正的 Provider Catalog SSOT；
- Web/Desktop/API 继续共用同一 catalog contract；
- 将 `defaultModel` 的隐藏 bootstrap 语义改为 `recommendedModelIds[]`，只用于 UI ranking/推荐，不自动成为用户默认选择。

### Phase 2 — Probe/discovery service + secure onboarding session

- 新增 CredentialProbePort + ProviderModelCatalogPort orchestration；
- OpenRouter dedicated `/key` credential strategy；
- generic `/models` discovery；
- Custom baseURL SSRF/egress policy；
- 新增短 TTL identity-bound onboarding credential store；raw Key probe 后不再返回/重传；
- typed failure taxonomy + manual fallback。

### Phase 3 — Model catalog normalization/cache

- 修 pricing 单位；
- Provider inventory + optional models.dev enrichment；
- 从 Provider aggregate 移除/弱化完整 `availableModels` 长期真值，避免超大 JSON stale snapshot。

### Phase 4 — Create contract V2 / atomic persistence

- create 从 `model + apiKey` 改为 `onboardingId + defaultModelId`；
- onboarding 完成后才 create；
- one-time handle 在成功 transaction 后消费；失败可安全重试且不产生半成品 Provider；
- transactional default provider invariant 保留。

### Phase 5 — Vue UX rewrite

- 删除 Quick Provider silent-model path；
- Settings 首页只显示已连接 Provider + `添加 Provider`，不平铺未配置品牌卡片；
- 新 Add Provider picker：searchable presets / Custom → Connection → Models → Review；
- Custom 也 discovery-first；
- manual model fallback；
- saved cards/refresh/switch/test 状态一致。

### Phase 6 — Desktop parity

- Desktop 使用相同 catalog/probe/commit contract；
- 确认 server-held/cloud secret 与 Desktop local BYOK 边界，不复制多余 model catalog snapshots。

### Phase 7 — Product validation

- OpenRouter real key：credential valid → discover → explicit model select → atomic save → test → chat；
- invalid key：不落库；
- Custom `/models` supported：自动发现；
- Custom `/models` unsupported：manual fallback → model test → save；
- 429 / 5xx / timeout / malformed models typed UX；
- 400+ model OpenRouter picker 性能；
- key rotation / provider edit / default change；
- MagicDNS Docker journey + required CI 全绿。

## Acceptance criteria

- [ ] Quick Provider 不再在用户不可见的情况下提交模板默认 `model`
- [ ] 首次 Provider 接入在验证/选模型前零持久化 side effect
- [ ] raw API Key 在首次 onboarding 中只从 browser 上传一次；后续选择/commit 使用短时 one-time handle
- [ ] Settings 首页不再平铺未配置 Provider；Add Provider picker 支持搜索预设 + Custom
- [ ] Custom Base URL 有 SSRF/redirect/DNS-rebinding 防护与部署级 private-address allowlist
- [ ] request/access/trace logs 有测试锁定不会捕获 `apiKey`/Authorization/body secret
- [ ] production HTTPS 为硬门槛；MagicDNS validation 的 HTTP/Tailscale 特例有明确边界
- [ ] OpenRouter Key 有 dedicated authenticated validation；无效 Key 无法保存为 connected
- [ ] OpenRouter live models 可搜索选择，用户必须显式选 default model
- [ ] Custom OpenAI-compatible 默认尝试 `/models` 自动发现
- [ ] Custom 不支持 `/models` 时有 manual model ID fallback，而不是整个接入失败
- [ ] 最终 Provider + encrypted secret + default model 原子保存
- [ ] 已保存 Provider 刷新模型无需重新输入 key
- [ ] `availableModels` 不再作为超大、易漂移的 Provider aggregate 长期真值（或有明确 TTL/cache 边界）
- [ ] OpenRouter pricing 单位修正并有 fixture test
- [ ] `AI_PROVIDER_ENCRYPTION_KEY` 缺失在 deployment/preflight 阶段暴露，不再以用户操作 500 首次发现
- [ ] Web + Desktop contracts 统一，Mastra 继续是唯一 runtime
- [ ] real OpenRouter + Custom provider product E2E 通过
- [ ] required CI / governance / MagicDNS prod-like acceptance 全绿

## Non-goals

- 不在本轮重写 Mastra Agent/Workflow/Memory runtime。
- 不引入 LiteLLM 作为 MemoFlow 必需中间层；LiteLLM 可以作为一个 Custom/OpenAI-compatible endpoint 被接入。
- 不为每个 Provider 创建独立 execution adapter，除非协议真的不同且有明确产品需求。
- 不把 models.dev 当作“用户 Key 当前能访问模型”的 authority。
