# 存在问题分析

我仔细梳理了现在的架构（尤其是结合了 Electron 环境和后端 Server 环境后），当前的流程其实有些“碎片化”和“多头并行”。我为你详细剖析一下：

1. 系统中存在“两个不同的环境”
首先必须明确，这个项目目前有两种运行模式：

Web 端 (apps/web): 运行在普通浏览器里，通过 HTTP 和 SSE (Server-Sent Events) 与后端的 apps/api 通信。
桌面端 (apps/desktop): 这是一个包含“主进程 (Main)”和“渲染进程 (Renderer)”的 Electron 应用。在你的桌面端代码中，前端页面使用的是和 Web 端类似的逻辑。
2. 通信机制：SSE vs EventBus
A. Web 端的流程 (SSE)
如果是在纯 Web 环境（或者 Desktop 的 Renderer 进程作为 Web 运行时），后端的 apps/api 在执行定时任务时，会通过 SSE (Server-Sent Events) 向客户端推送事件。 例如：触发了一个提醒，后端会通过 SSE 发出一个类似 schedule:reminder-triggered 的事件。 前端会有一个类似 useSSE 或对应的 Service 监听这个网络流，然后在网页里弹出对应的 Toast 通知。 这就是你在 apps/web/e2e/helpers/testHelpers.ts 里看到 schedule:reminder-triggered 的原因。

B. 桌面端特有的流程 (主进程 EventBus)
在 apps/desktop 的主进程中（即 apps/desktop/src/main/services/notification.service.ts），我们看到代码是这样写的：

eventBus.on('reminder.triggered', (data: { ... }) => {
  this.showNotification({...});
});
这里监听的 eventBus 是主进程内部的一个 Node.js EventEmitter（跨模块通信），它不是通过 SSE 从远程后端拿到的！

为什么主进程里会有这个事件？ 在当前的架构中，桌面端（Desktop）可能在做“本地化后端”（把原本后端的业务逻辑通过 @dailyuse/reminder、@dailyuse/schedule 等包，直接实例化在了 Electron 主进程里，这叫 Local First 或 IPC 模式）。 当运行在桌面端时，定时的触发直接在主进程的 Node.js 环境中发生，并通过内部的 eventBus 广播。 所以，notification.service.ts 直接监听内部 eventBus 就能捕获到提醒。

3. Notification 模块中的监听器又是干嘛的？
你可能还会疑惑：在 packages/notification 这个通用的领域模块中，是不是也应该有监听器？

在整洁的架构下，流程应该是：

Schedule 服务触发 -> 抛出领域事件。
packages/notification/src/application-server 中的监听器收到事件。
它查一下 NotificationPreference（也就是要不要弹窗，发不发邮件），如果在设置里允许发推送（In-App 或 Desktop），那么：
如果是 Web 端，它把消息转给 SSE 服务，推给前端。
如果是 Desktop 主进程，它可能再次抛出一个分发事件（比如 notification:dispatch）。
但是，查看代码现状： 目前 packages/notification 里似乎并没有完全接管这些特定模块（Reminder/Task）的事件监听。 实际上，目前的桌面端代码（notification.service.ts）是直接越过了 packages/notification 模块的策略控制，直接硬编码监听了各个业务模块的底层事件：

监听了 reminder.triggered （硬编码弹 Reminder）
监听了 ScheduleTaskEventTypes.EXECUTED （硬编码弹 Schedule）
4. 总结：现在的“不优雅”之处在哪？
你一语中的：“难道 notification 模块中不应该建立通道并管理吗，为什么桌面端自己在 main 里写了个监听？”

这是目前架构中最大的耦合点，当前的实现是一种“快速出效果的捷径（Workaround）”：

现状（混乱的职责）：
后端/Web侧：走 SSE 网络推送到前端。前端有一个监听（渲染进程）。
Desktop 主进程：没有统一对接 packages/notification 拿指令，而是自己作为“上帝视角”跑去监听底层业务的 eventBus。这就导致：
通知文案是写死在主进程的。
用户如果在 packages/notification 偏好里关了某个模块的通知，主进程的监听可能因为没有读取 preference 而照样弹窗！
理想的、优雅的流程应该是：
单一事件源 -> 统一策略中心： 不论 Reminder 还是 Task，到期时只管发出领域事件 xxx.triggered。
Notification 模块介入： packages/notification 应该有一个统筹的 NotificationEventConsumer，监听所有的 xxx.triggered。 在这里，它检查用户的 NotificationPreference。
输出标准化指令： 如果判定需要发弹窗通知，packages/notification 发出一个统一的通知指令，例如 notification.dispatch_requested，Payload 里包含拼好的文本（title, body, urgency）。
端侧（Desktop Main / Web SSE）只做纯 UI 渲染：
如果在 Web，SSE 监听到 notification.dispatch_requested，推给浏览器，网页弹 Toast。
如果在 Desktop，notification.service.ts 只监听这一个指令 notification.dispatch_requested，收到后原封不动地调用系统弹窗或 custom-notification.manager，它不需要知道这是个 Reminder 还是 Task。

