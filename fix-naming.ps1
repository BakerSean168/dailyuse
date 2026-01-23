# 修复所有 Prisma{Entity}Repository 命名为 {Entity}PrismaRepository

$replacementMap = @{
    'PrismaAIConversationRepository' = 'AIConversationPrismaRepository'
    'PrismaAIGenerationTaskRepository' = 'AIGenerationTaskPrismaRepository'
    'PrismaAIProviderConfigRepository' = 'AIProviderConfigPrismaRepository'
    'PrismaAIUsageQuotaRepository' = 'AIUsageQuotaPrismaRepository'
    'PrismaNotificationRepository' = 'NotificationPrismaRepository'
    'PrismaNotificationPreferenceRepository' = 'NotificationPreferencePrismaRepository'
    'PrismaNotificationTemplateRepository' = 'NotificationTemplatePrismaRepository'
    'PrismaUserSettingRepository' = 'UserSettingPrismaRepository'
    'PrismaAppConfigRepository' = 'AppConfigPrismaRepository'
    'PrismaScheduleRepository' = 'SchedulePrismaRepository'
    'PrismaScheduleExecutionRepository' = 'ScheduleExecutionPrismaRepository'
    'PrismaScheduleStatisticsRepository' = 'ScheduleStatisticsPrismaRepository'
    'PrismaScheduleTaskRepository' = 'ScheduleTaskPrismaRepository'
    'PrismaTaskInstanceRepository' = 'TaskInstancePrismaRepository'
    'PrismaTaskTemplateRepository' = 'TaskTemplatePrismaRepository'
    'PrismaTaskDependencyRepository' = 'TaskDependencyPrismaRepository'
    'PrismaTaskStatisticsRepository' = 'TaskStatisticsPrismaRepository'
    'PrismaReminderRepository' = 'ReminderPrismaRepository'
    'PrismaReminderTemplateRepository' = 'ReminderTemplatePrismaRepository'
    'PrismaReminderGroupRepository' = 'ReminderGroupPrismaRepository'
    'PrismaReminderStatisticsRepository' = 'ReminderStatisticsPrismaRepository'
    'PrismaReminderResponseRepository' = 'ReminderResponsePrismaRepository'
    'PrismaGoalRepository' = 'GoalPrismaRepository'
    'PrismaWeightSnapshotRepository' = 'WeightSnapshotPrismaRepository'
    'PrismaFocusModeRepository' = 'FocusModePrismaRepository'
    'PrismaFocusSessionRepository' = 'FocusSessionPrismaRepository'
    'PrismaGoalFolderRepository' = 'GoalFolderPrismaRepository'
    'PrismaGoalStatisticsRepository' = 'GoalStatisticsPrismaRepository'
    'PrismaAccountRepository' = 'AccountPrismaRepository'
    'PrismaAuthCredentialRepository' = 'AuthCredentialPrismaRepository'
    'PrismaAuthSessionRepository' = 'AuthSessionPrismaRepository'
    'PrismaFolderRepository' = 'FolderPrismaRepository'
    'PrismaSyncProfileRepository' = 'SyncProfilePrismaRepository'
    'PrismaSyncSessionRepository' = 'SyncSessionPrismaRepository'
    'PrismaSyncConflictRepository' = 'SyncConflictPrismaRepository'
    'PrismaPendingChangeRepository' = 'PendingChangePrismaRepository'
}

# 要修复的文件
$files = Get-ChildItem -Path "d:\home\projects\dailyuse\packages\infrastructure-server\src" -Recurse -Filter "*.ts" -Exclude "*.d.ts"

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $modified = $false
    
    foreach ($old in $replacementMap.Keys) {
        $new = $replacementMap[$old]
        if ($content -contains $old) {
            $content = $content -replace $old, $new
            $modified = $true
        }
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        Write-Host "✓ Fixed: $($file.Name)"
    }
}

Write-Host "`n完成！" -ForegroundColor Green
