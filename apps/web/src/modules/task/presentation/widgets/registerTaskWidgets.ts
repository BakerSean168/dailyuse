/**
 * Task 模块 Widget 注册
 * 
 * 职责：
 * - 注册 Task 模块的所有 Dashboard Widgets
 * - 由 TaskInitializationManager 在模块初始化时调用
 */

import { widgetRegistry } from '@/modules/dashboard/infrastructure/WidgetRegistry';
import { defineAsyncComponent } from 'vue';
import { WidgetSize } from '@dailyuse/contracts/dashboard';

/**
 * 注册 Task 模块的所有 Widgets
 */
export function registerTaskWidgets(): void {
  console.log('[Task] Registering Task widgets...');

  // 今日任务 Widget
  widgetRegistry.registerWidget({
    id: 'today-tasks',
    name: '今日任务',
    description: '展示今日待办任务列表',
    component: defineAsyncComponent(() => import('./TodayTasksWidget.vue')),
    defaultVisible: true,
    defaultOrder: 6,
    defaultSize: WidgetSize.LARGE,
    icon: 'i-heroicons-list-bullet',
    category: 'task',
  });

  console.log('[Task] Task widgets registered successfully');
}

