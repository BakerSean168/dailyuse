import { fail, type Result } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import {
  CreateKnowledgeNoteSchema,
  type CreateKnowledgeNoteReq,
  type CreateKnowledgeNoteRes,
} from '@dailyuse/contracts/ai';
import { formatZodErrors } from '@dailyuse/utils/result';

interface AIKnowledgeNoteControllerService {
  createKnowledgeNote(request: CreateKnowledgeNoteReq, cx: ExecutionContext): Promise<Result<CreateKnowledgeNoteRes>>;
}

export class AIKnowledgeNoteController {
  constructor(private readonly service: AIKnowledgeNoteControllerService) {}

  async create(input: unknown, cx: ExecutionContext): Promise<Result<CreateKnowledgeNoteRes>> {
    const parsed = CreateKnowledgeNoteSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return this.service.createKnowledgeNote(parsed.data, cx);
  }
}
