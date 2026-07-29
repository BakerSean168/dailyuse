# 服务端 Deepening 执行总览

> 创建时间: 2026-05-06
> 状态: 已完成，归档
> 来源: [Codebase Architecture Deepening 审查与后续计划](./2026-05-06-codebase-architecture-deepening-audit.md)
> 范围: `repository`、`goal`、`ai` 三个服务端模块的剩余 deepening 工作
> 归档说明：本轮服务端 deepening 已完成并通过测试收口，本文仅保留为历史总览。

## 文档定位

本文件不是新的审查报告，而是服务端剩余 deepening 项的执行总览。

它解决的问题是：

1. 把已有审查结论转成可直接分派的实施文档
2. 固定执行顺序、提交边界和统一验收标准
3. 避免多个 AI 在不同模块上重复做“先想怎么拆”的工作

配套执行文档如下：

- [repository resource mutation deepening](./2026-05-06-repository-resource-mutation-deepening.md)
- [goal read-model workflow deepening](./2026-05-06-goal-read-model-workflow-deepening.md)
- [ai runtime module split](./2026-05-06-ai-runtime-module-split.md)

## 总目标

本轮服务端 deepening 的统一目标不是“增加一层抽象”，而是把当前散落在 composition root、controller、mega-assembly 里的 implementation 收回到更深的 application module 中。

统一成功标准：

- route path 不变
- controller 对外方法名不变
- contracts wire shape 不变
- route contract spec 继续通过
- 新的 workflow seam 拥有独立测试面
- 删除旧 helper 后，复杂度集中到更少的 module 中，而不是换地方堆积

## 执行顺序

固定顺序如下：

1. `repository`
2. `goal`
3. `ai`

原因：

- `repository` 当前最典型地把 implementation 留在 composition root 中，适合作为服务端 deepening 的第二个样板
- `goal` 的问题集中在 controller orchestration，适合在 `repository` 之后再做，形成“composition root 收口”和“controller 收口”两类样板
- `ai` 的改造面最大，涉及 runtime mode、capability descriptor 和 optional dependency matrix，应该最后处理

## 并行与提交边界

允许并行分析，不允许混合提交。

固定规则：

- 一个模块一个提交
- 不在同一提交中同时修改 `repository`、`goal`、`ai`
- 每个模块文档都要单独落地、单独验证、单独提交
- 若某模块实施中发现需要额外 contracts 调整，只允许做该模块最小必要修改，不顺手扩大到其他模块

推荐提交顺序：

1. `repository`
2. `goal`
3. `ai`

## 统一约束

### 1. 对外接口保持稳定

本轮默认不修改：

- HTTP route path
- IPC channel shape
- controller public method name
- contracts response envelope
- caller 侧使用方式

如果某处现有接口明显不合理，也先保持稳定，把 deepening 限定在内部 seam。

### 2. 新 seam 必须是真正的 workflow seam

不接受以下伪 deepening：

- 只把一段逻辑搬到同名 helper 函数
- 继续让 composition root / controller 负责 orchestration，只把细枝末节抽出去
- 新 module 只是转发底层 use case，没有集中新的 locality

通过标准是 deletion test：

- 删掉新 module 后，复杂度会重新扩散到多个 caller
- 而不是 caller 只多写几行透传代码

### 3. 测试分层固定

每个模块都要同时保留两类测试：

- route contract spec：保护 public seam
- workflow seam spec：保护新 deep module

不允许只靠 route spec 间接覆盖 deepening 后的核心实现。

## 每个模块文档的最低交付内容

每份执行文档必须明确：

1. 当前问题具体落在哪里
2. 要新增哪些 module / service / use case
3. 每个新 seam 的职责边界
4. 哪些旧 helper / controller logic / assembly logic 要删除或收口
5. 哪些 public contract 明确不能动
6. 需要新增哪些测试
7. 最小验证命令

## 实施后统一验收

每个模块完成后都必须满足：

- 相关模块 `typecheck` 通过
- 相关模块 `test` 通过
- 文档改动后 `pnpm nx run memoflow:governance-check` 通过

模块级最小验证：

- `repository`: `pnpm nx run repository:test`
- `goal`: `pnpm nx run goal:test`
- `ai`: `pnpm nx run ai:test`

## 非目标

本轮明确不做：

- 前端 workspace seam deepening
- `transport-handlers` 折叠
- contracts public seam 收窄
- route contract test helper 共享化
- 新一轮全仓 contracts sweep

这些内容仍然属于后续波次，但不并入本轮服务端 deepening 文档。
