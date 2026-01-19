#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define all files to rename with their old and new names
const renameMap = [
  // Infrastructure Client
  { oldPath: 'packages/infrastructure-client/src/account/accountApiClient.ts', newName: 'account-api-client.ts' },
  { oldPath: 'packages/infrastructure-client/src/authentication/authApiClient.ts', newName: 'auth-api-client.ts' },
  { oldPath: 'packages/infrastructure-client/src/goal/goalApiClient.ts', newName: 'goal-api-client.ts' },
  { oldPath: 'packages/infrastructure-client/src/encryption/EncryptionService.ts', newName: 'encryption-service.ts' },
  { oldPath: 'packages/infrastructure-client/src/ai/providers/OpenAIProvider.ts', newName: 'openai-provider.ts' },
  
  // Infrastructure Server - Prisma Repositories
  { oldPath: 'packages/infrastructure-server/src/modules/goal/repositories/PrismaGoalFolderRepository.ts', newName: 'prisma-goal-folder-repository.ts' },
  { oldPath: 'packages/infrastructure-server/src/modules/goal/repositories/PrismaGoalRepository.ts', newName: 'prisma-goal-repository.ts' },
  { oldPath: 'packages/infrastructure-server/src/modules/goal/repositories/PrismaGoalStatisticsRepository.ts', newName: 'prisma-goal-statistics-repository.ts' },
  { oldPath: 'packages/infrastructure-server/src/modules/goal/repositories/PrismaFocusSessionRepository.ts', newName: 'prisma-focus-session-repository.ts' },
  { oldPath: 'packages/infrastructure-server/src/modules/goal/repositories/PrismaFocusModeRepository.ts', newName: 'prisma-focus-mode-repository.ts' },
  
  // Patterns
  { oldPath: 'packages/patterns/src/scheduler/IScheduleTimer.ts', newName: 'schedule-timer.ts' },
  { oldPath: 'packages/patterns/src/scheduler/IScheduleMonitor.ts', newName: 'schedule-monitor.ts' },
  { oldPath: 'packages/patterns/src/scheduler/priority-queue/HeapNode.ts', newName: 'heap-node.ts' },
  { oldPath: 'packages/patterns/src/scheduler/priority-queue/MinHeap.ts', newName: 'min-heap.ts' },
  
  // Domain Client - Schedule
  { oldPath: 'packages/domain-client/src/schedule/aggregates/Schedule.ts', newName: 'schedule.ts' },
  { oldPath: 'packages/domain-client/src/schedule/aggregates/ScheduleTask.ts', newName: 'schedule-task.ts' },
  { oldPath: 'packages/domain-client/src/schedule/value-objects/TaskMetadata.ts', newName: 'task-metadata.ts' },
  { oldPath: 'packages/domain-client/src/schedule/value-objects/RetryPolicy.ts', newName: 'retry-policy.ts' },
  { oldPath: 'packages/domain-client/src/schedule/value-objects/ExecutionInfo.ts', newName: 'execution-info.ts' },
  { oldPath: 'packages/domain-client/src/schedule/value-objects/ScheduleConfig.ts', newName: 'schedule-config.ts' },
];

const projectRoot = process.cwd();

// Helper function to get the full new path
function getNewPath(oldPath, newName) {
  return path.join(path.dirname(oldPath), newName);
}

// Helper function to extract the old filename
function getOldFileName(oldPath) {
  return path.basename(oldPath);
}

// Phase 1: Verify all files exist
console.log('📋 Phase 1: Verifying all files exist...\n');
let verificationFailed = false;
const existingFiles = [];

for (const { oldPath, newName } of renameMap) {
  const fullPath = path.join(projectRoot, oldPath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ Found: ${oldPath}`);
    existingFiles.push({ oldPath, newName });
  } else {
    console.log(`❌ NOT FOUND: ${oldPath}`);
    verificationFailed = true;
  }
}

if (verificationFailed) {
  console.log('\n⚠️  Some files were not found. Check the paths and try again.');
  process.exit(1);
}

console.log(`\n✅ All ${existingFiles.length} files verified!\n`);

// Phase 2: Rename files using git mv
console.log('📁 Phase 2: Renaming files with git mv...\n');

for (const { oldPath, newName } of existingFiles) {
  const newPath = getNewPath(oldPath, newName);
  const oldFileName = getOldFileName(oldPath);
  
  try {
    execSync(`git mv "${oldPath}" "${newPath}"`, { cwd: projectRoot, stdio: 'pipe' });
    console.log(`✅ Renamed: ${oldFileName} → ${newName}`);
  } catch (error) {
    console.error(`❌ Failed to rename: ${oldPath}`);
    console.error(error.message);
    process.exit(1);
  }
}

console.log('\n✅ All files renamed!\n');

// Phase 3: Update imports in all files
console.log('🔗 Phase 3: Updating imports...\n');

const allTsFiles = execSync(
  `find packages apps -type f \\( -name "*.ts" -o -name "*.tsx" \\) ! -name "*.d.ts" ! -name "*.test.ts" ! -name "*.spec.ts"`,
  { cwd: projectRoot, encoding: 'utf-8' }
).split('\n').filter(Boolean);

let importUpdateCount = 0;

for (const { oldPath, newName } of existingFiles) {
  const oldFileName = getOldFileName(oldPath);
  const fileDir = path.dirname(oldPath);
  
  // Create regex patterns to match imports
  const patterns = [
    // Match: from './OldFileName' or from '../OldFileName' etc
    new RegExp(`from\\s+['"]((?:\\.\\./)*\\.?/?[^'"]*)${oldFileName.replace(/\./g, '\\.')}'`, 'g'),
    // Match: from '@dailyuse/package/OldFileName'
    new RegExp(`from\\s+['"]((?:@dailyuse|@?[\\w-]+)(?:/[\\w-]+)*/${oldFileName.replace(/\./g, '\\.')})['"]`, 'g'),
  ];
  
  for (const file of allTsFiles) {
    if (!fs.existsSync(file)) continue;
    
    let content = fs.readFileSync(file, 'utf-8');
    let updated = false;
    
    // Try to replace imports
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, (match) => {
          // Preserve the original structure but replace the filename
          return match.replace(oldFileName, newName);
        });
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(file, content, 'utf-8');
      importUpdateCount++;
      console.log(`✅ Updated imports in: ${file}`);
    }
  }
}

console.log(`\n✅ Updated imports in ${importUpdateCount} files!\n`);

console.log('🎉 Renaming complete!\n');
console.log('📋 Next steps:');
console.log('1. Run: npm run type-check');
console.log('2. Run: npm run lint');
console.log('3. Run: nx run-many --target build');
console.log('4. Run: npm run test\n');
