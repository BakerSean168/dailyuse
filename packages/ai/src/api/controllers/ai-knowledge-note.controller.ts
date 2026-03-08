import { fail, ok, type Result } from '@dailyuse/contracts/result';
import { CreateKnowledgeNoteSchema, type CreateKnowledgeNoteRes } from '@dailyuse/contracts/ai';
import { formatZodErrors } from '@dailyuse/utils/result';
import type { AIKnowledgeNoteService } from '../../application-server/use-cases/commands/ai-knowledge-note.service';

export class AIKnowledgeNoteController {
  constructor(private readonly service: AIKnowledgeNoteService) {}

  async create(input: unknown, identityId: string): Promise<Result<CreateKnowledgeNoteRes>> {
    const parsed = CreateKnowledgeNoteSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return ok(await this.service.createKnowledgeNote(identityId, parsed.data));
  }
}
