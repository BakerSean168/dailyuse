<template>
  <Dialog :open="visible" @update:open="handleVisibleChange">
    <DialogContent class="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <div class="flex items-center gap-2">
          <component :is="getTemplateIcon()" class="h-6 w-6 text-primary" />
          <DialogTitle>{{ template?.title || 'Template Details' }}</DialogTitle>
        </div>
        <div class="flex items-center gap-2 mt-2">
          <Badge :variant="template?.effectiveEnabled ? 'default' : 'secondary'">
            {{ template?.effectiveEnabled ? 'Running' : 'Paused' }}
          </Badge>
          <Badge v-if="template?.groupUuid" variant="outline">
            <Folder class="h-3 w-3 mr-1" />
            In Group
          </Badge>
        </div>
      </DialogHeader>

      <ScrollArea class="flex-1 pr-4">
        <div v-if="template" class="space-y-6 py-4">
          <!-- Basic Info -->
          <div class="space-y-3">
            <h3 class="text-sm font-semibold flex items-center gap-2">
              <Info class="h-4 w-4" />
              Basic Information
            </h3>
            <Separator />
            
            <div class="space-y-3">
              <div class="flex items-start gap-3">
                <FileText class="h-5 w-5 text-muted-foreground mt-0.5" />
                <div class="flex-1">
                  <p class="text-sm font-medium">Title</p>
                  <p class="text-sm text-muted-foreground">{{ template.title }}</p>
                </div>
              </div>

              <div v-if="template.description" class="flex items-start gap-3">
                <AlignLeft class="h-5 w-5 text-muted-foreground mt-0.5" />
                <div class="flex-1">
                  <p class="text-sm font-medium">Description</p>
                  <p class="text-sm text-muted-foreground">{{ template.description }}</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <Clock class="h-5 w-5 text-muted-foreground mt-0.5" />
                <div class="flex-1">
                  <p class="text-sm font-medium">Trigger</p>
                  <Badge variant="outline" class="mt-1">
                    {{ template.triggerText || 'Not set' }}
                  </Badge>
                </div>
              </div>

              <div v-if="template.trigger" class="flex items-start gap-3">
                <Settings class="h-5 w-5 text-muted-foreground mt-0.5" />
                <div class="flex-1">
                  <p class="text-sm font-medium">Trigger Configuration</p>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <Badge variant="secondary">Type: {{ template.trigger.type || 'unknown' }}</Badge>
                    <Badge v-if="template.trigger.interval" variant="secondary">
                      Interval: {{ template.trigger.interval.minutes }} min
                    </Badge>
                    <Badge v-if="template.trigger.fixedTime" variant="secondary">
                      Time: {{ template.trigger.fixedTime.time }}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Statistics -->
          <div class="space-y-3">
            <h3 class="text-sm font-semibold flex items-center gap-2">
              <BarChart3 class="h-4 w-4" />
              Statistics
            </h3>
            <Separator />
            
            <div class="grid grid-cols-3 gap-4">
              <Card class="p-4 text-center">
                <div class="text-2xl font-bold text-primary">{{ stats.total }}</div>
                <div class="text-xs text-muted-foreground">Total Instances</div>
              </Card>
              <Card class="p-4 text-center">
                <div class="text-2xl font-bold text-green-600">{{ stats.completed }}</div>
                <div class="text-xs text-muted-foreground">Completed</div>
              </Card>
              <Card class="p-4 text-center">
                <div class="text-2xl font-bold text-orange-600">{{ stats.pending }}</div>
                <div class="text-xs text-muted-foreground">Pending</div>
              </Card>
            </div>
          </div>

          <!-- Time Info -->
          <div class="space-y-3">
            <h3 class="text-sm font-semibold flex items-center gap-2">
              <Calendar class="h-4 w-4" />
              Time Information
            </h3>
            <Separator />
            
            <div class="space-y-3">
              <div class="flex items-start gap-3">
                <CalendarPlus class="h-5 w-5 text-muted-foreground mt-0.5" />
                <div class="flex-1">
                  <p class="text-sm font-medium">Created At</p>
                  <p class="text-sm text-muted-foreground">{{ formatDate(template.createdAt) }}</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <CalendarCheck class="h-5 w-5 text-muted-foreground mt-0.5" />
                <div class="flex-1">
                  <p class="text-sm font-medium">Updated At</p>
                  <p class="text-sm text-muted-foreground">{{ formatDate(template.updatedAt) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Status Toggle -->
          <div class="flex items-center justify-between p-4 border rounded-lg">
            <div class="flex items-center gap-3">
              <Power :class="['h-5 w-5', template.effectiveEnabled ? 'text-green-600' : 'text-gray-400']" />
              <div>
                <p class="text-sm font-medium">Template Status</p>
                <p class="text-xs text-muted-foreground">{{ template.effectiveEnabled ? 'Currently active' : 'Currently paused' }}</p>
              </div>
            </div>
            <Switch
              :checked="template.effectiveEnabled"
              :disabled="isTogglingStatus"
              @update:checked="handleToggleStatus"
            />
          </div>
        </div>
      </ScrollArea>

      <Separator />

      <DialogFooter>
        <Button variant="default" @click="handleEdit">
          <Pencil class="h-4 w-4 mr-2" />
          Edit Template
        </Button>
        <Button variant="outline" @click="handleViewInstances">
          <Eye class="h-4 w-4 mr-2" />
          View Instances
        </Button>
        <Button variant="ghost" @click="close">Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { format } from 'date-fns';
import {
  Bell,
  Info,
  FileText,
  AlignLeft,
  Clock,
  Settings,
  BarChart3,
  Calendar,
  CalendarPlus,
  CalendarCheck,
  Power,
  Pencil,
  Eye,
  Folder,
} from 'lucide-vue-next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface ReminderTemplate {
  uuid: string;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  effectiveEnabled: boolean;
  groupUuid?: string;
  triggerText?: string;
  trigger?: {
    type: string;
    interval?: { minutes: number };
    fixedTime?: { time: string };
  };
  createdAt?: number;
  updatedAt?: number;
}

interface Props {
  template?: ReminderTemplate | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'edit-template': [template: ReminderTemplate];
  'view-instances': [templateUuid: string];
  'status-changed': [template: ReminderTemplate, enabled: boolean];
}>();

const visible = ref(false);
const isTogglingStatus = ref(false);

// Mock stats - would come from API
const stats = computed(() => ({
  total: 0,
  completed: 0,
  pending: 0,
}));

const open = () => {
  visible.value = true;
};

const close = () => {
  visible.value = false;
};

const handleVisibleChange = (value: boolean) => {
  visible.value = value;
};

const handleToggleStatus = async (enabled: boolean) => {
  if (!props.template) return;
  
  isTogglingStatus.value = true;
  try {
    emit('status-changed', props.template, enabled);
  } finally {
    isTogglingStatus.value = false;
  }
};

const handleEdit = () => {
  if (props.template) {
    emit('edit-template', props.template);
    close();
  }
};

const handleViewInstances = () => {
  if (props.template) {
    emit('view-instances', props.template.uuid);
    close();
  }
};

const getTemplateIcon = () => {
  return Bell;
};

const formatDate = (timestamp: number | undefined): string => {
  if (!timestamp) return 'Unknown';
  try {
    return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');
  } catch {
    return 'Invalid date';
  }
};

defineExpose({
  open,
  close,
});
</script>
