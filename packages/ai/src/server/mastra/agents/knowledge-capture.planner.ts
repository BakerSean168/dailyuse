import { Agent } from '@mastra/core/agent';
import type { RequestContext } from '@mastra/core/request-context';
import {
  KnowledgeCaptureDecisionSchema,
  type KnowledgeCaptureWorkflowInput,
  type KnowledgeClarificationState,
  type KnowledgeDraft,
  type KnowledgeCaptureDecision,
} from '@memoflow/contracts/ai';
import type { MastraModelResolver } from '../models/model-resolver';

function stringContext(requestContext: RequestContext, key: string): string | undefined {
  const value = requestContext.getRaw(key);
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export type KnowledgeCapturePlannerMode = 'initial' | 'revise' | 'regenerate';

export interface KnowledgeCapturePlannerRequest {
  readonly input: KnowledgeCaptureWorkflowInput;
  readonly clarification: KnowledgeClarificationState;
  readonly mode: KnowledgeCapturePlannerMode;
  readonly currentDraft?: KnowledgeDraft;
  readonly instruction?: string;
  readonly forceDraft?: boolean;
}

export interface KnowledgeCapturePlannerPort {
  plan(
    request: KnowledgeCapturePlannerRequest,
    requestContext: RequestContext,
  ): Promise<KnowledgeCaptureDecision>;
}

/**
 * Internal Mastra worker for `knowledge.capture`. It can reason and produce a
 * typed Markdown note draft, but it owns no product mutation capability and is
 * never exposed as a user-facing Agent identity. Note writes happen only after
 * explicit workflow approval through the canonical persistence port.
 *
 * Protected Business Invariant 4: the draft's `targetSubpath` is vault-relative
 * only; the worker never sees a Desktop absolute path, so the web cannot leak
 * one back.
 */
export class KnowledgeCapturePlannerWorker implements KnowledgeCapturePlannerPort {
  readonly agent: Agent<'knowledge-capture-planner-worker'>;

  constructor(modelResolver: MastraModelResolver) {
    this.agent = new Agent({
      id: 'knowledge-capture-planner-worker',
      name: 'Knowledge Capture Planner Worker',
      description:
        'Internal structured note planner used only by the knowledge.capture durable workflow.',
      instructions: ({ requestContext }) => {
        const locale = stringContext(requestContext, 'locale');
        const language = locale === 'en-US' ? 'English' : 'Simplified Chinese';
        return [
          'You are an internal MemoFlow knowledge-capture worker. You are not a user-facing assistant.',
          'Return only the requested structured decision. Never claim that any knowledge note has been saved.',
          'You have no write tools. Product mutation occurs only after explicit workflow approval.',
          'Produce a single self-contained Markdown knowledge note: a clear title, a topic, and well-structured Markdown body (headings, lists, code blocks as appropriate).',
          'The targetSubpath must be vault-relative only — never an absolute filesystem path, never a leading slash, never a drive letter.',
          'Ask clarification only when missing information materially blocks a safe, useful note. Ask at most 3 concise questions.',
          'The workflow enforces a maximum of 3 clarification rounds; prefer a concrete draft over cosmetic clarification.',
          stringContext(requestContext, 'source')
            ? 'Ground the note in the provided conversation/source content; never invent authoritative facts it does not support.'
            : '',
          `Write user-visible titles and notes in ${language}.`,
        ]
          .filter(Boolean)
          .join('\n');
      },
      model: async ({ requestContext }) => {
        const identityId = stringContext(requestContext, 'identityId');
        if (!identityId) throw new Error('Knowledge Capture Planner requires authenticated identityId');
        return (
          await modelResolver.resolve({
            identityId,
            providerId: stringContext(requestContext, 'providerId'),
            modelId: stringContext(requestContext, 'modelId'),
          })
        ).model;
      },
    });
  }

  async plan(
    request: KnowledgeCapturePlannerRequest,
    requestContext: RequestContext,
  ): Promise<KnowledgeCaptureDecision> {
    const prompt = [
      'Produce the next knowledge.capture decision from this trusted workflow state.',
      request.forceDraft
        ? 'Clarification budget is exhausted. You MUST return status=draft_ready using the best safe assumptions and record assumptions in warnings.'
        : 'Return needs_clarification only for a material blocker; otherwise return draft_ready.',
      `Mode: ${request.mode}`,
      request.instruction ? `Revision instruction: ${request.instruction}` : '',
      'Workflow input JSON:',
      JSON.stringify(request.input),
      'Clarification history JSON:',
      JSON.stringify(request.clarification),
      'Current draft JSON:',
      JSON.stringify(request.currentDraft ?? null),
      request.mode === 'regenerate'
        ? 'Regenerate the note substantively rather than making only cosmetic edits.'
        : '',
      request.mode === 'revise'
        ? 'Preserve valid parts of the current draft and apply the revision instruction precisely.'
        : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const output = await this.agent.generate(prompt, {
      requestContext,
      structuredOutput: { schema: KnowledgeCaptureDecisionSchema },
    });
    return KnowledgeCaptureDecisionSchema.parse(output.object);
  }
}
