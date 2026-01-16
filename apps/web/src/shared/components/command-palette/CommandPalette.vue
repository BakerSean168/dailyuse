<template>
  <v-dialog
    v-model="isOpen"
    max-width="700"
    :fullscreen="false"
    :scrim="true"
    transition="dialog-top-transition"
    class="command-palette-dialog"
    data-testid="command-palette-dialog"
    @keydown.esc="handleClose"
  >
    <v-card class="command-palette-card" data-testid="command-palette">
      <!-- Search Input -->
      <div class="pa-4 pb-0">
        <v-text-field
          ref="searchInputRef"
          v-model="searchQuery"
          placeholder="Search or type a command..."
          variant="outlined"
          density="comfortable"
          hide-details
          autofocus
          clearable
          prepend-inner-icon="mdi-magnify"
          data-testid="command-palette-input"
          @keydown.down.prevent="handleArrowDown"
          @keydown.up.prevent="handleArrowUp"
          @keydown.enter.prevent="handleEnter"
          @keydown.esc="handleClose"
        >
          <template #append-inner>
            <v-chip
              v-if="isCommandMode"
              size="x-small"
              color="primary"
              variant="flat"
              data-testid="command-mode-indicator"
            >
              Command
            </v-chip>
          </template>
        </v-text-field>

        <!-- Search Stats -->
        <div
          v-if="searchQuery && !isCommandMode"
          class="text-caption text-medium-emphasis mt-2"
          data-testid="search-stats"
        >
          Found {{ filteredResults.length }} result{{ filteredResults.length !== 1 ? 's' : '' }}
          <span v-if="searchTime > 0">({{ searchTime }}ms)</span>
        </div>
      </div>

      <v-divider class="my-2" />

      <!-- Results Container -->
      <div class="results-container pa-2" data-testid="results-container">
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center pa-8" data-testid="loading-state">
          <v-progress-circular indeterminate color="primary" />
          <div class="text-caption text-medium-emphasis mt-2">Searching...</div>
        </div>

        <!-- Empty Search - Show Recent Items -->
        <div v-else-if="!searchQuery && recentItems.length > 0" data-testid="recent-items">
          <div class="text-caption text-medium-emphasis px-2 mb-2">
            <v-icon size="small" class="mr-1">mdi-history</v-icon>
            Recent Items
          </div>
          <v-list density="compact" class="py-0">
            <v-list-item
              v-for="(item, index) in recentItems"
              :key="item.id"
              :data-testid="`recent-item-${index}`"
              :data-item-id="item.id"
              :data-item-type="item.type"
              :class="{ 'bg-grey-lighten-4': selectedIndex === index }"
              @click="handleSelectRecentItem(item)"
              @mouseenter="selectedIndex = index"
            >
              <template #prepend>
                <v-icon :color="getTypeColor(item.type)">
                  {{ getTypeIcon(item.type) }}
                </v-icon>
              </template>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ formatAccessTime(item.accessedAt) }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <div class="text-center pa-2">
            <v-btn
              size="small"
              variant="text"
              color="error"
              data-testid="clear-history-btn"
              @click="handleClearHistory"
            >
              <v-icon size="small" class="mr-1">mdi-delete-outline</v-icon>
              Clear History
            </v-btn>
          </div>
        </div>

        <!-- Command Mode - Show Commands -->
        <div v-else-if="isCommandMode" data-testid="command-mode">
          <div class="text-caption text-medium-emphasis px-2 mb-2">
            <v-icon size="small" class="mr-1">mdi-flash</v-icon>
            Quick Actions
          </div>
          <v-list density="compact" class="py-0">
            <v-list-item
              v-for="(command, index) in filteredCommands"
              :key="command.id"
              :data-testid="`command-item-${index}`"
              :data-command-id="command.id"
              :class="{ 'bg-grey-lighten-4': selectedIndex === index }"
              @click="handleSelectCommand(command)"
              @mouseenter="selectedIndex = index"
            >
              <template #prepend>
                <v-icon :color="getCategoryColor(command.category)">
                  {{ command.icon }}
                </v-icon>
              </template>
              <v-list-item-title>{{ command.label }}</v-list-item-title>
              <v-list-item-subtitle>{{ command.description }}</v-list-item-subtitle>
              <template #append>
                <v-chip
                  size="x-small"
                  :color="getCategoryColor(command.category)"
                  variant="outlined"
                >
                  {{ command.category }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </div>

        <!-- Search Results -->
        <div v-else-if="searchQuery" data-testid="search-results">
          <!-- No Results -->
          <div
            v-if="filteredResults.length === 0"
            class="text-center pa-8"
            data-testid="no-results"
          >
            <v-icon size="64" color="grey-lighten-1">mdi-magnify-close</v-icon>
            <div class="text-h6 text-medium-emphasis mt-2">No results found</div>
            <div class="text-caption text-medium-emphasis">
              Try searching with different keywords
            </div>
          </div>

          <!-- Results by Type -->
          <div v-else data-testid="search-results-list">
            <!-- Goals -->
            <div v-if="goalResults.length > 0" class="mb-4">
              <div class="text-caption text-medium-emphasis px-2 mb-2">
                <v-icon size="small" class="mr-1">mdi-target</v-icon>
                Goals ({{ goalResults.length }})
              </div>
              <v-list density="compact" class="py-0">
                <v-list-item
                  v-for="(result, index) in goalResults"
                  :key="result.id"
                  :class="{ 'bg-grey-lighten-4': selectedIndex === getGlobalIndex('goal', index) }"
                  @click="handleSelectResult(result)"
                  @mouseenter="selectedIndex = getGlobalIndex('goal', index)"
                >
                  <template #prepend>
                    <v-icon color="primary">mdi-target</v-icon>
                  </template>
                  <v-list-item-title v-html="highlightText(result.title, result.matches)" />
                  <v-list-item-subtitle v-if="result.description">
                    {{ truncate(result.description, 60) }}
                  </v-list-item-subtitle>
                  <template #append>
                    <div class="d-flex align-center gap-2">
                      <v-chip
                        v-if="result.metadata.progress !== undefined"
                        size="x-small"
                        color="success"
                        variant="outlined"
                      >
                        {{ result.metadata.progress }}%
                      </v-chip>
                      <v-chip size="x-small" :color="getStatusColor(result.status)" variant="flat">
                        {{ result.status }}
                      </v-chip>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </div>

            <!-- Tasks -->
            <div v-if="taskResults.length > 0" class="mb-4">
              <div class="text-caption text-medium-emphasis px-2 mb-2">
                <v-icon size="small" class="mr-1">mdi-checkbox-marked-outline</v-icon>
                Tasks ({{ taskResults.length }})
              </div>
              <v-list density="compact" class="py-0">
                <v-list-item
                  v-for="(result, index) in taskResults"
                  :key="result.id"
                  :class="{ 'bg-grey-lighten-4': selectedIndex === getGlobalIndex('task', index) }"
                  @click="handleSelectResult(result)"
                  @mouseenter="selectedIndex = getGlobalIndex('task', index)"
                >
                  <template #prepend>
                    <v-icon color="info">mdi-checkbox-marked-outline</v-icon>
                  </template>
                  <v-list-item-title v-html="highlightText(result.title, result.matches)" />
                  <v-list-item-subtitle v-if="result.description">
                    {{ truncate(result.description, 60) }}
                  </v-list-item-subtitle>
                  <template #append>
                    <v-chip size="x-small" :color="getStatusColor(result.status)" variant="flat">
                      {{ result.status }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </div>

            <!-- Reminders -->
            <div v-if="reminderResults.length > 0">
              <div class="text-caption text-medium-emphasis px-2 mb-2">
                <v-icon size="small" class="mr-1">mdi-bell-outline</v-icon>
                Reminders ({{ reminderResults.length }})
              </div>
              <v-list density="compact" class="py-0">
                <v-list-item
                  v-for="(result, index) in reminderResults"
                  :key="result.id"
                  :class="{
                    'bg-grey-lighten-4': selectedIndex === getGlobalIndex('reminder', index),
                  }"
                  @click="handleSelectResult(result)"
                  @mouseenter="selectedIndex = getGlobalIndex('reminder', index)"
                >
                  <template #prepend>
                    <v-icon color="warning">mdi-bell-outline</v-icon>
                  </template>
                  <v-list-item-title v-html="highlightText(result.title, result.matches)" />
                  <v-list-item-subtitle v-if="result.description">
                    {{ truncate(result.description, 60) }}
                  </v-list-item-subtitle>
                  <template #append>
                    <v-chip size="x-small" :color="getStatusColor(result.status)" variant="flat">
                      {{ result.status }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center pa-8">
          <v-icon size="64" color="grey-lighten-1">mdi-magnify</v-icon>
          <div class="text-h6 text-medium-emphasis mt-2">Search anything</div>
          <div class="text-caption text-medium-emphasis">
            Type to search goals, tasks, and reminders
          </div>
          <div class="text-caption text-medium-emphasis mt-2">
            Or type <code>&gt;</code> for commands
          </div>
        </div>
      </div>

      <v-divider />

      <!-- Footer with Keyboard Hints -->
      <div class="pa-2 d-flex align-center justify-space-between text-caption text-medium-emphasis">
        <div class="d-flex align-center gap-4">
          <span>
            <v-icon size="x-small" class="mr-1">mdi-arrow-up-down</v-icon>
            Navigate
          </span>
          <span>
            <v-icon size="x-small" class="mr-1">mdi-keyboard-return</v-icon>
            Open
          </span>
          <span>
            <v-icon size="x-small" class="mr-1">mdi-keyboard-esc</v-icon>
            Close
          </span>
        </div>
        <div>
          <v-icon size="x-small" class="mr-1">mdi-keyboard</v-icon>
          {{ isMac ? '⌘K' : 'Ctrl+K' }}
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { globalSearchService } from '@/shared/services/GlobalSearchService';
import type { SearchResult, RecentItem, Command } from '@/shared/services/GlobalSearchService';
import { highlightMatches, type TextMatch } from '@/shared/utils/fuzzySearch';

// Props
interface Props {
  modelValue?: boolean;
  goals?: any[];
  tasks?: any[];
  reminders?: any[];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  goals: () => [],
  tasks: () => [],
  reminders: () => [],
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  navigate: [url: string];
}>();

// Router
const router = useRouter();

// State
const isOpen = ref(props.modelValue);
const searchQuery = ref('');
const searchResults = ref<SearchResult[]>([]);
const recentItems = ref<RecentItem[]>([]);
const commands = ref<Command[]>([]);
const selectedIndex = ref(0);
const isLoading = ref(false);
const searchTime = ref(0);
const searchInputRef = ref<any>(null);

// Platform detection
const isMac = computed(() => {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
});

// Command mode detection
const isCommandMode = computed(() => {
  return searchQuery.value.startsWith('>');
});

// Filtered commands
const filteredCommands = computed(() => {
  if (!isCommandMode.value) return [];

  const query = searchQuery.value.slice(1).trim();
  if (!query) return commands.value;

  return globalSearchService.searchCommands(query);
});

// Filtered results
const filteredResults = computed(() => {
  return searchResults.value;
});

// Results by type
const goalResults = computed(() => {
  return filteredResults.value.filter((r) => r.type === 'goal');
});

const taskResults = computed(() => {
  return filteredResults.value.filter((r) => r.type === 'task');
});

const reminderResults = computed(() => {
  return filteredResults.value.filter((r) => r.type === 'reminder');
});

// Total results count
const totalResults = computed(() => {
  if (isCommandMode.value) return filteredCommands.value.length;
  return filteredResults.value.length;
});

// Watch model value
watch(
  () => props.modelValue,
  (newVal) => {
    isOpen.value = newVal;
    if (newVal) {
      handleOpen();
    }
  },
);

watch(isOpen, (newVal) => {
  emit('update:modelValue', newVal);
  if (!newVal) {
    handleClose();
  }
});

// Watch search query with debounce
let searchTimeout: ReturnType<typeof setTimeout>;
watch(searchQuery, (newQuery) => {
  clearTimeout(searchTimeout);
  selectedIndex.value = 0;

  if (!newQuery || isCommandMode.value) {
    searchResults.value = [];
    return;
  }

  isLoading.value = true;
  searchTimeout = setTimeout(async () => {
    await performSearch(newQuery);
    isLoading.value = false;
  }, 300);
});

// Methods
async function performSearch(query: string) {
  const startTime = performance.now();

  try {
    searchResults.value = await globalSearchService.search(
      query,
      props.goals,
      props.tasks,
      props.reminders,
      { limit: 50 },
    );
  } catch (error) {
    console.error('Search error:', error);
    searchResults.value = [];
  }

  const endTime = performance.now();
  searchTime.value = Math.round(endTime - startTime);
}

function handleOpen() {
  // Load recent items
  recentItems.value = globalSearchService.getRecentItems(10);

  // Load commands
  commands.value = [
    {
      id: 'create-goal',
      label: 'Create New Goal',
      description: 'Create a new goal',
      icon: 'mdi-target',
      handler: async () => {
        await router.push('/goals/new');
      },
      keywords: ['new', 'goal', 'create', 'add'],
      category: 'create',
    },
    {
      id: 'create-task',
      label: 'Create New Task',
      description: 'Create a new task',
      icon: 'mdi-checkbox-marked-outline',
      handler: async () => {
        await router.push('/tasks/new');
      },
      keywords: ['new', 'task', 'create', 'add', 'todo'],
      category: 'create',
    },
    {
      id: 'create-reminder',
      label: 'Create New Reminder',
      description: 'Create a new reminder',
      icon: 'mdi-bell-outline',
      handler: async () => {
        await router.push('/reminders/new');
      },
      keywords: ['new', 'reminder', 'create', 'add'],
      category: 'create',
    },
    {
      id: 'navigate-dashboard',
      label: 'Go to Dashboard',
      description: 'Navigate to dashboard',
      icon: 'mdi-view-dashboard',
      handler: async () => {
        await router.push('/dashboard');
      },
      keywords: ['dashboard', 'home', 'main'],
      category: 'navigate',
    },
    {
      id: 'navigate-goals',
      label: 'Go to Goals',
      description: 'Navigate to goals page',
      icon: 'mdi-target',
      handler: async () => {
        await router.push('/goals');
      },
      keywords: ['goals', 'objectives'],
      category: 'navigate',
    },
    {
      id: 'navigate-tasks',
      label: 'Go to Tasks',
      description: 'Navigate to tasks page',
      icon: 'mdi-format-list-checks',
      handler: async () => {
        await router.push('/tasks');
      },
      keywords: ['tasks', 'todos'],
      category: 'navigate',
    },
  ];

  // Focus search input
  nextTick(() => {
    searchInputRef.value?.focus();
  });
}

function handleClose() {
  isOpen.value = false;
  searchQuery.value = '';
  searchResults.value = [];
  selectedIndex.value = 0;
}

function handleArrowDown() {
  if (totalResults.value === 0) return;
  selectedIndex.value = Math.min(selectedIndex.value + 1, totalResults.value - 1);
}

function handleArrowUp() {
  selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
}

function handleEnter() {
  if (isCommandMode.value) {
    const command = filteredCommands.value[selectedIndex.value];
    if (command) {
      handleSelectCommand(command);
    }
  } else if (searchQuery.value && filteredResults.value.length > 0) {
    const result = getResultAtIndex(selectedIndex.value);
    if (result) {
      handleSelectResult(result);
    }
  } else if (!searchQuery.value && recentItems.value.length > 0) {
    const item = recentItems.value[selectedIndex.value];
    if (item) {
      handleSelectRecentItem(item);
    }
  }
}

function getResultAtIndex(index: number): SearchResult | null {
  const allResults = [...goalResults.value, ...taskResults.value, ...reminderResults.value];
  return allResults[index] || null;
}

function getGlobalIndex(type: string, localIndex: number): number {
  let offset = 0;
  if (type === 'task') offset = goalResults.value.length;
  if (type === 'reminder') offset = goalResults.value.length + taskResults.value.length;
  return offset + localIndex;
}

function handleSelectResult(result: SearchResult) {
  // Add to recent items
  globalSearchService.addRecentItem({
    id: result.id,
    type: result.type,
    title: result.title,
    accessedAt: Date.now(),
    url: result.url,
  });

  // Navigate
  router.push(result.url);
  emit('navigate', result.url);

  handleClose();
}

function handleSelectRecentItem(item: RecentItem) {
  // Update access time
  globalSearchService.addRecentItem({
    ...item,
    accessedAt: Date.now(),
  });

  // Navigate
  router.push(item.url);
  emit('navigate', item.url);

  handleClose();
}

function handleSelectCommand(command: Command) {
  if (command.handler) {
    command.handler();
  }
  handleClose();
}

function handleClearHistory() {
  globalSearchService.clearRecentItems();
  recentItems.value = [];
}

function getTypeIcon(type: string): string {
  switch (type) {
    case 'goal':
      return 'mdi-target';
    case 'task':
      return 'mdi-checkbox-marked-outline';
    case 'reminder':
      return 'mdi-bell-outline';
    default:
      return 'mdi-file-outline';
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'goal':
      return 'primary';
    case 'task':
      return 'info';
    case 'reminder':
      return 'warning';
    default:
      return 'grey';
  }
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'create':
      return 'success';
    case 'navigate':
      return 'info';
    case 'action':
      return 'warning';
    case 'settings':
      return 'grey';
    default:
      return 'grey';
  }
}

function getStatusColor(status: string): string {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('active') || statusLower.includes('progress')) return 'primary';
  if (statusLower.includes('completed') || statusLower.includes('done')) return 'success';
  if (statusLower.includes('pending') || statusLower.includes('waiting')) return 'warning';
  if (statusLower.includes('archived') || statusLower.includes('paused')) return 'grey';
  return 'info';
}

