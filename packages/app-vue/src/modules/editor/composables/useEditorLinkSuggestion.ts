import { ref, type Ref } from 'vue';
import { toast } from 'vue-sonner';
import type { ComposerTranslation } from 'vue-i18n';
import { formatWikiLink } from '../utils/wikiLinks';
import type { LinkIndexNote } from '../utils/linkIndex';

export interface LinkSuggestionState {
  visible: boolean;
  query: string;
  position: { x: number; y: number };
}

interface UseEditorLinkSuggestionOptions {
  t: ComposerTranslation;
  currentResourceId: Ref<string | null>;
  createMarkdownNote: (name: string) => Promise<{ id: string } | null | undefined>;
  replaceActiveWikiLink: (text: string) => void;
  focusPane: () => void;
  createFailedMessage: string;
  createSuccessMessage: (name: string) => string;
}

export function useEditorLinkSuggestion(options: UseEditorLinkSuggestionOptions) {
  const suggestionState = ref<LinkSuggestionState>({
    visible: false,
    query: '',
    position: { x: 0, y: 0 },
  });

  function handleTriggerSuggestion(payload: { x: number; y: number; query: string }) {
    if (!options.currentResourceId.value) {
      return;
    }

    suggestionState.value = {
      visible: true,
      query: payload.query,
      position: { x: payload.x, y: payload.y },
    };
  }

  function closeSuggestion() {
    suggestionState.value = {
      ...suggestionState.value,
      visible: false,
    };
  }

  function handleSuggestionSelect(note: LinkIndexNote | null) {
    if (!note) {
      return;
    }

    options.replaceActiveWikiLink(formatWikiLink(note.title));
    closeSuggestion();
    options.focusPane();
  }

  async function handleCreateLinkedNote(title: string) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    try {
      const created = await options.createMarkdownNote(trimmedTitle);
      if (!created) {
        toast.error(options.createFailedMessage);
        return;
      }

      options.replaceActiveWikiLink(formatWikiLink(trimmedTitle));
      closeSuggestion();
      options.focusPane();
      toast.success(options.createSuccessMessage(trimmedTitle));
    } catch (error) {
      console.error('Create linked note failed:', error);
      toast.error(options.createFailedMessage);
    }
  }

  return {
    suggestionState,
    handleTriggerSuggestion,
    closeSuggestion,
    handleSuggestionSelect,
    handleCreateLinkedNote,
  };
}
