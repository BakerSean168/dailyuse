# Phase 1: 创建 app-vue 包骨架 (预计 2-3 天)

## 目标

创建 `packages/app-vue` 共享 Vue 3 展示层包，统一 Web 和 Desktop (renderer) 的 UI 逻辑。该包将成为两个前端应用的核心共享层。

---

## 1.1 创建包基础结构

### 1.1.1 包初始化

```bash
# 方式一：使用 Nx 生成器（推荐）
nx g @nx/vue:library app-vue --directory=packages/app-vue --bundler=vite

# 方式二：手动创建（如生成器不满足需求）
mkdir -p packages/app-vue/src
```

### 1.1.2 目录结构

```
packages/app-vue/
├── package.json
├── project.json
├── tsconfig.json
├── tsconfig.lib.json
├── vite.config.ts              # lib mode 打包
├── src/
│   ├── index.ts                # barrel export
│   │
│   ├── di/                     # DI 接口定义 + InjectionKeys
│   │   ├── keys.ts             # 所有 InjectionKey 定义
│   │   └── types.ts            # 服务接口类型（从各领域包 re-export）
│   │
│   ├── router/                 # 统一路由表
│   │   ├── index.ts            # createAppRouter() 工厂函数
│   │   └── guards.ts           # 路由守卫
│   │
│   ├── layouts/                # 布局组件
│   │   ├── MainLayout.vue      # 从 apps/web/src/layouts/ 迁入
│   │   └── AuthLayout.vue      # 新建（如需）
│   │
│   ├── modules/                # 领域模块（Phase 2 逐步填充）
│   │   └── .gitkeep
│   │
│   ├── shared/                 # 跨模块共享工具
│   │   └── utils/
│   │       └── result-helpers.ts
│   │
│   └── views/                  # 非模块页面
│       ├── WelcomeView.vue     # 从 apps/web/src/views/ 迁入
│       ├── DashboardView.vue   # 新建骨架（Phase 4 丰富）
│       └── NotFoundView.vue    # 404 页面
```

### 1.1.3 package.json

```jsonc
{
  "name": "@dailyuse/app-vue",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    // Vue 生态
    "vue": "^3.4.0",
    "vue-router": "^4.0.0",
    "pinia": "^3.0.0",
    
    // 内部包
    "@dailyuse/ui-vue-shadcn": "workspace:*",
    "@dailyuse/ui-core": "workspace:*",
    "@dailyuse/contracts": "workspace:*",
    "@dailyuse/utils": "workspace:*",
    
    // 领域包类型（仅 types）
    "@dailyuse/task": "workspace:*",
    "@dailyuse/goal": "workspace:*",
    "@dailyuse/schedule": "workspace:*",
    "@dailyuse/reminder": "workspace:*",
    "@dailyuse/repository": "workspace:*",
    "@dailyuse/account": "workspace:*",
    "@dailyuse/authentication": "workspace:*",
    "@dailyuse/notification": "workspace:*",
    "@dailyuse/setting": "workspace:*",
    "@dailyuse/governance": "workspace:*",
    "@dailyuse/editor": "workspace:*",
    
    // Icons
    "lucide-vue-next": "^0.400.0"
  },
  "peerDependencies": {
    "vue": "^3.4.0"
  }
}
```

### 1.1.4 project.json

```jsonc
{
  "name": "app-vue",
  "sourceRoot": "packages/app-vue/src",
  "projectType": "library",
  "tags": ["scope:app-vue", "type:lib"]
}
```

### 1.1.5 vite.config.ts

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', 'vue-router', 'pinia'],
    },
  },
  resolve: {
    alias: {
      // 根据 tsconfig.base.json 配置
    },
  },
});
```

---

## 1.2 定义 DI 接口

### 1.2.1 `src/di/types.ts` — 服务接口类型

从各领域包 re-export 服务接口，统一管理：

```typescript
// 从各领域包 re-export 服务接口类型
// Task 模块
export type {
  ITaskTemplateApiClient,
  ITaskInstanceApiClient,
  ITaskDependencyApiClient,
} from '@dailyuse/task/infrastructure-client';

// Goal 模块
export type {
  IGoalApiClient,
  IGoalFolderApiClient,
  IGoalFocusApiClient,
} from '@dailyuse/goal/infrastructure-client';

// Schedule 模块
export type {
  IScheduleApiClient,
} from '@dailyuse/schedule/infrastructure-client';

// Reminder 模块
export type {
  IReminderTemplateApiClient,
  IReminderInstanceApiClient,
} from '@dailyuse/reminder/infrastructure-client';

// Repository 模块
export type {
  IRepositoryApiClient,
} from '@dailyuse/repository/infrastructure-client';

// Account 模块
export type {
  IAccountApiClient,
} from '@dailyuse/account/infrastructure-client';

// Authentication 模块
export type {
  IAuthApiClient,
} from '@dailyuse/authentication/infrastructure-client';

// Notification 模块
export type {
  INotificationApiClient,
} from '@dailyuse/notification/infrastructure-client';

