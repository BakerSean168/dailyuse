---
tags:
  - guide
  - development
  - theme
  - css
description: 多主题实现说明，覆盖 CSS 变量、Tailwind token、DOM 同步与系统主题跟随
created: 2026-03-09T00:00:00
updated: 2026-03-09T00:00:00
---

# 多主题实现笔记

本文记录当前项目里多主题是怎么实现的，重点说明：

- 为什么主题切换本质上是 CSS 变量切换
- Tailwind 在这里扮演什么角色
- 为什么还需要 JavaScript 去同步 DOM 状态
- `light` / `dark` / `auto` 三种模式各自怎么工作

适用代码位置：

- `packages/ui-core/src/styles/theme.css`
- `packages/ui-core/src/styles/globals.css`
- `packages/app-vue/src/modules/setting/composables/useThemeSync.ts`
- `packages/app-vue/src/modules/setting/components/AppearanceSettings.vue`
- `packages/app-vue/src/modules/setting/views/UserSettingsView.vue`
- `apps/web/src/App.vue`
- `apps/desktop/src/renderer/App.vue`

## 1. 先说结论：这套主题实现的核心不是“切换一堆 class”，而是“切换一组设计令牌”

很多人第一次做主题时，会直接写两套样式：

```css
.card-light {
  background: white;
  color: black;
}

.card-dark {
  background: #111;
  color: white;
}
```

这种写法的问题是：

- 组件越多，重复越多
- 每个组件都要知道自己在 light 还是 dark
- 后续再加第三套主题时，样式会爆炸

所以更稳的方式是：

1. 先定义抽象语义变量，比如 `--background`、`--foreground`、`--primary`
2. 组件永远只使用这些语义变量
3. 切换主题时，只改变量值，不改组件本身

也就是说，组件不关心“现在是不是深色”，组件只关心“背景色是多少、文字色是多少、主色是多少”。

## 2. 这里真正用到的是原生 CSS 能力

这套方案最底层依赖的是原生 CSS，不是某个框架私有能力。基础知识主要有四块。

### 2.1 CSS 自定义属性（CSS Variables）

也就是：

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
}
```

然后在别处使用：

```css
body {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

这里的关键点：

- `--background` 不是具体组件变量，而是全局语义变量
- `var(--background)` 是原生 CSS 语法
- 变量具备继承能力，所以放在 `:root` 或 `html` 上，全局都能读到

### 2.2 CSS 作用域与层叠

项目里在 `packages/ui-core/src/styles/theme.css` 里定义了：

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
}

.dark {
  --background: 240 10% 8%;
  --foreground: 0 0% 98%;
}
```

这代表：

- 默认情况下，全局使用 `:root` 的变量值
- 当某个祖先节点上存在 `.dark` 时，`.dark` 作用域下的变量会覆盖默认值

如果我们把 `.dark` 挂在 `html` 节点上，那么整棵文档树就都会使用深色变量。

### 2.3 `data-*` 属性

项目里除了 `.dark`，还会同步写入：

```html
<html data-theme="dark"></html>
```

这也是原生浏览器能力。它的作用主要有两个：

- 让样式和调试更直观
- 兼容仓库里已有的这类选择器：

```css
[data-theme='dark'] .template-card.priority-high {
  /* dark-specific styles */
}
```

所以当前实现是“双通道”同步：

- `.dark` 负责 Tailwind / token 变量覆盖
- `data-theme` 负责兼容已有属性选择器样式

### 2.4 `prefers-color-scheme`

`auto` 主题依赖系统级媒体查询：

```css
@media (prefers-color-scheme: dark) {
  /* system dark */
}
```

在 JavaScript 里对应是：

```ts
window.matchMedia('(prefers-color-scheme: dark)').matches;
```

它让应用知道“当前操作系统偏好深色还是浅色”。

## 3. Tailwind 在这里做的不是“主题逻辑”，而是“消费主题令牌”

这点很重要。

项目里的主题逻辑并不是 Tailwind 决定的，Tailwind 主要做两件事：

1. 把设计令牌映射成可用的工具类
2. 让组件可以写成 `bg-background`、`text-foreground` 这种统一语义形式

在 `packages/ui-core/src/styles/theme.css` 里，有这段映射：

```css
@theme {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-primary: hsl(var(--primary));
  --color-card: hsl(var(--card));
}
```

这表示：

- 底层语义变量是 `--background`、`--foreground`、`--primary`
- Tailwind token 层把它们暴露成 `--color-background`、`--color-foreground` 等
- 于是业务组件里可以直接写 `bg-background`、`text-foreground`

例如：

```vue
<div class="bg-background text-foreground">
  ...
