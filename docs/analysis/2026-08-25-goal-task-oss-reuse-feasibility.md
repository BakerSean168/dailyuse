---
tags:
  - analysis
  - goal
  - task
  - open-source
  - reuse
  - plugins
  - licensing
description: Goal/Task 相关成熟开源项目的维护状态、可插拔能力、许可证与 MemoFlow 直接复用/组装可行性评估
created: 2026-08-25T15:03:00+08:00
updated: 2026-08-25T15:44:00+08:00
---

# Goal / Task OSS 直接复用与可插拔可行性评估

## 1. 结论先行

成熟开源任务产品**可以大量减少 MemoFlow 的重复造轮子，但通常不能把整个应用当成 npm package 直接嵌进 MemoFlow**。

需要区分四种复用方式：

```text
A. External service / API integration
B. Use the OSS app as host + MemoFlow plugin
C. Reuse extracted libraries/packages
D. Copy/fork application source
```

推荐顺序：

```text
标准/独立 library 直接复用
> 稳定 API/service integration
> MIT 小型模块选择性复用
> clean-room 复现产品语义
> fork/copy 完整 app（最后选择）
```

MemoFlow 当前已经拥有 Goal/Task DDD、Prisma/PowerSync、HTTP/IPC parity、Task→Goal durable outbox、AI workflow 等深层基础设施，因此**不建议为了省掉 Task UI/recurrence 几百行代码，把整个 Task domain 替换成另一个产品**。最合适的是借成熟产品定义业务语义，并把真正通用、边界清晰的底层能力替换为成熟 library / API。

## 2. 维护活跃度快照（2026-08-25）

### Vikunja

状态：**非常活跃 / stable standalone product**。

证据：

- 2.4.0 于 2026-07-19 发布；
- 2026-07 仍有大量 feature / dependency PR；
- 2.4.0 新增正式 `/api/v2`，OpenAPI 3.1、PATCH、conditional requests；
- 官方 `publiccode.yml` 将 development status 标为 `stable`；
- 插件系统自 2.3.0 可用，但官方明确标注 experimental，且目前只有 backend plugin，没有 frontend plugin。

许可：核心大部分 AGPL-3.0-or-later；desktop 为 GPL-3.0-or-later。

适合 MemoFlow 借鉴：Label、filter、recurrence、task API、read model、system views。

可直接组装程度：

```text
REST API service     高
backend plugin host  中（experimental）
frontend embedding   低
source copy          不推荐（AGPL）
```

### Super Productivity

状态：**非常活跃**。

证据：

- 2026-07 仍持续发布和提交；
- 主仓库是 MIT；
- 已有正式 `packages/plugin-api`，支持 task complete hook、读写 task/project/tag、插件 UI view、plugin-owned synced data；
- 仓库自身也在抽取 `sync-core`、`sync-providers`、`shared-schema` 等 package。

这说明它是本轮最值得研究“真正可拆 package / plugin seam”的项目。

可直接组装程度：

```text
Plugin API           高（如果 Super Productivity 是 host）
MIT source reuse     中~高（需逐 package/file 审查）
把整个 app 嵌入 Vue  低（Angular/Electron/product state 强耦合）
```

### Tasks.org

状态：**非常活跃**。

证据：

- 15.8 于 2026-07 发布；
- 2026 年持续扩展桌面端、标签同步、CalDAV / Google Tasks 等；
- Compose Multiplatform 架构正在继续演进。

许可：GPL-3.0。

可复用 seam 更偏：

- CalDAV / iCalendar interoperability；
- recurrence / reminder 产品语义；
- filter UX；
- 作为外部 task client/service ecosystem 参考。

不建议直接拷贝其 Kotlin/Compose domain/UI 代码进入 MemoFlow。

### Loop Habit Tracker

状态：**维护节奏较慢但仍活跃**。

- 最近稳定 release 仍是 2.3.1（2025-08）；
- 2026-08 仍有新的 issue / feature discussion；
- 作为十年以上 habit product，其 occurrence outcome 语义具有很高参考价值。

