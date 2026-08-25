---
tags:
  - analysis
  - reminder
  - routine
  - focus
  - oss
  - desktop
description: Routine Coach vNext 的开源项目调研，聚焦 Active/Idle、Natural Break、渐进干预、Focus Session、平台传感器与工程边界
created: 2026-08-25T17:13:00+08:00
updated: 2026-08-25T17:13:00+08:00
---

# Routine / Break / Focus OSS 调研

## 1. 目的

本文不是为了寻找一个可以直接复制进 MemoFlow 的完整 Reminder App，而是回答：

1. 健康休息提醒领域有哪些已经被成熟产品验证的业务语义？
2. “工作 / 学习 / 游戏 / 会议”等上下文应该怎样建模？
3. Active Time、Idle、Natural Break 是否值得作为核心 Runtime 事实？
4. Pomodoro / Flowtime 应该作为普通 Reminder，还是一等 Session 状态机？
5. 桌面端应该只使用系统通知，还是需要自定义小窗口 / 全屏 break surface？
6. Windows/macOS/Linux 的 activity/idle 检测应该如何与核心领域解耦？
7. 哪些设计值得借鉴，哪些复杂度不应该复制？

结论：没有发现适合作为 MemoFlow 核心领域引擎直接嵌入的成熟通用库。更合理的方式是遵循 ADR-058 的 OSS-first 原则：**借鉴成熟业务语义与工程边界，保留 MemoFlow 对自身领域状态的所有权。**

---

## 2. Workrave

- 官网：https://workrave.org/
- Break 文档：https://workrave.org/docs/breaks/
- Operation Mode：https://workrave.org/docs/menus/operation-mode/
- Reading Mode：https://workrave.org/docs/menus/reading-mode/
- GitHub：https://github.com/rcaelers/workrave

### 2.1 最重要的发现：Active Time 与 Idle Time

Workrave 不把“运行了 40 分钟”简单理解为 wall-clock 经过 40 分钟。

其核心 break timer 同时考虑：

```text
Active Time
Idle Time
```

Active Time 在用户使用键盘/鼠标时增长；停止使用时 Active Time 停止增长。

Idle Time 在用户不操作电脑时增长；重新开始操作后 Idle Time 归零。

当 Idle Time 达到 break duration 时，Workrave 认为用户已经实际完成了休息，并重置 Active Time。

这给 MemoFlow 一个非常关键的业务不变量：

> 用户已经自然离开电脑足够久，就不应因为固定 Interval 到点而再次提醒起身。

### 2.2 Microbreak / Restbreak / Daily limit

Workrave 区分：

```text
Microbreak
Restbreak
Daily Limit
```

对 MemoFlow 的启发不是直接复制这三个枚举，而是：

> 不同健康行为可能有不同时间尺度、不同干预强度和不同满足条件。

例如：

```text
眼睛休息 -> 高频、短时、Gentle/Guided
站立活动 -> 中频、数分钟
睡眠 -> wall-clock、低频、生活节律
```

### 2.3 Gentle Prelude

Workrave 到 break 时间时，先提供非侵入式提醒，让用户完成当前动作再进入休息；如果长期忽略，再根据策略强制或稍后重试。

这与 MemoFlow 的目标 `InterventionPolicy` 高度一致：

```text
Due
 -> Gentle
 -> Grace Period
 -> Guided/Strict
```

### 2.4 Operation Mode

Workrave 具有：

```text
Normal
Quiet
Suspended
```

并有 Reading Mode。

其意义：

- `Quiet`：继续观察 activity，但不打扰；
- `Suspended`：停止观察，也停止提醒；
- `Reading`：调整“没有键鼠活动 = 没有使用电脑”的默认假设。

这证明“运行上下文”是该领域的一等问题。

MemoFlow 不应机械复制这些 mode，而应拆成：

```text
Profile = 长期场景配置
Runtime Overlay = 临时允许/禁止打扰与 activity policy
```

### 2.5 Adopt / Avoid

采用：

- Active/Idle；
- Natural Break；
- gentle prelude；
- context affects monitoring/presentation。

不直接复制：

- Workrave 的完整 UI/配置层级；
- 特定 break 类型枚举作为 MemoFlow 永久领域类型；
- 与其技术栈绑定的实现。

---

## 3. Sane Break

- GitHub：https://github.com/AllanChain/sane-break

### 3.1 核心问题定义

Sane Break 对传统 break reminder 的批评非常重要：

```text
提醒突然出现
 -> 用户正专注
 -> Skip / Postpone
 -> 形成机械忽略行为
 -> 几小时不休息
```

产品目标不是“准时显示一个通知”，而是“让用户真的休息”。

### 3.2 Two-phase System

Sane Break 的核心：

```text
Phase 1
小型、不侵入的提醒
告诉用户寻找合适停顿点

Phase 2
用户自然停止工作后
进入真正 break / fullscreen
```

如果用户持续工作太久，也可以从 Phase 1 升级到 Phase 2。

### 3.3 对 MemoFlow 的直接启发

