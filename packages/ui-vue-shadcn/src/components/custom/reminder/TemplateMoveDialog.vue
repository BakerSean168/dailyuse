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
              <span class="font-medium">{{ template.title }}</span>
            </div>
            <div v-if="template.groupUuid" class="flex items-center gap-2 mt-1 text-xs">
              <Folder class="h-3 w-3" />
              <span>Current group: {{ getCurrentGroupName() }}</span>
            </div>
          </AlertDescription>
        </Alert>

        <!-- Target Group Selection -->
        <div class="space-y-2">
          <Label>Target Group *</Label>
          <Select v-model="selectedGroupUuid" :disabled="moveToRoot">
            <SelectTrigger>
              <SelectValue placeholder="Select target group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="group in groupOptions"
                :key="group.uuid"
                :value="group.uuid"
                :disabled="group.uuid === template?.groupUuid"
              >
                <div class="flex items-center gap-2">
                  <component :is="getGroupIcon(group.icon)" class="h-4 w-4" />
                  <span>{{ group.name }}</span>
                  <Badge v-if="group.uuid === template?.groupUuid" variant="outline" class="ml-auto">
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
        <Card v-if="selectedGroupUuid && !moveToRoot" class="p-4">
          <h4 class="text-sm font-semibold mb-2">Target Group Info</h4>
          <div class="space-y-2 text-sm">
            <div class="flex items-center gap-2">
              <Info class="h-4 w-4 text-muted-foreground" />
              <span>Name: {{ getGroupName(selectedGroupUuid) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <Hash class="h-4 w-4 text-muted-foreground" />
              <span>Templates: {{ getGroupTemplateCount(selectedGroupUuid) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <CheckCircle2 class="h-4 w-4 text-muted-foreground" />
              <span>Status: {{ getGroupStatus(selectedGroupUuid) }}</span>
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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ReminderTemplate {
  uuid: string;
  title: string;
  groupUuid?: string;
}

interface ReminderGroup {
  uuid: string;
  name: string;
  description?: string;
  icon?: string;
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
  'moved': [templateUuid: string, targetGroupUuid: string | null];
  'closed': [];
}>();

const visible = ref(false);
const selectedGroupUuid = ref<string | null>(null);
const moveToRoot = ref(false);
const isMoving = ref(false);

const groupOptions = computed(() => {
  return props.groups.map(group => ({
    uuid: group.uuid,
    name: group.name,
    icon: group.icon || 'mdi-folder',
    enabled: group.enabled,
  }));
});

const canMove = computed(() => {
  if (!props.template) return false;
  if (moveToRoot.value) return true;
  if (!selectedGroupUuid.value) return false;
  return selectedGroupUuid.value !== props.template.groupUuid;
});

const getCurrentGroupName = (): string => {
  if (!props.template?.groupUuid) return 'None';
  const group = props.groups.find(g => g.uuid === props.template!.groupUuid);
  return group?.name || 'Unknown Group';
};

const getGroupName = (groupUuid: string): string => {
  const group = props.groups.find(g => g.uuid === groupUuid);
  return group?.name || 'Unknown';
};

const getGroupStatus = (groupUuid: string): string => {
  const group = props.groups.find(g => g.uuid === groupUuid);
  return group?.enabled ? 'Enabled' : 'Disabled';
};

const getGroupTemplateCount = (groupUuid: string): number => {
  return props.templates.filter(t => t.groupUuid === groupUuid).length;
};

const getGroupIcon = (icon?: string) => {
  return icon === 'mdi-folder-open' ? FolderOpen : Folder;
};

const handleMoveToRootChange = (value: boolean) => {
  if (value) {
    selectedGroupUuid.value = null;
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
  selectedGroupUuid.value = props.template?.groupUuid || null;
  moveToRoot.value = false;
};

const handleMove = async () => {
  if (!props.template || !canMove.value) return;

  isMoving.value = true;
  try {
    const targetGroupUuid = moveToRoot.value ? null : selectedGroupUuid.value;
    emit('moved', props.template.uuid, targetGroupUuid);
    close();
  } finally {
    isMoving.value = false;
  }
};

watch(() => props.template, (newTemplate) => {
  if (newTemplate) {
    selectedGroupUuid.value = newTemplate.groupUuid || null;
  }
}, { immediate: true });

watch(selectedGroupUuid, (newVal) => {
  if (newVal) {
    moveToRoot.value = false;
  }
});

defineExpose({
  open,
  close,
});
</script>
