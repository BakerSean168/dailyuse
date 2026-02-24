# Phase 3: Web 瘦身 (预计 1-2 天)

## 目标

Phase 2 完成后，所有业务模块已迁移到 `packages/app-vue`。Phase 3 将 `apps/web` 瘦身为一个轻量的"应用壳"（Thin Shell），只负责平台特定配置（HTTP 适配器注入、Vite 开发服务器、PWA 等），不包含任何业务逻辑。

---

## 3.1 目标目录结构

```
apps/web/
├── index.html
├── package.json                # 依赖: @dailyuse/app-vue, @dailyuse/ui-vue-shadcn,
│                               #   各领域包的 infrastructure-client, @dailyuse/http-client
├── src/
│   ├── main.ts                 # 入口: createApp → Pinia → Router → HTTP 适配器 → mount
│   ├── App.vue                 # 全局 UI 壳: progress bar, toaster, error boundary
│   ├── platform/               # Web 平台特定配置（从 shared/ 重构）
│   │   ├── di.ts               # provide HTTP 适配器实例
│   │   ├── pwa.ts              # PWA/Service Worker 注册（可选）
│   │   └── mocks.ts            # MSW 配置（开发环境 mock API）
│   └── styles/
│       ├── index.css           # Tailwind 入口 + 全局样式
│       ├── priority-colors.css # 颜色主题 token
│       └── settings-animations.css # 动画工具类
├── public/
├── e2e/                        # E2E 测试（保留）
├── vite.config.ts              # Vite 配置（保留，含 API 代理）
└── tsconfig.json
```

---

## 3.2 删除内容

### 3.2.1 删除 `apps/web/src/modules/` 目录

Phase 2 完成后，所有模块代码已迁移到 `packages/app-vue/src/modules/`。

**删除清单**:

| 目录 | 文件数（约） | 状态 |
|------|------------|------|
| `modules/task/` | ~15 | 已迁移到 app-vue |
| `modules/goal/` | ~17 | 已迁移到 app-vue |
| `modules/schedule/` | ~10 | 已迁移到 app-vue |
| `modules/reminder/` | ~12 | 已迁移到 app-vue |
| `modules/repository/` | ~13 | 已迁移到 app-vue |
| `modules/account/` | ~8 | 已迁移到 app-vue |
| `modules/authentication/` | ~9 | 已迁移到 app-vue |
| `modules/editor/` | ~6 | 已迁移到 app-vue |
| `modules/notification/` | ~11 | 已迁移到 app-vue |
| `modules/setting/` | ~10 | 已迁移到 app-vue |
| `modules/governance/` | ~11 | 已迁移到 app-vue |
| `modules/app/` | ~4 | Phase 0 已删除 |
| **总计** | **~126** | |

```bash
rm -rf apps/web/src/modules/
```

### 3.2.2 删除 `apps/web/src/layouts/`

MainLayout 已迁移到 `packages/app-vue/src/layouts/`。

```bash
rm -rf apps/web/src/layouts/
```

### 3.2.3 删除 `apps/web/src/views/`

WelcomeView 和 NotFoundView 已迁移到 `packages/app-vue/src/views/`。

```bash
rm -rf apps/web/src/views/
```

### 3.2.4 删除 `apps/web/src/router/`

路由已迁移到 `packages/app-vue/src/router/`。

```bash
rm -rf apps/web/src/router/
```

### 3.2.5 重构 `apps/web/src/shared/`

| 原文件 | 操作 | 说明 |
|--------|------|------|
| `shared/di/index.ts` | 重构为 `platform/di.ts` | 保留 HTTP 适配器创建逻辑，改为使用 app-vue 的 DI Keys |
| `shared/http/httpClient.ts` | 移入 `platform/` 或删除 | 如 Phase 0 已删除 deprecated 版本，确认 resultHttpClient 引用路径 |
| `shared/utils/` | 删除 | 工具已迁移到 app-vue/shared/utils/ |

---

## 3.3 重写 `main.ts`

### 3.3.1 重写后的 main.ts

