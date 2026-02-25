<template>
  <Card>
    <CardHeader>
      <CardTitle>外观设置</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Theme -->
        <div class="space-y-2">
          <Label for="theme-select">主题</Label>
          <Select
            :model-value="modelValue.themeStyle"
            @update:model-value="(value: any) => emit('update:modelValue', { ...modelValue, themeStyle: value as string })"
          >
            <SelectTrigger id="theme-select">
              <SelectValue placeholder="选择主题" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in themeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p class="text-sm text-muted-foreground">选择您喜欢的主题颜色方案</p>
        </div>

        <!-- Font Size -->
        <div class="space-y-2">
          <Label for="font-size-select">字体大小</Label>
          <Select
            :model-value="modelValue.fontSize"
            @update:model-value="(value: any) => emit('update:modelValue', { ...modelValue, fontSize: value as string })"
          >
            <SelectTrigger id="font-size-select">
              <SelectValue placeholder="选择字体大小" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in fontSizeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Accent Color -->
        <div class="space-y-2">
          <Label for="accent-color">强调色</Label>
          <Input
            id="accent-color"
            type="color"
            :model-value="modelValue.accentColor"
            @update:model-value="(value: any) => emit('update:modelValue', { ...modelValue, accentColor: String(value) })"
          />
          <p class="text-sm text-muted-foreground">自定义主题的强调颜色</p>
        </div>

        <!-- Compact Mode -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <Label for="compact-mode">紧凑模式</Label>
            <Switch
              id="compact-mode"
              :checked="modelValue.compactMode"
              @update:checked="(value) => emit('update:modelValue', { ...modelValue, compactMode: value })"
            />
          </div>
          <p class="text-sm text-muted-foreground">减小组件间距，显示更多内容</p>
        </div>
      </div>

      <!-- Font Family -->
      <div class="space-y-2">
        <Label for="font-family-select">字体</Label>
        <Select
          :model-value="modelValue.fontFamily ?? undefined"
          @update:model-value="(value: any) => emit('update:modelValue', { ...modelValue, fontFamily: value as string })"
        >
          <SelectTrigger id="font-family-select">
            <SelectValue placeholder="选择字体" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in fontFamilyOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@dailyuse/ui-vue-shadcn';
import { Switch } from '@dailyuse/ui-vue-shadcn';
import { Input } from '@dailyuse/ui-vue-shadcn';

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
  themeOptions: () => [
    { label: '☀️ 标准浅色 (浅色)', value: 'light' },
    { label: '🌙 标准深色 (深色)', value: 'dark' },
    { label: '🌊 深蓝 (深色)', value: 'darkBlue' },
    { label: '📄 暖纸 (浅色)', value: 'warmPaper' },
    { label: '💠 浅蓝 (浅色)', value: 'lightBlue' },
    { label: '🌿 蓝绿 (深色)', value: 'blueGreen' },
  ],
});

const emit = defineEmits<{
  'update:modelValue': [value: AppearanceSettings];
}>();

const fontSizeOptions = [
  { label: '小', value: 'SMALL' },
  { label: '中', value: 'MEDIUM' },
  { label: '大', value: 'LARGE' },
];

const fontFamilyOptions = [
  { label: '系统默认', value: '' },
  { label: 'Inter', value: 'Inter' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Roboto', value: 'Roboto' },
  { label: '微软雅黑', value: 'Microsoft YaHei' },
  { label: '苹方', value: 'PingFang SC' },
];
</script>
