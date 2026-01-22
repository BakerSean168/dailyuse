/**
 * Schedule Worker - Bree 任务执行脚本
 * 
 * 职责�?
 * - 在独立的 Worker Thread 中执行调度任�?
 * - 接收任务执行上下�?
 * - 执行回调逻辑（发送通知、触发业务逻辑�?
 * - 记录执行结果
 * 
 * 注意�?
 * - 这个文件会在 Worker Thread 中运�?
 * - 使用 workerData 接收父进程传递的参数
 * - 通过 parentPort 与父进程通信
 * 
 * 架构注意�?
 * - 为了避免循环依赖，不直接导入应用服务
 * - 改为通过 workerData 传递必需的回调或数据
 * - 父进程负责调用应用层的业务逻辑
 */

import { parentPort, workerData } from 'worker_threads';
import type {  PrismaClient  } from "@prisma/client";
import {
  NotificationType,
  NotificationCategory,
  RelatedEntityType,
} from '@dailyuse/contracts/notification';
import { InitializationManager, InitializationPhase } from '@dailyuse/utils';
import { registerAllInitializationTasks } from '../../shared/initialization/initializer';

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
 * 
 * 注意：实际的 Goal 查询和通知发送由父进程处�?
 */
async function executeGoalReminder(data: { goalId: string; accountUuid: string }) {
  console.log(`Executing goal reminder for goal ${data.goalId}`);
  // 实际的业务逻辑由父进程中的 GoalApplicationService 处理
  // 这里只记录执行信�?
  if (parentPort) {
    parentPort.postMessage({
      type: 'goal-reminder',
      data,
      status: 'executed',
    });
  }
}

/**
 * 执行 Task 提醒
 * 
 * 注意：实际的 Task 查询和通知发送由父进程处�?
 */
async function executeTaskReminder(data: { taskId: string; accountUuid: string }) {
  console.log(`Executing task reminder for task ${data.taskId}`);
  // 实际的业务逻辑由父进程中的 TaskTemplateApplicationService 处理
  // 这里只记录执行信�?
  if (parentPort) {
    parentPort.postMessage({
      type: 'task-reminder',
      data,
      status: 'executed',
    });
  }
}

/**
 * 执行 Reminder
 * 
 * 注意：实际的 Reminder 查询和通知发送由父进程处�?
 */
async function executeReminder(data: { reminderId: string; accountUuid: string }) {
  console.log(`Executing reminder for reminder ${data.reminderId}`);
  // 实际的业务逻辑由父进程中的 ReminderApplicationService 处理
  // 这里只记录执行信�?
  if (parentPort) {
    parentPort.postMessage({
      type: 'reminder',
      data,
      status: 'executed',
    });
  }
}

async function main() {
  // No implementation needed, main logic is in the IIFE at the end.
}
