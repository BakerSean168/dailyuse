# 🚀 Web 应用框架解耦 - 快速参考指南

## 📍 项目状态

```
✅ 框架解耦: 100% 完成
✅ Stores 创建: 完成
✅ Composables: 完成
✅ TypeScript 验证: 通过
📦 准备提取: 就绪
```

---

## 📂 关键文件位置

### Account 模块

```bash
# Store
apps/web/src/modules/account/presentation/stores/accountStore.ts

# Composables
apps/web/src/modules/account/presentation/composables/useAccountProfile.ts
apps/web/src/modules/account/presentation/composables/useAccountSubscription.ts

# Exports
apps/web/src/modules/account/index.ts
```

### Authentication 模块

```bash
# Store
apps/web/src/modules/authentication/presentation/stores/authenticationStore.ts

# Composables (6个)
apps/web/src/modules/authentication/presentation/composables/useAuth.ts
apps/web/src/modules/authentication/presentation/composables/useLogin.ts
apps/web/src/modules/authentication/presentation/composables/useRegistration.ts
apps/web/src/modules/authentication/presentation/composables/useSession.ts
apps/web/src/modules/authentication/presentation/composables/usePassword.ts
apps/web/src/modules/authentication/presentation/composables/useApiKey.ts

# Exports
apps/web/src/modules/authentication/index.ts
```

### Goal 模块

```bash
# Store
apps/web/src/modules/goal/presentation/stores/goalStore.ts

# Composables (10个)
apps/web/src/modules/goal/presentation/composables/

# 验证: Services 已框架无关 ✅
```

### 其他模块 (Reminder, Task, AI, Setting)

```bash
# Stores
apps/web/src/modules/reminder/presentation/stores/reminderStore.ts
apps/web/src/modules/task/presentation/stores/taskStore.ts
apps/web/src/modules/ai/presentation/stores/aiStore.ts
apps/web/src/modules/setting/presentation/stores/settingStore.ts
```

---

## 🔍 使用 Composables 的示例

### 在 Vue 组件中使用

```typescript
<script setup lang="ts">
import { useAccountProfile } from '@/modules/account';

const {
  currentAccount,
  isLoading,
  error,
  loadMyProfile,
  updateMyProfile
} = useAccountProfile();

onMounted(async () => {
  await loadMyProfile();
});

async function handleUpdate() {
  await updateMyProfile({
    firstName: 'John',
    lastName: 'Doe'
  });
}
</script>

<template>
  <div>
    <div v-if="isLoading">加载中...</div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="currentAccount">
      <p>{{ currentAccount.email }}</p>
      <button @click="handleUpdate">更新</button>
    </div>
  </div>
</template>
```

---

## 📦 关键导出

### Account 模块

```typescript
export { useAccountStore, useAccountProfile, useAccountSubscription } from '@/modules/account';
```

### Authentication 模块

```typescript
export {
  useAuthenticationStore,
  useAuth,
  useLogin,
  useRegistration,
  useSession,
  usePassword,
  useApiKey,
} from '@/modules/authentication';
```

### 其他模块

```typescript
export { useGoalStore /* composables */ } from '@/modules/goal';
export { useReminderStore /* composables */ } from '@/modules/reminder';
export { useTaskStore /* composables */ } from '@/modules/task';
export { useAIStore /* composables */ } from '@/modules/ai';
export { useSettingStore /* composables */ } from '@/modules/setting';
```

---

## ✅ 代码检查清单

### 新建 Composable 时

- [ ] 导入 Store: `const store = useXxxStore()`
- [ ] 导入 Service: `const service = XxxApplicationService.getInstance()`
- [ ] 创建 computed 状态: `const state = computed(() => store.property)`
- [ ] 实现操作方法，包含 try-catch-finally
- [ ] 操作方法中: `store.setLoading(true)` 在开始
- [ ] 操作方法中: `store.setError(null)` 在成功
- [ ] 操作方法中: `store.setLoading(false)` 在 finally

### Service 检查

- [ ] ❌ 不导入 Pinia/Zustand Store
- [ ] ❌ 不导入 Vue
- [ ] ❌ 不导入 Vuetify
- [ ] ✅ 只导入 API Client
- [ ] ✅ 只返回 DTO
- [ ] ✅ 无副作用

---

## 🔄 Composable 模板

