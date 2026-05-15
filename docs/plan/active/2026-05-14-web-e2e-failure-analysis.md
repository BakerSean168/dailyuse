---
tags:
  - plan
  - active
  - web
  - e2e
  - testing
description: 当前 web:e2e 剩余 6 个失败用例的原因分析与优雅修复方案
created: 2026-05-14T00:00:00
updated: 2026-05-14T00:00:00
status: active
---

# Web E2E 剩余失败用例分析与修复方案

## 文档定位

这份文档只覆盖当前 `web:e2e` 仍未通过的 6 个失败用例，不回顾已经完成的基础设施修复，也不重复已解决的 dashboard / settings / goal / reminder heading 问题。

目标不是记录“本轮改了什么”，而是把当前失败的：

- 现象
- 证据
- 根因判断
- 优雅修法
- 验证闭环

收敛成下一轮可直接执行的 active plan。

## 当前真值（基于 2026-05-14 代码与现有失败信息）

当前 `web-flow` 基础设施链路已经恢复正常：

- API 可以正常启动
- 模块加载错误已消失
- CORS 配置已对齐 E2E origin

因此当前剩余失败不再是“测试环境起不来”，而是三类更具体的问题：

1. AI goal workflow 的 E2E mock 与真实 HTTP adapter 契约不一致
2. reminder template CRUD 的 dialog 可测性契约在共享 UI 层丢失
3. task template edit 仍需要用新的 focused loop 验证 payload 归一化是否真正消除了 `422`

## 失败清单

当前剩余 6 个失败用例为：

1. `apps/web/e2e/ai/goal-workflow.spec.ts`
2. `apps/web/e2e/reminder/reminder-template-crud.spec.ts` 的 create
3. `apps/web/e2e/reminder/reminder-template-crud.spec.ts` 的 edit
4. `apps/web/e2e/reminder/reminder-template-crud.spec.ts` 的 delete
5. `apps/web/e2e/reminder/reminder-template-crud.spec.ts` 的 detail
6. `apps/web/e2e/task/task-template-crud.spec.ts` 的 edit

这些失败不是同一种问题，不能用统一的“等一等”“放宽 timeout”“继续补 test id”处理。

## 详细分析

### 1. AI goal-workflow

#### 现象

失败症状是：

- `page.getByTestId('ai-chat-composer')` 一直处于 disabled
- `toBeEnabled()` 超时
- 目标工作流根本还没开始，失败卡在 composer 可发送前置条件

#### 证据链

从当前实现可以确认：

- `AIChatView.vue` 中 `canSendMessage` 依赖：
  - `modelSelection.canSendMessage.value`
  - `selectedModel.value !== null`
  - `!chatLoading.value`
- `useAIModelSelection.ts` 中 `canSendMessage` 的真值来源是：
  - `allModelOptions.value.length > 0`
- `allModelOptions` 来自 provider 列表
- provider 列表由 `useAI.ts -> loadProviders()` 加载
- `loadProviders()` 调用 `service.listProviders()`
- Web 端真实实现最终走到 `AIProviderConfigHttpAdapter.getProviders()`

关键点在于：

- `AIProviderConfigHttpAdapter.getProviders()` 的逻辑是：
  - 先 `unwrapResultOrThrow(result)`
  - 再读取 `.data`
- 也就是它期望的 transport 形状是：
  - `Result<{ data: AIProviderConfigClientDTO[] }>`

但当前 E2E mock 写法是：

- `/api/v1/ai/providers` 返回 `Result<Provider[]>`

结果就是：

- adapter 解包后拿到的是数组本身
- 再读取 `.data` 得到 `undefined`
- `loadProviders()` 中 `Array.isArray(nextProviders)` 为 `false`
- `providers.value` 被设成空数组
- 没有 model options
- composer 永远 disabled

这条证据链已经足够说明：当前失败首先是测试 mock 契约错误，不是产品逻辑错误。

#### 根因判断

根因是：

- `goal-workflow.spec.ts` 的 providers mock 没跟真实 HTTP adapter 契约对齐

不是：

- act 环境特有的动态 import 静默失败
- `AIChatView` 的状态机逻辑错误
- provider 懒加载本身不稳定

这些都可以在当前证据下排除或至少降级。

#### 优雅修法

优雅修法是：

- 只修 E2E providers mock 的响应体形状
- 让它匹配真实 adapter 已经稳定存在的 transport contract

具体要求：

- `/api/v1/ai/providers` mock 返回：
  - `ok: true`
  - `data: { data: [provider] }`

不应做的事：

- 不要为了这个 E2E 去修改 `AIChatView` 的 enable 逻辑
- 不要在产品代码里对 provider 空数组加测试特供 fallback
- 不要把“无 provider 也允许发送”作为临时通道

