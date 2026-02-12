# Web 端组件架构说明

## 📁 完整目录结构

```
├── packages/
│   ├── contracts/                  # [L0] 类型契约层（DTO、API Schema）
│   │   └── src/
│   │       └── modules/
│   │           ├── account/
│   │           │   ├── value-objects/  # AccountProfileDTO, GenderType
│   │           │   └── api/            # Profile API Schema
│   │           └── authentication/
│   │               └── api/            # LoginReq, RegisterReq
│   │
│   ├── account/                    # [L1] 领域逻辑层 - Account 模块
│   │   └── src/
│   │       ├── domain-client/          # 客户端领域逻辑
│   │       └── application-client/     # 客户端应用服务
│   │
│   ├── authentication/             # [L1] 领域逻辑层 - Authentication 模块
│   │   └── src/
│   │       ├── domain-client/          # AuthService
│   │       └── application-client/     # 认证应用服务
│   │
│   ├── ui-core/                    # [L1] UI 基础设施层（纯 TS 逻辑）
│   │   └── src/
│   │       ├── tailwind.preset.js  # 颜色配置 (Zinc/Slate)
│   │       └── utils/
│   │           └── cn.ts           # ClassName 合并工具
│   │
│   ├── ui-vue-shadcn/              # [L2] 原子组件层（shadcn-vue CLI 生成）
│   │   └── src/
│   │       └── components/ui/
│   │           ├── card/           # Card, CardHeader, CardTitle...
│   │           ├── badge/          # Badge
│   │           ├── button/         # Button
│   │           ├── input/          # Input
│   │           ├── form/           # Form 组件
│   │           └── ...             # 其他 shadcn-vue 组件
│   │
│   └── ui-vue/                     # [L3] 业务组件库层（依赖 contracts + domain）
│       └── src/
│           ├── components/
│           │   ├── authentication/
│           │   │   ├── LoginForm.vue       # 登录表单组件
│           │   │   ├── RegisterForm.vue    # 注册表单组件
│           │   │   └── index.ts
│           │   └── account/
│           │       ├── ProfileCard.vue     # 个人资料卡片
│           │       ├── ProfileForm.vue     # 个人资料编辑表单
│           │       └── index.ts
│           ├── composables/                # ⭐ 可复用的业务逻辑 Hooks
│           │   ├── useAuth.ts              # 封装认证逻辑（调用 domain service）
│           │   └── useProfile.ts           # 封装个人资料逻辑
│           └── index.ts                    # 统一导出
│
└── apps/
    └── web/                        # [L4] Web 应用层
        └── src/
            ├── tailwind.config.js          # ⚠️ 需配置扫描包路径
            └── modules/
                ├── authentication/
                │   └── presentation/
                │       ├── views/
                │       │   └── AuthView.vue        # 认证视图
                │       └── stores/
                │           └── authenticationStore.ts  # 调用 ui-vue/composables
                └── account/
                    └── presentation/
                        ├── views/
                        │   └── AccountCenterView.vue  # 个人中心视图
                        ├── stores/
                        │   └── accountStore.ts        # 调用 ui-vue/composables
                        └── router/
                            └── index.ts               # 路由配置
```

## 🏗️ 架构层级

### L0 - 契约层 (`contracts`)
- **职责**: 定义跨模块的类型契约、DTO、API Schema
- **特点**: 
  - 纯类型定义，无实现逻辑
  - 所有层级都可以依赖
  - 使用 Zod 定义 API Schema
- **示例**: `AccountProfileDTO`, `LoginByEmailReq`, `RegisterByPhoneReq`

### L1 - 领域逻辑层 (`account`, `authentication` 等)
- **职责**: 封装业务逻辑、领域服务、应用服务
- **特点**:
  - 框架无关的纯业务逻辑
  - `domain-client`: 客户端领域逻辑（Service、Entity）
  - `application-client`: 客户端应用服务（Use Cases）
- **示例**: `AuthService.login()`, `AccountService.updateProfile()`

### L1 - UI 基础设施层 (`ui-core`)
- **职责**: 提供纯 TypeScript 逻辑、工具函数、Tailwind 配置
- **特点**: 框架无关、可在 Vue/React 项目中 + 封装可复用的业务逻辑
- **特点**:
  - 包含业务逻辑和领域知识
  - 可在多个 Vue 应用中复用（web、admin 等）
  - 与契约层（`@dailyuse/contracts`）和领域层（`domain-client`）集成
  - **重要**：提供 Composables 封装业务逻辑，而非直接提供 Store
- **示例**:
  - `LoginForm`: 组合 Input、Button、Card 等实现完整登录表单
  - `ProfileCard`: 组合 Avatar、Badge 等展示用户资料
  - `useAuth`: Composable，封装认证逻辑（供 Store 调用）
  - **不应手动修改**，通过 CLI 更新
