<template>
  <Dialog :open="visible" @update:open="handleVisibleChange">
    <DialogContent class="flex max-h-[85vh] min-h-0 max-w-md flex-col overflow-hidden p-0">
      <DialogHeader class="shrink-0 px-6 pt-6 pb-4">
        <div class="flex items-center gap-2">
          <FolderInput class="h-5 w-5 text-primary" />
          <DialogTitle>{{ t('reminder.templateMove.title') }}</DialogTitle>
        </div>
        <DialogDescription class="text-sm text-muted-foreground">
          {{ t('reminder.templateMove.description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
        <div class="space-y-4 py-2">
          <!-- Current Template Info -->
          <Alert v-if="template">
            <Info class="h-4 w-4" />
            <AlertTitle>{{ t('reminder.templateMove.currentTemplate') }}</AlertTitle>
            <AlertDescription>
              <div class="flex items-center gap-2 mt-1">
                <Bell class="h-4 w-4" />
                <span class="font-medium">{{ template.name }}</span>
              </div>
              <div v-if="template.groupId" class="flex items-center gap-2 mt-1 text-xs">
                <Folder class="h-3 w-3" />
                <span
                  >{{ t('reminder.templateMove.currentGroup') }} {{ getCurrentGroupName() }}</span
                >
              </div>
            </AlertDescription>
          </Alert>

          <!-- Target Group Selection -->
          <div class="space-y-2">
            <Label>{{ t('reminder.templateMove.targetGroup') }}</Label>
            <Select v-model="selectedGroupId" :disabled="moveToRoot">
              <SelectTrigger>
                <SelectValue :placeholder="t('reminder.templateMove.selectTargetGroup')" />
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
                    <Badge v-if="group.id === template?.groupId" variant="outline" class="ml-auto"
                      >> {{ t('reminder.templateMove.current') }}
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
              {{ t('reminder.templateMove.removeFromAllGroups') }}
            </Label>
          </div>

          <!-- Warning Alert -->
          <Alert v-if="moveToRoot" variant="destructive">
            <AlertCircle class="h-4 w-4" />
            <AlertTitle>{{ t('reminder.templateMove.warning') }}</AlertTitle>
            <AlertDescription>
              {{ t('reminder.templateMove.warningDescription') }}
            </AlertDescription>
          </Alert>

          <!-- Target Group Info -->
          <Card v-if="selectedGroupId && !moveToRoot" class="p-4">
            <h4 class="text-sm font-semibold mb-2">
              {{ t('reminder.templateMove.targetGroupInfo') }}
            </h4>
            <div class="space-y-2 text-sm">
              <div class="flex items-center gap-2">
                <Info class="h-4 w-4 text-muted-foreground" />
                <span
                  >{{ t('reminder.templateMove.name') }} {{ getGroupName(selectedGroupId) }}</span
                >
              </div>
              <div class="flex items-center gap-2">
                <Hash class="h-4 w-4 text-muted-foreground" />
                <span
                  >{{ t('reminder.templateMove.templates') }}
                  {{ getGroupTemplateCount(selectedGroupId) }}</span
                >
              </div>
              <div class="flex items-center gap-2">
                <CheckCircle2 class="h-4 w-4 text-muted-foreground" />
                <span
                  >{{ t('reminder.templateMove.status') }}
                  {{ getGroupStatus(selectedGroupId) }}</span
                >
              </div>
              <div class="flex items-center gap-2">
                <Folder class="h-4 w-4 text-muted-foreground" />
                <span
                  >{{ t('reminder.templateMove.controlMode') }}
                  {{ getGroupControlMode(selectedGroupId) }}</span
                >
              </div>
              <div class="flex items-start gap-2">
                <Info class="mt-0.5 h-4 w-4 text-muted-foreground" />
                <span>{{ getGroupPolicyText(selectedGroupId) }}</span>
              </div>
            </div>
          </Card>

          <Alert v-if="previewText">
            <Info class="h-4 w-4" />
            <AlertTitle>{{ t('reminder.templateMove.previewTitle') }}</AlertTitle>
            <AlertDescription>
              {{ previewText }}
            </AlertDescription>
          </Alert>
        </div>
      </div>

      <DialogFooter class="shrink-0 flex-row justify-end gap-2 border-t p-6 pt-4">
        <Button variant="ghost" @click="close" :disabled="isMoving">
          {{ t('reminder.templateMove.cancel') }}
        </Button>
        <Button variant="default" @click="handleMove" :disabled="!canMove || isMoving">
          <Loader2 v-if="isMoving" class="h-4 w-4 mr-2 animate-spin" />
          {{ t('reminder.templateMove.move') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  ReminderGroupClientDTO,
  ReminderTemplateClientDTO,
} from '@dailyuse/contracts/reminder';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@dailyuse/ui-vue-shadcn';
import { getGroupPolicyText as getGroupPolicySummary } from '../presentation/lifecyclePresentation';
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

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    template?: ReminderTemplateClientDTO | null;
    groups?: ReminderGroupClientDTO[];
    templates?: ReminderTemplateClientDTO[];
  }>(),
  {
    template: null,
    groups: () => [],
    templates: () => [],
  },
);

const emit = defineEmits<{
  moved: [templateId: string, targetGroupId: string | null];
  closed: [];
}>();

const visible = ref(false);
const selectedGroupId = ref<string | undefined>(undefined);
const moveToRoot = ref(false);
const isMoving = ref(false);

const groupOptions = computed(() => {
  return props.groups.map((group) => ({
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
  if (!props.template?.groupId) return t('reminder.templateMove.none');
  const group = props.groups.find((g) => g.id === props.template!.groupId);
  return group?.name || t('reminder.templateMove.unknownGroup');
};

const getGroupName = (groupId: string): string => {
  const group = props.groups.find((g) => g.id === groupId);
  return group?.name || t('reminder.templateMove.unknown');
};

const getGroupStatus = (groupId: string): string => {
  const group = props.groups.find((g) => g.id === groupId);
  return group?.enabled ? t('reminder.templateMove.enabled') : t('reminder.templateMove.disabled');
};

const getGroupTemplateCount = (groupId: string): number => {
  return props.templates.filter((t) => t.groupId === groupId).length;
};

const getGroupControlMode = (groupId: string): string => {
  const group = props.groups.find((g) => g.id === groupId);
  if (!group) return t('reminder.templateMove.unknown');
  return group.controlMode === 'Group'
    ? t('reminder.templateMove.controlModeGroup')
    : t('reminder.templateMove.controlModeIndividual');
};

const getGroupPolicyText = (groupId: string): string => {
  const group = props.groups.find((g) => g.id === groupId);
  return group ? getGroupPolicySummary(t, group) : t('reminder.templateMove.defaultPolicyText');
};

const getGroupIcon = (icon?: string) => {
  return icon === 'mdi-folder-open' ? FolderOpen : Folder;
};

const previewText = computed(() => {
  if (!props.template) return '';
  if (moveToRoot.value) {
    return t('reminder.templateMove.previewRoot');
  }
  if (!selectedGroupId.value) return '';

  const group = props.groups.find((item) => item.id === selectedGroupId.value);
  if (!group) return '';

  if (group.controlMode === 'Group') {
    return group.enabled
      ? t('reminder.templateMove.previewGroupEnabled')
      : t('reminder.templateMove.previewGroupPaused');
  }

  return t('reminder.templateMove.previewIndividual');
});

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

watch(
  () => props.template,
  (newTemplate) => {
    if (newTemplate) {
      selectedGroupId.value = newTemplate.groupId || undefined;
    }
  },
  { immediate: true },
);

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
