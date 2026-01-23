/**
 * E2E Test Data Seeder
 *
 * Seeds the test database with minimal required data for E2E tests.
 * Run this before E2E tests in CI environment.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding E2E test data...\n');

  // Create test account
  const hashedPassword = await bcrypt.hash('test123', 10);

  const testAccount = await prisma.account.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      username: 'testuser',
      email: 'testuser@example.com',
      profile: JSON.stringify({ displayName: 'Test User' }),
      preferences: JSON.stringify({}),
      storage: JSON.stringify({ used: 0, limit: 1073741824 }), // 1GB
      security: JSON.stringify({ passwordHash: hashedPassword }),
      stats: JSON.stringify({ totalGoals: 0, totalTasks: 0 }),
    },
  });

  console.log('✅ Created test account:', testAccount.username);

  // Create a few sample goals for testing
  const goal1 = await prisma.goal.create({
    data: {
      title: 'Test Goal 1',
      description: 'A test goal for E2E tests',
      accountUuid: testAccount.uuid,
      status: 'active',
      startDate: new Date(),
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  console.log('✅ Created test goal:', goal1.title);

  console.log('\n🎉 E2E test data seeding completed!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
