# Phase 5: 收尾与优化 (预计 1-2 天)

## 目标

完成所有迁移后的清理、优化和质量保证工作。确保项目在重构后代码质量、构建配置、CI/CD 和文档全部处于良好状态。

---

## 5.1 清理 ui-vue-shadcn 中已迁移的业务组件

### 5.1.1 删除 `custom/` 中的业务组件目录

Phase 2 已将所有业务组件迁移到 `app-vue/modules/`，现在可以安全删除：

```bash
# 删除已迁移的业务组件目录
rm -rf packages/ui-vue-shadcn/src/components/custom/account/
rm -rf packages/ui-vue-shadcn/src/components/custom/authentication/
rm -rf packages/ui-vue-shadcn/src/components/custom/task/
rm -rf packages/ui-vue-shadcn/src/components/custom/goal/
rm -rf packages/ui-vue-shadcn/src/components/custom/schedule/
rm -rf packages/ui-vue-shadcn/src/components/custom/reminder/
rm -rf packages/ui-vue-shadcn/src/components/custom/repository/
rm -rf packages/ui-vue-shadcn/src/components/custom/notification/
rm -rf packages/ui-vue-shadcn/src/components/custom/governance/
rm -rf packages/ui-vue-shadcn/src/components/custom/editor/
rm -rf packages/ui-vue-shadcn/src/components/custom/setting/
rm -rf packages/ui-vue-shadcn/src/components/custom/composables/
rm -rf packages/ui-vue-shadcn/src/components/custom/application/
```

### 5.1.2 保留的 custom 组件

```
packages/ui-vue-shadcn/src/components/custom/
└── linear/                     # 通用布局组件（非业务组件），保留
    ├── LinearListItem.vue
    ├── LinearPageHeader.vue
    ├── LinearPanel.vue
    ├── LinearSidebarItem.vue
    └── index.ts
```

### 5.1.3 更新 ui-vue-shadcn 导出

```typescript
// packages/ui-vue-shadcn/src/index.ts
// 移除所有已迁移的业务组件导出
// 保留:
// - ui/ 下的 51 个 shadcn 原子组件
// - composables/ (useDialog, useMessage, useConfirm 等)
// - custom/linear/ 通用布局组件
// - lib/utils.ts
// - styles/globals.css
```

### 5.1.4 瘦身后的 ui-vue-shadcn 结构

```
packages/ui-vue-shadcn/src/
├── index.ts                    # 精简后的导出
├── components/
│   ├── ui/                     # 51 个 shadcn 原子组件（全部保留）
│   └── custom/
│       └── linear/             # 通用布局组件（保留）
├── composables/                # 全部保留
├── lib/
│   └── utils.ts
└── styles/
    └── globals.css
```

---

## 5.2 更新所有 package.json 依赖

### 5.2.1 apps/web/package.json

```jsonc
{
  "dependencies": {
    // 新增
    "@dailyuse/app-vue": "workspace:*",

    // 保留（platform/di.ts 中直接使用的）
    "@dailyuse/http-client": "workspace:*",
    "@dailyuse/task": "workspace:*",
    "@dailyuse/goal": "workspace:*",
    // ... 其他领域包

    // 可能移除（如果不再直接引用）
    // 逐个检查，确认是否通过 app-vue 间接引用
  }
}
```

### 5.2.2 apps/desktop/package.json

```jsonc
{
  "dependencies": {
    // 新增
    "@dailyuse/app-vue": "workspace:*",
    "@dailyuse/ui-vue-shadcn": "workspace:*",
    "@dailyuse/ipc-client": "workspace:*",
    "vue": "^3.4.0",
    "vue-router": "^4.0.0",
    "pinia": "^3.0.0",

    // 移除 React 相关
    // react, react-dom, react-router-dom, zustand, @dnd-kit/*, framer-motion, lucide-react

    // 移除旧 UI 包
    // @dailyuse/ui-react-shadcn
  }
}
```

