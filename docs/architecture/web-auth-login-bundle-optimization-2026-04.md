# Web 登录页拆包优化记录（2026-04）

## 1. 背景

本次优化的直接触发点不是单纯的“登录页没命中缓存”，而是登录页首屏链路本身过重。

实际线上排查时已经出现以下信号：

- 登录页首次进入耗时异常长
- 主包已经命中 Cloudflare 缓存，但内容下载仍然极慢
- 登录页本身是轻页面，但首屏前仍依赖接近整站体量的主包

这说明有两个问题同时存在：

1. 网络链路或本地代理可能放大了耗时
2. 前端登录页的首包设计本身不合理

第二点是本次优化的核心目标。

---

## 2. 优化目标

### 2.1 体验目标

让 `/auth` 在首次访问、无缓存情况下也能尽快出首屏，不再等待整站主应用初始化完成。

### 2.2 工程目标

将登录页从“共享完整主应用启动链路”改为“独立轻入口”，并尽可能减少以下依赖：

- 主应用壳
- 全量 DI 服务注册
- 全局启动初始化
- 通用 HTTP 客户端栈
- 共享认证 store
- 非必要 UI 运行时

### 2.3 约束

优化不能以破坏视觉统一性为代价，因此保留组件库样式体系，不把登录页粗暴改成纯原生样式页面。

---

## 3. 初始问题分析

优化前，登录页虽然表面上已经是路由懒加载，但真正的拆包边界放错了。

### 3.1 关键问题

#### 问题 A：`/auth` 不是独立入口

访问 `/auth` 时，浏览器仍然会先加载 Web 应用统一入口，再进入完整的 bootstrap 流程。

这意味着：

- Pinia / i18n / router / DI 会先初始化
- 主应用级别的 startup 逻辑会先执行
- 登录页自身的轻逻辑没有机会优先渲染

#### 问题 B：DI 粒度太粗

旧的 Web DI 在应用启动阶段一次性把 account、goal、task、notification、setting、AI 等整站服务全部提供给 Vue 树。

而登录页实际上只需要认证服务。

#### 问题 C：认证页复用了主应用共享运行时

即使登录页组件本身不大，它仍然依赖：

- 主应用 router 壳
- 主应用 i18n
- 主应用 presentation/bootstrap 逻辑
- 通用 HTTP 客户端
- 认证 store 持久化链路

#### 问题 D：UI 使用方式不够克制

登录页虽然只用了少量组件，但如果从 UI 包根出口导入，会把更大范围的 UI 运行时和共享依赖拖进来。

---

## 4. 优化策略总览

本次优化不是一次性“大重写”，而是分层逐步减重。

### 4.1 第一层：入口分流

把 Web 的统一入口拆成：

- `main.ts` 轻量分发器
- `bootstrap/auth.ts` 登录页专用启动链路
- `bootstrap/app.ts` 主应用启动链路

目标是先让 `/auth` 不再被完整主应用壳阻塞。

### 4.2 第二层：DI 拆分

把 Web DI 拆成：

- `di-auth.ts`：仅登录页所需服务
- `di-app.ts`：主应用全量服务

这样认证页不再为整站业务客户端买单。

### 4.3 第三层：认证页本地化

将登录页从共享 `app-vue` 表现层依赖中逐步抽离，保留视觉一致性，但本地化以下内容：

- auth i18n
- auth presentation preference
- auth service injection
- auth error translation
- auth loading/error state

### 4.4 第四层：认证链路专用 HTTP

为登录页单独提供轻量 `fetch` 实现，只覆盖：

- `loginByEmail`
- `registerByEmail`

不再为登录页携带整套 `axios + refresh interceptor + ResultHttpClient`。

### 4.5 第五层：移除非必要运行时

在 auth-only 路径里继续去掉：

- Pinia
- pinia persistedstate
- 共享 authentication store
- 登录页 toast 容器

---

## 5. 已实施的改动

本节按模块说明已落地的重构。

