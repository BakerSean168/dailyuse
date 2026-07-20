import { defineComponent, h } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fail, ok } from '@dailyuse/contracts/result';
import type {
  CreateConfirmedKnowledgeNoteReq,
  KnowledgeNoteProjectionClientDTO,
  KnowledgeRepositoryConnectionClientDTO,
} from '@dailyuse/contracts/repository';
import { REPOSITORY_SERVICE_KEY } from '../../../di/keys';
import type { IRepositoryService } from '../../../di/types';
import KnowledgeProjectionWorkspaceView from './KnowledgeProjectionWorkspaceView.vue';

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(async () => undefined),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerMocks.push }),
}));

const messages = {
  common: {
    retry: 'Retry',
    cancel: 'Cancel',
    back: 'Back',
    search: 'Search',
    clear: 'Clear',
  },
  repository: {
    projection: {
      title: 'Knowledge notes',
      connectTitle: 'Connect a repository',
      connectDescription: 'Connect a private GitHub repository.',
      connectAction: 'Open repository settings',
      connectionLabel: 'Repository connection',
      commit: 'Commit {sha}',
      refresh: 'Refresh',
      createAction: 'Create note',
      searchPlaceholder: 'Search notes',
      noSearchResults: 'No search results',
      noNotes: 'No notes',
      readOnly: 'Read only',
      noteViews: 'Knowledge note views',
      previewTab: 'Preview',
      relationsTab: 'Relations',
      selectNote: 'Select a note',
      selectNoteDescription: 'Choose a projected note.',
      createTitle: 'Draft a note',
      createDescription: 'Prepare the complete note before review.',
      confirmTitle: 'Confirm Git commit',
      confirmDescription: 'Review the immutable note payload.',
      noteTitle: 'Title',
      notePath: 'Path',
      noteContent: 'Content',
      noteReason: 'Reason',
      confirmImmutable: 'The reviewed payload will be committed unchanged.',
      reviewAction: 'Review',
      confirmAction: 'Commit note',
      invalidDraft: 'Invalid draft',
      status: {
        Active: 'Connected',
        Suspended: 'Suspended',
        Revoked: 'Revoked',
        Error: 'Error',
        PendingInstall: 'Pending',
        Unknown: 'Unknown',
      },
      indexStatus: {
        pending: 'Pending index',
        indexed: 'Indexed',
        failed: 'Index failed',
      },
    },
  },
};

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: { 'en-US': messages },
});

const PassthroughStub = defineComponent({
  setup(_, { attrs, slots }) {
    return () => h('div', attrs, slots.default?.());
  },
});

const ButtonStub = defineComponent({
  props: ['disabled'],
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          type: 'button',
          disabled: props.disabled,
        },
        slots.default?.(),
      );
  },
});

const InputStub = defineComponent({
  props: ['modelValue', 'id', 'placeholder', 'disabled'],
  emits: ['update:modelValue'],
  setup(props, { attrs, emit }) {
    return () =>
      h('input', {
        ...attrs,
        id: props.id,
        value: props.modelValue ?? '',
        placeholder: props.placeholder,
        disabled: props.disabled,
        onInput: (event: Event) =>
          emit('update:modelValue', (event.target as HTMLInputElement).value),
      });
  },
});

const TextareaStub = defineComponent({
  props: ['modelValue', 'id', 'disabled'],
  emits: ['update:modelValue'],
  setup(props, { attrs, emit }) {
    return () =>
      h('textarea', {
        ...attrs,
        id: props.id,
        value: props.modelValue ?? '',
        disabled: props.disabled,
        onInput: (event: Event) =>
          emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
      });
  },
});

const DialogStub = defineComponent({
  props: ['open'],
  setup(props, { attrs, slots }) {
    return () => (props.open ? h('section', attrs, slots.default?.()) : null);
  },
});

const RelationsStub = defineComponent({
  props: ['projectionId'],
  emits: ['select'],
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          type: 'button',
          'data-testid': 'knowledge-projection-relations-stub',
          onClick: () => emit('select', 'projection-related'),
        },
        String(props.projectionId),
      );
  },
});