# 方案参考

这个方案的核心目标是消除领域耦合**，并建立一个统一、基于策略（Policy-Based）的跨平台通知分发引擎。

桌面端通知架构重构方案 (Notification Architecture Refactoring)
1. 当前架构的痛点分析
目前项目中的通知流程存在以下几个严重的设计问题（尤其是 apps/desktop）：

职责倒置与领域越权 (Domain Coupling)：
桌面端主进程的 notification.service.ts 直接监听了业务域底层的具体事件（如 reminder.triggered 和 schedule.executed）。
主进程承担了“文案组装”的工作（硬编码了 Emoji、title、body）。
绕过了通知策略中心 (Bypass Notification Module)：
packages/notification 模块原本设计了 NotificationPreference (通知偏好)，允许用户配置某个模块（如 Task、Reminder）是否使用 In-App、Email 或 Desktop 渠道推送。
但是目前的 Desktop 实现由于直接监听底层事件，导致无论用户在 packages/notification 中如何设置，系统桌面弹窗都会强制弹出，导致偏好设置形同虚设。
不同平台的碎片化实现 (Fragmentation)：
Web 端：通过后端的 SSE 推送特定事件（如 schedule:reminder-triggered）到前端渲染进程展示。
Desktop 端：通过主进程内部的 Node eventBus 捕获事件，自行调用 new Notification() 或推送到透明隐藏窗口（Custom Notification）。
两套机制缺乏统一的抽象层。
自定义弹窗的声音缺陷 (Audio Missing)：
目前自定义桌面弹窗（CustomNotificationView.vue）没有独立的声音系统。如果用户禁用了原生 Notification（转而使用 Custom），提醒声音将一并丢失。
2. 目标架构设计 (The "Elegant" Flow)
整洁架构下的通知流程应该是一个清晰的流水线（Pipeline）：

业务域事件 → 通知决策中心 → 分发统一指令 → 端侧纯 UI 渲染

2.1 核心概念：统一分发指令 (NotificationDispatchRequested)
我们不再让端侧去认识什么是 Reminder 或 Task。端侧应用（无论是 Web 浏览器、还是 Desktop 主进程）只认一种事件：标准通知指令。

定义一个统一的事件或消息契约（例如 NotificationDispatchRequested）：

interface NotificationDispatchRequested {
  id: string;                 // 唯一追踪ID
  channel: 'in_app' | 'desktop' | 'email'; // 指定的渠道
  urgency: 'low' | 'normal' | 'critical';
  title: string;              // 已经由后端拼装好的最终标题（带 Emoji）
  body: string;               // 已经由后端拼装好的详细文本
  sound: boolean | string;    // 是否需要声音，或者指定音效文件标识
  action?: {                  // 用户点击后需要执行的操作
    type: string;             // 例如: 'NAVIGATE_TO_TASK', 'COMPLETE_REMINDER'
    payload: any;
  };
}
3. 重构实施步骤
阶段一：后端与 Notification 模块改造 (Backend & Domain)
建立事件监听器 (Event Consumer) 在 packages/notification/src/application-server/handlers 下创建统一的事件消费者 notification-event.consumer.ts。 这个消费者负责订阅所有上游业务域事件：

reminder.triggered
schedule.task.executed
task.completed
通知策略决策 (Policy Engine) 当消费者收到 reminder.triggered 后：

调用 NotificationPreferenceDomainService 读取该用户的偏好设置（如：Reminder 模块是否开启了 Desktop 推送？是否处于全局 DND 勿扰时间？）。
如果允许推送，调用 NotificationTemplateDomainService 或业务适配器，将原始业务数据转换 (Map) 为标准的 NotificationDispatchRequested 对象（此时完成文案和 Emoji 的组装）。
派发渠道指令 (Dispatch)

