import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnoseChannelMapping() {
  try {
    console.log('\n🔍 诊断通知渠道映射问题...\n');

    const pref = await prisma.notificationPreference.findFirst({
      where: { identityId: '9897aef0-7fad-4908-a0d1-31e9b22599c1' },
    });

    if (!pref) {
      console.log('❌ 未找到通知偏好设置');
      return;
    }

    console.log('数据库中的原始数据:');
    console.log('channelPreferences (string):', pref.channelPreferences);
    console.log('');

    const channelPreferences = JSON.parse(pref.channelPreferences || '{}');
    console.log('JSON.parse 后的对象:');
    console.log(channelPreferences);
    console.log('');

    console.log('转换为 Map:');
    const channelPrefsMap = new Map(Object.entries(channelPreferences));
    console.log('Map size:', channelPrefsMap.size);
    console.log('Map keys:', Array.from(channelPrefsMap.keys()));
    console.log('Map entries:', Array.from(channelPrefsMap.entries()));
    console.log('');

    console.log('检查各个渠道:');
    const channels = ['IN_APP', 'SSE', 'DESKTOP', 'SOUND', 'in_app', 'sse', 'desktop', 'sound'];

    for (const channel of channels) {
      const pref = channelPrefsMap.get(channel);
      console.log(`  ${channel}:`, pref ? JSON.stringify(pref) : 'undefined');
    }

    console.log('\n✅ 诊断完成\n');
  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseChannelMapping();
