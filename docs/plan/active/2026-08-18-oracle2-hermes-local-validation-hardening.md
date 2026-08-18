# Oracle2 / Hermes2 本地部署与产品流验证加固计划

> 状态：实施中  
> 日期：2026-08-18  
> 基线：`def2b2cd88c73c880f9f2c2fcf55c109a8728103`  
> 范围：Test System V2、local-docker prod-like 验收、Tailscale MagicDNS 公网面配置。  
> 非范围：ADR-049 全应用 219 个历史 failure-contract finding 的本轮清零；该工作继续由 application-contract-refactor 主计划负责。

## 1. 目标

在开发主机迁回 Oracle2 / Hermes2 后，建立一条可重复、可审计的验证链：

1. 代码级 Auth / HTTP / Web / governance 验证先于人工验收；
2. required Web Flow 覆盖真实注册、邮箱验证、登出、再次登录、错误密码与密码恢复；
3. prod-like Docker 验收继续验证业务主旅程，并显式加入关键 Auth 产品流；
4. local-docker 的公开 Web、API/Auth、PowerSync URL 可通过 `.env.local` 切换到 Tailscale MagicDNS；
5. API BetterAuth trusted origins 与 AI CORS 自动包含公开 Web origin；
6. Docker Playwright 使用实际公开 URL，而不是无条件回退 `127.0.0.1`，从而验证用户最终访问的网络路径；
7. 验收镜像必须来自 clean Git revision，并通过 `validate-local-deploy` 证据收集。

## 2. 审计基线

### 2.1 已确认有效

- Test System V2 inventory / ruleset / Oracle 聚合均可运行；
- `main` required checks 包含 Governance / Validate / Boundary / Integration / Web Flow / Coverage / Performance / Delivery Observation Oracle；
- Web Flow 共 74 个测试，Auth required specs 覆盖注册、验证、登录、错误密码、OAuth 入口、密码重置；
- local-docker A-E 产品旅程使用真实 UI 注册 + 捕获验证链接 + authenticated shell；
- Docker API/Web/AI/PowerSync 已绑定主机端口，Oracle2 MagicDNS 可到达现有 Web/API 端口。

### 2.2 本轮必须修复的缺口

1. `MEMOFLOW_WEB_URL` 的 MagicDNS origin 未自动加入 API/AI allowlist；
2. 机器级 `POWERSYNC_URL` 会被 local-compose 强制覆盖回 `localhost`；
3. local-docker Playwright 无条件使用 `127.0.0.1`，没有验证公开 URL 路径；
4. prod-like Docker suite 没有显式跑 logout/re-login、wrong-password、password-reset 等 Auth 关键流；
5. required Dashboard Web Flow 仍通过通用 `login()` 的 UI-message fallback 隐式注册测试用户，fixture 前置条件不够确定；
6. Oracle2 单 worker 全量 Web Flow 暴露 scheduler crash-leftover lease：宿主首次抢占失败后永久停留 read-model，无法在 lease 到期后自动接管；
7. Settings 主题持久化测试在长时间套件中可能在 settings hydration 完成前打开 Select，造成瞬时关闭与假失败；
8. Vite 端口被其他网卡/容器占用时会自动漂移到下一端口，而 Playwright 继续等待原端口，失败反馈过慢。

### 2.3 本轮不假装完成的结构性债务

ADR-049 仍在实施。当前 failure-contract inventory 仍有 219 个历史 finding：

- 51 `DOMAIN_ERROR_SUBCLASS`
- 54 `FAILURE_MESSAGE_BRANCH`
- 6 `PROVIDER_CODE_LEAKAGE`
- 26 `RAW_RESULT_MESSAGE_RETHROW`
- 82 `UI_RAW_RESULT_MESSAGE`

治理已对“新增 finding” fail closed，但历史 finding 尚未清零，因此不能宣称全应用错误契约重构完成。

## 3. 实施批次

### O2V-01 — Machine-public URL closure

- 保留显式机器级 `POWERSYNC_URL`；
- 将 `MEMOFLOW_WEB_URL` 规范化为 origin，并加入 API/AI allowlist；
- 提供纯函数测试 MagicDNS URL、默认 localhost 与 browser validation origins。