许可：GPL-3.0-or-later。

最值得借：`unknown / yes / no / skip` 这类事实语义，而不是源码。

### Taskwarrior / TaskChampion

Taskwarrior：**成熟且仍有活跃维护/issue 处理**，release cadence 比 GUI 产品慢。

更值得 MemoFlow 关注的是其抽出的 **TaskChampion**：

- TaskChampion 明确定位为 personal task-tracking **library**；
- 提供 Rust API 和 C API；
- 负责 Taskwarrior 背后的 task storage + synchronization；
- API 遵循 semantic versioning；
- MIT license。

这是真正“可作为零件”的典型，而不是完整应用。

但 MemoFlow 已经拥有 Prisma + PowerSync + 自己的 Goal linkage / event contracts，因此现在替换成 TaskChampion 会形成第二套 storage/sync truth，不推荐。

### Leantime

状态：**活跃**。

- 2026-07 仍有 3.9.x release；
- Goal/strategy/project product 持续演进；
- 官方拥有正式 plugin development system：plugin 可增加 feature、event integration、MVC/controller/view。

许可：核心 AGPLv3；`/app/Plugins` 明确允许插件使用其他 license。

因此它适合：

```text
Leantime = host
MemoFlow extension = plugin
```

但不意味着：

```text
MemoFlow = host
直接 import Leantime Goal module
```

两个方向完全不同。

### Plane

状态：**非常活跃**，2026 夏季仍有频繁 release、issue、重构。

许可：Community repo 主体 AGPL-3.0，但当前仓库存在个别 commercial-license header 的公开争议 issue，若未来直接复用具体文件必须逐文件确认 SPDX/license。

它适合参考：workflow state、list/board UX、label/state separation；不适合直接嵌入 MemoFlow 的个人 task domain。

## 3. “可插拔”其实有四种完全不同的含义

## 3.1 把成熟产品当独立服务（API composition）

例如：

```text
MemoFlow UI / AI
  -> TaskPort
  -> Vikunja API v2
  -> Vikunja DB
```

技术上完全可行。Vikunja 2.4 已有稳定 OpenAPI 3.1 API，可生成 client SDK。

优点：

- Task CRUD / labels / recurrence / permissions / migrations 大量能力直接获得；
- 独立服务自己维护数据库和升级；
- MemoFlow 不复制 AGPL source，只通过 network API 集成时，许可评估边界比直接复制代码清晰（仍应在正式商业分发前做法律审查）。

代价：

- MemoFlow 失去 Task aggregate 的本地一致性控制；
- PowerSync/offline-first 要重新设计；
- Task→Goal outbox 需要跨服务 webhook/outbox/inbox；
- identity/auth 双轨；
- TaskPlan/GoalContribution/Missed semantics 必须受 Vikunja model 限制或在 MemoFlow 旁路扩展；
- Desktop HTTP/IPC parity 不再自然成立。

结论：**如果 MemoFlow 从零做 Task，这条值得认真 PoC；现在已经不是最佳替换点。**

## 3.2 让成熟 App 做 Host，MemoFlow 写 Plugin

Super Productivity 和 Leantime 都是真实案例。

例如：

```text
Super Productivity
  + MemoFlow Goal Contribution Plugin
  + MemoFlow AI integration
```

Super Productivity plugin API 已支持 task completion hook、task/tag/project read/write 和 plugin UI，因此理论上可以把 MemoFlow 的某些 Goal integration 做成插件。

这种模式适合：

> “我真正想要的是 Super Productivity + 一些 MemoFlow 功能。”

不适合当前目标：

> “MemoFlow 是自己的 local-first personal system，Task/Goal/Reminder/AI 共用同一领域和 host。”

因为这等于重新选择产品 shell，而不是“给 MemoFlow 装一个 Task 插件”。

## 3.3 复用独立 Library / Package