Ambient Routine 不应只有：

```text
Due -> Popup
```

而应拥有 `InterventionPolicy`：

```text
Gentle
Grace
Guided
Strict(optional)
```

并且“自然停止工作”可以成为状态转移条件。

### 3.4 Adopt / Avoid

采用：

- 两阶段干预思想；
- 尊重自然停顿点；
- 避免把 Skip/Snooze 设计成最显眼、最机械的操作。

不直接复制：

- 所有 break 都强制走 full-screen；
- Sane Break 的具体 UI 技术实现。

---

## 4. Safe Eyes

- GitHub：https://github.com/slgobinath/SafeEyes
- Smart Pause 实现：https://github.com/slgobinath/SafeEyes/blob/master/safeeyes/plugins/smartpause/plugin.py

### 4.1 Smart Pause

Safe Eyes 能在系统 idle 时暂停 break scheduler，并在用户恢复活动时根据 idle 时长重新安排下一次 break。

这再次验证：

> Idle 不是 analytics 数据，而是 Timer 正确性的输入。

### 4.2 Idle Monitor Interface

Safe Eyes 的 Smart Pause 没有把所有桌面平台逻辑写死在核心调度代码中。

其实现会选择不同 idle monitor，例如：

```text
GNOME DBus
Sway
X11
Wayland-specific implementation
```

核心 plugin 消费统一的 idle / resumed 行为。

### 4.3 对 MemoFlow 的工程启发

应建立：

```text
ActivitySensorPort
IdleSensorPort
DndSensorPort
ActiveApplicationPort
```

平台实现放在 adapter：

```text
Windows adapter
macOS adapter
Linux adapter
```

Routine Domain 只消费标准化事件。

### 4.4 Adopt / Avoid

采用：

- platform capability interface；
- smart pause / idle as runtime input；
- plugin/adapter boundary。

不直接复制：

- Python/GTK 具体结构；
- 为了“插件化”而让所有 Routine 行为都变插件。

---

## 5. BreakTimer

- GitHub：https://github.com/tom-james-watson/breaktimer-app
- Releases：https://github.com/tom-james-watson/breaktimer-app/releases

### 5.1 Notification 与 Fullscreen Break 分层

BreakTimer 支持：

- simple notification；
- fullscreen break window；
- working hours；
- 根据长期 idle 智能重置 break countdown。

这与 MemoFlow 的多 Surface 方向一致。

### 5.2 2.0 的重要演化

BreakTimer 2.0 明确改变了“break 一到就立刻出现居中倒计时”的行为：

```text
旧：立即 centered countdown
新：先 subtle notification
    -> 用户准备好后开始 break
    -> 一段时间后再进入 countdown
```

同时把 `Idle Reset` 重命名为 `Smart Breaks`，强调用户已经自然休息时不应重复要求休息。

### 5.3 对 MemoFlow 的启发

进一步验证：

```text
Notification
InterventionWindow
BreakOverlay
```

不应该是同一个 Surface 的三个 CSS 状态，而是可按干预强度选择的不同 presentation capability。

---

## 6. Focust

- GitHub：https://github.com/pilgrimlyieu/Focust

### 6.1 产品覆盖与 MemoFlow 原始设想高度相似

Focust 当前 README 已描述：

- mini breaks；
- long breaks；
- 自定义 break interval；
- 按时间段和星期配置 schedule；
- idle 时自动暂停；
- postpone；
- strict mode；
- DND detection；
- active application exclusion；
- system tray；
- 多显示器 break window。

这说明 MemoFlow 的“健康习惯 + 不同场景 + 桌面上下文 + break surface”产品方向并非孤立想法。

### 6.2 工程参考价值的边界

Focust 自己明确说明仍处于 active early development。

因此：

- 可以参考其需求清单；
- 可以参考 Tauri/Vue 动态窗口等思路；
- 不应把其当前领域模型视为成熟架构标准；
- 不直接从其实现反推 MemoFlow DDD 边界。

---

## 7. Super Productivity

- GitHub：https://github.com/super-productivity/super-productivity
- Focus Mode 相关实现示例：https://github.com/super-productivity/super-productivity/blob/master/src/app/features/focus-mode/store/focus-mode.effects.ts

### 7.1 Focus Mode 是显式 Session

Super Productivity 的 Focus Mode 支持：

```text
Pomodoro
Flowtime
Countdown
```

Focus Session 是用户显式启动的状态，而不是后台提醒自动触发。

这非常支持 MemoFlow 的：

```text
Ambient Routine != Protocol Session
```

### 7.2 Strategy 思想

不同 Focus Mode 不只是改一个 duration：

- Pomodoro 有 cycle 与 break 规则；
- Flowtime 可根据实际 focus duration 计算 break；
- Countdown 有不同完成语义。

这说明 Protocol 应是一等策略/状态机，而不是 `Reminder(interval=25m)`。

### 7.3 Session 与 Break 的状态协同

代码中对：

- focus completion；
- break start；
- cycle increment；
- tracking pause；
- Flowtime dynamic break；
- notification；
- Electron taskbar progress；