对于 channel: 'desktop' 的指令，将其推送到统一的事件总线 eventBus.emit('notification.dispatch_desktop', payload)。
对于 channel: 'in_app' 的指令，将其交给 SSE 管理器，推送给当前在线的 Web 客户端 sseManager.send('notification:dispatch_in_app', payload)。
阶段二：桌面端主进程“瘦身” (Desktop Main Process)
重构 apps/desktop/src/main/services/notification.service.ts：

移除业务硬编码：删除所有类似于 showReminderNotification、showGoalProgressNotification 的方法。
单一入口监听：只监听由 Notification 模块发出的标准指令：
private initEventListeners(): void {
  // 统一监听所有由决策中心发出的桌面通知指令
  eventBus.on('notification.dispatch_desktop', (payload: NotificationDispatchRequested) => {
    this.showNotification(payload);
  });
}
保留基础设施职责：notification.service.ts 依然保留判断当前系统是否支持原生 Notification、是否要转发给 custom-notification.manager.ts 的逻辑。
阶段三：桌面端自定义弹窗与音频支持 (Renderer & Audio)
解决当前自定义弹窗模式下没有声音的问题。

主进程透传参数： 在 custom-notification.manager.ts 的 dispatch 方法中，确保将 sound: true 属性通过 IPC 原封不动地发给渲染进程：

win.webContents.send('notification:custom:receive', notificationWithId);
渲染进程播放音频 (Renderer Audio Service)： 在渲染进程 apps/desktop/src/renderer/CustomNotificationView.vue（也就是那个右下角的透明无头窗口）中，实现一个纯净的 HTML5 音频播放器。因为它是渲染进程，播放音频非常简单且不依赖 Native 模块。

<script setup lang="ts">
import { onMounted } from 'vue';

// 预加载提示音
const defaultAudio = new Audio('./assets/sounds/notification.mp3');

function playSound() {
  defaultAudio.currentTime = 0;
  defaultAudio.play().catch(e => console.warn('Audio play failed:', e));
}

const handleReceiveNotification = (_event: any, data: CustomNotification) => {
  // ... 现有推入 notifications 数组的逻辑

  // 如果 payload 包含 sound，则播放
  if (data.sound) {
    playSound();
  }
};
</script>
阶段四：Web 端与 In-App 联动 (Web SSE & UX)
桌面应用的极致体验是根据应用活跃状态智能降级：

如果用户正在使用应用（主窗口 Focused），弹右下角系统级 Desktop 通知会打断用户视线。
此时应该降级为前端 UI 里的一个 Toast (In-App Channel)。
实现逻辑：

在 packages/notification 派发事件时，可以默认同时派发 desktop 和 in_app（或者只发一个逻辑 dispatch）。
在桌面主进程 notification.service.ts 收到事件时，判断：
if (this.mainWindow && this.mainWindow.isFocused()) {
  // 应用处于前台活跃状态，降级为页面内的 Toast
  this.mainWindow.webContents.send('notification:in-app:receive', payload);
  return; // 阻止系统弹窗或 custom window 弹窗
} else {
  // 应用在后台或最小化，走 Desktop 系统弹窗
  // ...
}
Web 端的 Vue 应用通过 IPC (electronAPI) 或者 SSE 收到 in-app 消息后，调用 Vue Sonner (toast()) 在页面右上角优雅弹出。
4. 重构收益 (Benefits)
解耦 (Decoupling)：端侧代码 (apps/desktop) 彻底清空业务逻辑，变成一个“哑巴”渲染器，只负责展现。新增业务（比如加入了 Chat 消息通知）完全不需要修改主进程代码。
遵守单一来源 (Single Source of Truth)：所有的通知偏好（要不要弹、要不要声音、是不是勿扰模式）都在 packages/notification 领域模块中统一结算，不会出现“虽然关了提醒，但桌面端还在弹”的 Bug。
跨端统一 (Unified Multi-platform)：Web 端的 SSE 和 Desktop 的 IPC 传输的数据结构（Schema）完全对齐。
体验升级 (UX)：补齐了自定义窗口丢失的声音，并引入了基于窗口焦点的智能“降级”推送机制，避免通知轰炸。


# 还有完整流程的缺失

现在我来为你分析一下如果给 TaskTemplate 添加提醒功能，在系统中会触发哪些相关的流程，并分析当前的实现情况。

根据对 codebase 的分析，系统中其实已经初步具备了 TaskTemplate 和 reminder 结合的逻辑。系统的 TaskTemplate 聚合根中已经包含了 reminderConfig 的属性，说明在模型设计层面上已经预留了提醒功能的配置。