- **添加新组件**:
  ```bash
  cd packages/ui-vue-shadcn
  pnpm dlx shadcn-vue@latest add [component-name]
  ```

### L3 - 业务组件库层 (`ui-vue`)
- **职责**: 组合 L2 层组件，创建业务特定的复合组件
- **特点**:
  - 包含业务逻辑和领域知识
  - 可在多个应用中复用
  - 与后端契约层（`@dailyuse/contracts`）集成
- **示例**:
  - `LoginForm`: 组合 Input、Button、Card 等实现完整登录表单
  - `ProfileCard`: 组合 Avatar、Badge 等展示用户资料
、应用级配置
- **presentation 层结构**:
  - `views/`: 页面级组件，使用 L3 业务组件
  - `stores/`: Pinia 状态管理（调用 L3 的 Composables）
  - `router/`: 路由配置（如果模块有独立路由）
- **重要配置**:
  - `tailwind.config.js`: 必须配置扫描包路径（详见下文件
  - `stores/`: Pinia 状态管理
  - `router/`: 路由配置（如果模块有独立路由）

## 📦 组件导出策略

### ui-vue-shadcn 导出
```typescript
// packages/ui-vue-shadcn/src/index.ts
export * from './components/ui/button';
export * from './components/ui/card';
export * from './components/ui/input';
// ... 其他 shadcn-vue 组件
```

### ui-vue 聚合导出
```typescript
// packages/ui-vue/src/index.ts

// 1. 导出 ui-core 工具
export * from '@dailyuse/ui-core';

// 2. 导出 Composables
export { useFormValidation } from './composables/useFormValidation';

// 3. 统一导出 ui-vue-shadcn 所有组件
export * from '@dailyuse/ui-vue-shadcn';

// 4. 导出业务组件
export * from './components/authentication';
export * from './components/account';
```

## 🎨 使用示例

### 在应用中使用（推荐方式）

```vue
<!-- apps/web/src/modules/authentication/presentation/views/AuthView.vue -->
<script setup lang="ts">
import { LoginForm } from '@dailyuse/ui-vue';
import type { LoginByEmailReq } from '@dailyuse/contracts/authentication';

const handleLogin = async (data: LoginByEmailReq) => {
  // 业务逻辑
};
</script>

<template>
  <LoginForm @login-by-email="handleLogin" />
</template>
```

### 直接使用原子组件

```vue
<script setup lang="ts">
import { Button, Card, Input } from '@dailyuse/ui-vue';
</script>

<template>
  <Card>
    <Input placeholder="请输入" />
    <Button>提交</Button>
  </Card>
</template>
```⚙️ 关键配置

### Tailwind CSS 扫描路径配置 ⚠️

**这是最容易出错的地方！** 如果不配置包路径扫描，业务组件的样式将无法生成。

```javascript
// apps/web/tailwind.config.js
module.exports = {
  // 1. 使用 ui-core 的预设配置（颜色、间距等）
  presets: [require('../../packages/ui-core/src/tailwind.preset.js')],
  
  // 2. ⚠️ 必须扫描组件库的源码路径
  content: [
    './index.html',
#### 2.1 创建组件

在 `packages/ui-vue/src/components/[module-name]/` 创建组件：

```vue
<!-- packages/ui-vue/src/components/account/ProfileCard.vue -->
<script setup lang="ts">
import { Card, Avatar, Badge } from '@dailyuse/ui-vue-shadcn';
import type { AccountProfileDTO } from '@dailyuse/contracts/account';

interface Props {
  profile: AccountProfileDTO;
}
defineProps<Props>();
</script>

<template>
  <Card>
    <Avatar :src="profile.avatarUrl" />
    <h3>{{ profile.nickname }}</h3>
    <Badge>{{ profile.gender }}</Badge>
  </Card>
</template>
```

#### 2.2 创建 Composable（可选，用于复杂业务逻辑）

```typescript
// packages/ui-vue/src/composables/useProfile.ts
import { ref } from 'vue';
import type { AccountProfileDTO } from '@dailyuse/contracts/account';
// 引入领域服务（假设已实现）
// import { AccountService } from '@dailyuse/account/application-client';
#### 3.1 在 Store 中调用 Composable（推荐）

```typescript
// apps/web/src/modules/account/presentation/stores/accountStore.ts
import { defineStore } from 'pinia';
import { useProfile } from '@dailyuse/ui-vue'; // 从 ui-vue 导入

export const useAccountStore = defineStore('account', () => {
  // 使用 ui-vue 提供的 Composable
  const { profile, loading, error, fetchProfile, updateProfile } = useProfile();

  // 应用级特定逻辑（如路由跳转、权限检查等）
  const navigateToEdit = () => {
    // router.push('/account/edit');
  };

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    navigateToEdit,
  };
});
```

