# Desktop 登录窗口与主渲染器拆包记录（2026-04）

## 1. 背景

这次优化的目标不是单纯“让 desktop 构建多出几个 chunk”，而是解决登录窗口首屏链路的结构性问题。

在 Electron 场景里，登录窗口和主窗口都加载同一个 renderer `index.html`，只是在 hash 路由上分别进入：

- 登录窗口：`#/auth`
- 主窗口：`#/`

主进程这一层其实早就已经有“登录窗 / 主窗”分流能力：

- `WindowManager.createLoginWindow()` 会加载 `/auth`
- `WindowManager.createMainWindow()` 会加载 `/`
- 登录成功 / 登出后还会在两个窗口之间切换

但优化前，renderer 侧仍然只有一个统一入口，导致：

1. 登录窗口虽然路径是 `#/auth`，但仍然要先走完整主应用 bootstrap
2. 认证页会提前为主应用的 DI、初始化、Electron 特性注册买单
3. 登录窗体明明是轻页面，却和主窗口共享同一条过重的启动链路

这和 Web 端优化前的症状本质一致，只是 desktop 场景多了 Electron 的窗口、preload bridge、titlebar 与 IPC 约束。

---

## 2. 优化目标

### 2.1 体验目标

让 desktop 登录窗口在首次打开时更快可见，不再被完整主应用渲染器阻塞。

### 2.2 工程目标

将 desktop renderer 从“单入口 + 单 bootstrap”改为“轻量入口分发 + auth/main 双 bootstrap”，并尽可能减少认证窗口前置依赖：

- 主应用壳
- 全量 IPC DI 注册
- 主应用 startup 初始化
- Electron 主应用特性初始化
- 与主页面无关的业务模块运行时

### 2.3 约束

这次拆分不能破坏 desktop 端既有使用方式，因此需要保留：

- `file://` 环境下的 hash router 兼容性
- preload bridge 校验
- 自定义标题栏与窗口控制按钮
- 登录成功 / 登出后的窗口切换链路
- 现有共享 `app-vue` 登录视图的视觉与交互

---

## 3. 初始问题分析

### 3.1 问题 A：`#/auth` 不是独立渲染器入口

虽然主进程已经把登录窗口路由设成了 `#/auth`，但 renderer 入口仍然是单一 `main.ts`，且直接完成：

- Pinia 初始化
- persistedstate 注册
- i18n 初始化
- router 创建
- 全量 IPC DI 注册
- APP_STARTUP 执行
- Electron renderer 特性初始化

这意味着登录窗口仍然必须等待整套主应用壳准备完毕。

### 3.2 问题 B：DI 粒度过粗

旧的 desktop DI 会在应用启动时一次性注入：

- account
- auth
- goal
- task
- schedule
- reminder
- repository
- notification
- setting
- AI
- dashboard
- governance

而登录窗口真正需要的核心只是一套认证服务。

### 3.3 问题 C：Electron 主应用特性被过早初始化

在优化前的统一启动链路里，登录窗口也会走主应用侧逻辑，例如：

- 主应用路由壳
- 主窗口级的进度条钩子
- `APP_STARTUP`
- `initElectronFeatures(app)`

这些都不应该成为登录窗口首屏前置成本。

### 3.4 问题 D：desktop auth 仍依赖共享 `app-vue` 运行时

当前 desktop 登录页并不是完全本地化页面，而是复用 `packages/app-vue` 里的 `DesktopAuthView`。

这带来一个现实约束：

- `DesktopAuthView` 通过 `useAuth()` 工作
- `useAuth()` 会无条件调用 `useRouter()`
- `useAuth()` 使用 `useAuthenticationStore()`
- `useAuth()` 还依赖 `vue-sonner` 的 toast

所以 desktop auth-only 入口虽然已经切掉了主应用壳，但还不能像 Web 那样一步到位移除 router / Pinia / Toaster。

### 3.5 问题 E：登录窗口还有自己的桌面壳层诉求

desktop 登录页不是普通浏览器页面，它还要处理：

- 自定义 titlebar
- 窗口最小化 / 最大化 / 关闭控制
- 窗口状态同步
- 登录成功后切换到主窗口