### 5.1 入口改造

#### `apps/web/src/main.ts`

改造成轻量入口分发器：

- 保留基础样式与图标初始化
- `/auth` 及其子路由动态加载 `bootstrap/auth`
- 其余路径动态加载 `bootstrap/app`

效果：

- 登录页首次进入不再直接加载完整主应用入口

#### `apps/web/src/bootstrap/auth.ts`

登录页专用启动链路，当前只负责：

- 创建 Vue app
- 应用 auth-only i18n
- 应用 auth-only DI
- 恢复主题与语言偏好
- mount 登录页

已经移除：

- Pinia
- pinia persistedstate
- 任何主应用 startup 初始化

#### `apps/web/src/bootstrap/app.ts`

主应用保留完整启动链路，但调整为：

- 先 mount
- 再异步执行 `APP_STARTUP`

这样主应用自身首屏也更早可见。

### 5.2 DI 拆分

#### `apps/web/src/platform/di-app.ts`

承载主应用全量依赖注入，包括：

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

#### `apps/web/src/platform/di-auth.ts`

只给登录页注入认证服务。

最初它仍然复用 `AuthClientService + AuthHttpAdapter + resultHttpClient`。
后续进一步改为只注入轻量 `authWebService`。

#### `apps/web/src/platform/di.ts`

对外兼容导出：

- `installWebServices` 指向主应用 DI
- `installAuthServices` 指向 auth-only DI

这样不需要在其他地方再做大范围调用点调整。

### 5.3 登录页本地化表现层

#### `apps/web/src/AuthApp.vue`

建立独立的 auth-only 根组件。

优化后：

- 不再挂载完整主应用壳
- 最终也移除了 `Toaster`

#### `apps/web/src/auth/WebAuthView.vue`

新增登录页专用视图，保留原有视觉风格，但脱离共享 `AuthView.vue`。

当前仍保持组件库视觉一致性，未改成原生样式页面。

#### `apps/web/src/auth/messages.ts`

只保留登录页真正需要的中英文文案。

#### `apps/web/src/auth/i18n.ts`

构建 auth-only i18n 实例，不再依赖主应用多语言包。

#### `apps/web/src/auth/presentation.ts`

提供登录页专用的：

- locale 恢复
- theme 恢复
- 本地存储读写

避免 auth-only 路径再接入主应用 presentation store。

### 5.4 UI 导入策略优化

为了保留统一的视觉风格，没有放弃组件库，而是做成“子路径按需导入”。

#### 具体策略

- 登录页不再从 `@dailyuse/ui-vue-shadcn` 根出口导入
- 改为只导入实际需要的组件子路径：
  - `button`
  - `card`
  - `input`
  - `label`
  - `tabs`

#### 配套改动

为保证 Vite 和 TypeScript 都能解析 UI 包源码内部 alias，补充了：

- `vite.workspace-aliases.ts`
- `apps/web/vite.config.ts`
- `tsconfig.base.json`
- `apps/web/tsconfig.json`

这样 auth-only 页面既能继续用 UI 组件，又能避免从 UI 包根入口把更多内容一并拖入。

### 5.5 认证链路专用轻服务

#### `apps/web/src/platform/auth-web-service.ts`

新增 auth-only 轻量服务：

- 基于 `fetch`
- 只实现 `loginByEmail` 与 `registerByEmail`
- 按当前 API 返回格式转换成 `Result<T>`
- 覆盖常见 HTTP 状态映射

这一步的收益非常明确，因为它切掉了登录页对以下内容的前置依赖：

- `ResultHttpClient`
- axios
- token refresh interceptor
- 全局 unauthorized 处理链

### 5.6 登录页本地状态管理

#### `apps/web/src/auth/useWebAuth.ts`

从共享认证 store 改为本地状态：

- `isLoading` 使用本地 `ref`
- `error` 使用本地 `ref`
- 成功后直接写入 `localStorage`
- 然后整页跳转到 `/`