function connection(
  overrides: Partial<KnowledgeRepositoryConnectionClientDTO> = {},
): KnowledgeRepositoryConnectionClientDTO {
  return {
    id: 'connection-1',
    identityId: 'IdentityId_11111111-1111-4111-8111-111111111111' as never,
    githubUserId: '42',
    githubRepositoryId: 'repository-1',
    githubRepositoryFullName: 'owner/knowledge',
    installationId: 'installation-1',
    defaultBranch: 'main',
    status: 'Active',
    lastSyncedCommitSha: 'a'.repeat(40),
    lastProjectedCommitSha: 'b'.repeat(40),
    lastErrorCode: null,
    canSync: true,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

function projection(
  overrides: Partial<KnowledgeNoteProjectionClientDTO> = {},
): KnowledgeNoteProjectionClientDTO {
  return {
    id: 'projection-1',
    connectionId: 'connection-1',
    relativePath: 'notes/architecture.md',
    title: 'Architecture',
    commitSha: 'b'.repeat(40),
    blobSha: 'c'.repeat(40),
    contentHash: 'd'.repeat(64),
    frontmatter: {},
    markdownContent: '# Safe\n\n<script>alert(1)</script> **content**',
    indexStatus: 'indexed',
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
    ...overrides,
  };
}

function createService(overrides: Partial<IRepositoryService> = {}): IRepositoryService {
  return {
    listKnowledgeRepositoryConnections: vi.fn(async () => ok({ connections: [connection()] })),
    listKnowledgeNoteProjections: vi.fn(async () => ok({ notes: [projection()] })),
    getKnowledgeNoteProjection: vi.fn(),
    createConfirmedKnowledgeNote: vi.fn(),
    ...overrides,
  } as unknown as IRepositoryService;
}

function mountWorkspace(service: IRepositoryService) {
  return mount(KnowledgeProjectionWorkspaceView, {
    global: {
      plugins: [i18n],
      provide: {
        [REPOSITORY_SERVICE_KEY as symbol]: service,
      },
      stubs: {
        Badge: PassthroughStub,
        Button: ButtonStub,
        Dialog: DialogStub,
        DialogContent: PassthroughStub,
        DialogDescription: PassthroughStub,
        DialogFooter: PassthroughStub,
        DialogHeader: PassthroughStub,
        DialogTitle: PassthroughStub,
        Input: InputStub,
        Label: PassthroughStub,
        Textarea: TextareaStub,
        BookOpen: true,
        CheckCircle: true,
        CloudOff: true,
        FilePlus: true,
        FileText: true,
        GitCommitHorizontal: true,
        Link2: true,
        Loader2: true,
        Network: true,
        RefreshCw: true,
        Search: true,
        X: true,
        KnowledgeProjectionRelationsView: RelationsStub,
      },
    },
  });
}

async function fillDraft(wrapper: ReturnType<typeof mountWorkspace>): Promise<void> {
  await wrapper.get('[data-testid="knowledge-projection-title"]').setValue('New note');
  await wrapper.get('[data-testid="knowledge-projection-path"]').setValue('notes/new-note.md');
  await wrapper
    .get('[data-testid="knowledge-projection-content"]')
    .setValue('# New note\n\nComplete content.');
  await wrapper.get('[data-testid="knowledge-projection-reason"]').setValue('Capture the decision');
}

describe('KnowledgeProjectionWorkspaceView', () => {
  beforeEach(() => {
    routerMocks.push.mockClear();
  });

  it('shows an unconnected state and routes to repository settings', async () => {
    const service = createService({
      listKnowledgeRepositoryConnections: vi.fn(async () => ok({ connections: [] })),
    });
    const wrapper = mountWorkspace(service);
    await flushPromises();

    expect(wrapper.get('[data-testid="knowledge-projection-empty"]').text()).toContain(
      'Connect a repository',
    );
    await wrapper.get('[data-testid="knowledge-projection-connect"]').trigger('click');

    expect(routerMocks.push).toHaveBeenCalledWith({
      path: '/settings',
      query: { tab: 'repository' },
    });
  });

  it('loads a connection once, searches server projections, and renders safe Markdown', async () => {
    const searched = projection({ id: 'projection-2', title: 'Search result' });
    const listKnowledgeNoteProjections = vi.fn(async (request?: { query?: string }) =>
      ok({ notes: request?.query ? [searched] : [projection()] }),
    );
    const service = createService({
      listKnowledgeNoteProjections: listKnowledgeNoteProjections as never,
    });
    const wrapper = mountWorkspace(service);
    await flushPromises();

    expect(listKnowledgeNoteProjections).toHaveBeenCalledOnce();
    expect(wrapper.text()).toContain('Architecture');
    const preview = wrapper.get('[data-testid="knowledge-projection-preview"]');
    expect(preview.html()).toContain('<strong>content</strong>');
    expect(preview.html()).not.toContain('<script>');

    await wrapper.get('[data-testid="knowledge-projection-search"]').setValue('result');
    await wrapper.get('[data-testid="knowledge-projection-search-submit"]').trigger('click');
    await flushPromises();

    expect(listKnowledgeNoteProjections).toHaveBeenLastCalledWith({
      connectionId: 'connection-1',
      query: 'result',
      limit: 100,
    });
    expect(wrapper.text()).toContain('Search result');
  });

  it('switches the selected projection between preview and relation views', async () => {
    const wrapper = mountWorkspace(createService());
    await flushPromises();

    expect(wrapper.get('[data-testid="knowledge-projection-preview"]')).toBeDefined();
    await wrapper.get('[data-testid="knowledge-projection-relations-tab"]').trigger('click');

    expect(wrapper.get('[data-testid="knowledge-projection-relations-stub"]').text()).toBe(
      'projection-1',
    );
    await wrapper.get('[data-testid="knowledge-projection-preview-tab"]').trigger('click');
    expect(wrapper.get('[data-testid="knowledge-projection-preview"]')).toBeDefined();
  });

  it('loads and selects a related projection that is outside the current result page', async () => {
    const related = projection({
      id: 'projection-related',
      relativePath: 'notes/related.md',
      title: 'Related note',
    });
    const getKnowledgeNoteProjection = vi.fn(async () => ok(related));
    const wrapper = mountWorkspace(createService({ getKnowledgeNoteProjection }));
    await flushPromises();

    await wrapper.get('[data-testid="knowledge-projection-relations-tab"]').trigger('click');
    await wrapper.get('[data-testid="knowledge-projection-relations-stub"]').trigger('click');
    await flushPromises();

    expect(getKnowledgeNoteProjection).toHaveBeenCalledWith('projection-related');
    expect(wrapper.get('[data-testid="knowledge-projection-relations-stub"]').text()).toBe(
      'projection-related',
    );
    expect(wrapper.text()).toContain('Related note');
  });

  it('reloads projections for the explicitly selected repository connection', async () => {
    const secondConnection = connection({
      id: 'connection-2',
      githubRepositoryId: 'repository-2',
      githubRepositoryFullName: 'owner/second-knowledge',
    });
    const listKnowledgeNoteProjections = vi.fn(async (request?: { connectionId?: string }) =>
      ok({
        notes: [
          projection({
            id: `projection-${request?.connectionId}`,
            connectionId: request?.connectionId ?? 'connection-1',
            title:
              request?.connectionId === 'connection-2' ? 'Second repository note' : 'Architecture',
          }),
        ],
      }),
    );
    const wrapper = mountWorkspace(
      createService({
        listKnowledgeRepositoryConnections: vi.fn(async () =>
          ok({ connections: [connection(), secondConnection] }),
        ),
        listKnowledgeNoteProjections: listKnowledgeNoteProjections as never,
      }),
    );
    await flushPromises();

    await wrapper
      .get('[data-testid="knowledge-projection-connection-select"]')
      .setValue('connection-2');
    await flushPromises();

    expect(listKnowledgeNoteProjections).toHaveBeenCalledTimes(2);
    expect(listKnowledgeNoteProjections).toHaveBeenLastCalledWith({
      connectionId: 'connection-2',
      query: undefined,
      limit: 100,
    });
    expect(wrapper.text()).toContain('Second repository note');
  });

  it('reviews an immutable draft and submits the confirmed Git request', async () => {
    const created = projection({
      id: 'projection-created',
      relativePath: 'notes/new-note.md',
      title: 'New note',
    });
    const listKnowledgeNoteProjections = vi
      .fn()
      .mockResolvedValueOnce(ok({ notes: [projection()] }))
      .mockResolvedValue(ok({ notes: [created] }));
    const createConfirmedKnowledgeNote = vi.fn(async (request: CreateConfirmedKnowledgeNoteReq) =>
      ok({
        requestId: request.requestId,
        relativePath: request.proposedPath,
        commitSha: 'e'.repeat(40),
        status: 'Committed' as const,
      }),
    );
    const wrapper = mountWorkspace(
      createService({
        listKnowledgeNoteProjections,
        createConfirmedKnowledgeNote,
      }),
    );
    await flushPromises();

    await wrapper.get('[data-testid="knowledge-projection-create"]').trigger('click');
    await fillDraft(wrapper);
    await wrapper.get('[data-testid="knowledge-projection-review"]').trigger('click');
    expect(wrapper.text()).toContain('Confirm Git commit');

    await wrapper.get('[data-testid="knowledge-projection-confirm"]').trigger('click');
    await flushPromises();

    expect(createConfirmedKnowledgeNote).toHaveBeenCalledOnce();
    expect(createConfirmedKnowledgeNote).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionId: 'connection-1',
        proposalId: expect.stringMatching(/^proposal-/),
        revision: 1,
        requestId: expect.stringMatching(/^request-/),
        proposedPath: 'notes/new-note.md',
        title: 'New note',
        content: '# New note\n\nComplete content.',
        reason: 'Capture the decision',
      }),
    );
    expect(wrapper.find('[data-testid="knowledge-projection-create-dialog"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('New note');
  });

  it('does not seed a hidden notes directory in a new proposal', async () => {
    const wrapper = mountWorkspace(createService());
    await flushPromises();

    await wrapper.get('[data-testid="knowledge-projection-create"]').trigger('click');

    expect(
      (wrapper.get('[data-testid="knowledge-projection-path"]').element as HTMLInputElement).value,
    ).toBe('');
    expect(wrapper.get('[data-testid="knowledge-projection-path"]').attributes('placeholder')).toBe(
      'notes/example.md',
    );
  });

  it('reuses the request for retries and revises metadata only after the reviewed payload changes', async () => {
    const createConfirmedKnowledgeNote = vi
      .fn()
      .mockResolvedValueOnce(fail({ code: 'CONFLICT', message: 'Remote HEAD changed' }))
      .mockResolvedValueOnce(fail({ code: 'CONFLICT', message: 'Remote HEAD changed' }))
      .mockImplementationOnce(async (request: CreateConfirmedKnowledgeNoteReq) =>
        ok({
          requestId: request.requestId,
          relativePath: request.proposedPath,
          commitSha: 'f'.repeat(40),
          status: 'Committed' as const,
        }),
      );
    const wrapper = mountWorkspace(createService({ createConfirmedKnowledgeNote }));
    await flushPromises();

    await wrapper.get('[data-testid="knowledge-projection-create"]').trigger('click');
    await fillDraft(wrapper);
    await wrapper.get('[data-testid="knowledge-projection-review"]').trigger('click');
    await wrapper.get('[data-testid="knowledge-projection-confirm"]').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-testid="knowledge-projection-create-error"]').text()).toContain(
      'Remote HEAD changed',
    );

    await wrapper.get('[data-testid="knowledge-projection-confirm"]').trigger('click');
    await flushPromises();
    const first = createConfirmedKnowledgeNote.mock
      .calls[0]?.[0] as CreateConfirmedKnowledgeNoteReq;
    const retry = createConfirmedKnowledgeNote.mock
      .calls[1]?.[0] as CreateConfirmedKnowledgeNoteReq;
    expect(retry.requestId).toBe(first.requestId);
    expect(retry.proposalId).toBe(first.proposalId);
    expect(retry.revision).toBe(1);

    await wrapper.get('[data-testid="knowledge-projection-edit"]').trigger('click');
    await wrapper
      .get('[data-testid="knowledge-projection-content"]')
      .setValue('# New note\n\nRevised content.');
    await wrapper.get('[data-testid="knowledge-projection-review"]').trigger('click');
    await wrapper.get('[data-testid="knowledge-projection-confirm"]').trigger('click');
    await flushPromises();

    const revised = createConfirmedKnowledgeNote.mock
      .calls[2]?.[0] as CreateConfirmedKnowledgeNoteReq;
    expect(revised.proposalId).toBe(first.proposalId);
    expect(revised.revision).toBe(2);
    expect(revised.requestId).not.toBe(first.requestId);
    expect(revised.content).toContain('Revised content.');
  });
});