#### 验证闭环

focused 验证顺序应为：

1. 运行 `apps/web/e2e/ai/goal-workflow.spec.ts`
2. 确认 composer 在页面稳定后可用
3. 确认后续 `clarification -> draft -> confirm -> result` 链路继续通过

如果 providers mock 修正后仍失败，下一步才值得检查是否存在第二个 mock contract mismatch。

### 2. reminder-template-crud（4 个失败）

#### 现象

共享现象是：

- 点击 `create-reminder-template-button` 后
- `getByTestId('reminder-template-dialog')` 一直找不到
- create 失败后，edit / delete / detail 全部被连带拖死

这 4 个用例的失败入口虽然不同，但当前最强根因是同一个。

#### 证据链

当前 reminder 相关实现已经提供了足够稳定的测试入口：

- `TemplateDialog.vue`
  - `data-testid="reminder-template-dialog"`
  - `data-testid="reminder-template-title-input"`
  - `data-testid="reminder-template-description-input"`
  - `data-testid="reminder-template-save-button"`
- `ReminderLinearView.vue`
  - `data-testid="create-reminder-template-button"`
- `GridTemplateItem.vue`
  - `data-testid="reminder-template-card"`
  - `data-reminder-id`

所以如果 dialog 根本找不到，第一怀疑对象不应是 reminder 页面没暴露 test id，而应是这些 attr 没有真的落到 DOM。

共享 UI 层当前实现进一步印证了这个判断：

- `packages/ui-vue-shadcn/src/components/ui/dialog/DialogContent.vue`
  - 只把 `props` 交给 `useForwardPropsEmits`
  - 模板里没有 `v-bind="$attrs"`
- 该组件自身又包了一层 `DialogPortal + DialogOverlay + DialogContent`
- 对于 `data-testid` 这类非 prop attrs，Vue 会把它们视为 extraneous attrs
- 在 teleport / fragment root 场景下，这类 attrs 很容易被吞掉而不是自动落到内层真实节点

这和之前 trace 里出现过的 Vue warning 模式是一致的：

- 非 prop attrs 传给 fragment / teleport root
- 最终不会成为真实 DOM 上的测试钩子

因此：

- reminder dialog 很可能已经打开
- 但 `reminder-template-dialog` 这个稳定测试入口被共享 Dialog 包装器吞掉了

此外，当前 reminder E2E 内部还有第二层不优雅点：

- create / edit 流程仍在用英文 label text 选 title / description / done button
- 而组件已经提供了稳定 `data-testid`

也就是说，这组问题不是“单测没写 test id”，而是：

1. 共享 dialog attr forwarding 断裂
2. reminder E2E 仍依赖脆弱的文案选择器

#### 根因判断

这 4 个失败的主根因是：

- 共享 `DialogContent` 包装器没有保留 reminder dialog 的 `data-testid`

次根因是：

- reminder E2E 没充分使用现有稳定 test id，而是依赖英文文案

当前没有证据支持以下判断：

- `templateDialogRef` 在 act 环境下经常为 null
- `openForCreate()` 本身是主要失败点
- reminder 页面必须加更多 reminder-specific workaround 才能测

`ref` 时序问题不能完全排除，但在当前证据排序里不应排第一。

#### 优雅修法

优雅修法必须分两层做：

第一层，修共享 UI 根因：

- 修改 `ui-vue-shadcn` 的 `DialogContent.vue`
- 同步修改 `DialogScrollContent.vue`
- 让 `data-testid`、`aria-*` 和其他非 prop attrs 确实转发到最终渲染的 dialog content DOM 节点

第二层，修 reminder E2E 的脆弱 locator：

- `apps/web/e2e/reminder/reminder-template-crud.spec.ts` 改为优先使用：
  - `reminder-template-dialog`
  - `reminder-template-title-input`
  - `reminder-template-description-input`
  - `reminder-template-save-button`
- detail / delete 可以继续保留真实可访问性契约上的 role-based selector
- 但不再以英文 title / button 文案作为主入口

不应做的事：

- 不要只在 reminder 页面局部增加一次性 workaround
- 不要继续围绕 `dialog name` 和英文 label 堆更多 fallback selector
- 不要把共享 attr 丢失的问题留在 UI 层继续潜伏

#### 验证闭环

验证应分两步：

1. 共享 UI regression
   - 为 dialog 包装器补一个最小测试
   - 明确证明 `data-testid` 最终存在于真实 dialog DOM 上
2. focused reminder E2E
   - 运行 `apps/web/e2e/reminder/reminder-template-crud.spec.ts`
   - 确认 create / edit / delete / detail 4 条全部恢复

### 3. task-template-crud edit

#### 现象

当前失败表现是：