写入内容包括：

- `authentication`
- `access_token`
- `refresh_token`

这样可以同时兼容：

- 主应用从 `authentication` 持久化状态恢复
- 现有 E2E 里对 `access_token` / `refresh_token` 的检查

### 5.7 本地化认证工具

#### `apps/web/src/auth/service.ts`

新增 auth-only 的注入 key 和 `useAuthService()`，不再依赖 `packages/app-vue/src/di/keys.ts`。

#### `apps/web/src/auth/resultError.ts`

新增 auth-only 错误翻译函数，不再依赖 `packages/app-vue/src/shared/utils/translateResultError.ts`。

这一步主要是继续切断 auth-only 对共享运行时 chunk 的耦合。

### 5.8 去掉登录页 toast

#### 原因

登录页已经有内联错误提示区，成功又是立即整页跳转。

因此在 auth-only 页面里：

- 错误 toast 价值有限
- 成功 toast 在跳转前几乎不可见
- 但 `Toaster + vue-sonner` 仍然有运行时成本

#### 处理方式

- 删除 `AuthApp.vue` 中的 `Toaster`
- 删除 `useWebAuth.ts` 中的 toast 调用
- 保留页面内联错误展示

---

## 6. 产物变化

以下数字基于本次优化过程中多次 production 构建结果。

### 6.1 优化前

在最早的生产产物快照中：

- 登录页前必须先加载主入口大包
- 主入口 gzip 体积约 `~990 kB`

这意味着 `/auth` 首屏被整站主应用壳彻底绑死。

### 6.2 第一阶段：入口分流后

完成 auth/app 双 bootstrap 后：

- 入口分发器约 `1.6 kB gzip`
- auth bootstrap 约 `0.7 kB gzip`
- 登录页自身视图约 `4 kB gzip`

但 auth 前面仍有一个共享大块，约：

- `~324 kB gzip`

这说明问题已经从“整站主包”收敛成“auth 共享运行时过大”。

### 6.3 第二阶段：auth-only 本地化与 UI 子路径导入

共享大块变化：

- `324.14 kB gzip`
- `214.56 kB gzip`
- `203.05 kB gzip`

说明 auth-only 视图与导入边界本身已经开始起作用。

### 6.4 第三阶段：切掉共享 HTTP 栈

把 auth-only 从 `ResultHttpClient/axios` 改成轻量 `fetch` 后：

- `203.05 kB gzip -> 184.46 kB gzip`

说明登录页原来确实为通用 HTTP 基础设施承担了不必要的体积。

### 6.5 第四阶段：去掉 Pinia 与 authentication store

把 auth-only 启动链路中的 Pinia、persistedstate、shared auth store 一并去掉后：

- `184.46 kB gzip -> 155.87 kB gzip`

这一阶段收益较大，证明 auth-only 完全没必要为了共享 store 付出这一层成本。

### 6.6 第五阶段：auth 工具本地化 + 去掉 toast

最终共享大块进一步降为：

- `147.45 kB gzip`

当前最新构建中：

- auth chunk 自身约 `6.98 kB gzip`
- auth 入口 chunk 约 `18.75 kB raw / 6.98 kB gzip`
- auth 前共享大块约 `147.45 kB gzip`

### 6.7 总结

从工程意义上看，这次优化把登录页的首屏依赖从“接近整站主包”压缩到了“一个小 auth chunk + 一个中等共享运行时 chunk”。

关键降幅可以概括为：

- 最早主入口前置：约 `~990 kB gzip`
- 当前 auth 前共享大块：约 `147.45 kB gzip`

即：

- 登录页前置重量下降约 `85%` 左右

这已经是一次结构性优化，而不是微调。

---

## 7. 为什么当前没有继续把登录页改成纯原生实现

中途曾评估过把登录页直接改为原生表单和 Tailwind 结构。

最终没有采用，原因如下：

