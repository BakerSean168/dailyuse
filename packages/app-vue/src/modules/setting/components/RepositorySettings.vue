<template>
  <Card>
    <CardContent class="p-0">
      <!-- Image Embed Settings -->
      <div class="p-4 space-y-4">
        <div class="flex items-center space-x-2">
          <ImageIcon class="h-5 w-5" />
          <h3 class="text-base font-medium">{{ t('setting.repository.imageEmbed') }}</h3>
        </div>

        <div class="space-y-4">
          <!-- Embed Mode -->
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <Label class="text-sm font-medium">{{ t('setting.repository.embedMode') }}</Label>
              <p class="text-sm text-muted-foreground">
                {{ t('setting.repository.embedModeDescription') }}
              </p>
            </div>
            <Select
              :model-value="modelValue.imageEmbedMode"
              @update:model-value="
                (value) => emit('update:modelValue', { ...modelValue, imageEmbedMode: value })
              "
              class="ml-4 w-[200px]"
            >
              <SelectTrigger>
                <SelectValue :placeholder="t('setting.repository.embedModePlaceholder')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in embedModeOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Auto Embed Threshold -->
          <div v-if="modelValue.imageEmbedMode === 'auto'" class="flex items-start justify-between">
            <div class="flex-1">
              <Label class="text-sm font-medium">{{
                t('setting.repository.autoEmbedThreshold')
              }}</Label>
              <p class="text-sm text-muted-foreground">
                {{ t('setting.repository.autoEmbedThresholdDescription') }}
              </p>
            </div>
            <div class="ml-4 w-[120px]">
              <Input
                type="number"
                :model-value="modelValue.autoEmbedThreshold"
                @update:model-value="
                  (value) =>
                    emit('update:modelValue', { ...modelValue, autoEmbedThreshold: Number(value) })
                "
                suffix="KB"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <!-- Image Compression Settings -->
      <div class="p-4 space-y-4">
        <div class="flex items-center space-x-2">
          <Minimize2 class="h-5 w-5" />
          <h3 class="text-base font-medium">{{ t('setting.repository.imageCompression') }}</h3>
        </div>

        <div class="space-y-4">
          <!-- Enable Compression -->
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <Label class="text-sm font-medium">{{
                t('setting.repository.enableCompression')
              }}</Label>
              <p class="text-sm text-muted-foreground">
                {{ t('setting.repository.enableCompressionDescription') }}
              </p>
            </div>
            <Switch
              :checked="modelValue.imageCompression"
              @update:checked="
                (value) => emit('update:modelValue', { ...modelValue, imageCompression: value })
              "
            />
          </div>

          <!-- Compression Quality -->
          <div v-if="modelValue.imageCompression" class="space-y-2">
            <Label class="text-sm font-medium">{{
              t('setting.repository.compressionQuality')
            }}</Label>
            <p class="text-sm text-muted-foreground">
              {{ t('setting.repository.compressionQualityDescription') }}
            </p>
            <div class="flex items-center space-x-4">
              <Slider
                :model-value="[modelValue.compressionQuality || 80]"
                :min="10"
                :max="100"
                :step="5"
                class="flex-1"
                @update:model-value="
                  (value: any) =>
                    emit('update:modelValue', {
                      ...modelValue,
                      compressionQuality: value?.[0] ?? 80,
                    })
                "
              />
              <span class="text-sm w-12 text-right">{{ modelValue.compressionQuality }}%</span>
            </div>
          </div>

          <!-- Auto Convert to WebP -->
          <div v-if="modelValue.imageCompression" class="flex items-start justify-between">
            <div class="flex-1">
              <Label class="text-sm font-medium">{{
                t('setting.repository.autoConvertWebP')
              }}</Label>
              <p class="text-sm text-muted-foreground">
                {{ t('setting.repository.autoConvertWebPDescription') }}
              </p>
            </div>
            <Switch
              :checked="modelValue.autoConvertToWebP"
              @update:checked="
                (value) => emit('update:modelValue', { ...modelValue, autoConvertToWebP: value })
              "
            />
          </div>

          <!-- Max Image Width -->
          <div v-if="modelValue.imageCompression" class="flex items-start justify-between">
            <div class="flex-1">
              <Label class="text-sm font-medium">{{ t('setting.repository.maxImageWidth') }}</Label>
              <p class="text-sm text-muted-foreground">
                {{ t('setting.repository.maxImageWidthDescription') }}
              </p>
            </div>
            <Select
              :model-value="String(modelValue.maxImageWidth)"
              @update:model-value="
                (value) =>
                  emit('update:modelValue', { ...modelValue, maxImageWidth: Number(value) })
              "
              class="ml-4 w-[200px]"
            >
              <SelectTrigger>
                <SelectValue :placeholder="t('setting.repository.maxImageWidthPlaceholder')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in maxWidthOptions"
                  :key="option.value"
                  :value="String(option.value)"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      <!-- Resource Management Settings -->
      <div class="p-4 space-y-4">
        <div class="flex items-center space-x-2">
          <Folder class="h-5 w-5" />
          <h3 class="text-base font-medium">{{ t('setting.repository.resourceManagement') }}</h3>
        </div>

        <Alert>
          <Info class="h-4 w-4" />
          <AlertDescription>
            {{ t('setting.repository.resourceStorageInfo', { dir: 'assets/' }) }}
          </AlertDescription>
        </Alert>

        <!-- Default View Mode -->
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <Label class="text-sm font-medium">{{ t('setting.repository.defaultViewMode') }}</Label>
            <p class="text-sm text-muted-foreground">
              {{ t('setting.repository.defaultViewModeDescription') }}
            </p>
          </div>
          <ToggleGroup
            type="single"
            :model-value="modelValue.defaultViewMode"
            @update:model-value="
              (value: any) =>
                emit('update:modelValue', { ...modelValue, defaultViewMode: value as string })
            "
            class="ml-4"
          >
            <ToggleGroupItem value="notes" :aria-label="t('setting.repository.notesViewLabel')">
              <FileText class="h-4 w-4 mr-1" />
              {{ t('setting.repository.notesView') }}
            </ToggleGroupItem>
            <ToggleGroupItem
              value="resources"
              :aria-label="t('setting.repository.resourcesViewLabel')"
            >
              <Images class="h-4 w-4 mr-1" />
              {{ t('setting.repository.resourcesView') }}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Card, CardContent } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@dailyuse/ui-vue-shadcn';
