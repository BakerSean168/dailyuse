import { fail, ok, type Result } from '@dailyuse/contracts/result';
import {
  QueryAnalyticsSchema,
  type QueryAnalyticsReq,
  type QueryAnalyticsRes,
} from '@dailyuse/contracts/ai';
import { formatZodErrors } from '@dailyuse/utils/result';

interface AIAnalyticsQueryControllerService {
  queryAnalytics(identityId: string, request: QueryAnalyticsReq): Promise<QueryAnalyticsRes>;
}

export class AIAnalyticsQueryController {
  constructor(private readonly service: AIAnalyticsQueryControllerService) {}

  async query(input: unknown, identityId: string): Promise<Result<QueryAnalyticsRes>> {
    const parsed = QueryAnalyticsSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return ok(await this.service.queryAnalytics(identityId, parsed.data));
  }
}