1. 会破坏 UI 风格统一性
2. 会让登录页形成独立视觉实现分支，维护成本更高
3. 当前体积问题的核心并不只在 UI 组件，而在共享启动链路

因此最后采用的是更平衡的方案：

- 保留 UI 组件体系
- 改用组件子路径按需导入
- 继续切掉非必要运行时

这比“放弃组件库”更符合项目长期维护方向。

---

## 8. 当前剩余瓶颈

虽然登录页已经明显变轻，但它还没有完全达到极限轻量状态。

### 8.1 剩余主要共享块

当前 auth-only 仍然需要一个约 `147.45 kB gzip` 的共享 chunk。

这部分主要来自：

- Vue 运行时
- auth-only i18n
- 当前保留的 UI 组件运行时
- `Tabs` 相关依赖

### 8.2 仍可继续优化的方向

后续如果要继续压，可以优先考虑：

1. 将登录页的 `Tabs` 切换改成更轻量实现
2. 继续审查 `lucide-vue-next`、tabs 相关运行时是否仍有冗余
3. 检查是否还能让 auth-only 的部分 UI 组件进一步局部内联

### 8.3 当前不建议继续做的方向

暂时不建议：

1. 再次引入复杂 `manualChunks`
2. 为了极限压缩而放弃组件库一致性
3. 在 auth-only 路径里重新引入全局状态或主应用级基础设施

---

## 9. 验证方式

本次优化过程中，主要通过以下方式验证：

### 9.1 类型检查

```bash
pnpm exec vue-tsc --noEmit -p apps/web/tsconfig.json
```

### 9.2 生产构建

```bash
pnpm exec vite build --config apps/web/vite.config.ts --mode production
```

### 9.3 构建产物观察

重点观察：

- `dist/index.html`
- auth 入口 chunk
- auth 前共享 chunk
- 主应用 chunk 与 auth chunk 的拆分边界

---

## 10. 关键文件清单

以下文件是本次优化的核心落点：

### 10.1 入口与 bootstrap

- `apps/web/src/main.ts`
- `apps/web/src/bootstrap/auth.ts`
- `apps/web/src/bootstrap/app.ts`

### 10.2 auth-only 表现层

- `apps/web/src/AuthApp.vue`
- `apps/web/src/auth/WebAuthView.vue`
- `apps/web/src/auth/messages.ts`
- `apps/web/src/auth/i18n.ts`
- `apps/web/src/auth/presentation.ts`
- `apps/web/src/auth/useWebAuth.ts`
- `apps/web/src/auth/service.ts`
- `apps/web/src/auth/resultError.ts`

### 10.3 auth-only 平台与 DI

- `apps/web/src/platform/di-auth.ts`
- `apps/web/src/platform/di-app.ts`
- `apps/web/src/platform/di.ts`
- `apps/web/src/platform/auth-web-service.ts`
- `apps/web/src/platform/http.ts`

### 10.4 路径解析与按需导入支持

- `apps/web/vite.config.ts`
- `vite.workspace-aliases.ts`
- `apps/web/tsconfig.json`
- `tsconfig.base.json`

### 10.5 主应用兼容调整

- `packages/app-vue/src/modules/authentication/composables/useAuth.ts`

---

## 11. 最终结论

这次优化的本质不是“把登录页组件再压小一点”，而是把登录页从完整主应用启动链路里解耦出来。

最终结果可以概括为：

1. `/auth` 已经成为独立轻入口，而不是主应用的一个普通路由
2. 登录页不再依赖整站 DI、整站 startup、整站 HTTP 栈、整站认证 store
3. UI 风格保持一致，没有为了体积放弃组件库体系
4. 登录页前置依赖体积已从接近整站主包，压缩到中等规模共享运行时

这为后续继续优化提供了清晰边界：

- 现在要继续压，不应再从“主应用壳拆分”入手
- 而应针对 auth-only 剩余的 UI/runtime 依赖精细化处理

换句话说，本次优化已经完成了“结构性减重”，剩下的是“局部精修”。
