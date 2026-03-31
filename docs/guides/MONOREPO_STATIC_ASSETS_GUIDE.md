# Monorepo 静态资源处理最佳实践调研报告

> 本文档调研了主流 Monorepo 项目中静态资源（图片、字体、音频、图标等）的处理方式，包括目录结构、打包方式、引入方式等。

## 目录

1. [概述](#概述)
2. [主流方案对比](#主流方案对比)
3. [方案一：独立静态资源包](#方案一独立静态资源包-推荐)
4. [方案二：应用级 public 目录](#方案二应用级-public-目录)
5. [方案三：共享 UI 库内嵌资源](#方案三共享-ui-库内嵌资源)
6. [打包工具配置](#打包工具配置)
7. [引入方式对比](#引入方式对比)
8. [Memoflow 项目建议](#Memoflow-项目建议)
9. [参考资料](#参考资料)

---

## 概述

在 Monorepo 架构中，静态资源的管理是一个重要但容易被忽视的问题。主要挑战包括：

- **资源共享**：多个应用（web、desktop、mobile）需要共享 logo、图标、字体等
- **版本管理**：确保所有应用使用一致的资源版本
- **构建优化**：避免重复打包、支持 tree-shaking、按需加载
- **路径解析**：开发环境和生产环境的路径差异
- **类型安全**：TypeScript 项目需要类型提示

## 主流方案对比

| 方案 | 适用场景 | 优点 | 缺点 |
|------|---------|------|------|
| 独立静态资源包 | 多应用共享资源 | 版本管理、按需引入 | 配置复杂 |
| 应用级 public 目录 | 单应用、少量资源 | 简单、零配置 | 无法共享 |
| UI 库内嵌资源 | 组件与资源强绑定 | 封装性好 | 耦合度高 |

---

## 方案一：独立静态资源包（推荐）

### 1.1 目录结构

```
packages/
└── assets/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts          # 或 tsup.config.ts
    ├── src/
    │   ├── index.ts            # 主入口
    │   ├── images/
    │   │   ├── index.ts
    │   │   ├── logos/
    │   │   │   ├── logo.svg
    │   │   │   ├── logo-dark.svg
    │   │   │   └── logo-128.png
    │   │   └── avatars/
    │   │       └── default.png
    │   ├── fonts/
    │   │   ├── index.ts
    │   │   └── inter/
    │   │       ├── Inter-Regular.woff2
    │   │       └── Inter-Bold.woff2
    │   ├── icons/
    │   │   ├── index.ts
    │   │   └── svg/
    │   │       ├── check.svg
    │   │       └── close.svg
    │   └── audio/
    │       ├── index.ts
    │       └── notifications/
    │           └── ding.mp3
    └── dist/
        ├── index.js
        ├── index.d.ts
        ├── images/
        ├── fonts/
        └── audio/
```

### 1.2 package.json 配置

```json
{
  "name": "@dailyuse/assets",
  "version": "0.0.1",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./images": {
      "types": "./dist/images/index.d.ts",
      "import": "./dist/images/index.js"
    },
    "./fonts": {
      "types": "./dist/fonts/index.d.ts",
      "import": "./dist/fonts/index.js"
    },
    "./icons": {
      "types": "./dist/icons/index.d.ts",
      "import": "./dist/icons/index.js"
    },
    "./audio": {
      "types": "./dist/audio/index.d.ts",
      "import": "./dist/audio/index.js"
    }
  },
  "files": [
    "dist"
  ],
  "sideEffects": false
}
```

### 1.3 资源导出方式

**方式 A：使用 `new URL()` 模式（Vite 推荐）**

```typescript
// src/images/index.ts
// 这种方式在打包时会保留资源的相对路径

export const logo = new URL('./logos/logo.svg', import.meta.url).href;
export const logoDark = new URL('./logos/logo-dark.svg', import.meta.url).href;
export const logo128 = new URL('./logos/logo-128.png', import.meta.url).href;

export const defaultAvatar = new URL('./avatars/default.png', import.meta.url).href;

// 导出所有 logos
export const logos = {
  default: logo,
  dark: logoDark,
  '128': logo128,
} as const;
```

**方式 B：使用 import 语句（Base64 内联）**

```typescript
// src/images/index.ts
// 小于 4KB 的资源会被内联为 base64
// 适合图标等小文件

import logoSvg from './logos/logo.svg?url';
import logoPng from './logos/logo-128.png?url';

export { logoSvg as logo, logoPng as logo128 };
```

**方式 C：原始文件内容导出**

```typescript
// src/icons/index.ts
// 适合 SVG 图标，可以直接作为组件使用

import checkSvg from './svg/check.svg?raw';
import closeSvg from './svg/close.svg?raw';

export { checkSvg, closeSvg };
```

### 1.4 字体文件处理

```typescript
// src/fonts/index.ts
export const interRegular = new URL('./inter/Inter-Regular.woff2', import.meta.url).href;
export const interBold = new URL('./inter/Inter-Bold.woff2', import.meta.url).href;

// 导出 CSS @font-face 规则
export const fontFaces = `
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('${interRegular}') format('woff2');
}

@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('${interBold}') format('woff2');
}
`;
```

---

## 方案二：应用级 public 目录

### 2.1 目录结构

```
apps/
└── web/
    ├── public/
    │   ├── logo.svg
    │   ├── favicon.ico
    │   └── fonts/
    │       └── inter.woff2
    └── src/
        └── ...
```

### 2.2 使用方式

```typescript
// 直接使用绝对路径引用
const logoUrl = '/logo.svg';
const fontUrl = '/fonts/inter.woff2';

// 在 HTML 中
<link rel="icon" href="/favicon.ico" />
```

### 2.3 优缺点

**优点：**
- 零配置，Vite/Webpack 原生支持
- 资源不经过打包处理，保持原始状态
- 适合 robots.txt、favicon.ico 等必须保持固定路径的文件

**缺点：**
- 无法在多个应用间共享
- 无类型安全
- 无法利用打包工具的优化（hash、压缩等）

---

## 方案三：共享 UI 库内嵌资源

### 3.1 目录结构

```
packages/
└── ui/
    ├── src/
    │   ├── components/
    │   │   └── Logo/
    │   │       ├── index.tsx
    │   │       ├── logo.svg        # 组件私有资源
    │   │       └── logo-dark.svg
    │   └── assets/                 # 库级共享资源
    │       └── ...
    └── package.json
```

### 3.2 组件内嵌资源

```tsx
// packages/ui/src/components/Logo/index.tsx
import logoLight from './logo.svg?url';
import logoDark from './logo-dark.svg?url';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: number;
}

export function Logo({ variant = 'light', size = 32 }: LogoProps) {
  const src = variant === 'dark' ? logoDark : logoLight;
  return <img src={src} alt="Logo" width={size} height={size} />;
}
```

---

## 打包工具配置

### 4.1 Vite 配置

```typescript
// packages/assets/vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, readdirSync } from 'fs';
import dts from 'vite-plugin-dts';

// 复制静态资源的辅助函数
function copyDir(src: string, dest: string) {
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = resolve(src, entry.name);
    const destPath = resolve(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

// 自定义插件：复制静态资源到 dist
function copyAssetsPlugin() {
  return {
    name: 'copy-assets',
    closeBundle() {
      copyDir(
        resolve(__dirname, 'src/images/logos'),
        resolve(__dirname, 'dist/images/logos')
      );
      copyDir(
        resolve(__dirname, 'src/images/avatars'),
        resolve(__dirname, 'dist/images/avatars')
      );
      copyDir(
        resolve(__dirname, 'src/fonts'),
        resolve(__dirname, 'dist/fonts')
      );
      console.log('✅ Static assets copied to dist');
    },
  };
}

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      outDir: 'dist',
      rollupTypes: false,
    }),
    copyAssetsPlugin(),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'images/index': resolve(__dirname, 'src/images/index.ts'),
        'fonts/index': resolve(__dirname, 'src/fonts/index.ts'),
        'audio/index': resolve(__dirname, 'src/audio/index.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    outDir: 'dist',
    emptyDirOutDir: true,
  },
  base: './',
});
```

### 4.2 tsup 配置（替代方案）

```typescript
// packages/assets/tsup.config.ts
import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

function copyDir(src: string, dest: string) {
  mkdirSync(dest, { recursive: true });
  for (const file of readdirSync(src)) {
    const srcPath = join(src, file);
    const destPath = join(dest, file);
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'images/index': 'src/images/index.ts',
    'fonts/index': 'src/fonts/index.ts',
    'audio/index': 'src/audio/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  onSuccess: async () => {
    // 复制静态资源
    copyDir('src/images/logos', 'dist/images/logos');
    copyDir('src/images/avatars', 'dist/images/avatars');
    copyDir('src/fonts', 'dist/fonts');
    console.log('✅ Assets copied');
  },
});
```

### 4.3 Rollup 配置

```javascript
// rollup.config.js
import copy from 'rollup-plugin-copy';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'esm',
  },
  plugins: [
    typescript(),
    copy({
      targets: [
        { src: 'src/images/**/*', dest: 'dist/images' },
        { src: 'src/fonts/**/*', dest: 'dist/fonts' },
        { src: 'src/audio/**/*', dest: 'dist/audio' },
      ],
      flatten: false,
    }),
  ],
};
```

---

## 引入方式对比

### 5.1 直接 URL 引入

```typescript
// 最简单的方式
import { logo, defaultAvatar } from '@dailyuse/assets/images';

function App() {
  return (
    <div>
      <img src={logo} alt="Logo" />
      <img src={defaultAvatar} alt="Avatar" />
    </div>
  );
}
```

### 5.2 动态导入（按需加载）

```typescript
// 适合大型资源或条件加载
async function loadLogo(variant: 'light' | 'dark') {
  const { logos } = await import('@dailyuse/assets/images');
  return variant === 'dark' ? logos.dark : logos.default;
}
```

### 5.3 CSS 中使用

```css
/* 方式 1：直接在 CSS 中引用 */
.logo {
  background-image: url('@dailyuse/assets/dist/images/logos/logo.svg');
}

/* 方式 2：使用 CSS 变量（需要在 JS 中注入） */
:root {
  --logo-url: var(--injected-logo-url);
}
.logo {
  background-image: var(--logo-url);
}
```

### 5.4 TypeScript 类型声明

```typescript
// packages/assets/src/vite-env.d.ts
/// <reference types="vite/client" />

declare module '*.svg?url' {
  const src: string;
  export default src;
}

declare module '*.svg?raw' {
  const content: string;
  export default content;
}

declare module '*.png?url' {
  const src: string;
  export default src;
}

declare module '*.woff2?url' {
  const src: string;
  export default src;
}
```

---

## Memoflow 项目建议

### 6.1 当前问题

Memoflow 项目的 `@dailyuse/assets` 包存在以下问题：

1. **静态资源未复制到 dist**：使用 `new URL()` 模式但未将原始文件复制到 dist 目录
2. **构建配置不完整**：Vite 配置缺少静态资源复制逻辑
3. **子路径导出可能有问题**：需要确保 exports 配置正确

### 6.2 修复建议

1. **添加资源复制插件**：在 vite.config.ts 中添加 `copyAssetsPlugin`
2. **确保目录结构一致**：src 和 dist 的目录结构应保持一致
3. **验证导出路径**：测试 `@dailyuse/assets/images` 等子路径是否正常工作

### 6.3 推荐的最终配置

```typescript
// packages/assets/vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import dts from 'vite-plugin-dts';

function copyDir(src: string, dest: string) {
  if (!existsSync(src)) {
    console.warn(`⚠️ Source directory not found: ${src}`);
    return;
  }
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = resolve(src, entry.name);
    const destPath = resolve(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

function copyAssetsPlugin() {
  return {
    name: 'copy-assets',
    closeBundle() {
      const assetDirs = [
        ['src/images/logos', 'dist/images/logos'],
        ['src/images/avatars', 'dist/images/avatars'],
        ['src/audio/notifications', 'dist/audio/notifications'],
      ];
      
      for (const [src, dest] of assetDirs) {
        copyDir(
          resolve(__dirname, src),
          resolve(__dirname, dest)
        );
      }
      console.log('✅ Static assets copied to dist');
    },
  };
}

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      outDir: 'dist',
      rollupTypes: false,
    }),
    copyAssetsPlugin(),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'images/index': resolve(__dirname, 'src/images/index.ts'),
        'audio/index': resolve(__dirname, 'src/audio/index.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    outDir: 'dist',
    emptyDirOutDir: true,
  },
  base: './',
});
```

---

## 参考资料

1. **Vite 静态资源处理**
   - [Vite Guide: Static Asset Handling](https://vite.dev/guide/assets.html)
   - `new URL(url, import.meta.url)` 模式是 Vite 推荐的动态资源引用方式

2. **Turborepo 仓库结构**
   - [Turborepo: Structuring a Repository](https://turborepo.com/repo/docs/crafting-your-repository/structuring-a-repository)
   - 推荐使用 `exports` 字段配置子路径导出

3. **pnpm Workspace**
   - [pnpm Workspaces](https://pnpm.io/workspaces)
   - 使用 `workspace:*` 协议引用本地包

4. **npm exports 字段**
   - [Node.js Package Exports](https://nodejs.org/api/packages.html#exports)
   - 支持条件导出（types、import、require）

5. **主流开源项目实践**
   - **Vue**: 使用 monorepo，资源内嵌在各个包中
   - **Vite**: 使用 pnpm workspace，公共资源通过 public 目录
   - **Material UI**: 独立的 icons 包 (@mui/icons-material)
   - **Ant Design**: icons 独立为 @ant-design/icons 包

---

## 结论

对于 Memoflow 这样的多应用 Monorepo 项目，**推荐使用独立静态资源包方案**：

1. 创建 `@dailyuse/assets` 包统一管理所有静态资源
2. 使用 `new URL()` 模式导出资源 URL
3. 配置打包工具将静态文件复制到 dist 目录
4. 使用子路径导出提供按模块引入能力
5. 在消费端（web、desktop）通过包引用使用资源

这种方案提供了最好的：
- **共享性**：所有应用共用同一份资源
- **版本控制**：资源版本与代码版本一致
- **类型安全**：完整的 TypeScript 支持
- **按需加载**：支持 tree-shaking 和动态导入


