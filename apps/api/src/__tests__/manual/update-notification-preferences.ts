/**
 * 更新用户通知偏好设置 - 添加新的通知类型
 *
 * 运行方式：
 * cd apps/api
 * npx tsx src/__tests__/manual/update-notification-preferences.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 开始更新用户通知偏好设置...\n');

  try {
    // 获取所有通知偏好设置
    const preferences = await prisma.notificationPreference.findMany();

    console.log(`📊 找到 ${preferences.length} 个通知偏好设置记录\n`);

    let updatedCount = 0;

    for (const pref of preferences) {
      // enabledTypes 在数据库中是 JSON 字符串
      const enabledTypesRaw = pref.enabledTypes;
      const enabledTypes: string[] =
        typeof enabledTypesRaw === 'string'
          ? JSON.parse(enabledTypesRaw)
          : (enabledTypesRaw as any) || [];

      // 新增的通知类型
      const newTypes = ['schedule_reminder', 'task_reminder', 'goal_milestone', 'custom'];

      // 检查是否需要更新
      const missingTypes = newTypes.filter((type) => !enabledTypes.includes(type));

      if (missingTypes.length > 0) {
        const updatedTypes = [...enabledTypes, ...missingTypes];

        await prisma.notificationPreference.update({
          where: { id: pref.id },
          data: {
            enabledTypes: JSON.stringify(updatedTypes),
            updatedAt: new Date(),
          },
        });

        console.log(`✅ 已更新用户 ${pref.identityId} 的通知偏好:`);
        console.log(`   添加类型: ${missingTypes.join(', ')}`);
        console.log(`   总类型数: ${enabledTypes.length} → ${updatedTypes.length}\n`);

        updatedCount++;
      } else {
        console.log(`⏭️  跳过用户 ${pref.identityId} (已包含所有新类型)\n`);
      }
    }

    console.log('═'.repeat(60));
    console.log(`\n✅ 更新完成！`);
    console.log(`   总记录数: ${preferences.length}`);
    console.log(`   已更新: ${updatedCount}`);
    console.log(`   跳过: ${preferences.length - updatedCount}\n`);

    // 验证更新结果
    console.log('🔍 验证更新结果...\n');

    const verifyPrefs = await prisma.notificationPreference.findMany({
      select: {
        identityId: true,
        enabledTypes: true,
      },
    });

    for (const pref of verifyPrefs) {
      const typesRaw = pref.enabledTypes;
      const types: string[] =
        typeof typesRaw === 'string' ? JSON.parse(typesRaw) : (typesRaw as any) || [];

      const hasAllNewTypes = [
        'schedule_reminder',
        'task_reminder',
        'goal_milestone',
        'custom',
      ].every((type) => types.includes(type));

      if (hasAllNewTypes) {
        console.log(`✅ 用户 ${pref.identityId}: 包含所有新类型 (${types.length} 个类型)`);
      } else {
        console.log(`⚠️  用户 ${pref.identityId}: 缺少某些新类型`);
        console.log(`   当前类型: ${types.join(', ')}`);
      }
    }

    console.log('\n🎉 所有操作完成！\n');
  } catch (error) {
    console.error('\n❌ 更新失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
