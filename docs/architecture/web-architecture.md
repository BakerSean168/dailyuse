# Web Application 架构文档

> **更新时间**: 2025-12-16  
> **应用**: Memoflow Web Application  
> **技术栈**: Vue 3.4 + Vuetify 3.11 + Pinia 3.0 + TypeScript 5.8  
> **架构模式**: DDD 模块化 + 状态管理 + 组件化

---

## 📋 架构概览

### 执行摘要

Memoflow Web Application 是一个基于 Vue 3 Composition API 的现代化单页应用（SPA），采用 Vuetify 3 Material Design 组件库。使用 Pinia 进行状态管理，支持状态持久化、国际化（i18n）、实时通信（SSE）和响应式设计。

### 核心特性

- ✅ **Vue 3 Composition API**: 更灵活的组件逻辑复用
- ✅ **Vuetify 3**: Material Design 3 组件库
- ✅ **Pinia**: 轻量级状态管理
- ✅ **TypeScript**: 完整的类型安全
- ✅ **Vite**: 极速开发服务器和构建
- ✅ **国际化**: 多语言支持（中/英）
- ✅ **SSE 实时通信**: 服务器推送事件
- ✅ **状态持久化**: 自动保存到 localStorage
- ✅ **响应式设计**: 移动端适配

---

## 🏗️ 架构模式

### DDD 分层架构

Web Application 遵循**领域驱动设计（DDD）**的分层架构模式：

\\\
┌─────────────────────────────────────────────────────┐
│  Presentation Layer (展示层)                        │
│  - Vue Components (Views & Components)             │
│  - Composables (UI Logic)                          │
│  - Pinia Stores (State Management)                 │
│  - Router (Navigation)                             │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  Application Layer (应用层)                         │
│  - WebApplicationService (业务编排)                 │
│  - DTOs (Data Transfer Objects)                    │
│  - Application Events                              │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  Domain Layer (领域层)                              │
│  - 位于 @dailyuse/domain-client 共享包中             │
│  - Domain Entities (Goal, Task, etc.)              │
│  - Domain Services                                 │
│  - Business Rules & Validation                     │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  Infrastructure Layer (基础设施层)                   │
│  - API Client (HTTP/Axios)                         │
│  - SSE Client (Real-time updates)                  │
│  - Local Storage                                   │
│  - External Services Integration                   │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  Initialization Layer (初始化层)                     │
│  - Module Registration                             │
│  - App Startup Logic                               │
│  - Plugin Configuration                            │
└─────────────────────────────────────────────────────┘
\\\

**架构特点**：
- ✅ **关注点分离**: 每层职责清晰，易于维护
- ✅ **领域模型共享**: Domain 层通过 `@dailyuse/domain-client` 在 Web/Desktop 间复用
- ✅ **依赖方向**: 外层依赖内层，Domain 层无外部依赖
- ✅ **可测试性**: 每层可独立测试

### 数据流架构（DDD 视角）

\\\
User Interaction (Presentation Layer)
    ↓
Vue Component Event
    ↓
Composable / Pinia Store Action (Presentation Layer)
    ↓
WebApplicationService (Application Layer)
    ↓ 调用
Domain Service / Domain Entity (Domain Layer - @dailyuse/domain-client)
    ↓ 业务规则验证
API Client (Infrastructure Layer)
    ↓ HTTP Request
API Backend
    ↓ Response
Domain Entity 更新 (Domain Layer)
    ↓
Store State Update (Presentation Layer)
    ↓
Component Re-render (Vue Reactivity)
\\\

**关键流程说明**：
1. **Presentation → Application**: UI 事件触发应用服务
2. **Application → Domain**: 应用服务调用领域逻辑
3. **Domain → Infrastructure**: 领域层通过接口访问基础设施
4. **Infrastructure → Backend**: HTTP 请求到 API
5. **响应反向传递**: 数据通过各层返回并更新 UI

---

## 📁 目录结构（DDD 分层）