```typescript
/**
 * Web App Entry Point (Thin Shell)
 *
 * 职责：
 * 1. 创建 Vue App
 * 2. 安装 Pinia（状态管理）
 * 3. 安装 app-vue 路由（统一路由表）
 * 4. 注入 HTTP 适配器（Web 平台特定）
 * 5. 挂载应用
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { createWebHistory } from 'vue-router';
import App from './App.vue';

// app-vue 核心
import { createAppRouter } from '@dailyuse/app-vue';

// Web 平台特定
import { installHttpAdapters } from './platform/di';

import './styles/index.css';

async function startApp() {
  // 开发环境 Mock API
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK_API === 'true') {
    const { worker } = await import('./platform/mocks');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }

  const app = createApp(App);

  // Pinia
  const pinia = createPinia();
  pinia.use(piniaPluginPersistedstate);
  app.use(pinia);

  // 路由（Web 使用 HTML5 History 模式）
  const router = createAppRouter({
    historyCreator: createWebHistory,
  });
  app.use(router);

  // 注入 HTTP 适配器（Web 平台 DI）
  app.use(installHttpAdapters);

  app.mount('#app');
}

startApp();
```

### 3.3.2 `platform/di.ts` — HTTP 适配器注入

```typescript
/**
 * Web Platform DI Configuration
 *
 * 注入 HTTP 适配器实例，使 app-vue 中的业务模块
 * 通过 inject(SERVICE_KEY) 获取到 HTTP 版本的服务实现
 */
import type { App } from 'vue';
import { resultHttpClient } from '@dailyuse/http-client';

// DI Keys（从 app-vue 导入）
import {
  TASK_TEMPLATE_SERVICE_KEY,
  TASK_INSTANCE_SERVICE_KEY,
  GOAL_SERVICE_KEY,
  SCHEDULE_SERVICE_KEY,
  REMINDER_SERVICE_KEY,
  REPOSITORY_SERVICE_KEY,
  ACCOUNT_SERVICE_KEY,
  AUTH_SERVICE_KEY,
  NOTIFICATION_SERVICE_KEY,
  SETTING_SERVICE_KEY,
  RULE_SERVICE_KEY,
} from '@dailyuse/app-vue';

// HTTP 适配器工厂（从各领域包导入）
import { createTaskHttpAdapters } from '@dailyuse/task/infrastructure-client';
import { createGoalHttpAdapters } from '@dailyuse/goal/infrastructure-client';
import { createScheduleHttpAdapters } from '@dailyuse/schedule/infrastructure-client';
import { createReminderHttpAdapters } from '@dailyuse/reminder/infrastructure-client';
import { createRepositoryHttpAdapters } from '@dailyuse/repository/infrastructure-client';
import { createAccountHttpAdapters } from '@dailyuse/account/infrastructure-client';
import { createAuthHttpAdapters } from '@dailyuse/authentication/infrastructure-client';
import { createNotificationHttpAdapters } from '@dailyuse/notification/infrastructure-client';
import { createSettingHttpAdapters } from '@dailyuse/setting/infrastructure-client';
import { createGovernanceHttpAdapters } from '@dailyuse/governance/infrastructure-client';

export function installHttpAdapters(app: App) {
  const httpClient = resultHttpClient;

  // Task（多个子服务）
  const taskAdapters = createTaskHttpAdapters(httpClient);
  app.provide(TASK_TEMPLATE_SERVICE_KEY, taskAdapters.templateApi);
  app.provide(TASK_INSTANCE_SERVICE_KEY, taskAdapters.instanceApi);

  // Goal
  const goalAdapters = createGoalHttpAdapters(httpClient);
  app.provide(GOAL_SERVICE_KEY, goalAdapters.goalApi);

  // Schedule
  app.provide(SCHEDULE_SERVICE_KEY, createScheduleHttpAdapters(httpClient));

  // Reminder
  app.provide(REMINDER_SERVICE_KEY, createReminderHttpAdapters(httpClient));

  // Repository
  app.provide(REPOSITORY_SERVICE_KEY, createRepositoryHttpAdapters(httpClient));

  // Account
  app.provide(ACCOUNT_SERVICE_KEY, createAccountHttpAdapters(httpClient));

  // Authentication
  app.provide(AUTH_SERVICE_KEY, createAuthHttpAdapters(httpClient));

  // Notification
  app.provide(NOTIFICATION_SERVICE_KEY, createNotificationHttpAdapters(httpClient));

  // Setting
  app.provide(SETTING_SERVICE_KEY, createSettingHttpAdapters(httpClient));

  // Governance
  app.provide(RULE_SERVICE_KEY, createGovernanceHttpAdapters(httpClient));
}
```

