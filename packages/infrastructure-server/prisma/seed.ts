import { PrismaClient } from '../src/generated/prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * 数据库种子数据脚本
 * 
 * 最佳实践：
 * - 开发环境：生成完整测试数据，方便开发调试
 * - 生产环境：只创建必要的管理员账户，不运行测试数据
 * 
 * 使用：
 * - 开发：pnpm prisma db seed
 * - 生产：跳过 seed 或使用 --skip-seed 标志
 */

interface CreateAccountParams {
  username: string;
  password: string;
  email: string;
  roles: string[];
  description: string;
}

interface AccountWithTokens {
  account: any;
  refreshToken: string;
  sessionUuid: string;
}

async function main() {
  const isDev = process.env.NODE_ENV !== 'production';
  
  console.log('🌱 开始执行数据库种子脚本...');
  console.log(`📍 环境: ${isDev ? '开发环境' : '生产环境'}`);

  try {
    // 1. 创建开发账户（永久 Session）
    console.log('\n👤 创建开发账户...');
    const devAccount = await createAccountWithSession({
      username: 'dev-admin',
      password: 'dev123456',
      email: 'dev@dailyuse.local',
      roles: ['admin', 'developer'],
      description: '开发环境管理员账户',
    });

    // 2. 创建测试账户
    console.log('\n👤 创建测试账户...');
    const testAccount = await createAccountWithSession({
      username: 'test-user',
      password: 'test123456',
      email: 'test@dailyuse.local',
      roles: ['user'],
      description: 'API 测试账户',
    });

    if (isDev) {
      // 3. 开发环境：创建测试数据
      console.log('\n📊 创建测试数据...');
      await createTestData(devAccount.account.uuid, testAccount.account.uuid);
    }

    // 打印账户信息
    printAccountInfo(devAccount, testAccount);

    console.log('\n🎉 数据库种子脚本执行完成！');
  } catch (error) {
    console.error('❌ 种子脚本执行失败:', error);
    throw error;
  }
}

/**
 * 创建账户并生成永久 Session（30天自动续期）
 */
async function createAccountWithSession(params: CreateAccountParams): Promise<AccountWithTokens> {
  const { username, password, email, roles, description } = params;

  // 检查账户是否已存在
  let account = await prisma.account.findUnique({
    where: { username },
  });

  if (account) {
    console.log(`   ℹ️  账户 "${username}" 已存在，跳过创建`);
  } else {
    // 创建账户
    account = await prisma.account.create({
      data: {
        username,
        email,
        status: 'active',
        emailVerified: true,
        phoneVerified: false,
        roleIds: JSON.stringify(roles),
      },
    });
    console.log(`   ✅ 账户创建成功: ${username}`);
  }

  // 创建认证凭据
  const existingCredential = await prisma.authCredential.findUnique({
    where: { accountUuid: account.uuid },
  });

  if (!existingCredential) {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.authCredential.create({
      data: {
        accountUuid: account.uuid,
        password: hashedPassword,
        salt,
        passwordAlgorithm: 'bcrypt',
        passwordCreatedAt: new Date(),
        isLocked: false,
        failedAttempts: 0,
      },
    });
    console.log(`   ✅ 认证凭据创建成功`);
  }

  // 创建永久 Session（30天，自动续期）
  const refreshToken = crypto.randomBytes(32).toString('hex');
  const sessionUuid = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 天

  const existingSession = await prisma.authSession.findFirst({
    where: { 
      accountUuid: account.uuid,
      revokedAt: null,
    },
  });

  if (!existingSession) {
    await prisma.authSession.create({
      data: {
        uuid: sessionUuid,
        accountUuid: account.uuid,
        refreshToken,
        refreshTokenExpiresAt: expiresAt,
        status: 'ACTIVE',
        ipAddress: '127.0.0.1',
        userAgent: 'Seed Script',
        deviceName: 'Development Machine',
        deviceType: 'desktop',
        osName: 'Windows',
        osVersion: '11',
        browserName: 'Chrome',
        browserVersion: '120',
        lastActivityAt: now,
      },
    });
    console.log(`   ✅ Session 创建成功 (30天有效期，可续期)`);
  }

  return {
    account,
    refreshToken: existingSession?.refreshToken || refreshToken,
    sessionUuid: existingSession?.uuid || sessionUuid,
  };
}