\\\
apps/web/
├── src/
│   ├── main.ts                     # 应用入口
│   ├── App.vue                     # 根组件
│   ├── config/                     # 配置文件
│   │   └── logger.config.ts       # 日志配置
│   ├── shared/                     # 跨模块共享资源
│   │   ├── router/                # Vue Router 配置
│   │   ├── vuetify/               # Vuetify 配置
│   │   ├── i18n/                  # 国际化配置
│   │   ├── initialization/        # 应用初始化管理
│   │   └── types/                 # TypeScript 类型
│   │
│   └── modules/                    # 业务模块（DDD 垂直切分）
│       ├── goal/                  # 目标模块（示例）
│       │   ├── presentation/      # 【展示层】
│       │   │   ├── views/        # 页面组件
│       │   │   ├── components/   # UI 组件
│       │   │   ├── composables/  # UI 逻辑
│       │   │   └── stores/       # Pinia stores
│       │   ├── application/       # 【应用层】
│       │   │   └── GoalWebApplicationService.ts
│       │   ├── infrastructure/    # 【基础设施层】
│       │   │   ├── api/          # API 客户端
│       │   │   └── storage/      # 本地存储
│       │   ├── initialization/    # 【初始化层】
│       │   │   └── index.ts      # 模块注册
│       │   └── domain/            # 【领域层 - 本地扩展】
│       │       └── (Domain 主逻辑在 @dailyuse/domain-client)
│       │
│       ├── task/                  # 任务模块（同上结构）
│       ├── schedule/              # 调度模块
│       ├── reminder/              # 提醒模块
│       ├── notification/          # 通知模块
│       ├── repository/            # 仓库模块
│       ├── setting/               # 设置模块
│       ├── account/               # 账户模块
│       ├── authentication/        # 认证模块
│       ├── dashboard/             # 仪表板模块
│       ├── editor/                # 编辑器模块
│       └── app/                   # 应用级模块
│
├── public/                         # 静态资源
├── index.html                      # HTML 模板
└── package.json

**DDD 分层说明**：
├── presentation/      → 展示层（Vue 组件、Store、Composables）
├── application/       → 应用层（业务编排服务）
├── domain/            → 领域层（主要在 @dailyuse/domain-client）
├── infrastructure/    → 基础设施层（API、存储）
└── initialization/    → 初始化层（模块注册）
\\\

---

## 🎯 核心技术栈

### 前端框架

| 组件 | 版本 | 用途 |
|------|------|------|
| **Vue 3** | 3.4.21 | 渐进式框架 |
| **Vuetify 3** | 3.7.5 | Material Design 组件库 |
| **TypeScript** | 5.8.3 | 类型安全 |

### 状态管理

| 组件 | 版本 | 用途 |
|------|------|------|
| **Pinia** | 3.0.3 | 状态管理 |
| **pinia-plugin-persistedstate** | 4.2.0 | 状态持久化 |

### 路由

| 组件 | 版本 | 用途 |
|------|------|------|
| **Vue Router** | 4.x | 路由管理 |

### HTTP 客户端

| 组件 | 版本 | 用途 |
|------|------|------|
| **Axios** | 1.9.0 | HTTP 请求 |

### 富文本编辑

| 组件 | 版本 | 用途 |
|------|------|------|
| **TipTap** | 3.6.6 | 富文本编辑器 |
| **Monaco Editor** | 0.52.2 | 代码编辑器 |

### 数据可视化

| 组件 | 版本 | 用途 |
|------|------|------|
| **ECharts** | 5.6.0 | 图表库 |
| **vue-echarts** | 7.0.3 | Vue ECharts 包装器 |

### 国际化

| 组件 | 版本 | 用途 |
|------|------|------|
| **vue-i18n** | 10.0.4 | 国际化 |

### 构建工具

| 组件 | 版本 | 用途 |
|------|------|------|
| **Vite** | 7.1.7 | 构建工具 |
| **vue-tsc** | 2.1.10 | TypeScript 检查 |

### 测试工具

| 组件 | 版本 | 用途 |
|------|------|------|
| **Vitest** | 3.2.4 | 单元测试 |
| **Playwright** | 1.56.0 | E2E 测试 |
| **@testing-library/vue** | 8.1.0 | 组件测试 |

---

## 🎨 模块化设计（DDD 垂直切分）

### 模块 DDD 分层结构

每个业务模块按 DDD 分层垂直切分，职责清晰：

