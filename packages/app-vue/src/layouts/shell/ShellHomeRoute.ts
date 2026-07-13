/**
 * `/`（STATE A 纯 AI 态）的占位路由组件（UI 重构 V2 §2.1）。
 *
 * V2 中 `<router-view>` 只驱动 BusinessPanel；AI 工作区是壳的常驻层，
 * 不经路由渲染。`/` = "无面板"，因此这个路由组件不渲染任何内容——
 * 保留路由记录本身是为了 name/meta（document.title、desktop entry 判定）
 * 与深链契约不变。
 */
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ShellHomeRoute',
  render: () => null,
});