做了明确状态协同。

MemoFlow 应学习“一个权威 Session state machine”，而不是复制所有 effect 细节。

### 7.4 需要吸取的教训

当 Task Tracking、Focus Mode、Pomodoro、Break Reminder 分别发展时，很容易形成多个 Timer ownership。

MemoFlow 应提前规定：

> Protocol Session 是专注协议状态的唯一 owner；Task 可以引用或关联 Session，但不能再创建第二套独立 Pomodoro truth。

---

## 8. 横向比较

| 主题              | Workrave        | Sane Break        | Safe Eyes                   | BreakTimer    | Focust                | Super Productivity | MemoFlow 采用方向   |
| ----------------- | --------------- | ----------------- | --------------------------- | ------------- | --------------------- | ------------------ | ------------------- |
| Active usage      | 强              | 强调自然停顿      | idle/smart pause            | smart break   | idle detection        | 主要 focus timer   | 一等 Runtime 输入   |
| Natural break     | 强              | 强                | 强                          | 强            | 有 idle pause         | 非核心             | 一等业务语义        |
| Gentle -> break   | 有 prelude      | 核心 two-phase    | notification/break          | 2.0 强化      | notification + strict | session surface    | InterventionPolicy  |
| 场景/context      | operation modes | 较少              | plugin/context              | working hours | DND/app exclusions    | focus mode         | Profile + Overlay   |
| Pomodoro/Protocol | 非核心          | 非核心            | 非核心                      | 非核心        | break schedules       | 强                 | ProtocolSession     |
| 平台 adapter      | 有平台逻辑      | Qt cross-platform | 明确 idle monitor interface | Electron      | Tauri                 | Electron/Web       | Capability Ports    |
| AI-native         | 无              | 无                | 无                          | 无            | 无                    | 无                 | AI 做 Coach/Planner |

---

## 9. 对 MemoFlow 的综合业务模型

这些项目共同验证了四个事实。

### 9.1 “时间到了”不等于“应该马上打断”

需要：

```text
Due
Presentation eligibility
Intervention level
Natural stopping point
```

### 9.2 “没有键鼠活动”不是简单暂停 Timer

可能意味着：

- 用户真的离开电脑并完成休息；
- 用户正在阅读；
- 用户正在看视频；
- 用户在会议中；
- 另一个人在使用设备。

所以 Activity Context 必须可扩展。

### 9.3 Focus Method 是 Session，不是 Reminder

Pomodoro/Flowtime 有 phase/cycle/state/recovery，必须用状态机。

### 9.4 桌面工具的价值在后台 Runtime 与正确 Surface

用户不需要一直看设置页面。

产品主要发生在：

```text
background runtime
tray
OS notification
mini intervention
focus window
break overlay
```

---

## 10. 不建议直接复制的复杂度

### 10.1 不把每个 OSS feature 都做进第一版

第一阶段不要同时做：

- DND；
- foreground app rule engine；
- 多平台全部 sensor；
- strict full-screen；
- 所有 Pomodoro 变体；
- 复杂统计；
- 自动 AI 调频。

### 10.2 不把 Context 做成无限规则引擎

先验证：

```text
Work Profile
ActivitySensor
Idle Natural Break
Gentle Intervention
```

再扩展 Meeting/DND。

### 10.3 不复制 GPL 项目代码到 MemoFlow

本调研主要采用：

- 产品语义；
- 架构思想；
- 行为模式。

任何代码级复用都必须单独做 license review。默认策略是 clean implementation，不因为“开源”就直接复制实现。

---

## 11. 推荐优先级

### P0：必须吸收

1. Workrave Active/Idle/Natural Break；
2. Sane Break two-phase intervention；
3. Safe Eyes platform sensor adapter；
4. Super Productivity ProtocolSession / strategy 思想。

### P1：第一批扩展时吸收

1. BreakTimer Smart Break / subtle-first；
2. Workrave Quiet/Reading 对 context policy 的启发；
3. Focust DND / app exclusion 的产品覆盖。

### P2：后续再评估

1. strict full-screen enforcement；
2. 高度可定制 theme；
3. 大量 third-party plugins；
4. 多设备 activity sync；
5. 自动化行为调整。

---

## 12. 最终结论

MemoFlow 不需要再发明一个普通 Reminder App。

成熟 OSS 已经证明：健康/休息领域真正困难的不是“每 N 分钟触发一次”，而是：

```text
真实使用了多久？
用户是否已经自然休息？
当前是否适合打扰？
怎样不破坏专注地让用户真的休息？
主动专注方法如何可靠执行？
不同桌面平台怎样提供 activity/context 能力？
```

MemoFlow 的差异化应该建立在这些成熟语义之上，再加入自身 AI-native 优势：

```text
AI understands intent
AI configures methods/profiles
Deterministic runtime executes
Desktop surfaces intervene
History becomes evidence
AI proposes better routines
```

因此推荐以 `Routine Coach` 作为 vNext North Star，而不是继续扩大通用 `ReminderTemplate`。