\\\
modules/[module-name]/
├── presentation/                   # 【展示层】
│   ├── views/                     # 页面级组件
│   │   ├── [Module]ListView.vue   # 列表页
│   │   ├── [Module]DetailView.vue # 详情页
│   │   └── [Module]FormView.vue   # 表单页
│   ├── components/                # 展示组件
│   │   ├── cards/                # 卡片组件
│   │   ├── forms/                # 表单组件
│   │   └── lists/                # 列表组件
│   ├── composables/               # UI 逻辑 Composables
│   │   ├── use[Module].ts        # 主逻辑
│   │   ├── use[Module]Form.ts    # 表单逻辑
│   │   └── use[Module]List.ts    # 列表逻辑
│   └── stores/                    # Pinia 状态管理
│       └── [module]Store.ts      # 状态 Store
│
├── application/                    # 【应用层】
│   └── [Module]WebApplicationService.ts  # 业务编排服务
│
├── domain/                         # 【领域层 - 本地扩展】
│   └── (核心领域逻辑在 @dailyuse/domain-client 包中)
│
├── infrastructure/                 # 【基础设施层】
│   ├── api/                       # API 通信
│   │   └── [module]ApiClient.ts  # HTTP 客户端
│   └── storage/                   # 本地存储
│       └── [module]Storage.ts    # localStorage 封装
│
└── initialization/                 # 【初始化层】
    └── index.ts                   # 模块注册与初始化

**分层职责**：

| 层级 | 职责 | 依赖方向 |
|------|------|----------|
| **Presentation** | UI 展示、用户交互、状态管理 | → Application |
| **Application** | 业务流程编排、DTO 转换 | → Domain + Infrastructure |
| **Domain** | 核心业务规则（在 domain-client） | 无外部依赖 |
| **Infrastructure** | 外部服务调用、数据持久化 | → Domain（接口） |
| **Initialization** | 模块启动、依赖注入 | → All Layers |
\\\

---

## 🔄 Pattern A 架构规范

### 概述

Pattern A 是 Memoflow Web 应用中 Presentation → Application → Infrastructure 层之间的标准数据流和职责划分模式。

### 架构图

\\\
┌─────────────────────────────────────────────────────────────────┐
│                    Vue Component (视图层)                        │
│  - 用户交互触发事件                                               │
│  - 绑定 Composable 返回的状态和方法                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ 调用 Composable 方法
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Composable (Presentation 层逻辑)                    │
│  职责：                                                          │
│  - try/catch 包装 ApplicationService 调用                        │
│  - 用户反馈：getGlobalMessage() → showSuccess/showError          │
│  - 状态管理：更新 Pinia Store                                     │
│  - Loading 状态控制                                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │ 调用 ApplicationService
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              ApplicationService (应用层)                         │
│  职责：                                                          │
│  - 调用 ApiClient 执行 HTTP 请求                                  │
│  - DTO → Domain Entity 转换                                      │
│  - 业务编排（多个 API 调用协调）                                   │
│  ⚠️ 禁止：直接使用 useMessage/getGlobalMessage                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ 调用 ApiClient
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ApiClient (基础设施层)                         │
│  职责：                                                          │
│  - HTTP 请求封装 (Axios)                                         │
│  - 请求/响应拦截                                                  │
│  - 错误处理（抛出 Error）                                         │
└─────────────────────────────────────────────────────────────────┘
\\\

### 核心原则

#### 1. 职责分离

| 层级 | 负责 | 禁止 |
|------|------|------|
| **Composable** | UI 反馈、Store 更新、Loading 状态 | 直接调用 ApiClient |
| **ApplicationService** | API 调用、DTO 转换、业务编排 | 使用 useMessage/getGlobalMessage |
| **ApiClient** | HTTP 请求、拦截器 | 业务逻辑 |

#### 2. 用户反馈规范

用户反馈（成功/错误消息）**只能**在 Composable 层处理：

\\\typescript
// ✅ 正确：在 Composable 中处理用户反馈
export function useGoal() {
  const { success: showSuccess, error: showError } = getGlobalMessage();
  
  async function createGoal(data: CreateGoalDto) {
    try {
      const goal = await goalApplicationService.createGoal(data);
      showSuccess('目标创建成功');
      return goal;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '创建目标失败';
      showError(errorMsg);
      throw err;
    }
  }
}

