<!--
  ResourceEditor - Simple resource editor wrapper - shadcn/ui version
-->

<template>
  <Card class="flex flex-col h-full">
    <CardHeader class="border-b px-4 py-2">
      <div class="flex items-center justify-between">
        <CardTitle class="text-sm flex items-center gap-2">
          <FileText class="h-4 w-4" />
          {{ resourceName }}
        </CardTitle>
        
        <div class="flex items-center gap-2">
          <Badge v-if="isSaving" variant="secondary" class="text-xs">
            <Loader2 class="mr-1 h-3 w-3 animate-spin" />
            保存中...
          </Badge>
          <Badge v-else-if="hasUnsavedChanges" variant="secondary" class="text-xs">
            <Circle class="mr-1 h-2 w-2" />
            未保存
          </Badge>
          <Badge v-else variant="default" class="text-xs">
            <Check class="mr-1 h-3 w-3" />
            已保存
          </Badge>
          
          <Badge v-if="wordCount" variant="outline" class="text-xs">
            {{ wordCount }} 字
          </Badge>
        </div>
      </div>
    </CardHeader>

    <CardContent class="flex-1 overflow-y-auto p-4">
      <div ref="editorRef" class="min-h-[500px] max-w-4xl mx-auto"></div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { FileText, Loader2, Circle, Check } from 'lucide-vue-next';
import { Card, CardContent, CardHeader, CardTitle } from '@dailyuse/ui-vue-shadcn';
import { Badge } from '@dailyuse/ui-vue-shadcn';

interface Props {
  resourceId: string;
  resourceName?: string;
  content?: string;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  wordCount?: number;
}

withDefaults(defineProps<Props>(), {
  resourceName: '未命名资源',
  content: '',
  isSaving: false,
  hasUnsavedChanges: false,
  wordCount: 0,
});

const emit = defineEmits<{
  'save-content': [content: string];
}>();

const editorRef = ref<HTMLElement | null>(null);
</script>
