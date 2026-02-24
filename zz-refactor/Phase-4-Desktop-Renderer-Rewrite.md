# Phase 4: Desktop Renderer 重写 (预计 3-5 天)

## 目标

将 Desktop 应用的 Renderer 进程从 React 重写为 Vue 3，复用 `packages/app-vue` 共享层，实现 Web 和 Desktop 前端的统一。Main 进程和 Preload 进程保持不变。

---

## 4.1 架构概览

### 4.1.1 不变的部分

| 组件 | 路径 | 说明 |
|------|------|------|
| Main 进程 | `apps/desktop/src/main/` | Electron 主进程，模块化架构，SQLite、IPC 注册 |
| Preload 脚本 | `apps/desktop/src/preload/preload.ts` | Context Bridge，~416 个白名单 IPC 通道 |
| IPC 通道定义 | 各模块 `electron-entry` | 业务 IPC 处理器自注册 |
| 构建工具 | `vite-plugin-electron` | 三进程分离构建 |

### 4.1.2 重写的部分

| 组件 | 当前 | 目标 |
|------|------|------|
| Renderer 框架 | React 19 + React Router + Zustand | Vue 3 + Vue Router + Pinia |
| UI 组件库 | `@dailyuse/ui-react-shadcn` | `@dailyuse/ui-vue-shadcn` + `@dailyuse/app-vue` |
| 图标库 | `lucide-react` | `lucide-vue-next` |
| 状态管理 | Zustand | Pinia（通过 app-vue） |
| 动画库 | `framer-motion` | Vue Transition / CSS animations |
| 拖拽库 | `@dnd-kit` | `vuedraggable` 或 Vue 版拖拽方案 |

### 4.1.3 IPC 通道架构

Desktop Renderer 通过 `window.electronAPI` 与 Main 进程通信：

```typescript
// Context Bridge 暴露的 API
window.electronAPI = {
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  on: (channel: string, callback: Function) => ipcRenderer.on(channel, callback),
  off: (channel: string, callback: Function) => ipcRenderer.removeListener(channel, callback),
};
```

**通道分类**（~416 个）：
- `goal:*` — 目标管理
- `task:*` — 任务管理
- `schedule:*` — 日程管理
- `reminder:*` — 提醒管理
- `notification:*` — 通知管理
- `ai:*` — AI 功能
- `auth:*` — 认证
- `sync:*` — 同步
- `desktop:*` — 桌面特有功能
- `window:*` — 窗口管理（minimize-login, close-login, transition-to-main）
- `settings:*` — 设置（get, set, reset）

---

## 4.2 实施策略

### 4.2.1 新建目录（避免覆盖旧代码）

```bash
# 创建新的 Vue renderer 目录
mkdir -p apps/desktop/src/renderer-vue/
```

新旧 renderer 并存，待验证完成后再删除旧的：

```
apps/desktop/src/
├── main/                    # 保持不变
├── preload/                 # 保持不变
├── renderer/                # 旧 React 代码（Phase 4 结束后删除）
├── renderer-vue/            # 新 Vue 3 代码
│   ├── main.ts              # Vue 入口
│   ├── App.vue              # 根组件
│   ├── platform/            # Desktop 平台特定
│   │   ├── di.ts            # IPC 适配器注入
│   │   ├── electron.ts      # 窗口控制、托盘 hooks
│   │   └── TitleBar.vue     # 自定义标题栏
│   └── styles/
│       └── index.css
├── shared/                  # 保持不变
└── types/                   # 保持不变
```

### 4.2.2 逐步切换

1. 先创建 `renderer-vue/` 并确保基本渲染
2. 修改 `vite.config.ts` 的 renderer 入口指向新目录
3. 验证所有功能
4. 删除 `renderer/`（旧 React 代码）
5. 将 `renderer-vue/` 重命名为 `renderer/`

---

## 4.3 创建 Vue Renderer

