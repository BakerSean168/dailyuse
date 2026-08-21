import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { describe, expect, it, vi } from 'vitest';
import { useAIKnowledgeCapture } from './useAIKnowledgeCapture';
import type { UseAIKnowledgeCaptureOptions } from './types';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: { 'en-US': { aiAssistant: { errors: { agentRunFailed: 'Failed' } } } },
});

const model = { value: { providerId: 'p', modelId: 'm' } } as UseAIKnowledgeCaptureOptions['selectedModel'];

const run = (overrides: Record<string, unknown> = {}) => ({
  runId: 'run-1',
  conversationId: 'conv-1',
  kind: 'knowledge.capture' as const,
  status: 'running' as const,
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

const draft = {
  revision: 1,
  title: 'Grounding policy',
  topic: 'How answers stay grounded in citations',
  markdown: '# Grounding policy\n\nCite evidence before sounding certain.',
  targetSubpath: 'notes/ai',
  tags: ['ai'],
  duplicateRisk: 'low',
};

function setup(start = run()) {
  const runtime = {
    start: vi.fn().mockResolvedValue(start),
    resume: vi.fn(),
    get: vi.fn(),
    list: vi.fn(),
    cancel: vi.fn(),
  };
  const options = {
    workflowRuntime: runtime,
    selectedModel: model,
    chatConversationId: { value: 'conv-1' },
    chatLoading: { value: false },
    hasWorkflowUserMessages: { value: true },
    buildConversationTranscript: () => 'capture knowledge',
    scrollMessagesToBottom: vi.fn(),
    maybeRenameCurrentConversation: vi.fn(),
    openCreatedNote: vi.fn(),
  } as unknown as UseAIKnowledgeCaptureOptions;
  const Host = defineComponent({
    setup: () => useAIKnowledgeCapture(options),
    render: () => h('div'),
  });
  return {
    vm: mount(Host, { global: { plugins: [i18n] } }).vm as unknown as ReturnType<
      typeof useAIKnowledgeCapture
    >,
    runtime,
    options,
  };
}

describe('useAIKnowledgeCapture', () => {
  it('starts with client-safe knowledge input and no identityId', async () => {
    const { vm, runtime } = setup();
    await vm.startKnowledgeCaptureRun();
    expect(runtime.start).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'knowledge.capture', input: { topic: 'capture knowledge' } }),
    );
    expect(runtime.start.mock.calls[0][0]).not.toHaveProperty('identityId');
  });

  it('projects clarification, review, and recovery stages', async () => {
    const { vm } = setup(
      run({
        status: 'suspended',
        suspension: { type: 'clarification_required', questions: ['Which source?'] },
      }),
    );
    await vm.startKnowledgeCaptureRun();
    expect(vm.knowledgeCaptureStage).toBe('clarification');

    vm.projectRun(
      run({
        status: 'suspended',
        suspension: { type: 'knowledge_draft_review', draft, warnings: [], revision: 1 },
      }),
    );
    expect(vm.knowledgeCaptureStage).toBe('confirm');
    expect(vm.reviewDraft?.title).toBe('Grounding policy');

    vm.projectRun(
      run({
        status: 'suspended',
        suspension: {
          type: 'recovery_required',
          message: 'write failed',
          retryable: true,
          failures: [{ operation: 'knowledge_note', code: 'WRITE_FAILED', message: 'write failed', retryable: true }],
        },
      }),
    );
    expect(vm.knowledgeCaptureStage).toBe('execute');
  });

  it('maps clarification, approval, retry, and cancel to typed commands', async () => {
    const { vm, runtime } = setup(
      run({
        status: 'suspended',
        suspension: { type: 'clarification_required', questions: ['Which source?'] },
      }),
    );
    await vm.startKnowledgeCaptureRun();
    vm.clarificationAnswers = ['the grounding doc'];
    runtime.resume.mockResolvedValue(
      run({
        status: 'suspended',
        suspension: { type: 'knowledge_draft_review', draft, warnings: [], revision: 1 },
      }),
    );
    await vm.submitKnowledgeClarification();
    expect(runtime.resume).toHaveBeenCalledWith({
      runId: 'run-1',
      command: { type: 'answer', answers: ['the grounding doc'] },
    });
    await vm.confirmKnowledgeCaptureRun();
    expect(runtime.resume).toHaveBeenLastCalledWith({
      runId: 'run-1',
      command: { type: 'approve' },
    });
  });

  it('deep-links only completed runs with a noteId', async () => {
    const { vm, runtime, options } = setup(
      run({
        status: 'suspended',
        suspension: { type: 'knowledge_draft_review', draft, warnings: [], revision: 1 },
      }),
    );
    await vm.startKnowledgeCaptureRun();
    runtime.resume.mockResolvedValue(
      run({
        status: 'completed',
        result: {
          workflowRunId: 'run-1',
          revision: 1,
          status: 'success',
          noteId: 'note-1',
          notePath: 'notes/ai/grounding.md',
          noteName: 'grounding.md',
          failures: [],
          retryable: false,
        },
      }),
    );
    await vm.confirmKnowledgeCaptureRun();
    expect(options.openCreatedNote).toHaveBeenCalledWith('note-1');
  });

  it('restores the authoritative session through workflowRuntime.get', async () => {
    const { vm, runtime } = setup();
    runtime.get.mockResolvedValue(
      run({
        status: 'suspended',
        suspension: { type: 'knowledge_draft_review', draft, warnings: [], revision: 1 },
      }),
    );
    await vm.syncKnowledgeCaptureRun('run-1');
    expect(runtime.get).toHaveBeenCalledWith({ runId: 'run-1' });
    expect(vm.knowledgeCaptureStage).toBe('confirm');
  });
});
