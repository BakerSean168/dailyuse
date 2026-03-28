import { fail, ok, type Result } from '@dailyuse/contracts/result';
import {
  CreateKnowledgeNoteSchema,
  type CreateKnowledgeNoteReq,
  type CreateKnowledgeNoteRes,
} from '@dailyuse/contracts/ai';
import { formatZodErrors } from '@dailyuse/utils/result';
import { toAIControllerFailure } from './ai-controller-errors';

interface AIKnowledgeNoteControllerService {
  createKnowledgeNote(identityId: string, request: CreateKnowledgeNoteReq): Promise<CreateKnowledgeNoteRes>;
}

export class AIKnowledgeNoteController {
  constructor(private readonly service: AIKnowledgeNoteControllerService) {}

  async create(input: unknown, identityId: string): Promise<Result<CreateKnowledgeNoteRes>> {
    const parsed = CreateKnowledgeNoteSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    try {
      return ok(await this.service.createKnowledgeNote(identityId, parsed.data));
    } catch (error) {
      return toAIControllerFailure(error, 'Knowledge note generation failed');
    }
  }
}
