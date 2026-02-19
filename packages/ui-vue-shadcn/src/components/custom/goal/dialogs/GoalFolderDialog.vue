<template>
  <Dialog v-model:open="visible">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ isEditing ? '编辑目标节点' : '创建目标节点' }}</DialogTitle>
        <DialogDescription>请填写节点名称并选择图标。</DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <div class="space-y-2">
          <Label for="folder-name">节点名称</Label>
          <Input id="folder-name" v-model="draft.name" placeholder="请输入节点名称" @keyup.enter="handleSave" />
          <p v-if="nameError" class="text-xs text-destructive">{{ nameError }}</p>
        </div>

        <div class="space-y-2">
          <Label for="folder-icon">图标</Label>
          <Select v-model="draft.icon">
            <SelectTrigger id="folder-icon">
              <SelectValue placeholder="选择图标" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="item in iconOptions" :key="item.value" :value="item.value">
                {{ item.text }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleCancel">取消</Button>
        <Button :disabled="!isFormValid" @click="handleSave">确定</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { GoalFolderClientDTO } from '@dailyuse/contracts/goal';
import { Button } from '../../../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../ui/dialog';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';

type GoalFolderDraft = {
  id?: GoalFolderClientDTO['id'];
  name: string;
  description: string | null;
  icon: string;
  color: string | null;
  parentFolderId: GoalFolderClientDTO['parentFolderId'];
  sortOrder: number;
};

const emit = defineEmits<{
  save: [payload: GoalFolderDraft];
  cancel: [];
}>();

const iconOptions = [
  { text: '文件夹', value: 'mdi-folder' },
  { text: '目标', value: 'mdi-target' },
  { text: '学习', value: 'mdi-school' },
  { text: '工作', value: 'mdi-briefcase' },
  { text: '生活', value: 'mdi-home' },
  { text: '健康', value: 'mdi-heart' },
];

const visible = ref(false);
const editingFolder = ref<GoalFolderClientDTO | null>(null);
const draft = ref<GoalFolderDraft>({
  name: '',
  description: null,
  icon: 'mdi-folder',
  color: null,
  parentFolderId: null,
  sortOrder: 0,
});

const isEditing = computed(() => !!editingFolder.value);

const nameError = computed(() => {
  const value = draft.value.name.trim();
  if (!value) return '名称不能为空';
  if (value.length < 1) return '名称至少需要1个字符';
  if (value.length > 50) return '名称不能超过50个字符';
  return '';
});

const isFormValid = computed(() => !nameError.value);

const toDraft = (goalFolder?: GoalFolderClientDTO | null): GoalFolderDraft => {
  if (!goalFolder) {
    return {
      name: '',
      description: null,
      icon: 'mdi-folder',
      color: null,
      parentFolderId: null,
      sortOrder: 0,
    };
  }

  return {
    id: goalFolder.id,
    name: goalFolder.name,
    description: goalFolder.description,
    icon: goalFolder.icon ?? 'mdi-folder',
    color: goalFolder.color,
    parentFolderId: goalFolder.parentFolderId,
    sortOrder: goalFolder.sortOrder,
  };
};

const openDialog = (goalFolder?: GoalFolderClientDTO) => {
  editingFolder.value = goalFolder ?? null;
  draft.value = toDraft(goalFolder);
  visible.value = true;
};

const openForCreate = () => {
  openDialog();
};

const openForEdit = (goalFolder: GoalFolderClientDTO) => {
  openDialog(goalFolder);
};

const closeDialog = () => {
  visible.value = false;
};

const handleSave = () => {
  if (!isFormValid.value) return;

  emit('save', {
    ...draft.value,
    name: draft.value.name.trim(),
  });

  closeDialog();
};

const handleCancel = () => {
  emit('cancel');
  closeDialog();
};

watch(
  () => visible.value,
  (open) => {
    if (!open) {
      editingFolder.value = null;
      draft.value = toDraft(null);
    }
  },
);

defineExpose({
  openDialog,
  openForCreate,
  openForEdit,
  closeDialog,
});
</script>
