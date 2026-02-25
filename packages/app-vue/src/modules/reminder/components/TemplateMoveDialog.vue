<template>
  <Dialog :open="visible" @update:open="handleVisibleChange">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <div class="flex items-center gap-2">
          <FolderInput class="h-5 w-5 text-primary" />
          <DialogTitle>Move Template</DialogTitle>
        </div>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Current Template Info -->
        <Alert v-if="template">
          <Info class="h-4 w-4" />
          <AlertTitle>Current Template</AlertTitle>
          <AlertDescription>
            <div class="flex items-center gap-2 mt-1">
              <Bell class="h-4 w-4" />
              <span class="font-medium">{{ template.name }}</span>
            </div>
            <div v-if="template.groupId" class="flex items-center gap-2 mt-1 text-xs">
              <Folder class="h-3 w-3" />
              <span>Current group: {{ getCurrentGroupName() }}</span>
            </div>
          </AlertDescription>
        </Alert>

        <!-- Target Group Selection -->
        <div class="space-y-2">
          <Label>Target Group *</Label>
          <Select v-model="selectedGroupId" :disabled="moveToRoot">
            <SelectTrigger>
              <SelectValue placeholder="Select target group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="group in groupOptions"
                :key="group.id"
                :value="group.id"
                :disabled="group.id === template?.groupId"
              >
                <div class="flex items-center gap-2">
                  <component :is="getGroupIcon(group.icon)" class="h-4 w-4" />
                  <span>{{ group.name }}</span>
                  <Badge v-if="group.id === template?.groupId" variant="outline" class="ml-auto">>
                    Current
                  </Badge>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Move to Root Option -->
        <div class="flex items-center space-x-2">
          <Checkbox
            id="move-to-root"
            v-model:checked="moveToRoot"
            @update:checked="handleMoveToRootChange"
          />
          <Label
            for="move-to-root"
            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Remove from all groups (move to desktop)
          </Label>
        </div>

        <!-- Warning Alert -->
        <Alert v-if="moveToRoot" variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            Template will be removed from current group and become an independent template.
          </AlertDescription>
        </Alert>

        <!-- Target Group Info -->
        <Card v-if="selectedGroupId && !moveToRoot" class="p-4">
          <h4 class="text-sm font-semibold mb-2">Target Group Info</h4>
          <div class="space-y-2 text-sm">
            <div class="flex items-center gap-2">
              <Info class="h-4 w-4 text-muted-foreground" />
              <span>Name: {{ getGroupName(selectedGroupId) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <Hash class="h-4 w-4 text-muted-foreground" />
              <span>Templates: {{ getGroupTemplateCount(selectedGroupId) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <CheckCircle2 class="h-4 w-4 text-muted-foreground" />
              <span>Status: {{ getGroupStatus(selectedGroupId) }}</span>
            </div>
          </div>
        </Card>
      </div>

      <DialogFooter class="flex-row justify-end gap-2">
        <Button variant="ghost" @click="close" :disabled="isMoving">
          Cancel
        </Button>
        <Button variant="default" @click="handleMove" :disabled="!canMove || isMoving">
          <Loader2 v-if="isMoving" class="h-4 w-4 mr-2 animate-spin" />
          Move
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  FolderInput,
  Info,
  Bell,
  Folder,
  AlertCircle,
  Hash,
  CheckCircle2,
  Loader2,
  FolderOpen,
} from 'lucide-vue-next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { Card } from '@dailyuse/ui-vue-shadcn';
import { Checkbox } from '@dailyuse/ui-vue-shadcn';
import { Alert, AlertDescription, AlertTitle } from '@dailyuse/ui-vue-shadcn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@dailyuse/ui-vue-shadcn';

interface ReminderTemplate {
  id: string;
  name: string;
  groupId?: string | null;
}

interface ReminderGroup {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  enabled: boolean;
}

interface Props {
  template?: ReminderTemplate | null;
  groups?: ReminderGroup[];
  templates?: ReminderTemplate[];
}

const props = withDefaults(defineProps<Props>(), {
  template: null,
  groups: () => [],
  templates: () => [],
});

const emit = defineEmits<{
  'moved': [templateId: string, targetGroupId: string | null];
  'closed': [];
}>();

const visible = ref(false);
const selectedGroupId = ref<string | undefined>(undefined);
const moveToRoot = ref(false);
const isMoving = ref(false);

const groupOptions = computed(() => {
  return props.groups.map(group => ({
    id: group.id,
    name: group.name,
    icon: group.icon || 'mdi-folder',
    enabled: group.enabled,
  }));
});

const canMove = computed(() => {
  if (!props.template) return false;
  if (moveToRoot.value) return true;
  if (!selectedGroupId.value) return false;
  return selectedGroupId.value !== props.template.groupId;
});

const getCurrentGroupName = (): string => {
  if (!props.template?.groupId) return 'None';
  const group = props.groups.find(g => g.id === props.template!.groupId);
  return group?.name || 'Unknown Group';
};

const getGroupName = (groupId: string): string => {
  const group = props.groups.find(g => g.id === groupId);
  return group?.name || 'Unknown';
};

const getGroupStatus = (groupId: string): string => {
  const group = props.groups.find(g => g.id === groupId);
  return group?.enabled ? 'Enabled' : 'Disabled';
};

const getGroupTemplateCount = (groupId: string): number => {
  return props.templates.filter(t => t.groupId === groupId).length;
};

const getGroupIcon = (icon?: string) => {
  return icon === 'mdi-folder-open' ? FolderOpen : Folder;
};

const handleMoveToRootChange = (value: boolean) => {
  if (value) {
    selectedGroupId.value = undefined;
  }
};

const open = () => {
  resetForm();
  visible.value = true;
};

const close = () => {
  visible.value = false;
  emit('closed');
  setTimeout(resetForm, 300);
};

const handleVisibleChange = (value: boolean) => {
  visible.value = value;
  if (!value) {
    emit('closed');
    setTimeout(resetForm, 300);
  }
};

const resetForm = () => {
  selectedGroupId.value = props.template?.groupId || undefined;
  moveToRoot.value = false;
};

const handleMove = async () => {
  if (!props.template || !canMove.value) return;

  isMoving.value = true;
  try {
    const targetGroupId = moveToRoot.value ? null : (selectedGroupId.value ?? null);
    emit('moved', props.template.id, targetGroupId);
    close();
  } finally {
    isMoving.value = false;
  }
};

watch(() => props.template, (newTemplate) => {
  if (newTemplate) {
    selectedGroupId.value = newTemplate.groupId || undefined;
  }
}, { immediate: true });

watch(selectedGroupId, (newVal) => {
  if (newVal) {
    moveToRoot.value = false;
  }
});

defineExpose({
  open,
  close,
});
</script>
