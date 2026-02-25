<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-medium flex items-center">
        <FlaskConical class="h-5 w-5 mr-2" />
        实验性功能
      </h3>
    </div>

    <!-- Warning Alert -->
    <Alert variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>注意</AlertTitle>
      <AlertDescription>
        实验性功能可能不稳定，可能会在未来版本中更改或移除。
        启用这些功能意味着您愿意承担潜在的风险。
      </AlertDescription>
    </Alert>

    <!-- Enable Experimental Features -->
    <Card>
      <CardContent class="pt-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <Label class="text-base">启用实验性功能</Label>
            <p class="text-sm text-muted-foreground">允许访问正在开发中的新功能</p>
          </div>
          <Switch
            :checked="modelValue.enabled"
            :disabled="disabled"
            @update:checked="(value) => emit('update:modelValue', { ...modelValue, enabled: value, features: value ? modelValue.features : [] })"
          />
        </div>
      </CardContent>
    </Card>

    <!-- Available Features -->
    <div v-if="modelValue.enabled" class="space-y-4">
      <h4 class="text-base font-medium">可用的实验性功能</h4>

      <Alert v-if="availableFeatures.length === 0" variant="default">
        <Info class="h-4 w-4" />
        <AlertDescription>暂无可用的实验性功能</AlertDescription>
      </Alert>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          v-for="feature in availableFeatures"
          :key="feature.key"
          :class="[
            'hover:shadow-md transition-shadow',
            isFeatureEnabled(feature.key) ? 'border-primary bg-primary/5' : ''
          ]"
        >
          <CardContent class="pt-6">
            <div class="space-y-4">
              <div class="flex items-start justify-between">
                <div class="space-y-1">
                  <div class="flex items-center space-x-2">
                    <span class="text-2xl">{{ feature.icon }}</span>
                    <h3 class="text-base font-medium">{{ feature.name }}</h3>
                    <Badge v-if="feature.isNew" variant="default" class="ml-2">新</Badge>
                  </div>
                  <p class="text-sm text-muted-foreground">{{ feature.description }}</p>
                </div>
                <Switch
                  :checked="isFeatureEnabled(feature.key)"
                  :disabled="disabled"
                  @update:checked="() => toggleFeature(feature.key)"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-end space-x-2">
      <Button
        variant="default"
        :disabled="disabled || !hasChanges"
        @click="emit('save')"
      >
        保存更改
      </Button>
      <Button
        variant="outline"
        :disabled="disabled"
        @click="emit('reset')"
      >
        重置
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Card, CardContent } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';
import { Switch } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Alert, AlertTitle, AlertDescription } from '@dailyuse/ui-vue-shadcn';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { FlaskConical, AlertCircle, Info } from 'lucide-vue-next';

interface ExperimentalFeature {
  key: string;
  name: string;
  icon: string;
  description: string;
  isNew: boolean;
}

interface ExperimentalSettings {
  enabled?: boolean;
  features?: string[];
}

interface Props {
  modelValue: ExperimentalSettings;
  disabled?: boolean;
  hasChanges?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: ExperimentalSettings];
  'save': [];
  'reset': [];
}>();

const availableFeatures: ExperimentalFeature[] = [
  {
    key: 'ai-assistant',
    name: 'AI 助手',
    icon: '🤖',
    description: '基于 AI 的智能任务建议和自动化助手',
    isNew: true,
  },
  {
    key: 'voice-input',
    name: '语音输入',
    icon: '🎤',
    description: '使用语音输入创建任务和笔记',
    isNew: true,
  },
  {
    key: 'collaboration',
    name: '协作模式',
    icon: '👥',
    description: '实时协作编辑和共享工作空间',
    isNew: false,
  },
  {
    key: 'advanced-analytics',
    name: '高级分析',
    icon: '📊',
    description: '深入的生产力分析和可视化报表',
    isNew: false,
  },
];

const isFeatureEnabled = (featureKey: string): boolean => {
  return props.modelValue.features?.includes(featureKey) || false;
};

const toggleFeature = (featureKey: string) => {
  const features = props.modelValue.features || [];
  const newFeatures = features.includes(featureKey)
    ? features.filter(k => k !== featureKey)
    : [...features, featureKey];
  
  emit('update:modelValue', {
    ...props.modelValue,
    features: newFeatures,
  });
};
</script>
