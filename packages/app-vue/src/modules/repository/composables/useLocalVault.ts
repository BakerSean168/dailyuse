import { computed, onMounted, ref } from 'vue';
import type {
  LocalVaultBindingClientDTO,
  LocalVaultNoteDTO,
  LocalVaultNoteSummaryDTO,
  SearchLocalVaultRes,
} from '@dailyuse/contracts/repository';
import type { Result } from '@dailyuse/contracts/result';
import { REPOSITORY_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function useLocalVault() {
  const service = useStrictInject(REPOSITORY_SERVICE_KEY, 'RepositoryService');
  const binding = ref<LocalVaultBindingClientDTO | null>(null);
  const notes = ref<LocalVaultNoteSummaryDTO[]>([]);
  const activeNote = ref<LocalVaultNoteDTO | null>(null);
  const searchQuery = ref('');
  const searchResults = ref<SearchLocalVaultRes['results']>([]);
  const searchActive = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isBound = computed(() => binding.value?.status === 'Active');
  const displayedNotes = computed(() =>
    searchActive.value ? searchResults.value.map((result) => result.note) : notes.value,
  );

  async function unwrap<T>(operation: Promise<Result<T>>): Promise<T> {
    const result = await operation;
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async function run<T>(operation: () => Promise<T>): Promise<T | null> {
    loading.value = true;
    error.value = null;
    try {
      return await operation();
    } catch (cause) {
      error.value = errorMessage(cause);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function loadBinding(): Promise<void> {
    const loaded = await run(() => unwrap(service.getLocalVaultBinding()));
    binding.value = loaded;
    if (loaded?.status === 'Active') await scan();
  }

  async function selectVault(): Promise<void> {
    const selected = await run(() =>
      unwrap(
        service.selectLocalVault({
          suggestedPath: binding.value?.rootPath,
        }),
      ),
    );
    if (!selected) return;
    binding.value = selected;
    activeNote.value = null;
    searchQuery.value = '';
    searchActive.value = false;
    await scan();
  }

  async function detachVault(): Promise<void> {
    const detached = await run(() => unwrap(service.detachLocalVault()));
    if (detached !== null) {
      binding.value = binding.value ? { ...binding.value, status: 'Detached' } : null;
      notes.value = [];
      activeNote.value = null;
    }
  }

  async function scan(): Promise<void> {
    const scanned = await run(() => unwrap(service.scanLocalVault()));
    if (!scanned) return;
    binding.value = scanned.binding;
    notes.value = scanned.notes;
    if (activeNote.value) {
      const stillExists = scanned.notes.some(
        (note) => note.relativePath === activeNote.value?.relativePath,
      );
      if (!stillExists) activeNote.value = null;
    }
  }

  async function openNote(note: LocalVaultNoteSummaryDTO): Promise<void> {
    const loaded = await run(() =>
      unwrap(
        service.readLocalVaultNote({
          relativePath: note.relativePath,
        }),
      ),
    );
    if (loaded) activeNote.value = loaded;
  }

  async function search(): Promise<void> {
    const query = searchQuery.value.trim();
    if (!query) {
      clearSearch();
      return;
    }
    const searched = await run(() => unwrap(service.searchLocalVault({ query, limit: 100 })));
    if (!searched) return;
    searchResults.value = searched.results;
    searchActive.value = true;
  }

  function clearSearch(): void {
    searchQuery.value = '';
    searchResults.value = [];
    searchActive.value = false;
  }

  async function openInObsidian(relativePath?: string): Promise<void> {
    await run(() =>
      unwrap(
        service.openLocalVaultInObsidian({
          ...(relativePath ? { relativePath } : {}),
        }),
      ),
    );
  }

  async function openWikiLink(title: string): Promise<void> {
    const normalized = title.trim().toLocaleLowerCase();
    const target = notes.value.find((note) => {
      const segments = note.relativePath.replace(/\.md$/i, '').split('/');
      const stem = segments[segments.length - 1]?.toLocaleLowerCase();
      return note.title.toLocaleLowerCase() === normalized || stem === normalized;
    });
    if (target) await openNote(target);
  }

  onMounted(() => {
    void loadBinding();
  });

  return {
    binding,
    notes,
    activeNote,
    searchQuery,
    searchResults,
    searchActive,
    loading,
    error,
    isBound,
    displayedNotes,
    loadBinding,
    selectVault,
    detachVault,
    scan,
    openNote,
    search,
    clearSearch,
    openInObsidian,
    openWikiLink,
  };
}