// ❌ 错误：在 ApplicationService 中处理用户反馈
export class GoalApplicationService {
  async createGoal(data: CreateGoalDto) {
    const goal = await goalApiClient.create(data);
    // ❌ 禁止在 ApplicationService 中调用 useMessage
    // this.message.success('目标创建成功');
    return goal;
  }
}
\\\

### 代码模板

#### Composable 模板

\\\typescript
import { ref, computed } from 'vue';
import { getGlobalMessage } from '@dailyuse/ui';
import { xxxApplicationService } from '../../application/services';
import { useXxxStore } from '../stores/xxxStore';

export function useXxx() {
  const store = useXxxStore();
  const { success: showSuccess, error: showError } = getGlobalMessage();
  
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed - 从 Store 读取数据
  const items = computed(() => store.items);

  // Action - 调用 ApplicationService
  async function createItem(request: CreateItemRequest) {
    loading.value = true;
    error.value = null;
    
    try {
      const item = await xxxApplicationService.createItem(request);
      store.addItem(item);
      showSuccess('创建成功');
      return item;
    } catch (err: any) {
      const errorMsg = err.message || '创建失败';
      error.value = errorMsg;
      showError(errorMsg);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    items,
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    
    // Actions
    createItem,
  };
}
\\\

#### ApplicationService 模板

\\\typescript
import { xxxApiClient } from '../../infrastructure/api/xxxApiClient';
import type { CreateItemRequest, ItemClientDTO } from '@dailyuse/contracts';

/**
 * XXX Application Service
 * 
 * Pattern A: ApplicationService 只负责 API 调用和 DTO 转换
 * UI 反馈（success/error 消息）由 Composable 层处理
 */
export class XxxApplicationService {
  private static instance: XxxApplicationService;

  private constructor() {}

  static getInstance(): XxxApplicationService {
    if (!XxxApplicationService.instance) {
      XxxApplicationService.instance = new XxxApplicationService();
    }
    return XxxApplicationService.instance;
  }

  /**
   * 创建项目
   * @returns 返回创建的 DTO，不包含 UI 反馈
   */
  async createItem(request: CreateItemRequest): Promise<ItemClientDTO> {
    return await xxxApiClient.createItem(request);
  }

  /**
   * 获取项目列表
   */
  async getItems(params?: { page?: number; limit?: number }): Promise<ItemClientDTO[]> {
    return await xxxApiClient.getItems(params);
  }
}

export const xxxApplicationService = XxxApplicationService.getInstance();
\\\

### 迁移指南

如果现有 ApplicationService 违反 Pattern A（直接使用 useMessage），按以下步骤重构：

1. **移除 useMessage 导入**
   \\\typescript
   // 删除这行
   import { useMessage } from '@dailyuse/ui';
   \\\

2. **移除 snackbar/message getter**
   \\\typescript
   // 删除这个 getter
   private get snackbar() {
     return useMessage();
   }
   \\\

3. **移除所有 this.message.success/error 调用**
   \\\typescript
   // 删除这些调用
   this.message.success('操作成功');
   this.message.error(errorMessage);
   \\\

4. **在对应的 Composable 中添加用户反馈**
   \\\typescript
   const { success: showSuccess, error: showError } = getGlobalMessage();
   
   try {
     const result = await applicationService.method();
     showSuccess('操作成功');
   } catch (err) {
     showError(err.message);
   }
   \\\

### 已遵循 Pattern A 的模块

| 模块 | ApplicationService | Composable | 状态 |
|------|---------------------|------------|------|
| Goal | ✅ | ✅ | 完成 |
| Task | ✅ | ✅ | 完成 |
| Schedule | ✅ | ✅ | 完成 |
| Reminder | ✅ | ✅ | 完成 |
| AI | ✅ | ✅ | 完成 |
| Notification | ✅ | ✅ | 完成 |
| Document | ✅ | ✅ | 完成 |
| Authentication | ✅ | ✅ | 完成 |

---

### 模块示例：Goal 模块（DDD 结构）

\\\
modules/goal/
├── presentation/                   # 【展示层】
│   ├── views/
│   │   ├── GoalListView.vue       # 目标列表页
│   │   ├── GoalDetailView.vue     # 目标详情页
│   │   ├── GoalKanbanView.vue     # 看板视图
│   │   └── GoalStatisticsView.vue # 统计页
│   ├── components/
│   │   ├── cards/
│   │   │   ├── GoalCard.vue       # 目标卡片
│   │   │   └── GoalProgress.vue   # 进度条
│   │   ├── forms/
│   │   │   ├── GoalForm.vue       # 目标表单
│   │   │   └── KeyResultForm.vue  # KR 表单
│   │   └── graphs/
│   │       └── GoalDAG.vue        # 依赖图
│   ├── composables/
│   │   ├── useGoal.ts             # 核心 UI 逻辑
│   │   ├── useGoalForm.ts         # 表单逻辑
│   │   ├── useGoalList.ts         # 列表逻辑
│   │   └── useGoalStatistics.ts   # 统计逻辑
│   └── stores/
│       └── goalStore.ts           # Goal Pinia store
│
├── application/                    # 【应用层】
│   └── GoalWebApplicationService.ts  # 业务编排服务
│
├── domain/                         # 【领域层】
│   └── (领域逻辑在 @dailyuse/domain-client/goal/)
│       ├── entities/Goal.ts       # Goal 实体
│       ├── services/GoalDomainService.ts  # 领域服务
│       └── value-objects/         # 值对象
│
├── infrastructure/                 # 【基础设施层】
│   ├── api/
│   │   └── goalApiClient.ts       # Goal HTTP 客户端
│   └── storage/
│       └── goalStorage.ts         # Goal 本地存储
│
└── initialization/                 # 【初始化层】
    └── index.ts                   # Goal 模块注册

**代码示例**：

// Application Layer - 业务编排
\\\	ypescript
// application/GoalWebApplicationService.ts
export class GoalWebApplicationService {
  constructor(
    private goalDomainService: GoalDomainService,  // 来自 domain-client
    private goalApiClient: GoalApiClient,          // Infrastructure
    private eventBus: EventBus                     // Infrastructure
  ) {}
  
  async createGoal(dto: CreateGoalDto): Promise<Goal> {
    // 1. 调用领域服务验证
    const validatedGoal = await this.goalDomainService.validateGoal(dto);
    
    // 2. 调用 API 持久化
    const createdGoal = await this.goalApiClient.create(validatedGoal);
    
    // 3. 发布事件
    this.eventBus.emit('goal.created', { goal: createdGoal });
    
    return createdGoal;
  }
}
\\\

// Presentation Layer - UI 逻辑
\\\	ypescript
// presentation/composables/useGoal.ts
export function useGoal() {
  const goalStore = useGoalStore();  // Pinia store
  const goalService = inject(GoalWebApplicationService);  // Application service
  
  async function createGoal(data: CreateGoalDto) {
    const goal = await goalService.createGoal(data);
    goalStore.addGoal(goal);  // 更新 UI 状态
    return goal;
  }
  
  return { createGoal, goals: computed(() => goalStore.goals) };
}
\\\
\\\

---

## 🗄️ 状态管理（Pinia）

### Store 架构

\\\	ypescript
// stores/goalStore.ts
import { defineStore } from 'pinia';
import { Goal } from '@dailyuse/contracts';

export const useGoalStore = defineStore('goal', {
  // State
  state: () => ({
    goals: [] as Goal[],
    currentGoal: null as Goal | null,
    loading: false,
    error: null as string | null,
  }),

  // Getters (计算属性)
  getters: {
    activeGoals: (state) => 
      state.goals.filter(g => g.status === 'ACTIVE'),
    
    completedGoals: (state) => 
      state.goals.filter(g => g.status === 'COMPLETED'),
    
    goalCount: (state) => state.goals.length,
  },

  // Actions (方法)
  actions: {
    async fetchGoals() {
      this.loading = true;
      try {
        const response = await goalService.getAllGoals();
        this.goals = response.data;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    async createGoal(goal: CreateGoalDto) {
      const response = await goalService.createGoal(goal);
      this.goals.push(response.data);
      return response.data;
    },

    setCurrentGoal(goal: Goal) {
      this.currentGoal = goal;
    },
  },

  // 持久化配置
  persist: {
    key: 'Memoflow-goal-store',
    storage: localStorage,
    paths: ['goals', 'currentGoal'], // 只持久化这些字段
  },
});
\\\

### 核心 Stores

| Store | 职责 | 持久化 |
|-------|------|--------|
| **authStore** | 认证状态、用户信息 | ✅ |
| **goalStore** | 目标数据、当前目标 | ✅ |
| **taskStore** | 任务数据、过滤器 | ✅ |
| **scheduleStore** | 日程数据 | ✅ |
| **reminderStore** | 提醒数据 | ✅ |
| **notificationStore** | 通知列表 | ❌ |
| **settingStore** | 用户设置、主题 | ✅ |
| **uiStore** | UI 状态（侧边栏等） | ✅ |

---

## 🛣️ 路由设计

### 路由结构

\\\	ypescript
// shared/router/index.ts
const routes = [
  {
    path: '/',
    redirect: '/dashboard',
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    component: () => import('@/modules/authentication/views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    component: () => import('@/modules/dashboard/views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/goals',
    children: [
      {
        path: '',
        component: () => import('@/modules/goal/views/GoalListView.vue')
      },
      {
        path: ':id',
        component: () => import('@/modules/goal/views/GoalDetailView.vue')
      }
    ],
    meta: { requiresAuth: true }
  },
  // ... 其他路由
];
\\\

### 路由守卫

\\\	ypescript
// 全局前置守卫 - 认证检查
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ path: '/login', query: { redirect: to.fullPath } });
  } else {
    next();
  }
});

