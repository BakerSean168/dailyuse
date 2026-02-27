<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-medium flex items-center">
        <FlaskConical class="h-5 w-5 mr-2" />
        {{ t('setting.experimental.title') }}
      </h3>
    </div>

    <!-- Warning Alert -->
    <Alert variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>{{ t('setting.experimental.warning') }}</AlertTitle>
      <AlertDescription>
        {{ t('setting.experimental.warningDescription') }}
      </AlertDescription>
    </Alert>

    <!-- Enable Experimental Features -->
    <Card>
      <CardContent class="pt-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <Label class="text-base">{{ t('setting.experimental.enableExperimental') }}</Label>
            <p class="text-sm text-muted-foreground">
              {{ t('setting.experimental.enableExperimentalDescription') }}
            </p>
          </div>
          <Switch
            :checked="modelValue.enabled"
            :disabled="disabled"
            @update:checked="
              (value) =>
                emit('update:modelValue', {
                  ...modelValue,
                  enabled: value,
                  features: value ? modelValue.features : [],
                })
            "
          />
        </div>
      </CardContent>
    </Card>

    <!-- Available Features -->
    <div v-if="modelValue.enabled" class="space-y-4">
      <h4 class="text-base font-medium">{{ t('setting.experimental.availableFeatures') }}</h4>

      <Alert v-if="availableFeatures.length === 0" variant="default">
        <Info class="h-4 w-4" />
        <AlertDescription>{{ t('setting.experimental.noFeatures') }}</AlertDescription>
      </Alert>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          v-for="feature in availableFeatures"
          :key="feature.key"
          :class="[
            'hover:shadow-md transition-shadow',
            isFeatureEnabled(feature.key) ? 'border-primary bg-primary/5' : '',
          ]"
        >
          <CardContent class="pt-6">
            <div class="space-y-4">
              <div class="flex items-start justify-between">
                <div class="space-y-1">
                  <div class="flex items-center space-x-2">
                    <span class="text-2xl">{{ feature.icon }}</span>
                    <h3 class="text-base font-medium">{{ feature.name }}</h3>
                    <Badge v-if="feature.isNew" variant="default" class="ml-2">{{
                      t('setting.experimental.new')
                    }}</Badge>
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
      <Button variant="default" :disabled="disabled || !hasChanges" @click="emit('save')">
        {{ t('setting.experimental.saveChanges') }}
      </Button>
      <Button variant="outline" :disabled="disabled" @click="emit('reset')">
        {{ t('setting.experimental.reset') }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Card, CardContent } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';
import { Switch } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Alert, AlertTitle, AlertDescription } from '@dailyuse/ui-vue-shadcn';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { FlaskConical, AlertCircle, Info } from 'lucide-vue-next';

const { t } = useI18n();

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
  save: [];
  reset: [];
}>();

const availableFeatures = computed<ExperimentalFeature[]>(() => [
  {
    key: 'ai-assistant',
    name: t('setting.experimental.aiAssistant'),
    icon: '🤖',
    description: t('setting.experimental.aiAssistantDesc'),
    isNew: true,
  },
  {
    key: 'voice-input',
    name: t('setting.experimental.voiceInput'),
    icon: '🎤',
    description: t('setting.experimental.voiceInputDesc'),
    isNew: true,
  },
  {
    key: 'collaboration',
    name: t('setting.experimental.collaboration'),
    icon: '👥',
    description: t('setting.experimental.collaborationDesc'),
    isNew: false,
  },
  {
    key: 'advanced-analytics',
    name: t('setting.experimental.advancedAnalytics'),
    icon: '📊',
    description: t('setting.experimental.advancedAnalyticsDesc'),
    isNew: false,
  },
]);

const isFeatureEnabled = (featureKey: string): boolean => {
  return props.modelValue.features?.includes(featureKey) || false;
};

const toggleFeature = (featureKey: string) => {
  const features = props.modelValue.features || [];
  const newFeatures = features.includes(featureKey)
    ? features.filter((k) => k !== featureKey)
    : [...features, featureKey];

  emit('update:modelValue', {
    ...props.modelValue,
    features: newFeatures,
  });
};
</script>
