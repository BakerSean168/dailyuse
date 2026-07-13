/**
 * Default Navigation Configuration (UI 重构 V2)
 *
 * V2 壳的导航 = WindowHeader 的 5 个模块胶囊（+ 特殊形态的日程胶囊与
 * 侧栏底部设置入口，均在壳内固定）。宿主应用可通过 MODULE_CAPSULES_KEY
 * 覆写胶囊清单。
 *
 * V1 的分组侧栏导航（defaultMainNavigation / defaultBottomNavigation）
 * 已随 MainLayout 在 S1 切换时移除（UI_REDESIGN_V2_PLAN §1.2）。
 *
 * @module di/navigation
 */

import { AlarmClock, Bell, FileText, ListTodo, Target } from 'lucide-vue-next';
import type { ModuleCapsule } from './types';

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