**为什么这样设计？**
- ✅ **逻辑复用**：`useProfile` 可在多个 Vue 应用（web、admin）中使用
- ✅ **灵活性**：每个应用的 Store 可以添加自己的应用级逻辑
- ✅ **可测试**：Composable 是纯函数，易于测试

#### 3.2 在视图中使用

```vue
<!-- apps/web/src/modules/account/presentation/views/AccountCenterView.vue -->
<script setup lang="ts">
import { ProfileCard } from '@dailyuse/ui-vue';
import { useAccountStore } from '../stores/accountStore';
import { onMounted } from 'vue';

const accountStore = useAccountStore();

onMounted(() => {
  accountStore.fetchProfile();
});
</script>

<template>
  <div v-if="accountStore.loading">加载中...</div>
  <div v-else-if="accountStore.error">{{ accountStore.error }}</div>
  <ProfileCard v-else :profile="accountStore.
      // TODO: 调用领域服务
      // profile.value = await AccountService.getProfile();
    } catch (e) {
      error.value = e instanceof Error ? e.message : '获取失败';
    } finally {
      loading.value = false;
    }
  };

  const updateProfile = async (data: AccountProfileDTO) => {
    loading.value = true;
    error.value = null;
    try {
      // TODO: 调用领域服务
      // await AccountService.updateProfile(data);
      profile.value = data;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '更新失败';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
  };
}统一导入组件和 Composables
- ✅ 业务组件使用 TypeScript 类型（来自 `@dailyuse/contracts`）
- ✅ 使用 `vue-sonner` 进行 toast 通知
- ✅ Web 应用的 presentation 层只包含 `views/`、`stores/`、`router/`
- ✅ **配置 Tailwind 扫描包路径**（否则样式失效）
- ✅ Store 调用 ui-vue 的 Composables，实现逻辑复用
- ✅ 复杂业务逻辑封装到 Composables，而非直接写在组件中

### DON'T ❌
- ❌ 不要手动修改 `ui-vue-shadcn/components/ui/` 中的文件（使用 CLI 更新）
- ❌ 不要在 presentation 层放置领域逻辑（应该在 domain-client 或 Composables 中）
- ❌ 不要跨层级直接导入（例如 web 直接导入 ui-core，应该通过 ui-vue）
- ❌ 不要忘记配置 Tailwind content 路径
- ❌ 不要在 ui-vue 中直接创建 Pinia Store（应该提供 Composables
// packages/ui-vue/src/composables/index.ts
export { useProfile } from './useProfil
const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...accountRoutes,
    ...authRoutes,
    // ... 其他模块路由
  ],
});

export default router;
```

### Pinia 配置（带持久化）

```typescript
// apps/web/src/main.ts
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
```

## 

## 🛠️ 开发工作流

### 1. 添加新的原子组件（L2层）
```bash
cd packages/ui-vue-shadcn
pnpm dlx shadcn-vue@latest add dialog
```

然后在 `packages/ui-vue-shadcn/src/index.ts` 中导出：
```typescript
export * from './components/ui/dialog';
```

### 2. 创建业务组件（L3层）

在 `packages/ui-vue/src/components/[module-name]/` 创建组件：

```vue
<!-- packages/ui-vue/src/components/account/ProfileCard.vue -->
<script setup lang="ts">
import { Card, Avatar, Badge } from '@dailyuse/ui-vue-shadcn';
import type { AccountProfileDTO } from '@dailyuse/contracts/account';

interface Props {
  profile: AccountProfileDTO;
}完整数据流

```
用户交互 (User Click)
      ↓
📄 View (L4 apps/web/views)
      ↓ 调用
🗂️  Store (L4 apps/web/stores)
      ↓ 使用
🎣 Composable (L3 ui-vue/composables)
      ↓ 调用
💼 Application Service (L1 domain-client)
      ↓ 调用
🌐 Domain Service / API Client
      ↓
🔙 数据返回
      ↓ 通过 Composable
📦 Store 更新状态
      ↓ 响应式更新
🎨 View 重新渲染（使用 L3 业务组件）
```

**关键点说明**：
1. **View** 只负责展示，调用 Store
2. **Store** 聚合状态，调用 Composable
3. **Composable** 封装可复用的业务逻辑，调用 Service
4. **Service** 处理领域逻辑和 API 通信
5. **业务组件** (如 `LoginForm`) 通过事件向上传递数据，不直接调用 Serviceort { default as ProfileCard } from './ProfileCard.vue';
```

### 3. 在应用中使用（L4层）