### 4.3.1 `renderer-vue/main.ts` — 入口文件

```typescript
/**
 * Desktop Renderer Entry Point (Vue 3 Thin Shell)
 *
 * 职责：
 * 1. 创建 Vue App
 * 2. 安装 Pinia
 * 3. 安装 app-vue 路由（Hash 模式）
 * 4. 注入 IPC 适配器（Desktop 平台特定）
 * 5. 初始化 Electron 特有功能
 * 6. 挂载应用
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { createWebHashHistory } from 'vue-router';
import App from './App.vue';

import { createAppRouter } from '@dailyuse/app-vue';
import { installIpcAdapters } from './platform/di';
import { initElectronFeatures } from './platform/electron';

import './styles/index.css';

async function startApp() {
  const app = createApp(App);

  // Pinia
  const pinia = createPinia();
  pinia.use(piniaPluginPersistedstate);
  app.use(pinia);

  // 路由（Desktop 使用 Hash 模式，兼容 file:// 协议）
  const router = createAppRouter({
    historyCreator: createWebHashHistory,
  });
  app.use(router);

  // 注入 IPC 适配器（Desktop 平台 DI）
  app.use(installIpcAdapters);

  // 初始化 Electron 特有功能
  initElectronFeatures(app);

  app.mount('#app');
}

startApp();
```

### 4.3.2 `renderer-vue/platform/di.ts` — IPC 适配器注入

```typescript
/**
 * Desktop Platform DI Configuration
 *
 * 注入 IPC 适配器实例，使 app-vue 中的业务模块
 * 通过 inject(SERVICE_KEY) 获取到 IPC 版本的服务实现
 */
import type { App } from 'vue';
import { resultIpcClient } from '@dailyuse/ipc-client';

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

// IPC 适配器工厂（从各领域包导入）
import { createTaskIpcAdapters } from '@dailyuse/task/infrastructure-client';
import { createGoalIpcAdapters } from '@dailyuse/goal/infrastructure-client';
import { createScheduleIpcAdapters } from '@dailyuse/schedule/infrastructure-client';
import { createReminderIpcAdapters } from '@dailyuse/reminder/infrastructure-client';
import { createRepositoryIpcAdapters } from '@dailyuse/repository/infrastructure-client';
import { createAccountIpcAdapters } from '@dailyuse/account/infrastructure-client';
import { createAuthIpcAdapters } from '@dailyuse/authentication/infrastructure-client';
import { createNotificationIpcAdapters } from '@dailyuse/notification/infrastructure-client';
import { createSettingIpcAdapters } from '@dailyuse/setting/infrastructure-client';
import { createGovernanceIpcAdapters } from '@dailyuse/governance/infrastructure-client';

export function installIpcAdapters(app: App) {
  const ipcClient = resultIpcClient;

  // Task
  const taskAdapters = createTaskIpcAdapters(ipcClient);
  app.provide(TASK_TEMPLATE_SERVICE_KEY, taskAdapters.templateApi);
  app.provide(TASK_INSTANCE_SERVICE_KEY, taskAdapters.instanceApi);

  // Goal
  const goalAdapters = createGoalIpcAdapters(ipcClient);
  app.provide(GOAL_SERVICE_KEY, goalAdapters.goalApi);

  // Schedule
  app.provide(SCHEDULE_SERVICE_KEY, createScheduleIpcAdapters(ipcClient));

  // Reminder
  app.provide(REMINDER_SERVICE_KEY, createReminderIpcAdapters(ipcClient));

  // Repository
  app.provide(REPOSITORY_SERVICE_KEY, createRepositoryIpcAdapters(ipcClient));

  // Account
  app.provide(ACCOUNT_SERVICE_KEY, createAccountIpcAdapters(ipcClient));

  // Authentication
  app.provide(AUTH_SERVICE_KEY, createAuthIpcAdapters(ipcClient));

  // Notification
  app.provide(NOTIFICATION_SERVICE_KEY, createNotificationIpcAdapters(ipcClient));

  // Setting
  app.provide(SETTING_SERVICE_KEY, createSettingIpcAdapters(ipcClient));

  // Governance
  app.provide(RULE_SERVICE_KEY, createGovernanceIpcAdapters(ipcClient));
}
```

