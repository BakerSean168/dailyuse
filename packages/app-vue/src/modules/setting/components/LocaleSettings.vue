<template>
  <Card>
    <CardHeader>
      <CardTitle>区域设置</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Language -->
        <div class="space-y-2">
          <Label for="language-select">语言</Label>
          <Select
            :model-value="modelValue.language"
            @update:model-value="(value) => emit('update:modelValue', { ...modelValue, language: value })"
          >
            <SelectTrigger id="language-select">
              <SelectValue placeholder="选择语言" />
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
          <Label for="timezone-select">时区</Label>
          <Select
            :model-value="modelValue.timezone"
            @update:model-value="(value) => emit('update:modelValue', { ...modelValue, timezone: value })"
          >
            <SelectTrigger id="timezone-select">
              <SelectValue placeholder="选择时区" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in timezoneOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Date Format -->
        <div class="space-y-2">
          <Label for="date-format-select">日期格式</Label>
          <Select
            :model-value="modelValue.dateFormat"
            @update:model-value="(value) => emit('update:modelValue', { ...modelValue, dateFormat: value })"
          >
            <SelectTrigger id="date-format-select">
              <SelectValue placeholder="选择日期格式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in dateFormatOptions"
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
          <Label for="time-format-select">时间格式</Label>
          <Select
            :model-value="modelValue.timeFormat"
            @update:model-value="(value) => emit('update:modelValue', { ...modelValue, timeFormat: value })"
          >
            <SelectTrigger id="time-format-select">
              <SelectValue placeholder="选择时间格式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in timeFormatOptions"
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
          <Label for="week-start-select">每周开始于</Label>
          <Select
            :model-value="String(modelValue.weekStartsOn)"
            @update:model-value="(value) => emit('update:modelValue', { ...modelValue, weekStartsOn: Number(value) })"
          >
            <SelectTrigger id="week-start-select">
              <SelectValue placeholder="选择星期" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in weekStartOptions"
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
          <Label for="currency-select">货币</Label>
          <Select
            :model-value="modelValue.currency"
            @update:model-value="(value) => emit('update:modelValue', { ...modelValue, currency: value })"
          >
            <SelectTrigger id="currency-select">
              <SelectValue placeholder="选择货币" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in currencyOptions"
                :key="option.value"
                :value="option.value"
              >
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
import { Card, CardContent, CardHeader, CardTitle } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@dailyuse/ui-vue-shadcn';

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

const languageOptions = [
  { label: '简体中文', value: 'zh-CN' },
  { label: '繁體中文', value: 'zh-TW' },
  { label: 'English', value: 'en-US' },
  { label: '日本語', value: 'ja-JP' },
  { label: '한국어', value: 'ko-KR' },
];

const timezoneOptions = [
  { label: '北京时间 (UTC+8)', value: 'Asia/Shanghai' },
  { label: '东京时间 (UTC+9)', value: 'Asia/Tokyo' },
  { label: '纽约时间 (UTC-5)', value: 'America/New_York' },
  { label: '伦敦时间 (UTC+0)', value: 'Europe/London' },
  { label: '悉尼时间 (UTC+11)', value: 'Australia/Sydney' },
];

const dateFormatOptions = [
  { label: '2025-10-31 (YYYY-MM-DD)', value: 'YYYY-MM-DD' },
  { label: '31/10/2025 (DD/MM/YYYY)', value: 'DD/MM/YYYY' },
  { label: '10/31/2025 (MM/DD/YYYY)', value: 'MM/DD/YYYY' },
  { label: '2025年10月31日', value: 'YYYY年MM月DD日' },
];

const timeFormatOptions = [
  { label: '24小时制 (23:59)', value: '24H' },
  { label: '12小时制 (11:59 PM)', value: '12H' },
];

const weekStartOptions = [
  { label: '星期日', value: 0 },
  { label: '星期一', value: 1 },
  { label: '星期六', value: 6 },
];

const currencyOptions = [
  { label: '人民币 (CNY ¥)', value: 'CNY' },
  { label: '美元 (USD $)', value: 'USD' },
  { label: '欧元 (EUR €)', value: 'EUR' },
  { label: '日元 (JPY ¥)', value: 'JPY' },
  { label: '英镑 (GBP £)', value: 'GBP' },
];
</script>