```vue
<!-- apps/web/src/modules/account/presentation/views/AccountCenterView.vue -->
<script setup lang="ts">
import { ProfileCard } from '@dailyuse/ui-vue';

const profile = ref({...});
</script>
� 常见问题 FAQ

### Q1: 为什么组件没有样式？
**A**: 99% 是因为 `tailwind.config.js` 没有配置扫描包路径。请检查：
```javascript
content: [
  '../../packages/ui-vue-shadcn/src/**/*.{vue,js,ts,jsx,tsx}',
  '../../packages/ui-vue/src/**/*.{vue,js,ts,jsx,tsx}',
]
```

### Q2: Store 应该放在哪里？
**A**: 
- **应用特定的 Store**：放在 `apps/web/modules/*/presentation/stores`
- **可复用的逻辑**：封装成 Composable，放在 `packages/ui-vue/src/composables`
- **不推荐**：直接在 `ui-vue` 中创建 Pinia Store（降低灵活性）

### Q3: 业务组件应该直接调用 API 吗？
**A**: 不应该。业务组件应该：
1. 通过 `props` 接收数据
2. 通过 `emit` 发出事件
3. 由 View 或 Store 处理 API 调用

### Q4: 多个应用如何复用登录逻辑？
**A**: 使用 Composable：
```typescript
// ui-vue/composables/useAuth.ts
export function useAuth() {
  // 封装登录逻辑
  const login = async (email, password) => { ... }
  return { login, ... }
}

// apps/web/stores/authStore.ts
const { login } = useAuth(); // 复用

// apps/admin/stores/authStore.ts
const { login } = useAuth(); // 复用
```

## 🚀 下一步行动清单

### 基础设施
- [ ] 安装依赖：`pnpm add vue-sonner`
- [ ] **配置 `tailwind.config.js` 扫描路径**（最重要！）
- [ ] 配置路由以访问新创建的视图

### 开发完善
- [ ] 实现 `useAuth` Composable（封装认证逻辑）
- [ ] 实现 `useProfile` Composable（封装个人资料逻辑）
- [ ] 连接真实的 API 服务
- [ ] 添加表单验证和错误处理

### 质量提升
- [ ] 为业务组件添加 Storybook stories
- [ ] 添加组件单元测试
- [ ] 优化用户体验（加载状态、过渡动画等）
- [ ] 实现头像上传功能
- [ ] 实现忘记密码功能

## 📚 相关文档

- [DDD 架构文档](./ddd-architecture.md)
- [Tailwind 配置指南](./tailwind-setup.md)
- [shadcn-vue 官方文档](https://www.shadcn-vue.com/)
- [Pinia 最佳实践](https://pinia.vuejs.org/)

### DO ✅
- ✅ 通过 `@dailyuse/ui-vue` 导入所有组件
- ✅ 业务组件使用 TypeScript 类型（来自 `@dailyuse/contracts`）
- ✅ 使用 `vue-sonner` 进行 toast 通知
- ✅ Web 应用的 presentation 层只包含 `views/`、`stores/`、`router/`

### DON'T ❌
- ❌ 不要手动修改 `ui-vue-shadcn/components/ui/` 中的文件
- ❌ 不要在 presentation 层放置业务逻辑（应该在 application 或 domain 层）
- ❌ 不要跨层级直接导入（例如 web 直接导入 ui-core）

## 🔄 数据流

```
User Interaction
      ↓
View (L4) - 使用业务组件
      ↓
Business Component (L3) - 发出事件，传递数据
      ↓
View 事件处理器
      ↓
Store Action (Pinia)
      ↓
Application Service
      ↓
Domain Service / API
```

## 📝 待完成功能

- [ ] 添加 Storybook 配置文件
- [ ] 实现头像上传功能
- [ ] 集成真实的认证服务
- [ ] 添加表单验证
- [ ] 实现忘记密码功能
- [ ] 添加更多安全设置（MFA、会话管理等）

## 🎯 创建的组件清单

### Authentication 模块
- ✅ `LoginForm.vue` - 登录表单（支持邮箱和手机登录）
- ✅ `RegisterForm.vue` - 注册表单（支持邮箱和手机注册）
- ✅ `AuthView.vue` - 认证视图（包含登录和注册切换）

### Account 模块
- ✅ `ProfileCard.vue` - 个人资料卡片（展示用户信息）
- ✅ `ProfileForm.vue` - 个人资料编辑表单
- ✅ `AccountCenterView.vue` - 个人中心视图（包含资料、安全、偏好设置）

## 🚀 下一步

1. 安装缺失的依赖（如 `vue-sonner`）
2. 配置路由以访问新创建的视图
3. 连接真实的 API 服务
4. 添加表单验证和错误处理
5. 优化用户体验（加载状态、过渡动画等）