### 5.2.3 依赖冗余检查

```bash
# 查找未使用的依赖
npx depcheck apps/web/
npx depcheck apps/desktop/
npx depcheck packages/app-vue/
npx depcheck packages/ui-vue-shadcn/
```

---

## 5.3 清理 tsconfig.base.json

### 5.3.1 移除已删除包的路径别名

```jsonc
{
  "compilerOptions": {
    "paths": {
      // 确认已在 Phase 0 移除:
      // "@dailyuse/ui-react": [...],
      // "@dailyuse/ui-react-shadcn": [...],
      // "@dailyuse/ui-vuetify": [...],

      // 确认已在 Phase 1 添加:
      "@dailyuse/app-vue": ["packages/app-vue/src/index.ts"]
    }
  }
}
```

### 5.3.2 检查路径别名完整性

```bash
# 列出 tsconfig.base.json 中所有路径别名
cat tsconfig.base.json | grep -oP '"@dailyuse/[^"]+' | sort

# 对比实际存在的包
ls packages/ | sort

# 确保一一对应
```

---

## 5.4 全面质量检查

### 5.4.1 TypeScript 类型检查

```bash
# 全局类型检查
pnpm typecheck

# 如有错误，逐包检查
nx run-many -t typecheck --all
```

### 5.4.2 Lint 检查

```bash
# ESLint 全量检查
pnpm lint

# 自动修复
pnpm lint:fix

# 常见的 lint 问题:
# - 未使用的 import（迁移后残留）
# - import 排序变化
# - 路径别名更新后的引用错误
```

### 5.4.3 测试

```bash
# 全量测试
pnpm test

# 覆盖率报告
pnpm test:coverage

# 各项目单独测试
nx test web
nx test app-vue
nx test ui-vue-shadcn
# desktop 测试需要 Electron 环境，特殊处理
```

### 5.4.4 构建验证

```bash
# 全量构建
pnpm build

# 验证各产物
nx build web
nx build app-vue
nx build api
nx build desktop
```

---

## 5.5 CI/CD 配置更新

### 5.5.1 GitHub Actions 工作流

检查并更新 `.github/workflows/` 中的工作流：

- [ ] 构建步骤是否包含新增的 `app-vue` 包
- [ ] 测试步骤是否覆盖 `app-vue`
- [ ] 缓存配置是否需要更新（`pnpm-lock.yaml` 已变化）
- [ ] 部署配置是否需要更新

### 5.5.2 Nx 配置优化

```bash
# 验证项目图谱正确
nx graph

# 确认 affected 命令正确识别依赖
nx affected:build --base=main
nx affected:test --base=main
```

---

## 5.6 文档更新

### 5.6.1 README.md

更新项目根目录 `README.md`：
- 更新架构图（新增 `app-vue` 包）
- 更新开发命令（如有变化）
- 更新目录结构说明
- 移除对已删除包的描述

### 5.6.2 CLAUDE.md

更新 `CLAUDE.md` 中的项目概述：
- 更新包导入模式（新增 `@dailyuse/app-vue` 导入示例）
- 更新架构描述（DDD 层 + app-vue 共享展示层）
- 更新 Desktop 技术栈（React → Vue 3）

### 5.6.3 包级文档

- `packages/app-vue/README.md` — 新包使用说明
- `packages/ui-vue-shadcn/README.md` — 更新（瘦身后的组件列表）
- `apps/web/README.md` — 更新（Thin Shell 架构说明）
- `apps/desktop/README.md` — 更新（Vue 3 renderer 说明）

---

## 5.7 性能优化检查

### 5.7.1 Bundle Size 分析

```bash
# Web bundle 分析
nx build web -- --mode=production
npx vite-bundle-visualizer

# Desktop renderer bundle 分析
# 检查是否有不必要的依赖被打包
```

### 5.7.2 Tree-shaking 验证

