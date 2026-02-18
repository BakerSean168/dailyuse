# TypeScript 配置快速参考

## 📚 配置文件位置

```
根目录/
├── tsconfig.base.json           # 基础配置（所有项目继承）
├── tsconfig.json                # 根项目配置
├── apps/
│   ├── api/tsconfig.json        # API 服务
│   ├── web/tsconfig.json        # Web 前端
│   └── desktop/
│       ├── tsconfig.json        # 桌面应用主配置
│       └── tsconfig.node.json   # Vite 配置文件
└── packages/
    ├── contracts/tsconfig.json
  ├── domain-shared/tsconfig.json
  ├── governance/tsconfig.json
  ├── {domain}/tsconfig.json
    ├── ui/tsconfig.json
    ├── utils/tsconfig.json
    └── assets/tsconfig.json
```

## 🎯 关键配置说明

### tsconfig.base.json - 基础配置

```jsonc
{
  "compilerOptions": {
    "target": "ES2020",              // 编译目标
    "module": "ESNext",              // 模块系统
    "moduleResolution": "Node",      // Node 解析（默认）
    "strict": true,                  // 严格模式
    "skipLibCheck": true,            // 跳过库检查（性能优化）
    "incremental": true,             // 增量编译
    "paths": { ... }                 // 全局路径别名
  }
}
```

### 应用项目配置模板

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": false,                 // 生成输出文件
    "composite": true,               // 支持项目引用
    "declaration": true,             // 生成 .d.ts
    "declarationMap": true,          // 生成 .d.ts.map
    "sourceMap": true,               // 生成 .js.map
    "paths": { ... }                 // 本地路径别名
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"],
  "references": [ ... ]              // 依赖的包
}
```

### 库项目配置模板

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": false,
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "lib": ["ES2020"],               // 或 ["ES2020", "DOM"]
    "paths": { ... }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"],
  "references": [ ... ]
}
```

## 🔗 路径别名使用

### 全局包别名（所有项目可用）

```typescript
// ✅ 推荐：使用包名导入
import { ResponseCode } from '@dailyuse/contracts';
import { GoalId } from '@dailyuse/domain-shared/goal';
import { createLogger } from '@dailyuse/utils';

// ✅ 子路径导入
import { NotificationContracts } from '@dailyuse/contracts/notification';
import { DateUtils } from '@dailyuse/utils/date';
```

### 本地别名（项目内部）

```typescript
// apps/api
import { NotificationController } from '@/modules/notification';
import { prisma } from '@/config/prisma';

// apps/web 或 apps/desktop
import HomeView from '@/views/Home.vue';
import { useAuth } from '@/composables/useAuth';

// apps/desktop 特有
import { ipcMain } from '@electron/main';
import { GoalType } from '@common/types/goal';
```

## 📋 环境特定配置

### Node.js 环境（API）

```jsonc
{
  "compilerOptions": {
    "lib": ["ES2020"],
    "types": ["node"],
    "moduleResolution": "Node",
  },
}
```

### 浏览器环境（Web）

```jsonc
{
  "compilerOptions": {
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],
    "moduleResolution": "Bundler",
  },
}
```

### 混合环境（Desktop）

```jsonc
{
  "compilerOptions": {
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "types": ["vite/client", "node"],
    "moduleResolution": "Bundler",
    "jsx": "preserve",
  },
}
```

### 库环境（Packages）

```jsonc
{
  "compilerOptions": {
    // 通用库（无 DOM 依赖）
    "lib": ["ES2020"],

    // 客户端库（需要 DOM）
    "lib": ["ES2020", "DOM"],

    // 服务端库（需要 Node）
    "types": ["node"],
  },
}
```

## 🛠️ 常用命令

### 类型检查

```bash
# 检查所有项目
pnpm tsc --build

# 检查单个项目
pnpm tsc --build apps/api
pnpm tsc --build packages/domain-shared

# 清除构建缓存
pnpm tsc --build --clean

# 强制重新构建
pnpm tsc --build --force

# 查看构建顺序（不实际构建）
pnpm tsc --build --dry --force
```

### Nx 构建

```bash
# 构建所有项目
pnpm nx run-many --target=build --all

# 构建单个项目
pnpm nx build api
pnpm nx build web

# 只构建受影响的项目
pnpm nx affected --target=build

# 查看项目依赖图
pnpm nx graph
```

## 📊 项目引用关系

### 构建顺序（从底层到顶层）