> **注意**: 适配器工厂函数名需对照各包的实际 IPC 导出名称调整。

### 4.3.3 `renderer-vue/App.vue` — 根组件

```vue
<template>
  <div class="app-root" :class="{ 'has-titlebar': isElectron }">
    <!-- 自定义标题栏（仅 Desktop frameless window） -->
    <TitleBar v-if="isElectron" />

    <!-- 全局 UI 壳 -->
    <Toaster />
    <ConfirmDialog />

    <!-- 路由视图 -->
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import { Toaster } from '@dailyuse/ui-vue-shadcn';
import { ConfirmDialog } from '@dailyuse/ui-vue-shadcn';
import TitleBar from './platform/TitleBar.vue';

const isElectron = !!window.electronAPI;
</script>
```

---

## 4.4 Desktop 特有功能实现

### 4.4.1 自定义标题栏 (`platform/TitleBar.vue`)

**需求**: Desktop 使用 frameless window，需要自定义标题栏提供拖拽区域和窗口控制按钮。

```vue
<template>
  <div class="titlebar" style="-webkit-app-region: drag">
    <div class="titlebar-title">DailyUse</div>
    <div class="titlebar-controls" style="-webkit-app-region: no-drag">
      <button @click="minimize">—</button>
      <button @click="maximize">□</button>
      <button @click="close">✕</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const api = window.electronAPI;

function minimize() {
  api?.invoke('window:minimize');
}
function maximize() {
  api?.invoke('window:toggle-maximize');
}
function close() {
  api?.invoke('window:close');
}
</script>
```

### 4.4.2 Electron 特有功能初始化 (`platform/electron.ts`)

```typescript
import type { App } from 'vue';

export function initElectronFeatures(app: App) {
  if (!window.electronAPI) return;

  // 1. 系统托盘状态同步
  setupTraySync();

  // 2. 快捷键注册
  setupShortcuts();

  // 3. 在线/离线状态监听
  setupOnlineStatus();

  // 4. 窗口状态管理
  setupWindowState();
}

function setupTraySync() {
  // 监听托盘相关 IPC 事件
  window.electronAPI?.on('tray:action', (_event: any, action: string) => {
    // 处理托盘点击事件
  });
}

function setupShortcuts() {
  // 注册全局快捷键响应
  window.electronAPI?.on('shortcut:triggered', (_event: any, shortcut: string) => {
    // 处理快捷键
  });
}

function setupOnlineStatus() {
  window.addEventListener('online', () => {
    // 通知 store 更新在线状态
  });
  window.addEventListener('offline', () => {
    // 通知 store 更新离线状态
  });
}

function setupWindowState() {
  // 恢复窗口位置和大小
  window.electronAPI?.invoke('window:get-state');
}
```

### 4.4.3 登录窗口处理

**当前架构**: Desktop 使用独立的登录窗口（multi-window 模式）。

**Vue 实现方案**:

```typescript
// 在 authentication 模块的 composable 中
// 通过 DI 注入 onLoginSuccess 回调

// Web 版本（在 apps/web/platform/di.ts 中注入）
const onLoginSuccess = () => {
  router.push('/');  // 路由跳转到首页
};

// Desktop 版本（在 apps/desktop/renderer-vue/platform/di.ts 中注入）
const onLoginSuccess = () => {
  window.electronAPI?.invoke('window:transition-to-main');  // 关闭登录窗口，显示主窗口
};
```

**DI Key**:
```typescript
// app-vue/di/keys.ts
export const ON_LOGIN_SUCCESS_KEY: InjectionKey<() => void> = Symbol('OnLoginSuccess');
```