确认以下包的 tree-shaking 正常工作：
- `@dailyuse/app-vue` — barrel export 不影响 tree-shaking
- `@dailyuse/ui-vue-shadcn` — shadcn 组件按需导入
- `@dailyuse/contracts` — 仅导入类型，不产生运行时代码

### 5.7.3 懒加载验证

确认路由级别的代码分割正常：
```bash
# 检查 Web 构建产物中的 chunk 分割
ls -la apps/web/dist/assets/*.js | wc -l
# 应该有多个 chunk（每个路由一个）
```

---

## 5.8 最终验证清单

### 5.8.1 功能验证

| 功能 | Web | Desktop |
|------|-----|---------|
| 用户登录/注册 | [ ] | [ ] |
| 任务管理（CRUD） | [ ] | [ ] |
| 目标管理（CRUD） | [ ] | [ ] |
| 日程管理 | [ ] | [ ] |
| 提醒管理 | [ ] | [ ] |
| 知识库管理 | [ ] | [ ] |
| 通知中心 | [ ] | [ ] |
| 规则管理 | [ ] | [ ] |
| 用户设置 | [ ] | [ ] |
| 账户管理 | [ ] | [ ] |
| 编辑器 | [ ] | [ ] |
| Dashboard | [ ] | [ ] |
| 系统托盘 | — | [ ] |
| 快捷键 | — | [ ] |
| 离线模式 | — | [ ] |
| 数据同步 | — | [ ] |

### 5.8.2 技术验证

```bash
# 全面检查脚本
pnpm install          # 依赖安装无错误
pnpm build            # 全量构建通过
pnpm test             # 全量测试通过
pnpm lint             # Lint 无错误
pnpm typecheck        # TypeScript 检查通过

# 确认无残留引用
grep -r "ui-react" --include="*.ts" --include="*.vue" --include="*.json" apps/ packages/ | grep -v node_modules
grep -r "ui-vuetify" --include="*.ts" --include="*.vue" --include="*.json" apps/ packages/ | grep -v node_modules
grep -r "from '@/modules" apps/web/src/ | grep -v node_modules
```

---

## 5.9 重构成果总结

### 5.9.1 包结构变化

| Phase 前 | Phase 后 | 变化 |
|----------|----------|------|
| `packages/ui-react/` | 已删除 | Phase 0 |
| `packages/ui-react-shadcn/` | 已删除 | Phase 0 |
| `packages/ui-vuetify/` | 已删除 | Phase 0 |
| — | `packages/app-vue/` | Phase 1 新增 |
| `packages/ui-vue-shadcn/` | 瘦身（仅 UI 原子组件） | Phase 5 |
| `apps/web/src/modules/` | 已删除（迁入 app-vue） | Phase 3 |
| `apps/desktop/src/renderer/` | React → Vue 3 | Phase 4 |

### 5.9.2 架构收益

- **代码共享**: Web 和 Desktop 共享 ~315+ 个业务文件
- **技术栈统一**: 全面 Vue 3，消除 React 和 Vuetify 技术债
- **DI 解耦**: 业务逻辑完全不感知运行平台（HTTP vs IPC）
- **维护成本**: 业务修改只需在 app-vue 中更改一次

---

## 5.10 检查清单

- [ ] 删除 `ui-vue-shadcn/custom/` 中已迁移的业务组件
- [ ] 更新 `ui-vue-shadcn/index.ts` 导出
- [ ] 更新所有 `package.json` 依赖
- [ ] 清理 `tsconfig.base.json` 路径别名
- [ ] TypeScript 类型检查通过
- [ ] ESLint 检查通过
- [ ] 全量测试通过
- [ ] 全量构建通过
- [ ] 更新 CI/CD 配置
- [ ] 更新 README.md
- [ ] 更新 CLAUDE.md
- [ ] 各包 README 更新
- [ ] Bundle Size 分析
- [ ] Tree-shaking 验证
- [ ] 路由懒加载验证
- [ ] Web 功能全面验证
- [ ] Desktop 功能全面验证