// 全局后置钩子 - 页面标题
router.afterEach((to) => {
  document.title = to.meta.title || 'Memoflow';
});
\\\

---

## 🎭 Composition API 设计（DDD 集成）

### Composable 模式（连接 Presentation 和 Application 层）

Composables 作为 Presentation 层的逻辑抽象，负责连接 Vue 组件和 Application 层服务：

\\\	ypescript
// presentation/composables/useGoal.ts
import { ref, computed } from 'vue';
import { useGoalStore } from '../stores/goalStore';
import { inject } from 'vue';
import { GoalWebApplicationService } from '../../application/GoalWebApplicationService';

export function useGoal() {
  // Presentation Layer - State Management
  const store = useGoalStore();
  
  // Application Layer - Business Logic
  const goalService = inject(GoalWebApplicationService);
  
  // UI State
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed Properties
  const goals = computed(() => store.goals);
  const activeGoals = computed(() => store.activeGoals);

  // Actions - 调用 Application Service
  async function initialize() {
    loading.value = true;
    try {
      const goals = await goalService.getAllGoals();  // Application Layer
      store.setGoals(goals);  // Update Presentation State
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function createGoal(data: CreateGoalDto) {
    // Application Layer 处理业务逻辑
    const goal = await goalService.createGoal(data);
    
    // Presentation Layer 更新 UI 状态
    store.addGoal(goal);
    
    return goal;
  }

  async function updateGoal(id: string, data: UpdateGoalDto) {
    const goal = await goalService.updateGoal(id, data);
    store.updateGoal(goal);
    return goal;
  }

  return {
    // 状态（只读）
    goals,
    activeGoals,
    loading,
    error,
    
    // 方法（调用 Application 层）
    initialize,
    createGoal,
    updateGoal,
  };
}
\\\

**分层交互说明**：
- **Composable**: Presentation 层逻辑，连接 Store 和 Application Service
- **Store**: Presentation 层状态管理，仅负责 UI 状态
- **Application Service**: 应用层业务编排，调用 Domain 和 Infrastructure
- **Domain**: 核心业务规则（在 `@dailyuse/domain-client`）

### 常用 Composables

| Composable | 职责 |
|-----------|------|
| **useGoal** | Goal 核心逻辑 |
| **useTask** | Task 核心逻辑 |
| **useAuth** | 认证逻辑 |
| **useMessage** | 消息提示 |
| **useDialog** | 对话框管理 |
| **useLoading** | 加载状态 |
| **useDebounce** | 防抖处理 |
| **useTheme** | 主题切换 |

---

## 🔐 认证流程

### 登录流程

\\\
1. 用户输入凭据 → LoginView.vue
2. 调用 authStore.login(credentials)
3. 发送 POST /api/auth/login
4. 接收 Access Token + Refresh Token
5. 保存 Token 到 authStore（自动持久化）
6. 跳转到 Dashboard
7. 后续请求自动携带 Token (Axios 拦截器)
\\\

### Token 管理

\\\	ypescript
// shared/api/apiClient.ts
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// 请求拦截器 - 自动添加 Token
apiClient.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (authStore.accessToken) {
    config.headers.Authorization = \Bearer \\;
  }
  return config;
});