/**
 * 创建测试数据（开发环境）
 */
async function createTestData(devAccountUuid: string, testAccountUuid: string) {
  const now = Date.now();

  // 1. 创建目标 (Goal)
  console.log('   📌 创建测试目标...');
  const goal = await prisma.goal.upsert({
    where: { uuid: 'seed-goal-1' },
    update: {},
    create: {
      uuid: 'seed-goal-1',
      accountUuid: devAccountUuid,
      title: '学习 DDD 架构设计',
      description: '深入理解领域驱动设计',
      importance: 'Important',
      status: 'ACTIVE',
      category: 'learning',
      startDate: BigInt(now),
      targetDate: BigInt(now + 90 * 24 * 60 * 60 * 1000), // 90天后
      createdAt: BigInt(now),
      updatedAt: BigInt(now),
    },
  });

  // 2. 创建任务 (Task)
  console.log('   ✅ 创建测试任务...');
  await prisma.task.upsert({
    where: { uuid: 'seed-task-1' },
    update: {},
    create: {
      uuid: 'seed-task-1',
      accountUuid: devAccountUuid,
      title: '阅读《领域驱动设计》第一章',
      description: '理解 DDD 的核心概念',
      status: 'TODO',
      importance: 'Moderate',
      gtdContext: 'read',
      gtdEnergy: 'high',
      goalUuid: goal.uuid,
      createdAt: BigInt(now),
      updatedAt: BigInt(now),
    },
  });

  // 3. 创建日程 (Schedule)
  console.log('   📅 创建测试日程...');
  await prisma.scheduleEvent.upsert({
    where: { uuid: 'seed-schedule-1' },
    update: {},
    create: {
      uuid: 'seed-schedule-1',
      accountUuid: devAccountUuid,
      title: '团队周会',
      description: '每周一例会',
      startTime: BigInt(now + 3 * 24 * 60 * 60 * 1000), // 3天后
      endTime: BigInt(now + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1小时
      isAllDay: false,
      importance: 'Important',
      category: 'work',
      recurrence: JSON.stringify({
        type: 'WEEKLY',
        interval: 1,
        daysOfWeek: [1], // Monday
      }),
      createdAt: BigInt(now),
      updatedAt: BigInt(now),
    },
  });

  // 4. 创建提醒模板 (Reminder Template)
  console.log('   ⏰ 创建测试提醒...');
  await prisma.reminderTemplate.upsert({
    where: { uuid: 'seed-reminder-1' },
    update: {},
    create: {
      uuid: 'seed-reminder-1',
      accountUuid: devAccountUuid,
      title: '每日站会提醒',
      description: '每天早上 9:30 提醒参加站会',
      type: 'RECURRING',
      selfEnabled: true,
      status: 'ACTIVE',
      importanceLevel: 'Moderate',
      tags: JSON.stringify(['work', 'daily']),
      trigger: JSON.stringify({
        type: 'TIME',
        time: {
          hour: 9,
          minute: 30,
        },
      }),
      recurrence: JSON.stringify({
        type: 'DAILY',
        interval: 1,
      }),
      activeTime: JSON.stringify({
        activatedAt: now,
      }),
      notificationConfig: JSON.stringify({
        channels: ['IN_APP', 'PUSH'],
        title: '每日站会',
        body: '准备参加每日站会',
      }),
      stats: JSON.stringify({
        totalTriggers: 0,
        lastTriggeredAt: null,
      }),
      nextTriggerAt: new Date(now + 24 * 60 * 60 * 1000), // 明天
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // 5. 创建仓储 (Repository)
  console.log('   📚 创建测试仓储...');
  await prisma.repository.upsert({
    where: { uuid: 'seed-repo-1' },
    update: {},
    create: {
      uuid: 'seed-repo-1',
      accountUuid: devAccountUuid,
      name: 'DailyUse 项目文档',
      path: '/projects/dailyuse',
      description: '项目开发文档和笔记',
      status: 'ACTIVE',
      config: JSON.stringify({
        autoSync: true,
        defaultBranch: 'main',
      }),
      stats: JSON.stringify({
        totalFiles: 0,
        totalSize: 0,
      }),
      createdAt: BigInt(now),
      updatedAt: BigInt(now),
    },
  });

  // 6. 创建笔记 (Resource)
  console.log('   📝 创建测试笔记...');
  await prisma.resource.upsert({
    where: { uuid: 'seed-resource-1' },
    update: {},
    create: {
      uuid: 'seed-resource-1',
      accountUuid: devAccountUuid,
      repositoryUuid: 'seed-repo-1',
      title: 'DDD 学习笔记',
      content: '# 领域驱动设计\n\n## 核心概念\n- 实体\n- 值对象\n- 聚合根\n- 领域服务',
      contentType: 'markdown',
      resourceType: 'note',
      status: 'ACTIVE',
      relatedGoals: JSON.stringify(['seed-goal-1']),
      relatedTasks: JSON.stringify(['seed-task-1']),
      metadata: JSON.stringify({
        tags: ['DDD', 'learning'],
      }),
      createdAt: BigInt(now),
      updatedAt: BigInt(now),
    },
  });

  // 7. 创建提醒分组
  console.log('   📁 创建提醒分组...');
  await prisma.reminderGroup.upsert({
    where: { uuid: 'seed-group-1' },
    update: {},
    create: {
      uuid: 'seed-group-1',
      accountUuid: devAccountUuid,
      name: '工作提醒',
      description: '与工作相关的提醒',
      controlMode: 'INDEPENDENT',
      selfEnabled: true,
      color: '#4CAF50',
      icon: '💼',
      order: 0,
      stats: JSON.stringify({
        totalTemplates: 0,
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('   ✅ 测试数据创建完成');
}

/**
 * 打印账户信息
 */
function printAccountInfo(devAccount: AccountWithTokens, testAccount: AccountWithTokens) {
  console.log('\n' + '='.repeat(80));
  console.log('📋 账户信息');
  console.log('='.repeat(80));
  
  console.log('\n👨‍💻 开发账户:');
  console.log(`   用户名: ${devAccount.account.username}`);
  console.log(`   密码: dev123456`);
  console.log(`   邮箱: ${devAccount.account.email}`);
  console.log(`   RefreshToken: ${devAccount.refreshToken}`);
  console.log(`   SessionUUID: ${devAccount.sessionUuid}`);
  
  console.log('\n🧪 测试账户:');
  console.log(`   用户名: ${testAccount.account.username}`);
  console.log(`   密码: test123456`);
  console.log(`   邮箱: ${testAccount.account.email}`);
  console.log(`   RefreshToken: ${testAccount.refreshToken}`);
  console.log(`   SessionUUID: ${testAccount.sessionUuid}`);

  console.log('\n📝 使用方法:');
  console.log('1. 登录获取 AccessToken:');
  console.log('   POST http://localhost:3888/api/v1/auth/login');
  console.log('   Body: { "username": "dev-admin", "password": "dev123456" }');
  console.log('');
  console.log('2. 使用 RefreshToken 刷新:');
  console.log('   POST http://localhost:3888/api/v1/auth/refresh');
  console.log(`   Cookie: refreshToken=${devAccount.refreshToken}`);
  console.log('');
  console.log('3. 访问受保护的 API:');
  console.log('   curl -H "Authorization: Bearer <accessToken>" \\');
  console.log('        http://localhost:3888/api/v1/goals');
  
  console.log('\n' + '='.repeat(80));
}

// 执行种子脚本
main()
  .catch((e) => {
    console.error('❌ 种子脚本执行失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
