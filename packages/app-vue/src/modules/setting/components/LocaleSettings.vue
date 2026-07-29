<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ t('setting.locale.title') }}</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6">
      <div class="grid grid-cols-1 gap-6 @2xl/panel:grid-cols-2">
        <!-- Language -->
        <div class="space-y-2">
          <Label for="language-select">{{ t('setting.locale.language') }}</Label>
          <Select
            :model-value="modelValue.language"
            @update:model-value="
              (value) => emit('update:modelValue', { ...modelValue, language: value })
            "
          >
            <SelectTrigger id="language-select">
              <SelectValue :placeholder="t('setting.locale.languagePlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in languageOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Timezone -->
        <div class="space-y-2">
          <Label for="timezone-select">{{ t('setting.locale.timezone') }}</Label>
          <Select
            :model-value="modelValue.timezone"
            @update:model-value="
              (value) => emit('update:modelValue', { ...modelValue, timezone: value })
            "
          >
            <SelectTrigger id="timezone-select">
              <SelectValue :placeholder="t('setting.locale.timezonePlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in timezoneOpts" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Date Format -->
        <div class="space-y-2">
          <Label for="date-format-select">{{ t('setting.locale.dateFormat') }}</Label>
          <Select
            :model-value="modelValue.dateFormat"
            @update:model-value="
              (value) => emit('update:modelValue', { ...modelValue, dateFormat: value })
            "
          >
            <SelectTrigger id="date-format-select">
              <SelectValue :placeholder="t('setting.locale.dateFormatPlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in dateFormatOpts"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Time Format -->
        <div class="space-y-2">
          <Label for="time-format-select">{{ t('setting.locale.timeFormat') }}</Label>
          <Select
            :model-value="modelValue.timeFormat"
            @update:model-value="
              (value) => emit('update:modelValue', { ...modelValue, timeFormat: value })
            "
          >
            <SelectTrigger id="time-format-select">
              <SelectValue :placeholder="t('setting.locale.timeFormatPlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in timeFormatOpts"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Week Starts On -->
        <div class="space-y-2">
          <Label for="week-start-select">{{ t('setting.locale.weekStartsOn') }}</Label>
          <Select
            :model-value="String(modelValue.weekStartsOn)"
            @update:model-value="
              (value) => emit('update:modelValue', { ...modelValue, weekStartsOn: Number(value) })
            "
          >
            <SelectTrigger id="week-start-select">
              <SelectValue :placeholder="t('setting.locale.weekStartsOnPlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in weekStartOpts"
                :key="option.value"
                :value="String(option.value)"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Currency -->
        <div class="space-y-2">
          <Label for="currency-select">{{ t('setting.locale.currency') }}</Label>
          <Select
            :model-value="modelValue.currency"
            @update:model-value="
              (value) => emit('update:modelValue', { ...modelValue, currency: value })
            "
          >
            <SelectTrigger id="currency-select">
              <SelectValue :placeholder="t('setting.locale.currencyPlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in currencyOpts" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
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

interface LocaleSettings {
  language?: string;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
  weekStartsOn?: number;
  currency?: string;
}

interface Props {
  modelValue: LocaleSettings;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: LocaleSettings];
}>();

// Language options — labels are the native language names (not translated)
const languageOptions = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
  // { label: '日本語', value: 'ja-JP' },
  // { label: '한국어', value: 'ko-KR' },
  // { label: '繁體中文', value: 'zh-TW' },
];

const timezoneOpts = computed(() => [
  { label: t('setting.locale.tzBeijing'), value: 'Asia/Shanghai' },
  { label: t('setting.locale.tzNewYork'), value: 'America/New_York' },
  // { label: t('setting.locale.tzTokyo'), value: 'Asia/Tokyo' },
  // { label: t('setting.locale.tzLondon'), value: 'Europe/London' },
  // { label: t('setting.locale.tzSydney'), value: 'Australia/Sydney' },
]);

const dateFormatOpts = computed(() => [
  { label: t('setting.locale.dateISO'), value: 'YYYY-MM-DD' },
  { label: t('setting.locale.dateDMY'), value: 'DD/MM/YYYY' },
  { label: t('setting.locale.dateMDY'), value: 'MM/DD/YYYY' },
  { label: t('setting.locale.dateChinese'), value: 'YYYY年MM月DD日' },
]);

const timeFormatOpts = computed(() => [
  { label: t('setting.locale.time24h'), value: '24H' },
  { label: t('setting.locale.time12h'), value: '12H' },
]);

const weekStartOpts = computed(() => [
  { label: t('setting.locale.weekSunday'), value: 0 },
  { label: t('setting.locale.weekMonday'), value: 1 },
  { label: t('setting.locale.weekSaturday'), value: 6 },
]);

const currencyOpts = computed(() => [
  { label: t('setting.locale.currencyCNY'), value: 'CNY' },
  { label: t('setting.locale.currencyUSD'), value: 'USD' },
  // { label: t('setting.locale.currencyEUR'), value: 'EUR' },
  // { label: t('setting.locale.currencyJPY'), value: 'JPY' },
  // { label: t('setting.locale.currencyGBP'), value: 'GBP' },
]);
</script>
