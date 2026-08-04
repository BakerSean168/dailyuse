<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle>{{ t('setting.shortcuts.title') }}</CardTitle>
      <Button size="sm" variant="outline" @click="emit('resetAll')">
        <RotateCcw class="h-4 w-4 mr-2" />
        {{ t('setting.shortcuts.resetAll') }}
      </Button>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Search -->
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          :placeholder="t('setting.shortcuts.searchPlaceholder')"
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
                  <Button
                    v-if="!editingShortcut || editingShortcut.id !== shortcut.id"
                    variant="outline"
                    size="sm"
                    class="h-8 rounded-full font-mono"
                    @click="emit('startEdit', shortcut)"
                  >
                    {{ formatShortcutKey(shortcut.key) }}
                  </Button>
                  <Input
                    v-else
                    :model-value="editingKey"
                    :placeholder="t('setting.shortcuts.pressKey')"
                    readonly
                    class="w-[200px] h-8 text-sm"
                    @keydown="(e: KeyboardEvent) => emit('captureKey', e)"
                  />
                  <Button
                    v-if="editingShortcut?.id === shortcut.id"
                    size="icon"
                    :aria-label="t('common.save')"
                    variant="ghost"
                    class="h-8 w-8"
                    @click="emit('saveEdit')"
                  >
                    <Check class="h-4 w-4 text-success" />
                  </Button>
                  <Button
                    v-if="editingShortcut?.id === shortcut.id"
                    size="icon"
                    :aria-label="t('common.cancel')"
                    variant="ghost"
                    class="h-8 w-8"
                    @click="emit('cancelEdit')"
                  >
                    <X class="h-4 w-4" />
                  </Button>
                  <Button
                    v-else
                    size="icon"
                    :aria-label="t('common.reset')"
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
import { useI18n } from 'vue-i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@memoflow/ui-vue-shadcn';
import { Input } from '@memoflow/ui-vue-shadcn';
import { Button } from '@memoflow/ui-vue-shadcn';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@memoflow/ui-vue-shadcn';
import { Search, RotateCcw, Check, X } from '@lucide/vue';

const { t } = useI18n();

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
  iconComponent: unknown;
  shortcuts: ShortcutItem[];
}

interface Props {
  categories: ShortcutCategory[];
  editingShortcut?: ShortcutItem | null;
  editingKey?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  startEdit: [shortcut: ShortcutItem];
  saveEdit: [];
  cancelEdit: [];
  captureKey: [event: KeyboardEvent];
  reset: [shortcut: ShortcutItem];
  resetAll: [];
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
  return key.replace('Ctrl', '⌃').replace('Alt', '⌥').replace('Shift', '⇧').replace('Meta', '⌘');
}
</script>