import { Switch } from '@dailyuse/ui-vue-shadcn';
import { Slider } from '@dailyuse/ui-vue-shadcn';
import { Input } from '@dailyuse/ui-vue-shadcn';
import { ToggleGroup, ToggleGroupItem } from '@dailyuse/ui-vue-shadcn';
import { Alert, AlertDescription } from '@dailyuse/ui-vue-shadcn';
import { Separator } from '@dailyuse/ui-vue-shadcn';
import { ImageIcon, Minimize2, Folder, FileText, Images, Info } from 'lucide-vue-next';

const { t } = useI18n();

interface RepositorySettings {
  imageEmbedMode?: string;
  autoEmbedThreshold?: number;
  imageCompression?: boolean;
  compressionQuality?: number;
  autoConvertToWebP?: boolean;
  maxImageWidth?: number;
  defaultViewMode?: string;
}

interface Props {
  modelValue: RepositorySettings;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: RepositorySettings];
}>();

const embedModeOptions = computed(() => [
  { value: 'link', label: t('setting.repository.embedModeLink') },
  { value: 'base64', label: t('setting.repository.embedModeBase64') },
  { value: 'auto', label: t('setting.repository.embedModeAuto') },
]);

const maxWidthOptions = computed(() => [
  { value: 800, label: t('setting.repository.maxWidth800') },
  { value: 1280, label: t('setting.repository.maxWidth1280') },
  { value: 1920, label: t('setting.repository.maxWidth1920') },
  { value: 2560, label: t('setting.repository.maxWidth2560') },
  { value: 0, label: t('setting.repository.maxWidthNone') },
]);
</script>
