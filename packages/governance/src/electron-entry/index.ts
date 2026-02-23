/**
 * Governance Module — Electron Entry Point
 *
 * Provides desktop IPC handlers for governance rule operations.
 *
 * @module governance/electron-entry
 */

import { randomUUID } from 'node:crypto';
import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { createLogger } from '@dailyuse/utils';
import type {
  CreateRuleReq,
  GetRuleReq,
  Language,
  ListRulesQuery,
  ListRulesRes,
  RuleClientDTO,
  SearchRulesQuery,
  SearchRulesRes,
  UpdateRuleReq,
} from '../contracts';

const logger = createLogger('GovernanceElectron');

const Ch = {
  CREATE: 'governance:rule:create',
  GET: 'governance:rule:get',
  UPDATE: 'governance:rule:update',
  DELETE: 'governance:rule:delete',
  LIST: 'governance:rule:list',
  SEARCH: 'governance:rule:search',
} as const;

const channels = Object.values(Ch);

const seedRules: RuleClientDTO[] = [
  {
    id: randomUUID() as RuleClientDTO['id'],
    code: 'DDD-001',
    title: 'Entity Props Pattern',
    description: 'Entities should use a Props Object to avoid long constructor parameter lists.',
    severity: 'Mandatory',
    status: 'Active',
    deprecationReason: null,
    replacementRuleId: null,
    liveReferenceLocation: 'packages/governance/src/domain-server/aggregates/rule.ts',
    tags: [{ value: 'ddd' }, { value: 'entity-props' }],
    goodExamples: [
      {
        id: randomUUID() as RuleClientDTO['goodExamples'][number]['id'],
        language: 'TypeScript',
        content: 'class Rule { private constructor(private readonly props: RuleState) {} }',
        type: 'GoodExample',
        caption: 'Use props object constructor',
      },
    ],
    badExamples: [
      {
        id: randomUUID() as RuleClientDTO['badExamples'][number]['id'],
        language: 'TypeScript',
        content: 'class Rule { constructor(id: string, code: string, title: string, desc: string) {} }',
        type: 'BadExample',
        caption: 'Long positional constructor',
      },
    ],
    authorId: 'system' as RuleClientDTO['authorId'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: randomUUID() as RuleClientDTO['id'],
    code: 'DDD-002',
    title: 'No Logic in DTOs',
    description: 'DTOs should be pure data structures and must not contain business methods.',
    severity: 'Recommended',
    status: 'Active',
    deprecationReason: null,
    replacementRuleId: null,
    liveReferenceLocation: 'packages/contracts/src',
    tags: [{ value: 'contracts' }, { value: 'dto' }, { value: 'ddd' }],
    goodExamples: [
      {
        id: randomUUID() as RuleClientDTO['goodExamples'][number]['id'],
        language: 'TypeScript',
        content: 'export interface RuleClientDTO { id: string; title: string; }',
        type: 'GoodExample',
        caption: 'DTO as data only',
      },
    ],
    badExamples: [
      {
        id: randomUUID() as RuleClientDTO['badExamples'][number]['id'],
        language: 'TypeScript',
        content: 'class RuleDTO { calculateScore() { return 42; } }',
        type: 'BadExample',
        caption: 'Business logic in DTO',
      },
    ],
    authorId: 'system' as RuleClientDTO['authorId'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

let rules = [...seedRules];

function toTagDTO(value: string): RuleClientDTO['tags'][number] {
  return { value };
}

function toLanguage(value: string): Language {
  if (value === 'TypeScript' || value === 'JSON' || value === 'YAML' || value === 'Prisma') {
    return value;
  }
  return 'TypeScript';
}

function toListResult(items: RuleClientDTO[], query?: ListRulesQuery): ListRulesRes {
  const page = query?.page ?? 1;
  const pageSize = query?.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return {
    items: paged,
    total: items.length,
    page,
    pageSize,
  };
}

function filterRules(query?: ListRulesQuery): RuleClientDTO[] {
  return rules.filter((rule) => {
    if (query?.status && rule.status !== query.status) return false;
    if (query?.severity && rule.severity !== query.severity) return false;
    if (query?.tags && query.tags.length > 0) {
      const lowerRuleTags = rule.tags.map((tag) => tag.value.toLowerCase());
      const lowerFilterTags = query.tags.map((tag) => tag.toLowerCase());
      if (!lowerFilterTags.every((tag) => lowerRuleTags.includes(tag))) return false;
    }
    return true;
  });
}

function scoreRule(rule: RuleClientDTO, keyword: string): number {
  const query = keyword.toLowerCase();
  const title = rule.title.toLowerCase();
  const code = rule.code.toLowerCase();
  const description = rule.description.toLowerCase();
  const tags = rule.tags.map((tag) => tag.value.toLowerCase());

  let score = 0;
  if (title === query) score += 100;
  else if (title.includes(query)) score += 70;
  if (code.includes(query)) score += 50;
  if (description.includes(query)) score += 30;
  if (tags.some((tag) => tag.includes(query))) score += 20;
  if (rule.status === 'Active') score += 10;
  if (rule.status === 'Draft') score += 5;
  return score;
}

export const GovernanceElectronModule: IElectronModule = {
  name: 'Governance',

  register(_ctx: IElectronModuleContext): void {
    ipcMain.handle(Ch.LIST, (_event, query?: ListRulesQuery) => {
      const filtered = filterRules(query);
      return toListResult(filtered, query);
    });

    ipcMain.handle(Ch.GET, (_event, req: GetRuleReq) => {
      if (req.id) {
        const found = rules.find((rule) => rule.id === req.id);
        if (!found) throw new Error(`Rule not found: ${req.id}`);
        return found;
      }

      if (req.code) {
        const found = rules.find((rule) => rule.code === req.code);
        if (!found) throw new Error(`Rule not found by code: ${req.code}`);
        return found;
      }

      throw new Error('Either id or code is required');
    });

    ipcMain.handle(Ch.SEARCH, (_event, query: SearchRulesQuery): SearchRulesRes => {
      const startedAt = Date.now();
      const keyword = query.query.trim();
      if (!keyword) {
        return { ...toListResult([], query), searchTime: Date.now() - startedAt };
      }

      const candidates = filterRules(query).filter((rule) => {
        const lowerKeyword = keyword.toLowerCase();
        return (
          rule.title.toLowerCase().includes(lowerKeyword) ||
          rule.code.toLowerCase().includes(lowerKeyword) ||
          rule.description.toLowerCase().includes(lowerKeyword) ||
          rule.tags.some((tag) => tag.value.toLowerCase().includes(lowerKeyword))
        );
      });

      const sorted = candidates
        .map((rule) => ({ rule, score: scoreRule(rule, keyword) }))
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.rule);

      const list = toListResult(sorted, query);
      return {
        ...list,
        searchTime: Date.now() - startedAt,
      };
    });

    ipcMain.handle(Ch.CREATE, (_event, req: CreateRuleReq): RuleClientDTO => {
      const now = Date.now();
      const created: RuleClientDTO = {
        id: randomUUID() as RuleClientDTO['id'],
        code: req.code,
        title: req.title,
        description: req.description,
        severity: req.severity,
        status: 'Draft',
        deprecationReason: null,
        replacementRuleId: null,
        liveReferenceLocation: req.liveReferenceLocation ?? null,
        tags: req.tags.map((tag) => toTagDTO(tag)),
        goodExamples: req.goodExamples.map((snippet) => ({
          id: randomUUID() as RuleClientDTO['goodExamples'][number]['id'],
          language: toLanguage(snippet.language),
          content: snippet.content,
          type: 'GoodExample',
          caption: snippet.caption ?? null,
        })),
        badExamples: req.badExamples.map((snippet) => ({
          id: randomUUID() as RuleClientDTO['badExamples'][number]['id'],
          language: toLanguage(snippet.language),
          content: snippet.content,
          type: 'BadExample',
          caption: snippet.caption ?? null,
        })),
        authorId: 'desktop-user' as RuleClientDTO['authorId'],
        createdAt: now,
        updatedAt: now,
      };

      rules = [created, ...rules];
      return created;
    });

    ipcMain.handle(Ch.UPDATE, (_event, payload: { ruleId: string } & UpdateRuleReq): RuleClientDTO => {
      const index = rules.findIndex((rule) => rule.id === payload.ruleId);
      if (index < 0) throw new Error(`Rule not found: ${payload.ruleId}`);

      const existing = rules[index];
      const updated: RuleClientDTO = {
        ...existing,
        title: payload.title ?? existing.title,
        description: payload.description ?? existing.description,
        tags: payload.tags ? payload.tags.map((tag) => toTagDTO(tag)) : existing.tags,
        liveReferenceLocation:
          payload.liveReferenceLocation !== undefined
            ? payload.liveReferenceLocation
            : existing.liveReferenceLocation,
        updatedAt: Date.now(),
      };

      rules[index] = updated;
      return updated;
    });

    ipcMain.handle(Ch.DELETE, (_event, payload: { id: string }) => {
      const before = rules.length;
      rules = rules.filter((rule) => rule.id !== payload.id);
      return { success: rules.length < before };
    });

    logger.info('Governance module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    logger.info('Governance module destroyed');
  },
};
