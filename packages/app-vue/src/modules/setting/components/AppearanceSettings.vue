<template>
  <Card data-testid="appearance-settings-card">
    <CardHeader>
      <CardTitle>{{ t('setting.appearance.title') }}</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="space-y-2">
        <Label for="theme-select">{{ t('setting.appearance.theme') }}</Label>
        <Select
          :model-value="modelValue.theme"
          @update:model-value="
            (value: any) =>
              emit('update:modelValue', { ...modelValue, theme: value as AppearanceTheme })
          "
        >
          <SelectTrigger id="theme-select" data-testid="appearance-theme-trigger">
            <SelectValue :placeholder="t('setting.appearance.themePlaceholder')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in themeOptions"
              :key="option.value"
              :value="option.value"
              :data-testid="`appearance-theme-option-${option.value}`"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <p class="text-sm text-muted-foreground">
          {{ t('setting.appearance.themeDescription') }}
        </p>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@memoflow/ui-vue-shadcn';
import { Label } from '@memoflow/ui-vue-shadcn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@memoflow/ui-vue-shadcn';

const { t } = useI18n();

type AppearanceTheme = 'light' | 'dark' | 'auto';

interface AppearanceSettings {
  theme?: AppearanceTheme;
}

interface Props {
  modelValue: AppearanceSettings;
  themeOptions?: Array<{ label: string; value: string }>;
}

const props = withDefaults(defineProps<Props>(), {
  themeOptions: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: AppearanceSettings];
}>();

const themeOptions = computed(
  () =>
    props.themeOptions ?? [
      { label: `☀️ ${t('setting.appearance.themeLight')}`, value: 'light' },
      { label: `🌙 ${t('setting.appearance.themeDark')}`, value: 'dark' },
      { label: `🖥️ ${t('setting.appearance.themeAuto')}`, value: 'auto' },
    ],
);
</script>