因此不能简单把认证视图裸挂在页面上，而需要一个 desktop auth-only 根组件承接这些能力。

---

## 4. 优化策略总览

这次 desktop 拆分遵循 Web 端那份记录的同一原则：优先拆真实启动边界，而不是先引入复杂 `manualChunks`。

### 4.1 第一层：入口分发

把 renderer 统一入口改成：

- `main.ts` 轻量分发器
- `bootstrap/auth.ts` 登录窗口专用启动链路
- `bootstrap/app.ts` 主应用启动链路

目标是让 `#/auth` 只加载自己需要的最小运行时。

### 4.2 第二层：DI 拆分

把 desktop renderer DI 拆成：

- `di-auth.ts`：只注入认证服务
- `di-app.ts`：保留主应用全量服务

这样认证窗口不再为整个业务客户端集合买单。

### 4.3 第三层：桌面认证壳独立化

新增 auth-only 根组件负责：

- titlebar
- 窗口控制按钮
- `GlobalErrorBoundary`
- `DesktopAuthView`
- `Toaster`

这样既保留 desktop 体验，又不需要挂完整主应用壳。

### 4.4 第四层：维持共享 auth 表现层兼容

这一步没有像 Web 那样把登录页完全本地化，而是先保留共享 `DesktopAuthView + useAuth()`。

原因不是偷懒，而是有意控制改动范围：

1. 先完成启动边界拆分，直接解决最大首包问题
2. 暂时不改写认证交互逻辑与文案体系
3. 保持登录成功 / 登出 / guest mode / remembered accounts 流程不变

这属于“先做结构性减重，再考虑局部精修”。

---

## 5. 已实施的改动

### 5.1 入口改造

#### `apps/desktop/src/renderer/main.ts`

改造成轻量入口分发器，仅保留：

- 基础样式导入
- 图标初始化
- preload bridge 校验
- 全局错误兜底
- 基于 hash 路径的动态导入分流

当前逻辑为：

- `#/auth` 或 `#/auth/*` 动态加载 `bootstrap/auth`
- 其余路径动态加载 `bootstrap/app`

这样 `index.html` 不再直接把完整主应用 bootstrap 当作同步首包的一部分。

### 5.2 auth-only 启动链路

#### `apps/desktop/src/renderer/bootstrap/auth.ts`

登录窗口专用 bootstrap 当前负责：

- 创建 Vue app
- 创建最小 Pinia
- 注册 i18n
- 注册最小 router
- 安装 auth-only IPC DI
- mount auth-only 根组件

这里的 router 只承担最小兼容职责：

- `/auth/:pathMatch(.*)*` 留在认证壳
- 其他路径重定向到 `/auth`

保留 Pinia / router 的原因是共享 `useAuth()` 目前仍依赖它们。

### 5.3 主应用启动链路

#### `apps/desktop/src/renderer/bootstrap/app.ts`

原来 `main.ts` 中的完整主应用启动逻辑整体搬到这里，包括：

- Pinia + persistedstate
- i18n
- renderer auth state 与主进程会话同步
- 主应用 router
- 进度条钩子
- 全量 IPC DI
- 通知初始化
- `APP_STARTUP`
- `initElectronFeatures(app)`

结果是这些重量级逻辑只会在主窗口链路执行，不再前置到登录窗口。

### 5.4 DI 拆分

#### `apps/desktop/src/renderer/platform/di-auth.ts`

只负责：

- 创建 `resultIpcClient`
- 创建 auth IPC adapters
- 注入 `AUTH_SERVICE_KEY`

这保证 auth-only 路径不会提前实例化整站业务客户端。

#### `apps/desktop/src/renderer/platform/di-app.ts`

承接原来的全量 desktop renderer DI，包括：

- account
- auth
- goal
- task
- schedule
- reminder
- repository
- notification
- setting
- AI
- governance
- dashboard
- navigation
- logout handler

#### `apps/desktop/src/renderer/platform/di.ts`

改成兼容出口：

- `installIpcServices` 继续指向主应用 DI
- 同时导出 auth/app 两套 DI

