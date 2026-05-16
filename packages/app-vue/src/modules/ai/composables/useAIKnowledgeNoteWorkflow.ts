import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import type { Ref } from 'vue';
import type { AIChatService, ChatItem, ChatModelOption, NoteSummary } from './types';
import { getAIErrorMessage } from './error';

export interface UseAIKnowledgeNoteWorkflowOptions {
  service: Pick<AIChatService, 'createKnowledgeNote'>;
  selectedModel: Ref<ChatModelOption | null>;
  chatTimeline: Ref<ChatItem[]>;
  conversationTitle: Ref<string>;
  hasWorkflowMessages: Ref<boolean>;
  knowledgeNoteSubpath: Ref<string>;
  scrollMessagesToBottom: () => void;
  maybeRenameCurrentConversation: (name: string) => Promise<void>;
  fetchResources: () => Promise<void>;
  resources: Ref<Array<{ id: string; name: string; path?: string }>>;
  requestOpenResource: (id: string) => Promise<unknown>;
}

type CreateKnowledgeNoteRequest = Parameters<
  UseAIKnowledgeNoteWorkflowOptions['service']['createKnowledgeNote']
>[0];

export function useAIKnowledgeNoteWorkflow(options: UseAIKnowledgeNoteWorkflowOptions) {
  const { t } = useI18n();
  const router = useRouter();

  const noteCreating = ref(false);
  const noteSummary = ref<NoteSummary | null>(null);

  function buildKnowledgeNoteTitle() {
    const defaultName = t('aiAssistant.dialogs.chat.defaultConversationName');
    const trimmed = options.conversationTitle.value.trim();
    if (trimmed && trimmed !== defaultName) return trimmed;

    const latestUserMessage = [...options.chatTimeline.value]
      .reverse()
      .find((item) => item.role === 'user' && item.content.trim().length > 0);
    if (!latestUserMessage) return '';
    return latestUserMessage.content.trim().slice(0, 80);
  }

  function buildKnowledgeNoteTopic() {
    const recentMessages = options.chatTimeline.value
      .filter((item) => item.content.trim().length > 0)
      .slice(-4)
      .map((item) => item.content.trim());
    const combined = recentMessages.join('; ').replace(/\s+/g, ' ').trim();
    if (!combined) return t('aiAssistant.chatPage.workflow.noteTopicFallback');
    return combined.slice(0, 200);
  }

  function resetNoteArtifacts() {
    noteSummary.value = null;
  }

  async function createKnowledgeNoteFromConversation() {
    if (!options.selectedModel.value || !options.hasWorkflowMessages.value) return;

    noteCreating.value = true;
    try {
      const noteTitle = buildKnowledgeNoteTitle();
      const summary = await options.service.createKnowledgeNote({
        topic: buildKnowledgeNoteTopic(),
        ...(noteTitle ? { title: noteTitle } : {}),
        ...(options.knowledgeNoteSubpath.value
          ? { targetSubpath: options.knowledgeNoteSubpath.value }
          : {}),
        providerId:
          options.selectedModel.value.providerId as CreateKnowledgeNoteRequest['providerId'],
        model: options.selectedModel.value.modelId,
      });

      noteSummary.value = {
        resolvedPath: summary.resolvedPath,
        resource: summary.resource
          ? {
              id: summary.resource.id,
              name: summary.resource.name,
              content: summary.resource.content,
            }
          : undefined,
      };
      await options.fetchResources();
      await options.maybeRenameCurrentConversation(
        summary.resource?.name?.replace(/\.md$/i, '') || noteTitle,
      );
      toast.success(t('aiAssistant.dialogs.note.created'));
      options.scrollMessagesToBottom();
    } catch (error) {
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.dialogs.note.createFailed'));
    } finally {
      noteCreating.value = false;
    }
  }

  async function openCreatedNote() {
    const resolvedPath = noteSummary.value?.resolvedPath;
    if (!resolvedPath) return;

    if (!options.resources.value.length) {
      await options.fetchResources();
    }

    const target = options.resources.value.find(
      (item) => item.path === resolvedPath || item.name === noteSummary.value?.resource?.name,
    );

    if (target) {
      await options.requestOpenResource(target.id);
      await router.push('/repository');
    }
  }

  return {
    noteCreating,
    noteSummary,
    buildKnowledgeNoteTitle,
    buildKnowledgeNoteTopic,
    resetNoteArtifacts,
    createKnowledgeNoteFromConversation,
    openCreatedNote,
  };
}