下面是假设我们在 TaskTemplate 模板上添加提醒功能时会触发的流程分析，以及当前实现的完备情况：

1. 领域模型与聚合根层面
现状：TaskTemplate 领域模型（packages/task/src/domain-server/aggregates/task-template.ts）已经包含了 reminderConfig（类型为 TaskReminderConfig）。
作用：当创建一个带有提醒配置的任务模板，或者给现有任务模板添加提醒时，该字段会被更新，并持久化到数据库中。
评价：领域层面的实现是正确的，并且在测试（TaskTemplate.test.ts）中已经覆盖了带有提醒配置的场景。
2. 调度器（Schedule）模块层面的流程
流程触发：当 TaskTemplate 创建或更新并带有提醒时，系统应该为其创建一个“调度任务（Schedule Task）”。
当前实现： 在 packages/schedule/src/application-server/use-cases/schedule-event-publisher.ts 中，我们看到了 handleTaskCreated 和 handleTaskDeleted 的处理逻辑：
private static async handleTaskCreated(identityId: string, task: any) {
  // 使用 taskFactory.createFromSourceEntity 创建 Schedule Task，sourceModule 是 SourceModule.Task
  // 并将创建请求发送到 schedule 模块的 useCase
}
缺失与潜在问题： 在事件监听列表中，虽然监听了 task.created，task.deleted，但关于 TaskTemplate 提醒相关的更新事件：
task.template.paused 和 task.template.resumed 存在。
task_template.schedule_time_changed 和 task_template.recurrence_changed 存在。 但是 缺少 task_template.reminder_config_changed（就像 goal 模块有 goal.reminder_config_changed 一样），或者相关的 task.updated 更新提醒处理逻辑。
3. 事件流与实际通知触发流程
如果给 TaskTemplate 加上了 reminder，预期的系统流转如下：

创建/修改阶段：TaskTemplate 聚合发生变更，发出领域事件（如 task.created / task.updated）。
调度登记阶段：ScheduleEventPublisher 捕获事件，调用 ScheduleTaskFactory 创建一个 ScheduleTask，将其持久化到 Schedule 库中（标明 sourceModule: 'task'）。
定时触发阶段：Scheduler 服务轮询到期的 ScheduleTask 并执行（触发）。
消息投递阶段：当时间到达时，Schedule 会触发（通过 schedule-task-executor），并可能会发送一条系统内部事件（比如 task.reminder.due）。
通知生成阶段（Notification 模块）：
Notification 模块应该监听这个到期事件。
Notification 模块会检查 NotificationPreference（通知偏好设置，packages/notification/src/domain-server/aggregates/notification-preference.ts 里面已经有默认包含 'task' 模块）。
如果用户未禁用 'task' 的提醒渠道，Notification 会生成真正的通知记录（InApp, Email 等）。
4. 提醒逻辑与 Reminder 模块的区别
注意点：系统中有一个专门的 Reminder 模块（独立于 Task），主要处理通用的、“独立的”提醒模板（reminder.template.created等事件）。
Task 的提醒：根据代码设计，Task 自己的提醒并没有转换为 Reminder 模块内的 ReminderTemplate，而是直接将 Task 作为 SourceModule.Task 注册到了 Schedule 模块中。
这个架构设计是合理的（每个业务域自己把需要调度的东西抛给 Schedule 模块，然后到期后通过 Notification 模块发送），不需要去耦合通用的 Reminder 模块。
总结
有没有正确实现？

数据模型：领域层和持久化层已经正确实现了对 TaskTemplate 提醒配置的支持。
调度层（Schedule）：创建 (task.created) 和删除 (task.deleted) 的事件联动调度创建已经被实现。
缺陷（需完善的流程）：
当 TaskTemplate 的提醒配置被动态更新（比如修改了提前提醒时间）时，目前 ScheduleEventPublisher 中没有看到针对任务更新重新生成调度的逻辑（比如缺少类似 handleReminderUpdated 这种先删后建的联动逻辑）。
Notification 模块需要确保能够捕获到 Schedule 模块针对 SourceModule.Task 触发的到期事件，并将其转化为实际的通知推送。
如果你想要在现有 codebase 中完全打通这一功能，核心在于确保 TaskTemplate 更新时能正确刷新 Schedule Task，并且 Notification 模块能够接收到定时触发的回调来发送通知。