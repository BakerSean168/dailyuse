/**
 * Default Navigation Configuration
 *
 * 提供所有业务模块的默认导航项。
 * 宿主应用可直接使用或覆盖。
 *
 * title 字段存储 i18n key（如 'nav.home'），在布局组件中通过 t() 翻译。
 *
 * @module di/navigation
 */

import type { NavigationItem } from './types';

/**
 * 主导航项（侧边栏上方）——对应已注册路由的所有业务模块。
 */
export const defaultMainNavigation: NavigationItem[] = [
  { path: '/', title: 'nav.home' },
  { path: '/dashboard', title: 'nav.dashboard' },
  { path: '/ai/chat', title: 'nav.aiChat' },
  { path: '/goals', title: 'nav.goals' },
  { path: '/tasks', title: 'nav.tasks' },
  { path: '/schedule', title: 'nav.schedule' },
  { path: '/reminders', title: 'nav.reminders' },
  { path: '/notifications', title: 'nav.notifications' },
  { path: '/repository', title: 'nav.repositories' },
  { path: '/governance', title: 'nav.governance' },
];

/**
 * 底部导航项（侧边栏下方）——账户与设置。
 */
export const defaultBottomNavigation: NavigationItem[] = [
  { path: '/settings', title: 'nav.settings' },
  { path: '/account/center', title: 'nav.accountCenter' },
];