这样老调用点不需要大范围重写。

### 5.5 desktop auth-only 根组件

#### `apps/desktop/src/renderer/DesktopAuthApp.vue`

新增桌面认证壳，负责承接 desktop 登录页自己的 UI 壳层：

- 自定义 titlebar
- 窗口控制按钮
- 窗口状态事件同步
- `GlobalErrorBoundary`
- `DesktopAuthView`
- `Toaster`

这里保留 `Toaster` 是有意为之，因为共享 `useAuth()` 仍通过 `vue-sonner` 展示：

- 登录成功提示
- 登录失败提示
- 注册提示
- guest mode 提示
- remembered account 删除失败提示

### 5.6 主进程窗口链路无需重写

主进程原有窗口切换设计本身是正确的，这次不需要推翻：

- 登录窗仍加载 `/auth`
- 主窗仍加载 `/`
- 登录成功仍切到主窗口
- 登出仍切回登录窗口

这次改动的核心在 renderer，而不是窗口编排层。

---

## 6. 产物变化

以下数字来自本次调整后的 `pnpm nx run desktop:build:production`。

### 6.1 当前入口结构

构建后的 `dist/index.html` 当前只直接引用：

- `assets/index-CczWGBvV.js`
- `assets/index-DFPcJZQ9.css`

这说明首个同步入口已经收敛成一个轻量 dispatcher，而不是完整主应用代码。

### 6.2 当前关键 chunk

当前 renderer 关键产物如下：

- `index-CczWGBvV.js`：`9.61 kB raw / 6.27 kB gzip`
- `auth-D5QrR1R3.js`：`4.05 kB raw / 1.67 kB gzip`
- `auth-By7BAwm7.css`：`3.34 kB raw / 0.99 kB gzip`
- `app-DtcdzEsw.js`：`88.21 kB raw / 18.68 kB gzip`
- `app-C-LTT2Ij.css`：`3.85 kB raw / 1.12 kB gzip`
- `index-DFPcJZQ9.css`：`151.14 kB raw / 23.55 kB gzip`

从入口形态看，现在已经是：

- 一个轻量公共壳
- 一个 auth-only 入口 chunk
- 一个主应用入口 chunk

而不是单一 renderer 大包。

### 6.3 仍然存在的主应用重块

当前构建里仍然有一个明显大块：

- `AccountCenterView-DGjkJNc5-JCnsZWOR.js`：`3194.46 kB raw / 1021.22 kB gzip`

Vite 也因此给出了 “Some chunks are larger than 500 kB” 的警告。

但这里要区分两类问题：

1. auth / main 入口是否已经拆开
2. 主应用内部是否还存在过大的路由级 chunk

第 1 点这次已经完成。
第 2 点仍然值得继续优化，但它已经不是登录窗口首屏链路的 blocker。

### 6.4 工程意义上的结果

这次优化把 desktop renderer 的问题从：

- “登录窗口必须先吃完整主应用启动链路”

变成了：

- “登录窗口先吃轻量 dispatcher，再只加载 auth-only 入口”
- “主应用内部仍有个别大路由 chunk 需要后续精修”

这是一次明确的结构性拆分，而不是表面上的 chunk 数量变化。

---

## 7. 为什么这次没有继续做更激进的 auth-only 本地化

Web 端后续做到了进一步把 auth-only 路径中的 shared store / toast / HTTP 栈切掉，但 desktop 这次暂时没有直接复制到同一深度，原因如下。

### 7.1 当前收益最大的工作已经完成

desktop 当前最大的启动问题是：

- 登录窗口不该先走完整主应用 bootstrap

这个问题已经通过入口分发和 bootstrap 拆分解决。

### 7.2 共享 auth 逻辑仍然承载了桌面特性

当前共享 `useAuth()` 不只是“发登录请求”，还承载了：

- desktop window transition IPC
- guest mode
- remembered accounts
- toast 反馈
- 认证 store 更新

如果这一步继续完全本地化，就不只是拆包，而是要同时重做 desktop 认证表现层与状态组织。

### 7.3 不希望把一次结构优化扩展成大范围认证重构