### 4.4.4 离线状态处理

Desktop 需要支持离线模式，app-vue 中的 store 需感知网络状态：

```typescript
// app-vue/shared/composables/useOnlineStatus.ts
import { ref, onMounted, onUnmounted } from 'vue';

export function useOnlineStatus() {
  const isOnline = ref(navigator.onLine);

  function update() {
    isOnline.value = navigator.onLine;
  }

  onMounted(() => {
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
  });

  onUnmounted(() => {
    window.removeEventListener('online', update);
    window.removeEventListener('offline', update);
  });

  return { isOnline };
}
```

---

## 4.5 Vite 配置修改

### 4.5.1 修改 renderer 入口

```typescript
// vite.config.ts (修改 renderer 部分)

// 修改前
renderer: {
  root: 'src/renderer',
  // ...
  plugins: [react(), tailwindcss()],
}

// 修改后
renderer: {
  root: 'src/renderer-vue',  // 指向新目录
  // ...
  plugins: [vue(), tailwindcss()],  // React → Vue
}
```

### 4.5.2 更新依赖

```jsonc
// package.json 修改
{
  "dependencies": {
    // 移除 React 相关
    // "react": "^19.2.1",
    // "react-dom": "^19.2.1",
    // "react-router-dom": "^7.10.1",
    // "zustand": "5.0.9",
    // "@dnd-kit/core": "...",
    // "framer-motion": "...",
    // "lucide-react": "...",

    // 新增 Vue 相关
    "vue": "^3.4.0",
    "vue-router": "^4.0.0",
    "pinia": "^3.0.0",
    "pinia-plugin-persistedstate": "^4.0.0",
    "lucide-vue-next": "^0.400.0",

    // 新增
    "@dailyuse/app-vue": "workspace:*",
    "@dailyuse/ui-vue-shadcn": "workspace:*",
    "@dailyuse/ipc-client": "workspace:*",

    // 保留
    "electron": "^39.2.6",
    "better-sqlite3": "^12.5.0",
    "electron-log": "^5.4.2",
    "date-fns": "^4.1.0",
    // ... 其他非 UI 框架依赖
  },
  "devDependencies": {
    // 移除
    // "@vitejs/plugin-react": "...",

    // 新增
    "@vitejs/plugin-vue": "^5.0.0",
  }
}
```

---

## 4.6 功能对照矩阵

### 4.6.1 当前 React Renderer 功能 → Vue 实现方案

| 功能 | React 实现 | Vue 实现方案 | 复杂度 |
|------|-----------|-------------|--------|
| 路由 | React Router (Hash) | Vue Router (Hash) via app-vue | 低 |
| 状态管理 | Zustand | Pinia via app-vue | 低 |
| 代码分割 | React.lazy + Suspense | defineAsyncComponent / 路由懒加载 | 低 |
| 自定义标题栏 | JSX + inline style | TitleBar.vue + CSS | 低 |
| 登录窗口 | 独立 React 组件 | AuthView + DI 回调 | 中 |
| 系统托盘 | IPC 调用 | IPC 调用（相同） | 低 |
| 快捷键 | IPC 事件监听 | IPC 事件监听（相同） | 低 |
| 在线/离线 | window 事件 | composable + window 事件 | 低 |
| 同步状态 | SyncStatusIndicator | Vue 组件 + composable | 中 |
| Account 状态 | AccountStatusIndicator | Vue 组件 + composable | 中 |
| Module 初始化 | bootstrap.ts | composable / app plugin | 中 |
| DI 配置 | 待完成 TODO | installIpcAdapters | 中 |

### 4.6.2 Desktop 当前路由

