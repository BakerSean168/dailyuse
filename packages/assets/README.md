# @dailyuse/assets

共享静态资源库，包含图片、音频、字体等资源文件。

## 📦 特性

- ✅ **类型安全**：TypeScript 导出，支持自动补全
- ✅ **零打包**：Vite 直接处理资源文件
- ✅ **按需加载**：Tree-shaking 友好
- ✅ **跨项目共享**：所有应用统一使用
- ✅ **统一来源**：Web、Desktop 入口图标和共享媒体都从这里导出

## 📂 目录结构

```
src/
├── images/          # 图片资源
│   ├── logos/       # Logo 图标
│   ├── icons/       # UI 图标
│   └── avatars/     # 头像图片
├── audio/           # 音频资源
│   ├── notifications/  # 通知音效
│   └── effects/     # 其他音效
└── index.ts         # 统一导出
```

## 🚀 使用方式

### 导入图片

```typescript
import { logo, logo128 } from '@dailyuse/assets/images';

// 在 Vue 组件中
<template>
  <img :src="logo" alt="DailyUse Logo" />
</template>
```

### 导入音频

```typescript
import { notificationSound } from '@dailyuse/assets/audio';

const audio = new Audio(notificationSound);
audio.play();
```

### 初始化应用图标

```typescript
import { applyDocumentIcons, logo128, logoIco } from '@dailyuse/assets';

applyDocumentIcons({
  faviconHref: logoIco,
  appleTouchIconHref: logo128,
});
```

## 📝 添加新资源

1. 将资源文件放入对应目录
2. 在 `index.ts` 中导出
3. 在消费项目中使用

不要把共享资源放进工作区根 `public/`。该目录已经废弃，不再作为应用运行时资源来源。

## ⚙️ 技术细节

- **不需要构建**：资源由消费项目的 Vite 处理
- **自动优化**：生产构建时自动压缩和 hash
- **开发体验**：支持热更新
