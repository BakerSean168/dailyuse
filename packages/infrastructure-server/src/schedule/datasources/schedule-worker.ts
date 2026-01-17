/**
 * Schedule Worker - Bree 任务执行脚本
 * 
 * 职责：
 * - 在独立的 Worker Thread 中执行调度任务
 * - 接收任务执行上下文
 * - 执行回调逻辑（发送通知、触发业务逻辑）
 * - 记录执行结果
 * 
 * 注意：
 * - 这个文件会在 Worker Thread 中运行
 * - 使用 workerData 接收父进程传递的参数
 * - 通过 parentPort 与父进程通信
 */

import { parentPort, workerData } from 'worker_threads';
import { PrismaClient } from '@prisma/client';
import { GoalApplicationService } from '../../../goal/application/services/GoalApplicationService';
import { NotificationApplicationService } from '../../../notification/application/services/NotificationApplicationService';
import { TaskTemplateApplicationService } from '../../../task/application/services/TaskTemplateApplicationService';
import { ReminderApplicationService } from '../../../reminder/application/services/ReminderApplicationService';
import {
  NotificationType,
  NotificationCategory,
  RelatedEntityType,
} from '@dailyuse/contracts/notification';
import { InitializationManager, InitializationPhase } from '@dailyuse/utils';
import { registerAllInitializationTasks } from '../../../../shared/initialization/initializer';

const prisma = new PrismaClient();

async function initializeApplication() {
  try {
    console.log('Worker: Registering initialization tasks...');
    registerAllInitializationTasks();

    console.log('Worker: Executing initialization tasks...');
    // Corrected: Use getInstance() and executePhase()
    await InitializationManager.getInstance().executePhase(InitializationPhase.APP_STARTUP);
    console.log('Worker: Application initialized successfully.');
  } catch (error) {
    console.error('Worker: Failed to initialize application', error);
    process.exit(1);
  }
}

/**
 * Worker 入口
 */
(async () => {
  await initializeApplication();

  if (!workerData) {
    console.error('No worker data provided.');
    process.exit(1);
  }

  const { job } = workerData;
  const { name, data } = job;

  console.log(`Starting job: ${name}`);

  try {
    switch (name) {
      case 'goal-reminder':
        await executeGoalReminder(data);
        break;
      case 'task-reminder':
        await executeTaskReminder(data);
        break;
      case 'reminder':
        await executeReminder(data);
        break;
      default:
        console.warn(`Unknown job name: ${name}`);
    }
    console.log(`Job ${name} completed successfully.`);
    if (parentPort) {
      parentPort.postMessage('done');
    }
  } catch (error) {
    console.error(`Job ${name} failed:`, error);
    if (parentPort) {
      parentPort.postMessage(error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();

/**
 * 执行 Goal 提醒
 */
async function executeGoalReminder(data: { goalId: string; accountUuid: string }) {
  console.log(`Executing goal reminder for goal ${data.goalId}`);
  const goalService = await GoalApplicationService.getInstance();
  const notificationService = await NotificationApplicationService.getInstance();

  const goal = await goalService.getGoal(data.goalId, { includeChildren: true });

  if (!goal) {
    console.error(`Goal with id ${data.goalId} not found.`);
    return;
  }

  // DTOs don't have methods, use properties instead.
  // Corrected: Use 'overallProgress' instead of 'progress'
  const progress = goal.overallProgress ?? 0;
  const daysRemaining = goal.daysRemaining ?? 0;

  const title = `🎯 Goal Reminder: ${goal.title}`;
  let content = `Your goal is currently at ${progress}% progress.`;

  if (daysRemaining > 0) {
    content += ` You have ${daysRemaining} days left to reach your target. Keep going!`;
  } else {
    content += ` The deadline is today. Let's finish strong!`;
  }
  
  // The 'link' property is not supported. Add it to the content.
  const goalUrl = `dailyuse://goals/${goal.uuid}`;
  content += `\n\nView Goal: ${goalUrl}`;

  await notificationService.createNotification({
    accountUuid: data.accountUuid,
    title,
    content,
    // Corrected: Use enums instead of string literals
    type: NotificationType.INFO,
    category: NotificationCategory.GOAL,
    relatedEntityType: RelatedEntityType.GOAL,
    relatedEntityUuid: goal.uuid,
  });
}

/**
 * 执行 Task 提醒
 */
async function executeTaskReminder(data: { taskId: string; accountUuid: string }) {
  console.log(`Executing task reminder for task ${data.taskId}`);
  const taskService = await TaskTemplateApplicationService.getInstance();
  const notificationService = await NotificationApplicationService.getInstance();

  // Corrected method call: getTaskTemplate
  const task = await taskService.getTaskTemplate(data.taskId);

  if (!task) {
    console.error(`Task with id ${data.taskId} not found.`);
    return;
  }

  const title = `✅ Task Reminder: ${task.title}`;
  let content = `Just a reminder for your task.`;
  if (task.description) {
    content += `\n\nDetails: ${task.description}`;
  }

  // The 'link' property is not supported. Add it to the content.
  const taskUrl = `dailyuse://tasks/${task.uuid}`;
  content += `\n\nView Task: ${taskUrl}`;

  await notificationService.createNotification({
    accountUuid: data.accountUuid,
    title,
    content,
    // Corrected: Use enums instead of string literals
    type: NotificationType.INFO,
    category: NotificationCategory.TASK,
    relatedEntityType: RelatedEntityType.TASK,
    relatedEntityUuid: task.uuid,
  });
}

/**
 * 执行 Reminder
 */
async function executeReminder(data: { reminderId: string; accountUuid: string }) {
  console.log(`Executing reminder for reminder ${data.reminderId}`);
  const reminderService = await ReminderApplicationService.getInstance();
  const notificationService = await NotificationApplicationService.getInstance();

  // Corrected method call: getReminderTemplate
  const reminder = await reminderService.getReminderTemplate(data.reminderId);

  if (!reminder) {
    console.error(`Reminder with id ${data.reminderId} not found.`);
    return;
  }

  const title = `🔔 Reminder: ${reminder.title}`;
  const content = reminder.description || 'This is your scheduled reminder.';

  await notificationService.createNotification({
    accountUuid: data.accountUuid,
    title,
    content,
    // Corrected: Use enums instead of string literals
    type: NotificationType.INFO,
    category: NotificationCategory.REMINDER,
    relatedEntityType: RelatedEntityType.REMINDER,
    relatedEntityUuid: reminder.uuid,
  });
}

async function main() {
  // No implementation needed, main logic is in the IIFE at the end.
}