```
1. packages/contracts      (无依赖)
2. packages/utils          (无依赖)
3. packages/domain-shared  (依赖: contracts, utils)
4. packages/{domain}       (依赖: contracts, domain-shared, utils)
  packages/ui             (依赖: utils)
5. apps/api               (依赖: contracts, domain-shared, {domain}, utils)
  apps/web               (依赖: contracts, domain-shared, {domain}, utils, ui)
  apps/desktop           (依赖: contracts, domain-shared, {domain}, utils, ui)
6. packages/governance    (依赖: contracts, domain-shared, utils)
7. packages/assets        (无依赖)
```

## ⚡ 性能优化技巧

### 1. 增量编译

所有库已启用 `composite: true`，会生成 `.tsbuildinfo` 文件缓存类型信息。

**效果**: 后续构建速度提升 50-70%

### 2. 跳过库检查

`skipLibCheck: true` 跳过 node_modules 的类型检查。

**效果**: 编译速度提升 30-40%

### 3. 项目引用

使用 `references` 配置依赖关系，支持并行构建。

**效果**: 多项目构建可并行执行

### 4. 使用 Nx 缓存

Nx 会缓存构建结果，相同输入不重复构建。

```bash
# 查看缓存状态
pnpm nx reset

# 使用 Nx 构建（自动利用缓存）
pnpm nx build api
```

## 🐛 调试支持

### Source Maps 配置

所有项目已启用：

- `sourceMap: true` - 生成 .js.map
- `declarationMap: true` - 生成 .d.ts.map

**效果**:

- ✅ 调试时可以断点到 TypeScript 源码
- ✅ IDE 跳转定义可以直接到源文件
- ✅ 错误堆栈显示源码位置

### 在 VS Code 中调试

在 `launch.json` 中添加：

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug API",
  "runtimeArgs": ["-r", "ts-node/register"],
  "args": ["${workspaceFolder}/apps/api/src/main.ts"],
  "sourceMaps": true,
  "outFiles": ["${workspaceFolder}/apps/api/dist/**/*.js"]
}
```

## 📝 添加新项目/包

### 添加新的应用项目

1. 复制现有应用的 tsconfig.json
2. 修改 `references` 指向需要的包
3. 在根 tsconfig.json 的 `references` 中添加新项目
4. 运行 `pnpm tsc --build` 验证

### 添加新的库包

1. 复制现有库的 tsconfig.json
2. 设置正确的 `lib` 和 `types`
3. 配置 `references` 指向依赖的包
4. 在根 tsconfig.json 的 `references` 中添加
5. 在 tsconfig.base.json 的 `paths` 中添加别名
6. 运行 `pnpm tsc --build` 验证

### 示例：添加新包 `@dailyuse/analytics`

```jsonc
// packages/analytics/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": false,
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "lib": ["ES2020", "DOM"],
    "paths": {
      "@/*": ["./src/*"],
      "@dailyuse/utils": ["../utils/src/index.ts"],
    },
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"],
  "references": [{ "path": "../utils" }],
}
```

然后更新 `tsconfig.base.json`:

```jsonc
{
  "compilerOptions": {
    "paths": {
      // ... 其他别名
      "@dailyuse/analytics": ["packages/analytics/src/index.ts"],
      "@dailyuse/analytics/*": ["packages/analytics/src/*"],
    },
  },
}
```

## ⚠️ 常见问题

### 1. 找不到模块

**问题**: `Cannot find module '@dailyuse/xxx'`

**解决**:

- 检查 tsconfig.base.json 的 `paths` 配置
- 确保目标包有 `index.ts` 导出文件
- 运行 `pnpm tsc --build` 构建依赖包

### 2. 循环依赖

**问题**: `Circular reference detected`

**解决**:

- 检查 `references` 配置，避免循环引用
- 调整包的依赖关系，保持单向依赖

### 3. 类型不匹配

**问题**: `Type 'X' is not assignable to type 'Y'`

**解决**:

- 确保所有包使用相同的 TypeScript 版本
- 运行 `pnpm tsc --build --clean && pnpm tsc --build` 清除缓存

### 4. 增量编译失败

**问题**: 修改后类型没更新

**解决**:

- 删除 `.tsbuildinfo` 文件
- 运行 `pnpm tsc --build --force`

## 🎯 最佳实践

1. ✅ **始终使用路径别名**: `@dailyuse/xxx` 而不是相对路径
2. ✅ **定期清理缓存**: `pnpm nx reset && pnpm tsc --build --clean`
3. ✅ **使用 Nx 构建**: 比直接 tsc 更快（有缓存）
4. ✅ **排除测试文件**: 避免生成测试文件的类型声明
5. ✅ **保持依赖单向**: 避免循环依赖
6. ✅ **合理使用 composite**: 频繁变更的库才需要
7. ✅ **统一 TypeScript 版本**: 所有项目使用相同版本

---

**更新日期**: 2025-10-11  
**文档版本**: 1.0.0