// Setting 模块
export type {
  ISettingApiClient,
} from '@dailyuse/setting/infrastructure-client';

// Governance 模块
export type {
  IRuleApiClient,
} from '@dailyuse/governance/infrastructure-client';
```

> **注意**: 上述接口名称需对照各包 `infrastructure-client/types.ts` 的实际导出名称进行调整。当前已确认的接口包括 `ITaskTemplateApiClient`、`IGoalApiClient` 等。

### 1.2.2 `src/di/keys.ts` — InjectionKey 定义

```typescript
import type { InjectionKey } from 'vue';
import type {
  ITaskTemplateApiClient,
  ITaskInstanceApiClient,
  IGoalApiClient,
  IScheduleApiClient,
  IReminderTemplateApiClient,
  IRepositoryApiClient,
  IAccountApiClient,
  IAuthApiClient,
  INotificationApiClient,
  ISettingApiClient,
  IRuleApiClient,
  // ... 其他接口
} from './types';

// === Task ===
export const TASK_TEMPLATE_SERVICE_KEY: InjectionKey<ITaskTemplateApiClient> =
  Symbol('TaskTemplateService');
export const TASK_INSTANCE_SERVICE_KEY: InjectionKey<ITaskInstanceApiClient> =
  Symbol('TaskInstanceService');

// === Goal ===
export const GOAL_SERVICE_KEY: InjectionKey<IGoalApiClient> =
  Symbol('GoalService');

// === Schedule ===
export const SCHEDULE_SERVICE_KEY: InjectionKey<IScheduleApiClient> =
  Symbol('ScheduleService');

// === Reminder ===
export const REMINDER_SERVICE_KEY: InjectionKey<IReminderTemplateApiClient> =
  Symbol('ReminderService');

// === Repository ===
export const REPOSITORY_SERVICE_KEY: InjectionKey<IRepositoryApiClient> =
  Symbol('RepositoryService');

// === Account ===
export const ACCOUNT_SERVICE_KEY: InjectionKey<IAccountApiClient> =
  Symbol('AccountService');

// === Authentication ===
export const AUTH_SERVICE_KEY: InjectionKey<IAuthApiClient> =
  Symbol('AuthService');

// === Notification ===
export const NOTIFICATION_SERVICE_KEY: InjectionKey<INotificationApiClient> =
  Symbol('NotificationService');

// === Setting ===
export const SETTING_SERVICE_KEY: InjectionKey<ISettingApiClient> =
  Symbol('SettingService');

// === Governance ===
export const RULE_SERVICE_KEY: InjectionKey<IRuleApiClient> =
  Symbol('RuleService');
```

> **关键对齐**: 这些 Key 需要与 `apps/web/src/shared/di/index.ts` 中现有的 Key 对齐。当前 Web 中已定义了类似的 Key（如 `TASK_SERVICE_KEY`、`GOAL_SERVICE_KEY` 等）。迁移时需确保命名一致。

---

## 1.3 创建统一路由表

### 1.3.1 当前路由注册现状

**问题**: 当前 `apps/web/src/router/index.ts` **只注册了 2 个模块路由**（account 和 governance），而以下模块有路由定义但未注册：

| 模块 | 有路由文件 | 已注册 | 状态 |
|------|----------|--------|------|
| account | ✅ | ✅ | 正常 |
| governance | ✅ | ✅ | 正常 |
| task | ✅ (`presentation/router/`) | ❌ | **缺失** |
| goal | ✅ (`presentation/router/`) | ❌ | **缺失** |
| schedule | ✅ (`presentation/router/`) | ❌ | **缺失** |
| reminder | ✅ (`presentation/router/`) | ❌ | **缺失** |
| repository | ✅ (`presentation/router/`) | ❌ | **缺失** |
| notification | ✅ (`presentation/router/`) | ❌ | **缺失** |
| setting | ✅ (`presentation/router/`) | ❌ | **缺失** |
| authentication | ❌（用 AuthView） | — | 特殊处理 |
| editor | ❌ | — | 无独立路由 |

### 1.3.2 `src/router/index.ts` — 统一路由工厂

```typescript
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { createAuthGuard } from './guards';

// 布局组件
import MainLayout from '../layouts/MainLayout.vue';

// 模块路由（懒加载）
// 后续在 Phase 2 迁移时逐步添加各模块路由

/**
 * 创建应用路由器
 * @param historyMode - 路由模式（Web 用 createWebHistory，Desktop 用 createWebHashHistory）
 */
