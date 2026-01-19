# Story 2.7 执行规划 - Web 入口重构审计报告

**时间**: 2025-01-18  
**目标**: 重构 Web 应用为纯展示层  
**规模**: ~107K LOC 的大规模重构

---

## 📊 审计结果

### 当前结构分析

**基线统计**:

- 总代码行数: **107,130 行**
- 目录数: 16 个
- 主要文件: App.vue, main.ts, components.d.ts

**目录分类**:

**✅ 应保留（展示层）**:

- `App.vue` - 根组件
- `components/` - UI 组件库
- `views/` - 页面组件
- `assets/` - 静态资源（图片、字体）
- `styles/` - 全局样式
- `main.ts` - 入口点（需更新）
- `components.d.ts`, `vite-env.d.ts` - 类型定义

**❌ 应删除（业务逻辑）**:

- `services/` - 业务服务
- `stores/` - 状态管理
- `modules/` - 模块业务逻辑
- `shared/` - 共享业务代码
- `utils/` - 工具函数（迁移到 packages）

**⚠️ 需要评估**:

- `config/` - 配置文件（检查是否仅展示配置）
- `benchmarks/` - 性能测试（可删除）
- `test/` - 测试文件（可能有依赖）

### 相对路径导入问题

存在大量相对路径导入（如 `from '../../modules'`），需要全部替换为包别名：

- `@dailyuse/application-client/{module}`
- `@dailyuse/domain-client/{module}`
- `@dailyuse/infrastructure-client/{module}`

---

## 🎯 执行策略

由于规模巨大（107K LOC），采用**分阶段迁移策略**：

### Phase 1: 准备与分析 (30 min)

1. ✅ 列出所有需要删除的目录和文件
2. ✅ 列出所有相对路径导入的文件
3. ✅ 生成导入替换映射表

### Phase 2: 批量删除非展示代码 (1 hour)

1. 删除 `src/services/`
2. 删除 `src/stores/` （如本地存在）
3. 删除 `src/utils/`
4. 删除 `src/shared/`
5. 清理 `src/modules/*/` 下的业务逻辑
6. 删除 `benchmarks/`

### Phase 3: 更新导入语句 (2-3 hours)

1. 更新 `components/` 中的相对导入
2. 更新 `views/` 中的相对导入
3. 更新 `main.ts` 和 `router/` 的导入
4. 更新 `modules/*/presentation/` 的导入

### Phase 4: 清理目录结构 (1 hour)

1. 重组 `components/` 和 `views/` 的结构
2. 删除空的 `modules/` 目录
3. 整理最终目录结构

### Phase 5: 验证与测试 (1-2 hours)

1. 运行 ESLint 检查
2. 运行 TypeScript 编译
3. 启动应用验证
4. 进行冒烟测试

### Phase 6: 报告与交接 (30 min)

1. 生成代码行数对比报告
2. 生成最终交接文档

---

## ⚙️ 技术决策

### 导入替换规则

**原则**: 优先使用包别名而非相对路径

```typescript
// ❌ 错误
import { useTask } from '../../modules/task/composables';
import { TaskStore } from '../stores/task.store';

// ✅ 正确
import { useTask } from '@dailyuse/application-client/task';
import { useTaskStore } from '@dailyuse/application-client/task';
```

### 删除优先级

1. **高优先级**（必须删除）:
   - `services/` - 所有业务服务
   - 本地 `stores/` - 所有状态管理
   - `modules/*/services` - 模块服务层
   - `modules/*/stores` - 模块状态

2. **中优先级**（应删除）:
   - `utils/` - 工具函数
   - `shared/` - 共享逻辑
   - `modules/*/composables` - 业务组合
   - `benchmarks/` - 性能测试

3. **低优先级**（评估后删除）:
   - `config/` - 检查后决定
   - 模块的 `types/` - 仅保留展示相关类型

---

## 📝 工作清单

### Phase 1: 准备 ✓

- [x] 审计完成
- [x] 目录分类完成
- [x] 问题识别完成

### Phase 2: 删除非展示代码

- [ ] 删除 `src/services/`
- [ ] 删除 `src/stores/`
- [ ] 删除 `src/utils/`
- [ ] 删除 `src/shared/`
- [ ] 清理 `src/modules/*/services` 等业务代码
- [ ] 删除 `src/benchmarks/`

### Phase 3: 更新导入

- [ ] 扫描所有相对导入
- [ ] 生成替换映射
- [ ] 自动化或手动替换
- [ ] 运行 ESLint 验证

### Phase 4: 清理结构

- [ ] 删除空目录
- [ ] 整理最终结构
- [ ] 验证 router 配置

### Phase 5: 验证

- [ ] TypeScript 编译通过
- [ ] ESLint 0 errors
- [ ] 应用启动成功
- [ ] 功能测试

### Phase 6: 报告

- [ ] 生成对比报告
- [ ] 代码行数: 107,130 → ?（预期 40K-50K）
- [ ] 文档更新

---

## 🚀 后续执行

**建议执行方式**:
采用自动化脚本 + 手动验证的混合方式，以最小化错误并确保质量。

**预计时间**: 5-7 小时内可完成全部任务
**风险等级**: 中等（大规模代码库变更，需严格测试）
**回滚策略**: Git 分支管理，每 phase 提交一次

---

## 📌 关键依赖

**必须完成的前置条件**:

- ✅ Story 2.1-2.6: 所有业务逻辑已迁移到 packages
- ✅ 所有 packages 导出正确
- ✅ 应用能够启动并导入 package 中的功能

**验证标准**:

- 代码行数减少 60%+（107,130 → <43,000）
- 0 个相对路径导入
- 0 个 ESLint 错误
- 应用正常启动
- 所有主要功能可用

---

**下一步**: 执行 Phase 2 - 批量删除非展示代码