</div>
```

当 `.dark` 切换后，`--background` 变了，`bg-background` 的实际颜色也就跟着变了。

所以 Tailwind 不是主题状态管理器，它更像“语义 token 的消费层”。

## 4. 为什么明明用了 CSS，还需要 JavaScript

因为 CSS 只负责“如何渲染”，不负责“主题状态从哪里来”。

应用里还有这些真实需求：

- 用户在设置页选中 `light` / `dark` / `auto`
- 这个值要进入 store
- 这个值要保存到后端设置
- 刷新页面后还要恢复
- `auto` 时系统主题变化要实时响应

这些都不是纯 CSS 能解决的，所以需要 JavaScript 桥接。

当前桥接逻辑在：

- `packages/app-vue/src/modules/setting/composables/useThemeSync.ts`

它干了三件事：

### 4.1 从 store 读取主题设置

```ts
store.getValue('appearance.theme');
```

也就是读取用户设置里的真实字段，而不是 UI 临时字段。

### 4.2 把主题状态同步到 DOM

核心方法是 `applyThemeMode()`，它会：

```ts
root.classList.toggle('dark', resolvedTheme === 'dark');
root.dataset.theme = resolvedTheme;
root.style.colorScheme = resolvedTheme;
```

这里分别对应：

- `classList.toggle('dark')`：切换 Tailwind / token 变量作用域
- `data-theme`：兼容已有属性选择器样式
- `color-scheme`：让浏览器内建控件也更贴近当前主题

### 4.3 处理 `auto` 模式

当主题设置是 `auto` 时，代码会：

```ts
window.matchMedia('(prefers-color-scheme: dark)');
```

然后：

- 系统是深色，就解析成 `dark`
- 系统是浅色，就解析成 `light`

并且监听系统变化：

```ts
mediaQuery.addEventListener('change', handleSystemThemeChange);
```

这样当用户系统从浅色切到深色时，应用会跟着切。

## 5. 当前项目的主题切换链路

完整链路可以理解为：

```text
设置页选择主题
  -> 更新本地 appearance.theme
  -> applyThemeMode(theme) 立即作用到 html
  -> updateCategory('appearance', { theme }) 持久化到用户设置
  -> store 更新后，useThemeSync 继续作为全局同步器维持状态
  -> Tailwind token 和原生 CSS 变量一起生效
```

拆开看是下面几层。

### 5.1 设置 UI 层

在 `packages/app-vue/src/modules/setting/components/AppearanceSettings.vue`：

- 用户选择 `theme`
- 可选值是 `light`、`dark`、`auto`

这一层只负责收集用户输入。

### 5.2 页面状态层

在 `packages/app-vue/src/modules/setting/views/UserSettingsView.vue`：

- `appearance` 本地状态和 schema 对齐
- 监听 `appearance.theme`
- 变化后先立即调用 `applyThemeMode(theme)`
- 再调用 `updateCategory('appearance', { theme })`

这个顺序很重要，因为它保证：

- 视觉反馈立即发生
- 网络请求慢一点也不影响用户感知

### 5.3 全局根组件层

在这两个入口根组件里：

- `apps/web/src/App.vue`
- `apps/desktop/src/renderer/App.vue`

调用了 `useThemeSync()`。

它的意义是：

- 刷新页面时根据 store 中已有主题恢复 DOM
- 不是只有设置页里改主题才有效
- web 和 desktop 共享同一套主题同步规则

### 5.4 样式令牌层

在 `packages/ui-core/src/styles/theme.css`：

- `:root` 定义浅色变量
- `.dark` 覆盖深色变量
- `@theme` 映射成 Tailwind 可用 token

组件层就不需要知道主题判断逻辑了，只用消费语义颜色。

## 6. 为什么当前只保留 `light` / `dark` / `auto`

因为这是当前真正实现闭环的主题集合。

之前设置页里有：

- `darkBlue`
- `warmPaper`
- `lightBlue`
- `blueGreen`

但如果只在下拉选项里有这些值，而没有同时提供：

- 对应 schema 枚举
- 对应 CSS token 集
- 对应 DOM 标识或变量覆盖规则

那这些主题就只是“看起来能选”，实际上没有真正落地。

所以当前实现先收敛到三种稳定模式：

- `light`
- `dark`
- `auto`

这是一种很典型的工程策略：先让主题系统闭环，再扩展主题种类。

## 7. 如果以后要支持真正的“多主题”，应该怎么扩展

现在的实现已经具备多主题架构雏形，只是目前只落地了两套主变量。

如果未来要支持真正的多主题，比如：

- `light`
- `dark`
- `warm-paper`
- `dark-blue`
- `linear-midnight`

推荐方式不是堆更多 `if/else`，而是建立主题命名和 token 规范。

### 7.1 扩展思路一：用 `data-theme` 区分主题名

例如：

```css
:root,
[data-theme='light'] {
  --background: 0 0% 100%;
}