export function createAppRouter(options?: {
  historyCreator?: typeof createWebHistory;
  additionalRoutes?: RouteRecordRaw[];
}) {
  const { historyCreator = createWebHistory, additionalRoutes = [] } = options ?? {};

  const routes: RouteRecordRaw[] = [
    // 认证路由（不需要登录）
    {
      path: '/auth',
      name: 'auth',
      component: () => import('../views/AuthView.vue'),
      meta: { requiresAuth: false, layout: 'auth' },
    },

    // 主布局路由（需要登录）
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'welcome',
          component: () => import('../views/WelcomeView.vue'),
          meta: { title: '首页' },
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
          meta: { title: '仪表盘' },
        },
        // Phase 2 中逐步添加各模块路由:
        // ...taskRoutes,
        // ...goalRoutes,
        // ...scheduleRoutes,
        // ...reminderRoutes,
        // ...repositoryRoutes,
        // ...notificationRoutes,
        // ...accountRoutes,
        // ...settingRoutes,
        // ...governanceRoutes,
        ...additionalRoutes,
      ],
    },

    // 404
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ];

  const router = createRouter({
    history: historyCreator(),
    routes,
  });

  // 注册守卫
  const authGuard = createAuthGuard();
  router.beforeEach(authGuard);

  return router;
}
```

### 1.3.3 `src/router/guards.ts` — 路由守卫

```typescript
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';

/**
 * 创建认证守卫
 * 依赖外部注入的认证状态检查函数，避免直接依赖 Pinia store
 */
export function createAuthGuard(options?: {
  isAuthenticated?: () => boolean;
  loginRoute?: string;
}) {
  const { isAuthenticated, loginRoute = '/auth' } = options ?? {};

  return (
    to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext,
  ) => {
    if (to.meta.requiresAuth !== false) {
      const authenticated = isAuthenticated?.() ?? false;
      if (!authenticated) {
        next({ path: loginRoute, query: { redirect: to.fullPath } });
        return;
      }
    }
    next();
  };
}
```

---

## 1.4 迁移布局组件

### 1.4.1 MainLayout.vue

**来源**: `apps/web/src/layouts/MainLayout.vue`

**迁移要点**:
- 移入 `packages/app-vue/src/layouts/MainLayout.vue`
- 当前 MainLayout 直接引用了 `useAuthenticationStore` 和 `useRouter`
- 迁移后需将 store 依赖改为通过 DI 注入或 props 传递
- 导航项通过配置注入，而非硬编码（支持 Web/Desktop 不同导航）

**目标 API**:
```vue
<script setup lang="ts">
import { inject } from 'vue';
import { NAVIGATION_CONFIG_KEY } from '../di/keys';

// 导航项通过 DI 注入，Web 和 Desktop 可提供不同配置
const navigationConfig = inject(NAVIGATION_CONFIG_KEY);
</script>
```

### 1.4.2 AuthLayout.vue（新建）

简单的认证页面布局，居中卡片样式：

```vue
<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <slot />
  </div>
</template>
```

---

## 1.5 迁移共享工具

### 1.5.1 result-helpers.ts

**来源**: `apps/web/src/shared/utils/` 中与 Result 模式相关的工具函数

**内容**: 统一的 Result<T> 处理辅助函数，用于在 composables 中优雅地处理 API 返回的 Result 类型

---

## 1.6 更新 tsconfig.base.json

添加新包的路径别名：

```jsonc
{
  "compilerOptions": {
    "paths": {
      // 新增
      "@dailyuse/app-vue": ["packages/app-vue/src/index.ts"],
      // ... 其他已有路径
    }
  }
}
```

---

## 1.7 验证步骤

```bash
# 1. 确保新包可被 Nx 识别
nx show project app-vue

# 2. 编译新包
nx build app-vue

# 3. TypeScript 类型检查
nx run app-vue:typecheck

# 4. 确保不影响现有应用
nx build web
nx test web
```

---

## 1.8 交付物清单

完成 Phase 1 后，`packages/app-vue` 应具备：

- [ ] 完整的包配置（`package.json`、`project.json`、`tsconfig.json`、`vite.config.ts`）
- [ ] DI 接口定义（`di/keys.ts`、`di/types.ts`）
- [ ] 统一路由工厂函数（`router/index.ts`、`router/guards.ts`）
- [ ] MainLayout 组件（支持 DI 配置导航项）
- [ ] 共享工具（`shared/utils/result-helpers.ts`）
- [ ] 基础页面骨架（WelcomeView、DashboardView、NotFoundView）
- [ ] `tsconfig.base.json` 已添加路径别名
- [ ] `nx build app-vue` 通过
- [ ] 不影响现有 `nx build web` 和 `nx test web`

---

## 1.9 架构决策记录

### ADR-1: 路由模式抽象

**决策**: `createAppRouter` 接受 `historyCreator` 参数
**原因**: Web 使用 `createWebHistory`（HTML5 History），Desktop 使用 `createWebHashHistory`（Hash 模式，兼容 Electron file:// 协议）

### ADR-2: DI Key 命名统一

**决策**: 所有 InjectionKey 使用 `{MODULE}_{ROLE}_KEY` 命名模式（如 `TASK_TEMPLATE_SERVICE_KEY`）
**原因**: 避免歧义，支持单模块多服务场景（如 Task 模块有 Template、Instance、Dependency 三个服务）

### ADR-3: MainLayout 导航可配置

**决策**: MainLayout 的导航项通过 DI 注入而非硬编码
**原因**: Web 和 Desktop 的导航需求不同（Desktop 可能有系统托盘、同步状态等额外元素）