这是 **MemoFlow 最应该积极做的方向**。

理想候选满足：

1. 独立 package；
2. 输入/输出边界清楚；
3. 不拥有 MemoFlow business truth；
4. permissive license 优先；
5. 可被 adapter 包起来；
6. 可以用 MemoFlow contract tests 锁行为。

例子：

### TaskChampion

真正 extracted personal task storage/sync library，MIT。

当前不替换 PowerSync，但它证明成熟项目可以把复杂内核抽成稳定 library。

### iCalendar / recurrence libraries

例如 `ical.js` 提供 RFC 5545 recurrence/ICS parser/iterator，MPL-2.0；`@breejs/later` 提供 recurrence schedule calculation，MIT。

MemoFlow 可以评估：

```text
自己的 RecurrenceRule domain
       |
       v
RecurrenceEnginePort
       |
       +-- current implementation
       +-- ical.js / RFC5545 adapter
```

这样可以让“每月最后一天、例外日期、复杂 RRULE”等时间算法不再自行实现，同时 ADR-037 的产品时间语义仍由 MemoFlow 拥有。

注意：不要让第三方 library DTO 泄漏到 contracts；library 只能是 infrastructure/policy engine。

### UI primitive / headless libraries

MemoFlow 当前已经采用 Reka UI + shadcn-vue，这正是正确的“组装”方式：

```text
成熟 accessibility/headless primitives
+ MemoFlow 自己的业务 component
```

而不是复制 Vikunja/Super Productivity 整个 TaskCard。

## 3.4 Fork / Copy 整个 App 或源码模块

技术上最直接，但长期通常最贵。

问题：

- upstream 每次升级都要 merge；
- app-level code 往往绑死 framework/state/router/db；
- 领域命名不同，adapter 比重写还复杂；
- GPL/AGPL 需要认真处理衍生作品和分发/网络提供服务义务；
- 产品中会留下第二套模型和 UI style。

只在下面情况考虑：

> 外部产品已经满足 80~90% MemoFlow 核心需求，而且愿意让它成为新的 host / source of truth。

目前 Goal/Task vNext 不满足这个条件。

## 4. MemoFlow 具体应该“借什么，不借什么”

### 4.1 推荐直接复用 / 引入 adapter 的能力

优先评估：

- RFC 5545 recurrence / exception calculation；
- ICS / CalDAV interoperability；
- 通用日期解析与 recurrence validation；
- headless UI primitives、virtual list、command/search primitives；
- OpenAPI-generated clients（对未来 integration）；
- 通用 sync/storage library仅在未来替换 PowerSync 时单独评估。

### 4.2 推荐学习但自己保持领域所有权

必须继续由 MemoFlow 定义：

- Goal / KR measurement；
- TaskOccurrence `Pending/Completed/Missed/Skipped`；
- Task Plan completion policy；
- GoalLink vs GoalContribution；
- EachCompletion / PlanCompletion；
- GoalRecord provenance；
- Task→Goal reliable delivery；
- Shared Label 跨 Goal/Task 的 identity scope；
- AI workflow / review / approval。

原因不是“喜欢自己写”，而是这些就是 MemoFlow 的产品差异化和跨模块 business truth。

### 4.3 不推荐复用的 app-level 资产

- Angular/Vue/Compose 整页 Task UI；
- 对方 database schema；
- 对方 auth/account model；
- 对方 project/folder hierarchy；
- copyleft domain source；
- 同时引入第二套 task state store / offline engine。

## 5. 一个可执行的 Build / Borrow / Integrate Gate

每次实施一个 Goal/Task 子能力前，先回答：

```text
1. 这是 MemoFlow 差异化业务规则吗？
   Yes -> MemoFlow owns domain semantics.

2. 这是标准算法/协议吗？
   Yes -> 优先成熟 library / standard adapter.

3. 已有产品是否提供稳定 network API？
   Yes -> 若允许外部 source of truth，做 service PoC.

4. 只有 app-level source 可用吗？
   Yes -> 先看 license + framework coupling；默认学习行为而非复制。

5. 上游是否活跃？API 是否 semver/stable？
   No -> 除非很小且可 vendor，否则不引入关键路径。
```