[data-theme='dark'] {
  --background: 240 10% 8%;
}

[data-theme='warm-paper'] {
  --background: 35 30% 94%;
}

[data-theme='dark-blue'] {
  --background: 222 45% 10%;
}
```

然后 JavaScript 只做一件事：

```ts
root.dataset.theme = themeName;
```

如果还希望兼容 Tailwind 的 `dark:` 变体，那么可以约定：

- 深色系主题统一额外挂 `.dark`
- 浅色系主题不挂 `.dark`

### 7.2 扩展思路二：主题对象配置化

也可以把主题元信息抽出来，例如：

```ts
const THEME_META = {
  light: { resolvedMode: 'light' },
  dark: { resolvedMode: 'dark' },
  'warm-paper': { resolvedMode: 'light' },
  'dark-blue': { resolvedMode: 'dark' },
} as const;
```

这样 `applyThemeMode()` 就不只是看名字，而是根据主题元信息决定：

- 是否加 `.dark`
- `color-scheme` 是 `light` 还是 `dark`
- `data-theme` 写什么值

### 7.3 扩展思路三：语义 token 不变，主题只改 token 值

这是最关键的原则。

不要在组件里写：

```css
.warm-paper-card {
}
.dark-blue-card {
}
```

而应该始终让组件只依赖：

- `background`
- `foreground`
- `card`
- `primary`
- `muted`
- `border`

新增主题时，只新增变量值，不新增组件分支。

## 8. 这套实现依赖的前端基础知识清单

如果你想把这个主题系统彻底吃透，建议把下面这些知识点连起来看。

### CSS 基础

- CSS 自定义属性 `--token`
- `var()` 的用法
- HSL / HSLA 色彩表示
- 作用域、继承、层叠、覆盖顺序
- 类选择器 `.dark`
- 属性选择器 `[data-theme='dark']`
- 媒体查询 `prefers-color-scheme`
- `color-scheme` 对原生控件的影响

### DOM / 浏览器基础

- `document.documentElement`
- `element.classList.toggle()`
- `dataset` 的读写
- `window.matchMedia()`
- 媒体查询变化事件监听

### Vue 基础

- `ref()` 管理响应式状态
- `watch()` 监听状态变化
- composable 的职责拆分
- 根组件里挂全局同步器的思路

### 工程化基础

- 设计令牌（Design Tokens）
- 语义颜色命名
- 组件与主题解耦
- 设置持久化与即时 UI 反馈分离

## 9. 当前实现的优点

### 9.1 优点一：主题状态和样式消费解耦

JavaScript 只负责“当前应该是什么主题”，CSS 只负责“主题应该长什么样”。

### 9.2 优点二：切换成本低

切主题时没有重渲染整棵组件树，只是改了 `html` 上的状态和变量值，浏览器会自己重算样式。

### 9.3 优点三：Web 和 Desktop 共用

只要宿主都是浏览器渲染环境，这套机制就可以共享。

### 9.4 优点四：适合继续扩展

未来加第三套、第四套主题，不需要推翻架构，只需要补 token 和主题元数据。

## 10. 当前实现的边界

也要注意，这还不是完整“主题平台”，而是一个稳定的主题基础设施。

目前已经实现：

- light / dark / auto
- store -> DOM 同步
- system theme follow
- Tailwind token 消费
- 兼容已有 `data-theme` 选择器

目前还没有系统化实现：

- 多套品牌主题 token 文件
- 主题元信息注册表
- 主题切换动画
- 首屏无闪烁的 SSR / preload 提前注入策略
- 主题级别的插画、阴影、圆角、字体成组变换

## 11. 一句话记忆

可以把当前多主题实现记成一句话：

> 用 JavaScript 把用户主题设置同步到 `html`，再用原生 CSS 变量和 Tailwind 语义 token 驱动整站视觉变化。

## 12. 后续可演进方向

如果后面继续做主题系统，建议按这个顺序演进：

1. 先把 `data-theme='theme-name'` 作为唯一主题标识规范化
2. 抽出 `THEME_META` 配置，区分浅色系 / 深色系主题
3. 为每个主题建立完整 token 集，而不是只改主色
4. 补主题切换测试，验证 `.dark`、`data-theme`、`color-scheme` 一致性
5. 如需首屏无闪烁，再考虑在应用启动前预注入主题状态

---

如果只从工程视角看，这套实现最核心的三个关键词是：

- 语义化 token
- DOM 主题同步
- CSS 变量覆盖

把这三件事理解透了，多主题系统基本就通了。