在当前阶段，更合理的顺序是：

1. 先拆启动边界
2. 再决定是否把 desktop auth 表现层本地化

这样更容易控制回归范围。

---

## 8. 当前剩余瓶颈

### 8.1 auth-only 仍带有最小共享运行时

当前 desktop auth-only 仍然保留：

- Pinia
- router
- `DesktopAuthView`
- `useAuth()`
- `vue-sonner`

这是因为共享 auth 运行时还没有完全拆开。

### 8.2 初始共享 CSS 仍然偏大

当前 `index-DFPcJZQ9.css` 为：

- `151.14 kB raw / 23.55 kB gzip`

这说明即使 JS 入口已经拆开，样式层面仍然有较大的共享成本。

### 8.3 主应用内部仍有超大路由 chunk

`AccountCenterView` 这一类路由级 chunk 体积仍然偏大，说明主应用内部还有后续拆分空间。

---

## 9. 后续优化方向

如果后续继续压 desktop 登录窗口，可以优先考虑：

1. 将 `DesktopAuthView` 从共享 `app-vue` 表现层中抽离，建立 desktop auth-only 视图
2. 为 desktop auth-only 建立本地 `useDesktopAuth()`，切掉对共享 auth store / router / toast 的依赖
3. 评估 remembered accounts、guest mode 是否可以拆成更轻的 auth-only adapter
4. 审查共享 CSS 的来源，看看是否能把主应用壳样式进一步后移
5. 单独处理 `AccountCenterView` 这种主应用内部过大 chunk

当前不建议优先做的事情：

1. 一上来就堆复杂 `manualChunks`
2. 为了极限压缩而破坏 desktop 登录页的视觉一致性
3. 在 auth-only 入口重新接回主应用初始化逻辑

---

## 10. 验证方式

本次拆分后，主要通过以下命令验证：

### 10.1 类型检查

```bash
pnpm nx run desktop:typecheck
```

### 10.2 生产构建

```bash
pnpm nx run desktop:build:production
```

### 10.3 Lint

```bash
pnpm nx run desktop:lint
```

说明：

- `desktop:lint` 可以通过
- 但项目里仍有既存 warning，这次拆包没有顺手清理它们

### 10.4 构建产物观察

重点观察：

- `apps/desktop/dist/index.html`
- 入口 dispatcher chunk
- auth-only 入口 chunk
- 主应用入口 chunk
- 主应用内部是否还有异常大的路由级 chunk

---

## 11. 关键文件清单

### 11.1 入口与 bootstrap

- `apps/desktop/src/renderer/main.ts`
- `apps/desktop/src/renderer/bootstrap/auth.ts`
- `apps/desktop/src/renderer/bootstrap/app.ts`

### 11.2 auth-only 壳层

- `apps/desktop/src/renderer/DesktopAuthApp.vue`

### 11.3 renderer DI

- `apps/desktop/src/renderer/platform/di-auth.ts`
- `apps/desktop/src/renderer/platform/di-app.ts`
- `apps/desktop/src/renderer/platform/di.ts`

### 11.4 相关共享依赖

- `packages/app-vue/src/views/DesktopAuthView.vue`
- `packages/app-vue/src/modules/authentication/composables/useAuth.ts`

### 11.5 主进程窗口编排

- `apps/desktop/src/main/lifecycle/WindowManager.ts`

---

## 12. 最终结论

这次 desktop 优化的本质，不是“让 Electron 构建多几个文件”，而是把登录窗口从完整主应用 renderer 启动链路里解耦出来。

最终结果可以概括为：

1. `#/auth` 已经成为 renderer 层面的独立轻入口，而不再只是主应用中的一个普通路由
2. 登录窗口不再前置加载主应用 DI、主应用初始化和主应用 Electron 特性
3. desktop 特有的 titlebar、窗口控制、窗口切换能力仍然保留
4. 当前已经完成“结构性拆分”，剩下的优化重点是 auth-only 进一步本地化，以及主应用内部大路由 chunk 的精修

换句话说，这次已经把问题从“边界没拆开”推进到了“边界已经拆开，接下来可以在边界内部继续精修”。