## 6. 对本轮 Goal / Task vNext 的建议

### 立即继续自己实现

- ADR-053~057 的 domain contracts；
- Goal/KR/Task/Contribution 的跨模块语义；
- Shared Label registry 与 Goal/Task assignment；
- instance-first UI composition。

### Phase 0 增加两个复用 spike

#### Spike A — Recurrence engine

对比：

```text
current recurrence engine
vs RFC5545/ical.js adapter
vs @breejs/later
```

用 MemoFlow fixtures 验证：

- daily / weekly / monthly / yearly；
- N occurrences；
- end date；
- DST；
- timezone；
- excluded occurrence；
- deterministic occurrence key。

若 mature library 明显减少自有算法面，则引入 adapter；否则保留当前 engine。

#### Spike B — Super Productivity plugin/package seam

不替换 Task domain，只回答：

- 哪些 `packages/*` 是 framework-independent + MIT；
- recurrence / shared-schema / plugin-api 是否存在值得借的实现；
- 是否有小型 utility 可以合法、低耦合复用。

没有明确收益则不引入。

## 7. 最终原则

MemoFlow 不应该走两个极端：

```text
极端 A：所有东西都自己造
极端 B：看到成熟 App 就把整套塞进来
```

更好的方式是：

```text
产品语义由 MemoFlow 拥有
标准算法交给成熟 library
外部系统通过 API/plugin seam 集成
UI 用 headless primitives 组装
copyleft app source 主要作为行为参考
```

这才是真正可维护的“用开源组装产品”，而不是把多个完整产品粘在一起。

## 7.1 决策升级：标准能力默认 Borrow，App 级项目默认 Borrow semantics

2026-08-25 本轮确认后，本研究结论提升为正式 ADR-058，并进一步收敛为两条不同的默认策略：

### 对标准问题

```text
算法 / 协议 / primitive
-> 先找成熟 library
-> 用 MemoFlow port/adapter 包裹
-> 用 MemoFlow contract tests 锁行为
-> 没有合适依赖时再 Build
```

不再把“当前仓库已经有一份实现”视为继续自研的充分理由。若成熟库在 correctness、维护、标准兼容和测试覆盖上明显更优，应优先替换算法实现，同时保持 MemoFlow contract 不变。

### 对成熟完整 App

默认不是复制源码，而是系统性学习：

```text
business semantics
state machine
information architecture
interaction details
schema / projection
API / plugin boundary
characterization / integration tests
failure / retry / migration / upgrade behavior
```

这些内容经 MemoFlow 自己的 ADR/contracts/tests 重新表达。只有当 upstream 提供稳定 API/plugin seam，并且让它成为外部 source of truth 的收益明确大于 integration cost 时，才升级为 Integrate。

这意味着“参考开源项目”在后续 review 中不能只附几个 UI 截图或文案；必须尽可能追到业务状态、数据模型、关键源码边界和测试。

正式规则见 [ADR-058](../architecture/adr/ADR-058-oss-first-standard-capability-reuse.md)。

## 8. 主要外部资料

- Vikunja API v2: https://vikunja.io/docs/api-v2/
- Vikunja Plugins: https://vikunja.io/docs/plugins/
- Super Productivity Plugin API: https://github.com/super-productivity/super-productivity/tree/master/packages/plugin-api
- Tasks.org: https://github.com/tasks/tasks
- Loop Habit Tracker: https://github.com/iSoron/uhabits
- TaskChampion: https://github.com/GothenburgBitFactory/taskchampion
- Leantime Plugin Development: https://docs.leantime.io/development/plugin-development
- Plane: https://github.com/makeplane/plane
- ical.js: https://github.com/kewisch/ical.js
- @breejs/later: https://github.com/breejs/later
