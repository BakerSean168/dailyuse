import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 263/290: drop unused contracts *Res identity dual aliases that had no
 * protocol/call-site consumers (canonical *DTO / operation types only).
 */
describe('contracts dead *Res dual single-track surface', () => {
  const goalApi = __dirname;
  const modules = resolve(goalApi, '../..');

  const files: Array<[string, string[]]> = [
    [
      resolve(goalApi, 'goal-review.dto.ts'),
      ['CreateGoalReviewRes', 'UpdateGoalReviewRes', 'GetGoalReviewRes', 'DeleteGoalReviewRes'],
    ],
    [resolve(goalApi, 'goal-record.dto.ts'), ['CreateGoalRecordRes', 'DeleteGoalRecordRes']],
    [resolve(goalApi, 'focus-session.dto.ts'), ['StartFocusRes', 'StopFocusRes']],
    [resolve(goalApi, 'goal-folder.dto.ts'), ['GetGoalFolderRes', 'DeleteGoalFolderRes']],
    [resolve(goalApi, 'key-result.dto.ts'), ['UpdateKeyResultRes', 'UpdateKeyResultProgressRes']],
    [
      resolve(modules, 'ai/api/ai-provider-config.dto.ts'),
      ['RefreshAIProviderModelsRes'],
    ],
    [
      resolve(modules, 'repository/api/knowledge-repository-connection.dto.ts'),
      ['CreateKnowledgeRepositoryConnectionRes'],
    ],
    [
      resolve(modules, 'account/api/account-settings.dto.ts'),
      ['GetAccountSettingsRes'],
    ],
    [
      resolve(modules, 'task/api/task-schedule.dto.ts'),
      ['ToggleTaskCompletionRes'],
    ],
    [
      resolve(modules, 'authentication/api/oauth.dto.ts'),
      ['OAuthAuthorizeRes'],
    ],
    [resolve(modules, 'setting/api/sync.dto.ts'), ['SyncSettingsRes']],
    [
      resolve(modules, 'governance/api/rule-revisions.ts'),
      ['GetRuleRevisionRes'],
    ],
    // residual 290
    [
      resolve(goalApi, 'goal-crud.dto.ts'),
      ['BatchUpdateGoalStatusRes', 'BatchMoveGoalsRes', 'BatchDeleteGoalsRes'],
    ],
    [
      resolve(modules, 'repository/aggregates/local-vault-binding.ts'),
      ['SelectLocalVaultRes'],
    ],
    [
      resolve(modules, 'authentication/api/oauth.dto.ts'),
      ['UnbindOAuthRes'],
    ],
    [
      resolve(modules, 'authentication/api/session.dto.ts'),
      ['LogoutRes'],
    ],
  ];

  it('does not export dead *Res identity dual aliases', () => {
    for (const [file, names] of files) {
      const src = readFileSync(file, 'utf8');
      for (const name of names) {
        expect(src, file).not.toMatch(new RegExp(`export type ${name}\\s*=`));
      }
    }
  });
});
