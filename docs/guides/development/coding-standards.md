---
tags:
  - guide
  - development
  - coding-standards
  - typescript
  - vue
  - nestjs
  - architecture
description: DailyUse项目代码规范 - TypeScript、Vue 3、NestJS编码规范与架构最佳实践
created: 2025-11-23T16:00:00
updated: 2025-01-22T00:00:00
---

# 📝 代码规范 (Coding Standards)

> 统一的代码风格，提升代码质量和可维护性
>
> **关联标准**: 📐 [standards/naming.md](../../standards/naming.md) | 🏛 [standards/architecture.md](../../standards/architecture.md) | 🔄 [standards/patterns.md](../../standards/patterns.md)

## 📋 目录

- [🚨 核心规则](#-核心规则)
- [通用规范](#通用规范)
- [TypeScript规范](#typescript规范)
- [Vue 3规范](#vue-3规范)
- [NestJS规范](#nestjs规范)
- [命名约定](#命名约定)
- [架构与分层](#架构与分层)
- [注释规范](#注释规范)

---

## 🚨 核心规则

> 详细说明见 [standards/patterns.md](../../standards/patterns.md)

| 规则              | 说明                                   | 详情                                                                                 |
| ----------------- | -------------------------------------- | ------------------------------------------------------------------------------------ |
| **1️⃣ 类型集中化** | 所有共享类型放在 `@dailyuse/contracts` | [查看详情](../../standards/patterns.md#rule-1-type-centralization-dailyusecontracts) |
| **2️⃣ API响应**    | 使用 `ok: boolean`                     | [查看详情](../../standards/patterns.md#rule-2-api-response-format)                   |
| **3️⃣ 层隔离**     | Domain 不导入 Infrastructure           | [查看详情](../../standards/patterns.md#rule-3-layer-isolation)                       |

---

## 🌍 通用规范

### 文件编码

- **编码**: UTF-8 (无BOM)
- **换行符**: LF (`\n`)
- **缩进**: 2个空格
- **文件末尾**: 保留一个空行

### 代码格式化

项目使用 **Prettier** 自动格式化代码。

**配置文件**: `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "trailingComma": "all",
  "printWidth": 100,
  "arrowParens": "avoid"
}
```

**VS Code配置**:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

### 代码检查

项目使用 **ESLint** 进行代码检查。

**运行检查**:

```bash
pnpm nx run-many --target=lint --all
```

**自动修复**:

```bash
pnpm nx run-many --target=lint --all --fix
```

---

## 📘 TypeScript规范

### 类型声明

#### ✅ 优先使用类型推断

```typescript
// ✅ Good - 类型推断
const count = 0;
const message = 'Hello';

// ❌ Bad - 冗余类型声明
const count: number = 0;
const message: string = 'Hello';
```

#### ✅ 函数参数和返回值必须声明类型

```typescript
// ✅ Good
function calculateTotal(price: number, quantity: number): number {
  return price * quantity;
}

// ❌ Bad - 缺少类型
function calculateTotal(price, quantity) {
  return price * quantity;
}
```

#### ✅ 使用接口或类型别名

```typescript
// ✅ Good - 使用interface定义对象结构
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Good - 使用type定义联合类型
type Status = 'pending' | 'active' | 'completed';

// ❌ Bad - 内联类型定义
function getUser(): { id: string; name: string; email: string } {
  // ...
}
```

### 类型安全

#### ✅ 避免使用 `any`

```typescript
// ✅ Good - 使用具体类型
function processData(data: unknown): void {
  if (typeof data === 'string') {
    console.log(data.toUpperCase());
  }
}

// ❌ Bad - 使用any
function processData(data: any): void {
  console.log(data.toUpperCase());
}
```

#### ✅ 使用严格的null检查

```typescript
// ✅ Good - 处理null/undefined
function getUserName(user: User | null): string {
  return user?.name ?? 'Anonymous';
}

// ❌ Bad - 未处理null
function getUserName(user: User | null): string {
  return user.name; // 可能抛出错误
}
```

### 导入规范

#### ✅ 使用类型导入

```typescript
// ✅ Good - 类型导入
import type { User, UserRole } from './types';
import { UserService } from './user.service';

// ❌ Bad - 混合导入
import { User, UserRole, UserService } from './user';
```

#### ✅ 路径别名

```typescript
// ✅ Good - 使用路径别名
import { CreateGoalDto } from '@dailyuse/contracts';
import { GoalEntity } from '@/domain/entities/goal.entity';

// ❌ Bad - 相对路径
import { CreateGoalDto } from '../../../contracts/goal/dto';
```

---

## 🖼 Vue 3规范

### 组件结构

#### ✅ 使用 `<script setup>` 语法

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';

// Props
interface Props {
  title: string;
  count?: number;
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
});

// Emits
const emit = defineEmits<{
  update: [value: number];
  delete: [];
}>();

// State
const localCount = ref(props.count);

// Computed
const doubleCount = computed(() => localCount.value * 2);

// Methods
function increment() {
  localCount.value++;
  emit('update', localCount.value);
}
</script>

<template>
  <div class="counter">
    <h2>{{ title }}</h2>
    <p>Count: {{ localCount }}</p>
    <p>Double: {{ doubleCount }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>

<style scoped>
.counter {
  padding: 1rem;
}
</style>
```

### 命名约定

#### ✅ 组件文件名使用 PascalCase

```
✅ Good:
components/
  GoalCard.vue
  TaskList.vue
  UserProfile.vue

❌ Bad:
components/
  goal-card.vue
  taskList.vue
  user_profile.vue
```

#### ✅ 组件名使用多词

```typescript
// ✅ Good
export default {
  name: 'GoalCard',
};

// ❌ Bad - 单词组件名
export default {
  name: 'Goal',
};
```

### Props与Emits

#### ✅ Props使用TypeScript接口

```typescript
// ✅ Good
interface Props {
  goalId: string;
  title: string;
  status?: GoalStatus;
}

const props = withDefaults(defineProps<Props>(), {
  status: 'draft',
});

// ❌ Bad - 未定义类型
const props = defineProps({
  goalId: String,
  title: String,
});
```

#### ✅ Emits使用类型声明

```typescript
// ✅ Good
const emit = defineEmits<{
  update: [goal: Goal];
  delete: [goalId: string];
  close: [];
}>();

// ❌ Bad - 未定义类型
const emit = defineEmits(['update', 'delete', 'close']);
```

### Composables

#### ✅ 使用 `use` 前缀

```typescript
// ✅ Good
export function useGoalStore() {
  const store = useStore();
  // ...
  return { goals, fetchGoals };
}

// ❌ Bad
export function goalStore() {
  // ...
}
```

---

## 🏗 NestJS规范

### 模块结构

#### ✅ 遵循DDD分层架构

```
goal/
├── domain/                  # 领域层
│   ├── entities/
│   ├── value-objects/
│   └── repositories/
├── application/             # 应用层
│   ├── commands/
│   ├── queries/
│   └── services/
├── infrastructure/          # 基础设施层
│   ├── persistence/
│   └── events/
└── presentation/            # 表现层
    ├── controllers/
    └── dto/
```

### 依赖注入

#### ✅ 使用构造函数注入

```typescript
// ✅ Good
@Injectable()
export class GoalService {
  constructor(
    private readonly goalRepository: GoalRepository,
    private readonly eventBus: EventBus,
  ) {}
}

// ❌ Bad - 属性注入
@Injectable()
export class GoalService {
  @Inject()
  private goalRepository: GoalRepository;
}
```

### 异常处理

#### ✅ 使用NestJS内置异常

```typescript
// ✅ Good
if (!goal) {
  throw new NotFoundException(`Goal with ID ${id} not found`);
}

// ❌ Bad - 抛出普通Error
if (!goal) {
  throw new Error('Goal not found');
}
```

### DTO验证

#### ✅ 使用 `class-validator`

```typescript
// ✅ Good
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateGoalDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(GoalStatus)
  status: GoalStatus;
}

// ❌ Bad - 未使用验证
export class CreateGoalDto {
  title: string;
  description?: string;
  status: GoalStatus;
}
```

---

## 📛 命名约定

> 详细规范见 [standards/naming.md](../../standards/naming.md)

### 快速参考

| 实体     | 风格                 |
| -------- | -------------------- |
| 类名     | PascalCase           |
| 方法名   | camelCase            |
| 变量名   | camelCase            |
| 常量     | SCREAMING_SNAKE      |
| 文件名   | kebab-case           |
| 接口名   | PascalCase (无I前缀) |
| 组件文件 | PascalCase           |
| 文件夹名 | kebab-case           |

**[查看完整详情和所有例子](../../standards/naming.md)**

---

## 🏗 架构与分层

> 参考 [standards/architecture.md](../../standards/architecture.md)

### 架构层级关系

---

## 🏗 架构与分层

> 详细规范见 [standards/architecture.md](../../standards/architecture.md)

**核心原则**:

- 🏛 **Domain** (核心业务) → 不导入任何外层
- 📦 **Application** (用例层) → 只依赖 Domain 和 Contracts
- 🔧 **Infrastructure** (实现) → 实现 Domain 中定义的接口
- 💻 **UI** (表现层) → 调用 Application 的服务

**[查看完整的依赖规则和代码示例](../../standards/architecture.md)**

---

## 💬 注释规范

### JSDoc注释

#### ✅ 为公共API添加JSDoc

````typescript
/**
 * 创建新目标
 *
 * @param dto - 创建目标的数据传输对象
 * @returns 创建的目标实体
 * @throws {BadRequestException} 当目标数据无效时抛出
 *
 * @example
 * ```typescript
 * const goal = await goalService.create({
 *   title: 'Learn TypeScript',
 *   description: 'Master TypeScript in 30 days',
 * });
 * ```
 */
async create(dto: CreateGoalDto): Promise<Goal> {
  // ...
}
````

### 代码注释

#### ✅ 解释"为什么"，而非"是什么"

```typescript
// ✅ Good - 解释原因
// 使用WeakMap避免内存泄漏，当组件被销毁时自动清理
const componentCache = new WeakMap();

// ❌ Bad - 重复代码
// 创建一个WeakMap
const componentCache = new WeakMap();
```

#### ✅ 标记待办事项

```typescript
// TODO: 实现目标归档功能
// FIXME: 修复日期格式化在IE11中的问题
// HACK: 临时解决方案，需要重构
// NOTE: 这个逻辑与产品需求相关，不要修改
```

---

## 🔀 Git提交规范

### Commit Message格式

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type类型

| Type       | 描述      | 示例                              |
| ---------- | --------- | --------------------------------- |
| `feat`     | 新功能    | `feat(goal): 添加目标归档功能`    |
| `fix`      | Bug修复   | `fix(task): 修复任务状态更新问题` |
| `docs`     | 文档更新  | `docs(readme): 更新安装指南`      |
| `style`    | 代码格式  | `style(goal): 格式化代码`         |
| `refactor` | 重构      | `refactor(goal): 重构目标服务`    |
| `perf`     | 性能优化  | `perf(query): 优化目标查询性能`   |
| `test`     | 测试      | `test(goal): 添加目标创建测试`    |
| `chore`    | 构建/工具 | `chore(deps): 升级依赖版本`       |

### 示例

```bash
# Feature
feat(goal): 添加目标批量删除功能

实现批量删除目标的API和前端交互
- 添加批量删除API端点
- 实现前端多选功能
- 添加确认对话框

Closes #123

# Bug Fix
fix(task): 修复任务状态更新不生效的问题

问题：任务状态更新后，前端状态未同步
原因：聚合根未记录领域事件或仓储层未自动分发
解决：在聚合根业务方法中记录TaskUpdated事件，并由仓储save自动分发

Fixes #456

# Refactor
refactor(goal): 重构目标实体为DDD模式

- 将GoalEntity改为聚合根
- 提取GoalTitle为值对象
- 在聚合根业务方法中记录领域事件并由仓储层自动分发

# Documentation
docs(architecture): 更新架构决策记录

添加ADR-004: 采用CQRS模式
```

---

## 🔍 代码审查清单

### 提交PR前自查

- [ ] 代码通过ESLint检查
- [ ] 代码通过Prettier格式化
- [ ] 所有测试通过
- [ ] 添加必要的单元测试
- [ ] 更新相关文档
- [ ] 提交信息符合规范
- [ ] 代码无console.log等调试代码
- [ ] 敏感信息已移除（密码、Token等）

### 代码审查要点

#### 功能性

- [ ] 代码实现是否符合需求
- [ ] 是否有边界情况未处理
- [ ] 错误处理是否完善

#### 可维护性

- [ ] 代码是否易于理解
- [ ] 是否有冗余代码
- [ ] 命名是否清晰

#### 性能

- [ ] 是否有性能问题
- [ ] 是否有内存泄漏风险
- [ ] 是否有不必要的计算

#### 安全性

- [ ] 是否有SQL注入风险
- [ ] 是否有XSS风险
- [ ] 是否有权限校验

---

## 🛠 工具配置

### VS Code扩展

必装扩展：

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "vue.volar",
    "vitest.explorer"
  ]
}
```

### EditorConfig

项目根目录 `.editorconfig`:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

---

## 📚 参考资源

### 官方风格指南

- [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Vue Style Guide](https://vuejs.org/style-guide/)
- [NestJS Best Practices](https://docs.nestjs.com/)

### 代码质量工具

- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [TypeScript ESLint](https://typescript-eslint.io/)

### 提交规范

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Commitizen](https://commitizen-tools.github.io/commitizen/)

---

## 🤝 反馈与改进

发现规范问题或有改进建议？

1. 提交 [GitHub Issue](https://github.com/BakerSean168/DailyUse/issues)
2. 使用标签 `coding-standards`
3. 描述问题或建议

---

**最后更新**: 2025-11-23  
**维护者**: @BakerSean168  
**版本**: v2.0
