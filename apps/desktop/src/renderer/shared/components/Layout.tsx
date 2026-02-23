/**
 * App Layout with Navigation
 *
 * The main layout component for the authenticated application state.
 * It renders a persistent sidebar navigation and a content area for routed views.
 * Includes the sync status indicator in the header.
 *
 * @module renderer/shared/components/Layout
 */

import { NavLink, Outlet } from 'react-router-dom';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { AccountStatusIndicator } from './AccountStatusIndicator';

/**
 * Navigation item configuration.
 */
const navItems = [
  { path: '/', label: '仪表盘', icon: '📊' },
  { path: '/goals', label: '目标', icon: '🎯' },
  { path: '/tasks', label: '任务', icon: '✅' },
  { path: '/schedule', label: '日程', icon: '📅' },
  { path: '/reminders', label: '提醒', icon: '🔔' },
  { path: '/repository', label: '知识库', icon: '📚' },
  { path: '/governance', label: '治理规则', icon: '🛡️' },
  { path: '/editor', label: '编辑器', icon: '📝' },
  { path: '/ai', label: 'AI 助手', icon: '🤖' },
  { path: '/account', label: '账户', icon: '👤' },
  { path: '/settings', label: '设置', icon: '⚙️' },
];

/**
 * Main application layout component.
 *
 * Structure:
 * - Sidebar: Contains app title, sync status, and navigation links.
 * - Main: Content area rendering the current route via `Outlet`.
 */
export function Layout() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        {/* Header with logo and sync status */}
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">DailyUse</h1>
            <p className="text-xs text-muted-foreground">Desktop App</p>
          </div>
          {/* EPIC-004: Sync Status Indicator */}
          <SyncStatusIndicator />
        </div>

        {/* Navigation */}
        <nav className="p-2 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`
              }
              end={item.path === '/'}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Account Status (bottom of sidebar) */}
        <div className="p-3 border-t">
          <AccountStatusIndicator />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