// 响应拦截器 - 自动刷新 Token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore();
      await authStore.refreshToken();
      // 重试请求
      return apiClient.request(error.config);
    }
    return Promise.reject(error);
  }
);
\\\

---

## 🎨 UI 组件设计

### Vuetify 组件使用

\\\ue
<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>{{ goal.title }}</v-card-title>
          <v-card-text>
            <GoalProgress :progress="goal.progress" />
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="editGoal">编辑</v-btn>
            <v-btn @click="deleteGoal">删除</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
\\\

### 响应式设计

\\\ue
<v-row>
  <!-- 桌面端：8列 -->
  <!-- 平板端：12列 -->
  <!-- 移动端：12列 -->
  <v-col cols="12" sm="12" md="8" lg="6">
    <GoalCard />
  </v-col>
</v-row>
\\\

---

## 🌐 国际化（i18n）

### 配置

\\\	ypescript
// shared/i18n/index.ts
import { createI18n } from 'vue-i18n';

const messages = {
  en: {
    goal: {
      title: 'Goal',
      create: 'Create Goal',
      list: 'Goal List',
    }
  },
  zh: {
    goal: {
      title: '目标',
      create: '创建目标',
      list: '目标列表',
    }
  }
};

export const i18n = createI18n({
  locale: 'zh', // 默认语言
  fallbackLocale: 'en',
  messages,
});
\\\

