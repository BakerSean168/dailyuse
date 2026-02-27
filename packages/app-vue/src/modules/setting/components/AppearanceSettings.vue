<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ t('setting.appearance.title') }}</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Theme -->
        <div class="space-y-2">
          <Label for="theme-select">{{ t('setting.appearance.theme') }}</Label>
          <Select
            :model-value="modelValue.themeStyle"
            @update:model-value="
              (value: any) =>
                emit('update:modelValue', { ...modelValue, themeStyle: value as string })
            "
          >
            <SelectTrigger id="theme-select">
              <SelectValue :placeholder="t('setting.appearance.themePlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in themeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p class="text-sm text-muted-foreground">
            {{ t('setting.appearance.themeDescription') }}
          </p>
        </div>

        <!-- Font Size -->
        <div class="space-y-2">
          <Label for="font-size-select">{{ t('setting.appearance.fontSize') }}</Label>
          <Select
            :model-value="modelValue.fontSize"
            @update:model-value="
              (value: any) =>
                emit('update:modelValue', { ...modelValue, fontSize: value as string })
            "
          >
            <SelectTrigger id="font-size-select">
              <SelectValue :placeholder="t('setting.appearance.fontSizePlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in fontSizeOpts" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Accent Color -->
        <div class="space-y-2">
          <Label for="accent-color">{{ t('setting.appearance.accentColor') }}</Label>
          <Input
            id="accent-color"
            type="color"
            :model-value="modelValue.accentColor"
            @update:model-value="
              (value: any) =>
                emit('update:modelValue', { ...modelValue, accentColor: String(value) })
            "
          />
          <p class="text-sm text-muted-foreground">
            {{ t('setting.appearance.accentColorDescription') }}
          </p>
        </div>

        <!-- Compact Mode -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <Label for="compact-mode">{{ t('setting.appearance.compactMode') }}</Label>
            <Switch
              id="compact-mode"
              :checked="modelValue.compactMode"
              @update:checked="
                (value) => emit('update:modelValue', { ...modelValue, compactMode: value })
              "
            />
          </div>
          <p class="text-sm text-muted-foreground">
            {{ t('setting.appearance.compactModeDescription') }}
          </p>
        </div>
      </div>

      <!-- Font Family -->
      <div class="space-y-2">
        <Label for="font-family-select">{{ t('setting.appearance.fontFamily') }}</Label>
        <Select
          :model-value="modelValue.fontFamily ?? undefined"
          @update:model-value="
            (value: any) =>
              emit('update:modelValue', { ...modelValue, fontFamily: value as string })
          "
        >
          <SelectTrigger id="font-family-select">
            <SelectValue :placeholder="t('setting.appearance.fontFamilyPlaceholder')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in fontFamilyOpts" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@dailyuse/ui-vue-shadcn';
import { Switch } from '@dailyuse/ui-vue-shadcn';
import { Input } from '@dailyuse/ui-vue-shadcn';

const { t } = useI18n();

interface AppearanceSettings {
  themeStyle?: string;
  fontSize?: string;
  accentColor?: string;
  compactMode?: boolean;
  fontFamily?: string | null;
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
      { label: `🌊 ${t('setting.appearance.themeDarkBlue')}`, value: 'darkBlue' },
      { label: `📄 ${t('setting.appearance.themeWarmPaper')}`, value: 'warmPaper' },
      { label: `💠 ${t('setting.appearance.themeLightBlue')}`, value: 'lightBlue' },
      { label: `🌿 ${t('setting.appearance.themeBlueGreen')}`, value: 'blueGreen' },
    ],
);

const fontSizeOpts = computed(() => [
  { label: t('setting.appearance.fontSmall'), value: 'SMALL' },
  { label: t('setting.appearance.fontMedium'), value: 'MEDIUM' },
  { label: t('setting.appearance.fontLarge'), value: 'LARGE' },
]);

const fontFamilyOpts = computed(() => [
  { label: t('setting.appearance.fontDefault'), value: '' },
  { label: 'Inter', value: 'Inter' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Roboto', value: 'Roboto' },
  { label: t('setting.appearance.fontMSYH'), value: 'Microsoft YaHei' },
  { label: t('setting.appearance.fontPingFang'), value: 'PingFang SC' },
]);
</script>
