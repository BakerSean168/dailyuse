<template>
  <div class="flex items-center justify-between border-b bg-background px-2 py-1 gap-2">
    <div class="text-sm font-medium">Markdown 编辑器</div>
    
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
            标题 {{ level }}
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
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="insertLink">
        <Link class="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="insertImage">
        <Image class="h-4 w-4" />
      </Button>

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
    <ToggleGroup v-model="viewMode" type="single" @update:model-value="(val: any) => $emit('view-mode-change', val)">
      <ToggleGroupItem value="edit" aria-label="Edit mode" class="h-8 w-8">
        <Pencil class="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="split" aria-label="Split mode" class="h-8 w-8">
        <PanelLeftClose class="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="preview" aria-label="Preview mode" class="h-8 w-8">
        <Eye class="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>

    <Separator orientation="vertical" class="h-6 mx-2" />

    <Button :disabled="saving" @click="$emit('save')">
      <Save class="h-4 w-4 mr-2" />
      保存
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '../../ui/button';
import { Separator } from '../../ui/separator';
import { ToggleGroup, ToggleGroupItem } from '../../ui/toggle-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import {
  Heading,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Code2,
  Link,
  Image,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Minus,
  Table,
  Pencil,
  PanelLeftClose,
  Eye,
  Save,
} from 'lucide-vue-next';

interface Props {
  saving?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  'insert-text': [text: string];
  'wrap-selection': [prefix: string, suffix: string];
  'view-mode-change': [mode: 'edit' | 'split' | 'preview'];
  save: [];
}>();

const viewMode = ref<'edit' | 'split' | 'preview'>('split');

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
  emit('insert-text', '\n| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| 内容 | 内容 | 内容 |\n');
}
</script>
