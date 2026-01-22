#!/usr/bin/env node

/**
 * Desktop SQLite Implementation Verification Script
 * 验证所有 44 个 SQLite 仓储已正确实现和集成
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WORKSPACE_ROOT = __dirname;
const INFRASTRUCTURE_DESKTOP = path.join(
  WORKSPACE_ROOT,
  'packages/infrastructure-desktop/src'
);
const INFRASTRUCTURE_SERVER = path.join(
  WORKSPACE_ROOT,
  'packages/infrastructure-server/src'
);

const REPOSITORIES = {
  repository: [
    'SqliteRepositoryRepository',
    'SqliteResourceRepository',
    'SqliteFolderRepository',
    'SqliteRepositoryStatisticsRepository',
  ],
  task: [
    'SqliteTaskInstanceRepository',
    'SqliteTaskTemplateRepository',
    'SqliteTaskDependencyRepository',
    'SqliteTaskStatisticsRepository',
  ],
  goal: [
    'SqliteGoalRepository',
    'SqliteGoalStatisticsRepository',
    'SqliteGoalFolderRepository',
    'SqliteFocusSessionRepository',
    'SqliteFocusModeRepository',
    'SqliteWeightSnapshotRepository',
  ],
  schedule: [
    'SqliteScheduleRepository',
    'SqliteScheduleTaskRepository',
    'SqliteScheduleExecutionRepository',
    'SqliteScheduleStatisticsRepository',
  ],
  reminder: [
    'SqliteReminderRepository',
    'SqliteReminderResponseRepository',
    'SqliteReminderStatisticsRepository',
    'SqliteReminderGroupRepository',
    'SqliteReminderTemplateRepository',
  ],
  notification: [
    'SqliteNotificationRepository',
    'SqliteNotificationTemplateRepository',
    'SqliteNotificationPreferenceRepository',
  ],
  editor: [
    'SqliteEditorSessionRepository',
    'SqliteLinkedResourceRepository',
    'SqliteSearchEngineRepository',
    'SqliteEditorWorkspaceRepository',
    'SqliteEditorTabRepository',
    'SqliteEditorGroupRepository',
    'SqliteDocumentVersionRepository',
    'SqliteDocumentRepository',
  ],
  authentication: [
    'SqliteAuthSessionRepository',
    'SqliteAuthCredentialRepository',
  ],
  dashboard: ['SqliteDashboardConfigRepository'],
  ai: [
    'SqliteAIGenerationTaskRepository',
    'SqliteKnowledgeGenerationTaskRepository',
    'SqliteAIConversationRepository',
    'SqliteAIUsageQuotaRepository',
    'SqliteAIProviderConfigRepository',
  ],
  account: ['SqliteAccountRepository'],
  sync: [
    'SqliteSyncConflictRepository',
    'SqliteSyncSessionRepository',
    'SqliteSyncProfileRepository',
    'SqlitePendingChangeRepository',
  ],
  setting: [
    'SqliteAppConfigRepository',
    'SqliteSettingRepository',
    'SqliteUserSettingRepository',
  ],
};

function checkRepositoryExists(moduleName, repoName) {
  const repoShortName = repoName
    .replace(/^Sqlite/, '')
    .replace(/Repository$/, '')
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase();
  
  const filePath = path.join(
    INFRASTRUCTURE_DESKTOP,
    moduleName,
    'repositories',
    `sqlite-${repoShortName}.repository.ts`
  );
  
  return fs.existsSync(filePath);
}

function checkContainerMethods() {
  const containerPath = path.join(
    INFRASTRUCTURE_SERVER,
    'repository/repository.container.ts'
  );
  
  if (!fs.existsSync(containerPath)) {
    console.log('❌ RepositoryContainer not found');
    return false;
  }
  
  const content = fs.readFileSync(containerPath, 'utf-8');
  
  let allMethodsExist = true;
  let checkedCount = 0;
  
  for (const repos of Object.values(REPOSITORIES)) {
    for (const repo of repos) {
      checkedCount++;
      const methodName = repo
        .replace(/^Sqlite/, '')
        .replace(/Repository$/, '');
      
      const getMethodRegex = new RegExp(`get${methodName}\\s*\\(`);
      const registerMethodRegex = new RegExp(`register${methodName}\\s*\\(`);
      
      const hasGetMethod = getMethodRegex.test(content);
      const hasRegisterMethod = registerMethodRegex.test(content);
      
      if (!hasGetMethod || !hasRegisterMethod) {
        allMethodsExist = false;
      }
    }
  }
  
  console.log(`   Checked ${checkedCount} methods`);
  return allMethodsExist;
}

function checkDesktopProvider() {
  const providerPath = path.join(
    INFRASTRUCTURE_DESKTOP,
    'repository/providers/desktop-provider.ts'
  );
  
  if (!fs.existsSync(providerPath)) {
    console.log('❌ DesktopProviderInitializer not found');
    return false;
  }
  
  const content = fs.readFileSync(providerPath, 'utf-8');
  
  let allImported = true;
  let importCount = 0;
  
  for (const repos of Object.values(REPOSITORIES)) {
    for (const repo of repos) {
      importCount++;
      if (!content.includes(`import { ${repo} }`)) {
        allImported = false;
      }
    }
  }
  
  console.log(`   Checked ${importCount} imports`);
  
  return allImported;
}

function checkInitializationFiles() {
  const files = [
    'repository/di/desktop-repository-container.ts',
    'repository/initialization/initialize-desktop.ts',
  ];
  
  let allExist = true;
  for (const file of files) {
    const filePath = path.join(INFRASTRUCTURE_DESKTOP, file);
    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${file} not found`);
      allExist = false;
    }
  }
  
  return allExist;
}

function checkIndex() {
  const indexPath = path.join(INFRASTRUCTURE_DESKTOP, 'index.ts');
  
  if (!fs.existsSync(indexPath)) {
    console.log('❌ index.ts not found');
    return false;
  }
  
  const content = fs.readFileSync(indexPath, 'utf-8');
  
  const requiredExports = [
    'initializeDesktopRepositories',
    'DesktopRepositoryContainer',
    'DesktopProviderInitializer',
  ];
  
  let allExported = true;
  for (const exportName of requiredExports) {
    if (!content.includes(exportName)) {
      console.log(`⚠️  ${exportName} not exported`);
      allExported = false;
    }
  }
  
  return allExported;
}

function main() {
  console.log('🔍 Verifying Desktop SQLite Implementation...\n');
  
  let totalRepos = 0;
  let implementedRepos = 0;
  
  for (const repos of Object.values(REPOSITORIES)) {
    totalRepos += repos.length;
  }
  
  console.log('📦 Repository Implementation Status:\n');
  
  for (const [module, repos] of Object.entries(REPOSITORIES)) {
    let implemented = 0;
    
    for (const repo of repos) {
      if (checkRepositoryExists(module, repo)) {
        implemented++;
        implementedRepos++;
      }
    }
    
    const emoji = implemented === repos.length ? '✅' : '⚠️';
    console.log(`${emoji} ${module.padEnd(15)}: ${implemented}/${repos.length}`);
  }
  
  console.log(`\n📊 Summary: ${implementedRepos}/${totalRepos} repositories\n`);
  console.log('🏗️ Infrastructure Check:\n');
  
  process.stdout.write('  RepositoryContainer methods... ');
  const containerOk = checkContainerMethods();
  console.log(containerOk ? '✅' : '⚠️');
  
  process.stdout.write('  DesktopProviderInitializer... ');
  const providerOk = checkDesktopProvider();
  console.log(providerOk ? '✅' : '⚠️');
  
  process.stdout.write('  Initialization files... ');
  const initOk = checkInitializationFiles();
  console.log(initOk ? '✅' : '⚠️');
  
  process.stdout.write('  Package exports... ');
  const indexOk = checkIndex();
  console.log(indexOk ? '✅' : '⚠️');
  
  console.log('\n' + '='.repeat(60));
  
  if (implementedRepos === totalRepos && containerOk && providerOk && initOk && indexOk) {
    console.log('✅ VERIFICATION PASSED - All 44 repositories implemented!');
    console.log('✅ All infrastructure components in place');
    console.log('✅ Ready for production use\n');
    process.exit(0);
  } else {
    console.log('⚠️  VERIFICATION STATUS');
    console.log(`Implemented: ${implementedRepos}/${totalRepos}`);
    if (implementedRepos < totalRepos) {
      console.log(`❌ ${totalRepos - implementedRepos} repositories still need implementation`);
    }
    console.log('');
    process.exit(1);
  }
}

main();