### 使用

\\\ue
<template>
  <v-btn>{{ t('goal.create') }}</v-btn>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
</script>
\\\

---

## 📡 实时通信（SSE）

### SSE 客户端

\\\	ypescript
// shared/api/sseClient.ts
import { sseManager } from '@dailyuse/utils';

export function initializeSSE() {
  const authStore = useAuthStore();
  
  sseManager.connect(
    'http://localhost:3888/api/sse',
    authStore.accessToken
  );

  // 监听事件
  sseManager.on('goal.updated', (data) => {
    const goalStore = useGoalStore();
    goalStore.updateGoal(data.goal);
  });

  sseManager.on('task.created', (data) => {
    const taskStore = useTaskStore();
    taskStore.addTask(data.task);
  });
}
\\\

---

## 🚀 应用启动流程

### 初始化序列

\\\
1. 加载 main.ts
2. 创建 Vue 应用实例
3. 注册插件 (Pinia, Router, Vuetify, i18n)
4. 运行 AppInitializationManager.initializeApp()
   - 恢复认证状态
   - 初始化各模块 Store
   - 连接 SSE
5. 挂载应用到 #app
6. 路由导航到首页或登录页
\\\

---

## 🧪 测试策略

### 单元测试（Vitest）

\\\	ypescript
// __tests__/GoalCard.test.ts
import { mount } from '@vue/test-utils';
import GoalCard from '@/modules/goal/components/presentation/GoalCard.vue';

describe('GoalCard', () => {
  it('renders goal title', () => {
    const wrapper = mount(GoalCard, {
      props: {
        goal: {
          uuid: '123',
          title: 'Learn Vue 3',
          progress: 50,
        }
      }
    });
    
    expect(wrapper.text()).toContain('Learn Vue 3');
  });
});
\\\

### E2E 测试（Playwright）

\\\	ypescript
// e2e/goal.spec.ts
import { test, expect } from '@playwright/test';

test('create goal flow', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.fill('[data-test="username"]', 'testuser');
  await page.fill('[data-test="password"]', 'password');
  await page.click('[data-test="login-button"]');
  
  await page.click('[data-test="create-goal"]');
  await page.fill('[data-test="goal-title"]', 'Test Goal');
  await page.click('[data-test="save-button"]');
  
  await expect(page.locator('text=Test Goal')).toBeVisible();
});
\\\

---

## 📚 相关文档

- [项目概览](./project-overview.md)
- [API Backend 架构](./architecture-api.md)
- [集成架构](./integration-architecture.md)
- [开发指南](./development-guide.md)
- [前端工具使用](./guides/frontend-tools-usage.md)
- [主题系统 README](./guides/THEME_SYSTEM_README.md)

---

**文档维护**: BMAD v6 Analyst  
**最后更新**: 2025-12-02 (Pattern A 架构规范添加)