验收：Node governance tests 全绿，MagicDNS 模拟 env 输出与预期一致。

### O2V-02 — Prod-like browser path

- local-docker Playwright 的 Web origin 使用 `MEMOFLOW_WEB_URL`；
- API origin 从 `AUTH_BASE_URL` 取 origin；
- 默认无机器覆盖时行为保持 localhost/隔离端口兼容。

验收：Playwright 实际访问 URL 与容器 public runtime config 一致。

### O2V-03 — Auth Docker acceptance

在 local-docker 配置中加入：

- `authentication/auth-flow.spec.ts`
- `authentication/auth-login.spec.ts`
- `authentication/auth-register.spec.ts`
- `authentication/auth-password.spec.ts`

同时 required Dashboard flow 改为显式 `registerAndLogin()`，不再依赖 UI message 猜测 fixture 是否存在。

验收：本地 Docker Auth + A-E 产品流全绿。

### O2V-03B — Long-suite determinism

- Vite WebServer 使用 `--strictPort`，端口冲突立即失败；
- Schedule standby host 在 lease 未获取时周期重试，并在 crash-leftover lease 到期后自动 promotion；
- Prisma lease 唯一约束竞争 `P2002` 按正常 `not acquired` 处理，不作为基础设施异常；
- Settings persistence 测试在 reset 后等待 settings GET hydration，再进行 Select 交互。

验收：Schedule lease/runtime 单测、Settings focused E2E 与 required Web Flow 全绿。

### O2V-04 — Oracle2 deployment evidence

Oracle2 `.env.local` 使用：

- `AUTH_BASE_URL=http://oracle.taile92a8e.ts.net:<api>/api/auth`
- `MEMOFLOW_WEB_URL=http://oracle.taile92a8e.ts.net:<web>`
- `POWERSYNC_URL=http://oracle.taile92a8e.ts.net:<powersync>`

然后：

1. clean revision 重建 Docker；
2. 校验所有容器 healthy；
3. 校验 OCI revision == Git HEAD；
4. 运行 local-docker Playwright；
5. 运行 `validate-local-deploy`；
6. 从 MagicDNS URL 发起浏览器注册 / 验证 / 登录产品流；
7. 保留 stack 供人工验收。

### O2V-05 — Hermes2 parity

在 Hermes2 连接可用后重复 O2V-04，不复用 Oracle2 的端口假设或环境文件。

阻塞条件：Hermes2 必须出现在可用控制通道或 Tailnet/SSH 可达节点中。当前 Oracle2 的 `tailscale status` 与 SSH 配置均未发现 Hermes2，因此本批次在连接恢复前不得伪造为已验证。

## 4. 验证矩阵

| 层级                 | 命令 / 证据                                                  | Gate                    |
| -------------------- | ------------------------------------------------------------ | ----------------------- |
| Failure governance   | `pnpm nx run memoflow:governance-check --skip-nx-cache`      | PASS                    |
| Auth unit            | `pnpm nx run cloud-auth:test --skip-nx-cache`                | PASS                    |
| Web unit             | `pnpm nx run web:test --skip-nx-cache`                       | PASS                    |
| Required Web Flow    | `pnpm exec playwright test --config=playwright.config.ts`    | 74/74                   |
| Local compose tests  | `node --test tools/docker/local-compose.env-shadow.spec.mjs` | PASS                    |
| Local Docker runtime | `pnpm docker:local:ps`                                       | all healthy             |
| Docker product/Auth  | `pnpm nx run web:e2e:local-docker`                           | PASS                    |
| Deployment evidence  | validate-local-deploy skill runner                           | PASS                    |
| MagicDNS             | Browser + HTTP probes to `oracle.taile92a8e.ts.net`          | PASS                    |
| Hermes2              | same matrix on Hermes2                                       | BLOCKED until reachable |

## 5. 回滚

- `.env.local` / `.env.test.local` 均为机器文件，不提交；删除即可恢复默认 localhost；
- source change 保持纯配置解析与测试范围，不改 DB schema、Auth storage 或业务 API；
- Docker 回滚使用上一个 clean image revision，禁止保留 `-dirty` 镜像作为验收证据。
