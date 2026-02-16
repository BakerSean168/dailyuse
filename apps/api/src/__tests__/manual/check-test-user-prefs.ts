import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTestUserPrefs() {
  try {
    const pref = await prisma.notificationPreference.findFirst({
      where: { identityId: '9897aef0-7fad-4908-a0d1-31e9b22599c1' },
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('测试用户通知偏好设置');
    console.log('═══════════════════════════════════════════════════════\n');

    if (!pref) {
      console.log('❌ 未找到通知偏好设置');
      return;
    }

    console.log('UUID:', pref.id);
    console.log('Account UUID:', pref.identityId);
    console.log('\nEnabled Types:');
    console.log(JSON.parse(pref.enabledTypes || '[]'));
    console.log('\nChannel Preferences:');
    console.log(JSON.parse(pref.channelPreferences || '{}'));
    console.log('\n═══════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTestUserPrefs();
