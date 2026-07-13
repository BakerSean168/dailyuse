/**
 * Default Navigation Configuration
 *
 * 提供所有业务模块的默认导航项。
 * 宿主应用可直接使用或覆盖。
 *
 * title / group 字段存储 i18n key（如 'nav.home'、'nav.group.workbench'），
 * 在布局组件中通过 t() 翻译。
 *
 * 信息架构（UI_PAGE_REDESIGN_PLAN §0.2）：
 *   工作台   ◆ 首页(AI)   ◆ 仪表盘
 *   计划     ◆ 目标
 *   执行     ◆ 日程   ◆ 任务   ◆ 提醒
 *   知识     ◆ 笔记   ◆ 规范
 * 通知入口 = 侧栏底部铃铛（NotificationBell）；`/notifications`、
 * `/account/center`、`/ai/chat` 路由保留做深链兼容，但不再出现在导航。
 *
 * @module di/navigation
 */

import {
  AlarmClock,
  Bell,
  BookMarked,
  Calendar,
  FileText,
  LayoutDashboard,
  ListChecks,
  ListTodo,
  NotebookText,
  Settings,
  Sparkles,
  Target,
} from 'lucide-vue-next';
import type { ModuleCapsule, NavigationItem } from './types';

/**
 * 主导航项（侧边栏上方）——按「工作台 / 计划 / 执行 / 知识」分组。
 */
export const defaultMainNavigation: NavigationItem[] = [
  { path: '/', title: 'nav.home', group: 'nav.group.workbench', icon: Sparkles },
  { path: '/dashboard', title: 'nav.dashboard', group: 'nav.group.workbench', icon: LayoutDashboard },
  { path: '/goals', title: 'nav.goals', group: 'nav.group.plan', icon: Target },
  { path: '/schedule', title: 'nav.schedule', group: 'nav.group.execute', icon: Calendar },
  { path: '/tasks', title: 'nav.tasks', group: 'nav.group.execute', icon: ListChecks },
  { path: '/reminders', title: 'nav.reminders', group: 'nav.group.execute', icon: AlarmClock },
  { path: '/repository', title: 'nav.repositories', group: 'nav.group.knowledge', icon: NotebookText },
  { path: '/governance', title: 'nav.governance', group: 'nav.group.knowledge', icon: BookMarked },
];

/**
 * 底部导航项（侧边栏下方）——设置。
 * 账户中心并入设置（Plan §13）；通知入口由侧栏底部铃铛承接（Plan §11）。
 */
export const defaultBottomNavigation: NavigationItem[] = [
  { path: '/settings', title: 'nav.settings', icon: Settings },
];

/**
 * V2 shell module capsules (WindowHeader center).
 *
 * Five business modules surfaced as top-of-window capsules (UI_REDESIGN_V2_PLAN
 * §0 decision #3). Schedule is a special "current time slot" capsule rendered
 * separately (§2.4); Dashboard is retired (→ AI idle state), Governance folds
 * into the Note panel, Settings lives at the sidebar-bottom avatar.
 *
 * `route` is the panel landing route; `badgeSource` is a semantic token the
 * shell resolves to a count (S1 wires notification unread only).
 */
export const defaultModuleCapsules: ModuleCapsule[] = [
  { id: 'goal', title: 'nav.capsule.goal', icon: Target, route: '/goals' },
  { id: 'task', title: 'nav.capsule.task', icon: ListTodo, route: '/tasks' },
  { id: 'note', title: 'nav.capsule.note', icon: FileText, route: '/repository' },
  { id: 'reminder', title: 'nav.capsule.reminder', icon: AlarmClock, route: '/reminders' },
  {
    id: 'notification',
    title: 'nav.capsule.notification',
    icon: Bell,
    route: '/notifications',
    badgeSource: 'notification.unread',
  },
];
