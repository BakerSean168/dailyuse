<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle>快捷键设置</CardTitle>
      <Button size="sm" variant="outline" @click="emit('resetAll')">
        <RotateCcw class="h-4 w-4 mr-2" />
        全部重置
      </Button>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Search -->
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="搜索快捷键"
          class="pl-10"
        />
      </div>

      <!-- Shortcut Categories -->
      <Accordion type="multiple" class="w-full">
        <AccordionItem
          v-for="category in filteredCategories"
          :key="category.name"
          :value="category.name"
        >
          <AccordionTrigger>
            <div class="flex items-center">
              <component :is="category.iconComponent" class="h-4 w-4 mr-2" />
              {{ category.label }} ({{ category.shortcuts.length }})
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div class="space-y-3">
              <div
                v-for="shortcut in category.shortcuts"
                :key="shortcut.id"
                class="flex items-start justify-between py-2"
              >
                <div class="flex-1">
                  <div class="text-sm font-medium">{{ shortcut.label }}</div>
                  <div class="text-xs text-muted-foreground">{{ shortcut.description }}</div>
                </div>
                <div class="flex items-center space-x-2">
                  <Badge
                    v-if="!editingShortcut || editingShortcut.id !== shortcut.id"
                    variant="outline"
                    class="cursor-pointer hover:bg-accent"
                    @click="emit('startEdit', shortcut)"
                  >
                    {{ formatShortcutKey(shortcut.key) }}
                  </Badge>
                  <Input
                    v-else
                    :model-value="editingKey"
                    placeholder="按下快捷键..."
                    readonly
                    class="w-[200px] h-8 text-sm"
                    @keydown="(e: KeyboardEvent) => emit('captureKey', e)"
                  />
                  <Button
                    v-if="editingShortcut?.id === shortcut.id"
                    size="icon"
                    variant="ghost"
                    class="h-8 w-8"
                    @click="emit('saveEdit')"
                  >
                    <Check class="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    v-if="editingShortcut?.id === shortcut.id"
                    size="icon"
                    variant="ghost"
                    class="h-8 w-8"
                    @click="emit('cancelEdit')"
                  >
                    <X class="h-4 w-4" />
                  </Button>
                  <Button
                    v-else
                    size="icon"
                    variant="ghost"
                    class="h-8 w-8"
                    @click="emit('reset', shortcut)"
                  >
                    <RotateCcw class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../ui/accordion';
import {
  Search,
  RotateCcw,
  Check,
  X,
  Globe,
  FileEdit,
  CheckSquare,
  Target,
} from 'lucide-vue-next';

interface ShortcutItem {
  id: string;
  label: string;
  description: string;
  key: string;
  defaultKey: string;
}

interface ShortcutCategory {
  name: string;
  label: string;
  iconComponent: any;
  shortcuts: ShortcutItem[];
}

interface Props {
  categories: ShortcutCategory[];
  editingShortcut?: ShortcutItem | null;
  editingKey?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'startEdit': [shortcut: ShortcutItem];
  'saveEdit': [];
  'cancelEdit': [];
  'captureKey': [event: KeyboardEvent];
  'reset': [shortcut: ShortcutItem];
  'resetAll': [];
}>();

const searchQuery = ref('');

const filteredCategories = computed(() => {
  if (!searchQuery.value) return props.categories;
  
  const query = searchQuery.value.toLowerCase();
  return props.categories
    .map((category) => ({
      ...category,
      shortcuts: category.shortcuts.filter(
        (shortcut) =>
          shortcut.label.toLowerCase().includes(query) ||
          shortcut.description.toLowerCase().includes(query) ||
          shortcut.key.toLowerCase().includes(query),
      ),
    }))
    .filter((category) => category.shortcuts.length > 0);
});

function formatShortcutKey(key: string): string {
  return key
    .replace('Ctrl', '⌃')
    .replace('Alt', '⌥')
    .replace('Shift', '⇧')
    .replace('Meta', '⌘');
}
</script>
