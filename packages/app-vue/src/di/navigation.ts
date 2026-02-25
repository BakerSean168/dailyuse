/**
 * Default Navigation Configuration
 *
 * 提供所有业务模块的默认导航项。
 * 宿主应用可直接使用或覆盖。
 *
 * @module di/navigation
 */

import type { NavigationItem } from './types';

/**
 * 主导航项（侧边栏上方）——对应已注册路由的所有业务模块。
 */
export const defaultMainNavigation: NavigationItem[] = [
  { path: '/', title: '首页' },
  { path: '/dashboard', title: '仪表盘' },
  { path: '/goals', title: '目标' },
  { path: '/tasks', title: '任务' },
  { path: '/schedule', title: '日程' },
  { path: '/reminders', title: '提醒' },
  { path: '/notifications', title: '通知' },
  { path: '/repositories', title: '知识库' },
  { path: '/governance', title: '治理' },
];

/**
 * 底部导航项（侧边栏下方）——账户与设置。
 */
export const defaultBottomNavigation: NavigationItem[] = [
  { path: '/settings', title: '设置' },
  { path: '/account/center', title: '个人中心' },
];
