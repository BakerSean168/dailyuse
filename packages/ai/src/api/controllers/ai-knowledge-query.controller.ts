import { fail, ok, type Result } from '@dailyuse/contracts/result';
import {
  ExpandKnowledgeSchema,
  type ExpandKnowledgeReq,
  type ExpandKnowledgeRes,
  QueryKnowledgeSchema,
  ReindexKnowledgeSchema,
  type QueryKnowledgeReq,
  type QueryKnowledgeRes,
  type ReindexKnowledgeReq,
  type ReindexKnowledgeRes,
} from '@dailyuse/contracts/ai';
import { formatZodErrors } from '@dailyuse/utils/result';

interface AIKnowledgeQueryControllerService {
  expandKnowledge(identityId: string, request: ExpandKnowledgeReq): Promise<ExpandKnowledgeRes>;
  queryKnowledge(identityId: string, request: QueryKnowledgeReq): Promise<QueryKnowledgeRes>;
  reindexKnowledge(identityId: string, request: ReindexKnowledgeReq): Promise<ReindexKnowledgeRes>;
}

export class AIKnowledgeQueryController {
  constructor(private readonly service: AIKnowledgeQueryControllerService) {}

  async query(input: unknown, identityId: string): Promise<Result<QueryKnowledgeRes>> {
    const parsed = QueryKnowledgeSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return ok(await this.service.queryKnowledge(identityId, parsed.data));
  }

  async expand(input: unknown, identityId: string): Promise<Result<ExpandKnowledgeRes>> {
    const parsed = ExpandKnowledgeSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return ok(await this.service.expandKnowledge(identityId, parsed.data));
  }

  async reindex(input: unknown, identityId: string): Promise<Result<ReindexKnowledgeRes>> {
    const parsed = ReindexKnowledgeSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return ok(await this.service.reindexKnowledge(identityId, parsed.data));
  }
}
