<template>
  <div class="flex items-center justify-between border-b bg-background px-2 py-1 gap-2">
    <div class="text-sm font-medium">{{ t('editor.toolbar.title') }}</div>

    <div class="flex-1" />

    <div class="flex items-center gap-1">
      <!-- Heading Menu -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" class="h-8 w-8">
            <Heading class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem v-for="level in 6" :key="level" @click="insertHeading(level)">
            {{ t('editor.toolbar.heading', { level }) }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" class="h-6" />

      <!-- Text Formatting -->
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="insertBold">
        <Bold class="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="insertItalic">
        <Italic class="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="insertStrikethrough">
        <Strikethrough class="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" class="h-6" />

      <!-- Code -->
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="insertInlineCode">
        <Code class="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="insertCodeBlock">
        <Code2 class="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" class="h-6" />

      <!-- Link & Image -->
      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :title="t('editor.toolbar.insertLink')"
        :aria-label="t('editor.toolbar.insertLink')"
        @click="insertLink"
      >
        <Link class="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :title="t('editor.toolbar.insertImage')"
        :aria-label="t('editor.toolbar.insertImage')"
        @click="insertImage"
      >
        <Image class="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :title="t('editor.toolbar.insertResource')"
        :aria-label="t('editor.toolbar.insertResource')"
        @click="insertResource"
      >
        <Images class="h-4 w-4" />
      </Button>
    <!-- 阶段 0：自包含导出入口隐藏（V2 §6 Note） -->

      <Separator orientation="vertical" class="h-6" />

      <!-- Lists -->
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="insertUnorderedList">
        <List class="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="insertOrderedList">
        <ListOrdered class="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="insertTaskList">
        <ListTodo class="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" class="h-6" />

      <!-- Quote, Divider, Table -->
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="insertQuote">
        <Quote class="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="insertDivider">
        <Minus class="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="insertTable">
        <Table class="h-4 w-4" />
      </Button>
    </div>

    <div class="flex-1" />

    <!-- View Mode Toggle -->
    <ToggleGroup v-model="viewMode" type="single" @update:model-value="handleViewModeChange">
      <ToggleGroupItem value="source" aria-label="Source mode" class="h-8 w-8">
        <Code2 class="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="live" aria-label="Live mode" class="h-8 w-8">
        <Pencil class="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="preview" aria-label="Preview mode" class="h-8 w-8">
        <Eye class="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>

    <Separator orientation="vertical" class="h-6 mx-2" />

    <Button :disabled="saving" @click="$emit('save')">
      <Save class="h-4 w-4 mr-2" />
      {{ t('common.save') }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Separator } from '@dailyuse/ui-vue-shadcn';
import { ToggleGroup, ToggleGroupItem } from '@dailyuse/ui-vue-shadcn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@dailyuse/ui-vue-shadcn';
import {
  Heading,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Code2,
  Link,
  Image,
  Images,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Minus,
  Table,
  Pencil,
  Eye,
  Save,
  Share2,
} from 'lucide-vue-next';

const { t } = useI18n();

const emit = defineEmits<{
  'insert-text': [text: string];
  'wrap-selection': [prefix: string, suffix: string];
  'insert-resource': [];
  'export-self-contained': [];
  'view-mode-change': [mode: 'source' | 'live' | 'preview'];
  save: [];
}>();

const props = withDefaults(
  defineProps<{
    saving?: boolean;
    viewMode?: 'source' | 'live' | 'preview';
  }>(),
  {
    saving: false,
    viewMode: 'live',
  },
);

const viewMode = ref<'source' | 'live' | 'preview'>(props.viewMode);

function insertHeading(level: number) {
  emit('insert-text', '#'.repeat(level) + ' ');
}

function insertBold() {
  emit('wrap-selection', '**', '**');
}

function insertItalic() {
  emit('wrap-selection', '*', '*');
}

function insertStrikethrough() {
  emit('wrap-selection', '~~', '~~');
}

function insertInlineCode() {
  emit('wrap-selection', '`', '`');
}

function insertCodeBlock() {
  emit('insert-text', '\n```\n\n```\n');
}

function insertLink() {
  emit('wrap-selection', '[', '](url)');
}

function insertImage() {
  emit('wrap-selection', '![', '](url)');
}

function insertResource() {
  emit('insert-resource');
}

function exportSelfContained() {
  emit('export-self-contained');
}

function handleViewModeChange(value: string | string[]) {
  if (value === 'source' || value === 'live' || value === 'preview') {
    viewMode.value = value;
    emit('view-mode-change', value);
  }
}

function insertUnorderedList() {
  emit('insert-text', '\n- ');
}

function insertOrderedList() {
  emit('insert-text', '\n1. ');
}

function insertTaskList() {
  emit('insert-text', '\n- [ ] ');
}

function insertQuote() {
  emit('insert-text', '\n> ');
}

function insertDivider() {
  emit('insert-text', '\n\n---\n\n');
}

function insertTable() {
  const col = t('editor.toolbar.column');
  const content = t('editor.toolbar.content');
  emit(
    'insert-text',
    `\n| ${col}1 | ${col}2 | ${col}3 |\n|-----|-----|-----|\n| ${content} | ${content} | ${content} |\n`,
  );
}

watch(
  () => props.viewMode,
  (nextMode) => {
    viewMode.value = nextMode;
  },
);
</script>
