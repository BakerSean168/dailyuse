/**
 * 测试 TaskTriggeredHandler 完整流程
 * 目标：修复所有错误，确保通知创建成功
 */

import { PrismaClient } from '@prisma/client';
import { NotificationApplicationService } from '../../modules/notification/application/services/NotificationApplicationService';
import { NotificationRepository } from '../../modules/notification/infrastructure/repositories/NotificationRepository';
import { NotificationTemplateRepository } from '../../modules/notification/infrastructure/repositories/NotificationTemplateRepository';
import { NotificationPreferenceRepository } from '../../modules/notification/infrastructure/repositories/NotificationPreferenceRepository';
import type { NotificationServerDTO } from '@dailyuse/contracts/notification';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const TEST_ACCOUNT_ID = '9897aef0-7fad-4908-a0d1-31e9b22599c1';

async function testNotificationCreation() {
  console.log('\n🧪 测试通知创建流程...\n');

  try {
    // 1. 初始化服务
    console.log('1️⃣ 初始化服务...');
    const notificationService = new NotificationApplicationService(
      new NotificationRepository(prisma),
      new NotificationTemplateRepository(prisma),
      new NotificationPreferenceRepository(prisma),
    );
    console.log('   ✅ 服务初始化成功\n');

    // 2. 准备测试数据（模拟 TaskTriggeredHandler 的数据）
    console.log('2️⃣ 准备测试数据...');
    const reminderData = {
      title: '测试提醒标题',
      message: '测试提醒内容',
      priority: 'high',
      notificationSettings: {
        soundEnabled: true,
        soundVolume: 70,
        popupDuration: 10,
        allowSnooze: true,
        snoozeOptions: [5, 10, 15],
      },
    };

    const title = reminderData.title || '提醒';
    const content = reminderData.message || title;

    console.log('   标题:', title);
    console.log('   内容:', content);
    console.log('   ✅ 测试数据准备完成\n');

    // 3. 创建请求对象（完全按照 TaskTriggeredHandler 的方式）
    console.log('3️⃣ 创建请求对象...');
    const request: CreateNotificationRequest = {
      id: uuidv4(),
      identityId: TEST_ACCOUNT_ID,
      title,
      content,
      type: 'schedule_reminder' as NotificationType,
      priority: 'high' as NotificationPriority,
      channels: ['desktop' as NotificationChannel],
      icon: undefined,
      actions: undefined,
      metadata: {
        sourceType: 'reminder',
        sourceId: 'test-reminder-id',
        additionalData: {
          taskId: 'test-task-uuid',
          reminderData,
        },
      },
    };

    console.log('   UUID:', request.id);
    console.log('   Account UUID:', request.identityId);
    console.log('   Type:', request.type);
    console.log('   Priority:', request.priority);
    console.log('   Channels:', request.channels);
    console.log('   Metadata:', JSON.stringify(request.metadata, null, 2));
    console.log('   ✅ 请求对象创建完成\n');

    // 4. 调用服务创建通知
    console.log('4️⃣ 调用服务创建通知...');
    const notification = await notificationService.createNotification(TEST_ACCOUNT_ID, request);

    console.log('   ✅ 通知创建成功！');
    console.log('   通知 UUID:', notification.id);
    console.log('   标题:', notification.title);
    console.log('   内容:', notification.content);
    console.log('   渠道:', notification.channels);
    console.log('   状态:', notification.status);
    console.log('\n✅ 测试通过！所有步骤都成功执行\n');

    // 5. 清理测试数据
    console.log('5️⃣ 清理测试数据...');
    await prisma.notification.delete({
      where: { id: notification.id },
    });
    console.log('   ✅ 测试数据已清理\n');

    return notification;
  } catch (error) {
    console.error('\n❌ 测试失败！\n');
    console.error('错误信息:', error instanceof Error ? error.message : String(error));
    console.error('\n完整堆栈:\n', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行测试
testNotificationCreation()
  .then(() => {
    console.log('🎉 测试完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 测试失败:', error.message);
    process.exit(1);
  });


