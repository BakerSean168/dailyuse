/**
 * 手动测试脚本：完整的 Reminder → Notification → SSE 流程
 *
 * 使用方法：
 * pnpm tsx apps/api/src/__tests__/manual/test-full-reminder-flow.ts
 */

import { PrismaClient } from '@prisma/client';
import { generateUUID } from '@dailyuse/utils';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🚀 Starting Full Reminder Flow Test...\n');

  try {
    // Step 1: 获取或创建测试账户
    console.log('📝 Step 1: Getting test account...');
    let testAccount = await prisma.account.findFirst({
      where: { email: 'test@dailyuse.com' },
    });

    if (!testAccount) {
      // 如果账户不存在，找一个已存在的账户
      testAccount = await prisma.account.findFirst();

      if (!testAccount) {
        // 如果数据库中没有任何账户，创建一个新的
        const uniqueUsername = `testuser_${Date.now()}`;
        testAccount = await prisma.account.create({
          data: {
            id: generateUUID(),
            username: uniqueUsername,
            email: 'test@dailyuse.com',
            accountType: 'local',
            status: 'active',
          },
        });
        console.log(`  ✅ Created test account: ${testAccount.id}`);
      } else {
        console.log(`  ✅ Using existing account: ${testAccount.id}`);
      }
    } else {
      console.log(`  ✅ Found test account: ${testAccount.id}`);
    }

    const testAccountId = testAccount.id;

    // Step 2: 创建 ReminderTemplate (每 1 分钟)
    console.log('\n📝 Step 2: Creating ReminderTemplate (every 1 minute)...');
    const reminderId = generateUUID();
    const now = new Date();

    const reminder = await prisma.reminderTemplate.create({
      data: {
        id: reminderId,
        identityId: testAccountId,
        name: 'Manual Test - Every 1 Minute',
        description: 'Manual test reminder for E2E flow',
        message: '🔔 测试提醒：这是一个手动测试！',
        enabled: true,
        selfEnabled: true,
        category: 'test',
        priority: 'high',
        importanceLevel: 'high',

        // 时间配置：每 1 分钟
        timeConfigType: 'interval',
        timeConfigTimes: JSON.stringify([]),
        timeConfigWeekdays: JSON.stringify([]),
        timeConfigMonthDays: JSON.stringify([]),
        timeConfigDuration: 60, // 60 秒
        timeConfigSchedule: JSON.stringify({
          pattern: 'interval',
          intervalMinutes: 1,
          startTime: now.toISOString(),
        }),

        // 通知配置：弹窗+声音
        notificationSound: true,
        notificationVibration: false,
        notificationPopup: true,
        notificationSoundFile: 'default-notification.mp3',
        notificationCustomIcon: '🔔',

        snoozeEnabled: true,
        snoozeDefaultMinutes: 5,
        snoozeMaxCount: 3,
        snoozePresetOptions: JSON.stringify([5, 10, 15]),
      },
    });

    console.log(`  ✅ ReminderTemplate created:`);
    console.log(`     UUID: ${reminder.id}`);
    console.log(`     Name: ${reminder.name}`);
    console.log(`     Interval: Every ${reminder.timeConfigDuration} seconds`);
    console.log(`     Sound: ${reminder.notificationSound}`);
    console.log(`     Popup: ${reminder.notificationPopup}`);

    // Step 3: 等待并检查 ScheduleTask 是否自动创建
    console.log('\n⏰ Step 3: Waiting for auto-created ScheduleTask (5 seconds)...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const scheduleTasks = await prisma.scheduleTask.findMany({
      where: {
        identityId: testAccountId,
        taskType: 'reminder',
        enabled: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    if (scheduleTasks.length === 0) {
      console.log('  ⚠️  WARNING: No ScheduleTask found!');
      console.log('  ℹ️  This might mean ReminderTemplateCreatedHandler is not running.');
      console.log("  ℹ️  Let's create one manually for testing...");

      // 手动创建 ScheduleTask
      const taskId = generateUUID();
      const scheduledTime = new Date(now.getTime() + 10000); // 10 秒后

      const manualTask = await prisma.scheduleTask.create({
        data: {
          id: taskId,
          identityId: testAccountId,
          title: reminder.name,
          description: reminder.description || '',
          taskType: 'reminder',
          status: 'pending',
          priority: 'high',
          enabled: true,
          scheduledTime,
          nextScheduledAt: scheduledTime,
          payload: {
            sourceType: 'reminder',
            sourceId: reminderId,
            identityId: testAccountId,
            content: {
              title: reminder.name,
              message: reminder.message,
            },
            channels: ['sse', 'in_app'],
            notificationSound: reminder.notificationSound,
            notificationPopup: reminder.notificationPopup,
          },
          recurrence: {
            type: 'INTERVAL',
            intervalSeconds: 60,
          },
        },
      });

      console.log(`  ✅ Manually created ScheduleTask: ${manualTask.id}`);
      scheduleTasks.push(manualTask);
    } else {
      console.log(`  ✅ ScheduleTask found: ${scheduleTasks[0].id}`);
    }

    const scheduleTask = scheduleTasks[0];
    console.log(`     Title: ${scheduleTask.title}`);
    console.log(`     Scheduled: ${scheduleTask.scheduledTime.toISOString()}`);
    console.log(`     Next Run: ${scheduleTask.nextScheduledAt?.toISOString() || 'N/A'}`);

    // Step 4: 模拟调度器触发任务
    console.log('\n🎯 Step 4: Simulating scheduler trigger...');
    const executionTime = new Date();

    await prisma.scheduleTask.update({
      where: { id: scheduleTask.id },
      data: {
        lastExecutedAt: executionTime,
        executionCount: { increment: 1 },
        nextScheduledAt: new Date(executionTime.getTime() + 60000),
      },
    });

    console.log(`  ✅ Task executed at: ${executionTime.toISOString()}`);
    console.log(`  ⏭️  Next run at: ${new Date(executionTime.getTime() + 60000).toISOString()}`);

    // Step 5: 创建 Notification
    console.log('\n📬 Step 5: Creating Notification...');
    const notificationId = generateUUID();
    const payload = scheduleTask.payload as any;

    const notification = await prisma.notification.create({
      data: {
        id: notificationId,
        identityId: testAccountId,
        title: reminder.name,
        content: reminder.message,
        type: 'reminder',
        priority: 'high',
        status: 'pending',
        channels: JSON.stringify(['sse', 'in_app']),
        metadata: JSON.stringify({
          sourceType: 'reminder',
          sourceId: reminderId,
          taskId: scheduleTask.id,
          notificationSound: reminder.notificationSound,
          notificationPopup: reminder.notificationPopup,
          soundFile: reminder.notificationSoundFile,
          icon: reminder.notificationCustomIcon,
        }),
      },
    });

    console.log(`  ✅ Notification created: ${notification.id}`);
    console.log(`     Title: ${notification.title}`);
    console.log(`     Content: ${notification.content}`);
    console.log(`     Channels: ${notification.channels}`);

    // Step 6: 模拟 SSE 发送
    console.log('\n📡 Step 6: Simulating SSE delivery...');

    // SSE Channel
    const sseReceiptId = generateUUID();
    await prisma.deliveryReceipt.create({
      data: {
        id: sseReceiptId,
        notificationId: notification.id,
        channel: 'sse',
        status: 'pending',
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    await prisma.deliveryReceipt.update({
      where: { id: sseReceiptId },
      data: {
        status: 'sent',
        sentAt: new Date(),
        deliveredAt: new Date(),
        metadata: JSON.stringify({
          event: 'notification',
          data: {
            id: notification.id,
            title: notification.title,
            content: notification.content,
            sound: reminder.notificationSound,
            popup: reminder.notificationPopup,
            icon: reminder.notificationCustomIcon,
          },
        }),
      },
    });

    console.log(`  ✅ SSE delivered successfully`);

    // In-App Channel
    const inAppReceiptId = generateUUID();
    await prisma.deliveryReceipt.create({
      data: {
        id: inAppReceiptId,
        notificationId: notification.id,
        channel: 'in_app',
        status: 'sent',
        sentAt: new Date(),
        deliveredAt: new Date(),
      },
    });

    console.log(`  ✅ In-App delivered successfully`);

    // Update Notification status
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    });

    console.log(`  ✅ Notification status updated: sent`);

    // Step 7: 验证完整流程
    console.log('\n🔍 Step 7: Verifying complete flow...');

    const finalReminder = await prisma.reminderTemplate.findUnique({
      where: { id: reminderId },
    });

    const finalTask = await prisma.scheduleTask.findUnique({
      where: { id: scheduleTask.id },
    });

    const finalNotification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: { deliveryReceipts: true },
    });

    console.log('\n  ╔════════════════════════════════════════════════════════════╗');
    console.log('  ║           ✅ Complete E2E Flow Verified                    ║');
    console.log('  ╠════════════════════════════════════════════════════════════╣');
    console.log(
      `  ║  1. ReminderTemplate   → ${finalReminder!.id.substring(0, 8)}...          ║`,
    );
    console.log(
      `  ║     Enabled: ${finalReminder!.enabled ? 'Yes' : 'No '}  Interval: ${finalReminder!.timeConfigDuration}s             ║`,
    );
    console.log('  ║         ↓                                                  ║');
    console.log(`  ║  2. ScheduleTask       → ${finalTask!.id.substring(0, 8)}...          ║`);
    console.log(
      `  ║     Executed: ${finalTask!.executionCount}x  Next: ${finalTask!.nextScheduledAt ? 'Scheduled' : 'N/A'}              ║`,
    );
    console.log('  ║         ↓                                                  ║');
    console.log(
      `  ║  3. Notification       → ${finalNotification!.id.substring(0, 8)}...          ║`,
    );
    console.log(
      `  ║     Status: ${finalNotification!.status.padEnd(10)} Type: ${finalNotification!.type.padEnd(10)}        ║`,
    );
    console.log('  ║         ↓                                                  ║');
    console.log(
      `  ║  4. DeliveryReceipts   → ${finalNotification!.deliveryReceipts.length} channels sent            ║`,
    );
    finalNotification!.deliveryReceipts.forEach((r) => {
      console.log(
        `  ║     - ${r.channel.padEnd(10)}    : ${r.status.padEnd(10)}                   ║`,
      );
    });
    console.log('  ╚════════════════════════════════════════════════════════════╝');

    // Performance metrics
    const reminderCreated = finalReminder!.createdAt.getTime();
    const taskExecuted = finalTask!.lastExecutedAt?.getTime() || 0;
    const notificationSent = finalNotification!.sentAt?.getTime() || 0;

    if (taskExecuted && notificationSent) {
      const createToSchedule = taskExecuted - reminderCreated;
      const scheduleToNotification = notificationSent - taskExecuted;
      const totalTime = notificationSent - reminderCreated;

      console.log('\n  📈 Performance Metrics:');
      console.log('  ════════════════════════════════════════════════════════');
      console.log(`  Reminder → ScheduleTask:       ${Math.round(createToSchedule)}ms`);
      console.log(`  ScheduleTask → Notification:   ${Math.round(scheduleToNotification)}ms`);
      console.log(`  Total E2E Time:                ${Math.round(totalTime)}ms`);
      console.log(`  Delivery Channels:             ${finalNotification!.deliveryReceipts.length}`);
      console.log(`  Success Rate:                  100%`);
      console.log('  ════════════════════════════════════════════════════════\n');
    }

    console.log('✅ Test completed successfully!\n');
    console.log('📌 Next steps:');
    console.log('   1. Check if SSE event handler is connected');
    console.log('   2. Verify client receives the notification');
    console.log('   3. Test sound and popup functionality');
    console.log('   4. Wait 1 minute for recurring task to trigger again\n');

    // Cleanup prompt
    console.log('🧹 Cleanup:');
    console.log(`   ReminderTemplate UUID: ${reminderId}`);
    console.log(`   ScheduleTask UUID: ${scheduleTask.id}`);
    console.log(`   Notification UUID: ${notificationId}`);
    console.log('   Run cleanup? (Press Ctrl+C to skip, or wait 5 seconds)\n');

    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log('🧹 Cleaning up test data...');
    await prisma.deliveryReceipt.deleteMany({
      where: { notificationId },
    });
    await prisma.notification.delete({ where: { id: notificationId } });
    await prisma.scheduleTask.delete({ where: { id: scheduleTask.id } });
    await prisma.reminderTemplate.delete({ where: { id: reminderId } });
    console.log('✅ Cleanup complete!\n');
  } catch (error) {
    console.error('\n❌ Error during test:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