> **注意**: 上述代码中的适配器工厂函数名（如 `createTaskHttpAdapters`）需对照各包的实际导出名称进行调整。

### 3.3.3 `platform/mocks.ts` — MSW Mock 配置

从原 `apps/web/src/mocks/` 迁移或重新引用：

```typescript
export { worker } from '../mocks/browser';
// 或直接从 apps/web/src/mocks/ 保留 mocks 目录
```

---

## 3.4 App.vue 保持不变

当前 `App.vue` 已经非常精简：
- 进度条（Progress Bar）
- 错误边界（Error Boundary）
- 全局 Overlay（Toaster, ConfirmDialog, Sheet, CommandPalette）
- `<RouterView />`

这些都是 Web 平台的全局 UI 元素，保留在 Web 应用壳中是合理的。

> **后续优化**: 部分全局组件（如 Toaster, ConfirmDialog）可考虑迁入 app-vue 的 App 层，使 Desktop 也能共享。

---

## 3.5 更新 package.json

### 3.5.1 新增依赖

```jsonc
{
  "dependencies": {
    "@dailyuse/app-vue": "workspace:*"  // 新增核心共享包
  }
}
```

### 3.5.2 可能移除的依赖

Phase 2 迁移后，部分直接依赖可能转为通过 `@dailyuse/app-vue` 间接依赖。但考虑到 `platform/di.ts` 仍需直接 import 各包的适配器工厂，大部分领域包依赖仍需保留。

---

## 3.6 更新 Vite 配置

### 3.6.1 路径别名更新

```typescript
// vite.config.ts
resolve: {
  alias: {
    '@': resolve(__dirname, './src'),
    // 移除旧的模块路径别名（如有）
  },
}
```

### 3.6.2 API 代理保持不变

```typescript
server: {
  port: 5173,
  proxy: {
    '/api/v1': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

---

## 3.7 验证步骤

```bash
# 1. 安装依赖
pnpm install

# 2. 编译
nx build web

# 3. 测试
nx test web

# 4. 开发服务器验证
pnpm dev:web
# 在浏览器中验证：
# - 登录流程正常
# - 所有模块页面可访问
# - 所有路由跳转正常
# - 全局 overlay 正常（toaster, dialog 等）

# 5. 文件结构验证
# apps/web/src/ 应该只有：
# main.ts, App.vue, platform/, styles/, mocks/（如保留）
find apps/web/src -type f | head -20

# 6. 确认无残留引用
grep -r "from '@/modules" apps/web/src/
grep -r "from '../modules" apps/web/src/
grep -r "from './modules" apps/web/src/
# 应该没有结果
```

---

## 3.8 瘦身效果预估

| 指标 | Phase 3 前 | Phase 3 后 | 减少 |
|------|-----------|-----------|------|
| `src/` 文件数 | ~140+ | ~10 | **~93%** |
| `src/` 目录数 | ~40+ | ~5 | **~88%** |
| 业务逻辑文件 | ~130 | 0 | **100%** |
| 平台特定文件 | ~10 | ~10 | 不变 |

---

## 3.9 检查清单

- [ ] 删除 `apps/web/src/modules/` 整个目录
- [ ] 删除 `apps/web/src/layouts/` 目录
- [ ] 删除 `apps/web/src/views/` 目录
- [ ] 删除 `apps/web/src/router/` 目录
- [ ] 重构 `shared/` 为 `platform/`
- [ ] 重写 `main.ts`（使用 app-vue 路由 + DI）
- [ ] 保持 `App.vue` 不变
- [ ] 更新 `package.json` 添加 `@dailyuse/app-vue` 依赖
- [ ] 更新 Vite 配置（如需）
- [ ] 验证所有路由和功能正常
- [ ] 验证 build + test + typecheck 通过
- [ ] 确认无残留模块引用