```typescript
/**
 * Module Composable
 * 功能描述
 */

import { computed } from 'vue';
import { useXxxStore } from '../stores/xxxStore';
import { XxxApplicationService } from '../../application/services/XxxApplicationService';

export function useXxx() {
  const store = useXxxStore();
  const service = XxxApplicationService.getInstance();

  // State
  const state = computed(() => store.state);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);

  // Actions
  async function operation(args) {
    store.setLoading(true);
    try {
      const result = await service.operation(args);
      store.setState(result);
      store.setError(null);
      return result;
    } catch (err) {
      store.setError(err.message);
      return null;
    } finally {
      store.setLoading(false);
    }
  }

  return { state, isLoading, error, operation };
}
```

---

## 📚 文档

### 核心文档

- [FRAMEWORK-DECOUPLING-COMPLETE.md](FRAMEWORK-DECOUPLING-COMPLETE.md) - 完整完成报告
- [MODULES-REFACTORING-COMPLETE.md](MODULES-REFACTORING-COMPLETE.md) - 模块重构细节
- [COMPOSABLES-COMPLETION-REPORT.md](COMPOSABLES-COMPLETION-REPORT.md) - Composables 报告
- [ADR-001-ApplicationService-Framework-Decoupling.md](../docs/adr/ADR-001-ApplicationService-Framework-Decoupling.md) - 架构决策记录

---

## 🚀 提取到 Packages 的步骤

### Phase 1: Account 提取

```bash
# 1. 复制 Services 到 packages
cp -r apps/web/src/modules/account/application/services \
      packages/domain-client/src/modules/account/application/

# 2. 更新导出
# packages/domain-client/src/index.ts

# 3. 验证导入
npm run tsc -- --noEmit

# 4. 更新 web 应用导入
# apps/web/src/modules/account/index.ts
# export { AccountProfileApplicationService } from '@dailyuse/domain-client';

# 5. 运行测试
npm run test -- account
```

### Phase 2: Authentication 提取

```bash
# 按照 Phase 1 的步骤进行
```

---

## 🧪 验证命令

```bash
# 检查 TypeScript 编译
npm run tsc -- --noEmit

# 检查 ESLint
npm run lint -- apps/web/src/modules

# 运行单元测试
npm run test -- account

# 运行 E2E 测试
npm run test:e2e

# 构建项目
npm run build

# 类型检查
npm run type-check
```

---

## ⚡ 常见问题

### Q: 为什么 Service 不能直接导入 Store？

A: 这样会产生框架耦合，Service 将无法提取到 Packages 中（Packages 不能依赖 Web 特定的 Pinia）。

### Q: Composable 为什么要统一处理错误？

A: 统一的错误处理让代码更易维护，组件可以统一处理错误 UI。

### Q: Store 中为什么要实现 getters？

A: Getters 提供了计算属性和状态查询的便利，减少组件中的逻辑。

### Q: 如何处理异步操作的竞态条件？

A: 在 Composable 中使用 abort 或 ref 标志来跟踪当前操作。

---

## 📞 问题排查

### 导入错误

```bash
# 问题: Cannot find module '@/modules/xxx'
# 解决: 检查 index.ts 中的导出是否正确
grep -n "export.*useXxx" apps/web/src/modules/xxx/index.ts
```

### TypeScript 错误

```bash
# 问题: Type 'undefined' is not assignable to type 'XxxDTO'
# 解决: Composable 中的操作方法应该总是返回 result | null
# 检查 catch 块是否返回 null
```

### Store 状态不更新

```bash
# 问题: UI 中的 state 没有更新
# 解决: 确保在 Composable 中使用 computed() 包装 store 属性
# ✅ const state = computed(() => store.property);
# ❌ const state = store.property;
```

---

## 🎯 下一步行动项

### 立即

- [ ] 验证所有 Composables 功能正确
- [ ] 运行完整的 E2E 测试
- [ ] 更新 UI 组件使用新 Composables

### 本周

- [ ] 开始 Account Services 提取
- [ ] 验证 Desktop App 兼容性
- [ ] 性能基准测试

### 下周

- [ ] 完成其他 Services 提取
- [ ] 建立 Services 文档
- [ ] 代码审查和优化

---

**最后更新**: 2025-01-18  
**维护者**: AI Agent  
**版本**: 1.0 ✅