| 路由 | 组件 | 迁移来源 |
|------|------|---------|
| `/login` | LoginView | 需重写（平台特定） |
| `/` | DashboardView | app-vue 共享 |
| `/goals` | GoalListView | app-vue 共享 |
| `/tasks` | TaskListView | app-vue 共享 |
| `/schedule` | ScheduleView | app-vue 共享 |
| `/reminders` | ReminderView | app-vue 共享 |
| `/settings` | SettingsView | app-vue 共享 + Desktop 扩展 |
| `/governance/:id?` | RuleView | app-vue 共享 |
| `/ai` | AIView | app-vue 共享 |
| `/repository` | RepositoryView | app-vue 共享 |
| `/editor` | EditorView | app-vue 共享 |
| `/account` | AccountView | app-vue 共享 |

---

## 4.7 验证 IPC 通道

### 4.7.1 IPC 通道验证清单

确保所有 ~416 个 IPC 通道在 Vue renderer 中仍然可用：

```bash
# 列出 preload.ts 中的所有白名单通道
grep -oP "'[a-zA-Z:_-]+'" apps/desktop/src/preload/preload.ts | sort | wc -l

# 确保 IPC 适配器覆盖所有通道
# 各领域包的 IPC Adapter 已有实现，只需确认 import 路径正确
```

### 4.7.2 端到端功能验证

```bash
# 1. 编译 Desktop
nx build desktop

# 2. 启动开发模式
pnpm dev:desktop

# 3. 验证清单：
# - [ ] 登录窗口正常显示和关闭
# - [ ] 主窗口标题栏拖拽和按钮
# - [ ] 所有页面导航正常
# - [ ] 数据增删改查（经过 IPC 通道）
# - [ ] 系统托盘功能
# - [ ] 快捷键响应
# - [ ] 在线/离线切换
# - [ ] 同步功能
```

---

## 4.8 删除旧 React 代码

验证完成后，执行最终清理：

```bash
# 1. 删除旧 renderer
rm -rf apps/desktop/src/renderer/

# 2. 重命名新 renderer
mv apps/desktop/src/renderer-vue/ apps/desktop/src/renderer/

# 3. 更新 vite.config.ts 中的路径引用
# renderer.root: 'src/renderer'

# 4. 移除 React 依赖
# 从 package.json 移除 react, react-dom, react-router-dom, zustand 等

# 5. 重新安装依赖
pnpm install

# 6. 最终验证
nx build desktop
```

---

## 4.9 风险与注意事项

| 风险 | 缓解措施 |
|------|----------|
| Electron 版本兼容性 | Vue 3 对 Electron 39 支持良好，无兼容性问题 |
| IPC 适配器接口不对称 | Phase 1 已在 DI 定义中对齐，此处使用相同接口 |
| Frameless window 行为差异 | TitleBar.vue 参考 React 版实现，保持一致 |
| 多窗口登录流程 | 通过 DI 注入 `onLoginSuccess` 回调，保持 app-vue 不感知窗口管理 |
| 构建性能 | Vue 编译比 React 快（SFC 编译优化），不是风险 |
| `better-sqlite3` 原生模块 | 仅在 Main 进程使用，Renderer 不受影响 |

---

## 4.10 检查清单

- [ ] 创建 `renderer-vue/` 目录结构
- [ ] 实现 `main.ts`（Vue 入口）
- [ ] 实现 `App.vue`（根组件 + 标题栏）
- [ ] 实现 `platform/di.ts`（IPC 适配器注入）
- [ ] 实现 `platform/electron.ts`（Electron 特有功能）
- [ ] 实现 `platform/TitleBar.vue`（自定义标题栏）
- [ ] 修改 `vite.config.ts` renderer 入口
- [ ] 更新 `package.json` 依赖（React → Vue）
- [ ] 验证所有 IPC 通道正常工作
- [ ] 验证登录窗口流程
- [ ] 验证系统托盘功能
- [ ] 验证快捷键
- [ ] 验证在线/离线切换
- [ ] 删除旧 React renderer
- [ ] 最终 build + 功能验证