- 编辑任务模板后点击保存
- 对话框没有关闭
- `toBeHidden()` 超时

之前已经抓到过更强的底层症状：

- `PATCH /task-templates/:id` 返回 `422`

这比单纯的 UI 没关闭更关键，因为它说明前端保存动作在 API 边界就失败了。

#### 证据链

已有 trace 证据表明，之前的 update payload 中：

- `timeConfig.timePoint` 以 `undefined` 的形式落到后端校验链
- 后端 schema 明确要求：
  - `timePoint` 为 `number | null`
  - `timeRange` 为对象或 `null`
  - `startDate` 为 `number | null`

contracts 中当前真值也支持这个判断：

- `TaskTimeConfigSchema`
  - `startDate: z.number().int().nullable()`
  - `timePoint: z.number().int().nullable()`
  - `timeRange: ... nullable().optional()`

之前前端 view model 带有额外表现层字段：

- `displayText`

如果直接把 view model 的 `timeConfig` 下发到 API，很容易出现：

- `displayText` 泄漏
- nullable 字段没有被归一化成 `null`
- Vue proxy / sanitize 边界把 `undefined` 带进请求

当前 `TaskManagementView.vue` 已经新增：

- `toTimeConfigPayload(template)`

并且实现逻辑已经显式收口为：

- `timeType`
- `startDate`
- `timePoint`
- `timeRange`

其中：

- 非当前时间类型的字段会被显式设成 `null`

这说明：

- 针对最初 `422` 的第一轮产品修复已经做了
- 当前剩余未知点不是“有没有修”，而是“这轮修复是否已经完全消掉 outbound payload 问题”

#### 根因判断

当前最合理判断是：

- 这是一个真实产品 bug，而不是纯测试问题
- 该 bug 的主修复已经进入代码，但尚未用新的 focused loop 完成最终验收

现阶段不应再凭猜测继续改产品代码，因为：

- 最新的 `toTimeConfigPayload()` 可能已经足够
- 如果现在继续补丁式修改，只会在没有新证据的情况下扩大变更面

#### 优雅修法

这条链的优雅修法不是立刻继续写代码，而是：

1. 先用 focused task CRUD 重新跑一次
2. 如果通过，说明当前产品修复已经闭环，剩下只需保留 E2E 选择器对齐
3. 如果仍 `422`，再抓取新的 PATCH body 和响应体
4. 仅针对新的真实差异做第二次 payload 修复

可接受的后续修复方向应当是：

- 修 serializer / payload normalization seam
- 修 API contract 对齐

不应做的事：

- 不要靠延长 timeout 掩盖保存失败
- 不要在 E2E 里删掉“dialog closes”这个用户态断言
- 不要在没有新 trace 的情况下继续猜测是不是 `sanitizeForIpc()`、是不是别的字段泄漏

#### 验证闭环

focused 验证步骤：

1. 运行 `apps/web/e2e/task/task-template-crud.spec.ts`
2. 如果通过：
   - 保持当前 `TaskManagementView.vue` 修复
   - 不再追加 task 产品修改
3. 如果失败：
   - 抓 fresh trace
   - 核对 PATCH body
   - 核对 `422` 具体 detail
   - 仅修实际仍未归一化的字段

## 推荐修复顺序

推荐顺序如下：

1. 先修 shared dialog attr forwarding
2. 再修 reminder CRUD E2E locator
3. 然后修 AI providers mock contract
4. 再重新验证 task edit 当前产品修复
5. 最后跑 full `web:e2e`

排序理由：

- reminder 一条共享根因可同时释放 4 个失败
- AI 当前是低变更面的 stale-test contract 修复
- task edit 已有产品修复，不应在没有 fresh evidence 的情况下继续盲改

## 验证计划

建议按以下顺序验证：

1. `apps/web/e2e/reminder/reminder-template-crud.spec.ts`
2. `apps/web/e2e/ai/goal-workflow.spec.ts`
3. `apps/web/e2e/task/task-template-crud.spec.ts`
4. `pnpm nx run web:e2e`

验收标准：

- reminder 4 个 CRUD / detail 用例全部恢复，且不再依赖英文文案 selector
- AI composer 可以启用，goal workflow 全链路可跑通
- task edit 点击保存后对话框关闭，且不存在 `422`
- full `web:e2e` 通过

## Assumptions

- 本文默认 dashboard / settings / goal / reminder heading 等已修复问题不再进入本轮 active 范围
- AI goal-workflow 当前首先被视为 mock contract bug，而不是产品 bug
- reminder 优先采用共享 UI 根因修复，不接受 reminder-only workaround 作为首选方案
- task edit 当前被视为“已修但待 fresh verification”的产品问题，不做无证据追加改动
