import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 675: knowledge note/attachment list-filter dual bodies retired.
 * Both list ops use ListKnowledgeProjectionsSchema only.
 */
describe('knowledge list projections filter dual retired (residual 675)', () => {
  const apiDir = __dirname;
  const noteDto = readFileSync(resolve(apiDir, 'knowledge-note-projection.dto.ts'), 'utf8');
  const attachmentDto = readFileSync(
    resolve(apiDir, 'knowledge-attachment-projection.dto.ts'),
    'utf8',
  );
  const controller = readFileSync(
    resolve(
      apiDir,
      '../../../../../repository/src/server/transport/knowledge-repository-connection.controller.ts',
    ),
    'utf8',
  );

  it('exports a single shared list-knowledge projections filter schema', () => {
    expect(noteDto).toContain('Residual 675');
    expect(noteDto).toContain('export const ListKnowledgeProjectionsSchema');
    expect(noteDto).toContain(
      'export type ListKnowledgeNoteProjectionsReq = z.infer<typeof ListKnowledgeProjectionsSchema>',
    );
    expect(noteDto).not.toMatch(/export const ListKnowledgeNoteProjectionsSchema\b/);
    expect(attachmentDto).toContain('Residual 675');
    expect(attachmentDto).toContain(
      'export type ListKnowledgeAttachmentProjectionsReq = z.infer<\n  typeof ListKnowledgeProjectionsSchema\n>',
    );
    expect(attachmentDto).not.toMatch(/export const ListKnowledgeAttachmentProjectionsSchema\b/);
    expect(attachmentDto).toContain(
      "import { ListKnowledgeProjectionsSchema } from './knowledge-note-projection.dto'",
    );
  });

  it('controller parses shared list filter for notes and attachments', () => {
    expect(controller).toContain('ListKnowledgeProjectionsSchema');
    expect(controller).not.toContain('ListKnowledgeNoteProjectionsSchema');
    expect(controller).not.toContain('ListKnowledgeAttachmentProjectionsSchema');
    const parseHits =
      controller.split('ListKnowledgeProjectionsSchema.safeParse').length - 1;
    expect(parseHits).toBeGreaterThanOrEqual(2);
  });
});
