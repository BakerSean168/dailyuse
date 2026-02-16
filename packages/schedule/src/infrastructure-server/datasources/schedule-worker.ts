/**
 * Schedule Worker - Bree 浠诲姟鎵ц鑴氭湰
 * 
 * 鑱岃矗锟?
 * - 鍦ㄧ嫭绔嬬殑 Worker Thread 涓墽琛岃皟搴︿换锟?
 * - 鎺ユ敹浠诲姟鎵ц涓婁笅锟?
 * - 鎵ц鍥炶皟閫昏緫锛堝彂閫侀€氱煡銆佽Е鍙戜笟鍔￠€昏緫锟?
 * - Record鎵ц缁撴灉
 * 
 * 娉ㄦ剰锟?
 * - 杩欎釜鏂囦欢浼氬湪 Worker Thread 涓繍锟?
 * - 浣跨敤 workerData 鎺ユ敹鐖惰繘绋嬩紶閫掔殑Parameter
 * - 閫氳繃 parentPort 涓庣埗杩涚▼閫氫俊
 * 
 * Architecture notes
 * - To avoid circular dependencies, do not directly import application services
 * - Pass necessary callbacks or data through workerData instead
 * - Parent process is responsible for calling application layer business logic
 */

import { parentPort, workerData } from 'worker_threads';
import type {  PrismaClient  } from "../../../generated/prisma/client";
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
 * Worker 鍏ュ彛
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
 * 鎵ц Goal 鎻愰啋
 * 
 * 娉ㄦ剰锛氬疄闄呯殑 Goal 鏌ヨ鍜岄€氱煡鍙戦€佺敱鐖惰繘绋嬪锟?
 */
async function executeGoalReminder(data: { goalId: string; identityId: string }) {
  console.log(`Executing goal reminder for goal ${data.goalId}`);
  // 瀹為檯鐨勪笟鍔￠€昏緫鐢辩埗杩涚▼涓殑 GoalApplicationService 澶勭悊
  // 杩欓噷鍙褰曟墽琛屼俊锟?
  if (parentPort) {
    parentPort.postMessage({
      type: 'goal-reminder',
      data,
      status: 'executed',
    });
  }
}

/**
 * 鎵ц Task 鎻愰啋
 * 
 * 娉ㄦ剰锛氬疄闄呯殑 Task 鏌ヨ鍜岄€氱煡鍙戦€佺敱鐖惰繘绋嬪锟?
 */
async function executeTaskReminder(data: { taskId: string; identityId: string }) {
  console.log(`Executing task reminder for task ${data.taskId}`);
  // 瀹為檯鐨勪笟鍔￠€昏緫鐢辩埗杩涚▼涓殑 TaskTemplateApplicationService 澶勭悊
  // 杩欓噷鍙褰曟墽琛屼俊锟?
  if (parentPort) {
    parentPort.postMessage({
      type: 'task-reminder',
      data,
      status: 'executed',
    });
  }
}

/**
 * 鎵ц Reminder
 * 
 * 娉ㄦ剰锛氬疄闄呯殑 Reminder 鏌ヨ鍜岄€氱煡鍙戦€佺敱鐖惰繘绋嬪锟?
 */
async function executeReminder(data: { reminderId: string; identityId: string }) {
  console.log(`Executing reminder for reminder ${data.reminderId}`);
  // 瀹為檯鐨勪笟鍔￠€昏緫鐢辩埗杩涚▼涓殑 ReminderApplicationService 澶勭悊
  // 杩欓噷鍙褰曟墽琛屼俊锟?
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