function highlightText(text: string, matches: TextMatch[]): string {
  return highlightMatches(text, matches, '<mark class="search-highlight">', '</mark>');
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function formatAccessTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

// Keyboard shortcut listener
function handleGlobalKeydown(event: KeyboardEvent) {
  const isCmdOrCtrl = event.metaKey || event.ctrlKey;
  if (isCmdOrCtrl && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    isOpen.value = !isOpen.value;
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
});
</script>

<style scoped>
.command-palette-dialog {
  align-items: flex-start;
  padding-top: 10vh;
}

.command-palette-card {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12) !important;
}

.results-container {
  max-height: 60vh;
  overflow-y: auto;
}

.results-container::-webkit-scrollbar {
  width: 8px;
}

.results-container::-webkit-scrollbar-track {
  background: transparent;
}

.results-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.results-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

:deep(.search-highlight) {
  background-color: rgba(var(--v-theme-primary), 0.2);
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
  padding: 2px 0;
  border-radius: 2px;
}

.v-list-item {
  cursor: pointer;
  transition: background-color 0.2s;
  border-radius: 8px;
  margin: 2px 0;
}

.v-list-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

code {
  background-color: rgba(0, 0, 0, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: 'Courier New', monospace;
}

.gap-2 {
  gap: 8px;
}

.gap-4 {
  gap: 16px;
}
</style>
